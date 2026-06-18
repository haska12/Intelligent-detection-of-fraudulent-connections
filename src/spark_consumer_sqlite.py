"""
spark_consumer_sqlite.py
────────────────────────
PySpark Structured Streaming → Kafka → Predictions → SQLite with two tables:
  - events : all rows (normal + attacks)
  - alerts : only attack rows (is_attack = 1)

Key fixes vs original:
  1. failOnDataLoss=false  → no crash when Kafka topic is reset/recreated
  2. Stale checkpoint auto-cleared on every fresh start
  3. kafka.group.id removed from Kafka source options (Spark warning suppressed)
  4. startingOffsets="earliest" used on fresh start to avoid missing data
  5. wait_for_kafka_topic() blocks until the producer has created the topic,
     preventing the UnknownTopicOrPartitionException on startup
"""

import os
import sys
import shutil
import sqlite3
import time
import logging
from datetime import datetime, timezone

# ── Windows Hadoop env (adjust path if needed) ──────────────────────────────
from config import HADOOP_bin_path, HADOOP_HOME_path, PROJECT_ROOT

os.environ['HADOOP_HOME'] = HADOOP_HOME_path
os.environ['PATH'] += os.pathsep + HADOOP_bin_path

os.environ.setdefault("PYSPARK_PYTHON",        sys.executable)
os.environ.setdefault("PYSPARK_DRIVER_PYTHON", sys.executable)

from pyspark.sql import SparkSession
from pyspark.sql import functions as F
from pyspark.sql.types import StructType, StructField, StringType
from pyspark.ml import PipelineModel
from kafka import KafkaAdminClient
from kafka.errors import NoBrokersAvailable

from config import (
    KAFKA_BOOTSTRAP, TOPIC_RAW,
    MODEL_PATH, TARGET_RAW, CAT_COLS,
    SPARK_TRIGGER_SECS, SPARK_MAX_OFFSETS, ATTACK_LABELS,
    ALERTS_DB, HDFS_BASE_URI,
    HIVE_HOST, HIVE_PORT, HIVE_DATABASE, HIVE_TABLE,  # kept for reference, not used
)

logging.basicConfig(level=logging.INFO,
                    format="%(asctime)s [SPARK] %(message)s", datefmt="%H:%M:%S")
log = logging.getLogger(__name__)

# ── Checkpoint paths ─────────────────────────────────────────────────────────
CHECKPOINT_DIR = str(PROJECT_ROOT / "spark-tmp" / "checkpoint-main")
SQLITE_CHECKPOINT = str(PROJECT_ROOT / "spark-tmp" / "checkpoint-sqlite")

# HDFS Medallion paths. The stream writes continuously to Silver and Gold.
MEDALLION_ENABLED = os.getenv("MEDALLION_ENABLED", "1").lower() not in ("0", "false", "no")
MEDALLION_BASE = os.getenv("MEDALLION_BASE", f"{HDFS_BASE_URI}/datalake")
SILVER_EVENTS_PATH = f"{MEDALLION_BASE}/silver/unsw/normalized/events_stream"
GOLD_ALERTS_PATH = f"{MEDALLION_BASE}/gold/ids/alerts/alerts_stream"
GOLD_KPI_PATH = f"{MEDALLION_BASE}/gold/ids/kpi/kpi_stream"
GOLD_CATEGORY_PATH = f"{MEDALLION_BASE}/gold/ids/kpi/attacks_by_category_stream"
GOLD_PROTOCOL_PATH = f"{MEDALLION_BASE}/gold/ids/kpi/attacks_by_protocol_stream"
GOLD_SEVERITY_PATH = f"{MEDALLION_BASE}/gold/ids/kpi/attacks_by_severity_stream"

# ── Numeric columns ──────────────────────────────────────────────────────────
NUMERIC_COLS = [
    "dur","sbytes","dbytes","sttl","dttl","sloss","dloss",
    "sload","dload","spkts","dpkts","swin","dwin","stcpb","dtcpb",
    "smean","dmean","trans_depth","response_body_len",
    "sjit","djit","sinpkt","dinpkt","tcprtt","synack","ackdat",
    "is_sm_ips_ports","ct_state_ttl","ct_flw_http_mthd","is_ftp_login",
    "ct_ftp_cmd","ct_srv_src","ct_srv_dst","ct_dst_ltm","ct_src_ltm",
    "ct_src_dport_ltm","ct_dst_sport_ltm","ct_dst_src_ltm",
]


# ════════════════════════════════════════════════════════════════════════════
#  KAFKA TOPIC GUARD
#  Blocks until the producer has created the topic (avoids
#  UnknownTopicOrPartitionException when the consumer starts before producer).
# ════════════════════════════════════════════════════════════════════════════
def wait_for_kafka_topic(topic: str, bootstrap: str, timeout: int = 180):
    """
    Poll the Kafka broker every 5 s until `topic` exists or `timeout` is reached.
    Raises TimeoutError if the topic never appears.
    """
    log.info("Waiting for Kafka topic '%s' on broker %s …", topic, bootstrap)
    deadline = time.time() + timeout
    attempt  = 0
    while time.time() < deadline:
        attempt += 1
        try:
            admin  = KafkaAdminClient(bootstrap_servers=bootstrap,
                                      request_timeout_ms=5000)
            topics = admin.list_topics()
            admin.close()
            if topic in topics:
                log.info(" Topic '%s' found (attempt %d). Proceeding.", topic, attempt)
                return
            log.info("Topic '%s' not yet available (attempt %d) – retrying in 5 s …",
                     topic, attempt)
        except NoBrokersAvailable:
            log.warning("Broker not reachable yet (attempt %d) – retrying in 5 s …", attempt)
        except Exception as exc:
            log.warning("Topic check error (attempt %d): %s – retrying in 5 s …", attempt, exc)
        time.sleep(5)

    raise TimeoutError(
        f"Kafka topic '{topic}' did not appear within {timeout} s. "
        "Make sure the Kafka producer is running BEFORE the consumer."
    )


# ════════════════════════════════════════════════════════════════════════════
#  SQLITE  (two tables: events + alerts)
# ════════════════════════════════════════════════════════════════════════════
_CREATE_TABLE_SQL = """
    CREATE TABLE IF NOT EXISTS {table} (
        id            INTEGER PRIMARY KEY AUTOINCREMENT,
        ts            TEXT,
        proto         TEXT,
        service       TEXT,
        state         TEXT,
        attack_cat    TEXT,
        predicted_cat TEXT,
        is_attack     INTEGER,
        severity      INTEGER,
        dur           REAL,
        sbytes        INTEGER,
        dbytes        INTEGER,
        sload         REAL,
        dload         REAL,
        spkts         INTEGER,
        dpkts         INTEGER,
        ct_state_ttl  INTEGER,
        raw_label     TEXT,
        stream_ts     TEXT
    )
"""

_INSERT_SQL = """
    INSERT INTO {table} (
        ts, proto, service, state, attack_cat, predicted_cat,
        is_attack, severity, dur, sbytes, dbytes, sload, dload,
        spkts, dpkts, ct_state_ttl, raw_label, stream_ts
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
"""


def init_sqlite():
    conn = sqlite3.connect(ALERTS_DB)
    conn.execute(_CREATE_TABLE_SQL.format(table="events"))  # ALL traffic
    conn.execute(_CREATE_TABLE_SQL.format(table="alerts"))  # attacks only
    conn.commit()
    conn.close()
    log.info("✅ SQLite tables 'events' and 'alerts' ready at %s", ALERTS_DB)


def write_batch_to_sqlite(batch_df, epoch_id, label_index_map):
    if batch_df.rdd.isEmpty():
        return

    pdf  = batch_df.toPandas()
    now  = datetime.now(timezone.utc).isoformat()
    rows = _build_rows(pdf, label_index_map, now)

    log.info("Epoch %d – inserting %d rows → SQLite (events + alerts)",
             epoch_id, len(rows))

    conn = sqlite3.connect(ALERTS_DB)
    try:
        # All rows → events
        conn.executemany(_INSERT_SQL.format(table="events"), rows)

        # Attack rows only → alerts   (r[6] == is_attack)
        attack_rows = [r for r in rows if r[6] == 1]
        if attack_rows:
            conn.executemany(_INSERT_SQL.format(table="alerts"), attack_rows)

        conn.commit()
    except Exception as exc:
        conn.rollback()
        log.error("SQLite write failed in epoch %d: %s", epoch_id, exc)
    finally:
        conn.close()


def _write_csv(df, path: str):
    """Append one compact CSV folder per Spark micro-batch into HDFS."""
    (df.coalesce(1)
       .write
       .mode("append")
       .option("header", "true")
       .csv(path))


def write_batch_to_medallion(batch_df, epoch_id):
    if not MEDALLION_ENABLED or batch_df.rdd.isEmpty():
        return

    processed_at = datetime.now(timezone.utc).isoformat()
    batch = (batch_df
             .withColumn("batch_id", F.lit(int(epoch_id)))
             .withColumn("processed_at", F.lit(processed_at)))

    silver_cols = [
        "batch_id", "processed_at", "_stream_ts", "proto", "service", "state",
        TARGET_RAW, "predicted_cat", "is_attack", "severity",
        "dur", "sbytes", "dbytes", "sload", "dload",
        "spkts", "dpkts", "ct_state_ttl",
    ]
    silver = batch.select(*[c for c in silver_cols if c in batch.columns])

    alerts = silver.filter(F.col("is_attack") == 1)

    kpi = batch.agg(
        F.count("*").alias("total_events"),
        F.sum("is_attack").alias("threats_detected"),
        F.round(F.sum("is_attack") * F.lit(100.0) / F.count("*"), 2).alias("attack_rate"),
        F.round(F.avg(F.when(F.col("is_attack") == 1, F.col("severity"))), 2).alias("avg_severity"),
        F.round(F.avg("dur"), 4).alias("avg_duration"),
    ).withColumn("batch_id", F.lit(int(epoch_id))).withColumn("processed_at", F.lit(processed_at))

    by_category = (batch.filter(F.col("is_attack") == 1)
                   .groupBy("predicted_cat")
                   .agg(
                       F.count("*").alias("event_count"),
                       F.round(F.avg("severity"), 2).alias("avg_severity"),
                       F.sum(F.col("sbytes") + F.col("dbytes")).alias("total_bytes"),
                   )
                   .withColumnRenamed("predicted_cat", "attack_category")
                   .withColumn("batch_id", F.lit(int(epoch_id)))
                   .withColumn("processed_at", F.lit(processed_at)))

    by_protocol = (batch.groupBy("proto")
                   .agg(
                       F.count("*").alias("total_flows"),
                       F.sum("is_attack").alias("attack_flows"),
                       F.sum(F.col("sbytes") + F.col("dbytes")).alias("total_bytes"),
                       F.round(F.avg("dur"), 4).alias("avg_duration"),
                   )
                   .withColumnRenamed("proto", "protocol")
                   .withColumn("batch_id", F.lit(int(epoch_id)))
                   .withColumn("processed_at", F.lit(processed_at)))

    by_severity = (batch.groupBy("severity")
                   .agg(
                       F.count("*").alias("event_count"),
                       F.sum("is_attack").alias("attack_count"),
                   )
                   .withColumn("batch_id", F.lit(int(epoch_id)))
                   .withColumn("processed_at", F.lit(processed_at)))

    try:
        _write_csv(silver, SILVER_EVENTS_PATH)
        if not alerts.rdd.isEmpty():
            _write_csv(alerts, GOLD_ALERTS_PATH)
        _write_csv(kpi, GOLD_KPI_PATH)
        _write_csv(by_category, GOLD_CATEGORY_PATH)
        _write_csv(by_protocol, GOLD_PROTOCOL_PATH)
        _write_csv(by_severity, GOLD_SEVERITY_PATH)
        log.info("Epoch %d - Medallion HDFS write complete (Silver + Gold)", epoch_id)
    except Exception as exc:
        log.error("Medallion HDFS write failed in epoch %d: %s", epoch_id, exc)


def write_batch_outputs(batch_df, epoch_id, label_index_map):
    write_batch_to_sqlite(batch_df, epoch_id, label_index_map)
    write_batch_to_medallion(batch_df, epoch_id)


# ════════════════════════════════════════════════════════════════════════════
#  SHARED ROW BUILDER
# ════════════════════════════════════════════════════════════════════════════
def _sf(v):
    try:    return float(v)
    except: return None


def _si(v):
    try:    return int(float(v))
    except: return None


def _build_rows(pdf, label_index_map, now):
    rows = []
    for _, row in pdf.iterrows():
        idx      = int(row.get("prediction", 0))
        pred_cat = label_index_map.get(idx, "Unknown")
        rows.append((
            now,
            str(row.get("proto",    "-")),
            str(row.get("service",  "-")),
            str(row.get("state",    "-")),
            str(row.get(TARGET_RAW, "-")),
            pred_cat,
            1 if pred_cat not in ("Normal", "Unknown") else 0,
            ATTACK_LABELS.get(pred_cat, {}).get("severity", 0),
            _sf(row.get("dur")),
            _si(row.get("sbytes")),
            _si(row.get("dbytes")),
            _sf(row.get("sload")),
            _sf(row.get("dload")),
            _si(row.get("spkts")),
            _si(row.get("dpkts")),
            _si(row.get("ct_state_ttl")),
            str(row.get("label",      "")),
            str(row.get("_stream_ts", "")),
        ))
    return rows


# ════════════════════════════════════════════════════════════════════════════
#  SPARK
# ════════════════════════════════════════════════════════════════════════════
def _clear_dir(path: str, label: str):
    if os.path.exists(path):
        shutil.rmtree(path, ignore_errors=True)
        log.info("🗑️  Cleared %s at %s", label, path)


def build_spark():
    tmp = str(PROJECT_ROOT / "spark-tmp").replace("\\", "/")
    os.makedirs(tmp, exist_ok=True)

    jars_dir = str(PROJECT_ROOT / "jars").replace("\\", "/")
    jars = [
        f"file:///{jars_dir}/snappy-java-1.1.10.5.jar",
        f"file:///{jars_dir}/slf4j-api-2.0.7.jar",
        f"file:///{jars_dir}/spark-sql-kafka-0-10_2.12-3.5.3.jar",
        f"file:///{jars_dir}/spark-token-provider-kafka-0-10_2.12-3.5.3.jar",
        f"file:///{jars_dir}/kafka-clients-3.4.1.jar",
        f"file:///{jars_dir}/commons-pool2-2.11.1.jar",
    ]

    return (SparkSession.builder
        .master("local[2]")
        .appName("UNSW_NB15_StreamInference_SQLite")
        .config("spark.hadoop.dfs.client.use.datanode.hostname", "true")
        .config("spark.jars",                               ",".join(jars))
        .config("spark.driver.host",                        "127.0.0.1")
        .config("spark.driver.bindAddress",                 "127.0.0.1")
        .config("spark.blockManager.port",                  "0")
        .config("spark.driver.port",                        "0")
        .config("spark.driver.memory",                      "2g")
        .config("spark.executor.memory",                    "1g")
        .config("spark.sql.shuffle.partitions",             "2")
        .config("spark.memory.offHeap.enabled",             "false")
        .config("spark.streaming.kafka.maxRatePerPartition","100")
        .config("spark.python.worker.timeout",              "600")
        .config("spark.network.timeout",                    "600s")
        .config("spark.local.dir",                          tmp)
        .getOrCreate())


def build_schema():
    return StructType(
        [StructField(c, StringType(), True) for c in CAT_COLS]
        + [StructField(c, StringType(), True) for c in NUMERIC_COLS]
        + [StructField(TARGET_RAW,   StringType(), True)]
        + [StructField("label",      StringType(), True)]
        + [StructField("_stream_ts", StringType(), True)]
        + [StructField("_row_idx",   StringType(), True)]
    )


# ════════════════════════════════════════════════════════════════════════════
#  MAIN
# ════════════════════════════════════════════════════════════════════════════
def main():
    # 1. Clear stale checkpoints so Spark always starts fresh
    _clear_dir(CHECKPOINT_DIR,    "main checkpoint")
    _clear_dir(SQLITE_CHECKPOINT, "sqlite checkpoint")

    # 2. Initialise SQLite tables
    init_sqlite()

    # 3. Block until the Kafka topic exists  ← NEW: fixes UnknownTopicOrPartitionException
    wait_for_kafka_topic(TOPIC_RAW, KAFKA_BOOTSTRAP, timeout=180)

    # 4. Build Spark session and load model
    spark = build_spark()
    spark.sparkContext.setLogLevel("WARN")
    log.info("Spark %s ready | sink = SQLite (events + alerts)", spark.version)

    model           = PipelineModel.load(MODEL_PATH)
    label_index_map = {i: lbl for i, lbl in enumerate(model.stages[8].labels)}
    log.info("Label map: %s", label_index_map)

    pred_map_expr = F.create_map(
        *[x for item in label_index_map.items() for x in (F.lit(int(item[0])), F.lit(item[1]))]
    )
    severity_map_expr = F.create_map(
        *[x for item in ATTACK_LABELS.items() for x in (F.lit(item[0]), F.lit(int(item[1].get("severity", 0))))]
    )

    # 5. Kafka source
    raw = (spark.readStream.format("kafka")
           .option("kafka.bootstrap.servers", KAFKA_BOOTSTRAP)
           .option("subscribe",               TOPIC_RAW)
           .option("startingOffsets",         "earliest")
           .option("maxOffsetsPerTrigger",    str(SPARK_MAX_OFFSETS))
           .option("failOnDataLoss",          "false")
           .load())

    # 6. Parse JSON payload
    parsed = (raw
              .select(F.from_json(F.col("value").cast("string"),
                                  build_schema()).alias("d"),
                      F.col("timestamp").alias("kafka_ts"))
              .select("d.*", "kafka_ts"))

    # 7. Cast + fill nulls
    casted = parsed
    for c in NUMERIC_COLS:
        casted = casted.withColumn(c, F.col(c).cast("double"))
    casted = casted.fillna(0.0, subset=NUMERIC_COLS)
    for c in CAT_COLS + [TARGET_RAW]:
        casted = casted.fillna("-", subset=[c])

    # Drop binary label column – model does not need it
    if "label" in casted.columns:
        casted = casted.drop("label")

    # 8. ML inference
    predictions = (model.transform(casted)
                   .withColumn("prediction_idx", F.col("prediction").cast("int"))
                   .withColumn("predicted_cat", pred_map_expr[F.col("prediction_idx")])
                   .withColumn(
                       "is_attack",
                       F.when(F.col("predicted_cat").isin("Normal", "Unknown"), F.lit(0)).otherwise(F.lit(1))
                   )
                   .withColumn("severity", severity_map_expr[F.col("predicted_cat")].cast("int")))
    keep = (
        CAT_COLS
        + [TARGET_RAW, "_stream_ts"]
        + ["dur", "sbytes", "dbytes", "sload", "dload",
           "spkts", "dpkts", "ct_state_ttl"]
        + ["prediction", "predicted_cat", "is_attack", "severity"]
    )
    output = predictions.select(*[c for c in keep if c in predictions.columns])

    # 9. Write stream → SQLite (events = all rows, alerts = attacks only)
    query = (output.writeStream
             .trigger(processingTime=f"{SPARK_TRIGGER_SECS} seconds")
             .foreachBatch(
                 lambda df, eid: write_batch_outputs(df, eid, label_index_map)
             )
             .option("checkpointLocation", SQLITE_CHECKPOINT)
             .start())

    log.info("Streaming query running | sink = SQLite | Awaiting termination…")
    query.awaitTermination()


if __name__ == "__main__":
    main()

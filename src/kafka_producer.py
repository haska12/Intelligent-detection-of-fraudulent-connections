"""
kafka_producer.py
─────────────────
Reads UNSW-NB15_1.csv (headerless) from HDFS, obtains column names from
NUSW-NB15_features.csv (also on HDFS), normalizes columns, and streams
each row as JSON to Kafka topic `unsw-nb15-raw`.
"""
import argparse
import json
import os
import sys
import time
import logging
from datetime import datetime, timezone
from typing import Optional

import pandas as pd
from kafka import KafkaProducer
from kafka.errors import NoBrokersAvailable

os.environ.setdefault("PYSPARK_PYTHON", sys.executable)
os.environ.setdefault("PYSPARK_DRIVER_PYTHON", sys.executable)
if os.environ.get("SPARK_HOME") and not os.path.exists(
    os.path.join(os.environ["SPARK_HOME"], "jars")
):
    os.environ.pop("SPARK_HOME", None)

from pyspark.sql import SparkSession

from config import (
    KAFKA_BOOTSTRAP, TOPIC_RAW, PRODUCER_DELAY_SEC,
    HDFS_RAW_CSV, HDFS_FEATURES_CSV,
    HADOOP_bin_path, HADOOP_HOME_path,
)
from normalize import normalize_unsw_raw   # pandas version for final step

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [PRODUCER] %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger(__name__)


def build_producer(retries: int = 5) -> KafkaProducer:
    for attempt in range(1, retries + 1):
        try:
            producer = KafkaProducer(
                bootstrap_servers=KAFKA_BOOTSTRAP,
                value_serializer=lambda v: json.dumps(v, default=str).encode(),
                acks="all",
                retries=3,
                linger_ms=10,
            )
            log.info("Connected to Kafka broker at %s", KAFKA_BOOTSTRAP)
            return producer
        except NoBrokersAvailable:
            log.warning("Broker not ready – attempt %d/%d. Retrying in 5s…", attempt, retries)
            time.sleep(5)
    log.error("Could not connect to Kafka after %d attempts. Exiting.", retries)
    sys.exit(1)


def read_csv_from_hdfs(hdfs_raw_path: str, hdfs_features_path: Optional[str] = None) -> pd.DataFrame:
    """
    Read CSV from HDFS using Spark.
    - If the CSV already has a header (e.g. training-set), reads it directly.
    - If headerless (e.g. UNSW-NB15_1.csv), assigns names from features CSV.
    Then applies normalization and returns a pandas DataFrame ready for streaming.
    """
    os.environ['HADOOP_HOME'] = HADOOP_HOME_path
    os.environ['PATH'] += os.pathsep + HADOOP_bin_path

    spark = SparkSession.builder \
        .appName("KafkaProducerHDFS") \
        .config("spark.hadoop.dfs.client.use.datanode.hostname", "true") \
        .config("spark.driver.host", "localhost") \
        .config("spark.driver.bindAddress", "127.0.0.1") \
        .config("spark.driver.memory", "4g") \
        .config("spark.sql.shuffle.partitions", "4") \
        .getOrCreate()

    # ── Try reading WITH header first ────────────────────────────────────
    log.info("Reading CSV from HDFS (header=True attempt): %s", hdfs_raw_path)
    df_with_header = spark.read.csv(hdfs_raw_path, header=True, inferSchema=True)
    actual_cols = df_with_header.columns

    # Heuristic: if first column looks like a real network field, the file has a header
    header_like_cols = {"srcip", "proto", "dur", "sbytes", "attack_cat",
                        "Label", "label", "id"}
    has_header = bool(header_like_cols.intersection(set(actual_cols)))

    if has_header:
        log.info("CSV has its own header (%d cols) – using it directly.", len(actual_cols))
        df_raw = df_with_header.repartition(18)
    else:
        # Headerless file – need feature names from features CSV
        if not hdfs_features_path:
            raise ValueError("CSV appears headerless but no features CSV path was provided.")
        log.info("CSV is headerless – reading column names from: %s", hdfs_features_path)
        features_df = spark.read.csv(hdfs_features_path, header=True, inferSchema=True)
        col_names = [row.Name for row in features_df.select("Name").collect()]
        log.info("Obtained %d column names from features file", len(col_names))
        df_raw = (spark.read.csv(hdfs_raw_path, header=False, inferSchema=True)
                       .toDF(*col_names)
                       .repartition(18))

    pdf = df_raw.toPandas()
    spark.stop()

    df_norm = normalize_unsw_raw(pdf)
    log.info("Normalized shape: %s  columns: %d", df_norm.shape, len(df_norm.columns))
    return df_norm


def stream(
    hdfs_raw_path: str,
    hdfs_features_path: Optional[str] = None,
    delay: float = PRODUCER_DELAY_SEC,
    loop: bool = False,
) -> None:
    """Load CSV from HDFS, then stream rows to Kafka indefinitely."""
    df = read_csv_from_hdfs(hdfs_raw_path, hdfs_features_path)
    producer = build_producer()

    sent = 0
    round_num = 0
    try:
        while True:
            round_num += 1
            log.info("── Round %d: streaming %d rows ──", round_num, len(df))

            for idx, row in df.iterrows():
                record = row.to_dict()
                record["_stream_ts"] = datetime.now(timezone.utc).isoformat()
                record["_row_idx"] = int(idx)
                record["_round"] = round_num

                producer.send(TOPIC_RAW, value=record)
                sent += 1
                if sent % 500 == 0:
                    attack_val = record.get("attack_cat")
                    if attack_val is None or attack_val == "":
                        attack_val = "Normal"
                    log.info("Sent %d events  (proto=%s  attack_cat=%s)",
                        sent, record.get("proto", "?"), attack_val)
                """if sent % 500 == 0:
                    log.info("Sent %d events  (proto=%s  attack_cat=%s)",
                             sent, record.get("proto", "?"), record.get("attack_cat", "?"))"""

                time.sleep(delay)

            producer.flush()
            log.info("Round %d complete – total sent: %d", round_num, sent)

            if not loop:
                break

    except KeyboardInterrupt:
        log.info("Interrupted – flushing remaining messages…")
        producer.flush()
    finally:
        producer.close()
        log.info("Producer closed. Total events sent: %d", sent)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="UNSW-NB15 Kafka Producer (HDFS, headerless CSV)")
    parser.add_argument("--hdfs-path", default=HDFS_RAW_CSV,
                        help=f"HDFS path to headerless CSV (default: {HDFS_RAW_CSV})")
    parser.add_argument("--features", default=HDFS_FEATURES_CSV,
                        help="HDFS path to features CSV (required for column names)")
    parser.add_argument("--delay", type=float, default=PRODUCER_DELAY_SEC,
                        help=f"Seconds between messages (default {PRODUCER_DELAY_SEC})")
    parser.add_argument("--loop", action="store_true", help="Loop CSV indefinitely")
    args = parser.parse_args()

    stream(args.hdfs_path, args.features, delay=args.delay, loop=args.loop)

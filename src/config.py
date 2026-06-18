"""Single source of truth for project paths, topics, and column constants."""
import os
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
MODEL_PATH_V1 = PROJECT_ROOT / "unsw_nb15_final_pipeline"
MODEL_PATH_V2 = PROJECT_ROOT / "unsw_nb15_final_pipeline_v2"
DEFAULT_MODEL_PATH = MODEL_PATH_V2 if MODEL_PATH_V2.exists() else MODEL_PATH_V1

# Kafka
KAFKA_BOOTSTRAP = os.getenv("KAFKA_BOOTSTRAP", "localhost:9092")
TOPIC_RAW = "unsw-nb15-raw"
TOPIC_PREDICTIONS = "unsw-nb15-alerts"
KAFKA_GROUP_ID = "unsw-spark-consumer"

# HDFS paths for host-side scripts. Docker maps NameNode port 9000 to host 9005.
HDFS_NAMENODE = os.getenv("HDFS_NAMENODE", "localhost")
HDFS_PORT = os.getenv("HDFS_PORT", "9005")
HDFS_BASE_URI = f"hdfs://{HDFS_NAMENODE}:{HDFS_PORT}"
HDFS_RAW_CSV = os.getenv("HDFS_RAW_CSV", f"{HDFS_BASE_URI}/data/unsw/UNSW-NB15_1.csv")
HDFS_FEATURES_CSV = os.getenv(
    "HDFS_FEATURES_CSV",
    f"{HDFS_BASE_URI}/data/unsw/NUSW-NB15_features.csv",
)
HDFS_TRAIN_CSV = os.getenv(
    "HDFS_TRAIN_CSV",
    f"{HDFS_BASE_URI}/data/unsw/UNSW_NB15_training-set.csv",
)
HDFS_TEST_CSV = os.getenv(
    "HDFS_TEST_CSV",
    f"{HDFS_BASE_URI}/data/unsw/UNSW_NB15_testing-set.csv",
)

# Saved PySpark PipelineModel.
# By default, reuse the newest notebook output folder when it exists. Override
# with MODEL_PATH if you intentionally want another trained model.
MODEL_PATH = os.getenv("MODEL_PATH", str(DEFAULT_MODEL_PATH).replace("\\", "/"))

# Hive settings. Kept for optional future Hive sink work.
HIVE_HOST = os.getenv("HIVE_HOST", "localhost")
HIVE_PORT = int(os.getenv("HIVE_PORT", "10000"))
HIVE_DATABASE = os.getenv("HIVE_DATABASE", "ids_db")
HIVE_TABLE = os.getenv("HIVE_TABLE", "alerts")
HIVE_METASTORE_URI = os.getenv("HIVE_METASTORE_URI", "thrift://localhost:9083")

# SQLite database used by the current API and Spark consumer.
ALERTS_DB = os.getenv("ALERTS_DB", str(Path(__file__).resolve().parent / "alerts.db"))

# Column constants. These must match the saved Spark pipeline.
TARGET_RAW = "attack_cat"
LABEL_COL = "label"
FEATURE_COL = "scaledFeatures"
BINARY_LABEL = "label"
CAT_COLS = ["proto", "service", "state"]

# Raw CSV column names for headerless UNSW-NB15 files.
RAW_COLUMNS = [
    "srcip", "sport", "dstip", "dsport", "proto", "state", "dur",
    "sbytes", "dbytes", "sttl", "dttl", "sloss", "dloss", "service",
    "Sload", "Dload", "Spkts", "Dpkts", "swin", "dwin", "stcpb", "dtcpb",
    "smeansz", "dmeansz", "trans_depth", "res_bdy_len", "Sjit", "Djit",
    "Stime", "Ltime", "Sintpkt", "Dintpkt", "tcprtt", "synack", "ackdat",
    "is_sm_ips_ports", "ct_state_ttl", "ct_flw_http_mthd", "is_ftp_login",
    "ct_ftp_cmd", "ct_srv_src", "ct_srv_dst", "ct_dst_ltm", "ct_src_ ltm",
    "ct_src_dport_ltm", "ct_dst_sport_ltm", "ct_dst_src_ltm",
    "attack_cat", "Label",
]

# Attack categories and their colors/severity.
ATTACK_LABELS = {
    "Normal": {"color": "#22c55e", "severity": 0},
    "Fuzzers": {"color": "#f59e0b", "severity": 2},
    "Analysis": {"color": "#f97316", "severity": 3},
    "Backdoors": {"color": "#ef4444", "severity": 5},
    "DoS": {"color": "#dc2626", "severity": 5},
    "Exploits": {"color": "#b91c1c", "severity": 5},
    "Generic": {"color": "#f97316", "severity": 3},
    "Reconnaissance": {"color": "#eab308", "severity": 2},
    "Shellcode": {"color": "#7c3aed", "severity": 5},
    "Worms": {"color": "#9333ea", "severity": 5},
    "Unknown": {"color": "#6b7280", "severity": 1},
}

# Producer tuning
PRODUCER_DELAY_SEC = float(os.getenv("PRODUCER_DELAY_SEC", "0.05"))
PRODUCER_BATCH_SIZE = int(os.getenv("PRODUCER_BATCH_SIZE", "1"))

# Spark consumer tuning
SPARK_TRIGGER_SECS = int(os.getenv("SPARK_TRIGGER_SECS", "5"))
SPARK_MAX_OFFSETS = int(os.getenv("SPARK_MAX_OFFSETS", "200"))

# Local Windows Hadoop native binaries.
HADOOP_HOME_path = os.getenv("HADOOP_HOME", r"D:\hadoop-3.3.6")
HADOOP_bin_path = os.getenv("HADOOP_BIN", str(Path(HADOOP_HOME_path) / "bin"))

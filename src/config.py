"""
config.py – single source of truth for all paths, topics, and column constants.
"""
import os

# ── Kafka ──────────────────────────────────────────────────────────────────
KAFKA_BOOTSTRAP    = os.getenv("KAFKA_BOOTSTRAP", "localhost:9092")
TOPIC_RAW          = "unsw-nb15-raw"
TOPIC_PREDICTIONS  = "unsw-nb15-alerts"
KAFKA_GROUP_ID     = "unsw-spark-consumer"

# ── HDFS paths for raw data (used by Kafka producer) ──────────────────────
HDFS_RAW_CSV       = "hdfs://namenode:9005/data/unsw/UNSW-NB15_1.csv"
HDFS_FEATURES_CSV  = "hdfs://namenode:9005/data/unsw/NUSW-NB15_features.csv"

# ── HDFS paths for raw data (used train test) ──────────────────────

HDFS_TRAIN_CSV = "hdfs://namenode:9005/data/unsw/UNSW_NB15_training-set.csv"
HDFS_TEST_CSV  = "hdfs://namenode:9005/data/unsw/UNSW_NB15_testing-set.csv"
# ── Saved PySpark PipelineModel (on HDFS) ─────────────────────────────────
#MODEL_PATH         = os.getenv("MODEL_PATH", "hdfs://namenode:9005/ml/unsw_nb15_final_pipeline")
MODEL_PATH = "D:/dxc_project_full/unsw_nb15_final_pipeline"   # works


# ── Hive settings ──────────────────────────────────────────────────────────
HIVE_HOST          = "localhost"          # HiveServer2 / Metastore host
HIVE_PORT          = 10000                # HiveServer2 port (for PyHive)
HIVE_DATABASE      = "ids_db"
HIVE_TABLE         = "alerts"
HIVE_METASTORE_URI = "thrift://localhost:9083"   # for Spark Hive support
_BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ALERTS_DB = os.path.join(_BASE_DIR, "alerts.db")

# ── Column constants (match your notebook) ────────────────────────────────
TARGET_RAW    = "attack_cat"
LABEL_COL     = "label"
FEATURE_COL   = "scaledFeatures"
BINARY_LABEL = "label"
CAT_COLS      = ["proto", "service", "state"]

# Raw CSV column names (header‑less)
RAW_COLUMNS = [
    "srcip","sport","dstip","dsport","proto","state","dur",
    "sbytes","dbytes","sttl","dttl","sloss","dloss","service",
    "Sload","Dload","Spkts","Dpkts","swin","dwin","stcpb","dtcpb",
    "smeansz","dmeansz","trans_depth","res_bdy_len","Sjit","Djit",
    "Stime","Ltime","Sintpkt","Dintpkt","tcprtt","synack","ackdat",
    "is_sm_ips_ports","ct_state_ttl","ct_flw_http_mthd","is_ftp_login",
    "ct_ftp_cmd","ct_srv_src","ct_srv_dst","ct_dst_ltm","ct_src_ ltm",
    "ct_src_dport_ltm","ct_dst_sport_ltm","ct_dst_src_ltm",
    "attack_cat","Label",
]

# Attack categories and their colours/severity (for API)

ATTACK_LABELS = {
    "Normal":        {"color": "#22c55e", "severity": 0},
    "Fuzzers":       {"color": "#f59e0b", "severity": 2},
    "Analysis":      {"color": "#f97316", "severity": 3},
    "Backdoors":     {"color": "#ef4444", "severity": 5},
    "DoS":           {"color": "#dc2626", "severity": 5},
    "Exploits":      {"color": "#b91c1c", "severity": 5},
    "Generic":       {"color": "#f97316", "severity": 3},
    "Reconnaissance":{"color": "#eab308", "severity": 2},
    "Shellcode":     {"color": "#7c3aed", "severity": 5},
    "Worms":         {"color": "#9333ea", "severity": 5},
    "Unknown":       {"color": "#6b7280", "severity": 1},
}

# ── Producer tuning ───────────────────────────────────────────────────────
PRODUCER_DELAY_SEC   = 0.05
PRODUCER_BATCH_SIZE  = 1

# ── Spark consumer tuning ─────────────────────────────────────────────────
SPARK_TRIGGER_SECS   = 5
SPARK_MAX_OFFSETS    = 200

#──hadoop local────────────────────────────────────────────────────────────
HADOOP_HOME_path = r"D:\hadoop-3.3.6"
HADOOP_bin_path= r"D:\hadoop-3.3.6\bin"
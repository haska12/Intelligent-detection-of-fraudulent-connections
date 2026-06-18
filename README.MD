# Intelligent detection of fraudulent connections based on Big Data analytics, including a strong BI dimension

End‑to‑end real‑time IDS using **PySpark**, **Kafka**, **SQLite**, and **FastAPI**. This project trains a Random Forest model on the UNSW‑NB15 dataset, streams network flows, and serves a REST API for real-time monitoring.

---

## 📊 Dataset

The dataset used in this project is too large to be hosted on GitHub.
You can download the **UNSW-NB15** dataset directly from Kaggle here:
[UNSW-NB15 Dataset on Kaggle]https://www.kaggle.com/datasets/mrwellsdavid/unsw-nb15

---

**Instructions:**

1. Download the files.
2. Place them in the `dataset/` folder.
3. Run the project.

---

## 🛠️ System Architecture

1.  **Ingestion:** `kafka_producer.py` streams CSV data from HDFS into Kafka topics.
2.  **Processing:** `spark_consumer_sqlite.py` consumes the stream, applies the ML pipeline, and detects attack categories.
3.  **Storage:** Predictions are stored in a local SQLite database (`alerts.db`).
4.  **Serving:** `api/main.py` provides REST endpoints for dashboards and real-time monitoring.

---

## 📋 Prerequisites

| Tool        | Version                   |
| :---------- | :------------------------ |
| **Python**  | 3.9+                      |
| **Java**    | 17 (Required for Spark)   |
| **PySpark** | 3.5.3                     |
| **Docker**  | Latest (Compose required) |

---

Got it. I have updated the **README.md** to include those specific environment setup steps, the detailed Docker/HDFS commands, and the Windows-specific Hadoop configuration while keeping your environment name `bigdata`.

---

## 🛠️ Environment Setup

### 1. Create Python Environment

```bash
# Create the environment with core dependencies
conda create -n bigdata python=3.9 pandas numpy matplotlib kafka-python pyspark==3.5.3 -y

# Activate the environment
conda activate bigdata

# Install remaining web and utility dependencies
pip install fastapi "uvicorn[standard]" websockets python-dotenv
```

### 2. Windows-Specific Hadoop Setup

If running on Windows, you must provide the native Hadoop binaries:

1.  Download `hadoop.dll` and `winutils.exe` (Hadoop 3.3.6 compatible) from GitHub.
2.  Create the folder: `D:\hadoop-3.3.6\bin`.
3.  Copy the downloaded files into that `bin` folder.
4.  Set your system environment variable `HADOOP_HOME` to `D:\hadoop-3.3.6`.

---

## 🚀 Docker & HDFS Configuration

### 1. Start Services

start / Activate the environment

```bash
cd docker_configuration
```

If containers are already running and you need a fresh start:

```bash
docker compose down -v
```

Build and start the infrastructure:

```bash
docker compose up --build -d
```

start the infrastructure:

```bash
docker compose up  -d
```

### 2. Data Ingestion to HDFS

Initialize the HDFS directory structure and upload the dataset:

```bash
# Create directories
docker exec -it namenode hdfs dfs -mkdir -p /data/unsw
docker exec -it namenode hdfs dfs -mkdir -p /ml

# Upload CSV files from the container's shared volume to HDFS
docker exec -it namenode bash -c "hdfs dfs -put /home/spark_data/dataset/*.csv /data/unsw/"

# Verify the files exist
docker exec -it namenode hdfs dfs -ls /data/unsw/
```

---

## 🏃 How to Use

### Step 1: Model Training

Run the Jupyter notebook **`comp_ml_alg.ipynb`**. This will train the model and save the pipeline to HDFS.

To download the trained pipeline from HDFS to your local machine:

```bash
docker exec -it namenode hdfs dfs -get /ml/unsw_nb15_final_pipeline .
```

### Step 2: Execution (3 Terminals)

**Terminal 1: Kafka Producer** (Streams data)

```bash
conda activate bigdata
python kafka_producer.py --hdfs-path hdfs://namenode:9005/data/unsw/UNSW_NB15_training-set.csv --loop --delay 0.05
```

**Terminal 2: Spark Consumer** (Inference & Database Write)

```bash
conda activate bigdata
python "spark_consumer_sqlite.py"
```

**Terminal 3: FastAPI** (Web Server)

```bash
conda activate bigdata
uvicorn api.main:app --host 0.0.0.0 --port 8000
```

or

```bash
conda activate bigdata
python -m uvicorn api.main:app --host 0.0.0.0 --port 8000
```

---

## 🌐 API Endpoints (FastAPI)

All endpoints read from the SQLite database (`alerts.db`).

### Standard Endpoints

| Method | Endpoint             | Description                                                                            |
| ------ | -------------------- | -------------------------------------------------------------------------------------- |
| `GET`  | `/`                  | API overview with endpoint lists                                                       |
| `GET`  | `/api/health`        | Health check + row counts                                                              |
| `GET`  | `/api/events`        | Paginated list of all events (normal + attacks)                                        |
| `GET`  | `/api/events/recent` | Last N events (default 20)                                                             |
| `GET`  | `/api/alerts`        | Paginated list of only attacks                                                         |
| `GET`  | `/api/alerts/recent` | Last N attacks (default 20)                                                            |
| `GET`  | `/api/stats`         | Aggregated statistics (attack rate, by category, protocol, severity) over last 2 hours |

**Pagination params:** `?limit=100&offset=0`

### Power BI‑Friendly Endpoints (JSON arrays)

| Method | Endpoint                    | Description                                                                  |
| ------ | --------------------------- | ---------------------------------------------------------------------------- |
| `GET`  | `/api/powerbi/alerts`       | All attacks within time window (default 2h)                                  |
| `GET`  | `/api/powerbi/stats`        | Global stats: total, attacks, normal, attack rate                            |
| `GET`  | `/api/powerbi/by_category`  | Attack counts per predicted category + avg severity                          |
| `GET`  | `/api/powerbi/by_protocol`  | Top 15 protocols by flow count, bytes, avg duration                          |
| `GET`  | `/api/powerbi/timeseries`   | Minute‑level time series (total/attack/normal)                               |
| `GET`  | `/api/powerbi/by_severity`  | Events grouped by severity (0‑5)                                             |
| `GET`  | `api/powerbi/live_ticker`   | the top 20 most recent attacks for a live dashboard table grid               |
| `GET`  | `/api/powerbi/network_load` | Correlates network throughput load with attack volumes over time             |
| `GET`  | `/api/powerbi/by_state`     | Groups traffic by network connection state to isolate vulnerability patterns |

**Parameter:** `?hours=2` (sliding window)

---

## 🌐 API Documentation

The FastAPI server provides detailed insights into network health and attack analytics.

### Standard Endpoints

- `GET /` : API overview with endpoint lists.
- `GET /api/health` : Database connection status and row counts.
- `GET /api/events` : Paginated list of all traffic flows (normal + attacks).
- `GET /api/events/recent` : Most recent events (default 20).
- `GET /api/alerts` : Paginated list of only attack events.
- `GET /api/alerts/recent` : Most recent attacks (default 20).
- `GET /api/stats` : Aggregated metrics over the last `hours` window (default 2h).

### Power BI-Optimized Endpoints

Returns flat JSON arrays for easy Power BI and dashboard integration.

- `GET /api/powerbi/alerts` : All attacks within the requested time window (default 2h).
- `GET /api/powerbi/stats` : Aggregate summary counts and attack rate.
- `GET /api/powerbi/by_category` : Attack counts per predicted category plus average severity.
- `GET /api/powerbi/by_protocol` : Top protocols by flow count, bytes, and average duration.
- `GET /api/powerbi/timeseries` : Minute-level traffic trends.
- `GET /api/powerbi/by_severity` : Events grouped by severity.
- `GET /api/powerbi/live_ticker` : Top 20 most recent attacks for live dashboards.
- `GET /api/powerbi/network_load` : Network throughput correlated with attack volumes.
- `GET /api/powerbi/by_state` : Traffic grouped by connection state.

---

## 📁 Project Structure

```text
.
├── src/
│   ├── api/
│   │   ├── __init__.py
│   │   └── main.py                    # FastAPI application logic
│   ├── ml/                            # ML models and utilities
│   ├── comp_ml_alg_fixed.ipynb        # ML Training Pipeline
│   ├── config.py                      # Global settings (Kafka/HDFS/DB)
│   ├── kafka_producer.py              # HDFS to Kafka data streamer
│   ├── spark_consumer_sqlite.py       # Spark Streaming & Inference engine
│   ├── normalize.py                   # Feature normalization utilities
│   └── test_db.py                     # Database testing utilities
├── dataset/
│   ├── NUSW-NB15_features.csv         # Dataset features
│   ├── UNSW_NB15_testing-set.csv      # Test dataset
│   ├── UNSW_NB15_training-set.csv     # Training dataset
│   └── UNSW-NB15_*.csv                # Additional dataset files
├── docker_configuration/              # Docker Compose and service configs
│   ├── docker-compose.yml
│   ├── hadoop.env
│   ├── hive/
│   │   └── Dockerfile
│   └── spark/
│       └── Dockerfile
├── unsw_nb15_final_pipeline/          # Trained ML pipeline (Spark)
├── spark-tmp/                         # Spark checkpoint & temp data
├── jars/                              # External JAR dependencies
├── requirements.txt                   # Python dependencies
├── run.bat                            # Batch script runner (Windows)
└── README.MD                          # Project documentation
```

---

## ⚙️ Configuration

Modify `config.py` to adjust:

- `KAFKA_BOOTSTRAP`: Broker addresses.
- `ATTACK_LABELS`: Custom mapping for model output labels.
- `ALERTS_DB`: Path to the SQLite storage file.

---

### Attack category severity levels

The API classifies events by attack category and maps them to severity levels and colors.

- 🔴 Severity 5 (Red/Purple) = Active Compromise & Disruption
  - `Backdoors`, `DoS`, `Exploits`, `Shellcode`, `Worms`
- 🟠 Severity 3 (Orange) = Targeted Malicious Activity
  - `Analysis`, `Generic`
- 🟡 Severity 2 (Yellow) = Probing & Noise
  - `Fuzzers`, `Reconnaissance`
- 🟢/⚫ Severity 0–1 (Green/Gray) = Baseline
  - `Normal` = safe, standard traffic
  - `Unknown` = unclassified/anomalous traffic, not an active threat

This mapping is defined in `src/config.py` inside the `ATTACK_LABELS` dictionary.

---

## 🛠️ Troubleshooting

- **Java Errors:** Ensure `JAVA_HOME` points to Java 17.
- **Windows Users:** Ensure `winutils.exe` is present in your Hadoop bin directory to avoid filesystem errors.
- **Empty API Results:** Verify that the `spark_consumer_sqlite.py` is actively writing to the `alerts.db` file.

---

**License:** MIT

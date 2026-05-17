import sqlite3
import os
from config import ALERTS_DB

print("ALERTS_DB path:", ALERTS_DB)

conn = sqlite3.connect(ALERTS_DB)
cur = conn.cursor()
cur.execute("""
    CREATE TABLE IF NOT EXISTS alerts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ts TEXT, proto TEXT, service TEXT, state TEXT,
        attack_cat TEXT, predicted_cat TEXT,
        is_attack INTEGER, severity INTEGER,
        dur REAL, sbytes INTEGER, dbytes INTEGER,
        sload REAL, dload REAL, spkts INTEGER, dpkts INTEGER,
        ct_state_ttl INTEGER, raw_label TEXT, stream_ts TEXT
    )
""")
conn.commit()
cur.execute(f"""SELECT severity,
                   COUNT(*) AS event_count,
                   SUM(is_attack) AS attack_count
            FROM alerts
            GROUP BY severity
            ORDER BY severity""")
print("Row count:", cur.fetchone()[0])
conn.close()
print("Table created successfully at", ALERTS_DB)
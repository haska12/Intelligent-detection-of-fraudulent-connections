"""
api/main.py – FastAPI reading from SQLite (events and alerts tables)
"""
import os
import sqlite3
import logging
from datetime import datetime, timedelta
from contextlib import contextmanager

from fastapi import FastAPI
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from config import ALERTS_DB, ATTACK_LABELS

logging.basicConfig(level=logging.INFO,
                    format="%(asctime)s [API] %(message)s", datefmt="%H:%M:%S")
log = logging.getLogger(__name__)

MAX_HISTORY_H = 2

@contextmanager
def get_db():
    conn = sqlite3.connect(ALERTS_DB)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()

def _cutoff(hours: int = MAX_HISTORY_H):
    return (datetime.now() - timedelta(hours=hours)).isoformat()

app = FastAPI(title="UNSW-NB15 IDS – Power BI API (SQLite backend)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET"],
    allow_headers=["*"],
)

# ──────────────────────────────────────────────────────────────────────────
#  Health & counts
# ──────────────────────────────────────────────────────────────────────────
@app.get("/api/health")
async def health():
    try:
        with get_db() as conn:
            total_events = conn.execute("SELECT COUNT(*) AS cnt FROM events").fetchone()["cnt"]
            total_alerts = conn.execute("SELECT COUNT(*) AS cnt FROM alerts").fetchone()["cnt"]
        return {
            "status": "ok",
            "database": "sqlite",
            "total_events": total_events,
            "total_alerts": total_alerts
        }
    except Exception as e:
        return {"status": "error", "detail": str(e)}

# ──────────────────────────────────────────────────────────────────────────
#  Event endpoints (all traffic, normal + attacks)
# ──────────────────────────────────────────────────────────────────────────
@app.get("/api/events")
async def all_events(limit: int = 100, offset: int = 0):
    """Return all events (normal + attacks) from the 'events' table."""
    with get_db() as conn:
        rows = conn.execute(
            "SELECT * FROM events ORDER BY ts DESC LIMIT ? OFFSET ?",
            (limit, offset)
        ).fetchall()
    return JSONResponse({"events": [dict(r) for r in rows], "count": len(rows)})

@app.get("/api/events/recent")
async def events_recent(n: int = 20):
    """Return the most recent N events (all types)."""
    with get_db() as conn:
        rows = conn.execute(
            "SELECT * FROM events ORDER BY ts DESC LIMIT ?", (n,)
        ).fetchall()
    return JSONResponse({"events": [dict(r) for r in reversed(rows)]})

# ──────────────────────────────────────────────────────────────────────────
#  Alert endpoints (only attacks)
# ──────────────────────────────────────────────────────────────────────────
@app.get("/api/alerts")
async def alerts(limit: int = 100, offset: int = 0):
    """Return only attack events (is_attack = 1) from the 'alerts' table."""
    with get_db() as conn:
        rows = conn.execute(
            "SELECT * FROM alerts ORDER BY ts DESC LIMIT ? OFFSET ?",
            (limit, offset)
        ).fetchall()
    return JSONResponse({"alerts": [dict(r) for r in rows], "count": len(rows)})

@app.get("/api/alerts/recent")
async def alerts_recent(n: int = 20):
    """Return the most recent N attacks."""
    with get_db() as conn:
        rows = conn.execute(
            "SELECT * FROM alerts ORDER BY ts DESC LIMIT ?", (n,)
        ).fetchall()
    return JSONResponse({"alerts": [dict(r) for r in reversed(rows)]})

# ──────────────────────────────────────────────────────────────────────────
#  Statistics (based on events table, filtered by is_attack)
# ──────────────────────────────────────────────────────────────────────────
@app.get("/api/stats")
async def stats(hours: int = MAX_HISTORY_H):
    cutoff = _cutoff(hours)
    with get_db() as conn:
        total = conn.execute(
            "SELECT COUNT(*) AS cnt FROM events WHERE ts >= ?", (cutoff,)
        ).fetchone()["cnt"]
        attacks = conn.execute(
            "SELECT COUNT(*) AS cnt FROM events WHERE ts >= ? AND is_attack = 1", (cutoff,)
        ).fetchone()["cnt"]
        by_cat = conn.execute(
            "SELECT predicted_cat, COUNT(*) AS cnt FROM events WHERE ts >= ? GROUP BY predicted_cat ORDER BY cnt DESC",
            (cutoff,)
        ).fetchall()
        by_proto = conn.execute(
            "SELECT proto, COUNT(*) AS cnt FROM events WHERE ts >= ? GROUP BY proto ORDER BY cnt DESC LIMIT 10",
            (cutoff,)
        ).fetchall()
        by_sev = conn.execute(
            "SELECT severity, COUNT(*) AS cnt FROM events WHERE ts >= ? GROUP BY severity ORDER BY severity",
            (cutoff,)
        ).fetchall()
    t = total or 0
    a = attacks or 0
    return JSONResponse({
        "total": t,
        "attacks": a,
        "normal": t - a,
        "attack_rate": round(a / t * 100, 1) if t else 0,
        "window_hours": hours,
        "by_category": [
            {"name": r["predicted_cat"], "count": r["cnt"],
             "color": ATTACK_LABELS.get(r["predicted_cat"], {}).get("color", "#6b7280")}
            for r in by_cat
        ],
        "by_protocol": [{"proto": r["proto"] or "-", "count": r["cnt"]} for r in by_proto],
        "by_severity": [{"severity": r["severity"], "count": r["cnt"]} for r in by_sev],
    })

# ──────────────────────────────────────────────────────────────────────────
#  Power BI endpoints (use alerts table for attacks, events for timeseries?)
#  Keeping original behaviour: Power BI endpoints query the 'alerts' table
#  (which now contains only attacks). If you need all events for Power BI,
#  duplicate the endpoints with 'events' table.
# ──────────────────────────────────────────────────────────────────────────
@app.get("/api/powerbi/alerts")
async def pbi_alerts(hours: int = MAX_HISTORY_H, limit: int = 10000):
    cutoff = _cutoff(hours)
    with get_db() as conn:
        rows = conn.execute(f"""
            SELECT ts, proto, service, state, attack_cat, predicted_cat,
                   is_attack, severity, dur, sbytes, dbytes, sload, dload,
                   spkts, dpkts, ct_state_ttl
            FROM alerts
            WHERE ts >= ?
            ORDER BY ts DESC
            LIMIT ?
        """, (cutoff, limit)).fetchall()
    return JSONResponse([dict(r) for r in rows])

@app.get("/api/powerbi/stats")
async def pbi_stats(hours: int = MAX_HISTORY_H):
    cutoff = _cutoff(hours)
    with get_db() as conn:
        t = conn.execute("SELECT COUNT(*) AS cnt FROM alerts WHERE ts >= ?", (cutoff,)).fetchone()["cnt"]
        a = conn.execute("SELECT COUNT(*) AS cnt FROM alerts WHERE ts >= ? AND is_attack=1", (cutoff,)).fetchone()["cnt"]
    return JSONResponse([{
        "total": t,
        "attacks": a,
        "normal": t - a,
        "attack_rate": round(a / t * 100, 2) if t else 0,
        "window_hours": hours,
        "generated_at": datetime.now().isoformat(),
    }])

@app.get("/api/powerbi/by_category")
async def pbi_by_category(hours: int = MAX_HISTORY_H):
    cutoff = _cutoff(hours)
    with get_db() as conn:
        rows = conn.execute(f"""
            SELECT predicted_cat AS category,
                   COUNT(*) AS total_count,
                   SUM(is_attack) AS attack_count,
                   AVG(severity) AS avg_severity
            FROM alerts
            WHERE ts >= ?
            GROUP BY predicted_cat
            ORDER BY attack_count DESC
        """, (cutoff,)).fetchall()
    result = [dict(r) for r in rows]
    for r in result:
        r["color"] = ATTACK_LABELS.get(r["category"], {}).get("color", "#6b7280")
    return JSONResponse(result)

@app.get("/api/powerbi/by_protocol")
async def pbi_by_protocol(hours: int = MAX_HISTORY_H):
    cutoff = _cutoff(hours)
    with get_db() as conn:
        rows = conn.execute(f"""
            SELECT proto AS protocol,
                   COUNT(*) AS total_flows,
                   SUM(is_attack) AS attack_flows,
                   SUM(sbytes + dbytes) AS total_bytes,
                   AVG(dur) AS avg_duration
            FROM alerts
            WHERE ts >= ?
            GROUP BY proto
            ORDER BY total_flows DESC
            LIMIT 15
        """, (cutoff,)).fetchall()
    return JSONResponse([dict(r) for r in rows])

@app.get("/api/powerbi/timeseries")
async def pbi_timeseries(hours: int = MAX_HISTORY_H):
    cutoff = _cutoff(hours)
    with get_db() as conn:
        rows = conn.execute(f"""
            SELECT substr(ts, 1, 16) AS ts_minute,
                   COUNT(*) AS total_events,
                   SUM(is_attack) AS attack_events,
                   COUNT(*) - SUM(is_attack) AS normal_events,
                   AVG(severity) AS avg_severity
            FROM alerts
            WHERE ts >= ?
            GROUP BY substr(ts, 1, 16)
            ORDER BY ts_minute ASC
        """, (cutoff,)).fetchall()
    return JSONResponse([dict(r) for r in rows])

@app.get("/api/powerbi/by_severity")
async def pbi_by_severity(hours: int = MAX_HISTORY_H):
    cutoff = _cutoff(hours)
    with get_db() as conn:
        rows = conn.execute(f"""
            SELECT severity,
                   COUNT(*) AS event_count,
                   SUM(is_attack) AS attack_count
            FROM alerts
            WHERE ts >= ?
            GROUP BY severity
            ORDER BY severity
        """, (cutoff,)).fetchall()
    return JSONResponse([dict(r) for r in rows])

@app.get("/")
async def root():
    return {
        "service": "UNSW-NB15 IDS API (SQLite backend)",
        "power_bi_endpoints": {
            "alerts":      "/api/powerbi/alerts",
            "stats":       "/api/powerbi/stats",
            "by_category": "/api/powerbi/by_category",
            "by_protocol": "/api/powerbi/by_protocol",
            "timeseries":  "/api/powerbi/timeseries",
            "by_severity": "/api/powerbi/by_severity",
        },
        "standard_endpoints": {
            "health":      "/api/health",
            "events":      "/api/events",
            "events/recent":"/api/events/recent",
            "alerts":      "/api/alerts",
            "alerts/recent":"/api/alerts/recent",
            "stats":       "/api/stats",
        },
    }
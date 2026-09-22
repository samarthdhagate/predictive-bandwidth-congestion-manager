"""
FastAPI Backend Application for WiFi Congestion Management Dashboard.
Serves REST API telemetry endpoints and static UI assets.
"""

import os
import sys
import time
from typing import Optional
from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

# Add project root and local directories
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
if project_root not in sys.path:
    sys.path.append(project_root)

from dashboard.backend.data_service import data_service

app = FastAPI(
    title="Predictive WiFi Congestion Management NOC Dashboard API",
    description="REST API serving real-time telemetry, spatial floor maps, predictions, decision states, and testbed QoS benchmarks.",
    version="1.0.0"
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

frontend_dir = os.path.join(os.path.dirname(__file__), '..', 'frontend')


@app.get("/api/health")
def get_health():
    """Return backend health status and system time for connectivity checks."""
    return {
        "status": "HEALTHY",
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "version": "1.0.0",
        "enforcement_mode": "DRY_RUN / TESTBED TELEMETRY"
    }


@app.get("/api/system/overview")
def get_system_overview():
    """Return high-level operational counters, model performance, and enforcement status."""
    return data_service.get_system_overview()


@app.get("/api/aps")
def get_aps(
    floor: Optional[int] = Query(None, description="Filter APs by floor (0, 1, 2)"),
    risk: Optional[str] = Query(None, description="Filter APs by risk level (NORMAL, MODERATE, HIGH, CRITICAL)")
):
    """Return list of all 247 Access Points with spatial coordinates and predictive risk state."""
    return data_service.get_all_aps(floor_filter=floor, risk_filter=risk)


@app.get("/api/aps/{ap_id}")
def get_ap_details(ap_id: int):
    """Return detailed metadata and current status for a single Access Point."""
    aps = data_service.get_all_aps()
    for ap in aps:
        if ap['ap_id'] == ap_id:
            return ap
    raise HTTPException(status_code=404, detail=f"AP {ap_id} not found")


@app.get("/api/decision/{ap_id}")
def get_decision_status(ap_id: int):
    """Return full PolicyDecision schema conforming to the decision engine specification."""
    return data_service.get_decision_status(ap_id=ap_id)


@app.get("/api/aps/{ap_id}/history")
def get_ap_history(ap_id: int):
    """Return time series tracking of actual users, predicted users, latency, jitter, and loss for AP."""
    return data_service.get_ap_history(ap_id=ap_id)


@app.get("/api/qos/benchmarks")
def get_qos_benchmarks():
    """Return scenario summaries, load regime breakdowns (including jitter), and rate calibration matrices."""
    return data_service.get_qos_benchmarks()


@app.get("/api/audit/logs")
def get_audit_logs(limit: int = Query(100, description="Max number of log records to return")):
    """Return recent policy state transition and actuation audit logs."""
    return data_service.get_audit_logs(limit=limit)


@app.get("/api/system/flow")
def get_system_flow():
    """Return metadata describing the 6-stage predictive loop."""
    return {
        "pipeline_stages": [
            {"id": 1, "name": "Campus Data Ingestion", "desc": "Synchronized AP user load snapshots (247 APs, 16.6m interval)", "status": "ACTIVE"},
            {"id": 2, "name": "LightGBM ML Forecasting", "desc": "Predicts y(t+1) user load (~16.6m ahead, RMSE: 0.9154, R2: 0.7742)", "status": "ACTIVE"},
            {"id": 3, "name": "Risk Classification", "desc": "Maps load to empirical tiers: NORMAL (<5), MODERATE (5-9), HIGH (10-19), CRITICAL (>=20)", "status": "ACTIVE"},
            {"id": 4, "name": "Hysteresis Decision Engine", "desc": "Dual-threshold bounds + 2-step cooldown (cuts policy flapping by 39.2%)", "status": "ACTIVE"},
            {"id": 5, "name": "Safe Actuator", "desc": "Translates states into Linux tc/HTB shaping (Global safety switch: Dry-Run)", "status": "SAFEGUARDED"},
            {"id": 6, "name": "Controlled Network Testbed", "desc": "Isolated Linux namespaces (ns_client, ns_router, ns_server) with iperf3 & ICMP telemetry", "status": "ISOLATED_TESTBED"}
        ]
    }


# Mount static frontend assets
if os.path.exists(frontend_dir):
    app.mount("/static", StaticFiles(directory=frontend_dir), name="static")

    @app.get("/")
    def serve_frontend():
        return FileResponse(os.path.join(frontend_dir, "index.html"))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=True)

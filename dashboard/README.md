# Predictive WiFi Congestion Management — NOC Dashboard

A Network Operations Center (NOC) dashboard visualizing the complete closed-loop predictive bandwidth management pipeline:
$$\text{INGEST} \longrightarrow \text{PREDICT} \longrightarrow \text{DETECT} \longrightarrow \text{DECIDE} \longrightarrow \text{ACT} \longrightarrow \text{MEASURE}$$

---

## 1. System Architecture & Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend UI (HTML5/CSS)                  │
│   • Header Controls & Clocks       • Spatial 247-AP Grid    │
│   • Decision Engine Inspector      • QoS Benchmark Cards    │
│   • Regime Telemetry Table         • Transition Audit Log   │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│             Frontend API Service Layer (api.js)             │
│   • AbortController Timeouts (6s)  • Health & State Events  │
│   • JSON Interceptor & Errors      • Custom Event Dispatch  │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                  FastAPI Backend Server (app.py)            │
│   • GET /api/health                • GET /api/system/overview│
│   • GET /api/aps                   • GET /api/aps/{id}      │
│   • GET /api/decision/{id}         • GET /api/aps/{id}/hist │
│   • GET /api/qos/benchmarks        • GET /api/audit/logs    │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│              Data Service Layer (data_service.py)           │
│   • Indexes 247 Campus APs         • Validated Testbed CSVs │
│   • Pre-calculated LightGBM Loads  • Policy Audit Streams   │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│           Validated Historical Data & Lab Telemetry         │
│   • data/processed/campus_users_with_location.csv           │
│   • data/processed/regime_comparison.csv                    │
│   • data/processed/closed_loop_summary.csv                  │
│   • infra/testbed/results/closed_loop_results.csv           │
│   • infra/testbed/results/policy_transitions.csv            │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Directory Layout

```
dashboard/
├── backend/
│   ├── app.py              # FastAPI REST API serving telemetry endpoints & static assets
│   └── data_service.py     # Caching & indexing layer reading processed ML & testbed datasets
├── frontend/
│   ├── api.js              # Resilient frontend API service layer (timeouts, health, error dispatch)
│   ├── app.js              # UI controller, state manager, Chart.js telemetry, and filter bindings
│   ├── index.html          # Semantic HTML5 NOC layout (Overview, Flow, Spatial Grid, Inspector, Benchmarks, Audit)
│   └── style.css           # Glassmorphism dark-mode NOC styling with neon indicators & responsive grid
└── README.md               # Architecture documentation and quickstart guide
```

---

## 3. How to Run

### Backend & Frontend Start Command
The FastAPI backend serves both the REST API and the static frontend assets on port `8000`:

```bash
# In the repository root:
python -m uvicorn dashboard.backend.app:app --host 127.0.0.1 --port 8000 --reload
```

### Access URLs:
- **NOC Dashboard Frontend**: [`http://127.0.0.1:8000/`](http://127.0.0.1:8000/)
- **Interactive Swagger OpenAPI Docs**: [`http://127.0.0.1:8000/docs`](http://127.0.0.1:8000/docs)
- **OpenAPI JSON Specification**: [`http://127.0.0.1:8000/openapi.json`](http://127.0.0.1:8000/openapi.json)

---

## 4. Connected Dashboard Components & Data Binding

| # | Section | UI Component | Data Source & Endpoints | Ground Truth Metrics Displayed |
|---|---|---|---|---|
| **1** | **System Overview** | Top telemetry counter cards | `GET /api/system/overview` | Total APs (247), Normal/Moderate/High/Critical counts, LightGBM RMSE (`0.9154`), $R^2$ (`0.7742`), Horizon (`~16.6m`). |
| **2** | **AP Congestion Map** | 247-Tile Spatial Matrix | `GET /api/aps?floor=&risk=` | Spatial AP tiles with Floor levels (0, 1, 2), current load $u(t)$, predicted load $\hat{y}(t+1)$, risk tier dot. |
| **3** | **Prediction Inspector** | Dual-axis Chart.js telemetry | `GET /api/aps/{id}/history` | Actual future users $y(t+1)$ vs LightGBM forecast $\hat{y}(t+1)$ vs controlled testbed latency (ms). |
| **4** | **Decision Engine** | 8 Decision schema chips | `GET /api/decision/{id}` | AP ID, current users, forecast load, risk level, confidence status (`HIGH_CONFIDENCE`), QoS action, cooldown, dry-run enforcement mode, policy reason. |
| **5** | **QoS Performance** | 3 Scenario cards + Regime table | `GET /api/qos/benchmarks` | Throughput, Avg/P95/Max Latency, **Jitter**, and Packet Loss across Baseline vs Predictive QoS vs Oracle. |
| **6** | **Audit Log** | Chronological event stream | `GET /api/audit/logs?limit=100` | State transitions, AP ID, previous/new states, current/predicted users, anti-flap hysteresis rationale. |
| **7** | **Last Updated & Refresh** | Top bar clock & controls | `GET /api/health` + polling | System UTC clock, `LAST SYNC` timestamp, manual `REFRESH` button, 30s auto-refresh toggle switch. |

---

## 5. Strict Isolation & Safety Guardrails

- **Data Origin Demarcation**:
  - `[HISTORICAL CAMPUS DATA]`: Labels data ingested from the 2023-04-18 to 2023-06-18 campus dataset.
  - `[MODEL PREDICTION]`: Labels the validated LightGBM 150-tree forecast outputs.
  - `[CONTROLLED NETWORK TESTBED]`: Labels the isolated Linux network namespace (`ns_client`, `ns_router`, `ns_server`) performance measurements.
- **Production Interface Lockdown**: Actuator operates strictly in dry-run mode (`enforcement_enabled: false`), preventing any interaction with physical VIT campus infrastructure.

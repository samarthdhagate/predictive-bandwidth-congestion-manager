# React + Vite Dashboard Redesign Specification

**Project Title**: Predictive Bandwidth & WiFi Congestion Management System  
**Document Version**: 1.0.0 (Step 4A Design & Architecture Specification)  
**Primary Target Audience**: Students, Faculty, and Technical Hackathon Judges  

---

## 1. Executive Product Vision

### 1.1 The Primary Product Question
> **"Which Wi-Fi should I use now, which Access Points are becoming congested, and what will happen in the next ~16.6 minutes?"**

The current Network Operations Center (NOC) dashboard is technically complete and validated, but its visual design is dense and developer-oriented. This redesign shifts the user experience from raw infrastructure telemetry to an **intuitive, user-centric product experience** that answers real user questions immediately, while providing progressively deeper layers of intelligence for professors, network engineers, and technical judges.

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                               USER EXPERIENCE SPECTRUM                                  │
├──────────────────────────────┬─────────────────────────────┬────────────────────────────┤
│         STUDENT              │          PROFESSOR          │       TECHNICAL JUDGE      │
│  "Which AP has best speed    │  "How congested is my       │  "How does LightGBM drive  │
│   and lowest latency right   │   department floor and      │   Linux tc/HTB shaping to  │
│   now for my class/study?"   │   seminar hall today?"      │   eliminate bufferbloat?"  │
└──────────────────────────────┴─────────────────────────────┴────────────────────────────┘
```

---

## 2. Core Architecture & Constraints

```
┌─────────────────────────────────────────────────────────────┐
│             React + Vite Frontend (Modern Dark UI)          │
│   [ HOME ]  [ CAMPUS ]  [ PREDICTION ]  [ QOS ] [ TECHNICAL]│
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP / REST (Vite Proxy in dev)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│             FastAPI Backend Server (dashboard/backend)      │
│   • /api/system/overview       • /api/aps                   │
│   • /api/aps/{id}/history      • /api/decision/{id}         │
│   • /api/qos/benchmarks        • /api/audit/logs            │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│           Validated Historical Data & Lab Telemetry         │
│   • 247 Campus APs (3 Floors) • LightGBM Model (0.9154 RMSE)│
│   • Linux Namespace QoS       • Dual Hysteresis Engine      │
└─────────────────────────────────────────────────────────────┘
```

### Strict Non-Destructive Principles:
1. **Zero Backend Modifications**: The working FastAPI backend (`dashboard/backend/app.py` and `data_service.py`) remains completely untouched.
2. **Zero ML/Dataset Changes**: All ML train/val/test boundaries ($70/15/15$), LightGBM weights, and testbed telemetry outputs are preserved with 100% fidelity.
3. **Zero Fabrication**: All numbers shown across all 5 pages are sourced directly from the verified FastAPI REST API.
4. **Strict Isolation**: Explicit source demarcations (`Historical campus data`, `Model prediction`, `Controlled testbed`) and persistent testbed disclaimers prevent any misconception of physical VIT production network interaction.

---

## 3. Five-Page Navigation Structure

```
┌───────────────────────────────────────────────────────────────────────────────────────────┐
│  [BRAND] Predictive WiFi Manager    [HOME]  [CAMPUS]  [PREDICTION]  [QOS]  [TECHNICAL]    │
│  [DISCLAIMER] CONTROLLED LAB TESTBED: Linux Namespaces Telemetry (Zero Production Risk)   │
└───────────────────────────────────────────────────────────────────────────────────────────┘
```

### Page 1: `HOME` — Student & General User Experience
- **Primary Hero Card: "Which Wi-Fi Should I Use Now?"**:
  - Floor & area selector (Floor 0 Ground, Floor 1 Auditoriums, Floor 2 Labs).
  - Smart Recommendation Card highlighting the **Best Recommended AP** in the selected area (lowest current load & clean 16.6m forecast).
  - Shows: AP ID, current users $u(t)$, predicted users $\hat{y}(t+1)$, empirical load risk state, and actionable student guidance:
    - *Example*: `"AP-42 is optimal (0 users). Clean airtime; excellent for heavy streaming and video calls."*
- **Campus Congestion Overview Cards**:
  - Instant status of 3 floors (e.g. Floor 0: 98% Optimal • Floor 1: 91% Optimal • Floor 2: 95% Optimal).
- **Upcoming Surge Watchlist**:
  - Proactive early-warning cards alerting users to APs expected to experience surges in $\sim 16.6\text{ minutes}$ (e.g. `"AP-125 Auditorium heading to High Load -> Recommend switching to AP-128"`).
- **System Health Pill**: 247 APs active, ~16.6 min forecasting enabled.

---

### Page 2: `CAMPUS` — Spatial AP Map & Interactive Exploration
- **Interactive Spatial Matrix**:
  - 247 AP grid tiles organized by floor coordinate mappings.
- **Controls & Filters**:
  - Floor filter tabs: `All Floors (247)`, `Floor 0 (81)`, `Floor 1 (83)`, `Floor 2 (83)`.
  - Risk filter pills: `All`, `Normal (<5)`, `Moderate (5-9)`, `High (10-19)`, `Critical (≥20)`.
  - Real-time search: Instant lookup by AP ID (`125`) or spatial region (`Auditorium`, `Seminar Hall`, `Foyer`).
- **AP Details Drawer / Card**:
  - Clicking any AP displays current load, forecasted load, empirical risk tier badge, coverage cells, and practical advice.

---

### Page 3: `PREDICTION` — Forecasting Intelligence & Time-Series
- **Actual vs Predicted Load Telemetry**:
  - Interactive dual-axis Chart.js line graph for the selected AP.
  - Cyan curve: Actual future user load $y(t+1)$.
  - Rose dashed curve: LightGBM forecast $\hat{y}(t+1)$.
  - Emerald curve: Controlled testbed latency (ms).
- **Lead-Time Callout**:
  - Explains the $\approx 16.62\text{ minute}$ early warning window ($1$ native snapshot ahead) allowing proactive intervention before physical contention escalates.
- **Model Validation Summary Card (Secondary)**:
  - Clean card displaying Test RMSE (`0.9154`), Test $R^2$ (`0.7742`), and $11.43\%$ error reduction over persistence during peak academic hours ($08:00 - 20:00$).

---

### Page 4: `QOS` — Autonomous Network Protection & Validation Breakthrough
- **Plain-Language 4-Step Pipeline Visual**:
  $$\text{1. Congestion Forecast} \longrightarrow \text{2. Hysteresis Decision} \longrightarrow \text{3. Proactive Rate Shaping} \longrightarrow \text{4. Bufferbloat Eliminated}$$
- **Validation Breakthrough Highlight Card**:
  - Peak Latency: **$65.98\text{ ms} \longrightarrow 11.05\text{ ms}$** (**$83.3\%$ reduction**).
  - Peak Packet Loss: **$15.00\% \longrightarrow 2.00\%$** (**$86.7\%$ reduction**).
- **Side-by-Side 3-Scenario Comparison**:
  - **Scenario A (Baseline - No QoS)**: Unmanaged drop-tail queue collapses into bufferbloat during ingress surges.
  - **Scenario B (Predictive QoS)**: Proactive 15M/40M HTB shaping contains tail delay to 11ms while preserving normal traffic.
  - **Scenario C (Theoretical Oracle)**: Near-perfect alignment with oracle upper bound (latency gap $\le 0.02\text{ ms}$).
- **Honest Engineering Trade-Off Callout**:
  - Clear explanation: *"Throughput is intentionally shaped during critical surges (from ~93 Mbps to 15-40 Mbps) to control bufferbloat, prevent queue exhaustion, and guarantee low tail latency."*

---

### Page 5: `TECHNICAL` — Decision Engine, Hysteresis & Audit Trail
- **Decision Engine State Inspector**:
  - 8 real-time decision schema chips: AP ID, current users, forecast load, empirical risk level, confidence status (`HIGH_CONFIDENCE`), recommended action, cooldown counter, and dry-run enforcement mode.
- **Hysteresis Anti-Flap Explanation**:
  - Details dual-threshold bounds (Entry $\ge 5/10/20$, Exit $< 4/8/17$) and 2-step cooldown dampening resulting in **$39.20\%$ flap reduction**.
- **12-Row Regime Telemetry Table**:
  - Complete testbed measurements across Normal, Moderate, High, and Critical regimes with Throughput, Latency, P95, Max Latency, **Jitter**, and Packet Loss.
- **Chronological Policy Transition Audit Stream**:
  - Searchable transition log with state filter and anti-flap rationale.
- **Safety & Isolation Proof**:
  - Documents dry-run enforcement mode and interface prefix validation (`veth_` whitelist).

---

## 4. Proposed React + Vite Folder Structure

```
dashboard/
├── backend/                          # Existing FastAPI REST Backend (Reused untouched)
│   ├── app.py
│   └── data_service.py
├── frontend-vite/                     # Modern React + Vite Application
│   ├── index.html                    # Single Page App HTML Entry
│   ├── package.json                  # React 18, Vite 5, Lucide-React, Chart.js
│   ├── vite.config.js                # Vite config with API proxy to http://127.0.0.1:8000
│   └── src/
│       ├── main.jsx                  # React DOM Root
│       ├── App.jsx                   # Main Layout: Nav, Disclaimer, Active Tab View
│       ├── index.css                 # Clean Dark Theme Design System (CSS Variables)
│       ├── services/
│       │   └── api.js                # Unified API client (fetchWithTimeout, health, error handlers)
│       ├── context/
│       │   └── TelemetryContext.jsx  # Global state (APs list, selected AP, auto-refresh)
│       ├── components/
│       │   ├── layout/
│       │   │   ├── Header.jsx        # Brand, clock, refresh button, auto-sync switch
│       │   │   ├── DisclaimerBar.jsx # Persistent lab testbed disclaimer & origin tags
│       │   │   ├── NavTabs.jsx       # 5-Tab Navigation Bar
│       │   │   └── Footer.jsx        # Dataset dates & isolation guarantee
│       │   ├── common/
│       │   │   ├── StatusBadge.jsx   # NORMAL, MODERATE, HIGH, CRITICAL empirical pills
│       │   │   ├── ErrorBanner.jsx   # Non-blocking connection loss notification
│       │   │   └── LoadingSkeleton.jsx # Skeleton loaders for cards and grids
│       │   ├── home/
│       │   │   ├── RecommendationHero.jsx     # "Which Wi-Fi should I use now?"
│       │   │   ├── CampusCongestionSummary.jsx # 3-Floor quick health pills
│       │   │   └── UpcomingSurgesCard.jsx     # Early-warning 16.6m watchlist
│       │   ├── campus/
│       │   │   ├── FloorFilterBar.jsx         # Floor (0, 1, 2) + Risk filter + Search
│       │   │   ├── SpatialAPMatrix.jsx        # 247-Tile spatial AP grid
│       │   │   └── APDetailDrawer.jsx         # Selected AP card with practical advice
│       │   ├── prediction/
│       │   │   ├── PredictionHeader.jsx       # AP selector + forecast horizon badge
│       │   │   ├── TimeSeriesChart.jsx        # Actual vs predicted load graph
│       │   │   └── ModelInsightCard.jsx       # LightGBM validation metrics
│       │   ├── qos/
│       │   │   ├── QoSConceptFlow.jsx         # 4-step visual explanation
│       │   │   ├── BreakthroughBanner.jsx     # Latency & loss reduction callout
│       │   │   ├── ScenarioCompareGrid.jsx    # Baseline vs Predictive vs Oracle cards
│       │   │   └── TradeOffCallout.jsx        # Honest throughput trade-off box
│       │   └── technical/
│       │       ├── DecisionEngineChips.jsx    # 8-chip schema display
│       │       ├── RegimeTelemetryTable.jsx   # 12-row testbed metrics (inc. Jitter)
│       │       ├── AuditLogStream.jsx         # Searchable transition audit table
│       │       └── SafetyVerificationCard.jsx # Dry-run lockdown proof
│       └── pages/
│           ├── HomePage.jsx          # Tab 1: Student recommendation & overview
│           ├── CampusPage.jsx        # Tab 2: Spatial map exploration
│           ├── PredictionPage.jsx    # Tab 3: Time-series telemetry
│           ├── QoSPage.jsx           # Tab 4: Autonomous QoS & trade-off
│           └── TechnicalPage.jsx     # Tab 5: Decision engine & audit logs
```

---

## 5. API-to-Component Mapping

| API Endpoint | HTTP Method | React Component(s) Consuming Data | Data Fields Utilized |
|---|---|---|---|
| `/api/health` | `GET` | `Header.jsx`, `ErrorBanner.jsx` | `status`, `timestamp`, `enforcement_mode` |
| `/api/system/overview` | `GET` | `HomePage.jsx`, `CampusCongestionSummary.jsx`, `TechnicalPage.jsx` | `total_aps`, `risk_counts` (Normal/Mod/High/Crit), `model_metrics` (RMSE, $R^2$), `last_updated` |
| `/api/aps` | `GET` | `RecommendationHero.jsx`, `SpatialAPMatrix.jsx`, `FloorFilterBar.jsx` | List of 247 APs: `ap_id`, `floor`, `region`, `current_users`, `predicted_users`, `risk_level`, `action` |
| `/api/aps/{id}` | `GET` | `APDetailDrawer.jsx` | Single AP metadata, location centroids, coverage cells |
| `/api/decision/{id}` | `GET` | `DecisionEngineChips.jsx`, `RecommendationHero.jsx` | `ap_id`, `current_users`, `predicted_users`, `risk_level`, `confidence_status`, `recommended_action`, `cooldown_remaining`, `policy_reason` |
| `/api/aps/{id}/history`| `GET` | `TimeSeriesChart.jsx` | Timestamps, `actual_users`, `predicted_users`, `pred_latency_ms`, `base_latency_ms`, `pred_throughput_mbps`, `pred_jitter_ms`, `pred_loss_pct` |
| `/api/qos/benchmarks` | `GET` | `BreakthroughBanner.jsx`, `ScenarioCompareGrid.jsx`, `RegimeTelemetryTable.jsx` | Scenarios summary (Throughput, Latency, Jitter, Loss), 12-row load regime telemetry, trade-offs |
| `/api/audit/logs` | `GET` | `AuditLogStream.jsx` | Historical transition records: `timestamp`, `ap_id`, `previous_state`, `new_state`, `current_users`, `predicted_users`, `reason`, `enforcement_status` |

---

## 6. Migration & Coexistence Plan

1. **Zero Downtime / Zero Breakage**:
   - The existing static HTML/CSS/JS frontend in `dashboard/frontend/` remains available.
   - The new React + Vite frontend is scaffolded cleanly in `dashboard/frontend-vite/`.
2. **Development Workflow**:
   - Run backend server: `python -m uvicorn dashboard.backend.app:app --host 127.0.0.1 --port 8000 --reload`
   - Run Vite frontend: `cd dashboard/frontend-vite && npm run dev` (proxies `/api` to port 8000).
3. **Production Build & Mounting**:
   - Running `npm run build` generates optimized static assets in `dashboard/frontend-vite/dist/`.
   - FastAPI can serve this production build directly from `dist/` or mount both.

---

## 7. Reusable Code & Logic from Existing Dashboard

| Existing Asset | Location | How it will be Reused in React + Vite |
|---|---|---|
| **API Client Logic** | `dashboard/frontend/api.js` | Reused directly in `src/services/api.js` with `fetchWithTimeout`, health checks, and error interception. |
| **Color Tokens & Design Tokens** | `dashboard/frontend/style.css` | Converted to modular CSS variables in `src/index.css`. |
| **Chart.js Configuration** | `dashboard/frontend/app.js` | Embedded cleanly in `TimeSeriesChart.jsx` with automatic gradient shading and dual-axis scaling. |
| **Scenario Presets** | `dashboard/frontend/app.js` | Reused in `RecommendationHero.jsx` and quick surge buttons for AP 125, AP 107, AP 162, AP 42. |
| **FastAPI Backend Server** | `dashboard/backend/app.py` | 100% reused untouched with all 9 REST endpoints. |
| **Data Service Layer** | `dashboard/backend/data_service.py` | 100% reused untouched reading validated project CSVs. |

# Phase 4: Dashboard Architecture & Integration Specification

## 1. Executive Overview

The **Network Operations Center (NOC) Dashboard** serves as the central observability and monitoring interface for the Predictive Bandwidth & WiFi Congestion Management system. It operationalizes the end-to-end predictive loop:

$$\text{INGEST} \longrightarrow \text{PREDICT} \longrightarrow \text{DETECT} \longrightarrow \text{DECIDE} \longrightarrow \text{ACT} \longrightarrow \text{MEASURE}$$

The dashboard integrates:
1. **Validated Campus Dataset**: 247 Access Points across 3 floors (Floors 0, 1, 2) covering 5,125 native synchronized snapshots ($N = 1,265,875$).
2. **LightGBM Time-Series Forecasts**: $\hat{y}(t+1)$ predicted user load with $\sim 16.6\text{ min}$ lead time (Test RMSE: `0.9154`, $R^2$: `0.7742`, High-load RMSE reduction: `11.43%`).
3. **Stateful Decision Engine**: 4 empirical congestion risk tiers (`NORMAL`, `MODERATE`, `HIGH`, `CRITICAL`) with hysteresis and 2-step cooldown ($39.2\%$ flap reduction).
4. **Controlled Lab Testbed Telemetry**: Validated Linux namespace performance measurements (iperf3 throughput, ICMP latency, jitter, drop-tail loss) comparing Baseline (No QoS), Predictive QoS, and Theoretical Oracle QoS.

---

## 2. Architecture & Data Flow

```mermaid
graph TD
    subgraph Data Sources [Validated Historical Data & Lab Telemetry]
        A[Processed Campus CSVs] --> D[Data Service Layer]
        B[Testbed Telemetry CSVs] --> D
        C[QoS Policy YAML Config] --> D
    end

    subgraph Backend Server [FastAPI REST Service]
        D --> H0[GET /api/health]
        D --> H1[GET /api/system/overview]
        D --> H2[GET /api/aps]
        D --> H3[GET /api/decision/{id}]
        D --> H4[GET /api/aps/{id}/history]
        D --> H5[GET /api/qos/benchmarks]
        D --> H6[GET /api/audit/logs]
        D --> H7[GET /api/system/flow]
    end

    subgraph Client Service Layer [api.js]
        H0 --> API[DashboardAPIService]
        H1 --> API
        H2 --> API
        H3 --> API
        H4 --> API
        H5 --> API
        H6 --> API
        H7 --> API
    end

    subgraph Frontend NOC UI [app.js / index.html]
        API --> K[1. Top Metric Counters]
        API --> L[2. Spatial Campus 247-AP Grid]
        API --> M[3. Chart.js Time-Series Inspector]
        API --> M2[4. Decision Engine State Chips]
        API --> N[5. Closed-Loop QoS Benchmarks & Jitter Table]
        API --> O[6. Policy Audit Log Stream]
        API --> P[7. Last Sync Clock & Auto-Refresh]
    end
```

---

## 3. Frontend Component Breakdown & Data Binding

### 3.1 Header & System Flow Strip
- **Live System Clock**: UTC timestamp updater with pulsing status indicator.
- **NOC Badges**: `CONTROLLED LAB TESTBED` and `PRODUCTION LOCKDOWN ACTIVE` badges.
- **Controls**: Manual `REFRESH` button with rotating indicator, 30s auto-refresh switch, `LAST SYNC` timestamp.
- **Interactive Flow Strip**: Visualizes the 6-stage operational pipeline:
  1. *Data Ingestion* (247 APs)
  2. *LightGBM Forecast* ($y(t+1)$ ~16.6m horizon)
  3. *Risk Classifier* (4 empirical load tiers)
  4. *Decision Engine* (Hysteresis & 2-step cooldown)
  5. *Safe Actuator* (tc/HTB safe dispatcher)
  6. *Controlled Testbed* (Throughput, latency, loss telemetry)

### 3.2 Section 1: System Overview Counters
- **Total Campus APs**: 247 mapped APs across Floor 0 (81), Floor 1 (83), and Floor 2 (83).
- **Empirical Risk Distribution**:
  - `NORMAL (<5 users)`: Baseline clean airtime ($93.26\%$ empirical density).
  - `MODERATE (5-9 users)`: Pre-stage buffer allocation ($3.87\%$ empirical density).
  - `HIGH (10-19 users)`: Proactive 40M HTB traffic shaping ($2.01\%$ empirical density).
  - `CRITICAL (≥20 users)`: Strict 15M rate policing ($0.86\%$ empirical density).
- **ML Performance Card**: LightGBM model metrics (Test RMSE: `0.9154`, $R^2$: `0.7742`, Horizon: `~16.6 min`).

### 3.3 Section 2: Spatial Campus AP Congestion Matrix
- **Interactive 247-Tile Grid**: Displays every AP with ID, floor level, current load $u(t)$, predicted load $\hat{y}(t+1)$, and color-coded risk tier badge.
- **Filtering & Search**:
  - Floor selector: `All Floors`, `Floor 0 (Ground)`, `Floor 1 (Auditoriums)`, `Floor 2 (Labs)`.
  - Risk tier selector: `All`, `NORMAL`, `MODERATE`, `HIGH`, `CRITICAL`.
  - Search bar: Real-time search by AP ID (e.g. `125`, `162`, `42`) or spatial building region.
- **Interaction**: Clicking any tile instantly activates that AP in the Prediction & Decision Engine Inspector.

### 3.4 Section 3 & 4: Prediction & Decision Engine Inspector
- **Header & Quick Selector**: Dropdown selector for rapid navigation between critical APs (e.g., AP 125, AP 162, AP 42, AP 107).
- **Decision Engine Chips (8-Chip Schema)**:
  1. `AP Identifier`: e.g. `AP-125`
  2. `Current Load (u_t)`: e.g. `1.0 users`
  3. `Forecast (y_hat_t+1)`: e.g. `1.0 users`
  4. `Risk Level`: `NORMAL`, `MODERATE`, `HIGH`, `CRITICAL`
  5. `Confidence Status`: `HIGH_CONFIDENCE`, `MEDIUM_CONFIDENCE`, `LOW_CONFIDENCE`
  6. `Recommended Action`: `NO_ACTION`, `MONITOR_AND_PREPARE`, `ENFORCE_HIGH_QOS`, `ENFORCE_CRITICAL_QOS`
  7. `Cooldown Remaining`: `0 snapshots`
  8. `Enforcement Status`: `TESTBED_DRYRUN`
- **Dual-Axis Chart.js Visualization**:
  - *Left Y-Axis (Cyan / Pink)*: Actual future user load $y(t+1)$ vs LightGBM forecast $\hat{y}(t+1)$.
  - *Right Y-Axis (Red / Green)*: Unmanaged baseline latency vs Predictive QoS managed latency in the controlled testbed.

### 3.5 Section 5: Controlled Testbed Closed-Loop QoS Benchmarks
- **Scenario Benchmark Cards**:
  - **Scenario A (Baseline - No QoS)**: Uncontrolled queue experiencing bufferbloat during surges (Mean Throughput: `19.54 Mbps`, Avg/P95 Latency: `1.11 ms / 0.88 ms`, Mean Jitter: `0.26 ms`, Critical Peak Latency: `65.95 ms`, Max Loss: `15.00%`).
  - **Scenario B (Predictive QoS)**: Proactive HTB shaping (Mean Throughput: `16.43 Mbps`, Avg/P95 Latency: `1.28 ms / 5.02 ms`, Mean Jitter: `0.33 ms`, Critical Peak Latency: `11.05 ms` [**83.3% reduction**], Max Loss: `2.00%` [**86.7% reduction**]).
  - **Scenario C (Theoretical Oracle QoS)**: Perfect knowledge bound (Mean Throughput: `16.15 Mbps`, Avg/P95 Latency: `1.35 ms / 5.04 ms`, Mean Jitter: `0.35 ms`, Critical Peak Latency: `11.05 ms`, Max Loss: `2.00%`, latency gap $\le 0.02\text{ ms}$).
- **Regime Telemetry Table**: Full empirical breakdown across `NORMAL`, `MODERATE`, `HIGH`, and `CRITICAL` user load regimes with Jitter columns.

### 3.6 Section 6: Policy Transition & Actuation Audit Log
- **Chronological Stream**: Searchable and filterable table logging all policy transitions.
- **Columns**: Timestamp, AP ID, Previous State, New State, Current Users, Predicted Users, Policy Transition Reason, Enforcement Mode (`TESTBED_DRYRUN`).

---

## 4. REST API Endpoint Specifications

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Service health check, timestamp, and active enforcement mode. |
| `GET` | `/api/system/overview` | Total APs (247), risk tier counts, model metrics ($RMSE = 0.9154, R^2 = 0.7742$), safety mode. |
| `GET` | `/api/aps` | List of 247 APs with spatial coordinates, floor levels, current/predicted loads, and risk tiers. Supports `?floor=` and `?risk=`. |
| `GET` | `/api/aps/{id}` | Detailed metadata and state for a single AP. |
| `GET` | `/api/decision/{id}` | Full `PolicyDecision` schema (load, forecast, risk, confidence, action, cooldown, enforcement, reason). |
| `GET` | `/api/aps/{id}/history` | Chronological time-series snapshots comparing actual vs predicted load, throughput, jitter, and testbed latency. |
| `GET` | `/api/qos/benchmarks` | Empirical scenario metrics across user load regimes and rate calibration trade-offs (including jitter). |
| `GET` | `/api/audit/logs` | Chronological transition events with anti-flap hysteresis rationale. |
| `GET` | `/api/system/flow` | 6-stage operational pipeline metadata. |

---

## 5. Security & Isolation Verification

1. **Zero Production Campus Interaction**:
   - The backend reads exclusively from verified historical CSV files and isolated namespace telemetry.
   - Actuator is locked in `DRY_RUN` mode (`enforcement_enabled: false`).
2. **Explicit UI Labeling**:
   - Every view clearly indicates `[HISTORICAL CAMPUS DATA]`, `[MODEL PREDICTION]`, or `[CONTROLLED NETWORK TESTBED]`.
3. **Resilient Client & Error Handling**:
   - Timeouts handled via AbortController (6s).
   - Connection banners and toasts indicate backend status without unhandled JS exceptions or UI crashing.

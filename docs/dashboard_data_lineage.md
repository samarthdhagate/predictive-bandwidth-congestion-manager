# Dashboard Data Lineage & Provenance Specification

This document maps every metric, telemetry counter, time-series series, and state transition displayed on the **NOC Dashboard** to its corresponding backend API endpoint, data service layer, source CSV/JSON file, and original generating notebook or script.

---

## 1. End-to-End Lineage Matrix

| Dashboard Section | Displayed Metric / Field | UI Element ID / Component | API Endpoint | Backend Data Service Method | Source Data File | Original Generating Notebook / Script |
|---|---|---|---|---|---|---|
| **System Overview** | Total Campus APs (`247`) | `#count-total` | `GET /api/system/overview` | `DashboardDataService.get_system_overview()` | `data/processed/ap_location_mapping.csv` | `prediction/notebooks/03_spatial_analysis.ipynb` |
| **System Overview** | NORMAL Count (`< 5 Users`) | `#count-normal` | `GET /api/system/overview` | `DashboardDataService.get_system_overview()` | `infra/testbed/results/closed_loop_results.csv` | `prediction/notebooks/10_closed_loop_experiment.ipynb` |
| **System Overview** | MODERATE Count (`5–9 Users`) | `#count-moderate` | `GET /api/system/overview` | `DashboardDataService.get_system_overview()` | `infra/testbed/results/closed_loop_results.csv` | `prediction/notebooks/10_closed_loop_experiment.ipynb` |
| **System Overview** | HIGH Count (`10–19 Users`) | `#count-high` | `GET /api/system/overview` | `DashboardDataService.get_system_overview()` | `infra/testbed/results/closed_loop_results.csv` | `prediction/notebooks/10_closed_loop_experiment.ipynb` |
| **System Overview** | CRITICAL Count (`≥ 20 Users`) | `#count-critical` | `GET /api/system/overview` | `DashboardDataService.get_system_overview()` | `infra/testbed/results/closed_loop_results.csv` | `prediction/notebooks/10_closed_loop_experiment.ipynb` |
| **System Overview** | Primary Model (`LightGBM`) | `.model-name-val` | `GET /api/system/overview` | `DashboardDataService.get_system_overview()` | `data/processed/model_comparison_t1.csv` | `prediction/notebooks/07_baseline_models.ipynb` |
| **System Overview** | Test RMSE (`0.9154`) | `#model-rmse` | `GET /api/system/overview` | `DashboardDataService.get_system_overview()` | `data/processed/model_comparison_t1.csv` | `prediction/notebooks/07_baseline_models.ipynb` |
| **System Overview** | Test R² Score (`0.7742`) | `#model-r2` | `GET /api/system/overview` | `DashboardDataService.get_system_overview()` | `data/processed/model_comparison_t1.csv` | `prediction/notebooks/07_baseline_models.ipynb` |
| **System Overview** | Forecast Horizon (`~16.6 min`) | `.card-horizon` | `GET /api/system/overview` | `DashboardDataService.get_system_overview()` | `data/processed/split_metadata.json` | `prediction/notebooks/06_ml_dataset.ipynb` |
| **Spatial Matrix** | 247 AP Grid Matrix | `#ap-matrix` | `GET /api/aps` | `DashboardDataService.get_all_aps()` | `data/processed/ap_location_mapping.csv` | `prediction/notebooks/03_spatial_analysis.ipynb` |
| **Spatial Matrix** | Floor Mapping (Floors 0, 1, 2) | `#floor-select` | `GET /api/aps?floor=` | `DashboardDataService.get_all_aps()` | `data/processed/ap_location_mapping.csv` | `prediction/notebooks/03_spatial_analysis.ipynb` |
| **Spatial Matrix** | Empirical Risk State | `.tier-normal / .tier-high ...` | `GET /api/aps?risk=` | `DashboardDataService.get_all_aps()` | `data/processed/congestion_threshold_analysis.csv` | `prediction/notebooks/08_congestion_risk_analysis.ipynb` |
| **Decision Engine** | AP Identifier (`AP-125`) | `#chip-ap-id` | `GET /api/decision/{id}` | `DashboardDataService.get_decision_status()` | `decision-engine/src/engine.py` | `prediction/notebooks/09_decision_engine_design.ipynb` |
| **Decision Engine** | Current Load $u(t)$ | `#chip-current-users` | `GET /api/decision/{id}` | `DashboardDataService.get_decision_status()` | `infra/testbed/results/closed_loop_results.csv` | `prediction/notebooks/10_closed_loop_experiment.ipynb` |
| **Decision Engine** | Predicted Load $\hat{y}(t+1)$ | `#chip-predicted-users` | `GET /api/decision/{id}` | `DashboardDataService.get_decision_status()` | `infra/testbed/results/closed_loop_results.csv` | `prediction/notebooks/10_closed_loop_experiment.ipynb` |
| **Decision Engine** | Confidence (`HIGH_CONFIDENCE`) | `#chip-confidence` | `GET /api/decision/{id}` | `DashboardDataService.get_decision_status()` | `decision-engine/src/engine.py` | `prediction/notebooks/09_decision_engine_design.ipynb` |
| **Decision Engine** | Recommended QoS Action | `#chip-recommended-action`| `GET /api/decision/{id}` | `DashboardDataService.get_decision_status()` | `infra/testbed/config/qos_policy.yaml` | `prediction/notebooks/09_decision_engine_design.ipynb` |
| **Decision Engine** | Cooldown Steps (`0 snapshots`)| `#chip-cooldown` | `GET /api/decision/{id}` | `DashboardDataService.get_decision_status()` | `decision-engine/src/engine.py` | `prediction/notebooks/09_decision_engine_design.ipynb` |
| **Decision Engine** | Enforcement (`TESTBED_DRYRUN`)| `#chip-enforcement` | `GET /api/decision/{id}` | `DashboardDataService.get_decision_status()` | `infra/testbed/config/qos_policy.yaml` | `decision-engine/src/actuator.py` |
| **Decision Engine** | Policy Hysteresis Reason | `#policy-reason-text` | `GET /api/decision/{id}` | `DashboardDataService.get_decision_status()` | `infra/testbed/results/closed_loop_results.csv` | `prediction/notebooks/09_decision_engine_design.ipynb` |
| **Prediction Telemetry**| Actual Load Curve $y(t+1)$ | `#apHistoryChart` | `GET /api/aps/{id}/history` | `DashboardDataService.get_ap_history()` | `infra/testbed/results/closed_loop_results.csv` | `prediction/notebooks/10_closed_loop_experiment.ipynb` |
| **Prediction Telemetry**| LightGBM Forecast $\hat{y}(t+1)$| `#apHistoryChart` | `GET /api/aps/{id}/history` | `DashboardDataService.get_ap_history()` | `infra/testbed/results/closed_loop_results.csv` | `prediction/notebooks/10_closed_loop_experiment.ipynb` |
| **Prediction Telemetry**| Baseline Latency (No QoS) | `#apHistoryChart` | `GET /api/aps/{id}/history` | `DashboardDataService.get_ap_history()` | `infra/testbed/results/closed_loop_results.csv` | `prediction/notebooks/10_closed_loop_experiment.ipynb` |
| **Prediction Telemetry**| Predictive QoS Latency | `#apHistoryChart` | `GET /api/aps/{id}/history` | `DashboardDataService.get_ap_history()` | `infra/testbed/results/closed_loop_results.csv` | `prediction/notebooks/10_closed_loop_experiment.ipynb` |
| **QoS Benchmarks** | Scenario A Baseline Cards | `#bm-base-*` | `GET /api/qos/benchmarks` | `DashboardDataService.get_qos_benchmarks()` | `data/processed/closed_loop_summary.csv` | `prediction/notebooks/11_closed_loop_validation.ipynb` |
| **QoS Benchmarks** | Scenario B Predictive Cards | `#bm-pred-*` | `GET /api/qos/benchmarks` | `DashboardDataService.get_qos_benchmarks()` | `data/processed/closed_loop_summary.csv` | `prediction/notebooks/11_closed_loop_validation.ipynb` |
| **QoS Benchmarks** | Scenario C Oracle Cards | `#bm-oracle-*` | `GET /api/qos/benchmarks` | `DashboardDataService.get_qos_benchmarks()` | `data/processed/closed_loop_summary.csv` | `prediction/notebooks/11_closed_loop_validation.ipynb` |
| **QoS Benchmarks** | 12-Row Regime Comparison Table | `#regime-table-body` | `GET /api/qos/benchmarks` | `DashboardDataService.get_qos_benchmarks()` | `data/processed/regime_comparison.csv` | `prediction/notebooks/11_closed_loop_validation.ipynb` |
| **QoS Benchmarks** | Critical Latency Reduction (-83.3%)| `.qos-tradeoff-banner` | `GET /api/qos/benchmarks` | `DashboardDataService.get_qos_benchmarks()` | `data/processed/regime_comparison.csv` | `prediction/notebooks/11_closed_loop_validation.ipynb` |
| **QoS Benchmarks** | Critical Loss Reduction (-86.7%) | `.qos-tradeoff-banner` | `GET /api/qos/benchmarks` | `DashboardDataService.get_qos_benchmarks()` | `data/processed/regime_comparison.csv` | `prediction/notebooks/11_closed_loop_validation.ipynb` |
| **Audit Logs** | Chronological Transition Stream | `#audit-log-body` | `GET /api/audit/logs` | `DashboardDataService.get_audit_logs()` | `infra/testbed/results/policy_transitions.csv` | `prediction/notebooks/10_closed_loop_experiment.ipynb` |

---

## 2. Dataset & Artifact Verification

All source files are persisted in the repository and verified against ground-truth hashes and row counts:

1. **`data/processed/campus_users_with_location.csv`**:
   - Total Rows: $1,265,875$ ($247\text{ APs} \times 5,125\text{ Snapshots}$).
   - Date Span: $2023-04-18\text{ 00:00:00}$ to $2023-06-18\text{ 23:24:00}$.
2. **`data/processed/ml_dataset_t1.csv`**:
   - Total Rows: $1,265,875 \times 31\text{ columns}$.
   - Partitioning: $70\%$ Train ($885,989$), $15\%$ Validation ($189,696$), $15\%$ Test ($190,190$).
3. **`infra/testbed/results/closed_loop_results.csv`**:
   - Total Rows: $9,240$ records spanning Baseline, Predictive, and Oracle executions across 4 deep-probe APs ($107, 125, 162, 42$).
4. **`infra/testbed/results/policy_transitions.csv`**:
   - Total Rows: $206$ logged policy state transitions with dual-threshold hysteresis tracking.

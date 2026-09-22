# Predictive WiFi Congestion Management — Reproducibility & Execution Guide

This document provides complete instructions to reproduce every stage of the project: from data processing and chronological machine learning modeling to isolated Linux testbed actuation and live NOC dashboard deployment.

---

## 1. System Requirements & Environment

- **Operating System**: Linux (Ubuntu 22.04 LTS recommended for network namespace actuation) or Windows 10/11 (with WSL2 for namespace simulation).
- **Python Runtime**: Python 3.10 or higher.
- **Key Python Libraries**:
  - `fastapi>=0.110.0`
  - `uvicorn>=0.28.0`
  - `pandas>=2.0.0`
  - `numpy>=1.24.0`
  - `lightgbm>=4.0.0`
  - `scikit-learn>=1.3.0`
  - `pyyaml>=6.0.0`
  - `httpx>=0.27.0`

---

## 2. Environment Setup

### 2.1 Clone Repository & Initialize Virtual Environment

```bash
# Clone the repository
git clone <repository_url>
cd predictive-bandwidth-congestion-manager

# Create and activate virtual environment
python -m venv .venv

# On Linux / macOS:
source .venv/bin/activate

# On Windows PowerShell:
.venv\Scripts\Activate.ps1
```

### 2.2 Install Dependencies

```bash
pip install --upgrade pip
pip install fastapi uvicorn pandas numpy lightgbm scikit-learn pyyaml httpx
```

---

## 3. End-to-End Pipeline Execution Sequence

### Stage 1: Spatial Aggregation & Feature Engineering
- **Notebook**: `prediction/notebooks/03_spatial_analysis.ipynb`
- **Script**: `prediction/src/feature_engineering.py`
- **Output**: `data/processed/campus_users_with_location.csv` (247 APs $\times$ 5,125 snapshots)

### Stage 2: ML-Ready Dataset Construction & Chronological Split
- **Notebook**: `prediction/notebooks/06_ml_dataset.ipynb`
- **Split**: Train (70%, $N=885,989$), Validation (15%, $N=189,696$), Test (15%, $N=190,190$)
- **Outputs**: `data/processed/ml_dataset_t1.csv`, `data/processed/split_metadata.json`

### Stage 3: Baseline & LightGBM Model Training
- **Notebook**: `prediction/notebooks/07_baseline_models.ipynb`
- **Script**: `prediction/src/model_training.py`
- **Outputs**: `data/processed/model_comparison_t1.csv` ($RMSE = 0.9154, R^2 = 0.7742$), `data/processed/feature_importance_t1.csv`

### Stage 4: Congestion Risk Classification & Decision Engine
- **Notebooks**: `prediction/notebooks/08_congestion_risk_analysis.ipynb`, `09_decision_engine_design.ipynb`
- **Modules**: `prediction/src/decision_engine.py`, `decision-engine/src/engine.py`
- **Outputs**: `data/processed/congestion_threshold_analysis.csv`, `data/processed/congestion_model_comparison.csv`

### Stage 5: Controlled Network Testbed & Closed-Loop Validation
- **Testbed Setup Script** (Linux root):
  ```bash
  sudo bash infra/testbed/scripts/setup.sh
  ```
- **Run End-to-End Closed-Loop Simulation**:
  ```bash
  python infra/testbed/scripts/run_closed_loop.py
  ```
- **Testbed Cleanup Script**:
  ```bash
  sudo bash infra/testbed/scripts/cleanup.sh
  ```
- **Outputs**: `infra/testbed/results/closed_loop_results.csv`, `data/processed/closed_loop_summary.csv`, `data/processed/regime_comparison.csv`, `data/processed/closed_loop_validation.csv`

---

## 4. Launching the NOC Dashboard

The FastAPI backend serves both the REST API endpoints and static frontend UI assets:

```bash
# Launch server on localhost port 8000
python -m uvicorn dashboard.backend.app:app --host 127.0.0.1 --port 8000 --reload
```

### Access URLs:
- **NOC Dashboard Frontend**: [`http://127.0.0.1:8000/`](http://127.0.0.1:8000/)
- **Swagger Interactive API Documentation**: [`http://127.0.0.1:8000/docs`](http://127.0.0.1:8000/docs)
- **OpenAPI Schema**: [`http://127.0.0.1:8000/openapi.json`](http://127.0.0.1:8000/openapi.json)

---

## 5. Automated Verification & Testing

Verify that all backend endpoints and static files are operational:

```bash
python -c "from fastapi.testclient import TestClient; from dashboard.backend.app import app; client = TestClient(app); print('API Health:', client.get('/api/health').json()['status']); print('Overview APs:', client.get('/api/system/overview').json()['total_aps']); print('Decision Engine 125:', client.get('/api/decision/125').json()['risk_level']); print('Index UI:', client.get('/').status_code)"
```

Expected Output:
```
API Health: HEALTHY
Overview APs: 247
Decision Engine 125: NORMAL
Index UI: 200
```

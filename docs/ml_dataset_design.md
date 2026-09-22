# ML-Ready Dataset & Chronological Split Design

**Project**: Predictive Bandwidth & WiFi Congestion Manager  
**Phase**: Phase 2 — Step 2: ML-Ready Dataset & Chronological Split  
**Status**: Completed & Validated  
**Artifacts Generated**:
- `data/processed/ml_dataset_t1.csv`
- `data/processed/ml_dataset_t2.csv`
- `data/processed/split_metadata.json`

---

## 1. Overview & Objectives

This document specifies the exact dataset structure, boundary filtering rules, target alignments, and chronological splitting protocol implemented to prepare the multi-AP campus telemetry for baseline and deep learning model training.

### Core Objectives:
1. **Target Construction**: Construct primary target $y_{t+1}$ (lead time $\approx 16.6$ min) and secondary target $y_{t+2}$ (lead time $\approx 33.3$ min) per Access Point without lookahead error.
2. **Causal Feature Extraction**: Compute the 23 approved baseline features using strictly historical and concurrent data at timestamp $t$.
3. **Deterministic Boundary Handling**: Cleanly prune uninitialized historical boundary rows and trailing target boundaries without synthetic imputation.
4. **Chronological Splitting (70% / 15% / 15%)**: Partition data by timestamp groups to guarantee zero temporal data leakage across train, validation, and test splits.

---

## 2. Final Feature Set (23 Features)

The final baseline feature store contains **23 features** across 5 functional categories:

| Index | Feature Name | Category | Type | Definition / Mathematical Formula | Rationale & Correlation ($r$ with $y_{t+1}$) |
| :---: | :--- | :--- | :--- | :--- | :--- |
| **1** | `users` | Current State | Continuous (Int) | $u_{i,t}$ | Most recent observed load at AP $i$ at time $t$ ($r = +0.9139$). |
| **2** | `users_lag_1` | AP Historical | Continuous (Int) | $u_{i,t-1}$ | Load 1 step prior ($\approx 17$m ago, $r = +0.8274$). |
| **3** | `users_lag_2` | AP Historical | Continuous (Int) | $u_{i,t-2}$ | Load 2 steps prior ($\approx 34$m ago, $r = +0.7454$). |
| **4** | `users_lag_3` | AP Historical | Continuous (Int) | $u_{i,t-3}$ | Load 3 steps prior ($\approx 51$m ago, $r = +0.6710$). |
| **5** | `rolling_mean_3` | AP Historical | Continuous (Float) | $\frac{1}{3}\sum_{k=0}^{2} u_{i,t-k}$ | Smoothed short-term moving average over past ~50 min ($r = +0.8626$). |
| **6** | `rolling_mean_6` | AP Historical | Continuous (Float) | $\frac{1}{6}\sum_{k=0}^{5} u_{i,t-k}$ | Smoothed medium-term moving average over past ~100 min ($r = +0.7840$). |
| **7** | `rolling_std_3` | AP Historical | Continuous (Float) | $\sigma(u_{i,[t-2:t]})$ | Short-term arrival volatility / user churn ($r = +0.5352$). |
| **8** | `rolling_std_6` | AP Historical | Continuous (Float) | $\sigma(u_{i,[t-5:t]})$ | Medium-term volatility ($r = +0.6061$). |
| **9** | `rolling_max_6` | AP Historical | Continuous (Int) | $\max(u_{i,[t-5:t]})$ | Peak burst load capacity observed in past ~100 min ($r = +0.7853$). |
| **10** | `users_change_1` | AP Historical | Continuous (Int) | $u_{i,t} - u_{i,t-1}$ | Instantaneous arrival velocity ($r = +0.2085$). |
| **11** | `users_change_2` | AP Historical | Continuous (Int) | $u_{i,t} - u_{i,t-2}$ | Medium-term arrival acceleration ($r = +0.2869$). |
| **12** | `floor` | Spatial | Categorical (Int) | $\text{floor} \in \{0, 1, 2\}$ | Structural building floor level. |
| **13** | `centroid_x` | Spatial | Continuous (Float) | $X_{\text{mean}} \in [0, 125]$ | Physical horizontal centroid on building floor grid. |
| **14** | `centroid_y` | Spatial | Continuous (Float) | $Y_{\text{mean}} \in [0, 335]$ | Physical vertical centroid on building floor grid. |
| **15** | `coverage_cells` | Spatial | Continuous (Int) | $A_i \in [57, 1129]$ | Physical area of AP coverage polygon. |
| **16** | `neighbor_mean_users`| Neighborhood | Continuous (Float) | $\frac{1}{3}\sum_{j \in \mathcal{N}_3(i)} u_{j,t}$ | Average load among $k=3$ nearest APs on same floor at time $t$ ($r = +0.4264$). |
| **17** | `neighbor_max_users` | Neighborhood | Continuous (Int) | $\max_{j \in \mathcal{N}_3(i)} u_{j,t}$ | Peak load among $k=3$ nearest APs on same floor at time $t$ ($r = +0.3989$). |
| **18** | `campus_total_users`| Macro Dynamic | Continuous (Int) | $\sum_{j=1}^{247} u_{j,t}$ | Total active user connections across all 247 APs at time $t$ ($r = +0.3791$). |
| **19** | `floor_total_users` | Macro Dynamic | Continuous (Int) | $\sum_{j \in \text{Floor}(i)} u_{j,t}$ | Total active user connections on AP $i$'s floor at time $t$ ($r = +0.3910$). |
| **20** | `cos_hour` | Temporal | Continuous (Float) | $\cos\left(\frac{2\pi(\text{hour} + \text{min}/60)}{24}\right)$ | Cyclical diurnal phase (night vs day separation, $r = -0.2274$). |
| **21** | `sin_hour` | Temporal | Continuous (Float) | $\sin\left(\frac{2\pi(\text{hour} + \text{min}/60)}{24}\right)$ | Cyclical diurnal phase (morning vs afternoon progression). |
| **22** | `is_weekend` | Temporal | Binary ($\{0, 1\}$) | $\mathbb{I}(\text{dayofweek} \ge 5)$ | Weekend traffic indicator ($r = -0.1248$). |
| **23** | `is_peak_hours` | Temporal | Binary ($\{0, 1\}$) | $\mathbb{I}(\text{weekday} \land 8 \le \text{hour} \le 20)$ | Academic operational hours indicator ($r = +0.2450$). |

---

## 3. Prediction Target Definitions

1. **Primary Target (`target_t1`)**:
   $$y_{i,t+1} = u_{i, t+1}$$
   - Represents the user count of AP $i$ at the immediately following temporal snapshot.
   - Lead time: Median **16.62 minutes** ($\mu = 17.40$ minutes, min 15.83m, max 35.83m).

2. **Secondary Target (`target_t2`)**:
   $$y_{i,t+2} = u_{i, t+2}$$
   - Represents the user count of AP $i$ two temporal snapshots ahead.
   - Lead time: Median **33.27 minutes** ($\mu = 34.80$ minutes).

---

## 4. Boundary Filtering & Usable Rows

Generating lag/rolling windows and forward targets creates natural uninitialized edge cases at the boundaries of the time series:

```
[Initial Boundary (5 snapshots)]                   [Valid Usable Observations]                   [Trailing Target Boundary]
t=0, 1, 2, 3, 4 (NaN in rolling_6)  ------>   t=5, 6, 7 ... T-2 (Complete Features & Targets)   ------>   t=T-1 (NaN in target_t1)
                                                                                                           t=T-2, T-1 (NaN in target_t2)
```

### Boundary Accounting:
- **Raw Integrated Rows**: $1,267,357$ (5,131 snapshots $\times$ 247 APs)
- **Dataset T1 (`ml_dataset_t1.csv`)**:
  - Initial boundary rows pruned: $5 \text{ snapshots} \times 247 \text{ APs} = 1,235 \text{ rows}$
  - Trailing target boundary pruned: $1 \text{ snapshot} \times 247 \text{ APs} = 247 \text{ rows}$
  - Total pruned: **$1,482 \text{ rows}$** ($0.117\%$)
  - **Final Usable Rows**: **$1,265,875 \text{ rows}$** (**$99.883\%$** retention across 5,125 snapshots).
- **Dataset T2 (`ml_dataset_t2.csv`)**:
  - Initial boundary rows pruned: $5 \text{ snapshots} \times 247 \text{ APs} = 1,235 \text{ rows}$
  - Trailing target boundary pruned: $2 \text{ snapshots} \times 247 \text{ APs} = 494 \text{ rows}$
  - Total pruned: **$1,729 \text{ rows}$** ($0.136\%$)
  - **Final Usable Rows**: **$1,265,628 \text{ rows}$** (**$99.864\%$** retention across 5,124 snapshots).

---

## 5. Chronological Splitting Protocol

Splitting is strictly **timestamp-based**. Because all 247 APs are observed simultaneously at each snapshot, splitting by timestamp preserves all simultaneous network states in the same partition.

### Split Ratios (70% / 15% / 15%):

```
+--------------------------------------------------------------------+--------------------------+--------------------------+
|                        TRAIN SET (70%)                             |      VALIDATION (15%)    |        TEST SET (15%)    |
|               3,587 Timestamps (885,989 Rows)                      | 768 Timestamps (189,696) | 770 Timestamps (190,190) |
|               2023-04-18 01:30 -> 2023-05-29 15:26                 | 2023-05-29 -> 2023-06-07 | 2023-06-07 -> 2023-06-18 |
+--------------------------------------------------------------------+--------------------------+--------------------------+
```

### Exact Partition Bounds (Dataset T1):
- **Training Set (69.99%)**:
  - Timestamps: **3,587**
  - Observations: **885,989 rows**
  - Start Timestamp: `2023-04-18 01:30:28`
  - End Timestamp: `2023-05-29 15:26:44`
- **Validation Set (14.99%)**:
  - Timestamps: **768**
  - Observations: **189,696 rows**
  - Start Timestamp: `2023-05-29 15:43:18`
  - End Timestamp: `2023-06-07 15:57:25`
- **Test Set (15.02%)**:
  - Timestamps: **770**
  - Observations: **190,190 rows**
  - Start Timestamp: `2023-06-07 16:14:44`
  - End Timestamp: `2023-06-18 23:24:00`

---

## 6. Temporal Leakage Verification

Temporal isolation between partitions was strictly verified:

1. $\max(\text{Train Timestamp}) = \text{2023-05-29 15:26:44} < \min(\text{Val Timestamp}) = \text{2023-05-29 15:43:18}$ ($\Delta = +16.57$ min) $\rightarrow$ **NO LEAKAGE (TRUE)**
2. $\max(\text{Val Timestamp}) = \text{2023-06-07 15:57:25} < \min(\text{Test Timestamp}) = \text{2023-06-07 16:14:44}$ ($\Delta = +17.32$ min) $\rightarrow$ **NO LEAKAGE (TRUE)**

---

## 7. Distribution Stability Across Splits

| Metric | Train Set ($\mu \pm \sigma$) | Validation Set ($\mu \pm \sigma$) | Test Set ($\mu \pm \sigma$) | Distribution Stability |
| :--- | :---: | :---: | :---: | :--- |
| `users` | $1.41 \pm 3.12$ | $1.48 \pm 3.25$ | $0.98 \pm 2.41$ | Expected academic calendar drop in mid-June (exam period). |
| `target_t1` | $1.41 \pm 3.12$ | $1.48 \pm 3.25$ | $0.98 \pm 2.41$ | Identical to current state distribution. |
| `campus_total_users` | $348.6 \pm 384.2$ | $364.5 \pm 397.8$ | $241.9 \pm 312.4$ | Reflects campus-wide traffic pattern over semester lifecycle. |
| `rolling_mean_3` | $1.41 \pm 3.03$ | $1.48 \pm 3.15$ | $0.98 \pm 2.34$ | Consistent across all splits. |
| `neighbor_mean_users` | $1.41 \pm 2.11$ | $1.48 \pm 2.20$ | $0.98 \pm 1.63$ | Consistent local spatial alignment. |

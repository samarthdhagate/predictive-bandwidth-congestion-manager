# Phase 2 — Step 5: Decision Engine Design Document

## 1. Executive Summary & Verification Audit

This document establishes the architecture, mathematical formulation, and operational logic for the **Predictive Congestion Decision Engine**.

```text
+----------------------------------------------------------------------------------------------------+
|                                    DECISION ENGINE PIPELINE                                        |
+----------------------------------------------------------------------------------------------------+
|                                                                                                    |
|   [ 1. ML Forecast Ingress ]        [ 2. Risk Classification ]       [ 3. Stateful Decision Engine ]|
|   y_hat(t+1) Lead ~16.6m         -> Grounded in Empirical         -> Dual-Threshold Hysteresis      |
|   (LightGBM Primary Model)          Percentile Tiers                 + Cooldown Dampener Window    |
|                                                                                 |                  |
|                                                                                 v                  |
|   [ 5. Controlled Testbed ]         [ 4. Action Dispatcher ]        [ Policy Output Schema ]        |
|   Isolated Linux tc / HTB Queue  <- Safe Actuation Driver        <- Structured JSON Audit Record   |
|   (Zero Production Contact)         (Global Kill-Switch)                                           |
|                                                                                                    |
+----------------------------------------------------------------------------------------------------+
```

---

## 2. Verification & Correction of Step 4 Metrics

### 2.1 Training Set Empirical Percentiles ($N = 885,989$)
We re-verified the exact empirical percentile ranks on the training partition:

| Threshold | Training Observations | Dataset Fraction (%) | Exact Percentile Rank |
| :--- | :---: | :---: | :---: |
| $\ge 1$ user | 427,365 | 48.24% | **$51.76\text{th}$ percentile** |
| $\ge 2$ users | 267,867 | 30.23% | **$69.77\text{th}$ percentile** |
| $\ge 3$ users | 119,052 | 13.44% | **$86.56\text{th}$ percentile** |
| $\ge 5$ users | 59,703 | 6.74% | **$93.26\text{th}$ percentile** |
| $\ge 10$ users | 25,399 | 2.87% | **$97.13\text{th}$ percentile** |
| $\ge 15$ users | 13,809 | 1.56% | **$98.44\text{th}$ percentile** |
| $\ge 20$ users | 7,640 | 0.86% | **$99.14\text{th}$ percentile** |
| $\ge 24$ users | 4,457 | 0.50% | **$99.50\text{th}$ percentile** |
| $\ge 30$ users | 1,817 | 0.21% | **$99.79\text{th}$ percentile** |

*Correction Note: $\ge 10$ users is verified as the **$97.13\text{th}$ percentile**, and $\ge 20$ users is verified as the **$99.14\text{th}$ percentile**.*

### 2.2 Early Warning Confusion Matrix & Precision Breakdown
Evaluating directional increases ($y_{t+1} > u_t$) on the test set ($N = 190,190$):

- **Actual Increase Events**: $11,930$ ($6.27\%$ of observations)
- **Actual Constant / Decreasing Events**: $178,260$ ($93.73\%$ of observations)

| Model | TP | FP | FN | TN | Recall (%) | Precision (%) | F1-Score (%) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Persistence** | 0 | 0 | 11,930 | 178,260 | **0.00%** | **0.00%** | **0.00%** |
| **Random Forest** | 9,053 | 134,445 | 2,877 | 43,815 | **75.88%** | **6.31%** | **11.65%** |
| **LightGBM** | 8,927 | 126,053 | 3,003 | 52,207 | **74.83%** | **6.61%** | **12.15%** |

#### Why Naive Sign Precision is 6.61%:
Continuous regression models minimize squared error and predict small positive decimal fractions ($\hat{y} \in [0.05, 0.20]$) during quiet zero-load snapshots ($u = 0$). Since $0.05 > 0$, the uncalibrated naive sign check ($\hat{y} > u$) triggers $134,980$ times.
When an operational delta threshold is applied (e.g. $\hat{y}_{t+1} - u_t \ge 0.5$ users), precision increases to **$33.30\%$** with $1,082$ confirmed surges caught.

---

## 3. Operational Risk States & Decision Tiers

| Risk State | Predicted Load Range ($\hat{y}$) | Empirical Percentile | Operational Policy Action |
| :--- | :---: | :---: | :--- |
| **`NORMAL`** | $\hat{y} < 5.0$ users | $< 93.26\text{th}$ | `NO_ACTION` — Default baseline network routing and queuing. |
| **`MODERATE`** | $5.0 \le \hat{y} < 10.0$ users | $93.26\text{th} - 97.13\text{th}$ | `MONITOR_AND_PREPARE` — Increased telemetry polling; pre-stage QoS class buffers. |
| **`HIGH`** | $10.0 \le \hat{y} < 20.0$ users | $97.13\text{th} - 99.14\text{th}$ | `ENFORCE_HIGH_QOS` — Proactive bandwidth shaping; prioritize interactive/academic traffic. |
| **`CRITICAL`** | $\hat{y} \ge 20.0$ users | $\ge 99.14\text{th}$ | `ENFORCE_CRITICAL_QOS` — Strict class throttling; active client load-balancing recommendation. |

---

## 4. Hysteresis & Anti-Flapping Strategy

To prevent high-frequency policy oscillation (flapping) caused by minor prediction noise:

```text
       [ NORMAL ] <--- (exit: < 4.0) ---+
           |                             |
     (enter: >= 5.0)               [ MODERATE ] <--- (exit: < 8.0) ---+
           |                             |                             |
           +---------------------> (enter: >= 10.0)                 [ HIGH ] <--- (exit: < 17.0) ---+
                                         |                             |                             |
                                         +---------------------> (enter: >= 20.0)               [ CRITICAL ]
```

1. **Dual-Threshold Bounds**:
   - `MODERATE`: Entry $\ge 5.0$, Exit $< 4.0$
   - `HIGH`: Entry $\ge 10.0$, Exit $< 8.0$
   - `CRITICAL`: Entry $\ge 20.0$, Exit $< 17.0$
2. **Asymmetric Cooldown Dampening**:
   - **Escalation**: Immediate ($0$ delay) to preempt QoS degradation.
   - **De-escalation**: Requires $K = 2$ consecutive snapshots ($\approx 33.2$ minutes) of sustained sub-exit load before lower-tier policy actions are enacted.

---

## 5. Policy Output Schema

Every policy evaluation emits a deterministic, structured record:

| Field Name | Type | Description |
| :--- | :--- | :--- |
| `timestamp` | String (ISO) | Snapshot timestamp ($t$). |
| `ap_id` | Integer | Unique Access Point identifier ($1 - 247$). |
| `current_users` | Float | Current observed user load ($u_t$). |
| `predicted_users`| Float | Forecasted user load ($\hat{y}_{t+1}$). |
| `risk_level` | String (Enum) | Current state: `NORMAL`, `MODERATE`, `HIGH`, `CRITICAL`. |
| `confidence_status` | String | Forecast validity flag (`HIGH_CONFIDENCE`, `DEGRADED`). |
| `recommended_action`| String (Enum) | `NO_ACTION`, `MONITOR_AND_PREPARE`, `ENFORCE_HIGH_QOS`, `ENFORCE_CRITICAL_QOS`. |
| `policy_reason` | String | Human-readable explanation and boundary audit trail. |
| `cooldown_remaining`| Integer | Active dampening countdown ($0 - 2$). |
| `enforcement_enabled`| Boolean | Global safety switch status. |

---

## 6. Full Test Set Simulation Results ($N = 190,190$)

Across all 247 APs during the test period (**2023-06-07 16:14:44 to 2023-06-18 23:24:00**):

| Metric | Raw Instantaneous Classification | Hysteresis Decision Engine | Stability Gain |
| :--- | :---: | :---: | :---: |
| **Total State Transitions (Flaps)** | $2,842$ | **$1,728$** | **$39.20\%$ Flap Reduction** |
| **`NO_ACTION` Decisions** | 185,992 (97.80%) | 185,410 (97.49%) | Stable baseline |
| **`MONITOR_AND_PREPARE` Decisions** | 3,480 (1.83%) | 3,842 (2.02%) | Smooth buffer staging |
| **`ENFORCE_HIGH_QOS` Decisions** | 576 (0.30%) | 782 (0.41%) | Sustained QoS protection |
| **`ENFORCE_CRITICAL_QOS` Decisions**| 142 (0.07%) | 156 (0.08%) | Guaranteed congestion clearance |

---

## 7. Controlled Network Testbed Integration & Safety Architecture

```text
[ Decision Engine ]
        │ (Policy Decision JSON Stream)
        ▼
[ Safe Actuator Dispatcher ]
        │ (Safety Filter & Kill-Switch Validation)
        ▼
[ Isolated Linux Router Testbed ]
  ├── Device eth0 (Client Emulators)
  ├── Linux TC (Traffic Control) + HTB Queues
  │     ├── Class 10: Default Best-Effort (NORMAL)
  │     ├── Class 20: Pre-Allocated Reserve (MODERATE)
  │     ├── Class 30: Rate-Limited Scavenger + Priority Video (HIGH)
  │     └── Class 40: Strict Shaping + Client Steering (CRITICAL)
  └── Device eth1 (WAN Emulation via NetEm)
```

### Safety Constraints:
1. **Strict Zero-Production Rule**: Actuation commands operate strictly on virtual lab network interfaces; campus production AP controllers are never targeted.
2. **Deterministic Rules**: No stochastic or black-box policy logic; every action is purely state-machine driven.
3. **Global Safety Switch**: `enforcement_enabled = False` by default. Can be overridden manually or via automated watchdog.
4. **Structured Audit Trail**: Every policy decision is permanently appended to a structured log file with timestamp and reason.

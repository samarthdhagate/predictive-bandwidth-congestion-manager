# Predictive Decision Engine for WiFi Congestion Management

The **Decision Engine** converts forecasts of Access Point user loads into deterministic, oscillation-dampened QoS policy decisions for controlled testbed actuation.

```text
+----------------------------------------------------------------------------------------------------+
|                                    DECISION ENGINE ARCHITECTURE                                    |
+----------------------------------------------------------------------------------------------------+
|                                                                                                    |
|   [ ML Forecast ]            [ Risk Classifier ]           [ Stateful Hysteresis ]                 |
|   y_hat(t+1) Lead ~16.6m  -> NORMAL / MODERATE /       ->  Dual-Threshold Bounds   -> Policy       |
|                              HIGH / CRITICAL               + Cooldown Dampener        Decision     |
|                                                                                          |         |
|                                                                                          v         |
|   [ Controlled Testbed ]     [ Action Dispatcher ]                                  Structured     |
|   Linux tc / HTB Queue    <- Safe Actuator Interface   <--------------------------  Audit Log      |
|   (Isolated Sandbox)         (Global Kill-Switch)                                                  |
|                                                                                                    |
+----------------------------------------------------------------------------------------------------+
```

---

## 1. Operational Risk States & Decision Tiers

Tiers are grounded directly in the training set empirical load distribution ($N = 885,989$):

| Risk State | Predicted Load ($\hat{y}_{t+1}$) | Training Percentile Rank | Conceptual QoS Policy Action |
| :--- | :---: | :---: | :--- |
| **`NORMAL`** | $\hat{y} < 5.0$ users | $< 93.26\text{th}$ percentile | `NO_ACTION` — Default baseline queuing. |
| **`MODERATE`** | $5.0 \le \hat{y} < 10.0$ users | $93.26\text{th} - 97.13\text{th}$ percentile | `MONITOR_AND_PREPARE` — Enhanced telemetry, pre-stage QoS class buffers. |
| **`HIGH`** | $10.0 \le \hat{y} < 20.0$ users | $97.13\text{th} - 99.14\text{th}$ percentile | `ENFORCE_HIGH_QOS` — Proactive traffic shaping & latency-sensitive prioritization. |
| **`CRITICAL`** | $\hat{y} \ge 20.0$ users | $\ge 99.14\text{th}$ percentile | `ENFORCE_CRITICAL_QOS` — Strict class throttling, active load balancing / steering. |

---

## 2. Hysteresis & Cooldown Anti-Flapping Strategy

To prevent high-frequency policy oscillation (rapidly toggling bandwidth allocations when predictions hover near a threshold), the engine enforces:

1. **Dual-Threshold Asymmetric Bounds**:
   - `MODERATE`: Enter $\ge 5.0$, Exit $< 4.0$
   - `HIGH`: Enter $\ge 10.0$, Exit $< 8.0$
   - `CRITICAL`: Enter $\ge 20.0$, Exit $< 17.0$
2. **Asymmetric State Transitions**:
   - **Upward Transitions (Escalation)**: Immediate ($0$ snapshot delay) to protect user experience proactively.
   - **Downward Transitions (De-escalation)**: Gated by a $K=2$ snapshot cooldown timer ($\approx 33.2$ minutes) ensuring sustained load clearance.

---

## 3. Structured Policy Output Schema

Every decision emitted by the engine adheres to a standardized audit schema:

```json
{
  "timestamp": "2023-06-08 11:57:12",
  "ap_id": 125,
  "current_users": 26.0,
  "predicted_users": 25.2,
  "risk_level": "CRITICAL",
  "confidence_status": "HIGH_CONFIDENCE",
  "recommended_action": "ENFORCE_CRITICAL_QOS",
  "policy_reason": "Predicted load (25.2) >= Critical threshold (20.0)",
  "cooldown_remaining": 2,
  "enforcement_enabled": false
}
```

---

## 4. Controlled Testbed Integration & Safety Constraints

- **Strict Testbed Isolation**: Actuation targets an isolated Linux testbed router running traffic control (`tc`/HTB/NetEm) in a simulation sandbox.
- **No Production Changes**: Zero commands or packets are sent to production campus network infrastructure.
- **Global Kill-Switch**: Enforcement is disabled by default (`enforcement_enabled = False`). When disabled, decisions are safely logged without testbed actuation.
- **Deterministic Traceability**: All policies are deterministic state machines with verifiable audit logs.

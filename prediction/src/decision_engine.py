"""
Decision Engine for Predictive Bandwidth & Congestion Management.

Converts predicted AP user loads into deterministic, oscillation-dampened
QoS policy decisions for controlled testbed actuation.
"""

from dataclasses import dataclass, asdict
from enum import Enum
from typing import Dict, List, Optional, Any
import pandas as pd
import numpy as np


class RiskLevel(str, Enum):
    NORMAL = "NORMAL"
    MODERATE = "MODERATE"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class QoSAction(str, Enum):
    NO_ACTION = "NO_ACTION"
    MONITOR_AND_PREPARE = "MONITOR_AND_PREPARE"
    ENFORCE_HIGH_QOS = "ENFORCE_HIGH_QOS"
    ENFORCE_CRITICAL_QOS = "ENFORCE_CRITICAL_QOS"


@dataclass
class PolicyDecision:
    timestamp: str
    ap_id: int
    current_users: float
    predicted_users: float
    risk_level: str
    confidence_status: str
    recommended_action: str
    policy_reason: str
    cooldown_remaining: int
    enforcement_enabled: bool = False

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


class DecisionEngine:
    """
    Stateful Decision Engine managing per-AP risk state transitions
    with dual-threshold hysteresis and cooldown dampening to eliminate policy flapping.
    """

    def __init__(
        self,
        mod_thresh: float = 5.0,
        high_thresh: float = 10.0,
        crit_thresh: float = 20.0,
        exit_mod: float = 4.0,
        exit_high: float = 8.0,
        exit_crit: float = 17.0,
        cooldown_steps: int = 2,
        enforcement_enabled: bool = False
    ):
        """
        Initialize the Decision Engine with operational thresholds.

        Parameters:
        - mod_thresh: Predicted load entry threshold for MODERATE tier (93.26th percentile)
        - high_thresh: Predicted load entry threshold for HIGH tier (97.13th percentile)
        - crit_thresh: Predicted load entry threshold for CRITICAL tier (99.14th percentile)
        - exit_mod: Downward exit threshold for MODERATE -> NORMAL
        - exit_high: Downward exit threshold for HIGH -> MODERATE
        - exit_crit: Downward exit threshold for CRITICAL -> HIGH
        - cooldown_steps: Number of consecutive observations required before de-escalation
        - enforcement_enabled: Global safety switch for testbed execution (False by default)
        """
        self.mod_thresh = mod_thresh
        self.high_thresh = high_thresh
        self.crit_thresh = crit_thresh
        self.exit_mod = exit_mod
        self.exit_high = exit_high
        self.exit_crit = exit_crit
        self.cooldown_steps = cooldown_steps
        self.enforcement_enabled = enforcement_enabled

        # Per-AP state tracking: ap_id -> {'state': RiskLevel, 'cooldown': int, 'prev_state': RiskLevel}
        self.ap_states: Dict[int, Dict[str, Any]] = {}

    def reset(self):
        """Reset internal state tracking for all APs."""
        self.ap_states.clear()

    def evaluate_observation(
        self,
        ap_id: int,
        timestamp: str,
        current_users: float,
        predicted_users: float,
        confidence_status: str = "HIGH_CONFIDENCE"
    ) -> PolicyDecision:
        """
        Evaluate a single AP snapshot and determine the appropriate QoS policy decision.
        """
        if ap_id not in self.ap_states:
            self.ap_states[ap_id] = {
                'state': RiskLevel.NORMAL,
                'cooldown': 0,
                'prev_state': RiskLevel.NORMAL
            }

        cur_state: RiskLevel = self.ap_states[ap_id]['state']
        cooldown: int = self.ap_states[ap_id]['cooldown']
        new_state = cur_state
        reason = ""
        action = QoSAction.NO_ACTION

        # --- UPWARD TRANSITIONS (Immediate Escalation) ---
        if predicted_users >= self.crit_thresh:
            new_state = RiskLevel.CRITICAL
            action = QoSAction.ENFORCE_CRITICAL_QOS
            reason = f"Predicted load ({predicted_users:.1f}) >= Critical threshold ({self.crit_thresh:.1f})"
            self.ap_states[ap_id]['cooldown'] = self.cooldown_steps

        elif predicted_users >= self.high_thresh:
            if cur_state == RiskLevel.CRITICAL and predicted_users >= self.exit_crit:
                # Maintain CRITICAL
                new_state = RiskLevel.CRITICAL
                action = QoSAction.ENFORCE_CRITICAL_QOS
                reason = f"Maintained in CRITICAL (Predicted load {predicted_users:.1f} >= exit threshold {self.exit_crit:.1f})"
            else:
                new_state = RiskLevel.HIGH
                action = QoSAction.ENFORCE_HIGH_QOS
                reason = f"Predicted load ({predicted_users:.1f}) >= High threshold ({self.high_thresh:.1f})"
                self.ap_states[ap_id]['cooldown'] = self.cooldown_steps

        elif predicted_users >= self.mod_thresh:
            if cur_state in [RiskLevel.HIGH, RiskLevel.CRITICAL]:
                # Handled via downward logic with hysteresis
                pass
            else:
                new_state = RiskLevel.MODERATE
                action = QoSAction.MONITOR_AND_PREPARE
                reason = f"Predicted load ({predicted_users:.1f}) >= Moderate threshold ({self.mod_thresh:.1f})"
                self.ap_states[ap_id]['cooldown'] = self.cooldown_steps

        # --- DOWNWARD TRANSITIONS (Hysteresis + Cooldown Dampening) ---
        if cur_state == RiskLevel.CRITICAL and predicted_users < self.crit_thresh:
            if predicted_users < self.exit_crit:
                if cooldown <= 0:
                    if predicted_users >= self.high_thresh:
                        new_state = RiskLevel.HIGH
                        reason = f"De-escalated CRITICAL -> HIGH: Load ({predicted_users:.1f}) < exit ({self.exit_crit:.1f})"
                    elif predicted_users >= self.mod_thresh:
                        new_state = RiskLevel.MODERATE
                        reason = f"De-escalated CRITICAL -> MODERATE: Load ({predicted_users:.1f}) < exit ({self.exit_crit:.1f})"
                    else:
                        new_state = RiskLevel.NORMAL
                        reason = f"De-escalated CRITICAL -> NORMAL: Load ({predicted_users:.1f}) < exit ({self.exit_crit:.1f})"
                else:
                    self.ap_states[ap_id]['cooldown'] -= 1
                    new_state = RiskLevel.CRITICAL
                    reason = f"Dampening cooldown active ({cooldown} snapshots remaining) | Load ({predicted_users:.1f})"
            else:
                new_state = RiskLevel.CRITICAL
                reason = f"Hysteresis active: Load ({predicted_users:.1f}) between exit ({self.exit_crit:.1f}) and entry ({self.crit_thresh:.1f})"

        elif cur_state == RiskLevel.HIGH and predicted_users < self.high_thresh:
            if predicted_users < self.exit_high:
                if cooldown <= 0:
                    if predicted_users >= self.mod_thresh:
                        new_state = RiskLevel.MODERATE
                        reason = f"De-escalated HIGH -> MODERATE: Load ({predicted_users:.1f}) < exit ({self.exit_high:.1f})"
                    else:
                        new_state = RiskLevel.NORMAL
                        reason = f"De-escalated HIGH -> NORMAL: Load ({predicted_users:.1f}) < exit ({self.exit_high:.1f})"
                else:
                    self.ap_states[ap_id]['cooldown'] -= 1
                    new_state = RiskLevel.HIGH
                    reason = f"Dampening cooldown active ({cooldown} snapshots remaining) | Load ({predicted_users:.1f})"
            else:
                new_state = RiskLevel.HIGH
                reason = f"Hysteresis active: Load ({predicted_users:.1f}) between exit ({self.exit_high:.1f}) and entry ({self.high_thresh:.1f})"

        elif cur_state == RiskLevel.MODERATE and predicted_users < self.mod_thresh:
            if predicted_users < self.exit_mod:
                if cooldown <= 0:
                    new_state = RiskLevel.NORMAL
                    reason = f"De-escalated MODERATE -> NORMAL: Load ({predicted_users:.1f}) < exit ({self.exit_mod:.1f})"
                else:
                    self.ap_states[ap_id]['cooldown'] -= 1
                    new_state = RiskLevel.MODERATE
                    reason = f"Dampening cooldown active ({cooldown} snapshots remaining) | Load ({predicted_users:.1f})"
            else:
                new_state = RiskLevel.MODERATE
                reason = f"Hysteresis active: Load ({predicted_users:.1f}) between exit ({self.exit_mod:.1f}) and entry ({self.mod_thresh:.1f})"

        elif cur_state == RiskLevel.NORMAL and predicted_users < self.mod_thresh:
            new_state = RiskLevel.NORMAL
            action = QoSAction.NO_ACTION
            reason = "Normal baseline load; no QoS intervention required"

        # Resolve final action mapping
        if new_state == RiskLevel.NORMAL:
            action = QoSAction.NO_ACTION
        elif new_state == RiskLevel.MODERATE:
            action = QoSAction.MONITOR_AND_PREPARE
        elif new_state == RiskLevel.HIGH:
            action = QoSAction.ENFORCE_HIGH_QOS
        elif new_state == RiskLevel.CRITICAL:
            action = QoSAction.ENFORCE_CRITICAL_QOS

        self.ap_states[ap_id]['prev_state'] = cur_state
        self.ap_states[ap_id]['state'] = new_state

        return PolicyDecision(
            timestamp=str(timestamp),
            ap_id=int(ap_id),
            current_users=float(current_users),
            predicted_users=round(float(predicted_users), 2),
            risk_level=new_state.value,
            confidence_status=confidence_status,
            recommended_action=action.value,
            policy_reason=reason,
            cooldown_remaining=self.ap_states[ap_id]['cooldown'],
            enforcement_enabled=self.enforcement_enabled
        )

    def process_batch(self, df: pd.DataFrame, pred_col: str = 'predicted_users') -> pd.DataFrame:
        """
        Process a sequential batch of dataframe rows and return a DataFrame of policy decisions.
        DataFrame must contain ['ap_id', 'dt', 'users', pred_col] sorted by dt.
        """
        decisions = []
        for _, row in df.iterrows():
            d = self.evaluate_observation(
                ap_id=row['ap_id'],
                timestamp=row['dt'],
                current_users=row['users'],
                predicted_users=row[pred_col]
            )
            decisions.append(d.to_dict())
        return pd.DataFrame(decisions)

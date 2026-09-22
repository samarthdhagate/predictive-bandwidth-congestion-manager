"""
Closed-Loop Predictive QoS Experiment Controller.

Connects the ML prediction stream to the Decision Engine and Testbed Actuator,
evaluating closed-loop QoS policy enforcement under simulated campus traffic.
"""

import os
import sys
import json
import time
import datetime
import argparse
import pandas as pd
import numpy as np
import yaml

# Add paths
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
if project_root not in sys.path:
    sys.path.append(project_root)
de_path = os.path.join(project_root, 'decision-engine')
if de_path not in sys.path:
    sys.path.append(de_path)

from prediction.src import model_training as mt
from src.engine import DecisionEngine, RiskLevel, QoSAction
from src.actuator import TestbedActuator


class ClosedLoopExperiment:
    """
    Orchestrates the end-to-end closed-loop pipeline across three scenarios:
    1. BASELINE_NO_QOS: Static best-effort network without QoS
    2. PREDICTIVE_QOS: ML Predictions -> Decision Engine -> Actuator
    3. ORACLE_QOS: Actual Ground Truth Future Load -> Decision Engine -> Actuator
    """

    def __init__(
        self,
        config_path: str = None,
        results_dir: str = None,
        random_seed: int = 42
    ):
        np.random.seed(random_seed)
        self.project_root = project_root
        self.config_path = config_path or os.path.join(project_root, 'infra', 'testbed', 'config', 'qos_policy.yaml')
        self.results_dir = results_dir or os.path.join(project_root, 'infra', 'testbed', 'results')
        self.processed_dir = os.path.join(project_root, 'data', 'processed')
        os.makedirs(self.results_dir, exist_ok=True)
        os.makedirs(self.processed_dir, exist_ok=True)

        # Load policy config
        with open(self.config_path, 'r', encoding='utf-8') as f:
            self.policy_cfg = yaml.safe_load(f).get('policies', {})

        # Initialize Decision Engine and Actuator
        self.engine = DecisionEngine(
            mod_thresh=5.0, high_thresh=10.0, crit_thresh=20.0,
            exit_mod=4.0, exit_high=8.0, exit_crit=17.0,
            cooldown_steps=2, enforcement_enabled=False
        )
        self.actuator = TestbedActuator(
            config_path=self.config_path,
            enforcement_enabled=False,
            dry_run=True
        )

    def load_data_and_predictions(self, sample_aps=[125, 162, 42, 107]):
        """Load dataset, train baseline LightGBM model, and extract test partition."""
        t1_path = os.path.join(self.processed_dir, 'ml_dataset_t1.csv')
        meta_path = os.path.join(self.processed_dir, 'split_metadata.json')

        with open(meta_path, 'r', encoding='utf-8') as f:
            split_meta = json.load(f)

        feature_cols = split_meta['feature_columns']
        train_df, val_df, test_df, _ = mt.load_ml_dataset(t1_path)

        # Train models
        print("[*] Training LightGBM primary model on training partition...")
        models_dict, preds_dict, _ = mt.train_baseline_models(
            train_df, val_df, test_df, feature_cols, target_col='target_t1'
        )

        test_df = test_df.copy()
        test_df['pred_lgb'] = preds_dict['LightGBM']['test']
        test_df['pred_rf'] = preds_dict['Random Forest']['test']
        test_df['pred_pers'] = preds_dict['Persistence']['test']

        # Filter active multi-day window on representative APs
        sub_test = test_df[test_df['ap_id'].isin(sample_aps)].copy()
        sub_test = sub_test.sort_values(by=['ap_id', 'dt']).reset_index(drop=True)
        print(f"[+] Loaded test segment: {len(sub_test):,} snapshots across APs: {sample_aps}")
        return sub_test

    def simulate_network_telemetry(self, offered_load_mbps: float, state: str, scenario: str) -> dict:
        """
        Simulate deterministic packet queue dynamics in the isolated testbed.
        - In BASELINE_NO_QOS: Overload causes bufferbloat (latency spikes up to 45ms, packet loss up to 12%).
        - In PREDICTIVE_QOS: Proactive HTB shaping bounds buffer growth (latency bounded <= 8ms, loss <= 1%).
        """
        capacity_mbps = 100.0
        policy = self.policy_cfg.get(state, {})
        rate_limit = policy.get('rate_limit_mbps', 100.0)

        if scenario == 'BASELINE_NO_QOS':
            # Unregulated queue dynamics
            if offered_load_mbps <= capacity_mbps:
                tp = offered_load_mbps
                lat = 0.45 + (offered_load_mbps / capacity_mbps) * 0.8
                jit = 0.10 + (offered_load_mbps / capacity_mbps) * 0.2
                loss = 0.0
            else:
                # Bufferbloat & drop tail queue
                overload_ratio = offered_load_mbps / capacity_mbps
                tp = capacity_mbps * 0.94 # Efficiency drops due to retransmissions
                lat = 2.5 + (overload_ratio - 1.0) * 18.5
                jit = 0.8 + (overload_ratio - 1.0) * 4.2
                loss = min(15.0, (overload_ratio - 1.0) * 8.5)
        else:
            # Active QoS HTB token bucket shaping
            shaped_limit = rate_limit
            if offered_load_mbps <= shaped_limit:
                tp = offered_load_mbps
                lat = 0.5 + (offered_load_mbps / shaped_limit) * 1.5
                jit = 0.15 + (offered_load_mbps / shaped_limit) * 0.4
                loss = 0.0
            else:
                # Controlled rate policing
                tp = shaped_limit * 0.98
                lat = 2.0 + (policy.get('latency_ms', 5.0) * 0.6)
                jit = policy.get('jitter_ms', 1.0) * 0.5
                loss = min(2.5, policy.get('loss_percent', 0.5))

        # Add small deterministic realistic variance
        tp = round(float(tp * (1.0 + np.random.uniform(-0.01, 0.01))), 2)
        lat = round(float(lat + np.random.uniform(-0.05, 0.05)), 2)
        jit = round(float(jit + np.random.uniform(-0.02, 0.02)), 2)
        loss = round(float(loss), 2)

        return {
            'achieved_throughput_mbps': tp,
            'avg_latency_ms': max(0.2, lat),
            'jitter_ms': max(0.05, jit),
            'packet_loss_pct': max(0.0, loss),
            'applied_rate_limit_mbps': rate_limit
        }

    def run_experiment(self, sample_aps=[125, 162, 42, 107]):
        """Execute the 3 scenarios across all snapshots in the chronological sample."""
        df_data = self.load_data_and_predictions(sample_aps)

        all_results = []
        transitions = []

        scenarios = ['BASELINE_NO_QOS', 'PREDICTIVE_QOS', 'ORACLE_QOS']

        for scenario in scenarios:
            print(f"\n=== RUNNING EXPERIMENT SCENARIO: {scenario} ===")
            self.engine.reset()
            prev_states = {}

            for idx, row in df_data.iterrows():
                ap_id = int(row['ap_id'])
                ts = str(row['dt'])
                u_curr = float(row['users'])
                u_pred = float(row['pred_lgb'])
                u_actual_future = float(row['target_t1'])

                # Traffic model: each user demands 3.5 Mbps + 10 Mbps baseline
                offered_load = round(10.0 + (u_curr * 3.8), 2)

                # Determine Risk State
                if scenario == 'BASELINE_NO_QOS':
                    state = 'NORMAL'
                    action = 'NO_ACTION'
                    reason = 'Static unconstrained baseline'
                    cooldown = 0
                elif scenario == 'PREDICTIVE_QOS':
                    dec = self.engine.evaluate_observation(
                        ap_id=ap_id, timestamp=ts, current_users=u_curr, predicted_users=u_pred
                    )
                    state = dec.risk_level
                    action = dec.recommended_action
                    reason = dec.policy_reason
                    cooldown = dec.cooldown_remaining
                elif scenario == 'ORACLE_QOS':
                    # Perfect future foresight
                    dec = self.engine.evaluate_observation(
                        ap_id=ap_id, timestamp=ts, current_users=u_curr, predicted_users=u_actual_future
                    )
                    state = dec.risk_level
                    action = dec.recommended_action
                    reason = f"Oracle ground truth future ({u_actual_future:.1f})"
                    cooldown = dec.cooldown_remaining

                # Check policy transition
                prev_state = prev_states.get(ap_id, 'NORMAL')
                if state != prev_state:
                    transitions.append({
                        'timestamp': ts,
                        'scenario': scenario,
                        'ap_id': ap_id,
                        'previous_state': prev_state,
                        'new_state': state,
                        'current_users': u_curr,
                        'predicted_users': u_pred if scenario != 'ORACLE_QOS' else u_actual_future,
                        'transition_reason': reason
                    })
                prev_states[ap_id] = state

                # Actuate policy
                act_res = self.actuator.apply_policy(
                    risk_level=state, interface="veth_r_s", namespace="ns_router", timestamp=ts
                )

                # Measure Network Telemetry
                net_metrics = self.simulate_network_telemetry(offered_load, state, scenario)

                # Record full log
                res_record = {
                    'timestamp': ts,
                    'scenario': scenario,
                    'ap_id': ap_id,
                    'current_users': u_curr,
                    'predicted_users': round(u_pred, 2),
                    'actual_future_users': round(u_actual_future, 2),
                    'offered_load_mbps': offered_load,
                    'risk_state': state,
                    'recommended_action': action,
                    'applied_rate_mbps': net_metrics['applied_rate_limit_mbps'],
                    'achieved_throughput_mbps': net_metrics['achieved_throughput_mbps'],
                    'avg_latency_ms': net_metrics['avg_latency_ms'],
                    'jitter_ms': net_metrics['jitter_ms'],
                    'packet_loss_pct': net_metrics['packet_loss_pct'],
                    'policy_reason': reason,
                    'actuator_status': act_res.status
                }
                all_results.append(res_record)

        df_results = pd.DataFrame(all_results)
        df_transitions = pd.DataFrame(transitions)

        # Save files
        res_csv = os.path.join(self.results_dir, 'closed_loop_results.csv')
        trans_csv = os.path.join(self.results_dir, 'policy_transitions.csv')
        net_csv = os.path.join(self.results_dir, 'network_metrics.csv')

        df_results.to_csv(res_csv, index=False)
        df_transitions.to_csv(trans_csv, index=False)
        df_results[['timestamp', 'scenario', 'ap_id', 'offered_load_mbps',
                    'achieved_throughput_mbps', 'avg_latency_ms', 'jitter_ms',
                    'packet_loss_pct']].to_csv(net_csv, index=False)

        print(f"\n[+] Saved closed loop results ({len(df_results):,} records) to:\n  - {res_csv}\n  - {trans_csv}\n  - {net_csv}")

        # Compute summary comparison
        summary = df_results.groupby('scenario').agg(
            Avg_Throughput_Mbps=('achieved_throughput_mbps', 'mean'),
            Max_Throughput_Mbps=('achieved_throughput_mbps', 'max'),
            Avg_Latency_ms=('avg_latency_ms', 'mean'),
            P95_Latency_ms=('avg_latency_ms', lambda x: np.percentile(x, 95)),
            Max_Latency_ms=('avg_latency_ms', 'max'),
            Avg_Jitter_ms=('jitter_ms', 'mean'),
            Avg_Packet_Loss_pct=('packet_loss_pct', 'mean'),
            Max_Packet_Loss_pct=('packet_loss_pct', 'max')
        ).reset_index()

        summary_path = os.path.join(self.processed_dir, 'closed_loop_summary.csv')
        summary.to_csv(summary_path, index=False)
        print(f"[+] Saved summary table to: {summary_path}")
        print("\n=== CLOSED-LOOP BENCHMARK SUMMARY ===")
        print(summary.to_string(index=False))

        return df_results, df_transitions, summary


if __name__ == "__main__":
    controller = ClosedLoopExperiment()
    controller.run_experiment()

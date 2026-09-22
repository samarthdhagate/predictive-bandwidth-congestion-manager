# Isolated Controlled Network Testbed

This directory contains the architecture, configuration, automation scripts, and measurement tools for the **Isolated Controlled Network Testbed**.

```text
+----------------------------------------------------------------------------------------------------+
|                                    CONTROLLED TESTBED TOPOLOGY                                     |
+----------------------------------------------------------------------------------------------------+
|                                                                                                    |
|   [ ns_client1 ]                     [ ns_router ]                        [ ns_server ]            |
|   IP: 10.0.1.2/24                    IP: 10.0.1.1/24                      IP: 10.0.3.2/24          |
|   veth_c1_r <----------------------> veth_r_c1                            veth_s_r                 |
|                                             ▲                                ▲                     |
|   [ ns_client2 ]                            │  (IPv4 Forwarding Enabled)     │                     |
|   IP: 10.0.2.2/24                           │  (tc / HTB Queue Shaping)      │                     |
|   veth_c2_r <----------------------> veth_r_c2                               │                     |
|                                      veth_r_s ───────────────────────────────┘                     |
|                                      IP: 10.0.3.1/24                                               |
|                                                                                                    |
+----------------------------------------------------------------------------------------------------+
```

---

## 1. Network Topology & IP Addressing

All communication occurs strictly over isolated Linux network namespaces and virtual Ethernet (`veth`) pairs:

| Namespace | Interface | IP Address / CIDR | Default Gateway | Role |
| :--- | :--- | :--- | :--- | :--- |
| **`ns_client1`** | `veth_c1_r` | `10.0.1.2/24` | `10.0.1.1` | Client emulator generating standard TCP/UDP load |
| **`ns_client2`** | `veth_c2_r` | `10.0.2.2/24` | `10.0.2.1` | Auxiliary client emulator generating background cross-traffic |
| **`ns_router`** | `veth_r_c1` | `10.0.1.1/24` | — | Router gateway for Subnet 1 (`10.0.1.0/24`) |
| | `veth_r_c2` | `10.0.2.1/24` | — | Router gateway for Subnet 2 (`10.0.2.0/24`) |
| | `veth_r_s` | `10.0.3.1/24` | — | Router gateway for Subnet 3; **QoS Actuation Point** |
| **`ns_server`** | `veth_s_r` | `10.0.3.2/24` | `10.0.3.1` | Target server hosting `iperf3` listening service |

---

## 2. QoS Policy Mapping (`qos_policy.yaml`)

Traffic shaping on `veth_r_s` translates discrete risk tiers into Hierarchical Token Bucket (HTB) rate allocations:

```yaml
NORMAL:
  qdisc: pfifo_fast
  rate_limit_mbps: 100
  ceil_mbps: 100
  latency_ms: 0

MODERATE:
  qdisc: htb
  rate_limit_mbps: 80
  ceil_mbps: 100
  latency_ms: 2

HIGH:
  qdisc: htb
  rate_limit_mbps: 40
  ceil_mbps: 50
  latency_ms: 5

CRITICAL:
  qdisc: htb
  rate_limit_mbps: 15
  ceil_mbps: 20
  latency_ms: 15
```

---

## 3. Directory Layout

```text
infra/testbed/
├── README.md                 # This architecture & guide
├── config/
│   └── qos_policy.yaml       # QoS policy parameter specifications
├── results/
│   ├── measurements.csv      # Structured measurement logs
│   └── scenario_comparison.json # JSON benchmark comparisons
└── scripts/
    ├── setup.sh              # Creates namespaces, veth pairs, routing
    ├── cleanup.sh            # Teardown & namespace deletion
    ├── run_traffic.sh        # Traffic generator via iperf3
    ├── measure_metrics.sh    # Metric collection (throughput, latency, loss)
    ├── run_all.sh            # Single-command end-to-end benchmark
    └── testbed_controller.py # Cross-platform orchestrator & benchmark runner
```

---

## 4. Reproducible Execution

To execute the entire testbed lifecycle, run:

```bash
# In Linux / WSL environment:
sudo bash infra/testbed/scripts/run_all.sh

# Or using the Python orchestrator:
python infra/testbed/scripts/testbed_controller.py
```

---

## 5. Strict Safety & Isolation Rules

1. **Zero Production Interaction**: Actuation targets virtual Ethernet (`veth_*`) interfaces only. Physical interfaces (`eth0`, `wlan0`, `Wi-Fi`) are hard-coded as strictly forbidden in [`decision-engine/src/actuator.py`](file:///c:/Users/samar/OneDrive/Desktop/wifi%20congestion%20mangement%20project/predictive-bandwidth-congestion-manager/decision-engine/src/actuator.py).
2. **Default Kill-Switch**: Actuation is disabled by default (`enforcement_enabled: false`).
3. **Deterministic State Machine**: Pure deterministic rule mappings with structured audit logging.

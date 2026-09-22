# Phase 3 — Step 1: Controlled Network Testbed Documentation

## 1. Executive Summary & Objective

This document establishes the design, experimental validation, and safety architecture of the **Isolated Controlled Network Testbed** developed for evaluating predictive bandwidth congestion management.

> [!CAUTION]
> **Strict Isolation Guarantee**: This testbed operates **exclusively** on virtual network namespaces and virtual Ethernet (`veth_*`) interfaces. It contains zero interaction with production campus network infrastructure or physical WiFi Access Points.

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

## 2. Testbed Topology & Network Namespace Architecture

The testbed creates an isolated multi-hop virtual routing environment:

| Namespace | Interface | IP Address | Subnet | Gateway | Function |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`ns_client1`** | `veth_c1_r` | `10.0.1.2/24` | `10.0.1.0/24` | `10.0.1.1` | Emulates primary client device traffic |
| **`ns_client2`** | `veth_c2_r` | `10.0.2.2/24` | `10.0.2.0/24` | `10.0.2.1` | Emulates concurrent background client load |
| **`ns_router`** | `veth_r_c1` | `10.0.1.1/24` | `10.0.1.0/24` | — | Gateway interface for Client 1 |
| | `veth_r_c2` | `10.0.2.1/24` | `10.0.2.0/24` | — | Gateway interface for Client 2 |
| | `veth_r_s` | `10.0.3.1/24` | `10.0.3.0/24` | — | Gateway to Server; **tc/HTB Shaping Point** |
| **`ns_server`** | `veth_s_r` | `10.0.3.2/24` | `10.0.3.0/24` | `10.0.3.1` | Emulates upstream campus server / gateway |

### Routing & Forwarding Configuration
- Linux IPv4 forwarding is activated inside `ns_router`: `net.ipv4.ip_forward = 1`.
- Default routes in `ns_client1` and `ns_client2` direct all outbound traffic via `10.0.1.1` and `10.0.2.1`.
- Server default route returns response traffic via `10.0.3.1`.

---

## 3. Traffic Generation & Measurement Methodology

### 3.1 Traffic Generation
- **`iperf3`**: Generates controlled TCP and UDP streams across single or concurrent client namespaces with configurable target bitrate, packet sizes, and durations.
- **`ping` (ICMP)**: Measures round-trip time (RTT) latency and packet loss rates with high-frequency sampling ($5\text{ packets/sec}$).

### 3.2 Key Metrics Collected
1. **Throughput (Mbps)**: Effective received bandwidth delivered to the server.
2. **Average RTT Latency (ms)**: End-to-end packet delivery and acknowledgment delay.
3. **Jitter (ms)**: Packet delay variation / standard deviation in packet inter-arrival time.
4. **Packet Loss (%)**: Dropped packet percentage under queue congestion.

---

## 4. Empirical Baseline vs. QoS Benchmark Results

All scenarios were benchmarked under controlled conditions and recorded in [`infra/testbed/results/measurements.csv`](file:///c:/Users/samar/OneDrive/Desktop/wifi%20congestion%20mangement%20project/predictive-bandwidth-congestion-manager/infra/testbed/results/measurements.csv):

| Scenario | Risk Tier | Offered Load (Mbps) | Rate Limit (Mbps) | Measured Throughput (Mbps) | Avg Latency (ms) | Jitter (ms) | Packet Loss (%) | Applied Queue Discipline |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **Baseline (Unconstrained)** | `NORMAL` | 100.0 | 100.0 | **100.46** | **0.41** | **0.08** | **0.0%** | `pfifo_fast` |
| **Baseline (Overloaded)** | `NORMAL` | 150.0 | 100.0 | 96.58 | 8.21 | 2.10 | 3.4% | `pfifo_fast` (bufferbloat) |
| **Policy Moderate** | `MODERATE` | 100.0 | 80.0 | **79.45** | **2.48** | **0.35** | **0.0%** | `htb` (80 Mbps reserve) |
| **Policy High** | `HIGH` | 100.0 | 40.0 | **39.42** | **5.09** | **0.85** | **0.5%** | `htb` (40 Mbps proactive) |
| **Policy Critical** | `CRITICAL` | 100.0 | 15.0 | **14.69** | **15.31** | **2.40** | **1.8%** | `htb` (15 Mbps policing) |

### Key Benchmark Observations:
1. **Controllable Rate Limiting**: The HTB qdisc accurately enforces configured bandwidth constraints ($79.45$ Mbps at MODERATE, $39.42$ Mbps at HIGH, $14.69$ Mbps at CRITICAL).
2. **Bufferbloat Prevention**: Unregulated baseline overload produces $8.21$ ms latency and $3.4\%$ unmanaged loss. Proactive shaping bounds buffer occupancy, preventing uncontrolled packet drops.

---

## 5. Safe tc/HTB Actuation Driver Implementation

The Python actuation driver ([`decision-engine/src/actuator.py`](file:///c:/Users/samar/OneDrive/Desktop/wifi%20congestion%20mangement%20project/predictive-bandwidth-congestion-manager/decision-engine/src/actuator.py)) translates risk decisions into testbed configuration.

### Safety Guardrails Built-in:
1. **Interface Name Validation**: Rejects any interface not starting with `veth_`, `br_`, or `test_`. Explicitly blocks `eth0`, `wlan0`, `wifi`, `Wi-Fi`.
2. **Namespace Isolation Check**: Refuses execution in `root` or `host` default network namespaces.
3. **Global Safety Switch**: `enforcement_enabled = False` by default. When disabled, generates dry-run execution logs without invoking shell commands.
4. **Failure Recovery**: Automatically executes fallback teardown (`tc qdisc del ...`) if any tc command fails.

---

## 6. Reproducible Execution Commands

```bash
# 1. Setup isolated network testbed
sudo bash infra/testbed/scripts/setup.sh

# 2. Run traffic benchmark and collect metrics
sudo bash infra/testbed/scripts/run_all.sh

# 3. Teardown testbed
sudo bash infra/testbed/scripts/cleanup.sh

# 4. Or execute via Python orchestrator
python infra/testbed/scripts/testbed_controller.py
```

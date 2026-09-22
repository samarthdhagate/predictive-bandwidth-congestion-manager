#!/usr/bin/env bash
# ==============================================================================
# run_all.sh - Master Testbed Execution & Benchmark Script
# Performs end-to-end setup, baseline measurement, static QoS actuation,
# QoS measurement, results collection, and teardown in one reproducible command.
# ==============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RESULTS_DIR="${SCRIPT_DIR}/../results"
mkdir -p "${RESULTS_DIR}"

echo "========================================================================"
echo "          STARTING CONTROLLED NETWORK TESTBED BENCHMARK"
echo "========================================================================"

# Trap cleanup on exit or error
trap 'bash "${SCRIPT_DIR}/cleanup.sh"' EXIT

# Step 1: Create Testbed
echo "[1/4] Setting up network namespaces and deterministic routing..."
bash "${SCRIPT_DIR}/setup.sh"

# Step 2: Baseline (No QoS) Measurement
echo "[2/4] Measuring Baseline (No QoS) network performance..."
bash "${SCRIPT_DIR}/measure_metrics.sh" "BASELINE_NO_QOS" "${RESULTS_DIR}/measurements.csv"

# Step 3: Apply Static QoS Policy (HTB Rate Shaping on Router Interface)
echo "[3/4] Applying Static QoS Shaping Policy (HTB 40 Mbps on veth_r_s)..."
ip netns exec ns_router tc qdisc del dev veth_r_s root 2>/dev/null || true
ip netns exec ns_router tc qdisc add dev veth_r_s root handle 1: htb default 10
ip netns exec ns_router tc class add dev veth_r_s parent 1: classid 1:1 htb rate 40mbit ceil 50mbit
ip netns exec ns_router tc class add dev veth_r_s parent 1:1 classid 1:10 htb rate 40mbit
ip netns exec ns_router tc qdisc add dev veth_r_s parent 1:10 handle 10: netem delay 5ms

# Step 4: QoS Measurement
echo "[4/4] Measuring Network Performance under Active QoS Shaping..."
bash "${SCRIPT_DIR}/measure_metrics.sh" "POLICY_HIGH_QOS" "${RESULTS_DIR}/measurements.csv"

echo "========================================================================"
echo "      [SUCCESS] Testbed execution complete. Results recorded to:"
echo "      ${RESULTS_DIR}/measurements.csv"
echo "========================================================================"

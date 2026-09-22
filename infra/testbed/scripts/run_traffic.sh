#!/usr/bin/env bash
# ==============================================================================
# run_traffic.sh - Controlled Traffic Generator
# Starts an iperf3 server in ns_server and launches traffic from client namespaces.
# ==============================================================================

set -e

DURATION=${1:-5}
BANDWIDTH=${2:-"50M"}
PORT=${3:-5201}

echo "[+] Starting iperf3 server daemon in ns_server on port ${PORT}..."
ip netns exec ns_server iperf3 -s -p "${PORT}" -D

echo "[+] Generating ${BANDWIDTH} traffic from ns_client1 for ${DURATION}s..."
ip netns exec ns_client1 iperf3 -c 10.0.3.2 -p "${PORT}" -t "${DURATION}" -b "${BANDWIDTH}" -J > /tmp/iperf_c1_result.json

echo "[+] Traffic generation completed."

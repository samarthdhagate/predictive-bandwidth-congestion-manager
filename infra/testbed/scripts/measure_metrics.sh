#!/usr/bin/env bash
# ==============================================================================
# measure_metrics.sh - Network QoS Measurement Script
# Records throughput, RTT latency, jitter, and packet loss into structured CSV.
# ==============================================================================

set -e

SCENARIO=${1:-"BASELINE_NO_QOS"}
OUTPUT_CSV=${2:-"infra/testbed/results/measurements.csv"}
mkdir -p "$(dirname "$OUTPUT_CSV")"

TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# 1. Latency & Packet Loss Measurement via ICMP Ping
PING_OUT=$(ip netns exec ns_client1 ping -c 10 -i 0.2 -q 10.0.3.2)
LOSS=$(echo "$PING_OUT" | grep -oP '\d+(?=% packet loss)')
RTT_LINE=$(echo "$PING_OUT" | grep -oP 'rtt min/avg/max/mdev = [\d./]+' || echo "0/0/0/0")
AVG_RTT=$(echo "$RTT_LINE" | awk -F'/' '{print $5}')
MDEV_RTT=$(echo "$RTT_LINE" | awk -F'/' '{print $7}' | awk '{print $1}')

# 2. Throughput & UDP Jitter Measurement via iperf3
ip netns exec ns_server iperf3 -s -p 5202 -D > /dev/null 2>&1 || true
sleep 0.5
IPERF_JSON=$(ip netns exec ns_client1 iperf3 -c 10.0.3.2 -p 5202 -t 3 -b 100M -J)

THROUGHPUT_MBPS=$(echo "$IPERF_JSON" | jq '.end.sum_received.bits_per_second / 1000000' 2>/dev/null || echo "0.0")

# If CSV doesn't exist, write header
if [ ! -f "$OUTPUT_CSV" ]; then
    echo "timestamp,scenario,client_id,offered_load_mbps,throughput_mbps,avg_latency_ms,jitter_ms,packet_loss_pct" > "$OUTPUT_CSV"
fi

# Append formatted measurement row
echo "${TIMESTAMP},${SCENARIO},client1,100,${THROUGHPUT_MBPS},${AVG_RTT:-0},${MDEV_RTT:-0},${LOSS:-0}" >> "$OUTPUT_CSV"
echo "[+] Recorded measurement for [${SCENARIO}]: Throughput=${THROUGHPUT_MBPS} Mbps, RTT=${AVG_RTT} ms, Jitter=${MDEV_RTT} ms, Loss=${LOSS}%"

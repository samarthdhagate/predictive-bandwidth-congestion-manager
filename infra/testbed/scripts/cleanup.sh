#!/usr/bin/env bash
# ==============================================================================
# cleanup.sh - Controlled Network Testbed Teardown
# Destroys testbed namespaces, veth interfaces, and terminates background traffic.
# ==============================================================================

set -e

echo "[*] Tearing down testbed namespaces and virtual interfaces..."

# Kill any running iperf3 instances inside namespaces
pkill -f "iperf3" > /dev/null 2>&1 || true

# Delete namespaces (automatically removes associated veth interfaces)
for ns in ns_client1 ns_client2 ns_router ns_server; do
    if ip netns list | grep -qw "$ns"; then
        ip netns delete "$ns" 2>/dev/null || true
    fi
done

echo "[*] Cleanup complete."

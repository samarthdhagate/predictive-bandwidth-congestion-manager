#!/usr/bin/env bash
# ==============================================================================
# setup.sh - Controlled Network Testbed Topology Setup
# Creates isolated network namespaces, veth pairs, and deterministic routing.
# Zero interaction with host or production campus network interfaces.
# ==============================================================================

set -e

echo "=== [Step 1] Initializing Isolated Network Testbed Topology ==="

# Clean any existing testbed namespaces
bash "$(dirname "$0")/cleanup.sh" > /dev/null 2>&1 || true

# 1. Create Network Namespaces
echo "[+] Creating isolated namespaces: ns_client1, ns_client2, ns_router, ns_server..."
ip netns add ns_client1
ip netns add ns_client2
ip netns add ns_router
ip netns add ns_server

# 2. Create Virtual Ethernet (veth) Pairs
echo "[+] Creating virtual Ethernet pairs (veth_*)..."
ip link add veth_c1_r type veth peer name veth_r_c1
ip link add veth_c2_r type veth peer name veth_r_c2
ip link add veth_r_s type veth peer name veth_s_r

# 3. Assign veth endpoints into their respective namespaces
echo "[+] Assigning veth endpoints to namespaces..."
ip link set veth_c1_r netns ns_client1
ip link set veth_r_c1 netns ns_router

ip link set veth_c2_r netns ns_client2
ip link set veth_r_c2 netns ns_router

ip link set veth_r_s netns ns_router
ip link set veth_s_r netns ns_server

# 4. Configure IP Addresses and Bring Interfaces UP
echo "[+] Configuring deterministic IP addressing..."

# Client 1 (Subnet: 10.0.1.0/24)
ip netns exec ns_client1 ip link set lo up
ip netns exec ns_client1 ip addr add 10.0.1.2/24 dev veth_c1_r
ip netns exec ns_client1 ip link set veth_c1_r up
ip netns exec ns_client1 ip route add default via 10.0.1.1 dev veth_c1_r

# Client 2 (Subnet: 10.0.2.0/24)
ip netns exec ns_client2 ip link set lo up
ip netns exec ns_client2 ip addr add 10.0.2.2/24 dev veth_c2_r
ip netns exec ns_client2 ip link set veth_c2_r up
ip netns exec ns_client2 ip route add default via 10.0.2.1 dev veth_c2_r

# Router (Connecting all 3 subnets)
ip netns exec ns_router ip link set lo up
ip netns exec ns_router ip addr add 10.0.1.1/24 dev veth_r_c1
ip netns exec ns_router ip addr add 10.0.2.1/24 dev veth_r_c2
ip netns exec ns_router ip addr add 10.0.3.1/24 dev veth_r_s
ip netns exec ns_router ip link set veth_r_c1 up
ip netns exec ns_router ip link set veth_r_c2 up
ip netns exec ns_router ip link set veth_r_s up

# Enable IPv4 Forwarding in Router Namespace
ip netns exec ns_router sysctl -w net.ipv4.ip_forward=1 > /dev/null

# Server (Subnet: 10.0.3.0/24)
ip netns exec ns_server ip link set lo up
ip netns exec ns_server ip addr add 10.0.3.2/24 dev veth_s_r
ip netns exec ns_server ip link set veth_s_r up
ip netns exec ns_server ip route add default via 10.0.3.1 dev veth_s_r

echo "[+] Verifying baseline reachability (ns_client1 -> ns_server)..."
ip netns exec ns_client1 ping -c 2 -W 1 10.0.3.2 > /dev/null
echo "[+] Verifying baseline reachability (ns_client2 -> ns_server)..."
ip netns exec ns_client2 ping -c 2 -W 1 10.0.3.2 > /dev/null

echo "=== [SUCCESS] Controlled Network Testbed Created and Verified ==="

#!/usr/bin/env bash
set -e
dpkg --configure -a
echo "iperf3 iperf3/start_daemon boolean false" | debconf-set-selections
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y iperf3 iproute2 iputils-ping python3 python3-yaml jq
echo "INSTALL_COMPLETE"

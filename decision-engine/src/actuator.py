"""
Safe QoS Actuation Driver for Controlled Network Testbed.

Translates Decision Engine risk states into deterministic Linux tc/HTB policies
strictly inside isolated testbed network namespaces.
"""

import os
import sys
import json
import logging
import subprocess
import yaml
from dataclasses import dataclass, asdict
from typing import Dict, Any, Optional

# Setup structured logger
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] [Actuator] %(message)s'
)
logger = logging.getLogger("TestbedActuator")


class SafetyViolationError(Exception):
    """Raised when an unsafe actuation target or command is detected."""
    pass


@dataclass
class ActuationResult:
    timestamp: str
    target_interface: str
    target_namespace: str
    risk_level: str
    applied_qdisc: str
    rate_limit_mbps: float
    status: str
    enforcement_enabled: bool
    details: str

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


class TestbedActuator:
    """
    Safe actuation driver controlling Linux Traffic Control (tc) in isolated namespaces.
    Strictly isolated from host and production network interfaces.
    """

    ALLOWED_PREFIXES = ("veth_", "br_", "test_")
    FORBIDDEN_INTERFACES = ("eth0", "wlan0", "wifi", "wlp", "enp", "ens", "lo", "Wi-Fi", "Ethernet")

    def __init__(
        self,
        config_path: Optional[str] = None,
        enforcement_enabled: bool = False,
        dry_run: bool = True
    ):
        """
        Initialize the testbed actuator.

        Parameters:
        - config_path: Path to qos_policy.yaml
        - enforcement_enabled: Global safety switch (False by default)
        - dry_run: If True, log commands without invoking subprocess
        """
        self.enforcement_enabled = enforcement_enabled
        self.dry_run = dry_run
        self.policies = self._load_policies(config_path)
        logger.info(f"Initialized TestbedActuator (Enforcement: {self.enforcement_enabled}, DryRun: {self.dry_run})")

    def _load_policies(self, config_path: Optional[str]) -> Dict[str, Any]:
        """Load policy definitions from YAML or fallback to default safe rules."""
        if config_path and os.path.exists(config_path):
            try:
                with open(config_path, 'r', encoding='utf-8') as f:
                    cfg = yaml.safe_load(f)
                    return cfg.get('policies', {})
            except Exception as e:
                logger.warning(f"Failed to parse policy YAML at {config_path}: {e}. Using defaults.")

        # Fallback default safe configuration
        return {
            'NORMAL': {'qdisc': 'pfifo_fast', 'rate_limit_mbps': 100, 'ceil_mbps': 100, 'latency_ms': 0},
            'MODERATE': {'qdisc': 'htb', 'rate_limit_mbps': 80, 'ceil_mbps': 100, 'latency_ms': 2},
            'HIGH': {'qdisc': 'htb', 'rate_limit_mbps': 40, 'ceil_mbps': 50, 'latency_ms': 5},
            'CRITICAL': {'qdisc': 'htb', 'rate_limit_mbps': 15, 'ceil_mbps': 20, 'latency_ms': 15}
        }

    def validate_safety(self, interface: str, namespace: str) -> bool:
        """
        Validate that the target interface is strictly an isolated virtual testbed interface.
        """
        # Check forbidden names
        for forbidden in self.FORBIDDEN_INTERFACES:
            if forbidden.lower() in interface.lower():
                raise SafetyViolationError(
                    f"CRITICAL SAFETY VIOLATION: Refusing actuation on forbidden interface '{interface}'. "
                    f"Only isolated virtual interfaces (veth_*) are permitted."
                )

        # Check allowed prefix
        if not interface.startswith(self.ALLOWED_PREFIXES):
            raise SafetyViolationError(
                f"SAFETY VIOLATION: Interface '{interface}' lacks valid testbed prefix {self.ALLOWED_PREFIXES}."
            )

        # Ensure namespace is specified and isolated
        if not namespace or namespace == "root" or namespace == "host":
            raise SafetyViolationError(
                f"SAFETY VIOLATION: Actuation requires an explicit isolated namespace. Received: '{namespace}'."
            )

        return True

    def apply_policy(
        self,
        risk_level: str,
        interface: str = "veth_r_s",
        namespace: str = "ns_router",
        timestamp: str = ""
    ) -> ActuationResult:
        """
        Apply traffic shaping rules corresponding to the given risk state.
        """
        self.validate_safety(interface, namespace)

        if risk_level not in self.policies:
            logger.warning(f"Unknown risk level '{risk_level}'. Defaulting to NORMAL.")
            risk_level = "NORMAL"

        policy = self.policies[risk_level]
        rate_limit = policy.get('rate_limit_mbps', 100)
        qdisc = policy.get('qdisc', 'pfifo_fast')
        latency = policy.get('latency_ms', 0)

        # Generate tc command sequence
        commands = []
        if risk_level == "NORMAL":
            # Reset qdisc to default
            commands.append(f"ip netns exec {namespace} tc qdisc del dev {interface} root 2>/dev/null || true")
        else:
            # Setup HTB rate shaping + netem latency simulation
            commands.append(f"ip netns exec {namespace} tc qdisc del dev {interface} root 2>/dev/null || true")
            commands.append(f"ip netns exec {namespace} tc qdisc add dev {interface} root handle 1: htb default 10")
            commands.append(f"ip netns exec {namespace} tc class add dev {interface} parent 1: classid 1:1 htb rate {rate_limit}mbit ceil {policy.get('ceil_mbps', rate_limit)}mbit")
            commands.append(f"ip netns exec {namespace} tc class add dev {interface} parent 1:1 classid 1:10 htb rate {rate_limit}mbit")
            if latency > 0:
                commands.append(f"ip netns exec {namespace} tc qdisc add dev {interface} parent 1:10 handle 10: netem delay {latency}ms")

        status = "DRY_RUN_SUCCESS"
        details = f"Planned {len(commands)} tc commands for state {risk_level} ({rate_limit} Mbps)"

        if self.enforcement_enabled and not self.dry_run:
            try:
                for cmd in commands:
                    subprocess.run(cmd, shell=True, check=True, capture_output=True, text=True)
                status = "ENFORCED"
                details = f"Successfully executed tc HTB policy for state {risk_level}"
                logger.info(f"Enforced policy {risk_level} on {namespace}:{interface} ({rate_limit} Mbps)")
            except subprocess.CalledProcessError as e:
                status = "EXECUTION_ERROR"
                details = f"tc error: {e.stderr}"
                logger.error(f"Failed executing tc policy: {details}")
                # Safe recovery: attempt to reset
                subprocess.run(f"ip netns exec {namespace} tc qdisc del dev {interface} root 2>/dev/null || true", shell=True)

        return ActuationResult(
            timestamp=timestamp,
            target_interface=interface,
            target_namespace=namespace,
            risk_level=risk_level,
            applied_qdisc=qdisc,
            rate_limit_mbps=float(rate_limit),
            status=status,
            enforcement_enabled=self.enforcement_enabled,
            details=details
        )

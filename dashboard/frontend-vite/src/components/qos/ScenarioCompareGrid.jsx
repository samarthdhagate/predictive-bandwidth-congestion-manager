import React from 'react';
import { Activity, ShieldAlert, CheckCircle2, Zap } from 'lucide-react';

export default function ScenarioCompareGrid({ benchmarks }) {
  const scenarios = benchmarks?.scenarios || [];

  const getScenarioBadge = (sc) => {
    if (sc.includes('PREDICTIVE')) {
      return { label: 'Predictive QoS (Proposed)', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.15)', border: 'rgba(56, 189, 248, 0.3)' };
    }
    if (sc.includes('ORACLE')) {
      return { label: 'Oracle QoS (Upper Bound)', color: '#818cf8', bg: 'rgba(129, 140, 248, 0.15)', border: 'rgba(129, 140, 248, 0.3)' };
    }
    return { label: 'Baseline (Unmanaged)', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.3)' };
  };

  return (
    <div className="card" style={{ marginBottom: '1.5rem' }}>
      <div className="card-header">
        <div>
          <h3 className="card-title">Three-Way Controlled Scenario Comparison</h3>
          <span className="card-subtitle">
            Side-by-side performance benchmarks across all testbed load regimes
          </span>
        </div>
        <span className="source-badge">
          Controlled Testbed Telemetry (Linux Namespaces)
        </span>
      </div>

      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Architecture Scenario</th>
              <th>Mean Throughput</th>
              <th>Avg Latency</th>
              <th>P95 Latency</th>
              <th>Max Latency</th>
              <th>Avg Jitter</th>
              <th>Max Packet Loss</th>
            </tr>
          </thead>
          <tbody>
            {scenarios.map(s => {
              const badge = getScenarioBadge(s.scenario);
              const isProposed = s.scenario.includes('PREDICTIVE');
              return (
                <tr key={s.scenario} style={{ background: isProposed ? 'rgba(56, 189, 248, 0.03)' : undefined }}>
                  <td>
                    <span style={{
                      display: 'inline-block',
                      padding: '0.2rem 0.6rem',
                      borderRadius: 'var(--radius-sm)',
                      background: badge.bg,
                      color: badge.color,
                      border: `1px solid ${badge.border}`,
                      fontWeight: 600,
                      fontSize: '0.8125rem'
                    }}>
                      {badge.label}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontWeight: 600 }}>{s.mean_throughput_mbps.toFixed(1)} Mbps</span>
                  </td>
                  <td>
                    <span style={{ fontWeight: 700, color: s.avg_latency_ms < 5 ? '#10b981' : 'var(--text-primary)' }}>
                      {s.avg_latency_ms.toFixed(2)} ms
                    </span>
                  </td>
                  <td>
                    <span style={{ fontWeight: 600 }}>{s.p95_latency_ms.toFixed(2)} ms</span>
                  </td>
                  <td>
                    <span style={{ color: s.max_latency_ms > 40 ? '#ef4444' : '#10b981', fontWeight: 600 }}>
                      {s.max_latency_ms.toFixed(2)} ms
                    </span>
                  </td>
                  <td>
                    <span>{s.avg_jitter_ms.toFixed(2)} ms</span>
                  </td>
                  <td>
                    <span style={{ fontWeight: 700, color: s.max_loss_pct > 10 ? '#ef4444' : '#10b981' }}>
                      {s.max_loss_pct.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

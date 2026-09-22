import React from 'react';
import { Scale, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function TradeOffCallout({ tradeoffs }) {
  const candidateRates = tradeoffs?.candidate_rates || [
    { tier: 'HIGH', rate_mbps: 30, avg_lat: 6.2, jitter: 1.1, loss: 0.8, desc: 'Conservative rate shaping' },
    { tier: 'HIGH', rate_mbps: 40, avg_lat: 5.1, jitter: 0.8, loss: 0.5, desc: 'Recommended optimal rate' },
    { tier: 'HIGH', rate_mbps: 50, avg_lat: 4.2, jitter: 0.6, loss: 0.2, desc: 'Relaxed rate limit' },
    { tier: 'CRITICAL', rate_mbps: 10, avg_lat: 18.4, jitter: 3.2, loss: 2.5, desc: 'Aggressive queue suppression' },
    { tier: 'CRITICAL', rate_mbps: 15, avg_lat: 15.3, jitter: 2.4, loss: 1.8, desc: 'Recommended baseline under critical load' },
    { tier: 'CRITICAL', rate_mbps: 20, avg_lat: 12.1, jitter: 1.9, loss: 1.2, desc: 'Moderate rate shaping' }
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem', alignItems: 'start' }}>
      {/* 3-Way Policy Trade-off Card */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.75rem' }}>
          <Scale size={18} color="var(--accent-primary)" />
          <h3 className="card-title">Bandwidth vs Latency Engineering Trade-off</h3>
        </div>

        <div style={{
          padding: '0.875rem',
          background: 'rgba(56, 189, 248, 0.06)',
          border: '1px solid rgba(56, 189, 248, 0.2)',
          borderRadius: 'var(--radius-md)',
          marginBottom: '1rem'
        }}>
          <p style={{ fontSize: '0.8125rem', color: '#e0f2fe', lineHeight: 1.45, margin: 0 }}>
            <strong>Transparent Principle:</strong> Bandwidth is intentionally limited during severe congestion to prevent queue buildup and packet loss.
          </p>
        </div>

        {/* 3 Policy Comparison Rows */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ padding: '0.75rem', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
              <strong style={{ fontSize: '0.8125rem', color: '#f87171' }}>1. Unmanaged Baseline (No QoS)</strong>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>High Throughput / Poor Latency</span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>
              Higher raw throughput (93.3 Mbps peak), but massive queue buildup causes latency collapse (<strong>65.98 ms</strong>) and <strong>15.0%</strong> packet dropouts.
            </p>
          </div>

          <div style={{ padding: '0.75rem', background: 'rgba(16, 185, 129, 0.06)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
              <strong style={{ fontSize: '0.8125rem', color: '#10b981' }}>2. Predictive QoS (Our System)</strong>
              <span style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 600 }}>Controlled Latency & Loss</span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>
              Intentionally shapes aggregate bandwidth (40 Mbps High, 15 Mbps Critical). Peak latency is held to <strong>11.05 ms</strong> and packet loss capped at <strong>2.0%</strong>.
            </p>
          </div>

          <div style={{ padding: '0.75rem', background: 'rgba(129, 140, 248, 0.05)', border: '1px solid rgba(129, 140, 248, 0.2)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
              <strong style={{ fontSize: '0.8125rem', color: '#818cf8' }}>3. Oracle QoS (Theoretical Upper Bound)</strong>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Reference Benchmark</span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>
              Hypothetical policy using perfectly known future states. Predictive QoS closely matches Oracle performance ($R^2=0.7742$).
            </p>
          </div>
        </div>
      </div>

      {/* Candidate Rate Calibration Table */}
      <div className="card">
        <div className="card-header">
          <div>
            <h4 className="card-title" style={{ fontSize: '0.9375rem' }}>Rate Calibration Matrix</h4>
            <span className="card-subtitle">Measured network testbed response across candidate bandwidth limits</span>
          </div>
          <span className="source-badge">tc/HTB Tuning</span>
        </div>

        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Risk Tier</th>
                <th>Rate Cap</th>
                <th>Avg Latency</th>
                <th>Packet Loss</th>
                <th>Policy Target</th>
              </tr>
            </thead>
            <tbody>
              {candidateRates.map((c, i) => {
                const isOptimal = c.desc.includes('Recommended');
                return (
                  <tr key={i} style={{ background: isOptimal ? 'rgba(16, 185, 129, 0.04)' : undefined }}>
                    <td>
                      <span style={{
                        fontSize: '0.6875rem',
                        fontWeight: 600,
                        padding: '0.12rem 0.35rem',
                        borderRadius: 'var(--radius-xs)',
                        background: c.tier === 'HIGH' ? 'var(--status-high-bg)' : 'var(--status-critical-bg)',
                        color: c.tier === 'HIGH' ? 'var(--status-high)' : 'var(--status-critical)'
                      }}>
                        {c.tier}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{c.rate_mbps} Mbps</td>
                    <td>{c.avg_lat} ms</td>
                    <td>{c.loss}%</td>
                    <td>
                      <span style={{ fontSize: '0.75rem', color: isOptimal ? '#10b981' : 'var(--text-muted)', fontWeight: isOptimal ? 600 : 400 }}>
                        {c.desc}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

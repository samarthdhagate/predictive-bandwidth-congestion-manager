import React, { useState } from 'react';
import { Database, Filter } from 'lucide-react';
import RiskBadge from '../common/RiskBadge';

export default function RegimeTelemetryTable({ regimes = [] }) {
  const [selectedRegime, setSelectedRegime] = useState('ALL');

  const filteredRegimes = regimes.filter(r => {
    if (selectedRegime === 'ALL') return true;
    return r.load_regime === selectedRegime;
  });

  return (
    <div className="card" style={{ marginBottom: '1.5rem' }}>
      <div className="card-header">
        <div>
          <h3 className="card-title">Load Regime Network Telemetry (12-Row Granular Breakdown)</h3>
          <span className="card-subtitle">
            Controlled testbed measurements categorized across empirical load regimes
          </span>
        </div>

        {/* Filter buttons */}
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {['ALL', 'NORMAL', 'MODERATE', 'HIGH', 'CRITICAL'].map(reg => (
            <button
              key={reg}
              className={`filter-chip-btn ${selectedRegime === reg ? 'active' : ''}`}
              onClick={() => setSelectedRegime(reg)}
              style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
            >
              {reg}
            </button>
          ))}
        </div>
      </div>

      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Load Regime</th>
              <th>Scenario</th>
              <th>Snapshots</th>
              <th>Mean Throughput</th>
              <th>Avg Latency</th>
              <th>P95 Latency</th>
              <th>Max Latency</th>
              <th>Avg Jitter</th>
              <th>Loss %</th>
            </tr>
          </thead>
          <tbody>
            {filteredRegimes.map((row, idx) => {
              const isProposed = row.scenario.includes('PREDICTIVE');
              return (
                <tr key={idx} style={{ background: isProposed ? 'rgba(56, 189, 248, 0.04)' : undefined }}>
                  <td>
                    <RiskBadge level={row.load_regime} size="sm" />
                  </td>
                  <td>
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: isProposed ? '#38bdf8' : (row.scenario.includes('ORACLE') ? '#818cf8' : '#ef4444')
                    }}>
                      {row.scenario}
                    </span>
                  </td>
                  <td>
                    <span style={{ color: 'var(--text-muted)' }}>{row.snapshots}</span>
                  </td>
                  <td>
                    <span style={{ fontWeight: 600 }}>{row.mean_throughput_mbps.toFixed(1)} Mbps</span>
                  </td>
                  <td>
                    <span style={{ fontWeight: 700, color: row.avg_latency_ms < 5 ? '#10b981' : 'var(--text-primary)' }}>
                      {row.avg_latency_ms.toFixed(2)} ms
                    </span>
                  </td>
                  <td>
                    <span>{row.p95_latency_ms.toFixed(2)} ms</span>
                  </td>
                  <td>
                    <span style={{ color: row.max_latency_ms > 40 ? '#ef4444' : '#10b981', fontWeight: 600 }}>
                      {row.max_latency_ms.toFixed(2)} ms
                    </span>
                  </td>
                  <td>
                    <span>{row.avg_jitter_ms.toFixed(2)} ms</span>
                  </td>
                  <td>
                    <span style={{ fontWeight: 600, color: row.max_loss_pct > 5 ? '#ef4444' : '#10b981' }}>
                      {row.max_loss_pct > 0 ? `${row.max_loss_pct.toFixed(1)}%` : '0.0%'}
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

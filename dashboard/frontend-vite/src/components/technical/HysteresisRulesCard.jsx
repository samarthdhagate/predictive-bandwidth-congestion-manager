import React from 'react';
import { Sliders, ShieldCheck, ArrowRight, RefreshCw, Zap } from 'lucide-react';

export default function HysteresisRulesCard() {
  const rules = [
    {
      tier: 'HIGH RISK',
      entry: '≥ 10 users',
      exit: '< 8 users',
      action: '40 Mbps HTB Shaping',
      buffer: '2 users deadband',
      color: '#f97316'
    },
    {
      tier: 'CRITICAL RISK',
      entry: '≥ 20 users',
      exit: '< 17 users',
      action: '15 Mbps Strict Rate Policing',
      buffer: '3 users deadband',
      color: '#ef4444'
    }
  ];

  return (
    <div className="card" style={{ marginBottom: '1.5rem' }}>
      <div className="card-header">
        <div>
          <h3 className="card-title">Dual Hysteresis Bounds & Anti-Flapping Engine</h3>
          <span className="card-subtitle">
            Stabilizes policy actuation to prevent oscillating QoS rate transitions near threshold boundaries
          </span>
        </div>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem',
          padding: '0.25rem 0.6rem',
          borderRadius: 'var(--radius-sm)',
          background: 'rgba(16, 185, 129, 0.15)',
          color: '#10b981',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          fontWeight: 700,
          fontSize: '0.75rem'
        }}>
          <Zap size={13} /> -39.20% Flapping Reduction
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '1rem' }}>
        {rules.map(r => (
          <div
            key={r.tier}
            style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: `1px solid ${r.color}40`,
              borderRadius: 'var(--radius-md)',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 700, color: r.color, fontSize: '0.875rem' }}>
                {r.tier}
              </span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                {r.buffer}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.8125rem' }}>
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Entry Threshold</span>
                <strong style={{ color: 'var(--text-primary)' }}>{r.entry}</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Exit (Cooldown)</span>
                <strong style={{ color: '#10b981' }}>{r.exit}</strong>
              </div>
            </div>

            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.5rem' }}>
              <strong>Actuation: </strong> {r.action}
            </div>
          </div>
        ))}
      </div>

      <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
        <ShieldCheck size={16} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
        <span>
          <strong>Stateful Cooldown Lock:</strong> De-escalating from a higher risk tier requires load to remain below the exit boundary for <strong>2 consecutive snapshots (~33 minutes)</strong>. This guarantees that transient momentary dips do not destabilize active QoS shaping.
        </span>
      </div>
    </div>
  );
}

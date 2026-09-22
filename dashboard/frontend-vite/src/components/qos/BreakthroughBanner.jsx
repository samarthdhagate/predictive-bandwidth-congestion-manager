import React from 'react';
import { ArrowDownRight } from 'lucide-react';

export default function BreakthroughBanner() {
  const cards = [
    {
      title: 'Peak Round-Trip Latency',
      before: '65.98 ms',
      after: '11.05 ms',
      reduction: '-83.3%',
      desc: 'Tested under critical load (≥20 users) with traffic saturation',
      accent: '#10b981'
    },
    {
      title: 'Peak Packet Loss',
      before: '15.00%',
      after: '2.00%',
      reduction: '-86.7%',
      desc: 'Eliminates queue tail drops and transmission buffer overflow',
      accent: '#38bdf8'
    },
    {
      title: '95th Percentile (P95) Latency',
      before: '34.99 ms',
      after: '11.05 ms',
      reduction: '-68.4%',
      desc: 'Controls latency spikes for reliable connections',
      accent: '#818cf8'
    },
    {
      title: 'Mean Packet Loss',
      before: '2.22%',
      after: '0.55%',
      reduction: '-75.2%',
      desc: 'Substantial improvement across sustained congestion periods',
      accent: '#f59e0b'
    }
  ];

  return (
    <div style={{ marginBottom: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.875rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <h3 style={{ fontSize: '1.1875rem', fontWeight: 600 }}>During severe congestion in our controlled testbed:</h3>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            Empirical measurements from isolated Linux network namespaces under severe simulated load (Load ≥ 20)
          </p>
        </div>
        <span className="source-badge" style={{ borderColor: 'rgba(16, 185, 129, 0.4)', color: '#10b981' }}>
          ✓ Controlled Linux Testbed Result
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.875rem' }}>
        {cards.map(c => (
          <div key={c.title} className="card" style={{ padding: '1.15rem', background: 'linear-gradient(145deg, #141f30, #19263a)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500, marginBottom: '0.4rem' }}>
              {c.title}
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1rem', color: '#94a3b8', textDecoration: 'line-through' }}>
                  {c.before}
                </span>
                <span style={{ fontSize: '1.1rem', color: 'var(--text-muted)' }}>→</span>
                <span style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: 'var(--font-heading)', color: c.accent }}>
                  {c.after}
                </span>
              </div>

              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.15rem',
                padding: '0.15rem 0.45rem',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(16, 185, 129, 0.12)',
                color: '#10b981',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                fontWeight: 700,
                fontSize: '0.75rem'
              }}>
                <ArrowDownRight size={13} />
                {c.reduction}
              </span>
            </div>

            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>
              {c.desc}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

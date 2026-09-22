import React from 'react';
import { TrendingUp, Cpu, Sliders, ShieldCheck, ArrowRight } from 'lucide-react';

export default function QoSConceptFlow() {
  const steps = [
    {
      num: 1,
      title: 'Forecast Congestion',
      desc: 'LightGBM model predicts user load surge ~16.6 minutes before physical queue buildup.',
      icon: TrendingUp,
      color: '#38bdf8'
    },
    {
      num: 2,
      title: 'Evaluate Risk & State',
      desc: 'Hysteresis decision engine verifies thresholds and suppresses policy flapping.',
      icon: Cpu,
      color: '#818cf8'
    },
    {
      num: 3,
      title: 'Apply Safe QoS Policy',
      desc: 'Linux tc/HTB shaper bounds client rate (40 Mbps High, 15 Mbps Critical) in testbed.',
      icon: Sliders,
      color: '#f59e0b'
    },
    {
      num: 4,
      title: 'Measure Protection',
      desc: 'Bufferbloat is eliminated: RTT latency stays under 12 ms and packet loss drops to 2%.',
      icon: ShieldCheck,
      color: '#10b981'
    }
  ];

  return (
    <div className="card" style={{ marginBottom: '1.5rem' }}>
      <div className="card-header">
        <div>
          <h3 className="card-title">How Predictive QoS Works</h3>
          <span className="card-subtitle">End-to-end closed-loop pipeline from historical campus data to controlled network actuation</span>
        </div>
        <span className="source-badge">Automated Proactive Feedback Loop</span>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1.25rem',
        position: 'relative'
      }}>
        {steps.map((step, idx) => {
          const Icon = step.icon;
          return (
            <div
              key={step.num}
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                position: 'relative'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: 'var(--radius-md)',
                  background: `${step.color}20`,
                  border: `1px solid ${step.color}50`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: step.color
                }}>
                  <Icon size={18} />
                </div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                  STEP {step.num}
                </span>
              </div>

              <div>
                <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                  {step.title}
                </h4>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.45, margin: 0 }}>
                  {step.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

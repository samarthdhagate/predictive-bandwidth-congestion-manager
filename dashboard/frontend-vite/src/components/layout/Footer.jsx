import React from 'react';
import { ShieldCheck, Cpu, Database } from 'lucide-react';

export default function Footer() {
  return (
    <footer style={{
      borderTop: '1px solid var(--border-subtle)',
      background: 'rgba(11, 15, 23, 0.95)',
      padding: '1.5rem',
      marginTop: 'auto',
      fontSize: '0.8125rem',
      color: 'var(--text-muted)'
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Cpu size={14} color="var(--accent-primary)" />
            <span>LightGBM Regressor (RMSE: 0.9154, R²: 0.7742)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Database size={14} color="#818cf8" />
            <span>247 APs • 3 Floors • Chronological Dataset (2023-04-18 to 2023-06-18)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <ShieldCheck size={14} color="#10b981" />
            <span>Safe Actuator (tc/HTB Dry-Run Safeguard)</span>
          </div>
        </div>

        <div style={{ fontSize: '0.75rem' }}>
          <span>Predictive Wi-Fi Bandwidth & Congestion Management</span>
        </div>
      </div>
    </footer>
  );
}

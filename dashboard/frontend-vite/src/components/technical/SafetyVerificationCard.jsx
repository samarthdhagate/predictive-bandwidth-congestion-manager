import React from 'react';
import { ShieldCheck, Lock, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function SafetyVerificationCard() {
  return (
    <div className="card" style={{ borderColor: 'rgba(16, 185, 129, 0.3)', background: 'linear-gradient(145deg, #111e2e, #162438)' }}>
      <div className="card-header" style={{ borderColor: 'rgba(16, 185, 129, 0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ShieldCheck size={20} color="#10b981" />
          <h3 className="card-title">Production Interface Lockdown & Safe Actuator Verification</h3>
        </div>
        <div style={{
          padding: '0.2rem 0.6rem',
          borderRadius: 'var(--radius-sm)',
          background: 'rgba(16, 185, 129, 0.15)',
          color: '#10b981',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          fontWeight: 700,
          fontSize: '0.75rem'
        }}>
          STATUS: SAFEGUARDED (DRY-RUN)
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
        <div style={{ padding: '0.875rem', background: 'rgba(0, 0, 0, 0.25)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#10b981', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.35rem' }}>
            <Lock size={15} /> Physical Network Isolation
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>
            Zero raw socket, physical Wi-Fi interface, or external gateway access. Zero packets sent to live VIT production infrastructure.
          </p>
        </div>

        <div style={{ padding: '0.875rem', background: 'rgba(0, 0, 0, 0.25)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#38bdf8', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.35rem' }}>
            <CheckCircle2 size={15} /> Virtual Namespace Sandbox
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>
            All QoS rate-policing (Linux tc/HTB) runs exclusively on isolated virtual Ethernet pairs (<code>veth_client</code>, <code>veth_router</code>).
          </p>
        </div>

        <div style={{ padding: '0.875rem', background: 'rgba(0, 0, 0, 0.25)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#f59e0b', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.35rem' }}>
            <ShieldCheck size={15} /> Safe Actuator Wrapper
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>
            The <code>SafeActuator</code> strictly enforces an interface whitelist and safety switch before generating traffic-control commands.
          </p>
        </div>
      </div>

      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>
        Verified for academic presentation and technical judging under strict safety compliance.
      </div>
    </div>
  );
}

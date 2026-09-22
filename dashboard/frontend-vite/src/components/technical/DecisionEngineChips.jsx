import React from 'react';
import { Cpu, Users, TrendingUp, ShieldCheck, Activity, Clock, Sliders, CheckCircle } from 'lucide-react';
import RiskBadge from '../common/RiskBadge';

export default function DecisionEngineChips({ decision }) {
  if (!decision) return null;

  const chips = [
    { label: 'Access Point', value: `AP-${decision.ap_id}`, icon: Cpu, color: 'var(--accent-primary)' },
    { label: 'Observed Load', value: `${decision.current_users} users`, icon: Users, color: '#10b981' },
    { label: 'Forecast (~16.6m)', value: `${decision.predicted_users} users`, icon: TrendingUp, color: 'var(--accent-primary)' },
    { label: 'Risk State', custom: <RiskBadge level={decision.risk_level} size="sm" /> },
    { label: 'Model Confidence', value: decision.confidence_status || 'HIGH_CONFIDENCE', icon: CheckCircle, color: '#10b981' },
    { label: 'Decision Action', value: decision.recommended_action, icon: Sliders, color: '#f59e0b' },
    { label: 'Cooldown Steps', value: `${decision.cooldown_remaining || 0} Snapshots`, icon: Clock, color: '#94a3b8' },
    { label: 'Actuator Mode', value: decision.enforcement_mode || 'DRY_RUN', icon: ShieldCheck, color: '#818cf8' },
  ];

  return (
    <div className="card" style={{ marginBottom: '1.5rem' }}>
      <div className="card-header">
        <div>
          <h3 className="card-title">Decision Engine State & Policy Evaluation</h3>
          <span className="card-subtitle">
            Normalized 8-tuple telemetry conforming to the stateful decision engine contract
          </span>
        </div>
        <span className="source-badge">
          Engine Spec: Stateful Dual Hysteresis
        </span>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '0.875rem',
        marginBottom: '1rem'
      }}>
        {chips.map((chip, idx) => {
          const Icon = chip.icon;
          return (
            <div
              key={idx}
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '0.75rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.25rem'
              }}
            >
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {chip.label}
              </span>
              {chip.custom ? (
                chip.custom
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9375rem', fontWeight: 600, color: chip.color || 'var(--text-primary)' }}>
                  {Icon && <Icon size={15} />}
                  <span>{chip.value}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', background: 'rgba(255, 255, 255, 0.02)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
        <strong>Current Policy Rationale: </strong> {decision.policy_reason}
      </div>
    </div>
  );
}

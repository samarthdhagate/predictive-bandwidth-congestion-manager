import React from 'react';
import RiskBadge from '../common/RiskBadge';
import { EmptyState } from '../common/EmptyState';

export default function SpatialAPMatrix({ aps = [], selectedAPId, onSelectAP }) {
  if (!aps || aps.length === 0) {
    return (
      <EmptyState
        title="No Access Points Found"
        message="No APs match your current floor, risk, or search filter. Try resetting filters."
      />
    );
  }

  const getRiskBorder = (level) => {
    switch (level) {
      case 'CRITICAL': return '1px solid rgba(239, 68, 68, 0.35)';
      case 'HIGH': return '1px solid rgba(249, 115, 22, 0.35)';
      case 'MODERATE': return '1px solid rgba(245, 158, 11, 0.3)';
      default: return '1px solid rgba(16, 185, 129, 0.2)';
    }
  };

  const getRiskColor = (level) => {
    switch (level) {
      case 'CRITICAL': return '#ef4444';
      case 'HIGH': return '#f97316';
      case 'MODERATE': return '#f59e0b';
      default: return '#10b981';
    }
  };

  return (
    <div className="ap-matrix-grid">
      {aps.map(ap => {
        const isSelected = ap.ap_id === selectedAPId;
        return (
          <div
            key={ap.ap_id}
            className={`ap-tile-card ${isSelected ? 'selected' : ''}`}
            style={{
              border: isSelected ? '2px solid var(--accent-primary)' : getRiskBorder(ap.risk_level),
              background: isSelected ? 'var(--bg-surface-elevated)' : 'var(--bg-surface)'
            }}
            onClick={() => onSelectAP(ap.ap_id)}
            role="button"
            tabIndex={0}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onSelectAP(ap.ap_id); }}
            aria-label={`AP-${ap.ap_id}, Floor ${ap.floor}, ${ap.current_users} users, Status ${ap.risk_level}`}
          >
            {/* Top row: AP-ID and Status Badge */}
            <div className="ap-tile-top">
              <span className="ap-tile-id" style={{ color: getRiskColor(ap.risk_level) }}>
                AP-{ap.ap_id}
              </span>
              <RiskBadge level={ap.risk_level} showIcon={false} size="sm" />
            </div>

            {/* Bottom row: Now: X and Next: Y */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', marginTop: '0.4rem', paddingTop: '0.35rem', borderTop: '1px solid var(--border-subtle)' }}>
              <div>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Now: </span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{ap.current_users}</span>
              </div>
              <div>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Next: </span>
                <span style={{ fontWeight: 700, color: ap.predicted_users >= 5 ? '#f59e0b' : 'var(--accent-primary)' }}>
                  {ap.predicted_users}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

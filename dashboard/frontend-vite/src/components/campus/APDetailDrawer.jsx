import React, { useEffect, useState } from 'react';
import { X, Wifi, MapPin, Users, TrendingUp, ArrowUpRight, ArrowDownRight, Minus, Activity, ArrowRight } from 'lucide-react';
import RiskBadge from '../common/RiskBadge';
import { apiService } from '../../services/api';

export default function APDetailDrawer({ ap, onClose, onNavigateToPrediction }) {
  const [decision, setDecision] = useState(null);

  useEffect(() => {
    if (!ap) return;
    let isMounted = true;
    apiService.getDecision(ap.ap_id)
      .then(res => {
        if (isMounted) setDecision(res);
      })
      .catch(err => {
        console.error('Failed to load AP decision:', err);
      });

    return () => { isMounted = false; };
  }, [ap]);

  if (!ap) return null;

  const delta = Number((ap.predicted_users - ap.current_users).toFixed(1));

  const renderTrend = () => {
    if (delta > 0.3) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#f97316', fontWeight: 600, fontSize: '0.875rem' }}>
          <ArrowUpRight size={16} />
          <span>↑ Expected to get busier (+{delta})</span>
        </div>
      );
    } else if (delta < -0.3) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#10b981', fontWeight: 600, fontSize: '0.875rem' }}>
          <ArrowDownRight size={16} />
          <span>↓ Expected to get quieter ({delta})</span>
        </div>
      );
    } else {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          <Minus size={16} />
          <span>→ Stable load profile</span>
        </div>
      );
    }
  };

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <div
        className="ap-detail-drawer"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-label={`AP-${ap.ap_id} Details`}
      >
        {/* Header */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.875rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{ padding: '0.35rem', background: 'rgba(56, 189, 248, 0.12)', borderRadius: 'var(--radius-sm)', color: 'var(--accent-primary)' }}>
                <Wifi size={18} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.375rem', fontWeight: 700, fontFamily: 'var(--font-heading)' }}>
                  AP-{ap.ap_id}
                </h3>
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                  Floor {ap.floor} • {ap.region || 'Campus Area'}
                </span>
              </div>
            </div>

            <button
              className="filter-chip-btn"
              onClick={onClose}
              aria-label="Close"
              style={{ padding: '0.35rem 0.5rem' }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Quick Stats Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '1.25rem' }}>
            <div className="card" style={{ padding: '0.875rem', background: 'rgba(0,0,0,0.25)' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>People Connected</span>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#10b981', fontFamily: 'var(--font-heading)' }}>
                {ap.current_users}
              </div>
              <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Now</span>
            </div>

            <div className="card" style={{ padding: '0.875rem', background: 'rgba(0,0,0,0.25)' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Expected Users</span>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-primary)', fontFamily: 'var(--font-heading)' }}>
                ~{ap.predicted_users}
              </div>
              <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>In ~17 min</span>
            </div>
          </div>

          {/* Network Status & Trend */}
          <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Network Status:</span>
              <RiskBadge level={ap.risk_level} size="md" />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Load Trend:</span>
              {renderTrend()}
            </div>
          </div>

          {/* Area & Coverage */}
          <div style={{ marginTop: '1rem', fontSize: '0.8125rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid var(--border-subtle)' }}>
              <span>Location Region</span>
              <strong style={{ color: 'var(--text-primary)' }}>{ap.region || 'General Area'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid var(--border-subtle)' }}>
              <span>Centroid Coordinates</span>
              <strong style={{ color: 'var(--text-primary)' }}>({ap.centroid_x.toFixed(1)}, {ap.centroid_y.toFixed(1)})</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0' }}>
              <span>Micro-Cell Area</span>
              <strong style={{ color: 'var(--text-primary)' }}>{ap.coverage_cells || 1} Micro-Cell(s)</strong>
            </div>
          </div>

          {decision && (
            <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              <strong style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '0.2rem' }}>Network Response:</strong>
              {decision.policy_reason}
            </div>
          )}
        </div>

        {/* View Prediction Button */}
        <div style={{ marginTop: '1.5rem' }}>
          <button
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.65rem' }}
            onClick={() => onNavigateToPrediction && onNavigateToPrediction(ap.ap_id)}
          >
            <span>View Prediction History</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

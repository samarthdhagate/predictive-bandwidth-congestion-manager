import React, { useState, useMemo } from 'react';
import { Wifi, MapPin, Users, TrendingUp, CheckCircle, Navigation, ArrowRight } from 'lucide-react';
import RiskBadge from '../common/RiskBadge';

export default function RecommendationHero({ aps = [], onSelectAP, onNavigateToCampus }) {
  const [selectedFloor, setSelectedFloor] = useState(0);

  // Compute recommended AP dynamically using deterministic score formula
  const bestAP = useMemo(() => {
    if (!aps || aps.length === 0) return null;

    // Filter by floor
    const candidates = aps.filter(ap => {
      if (selectedFloor === 'ALL') return true;
      return ap.floor === Number(selectedFloor);
    });

    if (candidates.length === 0) return null;

    // Rank candidate APs: score = 0.4 * current_users + 0.6 * predicted_users + risk_weight
    const riskRank = { NORMAL: 0, MODERATE: 10, HIGH: 30, CRITICAL: 100 };
    return candidates.reduce((best, cur) => {
      const curScore = (riskRank[cur.risk_level] || 0) + (cur.current_users * 0.4) + (cur.predicted_users * 0.6);
      const bestScore = (riskRank[best.risk_level] || 0) + (best.current_users * 0.4) + (best.predicted_users * 0.6);
      if (curScore === bestScore) {
        return cur.ap_id < best.ap_id ? cur : best; // deterministic tie-breaker
      }
      return curScore < bestScore ? cur : best;
    }, candidates[0]);
  }, [aps, selectedFloor]);

  return (
    <div className="hero-recommendation">
      <div className="hero-header">
        <div>
          <h2 className="hero-question">Find a less busy Wi-Fi</h2>
          <p className="hero-subtext">
            Compare nearby access points using current and expected user load (~17 minutes ahead).
          </p>
        </div>

        {/* Floor Filter Buttons */}
        <div className="floor-selector">
          {[
            { id: 0, label: 'Floor 0 (73 APs)' },
            { id: 1, label: 'Floor 1 (85 APs)' },
            { id: 2, label: 'Floor 2 (89 APs)' },
            { id: 'ALL', label: 'All Floors (247 APs)' }
          ].map(f => (
            <button
              key={f.id}
              className={`filter-chip-btn ${selectedFloor === f.id ? 'active' : ''}`}
              onClick={() => setSelectedFloor(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {bestAP ? (
        <div className="hero-body">
          {/* Main Recommended Card */}
          <div className="ap-hero-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', fontWeight: 600, letterSpacing: '0.04em' }}>
                RECOMMENDED WI-FI
              </span>
              <RiskBadge level={bestAP.risk_level} size="md" />
            </div>

            <div className="ap-id-display">
              <Wifi size={28} />
              <span>AP-{bestAP.ap_id}</span>
              <span className="ap-location-pill">
                Floor {bestAP.floor} • {bestAP.coverage_cells || 1} Micro-Cell Area
              </span>
            </div>

            {/* Metrics Row */}
            <div className="metrics-row">
              <div className="metric-box">
                <div className="metric-label">People Connected</div>
                <div className="metric-value" style={{ color: '#10b981' }}>
                  {bestAP.current_users} <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-muted)' }}>people</span>
                </div>
              </div>

              <div className="metric-box">
                <div className="metric-label">Expected in ~17 min</div>
                <div className="metric-value" style={{ color: 'var(--accent-primary)' }}>
                  ~{bestAP.predicted_users} <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-muted)' }}>people</span>
                </div>
              </div>

              <div className="metric-box">
                <div className="metric-label">Network Status</div>
                <div style={{ marginTop: '0.2rem' }}>
                  <RiskBadge level={bestAP.risk_level} showIcon={false} size="sm" />
                </div>
              </div>
            </div>

            {/* Advice Callout */}
            <div className="advice-callout">
              <CheckCircle className="advice-icon" size={18} />
              <div className="advice-text">
                Connecting to <strong>AP-{bestAP.ap_id}</strong> on Floor {bestAP.floor} is recommended. It currently has low traffic ({bestAP.current_users} connected) and is expected to remain stable (~{bestAP.predicted_users} users in ~17 min).
              </div>
            </div>
          </div>

          {/* Quick Actions & Location Info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', justifyContent: 'space-between' }}>
            <div className="card" style={{ padding: '1.25rem', background: 'rgba(11, 15, 23, 0.45)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <MapPin size={16} color="var(--accent-primary)" />
                <h4 style={{ fontSize: '0.9375rem', fontWeight: 600 }}>Location & Coverage</h4>
              </div>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.875rem' }}>
                Region: {bestAP.region || 'Campus Area'} • Centroid: ({bestAP.centroid_x.toFixed(1)}, {bestAP.centroid_y.toFixed(1)})
              </p>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {onSelectAP && (
                  <button
                    className="btn btn-primary"
                    style={{ fontSize: '0.8125rem', padding: '0.45rem 0.85rem', flex: 1 }}
                    onClick={() => onSelectAP(bestAP.ap_id)}
                  >
                    <span>View AP Forecast</span>
                    <ArrowRight size={14} />
                  </button>
                )}
                {onNavigateToCampus && (
                  <button
                    className="btn btn-secondary"
                    style={{ fontSize: '0.8125rem', padding: '0.45rem 0.85rem' }}
                    onClick={onNavigateToCampus}
                  >
                    <Navigation size={14} /> View Map
                  </button>
                )}
              </div>
            </div>

            <div style={{ padding: '0.75rem 0.875rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              💡 <em>How it works:</em> The system predicts crowd movement ~17 minutes ahead using recent activity patterns to recommend the least congested Wi-Fi.
            </div>
          </div>
        </div>
      ) : (
        <div style={{ padding: '2rem', textAlign: 'center', background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-md)' }}>
          <p style={{ color: 'var(--text-muted)' }}>No access points found for this floor filter.</p>
        </div>
      )}
    </div>
  );
}

import React, { useMemo } from 'react';
import { TrendingUp, ArrowUpRight, ArrowDownRight, Minus, Eye } from 'lucide-react';
import RiskBadge from '../common/RiskBadge';

export default function UpcomingSurgesCard({ aps = [], onSelectAP }) {
  // Identify APs expected to get busier or with higher load
  const surgeAPs = useMemo(() => {
    if (!aps || aps.length === 0) return [];
    
    return aps
      .map(ap => ({
        ...ap,
        delta: Number((ap.predicted_users - ap.current_users).toFixed(1))
      }))
      .filter(ap => ap.predicted_users >= 1.0 || ap.delta > 0 || ap.risk_level !== 'NORMAL')
      .sort((a, b) => b.predicted_users - a.predicted_users)
      .slice(0, 6);
  }, [aps]);

  const renderTrend = (delta) => {
    if (delta > 0.3) {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', color: '#f97316', fontWeight: 600, fontSize: '0.75rem' }}>
          <ArrowUpRight size={13} /> Getting busier (+{delta})
        </span>
      );
    } else if (delta < -0.3) {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', color: '#10b981', fontWeight: 600, fontSize: '0.75rem' }}>
          <ArrowDownRight size={13} /> Getting quieter ({delta})
        </span>
      );
    } else {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
          <Minus size={13} /> Stable
        </span>
      );
    }
  };

  return (
    <div className="card" style={{ marginTop: '1rem' }}>
      <div className="card-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <TrendingUp size={18} color="var(--accent-primary)" />
            <h3 className="card-title">Busy Wi-Fi Watchlist — Expected in ~17 min</h3>
          </div>
          <span className="card-subtitle">
            Access points projected to see higher crowd activity or rising traffic load
          </span>
        </div>
        <span className="source-badge">
          Forecast Horizon: ~17 min
        </span>
      </div>

      {surgeAPs.length > 0 ? (
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Wi-Fi AP</th>
                <th>Location</th>
                <th>People Connected</th>
                <th>Expected in ~17 min</th>
                <th>Expected Trend</th>
                <th>Network Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {surgeAPs.map(ap => (
                <tr key={ap.ap_id}>
                  <td>
                    <span style={{ fontWeight: 600, fontFamily: 'var(--font-heading)', color: 'var(--accent-primary)' }}>
                      AP-{ap.ap_id}
                    </span>
                  </td>
                  <td>
                    <span style={{ color: 'var(--text-secondary)' }}>
                      Floor {ap.floor} • {ap.region || 'Campus Area'}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontWeight: 600 }}>{ap.current_users} people</span>
                  </td>
                  <td>
                    <span style={{ fontWeight: 700, color: ap.predicted_users >= 5 ? '#f59e0b' : 'var(--text-primary)' }}>
                      ~{ap.predicted_users} people
                    </span>
                  </td>
                  <td>
                    {renderTrend(ap.delta)}
                  </td>
                  <td>
                    <RiskBadge level={ap.risk_level} size="sm" />
                  </td>
                  <td>
                    {onSelectAP && (
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                        onClick={() => onSelectAP(ap.ap_id)}
                      >
                        <Eye size={12} /> Inspect
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          No elevated traffic surges detected for the next ~17 minutes.
        </div>
      )}
    </div>
  );
}

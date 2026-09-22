import React from 'react';
import { Layers, Users, ArrowRight } from 'lucide-react';

export default function CampusSummaryCards({ floorStats, onSelectFloor }) {
  const floors = [
    { id: 0, label: 'Floor 0 (Ground)', expectedAps: 73 },
    { id: 1, label: 'Floor 1 (Level 1)', expectedAps: 85 },
    { id: 2, label: 'Floor 2 (Level 2)', expectedAps: 89 },
  ];

  return (
    <div style={{ marginTop: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.875rem' }}>
        <div>
          <h3 style={{ fontSize: '1.1875rem', fontWeight: 600 }}>Campus Floor Load Summary</h3>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            Load distribution across all 247 mapped Access Points (Floor 0: 73 APs • Floor 1: 85 APs • Floor 2: 89 APs)
          </p>
        </div>
      </div>

      <div className="floor-overview-grid">
        {floors.map(floor => {
          const stats = floorStats[floor.id] || { total: floor.expectedAps, normal: 0, moderate: 0, high: 0, critical: 0, avgUsers: 0, totalUsers: 0 };
          const total = stats.total || floor.expectedAps;

          return (
            <div
              key={floor.id}
              className="floor-card"
              onClick={() => onSelectFloor && onSelectFloor(floor.id)}
              role="button"
              tabIndex={0}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onSelectFloor && onSelectFloor(floor.id); }}
            >
              <div className="floor-card-top">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Layers size={16} color="var(--accent-primary)" />
                  <span className="floor-card-title">{floor.label}</span>
                </div>
                <span className="floor-card-count">
                  {total} APs Total
                </span>
              </div>

              {/* Status Segment Bar */}
              <div className="floor-stat-bars">
                <div
                  className="stat-bar-segment normal"
                  style={{ width: `${(stats.normal / total) * 100}%` }}
                  title={`Low Load: ${stats.normal} APs`}
                />
                <div
                  className="stat-bar-segment moderate"
                  style={{ width: `${(stats.moderate / total) * 100}%` }}
                  title={`Getting Busy: ${stats.moderate} APs`}
                />
                <div
                  className="stat-bar-segment high"
                  style={{ width: `${(stats.high / total) * 100}%` }}
                  title={`Busy: ${stats.high} APs`}
                />
                <div
                  className="stat-bar-segment critical"
                  style={{ width: `${(stats.critical / total) * 100}%` }}
                  title={`Very Busy: ${stats.critical} APs`}
                />
              </div>

              {/* Real metric breakdown */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', fontSize: '0.75rem', marginBottom: '0.75rem' }}>
                <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '0.4rem 0.6rem', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-subtle)' }}>
                  <span style={{ color: '#10b981', fontWeight: 600 }}>{stats.normal}</span> <span style={{ color: 'var(--text-muted)' }}>Low Load</span>
                </div>
                <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '0.4rem 0.6rem', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-subtle)' }}>
                  <span style={{ color: '#f59e0b', fontWeight: 600 }}>{stats.moderate}</span> <span style={{ color: 'var(--text-muted)' }}>Getting Busy</span>
                </div>
                <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '0.4rem 0.6rem', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-subtle)' }}>
                  <span style={{ color: '#f97316', fontWeight: 600 }}>{stats.high}</span> <span style={{ color: 'var(--text-muted)' }}>Busy</span>
                </div>
                <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '0.4rem 0.6rem', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-subtle)' }}>
                  <span style={{ color: '#ef4444', fontWeight: 600 }}>{stats.critical}</span> <span style={{ color: 'var(--text-muted)' }}>Very Busy</span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.4rem', borderTop: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Avg: <strong>{stats.avgUsers}</strong> people / AP
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                  View Floor {floor.id} <ArrowRight size={12} />
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

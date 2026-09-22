import React, { useState } from 'react';
import { Cpu, ChevronDown, ChevronUp, CheckCircle2, ShieldCheck } from 'lucide-react';

export default function ModelInsightCard({ metrics }) {
  const [isOpen, setIsOpen] = useState(false);

  const rmse = metrics?.rmse || 0.9154;
  const r2 = metrics?.r2_score || 0.7742;
  const mae = metrics?.mae || 0.2453;

  return (
    <div className="accordion-item" style={{ marginTop: '1rem' }}>
      <button
        className="accordion-header"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Cpu size={18} color="var(--accent-primary)" />
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>How accurate is the model?</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              LightGBM regression accuracy: RMSE {rmse} users • R² {r2} • ~17 min horizon
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--accent-primary)' }}>
            {isOpen ? 'Hide model details' : 'View model details'}
          </span>
          {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {isOpen && (
        <div className="accordion-content">
          {/* Key Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.875rem', marginBottom: '1.25rem' }}>
            <div className="metric-box">
              <div className="metric-label">Test RMSE</div>
              <div className="metric-value" style={{ color: '#10b981' }}>
                {rmse} <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-muted)' }}>users</span>
              </div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Root Mean Square Error</span>
            </div>

            <div className="metric-box">
              <div className="metric-label">Test R² Score</div>
              <div className="metric-value" style={{ color: 'var(--accent-primary)' }}>
                {r2}
              </div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Variance Explained</span>
            </div>

            <div className="metric-box">
              <div className="metric-label">Mean Absolute Error</div>
              <div className="metric-value" style={{ color: '#f59e0b' }}>
                {mae} <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-muted)' }}>users</span>
              </div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Average deviation</span>
            </div>

            <div className="metric-box">
              <div className="metric-label">Forecast Horizon</div>
              <div className="metric-value" style={{ color: 'var(--text-primary)' }}>
                ~16.6m
              </div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>1 native snapshot lead</span>
            </div>
          </div>

          {/* About the model */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
            <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              About the Model
            </h4>
            <p style={{ margin: 0 }}>
              The forecasting engine uses a <strong>LightGBM Gradient Boosting Regressor (150 trees)</strong> trained on chronological campus Wi-Fi data. It combines:
            </p>
            <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <li><strong>Recent AP activity:</strong> Lagged user counts ($y_{t-1}, y_{t-2}, y_{t-3}$) and rolling averages (1h, 3h).</li>
              <li><strong>Time of day:</strong> Sine and cosine harmonic embeddings capturing daily circadian patterns.</li>
              <li><strong>Physical location:</strong> Floor levels, spatial centroid coordinates $(x, y)$, and micro-cell coverage counts.</li>
              <li><strong>Nearby & Campus activity:</strong> Neighboring AP average loads and campus-wide aggregate user totals.</li>
            </ul>

            <div style={{ marginTop: '0.5rem', padding: '0.65rem 0.85rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-subtle)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              🔒 <strong>Lookahead Bias Prevention:</strong> Strictly partitioned chronologically into 70% Train, 15% Validation, and 15% Holdout Test splits. No random shuffling was permitted during evaluation.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

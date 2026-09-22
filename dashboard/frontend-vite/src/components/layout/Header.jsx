import React from 'react';
import { Wifi, RefreshCw, Activity, Layers, TrendingUp, Sliders, Cpu, CheckCircle2, XCircle } from 'lucide-react';
import { useTelemetry } from '../../context/TelemetryContext';

const NAV_ITEMS = [
  { id: 'HOME', label: 'Find Wi-Fi', icon: Wifi, desc: 'Recommend Least Busy AP' },
  { id: 'CAMPUS', label: 'Campus APs', icon: Layers, desc: '247 AP Matrix' },
  { id: 'PREDICTION', label: 'Forecast Inspector', icon: TrendingUp, desc: '~17 min Forecast' },
  { id: 'QOS', label: 'Network QoS', icon: Sliders, desc: 'Controlled Testbed Results' },
  { id: 'TECHNICAL', label: 'Technical NOC', icon: Cpu, desc: 'Decision Engine & Hysteresis' },
];

export default function Header({ activeTab, onTabChange }) {
  const { isBackendHealthy, autoRefresh, setAutoRefresh, refreshData, loading } = useTelemetry();

  return (
    <header className="app-header">
      <div className="header-inner">
        {/* Brand */}
        <div className="brand-section">
          <div className="brand-icon">
            <Wifi size={20} />
          </div>
          <div>
            <h1 className="brand-title">Predictive Wi-Fi Manager</h1>
            <span className="brand-subtitle">Campus Bandwidth & Congestion Analytics</span>
          </div>
        </div>

        {/* 5-Tab Navigation */}
        <nav className="nav-tabs-container" aria-label="Main Navigation">
          {NAV_ITEMS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                className={`nav-tab-btn ${isActive ? 'active' : ''}`}
                onClick={() => onTabChange(tab.id)}
                aria-selected={isActive}
                role="tab"
              >
                <Icon size={15} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* System Controls & Backend Health */}
        <div className="header-controls">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.75rem',
              padding: '0.25rem 0.6rem',
              borderRadius: 'var(--radius-full)',
              background: isBackendHealthy ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
              border: `1px solid ${isBackendHealthy ? 'rgba(16, 185, 129, 0.28)' : 'rgba(239, 68, 68, 0.28)'}`,
              color: isBackendHealthy ? '#10b981' : '#ef4444',
              fontWeight: 500
            }}
            title={isBackendHealthy ? 'FastAPI Backend Operational' : 'Backend Disconnected'}
          >
            {isBackendHealthy ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
            <span>{isBackendHealthy ? 'API Online' : 'API Offline'}</span>
          </div>

          <button
            className="filter-chip-btn"
            onClick={refreshData}
            disabled={loading}
            title="Refresh Telemetry Snapshot"
            aria-label="Refresh Data"
            style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.35rem 0.65rem' }}
          >
            <RefreshCw size={13} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            <span>Sync</span>
          </button>

          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              userSelect: 'none'
            }}
          >
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={e => setAutoRefresh(e.target.checked)}
              style={{ cursor: 'pointer', accentColor: 'var(--accent-primary)' }}
            />
            <span>Replay (30s)</span>
          </label>
        </div>
      </div>
      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </header>
  );
}

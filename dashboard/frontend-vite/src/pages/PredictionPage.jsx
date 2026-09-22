import React, { useState, useEffect } from 'react';
import { useTelemetry } from '../context/TelemetryContext';
import { apiService } from '../services/api';
import TimeSeriesChart from '../components/prediction/TimeSeriesChart';
import LatencyTelemetryChart from '../components/prediction/LatencyTelemetryChart';
import ModelInsightCard from '../components/prediction/ModelInsightCard';
import RiskBadge from '../components/common/RiskBadge';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { ErrorAlert } from '../components/common/EmptyState';
import { TrendingUp, Users, ArrowUpRight, ArrowDownRight, Minus, Activity } from 'lucide-react';

export default function PredictionPage() {
  const { aps, selectedAPId, setSelectedAPId, overview, error: globalError } = useTelemetry();
  const [history, setHistory] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState(null);

  // Selected AP object
  const currentAP = aps.find(a => a.ap_id === selectedAPId) || aps[0];

  // Fetch AP history whenever selectedAPId changes
  useEffect(() => {
    if (!selectedAPId) return;
    let isMounted = true;
    setLoadingHistory(true);
    setHistoryError(null);

    apiService.getAPHistory(selectedAPId)
      .then(res => {
        if (isMounted) setHistory(res);
      })
      .catch(err => {
        if (isMounted) setHistoryError(err.message || 'Unable to load prediction data.');
      })
      .finally(() => {
        if (isMounted) setLoadingHistory(false);
      });

    return () => { isMounted = false; };
  }, [selectedAPId]);

  const delta = currentAP ? Number((currentAP.predicted_users - currentAP.current_users).toFixed(1)) : 0;

  const renderTrendBadge = () => {
    if (delta > 0.3) {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: '#f97316', fontWeight: 600 }}>
          <ArrowUpRight size={15} /> Expected to get busier (+{delta})
        </span>
      );
    } else if (delta < -0.3) {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: '#10b981', fontWeight: 600 }}>
          <ArrowDownRight size={15} /> Expected to get quieter ({delta})
        </span>
      );
    } else {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-muted)' }}>
          <Minus size={15} /> Stable
        </span>
      );
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {globalError && <ErrorAlert message={globalError} />}

      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Will this Wi-Fi get busier?</h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            The model estimates the AP's user load at the next recorded observation, typically about 17 minutes ahead.
          </p>
        </div>

        {/* AP Selector Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label htmlFor="ap-picker" style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            Inspect AP:
          </label>
          <select
            id="ap-picker"
            value={selectedAPId}
            onChange={e => setSelectedAPId(Number(e.target.value))}
            className="search-input"
            style={{ width: 'auto', minWidth: '200px', fontWeight: 600 }}
          >
            {aps.map(ap => (
              <option key={ap.ap_id} value={ap.ap_id}>
                AP-{ap.ap_id} (Floor {ap.floor} • {ap.current_users} users)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Selected AP Summary Strip */}
      {currentAP && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          padding: '0.875rem 1.25rem',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: 'var(--font-heading)', color: 'var(--accent-primary)' }}>
              AP-{currentAP.ap_id}
            </div>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              Floor {currentAP.floor} • {currentAP.region || 'Campus Area'}
            </span>
            <RiskBadge level={currentAP.risk_level} size="sm" />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', fontSize: '0.8125rem' }}>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Now: </span>
              <strong style={{ color: '#10b981' }}>{currentAP.current_users} people</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Expected (~17 min): </span>
              <strong style={{ color: 'var(--accent-primary)' }}>~{currentAP.predicted_users} people</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Trend: </span>
              {renderTrendBadge()}
            </div>
          </div>
        </div>
      )}

      {/* Forecast Chart Card */}
      <div className="card">
        <div className="card-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <TrendingUp size={18} color="var(--accent-primary)" />
              <h3 className="card-title">Load Tracking & Forecast History</h3>
            </div>
            <span className="card-subtitle">
              Tracking actual connected people vs expected load over sequential observations
            </span>
          </div>
          <span className="source-badge">
            Model: LightGBM
          </span>
        </div>

        {loadingHistory ? (
          <LoadingSkeleton height="320px" />
        ) : historyError ? (
          <ErrorAlert title="Unable to load prediction data" message={historyError} />
        ) : (
          <TimeSeriesChart history={history} apId={selectedAPId} />
        )}
      </div>

      {/* Latency Telemetry Chart (shown for sample testbed validation APs) */}
      {history && history.has_testbed_telemetry && history.pred_latency_ms && history.pred_latency_ms.length > 0 && (
        <div className="card">
          <div className="card-header">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <Activity size={18} color="#38bdf8" />
                <h3 className="card-title">Controlled Lab Testbed Telemetry (Sample AP-{selectedAPId})</h3>
              </div>
              <span className="card-subtitle">
                Round-trip latency in isolated Linux network testbed comparing unmanaged Baseline vs Proactive Predictive QoS
              </span>
            </div>
            <span className="source-badge">
              CONTROLLED LAB TESTBED
            </span>
          </div>

          <LatencyTelemetryChart history={history} />
        </div>
      )}

      {/* Collapsible Model Specifications Section */}
      <ModelInsightCard metrics={overview?.model_metrics} />
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useTelemetry } from '../context/TelemetryContext';
import { apiService } from '../services/api';
import DecisionEngineChips from '../components/technical/DecisionEngineChips';
import HysteresisRulesCard from '../components/technical/HysteresisRulesCard';
import RegimeTelemetryTable from '../components/technical/RegimeTelemetryTable';
import AuditLogStream from '../components/technical/AuditLogStream';
import SafetyVerificationCard from '../components/technical/SafetyVerificationCard';
import { CardSkeleton } from '../components/common/LoadingSkeleton';
import { ErrorAlert } from '../components/common/EmptyState';
import { Cpu, Sliders, ShieldCheck, ChevronDown, ChevronUp, Database, FileText, CheckCircle2 } from 'lucide-react';

export default function TechnicalPage() {
  const { aps, selectedAPId, setSelectedAPId, overview } = useTelemetry();
  const [decision, setDecision] = useState(null);
  const [benchmarks, setBenchmarks] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Accordion open states (default first 2 open)
  const [openSections, setOpenSections] = useState({
    model: true,
    decision: true,
    hysteresis: false,
    regimes: false,
    audit: false,
    safety: false
  });

  const toggleSection = (key) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    Promise.allSettled([
      apiService.getDecision(selectedAPId),
      apiService.getQoSBenchmarks(),
      apiService.getAuditLogs(100)
    ]).then(([decRes, benchRes, auditRes]) => {
      if (!isMounted) return;

      if (decRes.status === 'fulfilled') setDecision(decRes.value);
      if (benchRes.status === 'fulfilled') setBenchmarks(benchRes.value);
      if (auditRes.status === 'fulfilled' && Array.isArray(auditRes.value)) setAuditLogs(auditRes.value);
      setLoading(false);
    }).catch(err => {
      if (isMounted) {
        setError(err.message || 'Error loading technical telemetry');
        setLoading(false);
      }
    });

    return () => { isMounted = false; };
  }, [selectedAPId]);

  if (loading && !decision) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <CardSkeleton count={3} />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {error && <ErrorAlert title="Technical Data Warning" message={error} />}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Technical NOC & Decision Operations</h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Deep architectural telemetry, stateful policy contracts, hysteresis thresholds, and actuation audit streams.
          </p>
        </div>

        {/* AP Selector Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label htmlFor="tech-ap-picker" style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            Inspect AP:
          </label>
          <select
            id="tech-ap-picker"
            value={selectedAPId}
            onChange={e => setSelectedAPId(Number(e.target.value))}
            className="search-input"
            style={{ width: 'auto', minWidth: '200px', fontWeight: 600 }}
          >
            {aps.map(ap => (
              <option key={ap.ap_id} value={ap.ap_id}>
                AP-{ap.ap_id} (Floor {ap.floor} • {ap.risk_level})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Section 1: ML Model & Offline Metrics */}
      <div className="accordion-item">
        <button className="accordion-header" onClick={() => toggleSection('model')}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Cpu size={18} color="var(--accent-primary)" />
            <span style={{ fontWeight: 600, fontSize: '1rem' }}>1. LightGBM Machine Learning Regressor</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>RMSE: 0.9154 • R²: 0.7742</span>
            {openSections.model ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </button>
        {openSections.model && (
          <div className="accordion-content">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
              <div className="metric-box">
                <div className="metric-label">Model Architecture</div>
                <div style={{ fontWeight: 600, fontSize: '0.9375rem' }}>LightGBM (150 trees)</div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>max_depth=8, num_leaves=63</span>
              </div>
              <div className="metric-box">
                <div className="metric-label">Test RMSE</div>
                <div style={{ fontWeight: 700, fontSize: '1.25rem', color: '#10b981' }}>0.9154</div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>vs 0.9527 Persistence</span>
              </div>
              <div className="metric-box">
                <div className="metric-label">Test R² Score</div>
                <div style={{ fontWeight: 700, fontSize: '1.25rem', color: 'var(--accent-primary)' }}>0.7742</div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>77.42% variance explained</span>
              </div>
              <div className="metric-box">
                <div className="metric-label">±1 User Accuracy</div>
                <div style={{ fontWeight: 700, fontSize: '1.25rem', color: '#f59e0b' }}>93.95%</div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>98.04% within ±2 users</span>
              </div>
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: 0 }}>
              Evaluated on chronological 70/15/15 train/val/test splits without shuffling to strictly prevent lookahead data leakage. Target: next native AP observation (~16.6 minute horizon).
            </p>
          </div>
        )}
      </div>

      {/* Section 2: Decision Engine 8-Chip Schema */}
      <div className="accordion-item">
        <button className="accordion-header" onClick={() => toggleSection('decision')}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sliders size={18} color="var(--accent-primary)" />
            <span style={{ fontWeight: 600, fontSize: '1rem' }}>2. Decision Engine State (AP-{selectedAPId})</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>8-Tuple Contract</span>
            {openSections.decision ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </button>
        {openSections.decision && (
          <div className="accordion-content">
            <DecisionEngineChips decision={decision} />
          </div>
        )}
      </div>

      {/* Section 3: Hysteresis Rules & Flap Reduction */}
      <div className="accordion-item">
        <button className="accordion-header" onClick={() => toggleSection('hysteresis')}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldCheck size={18} color="var(--accent-primary)" />
            <span style={{ fontWeight: 600, fontSize: '1rem' }}>3. Dual-Threshold Hysteresis & Cooldown Rules</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>39.2% Flap Reduction</span>
            {openSections.hysteresis ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </button>
        {openSections.hysteresis && (
          <div className="accordion-content">
            <HysteresisRulesCard />
          </div>
        )}
      </div>

      {/* Section 4: 12-Row Regime Table */}
      <div className="accordion-item">
        <button className="accordion-header" onClick={() => toggleSection('regimes')}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Database size={18} color="var(--accent-primary)" />
            <span style={{ fontWeight: 600, fontSize: '1rem' }}>4. Controlled Testbed Load Regime Breakdown</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>12 Telemetry Regimes</span>
            {openSections.regimes ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </button>
        {openSections.regimes && (
          <div className="accordion-content">
            <RegimeTelemetryTable regimes={benchmarks?.regimes} />
          </div>
        )}
      </div>

      {/* Section 5: Audit Log Stream */}
      <div className="accordion-item">
        <button className="accordion-header" onClick={() => toggleSection('audit')}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={18} color="var(--accent-primary)" />
            <span style={{ fontWeight: 600, fontSize: '1rem' }}>5. Policy Transition Audit Log Stream</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Chronological Trace</span>
            {openSections.audit ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </button>
        {openSections.audit && (
          <div className="accordion-content">
            <AuditLogStream logs={auditLogs} />
          </div>
        )}
      </div>

      {/* Section 6: Testbed Safety & Isolation */}
      <div className="accordion-item">
        <button className="accordion-header" onClick={() => toggleSection('safety')}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle2 size={18} color="#10b981" />
            <span style={{ fontWeight: 600, fontSize: '1rem' }}>6. Testbed Safety & Production Lockdown</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', color: '#10b981' }}>Safe Dry-Run</span>
            {openSections.safety ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </button>
        {openSections.safety && (
          <div className="accordion-content">
            <SafetyVerificationCard />
          </div>
        )}
      </div>
    </div>
  );
}

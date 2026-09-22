import React, { useState, useMemo } from 'react';
import { Search, Filter, ArrowRight, ShieldCheck, Clock } from 'lucide-react';
import RiskBadge from '../common/RiskBadge';

export default function AuditLogStream({ logs = [] }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [stateFilter, setStateFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      // State filter
      if (stateFilter !== 'ALL' && log.new_state !== stateFilter) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchAP = String(log.ap_id).includes(q) || `ap-${log.ap_id}`.includes(q);
        const matchReason = log.reason && log.reason.toLowerCase().includes(q);
        if (!matchAP && !matchReason) return false;
      }
      return true;
    });
  }, [logs, stateFilter, searchQuery]);

  const totalPages = Math.ceil(filteredLogs.length / pageSize) || 1;
  const paginatedLogs = filteredLogs.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="card" style={{ marginBottom: '1.5rem' }}>
      <div className="card-header">
        <div>
          <h3 className="card-title">Policy State Transition & Actuation Audit Trail</h3>
          <span className="card-subtitle">
            Immutable log stream recording every predictive risk evaluation and actuator transition
          </span>
        </div>
        <span className="source-badge">
          Total Log Entries: {logs.length}
        </span>
      </div>

      {/* Filter & Search Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {['ALL', 'NORMAL', 'MODERATE', 'HIGH', 'CRITICAL'].map(st => (
            <button
              key={st}
              className={`filter-chip-btn ${stateFilter === st ? 'active' : ''}`}
              onClick={() => { setStateFilter(st); setCurrentPage(1); }}
              style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
            >
              {st}
            </button>
          ))}
        </div>

        <div style={{ position: 'relative', minWidth: '220px' }}>
          <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            className="search-input"
            style={{ paddingLeft: '2.25rem', fontSize: '0.8125rem', padding: '0.4rem 0.75rem 0.4rem 2.25rem' }}
            placeholder="Search AP or Reason..."
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
          />
        </div>
      </div>

      {/* Table */}
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>AP ID</th>
              <th>State Transition</th>
              <th>Observed</th>
              <th>Predicted (~16.6m)</th>
              <th>Transition Reason</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {paginatedLogs.map((log, idx) => (
              <tr key={idx}>
                <td>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    {log.timestamp}
                  </span>
                </td>
                <td>
                  <span style={{ fontWeight: 600, color: 'var(--accent-primary)', fontFamily: 'var(--font-heading)' }}>
                    AP-{log.ap_id}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <RiskBadge level={log.previous_state} showIcon={false} size="sm" />
                    <ArrowRight size={12} color="var(--text-muted)" />
                    <RiskBadge level={log.new_state} showIcon={false} size="sm" />
                  </div>
                </td>
                <td>
                  <span style={{ fontWeight: 600 }}>{log.current_users} users</span>
                </td>
                <td>
                  <span style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>{log.predicted_users} users</span>
                </td>
                <td>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                    {log.reason}
                  </span>
                </td>
                <td>
                  <span style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 600, background: 'rgba(16, 185, 129, 0.1)', padding: '0.15rem 0.4rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                    {log.enforcement_status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
        <span>
          Showing {paginatedLogs.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} to {Math.min(currentPage * pageSize, filteredLogs.length)} of {filteredLogs.length} events
        </span>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            className="btn btn-secondary"
            style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
          >
            Previous
          </button>
          <span style={{ display: 'flex', alignItems: 'center', padding: '0 0.5rem' }}>
            Page {currentPage} of {totalPages}
          </span>
          <button
            className="btn btn-secondary"
            style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

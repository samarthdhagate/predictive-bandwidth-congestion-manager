import React from 'react';
import { Search, Filter, Layers } from 'lucide-react';

export default function FloorFilterBar({
  floorFilter,
  setFloorFilter,
  riskFilter,
  setRiskFilter,
  searchQuery,
  setSearchQuery,
  totalMatching,
  totalAps = 247
}) {
  const statusOptions = [
    { id: 'ALL', label: 'All Statuses' },
    { id: 'NORMAL', label: 'Low Load (<5)' },
    { id: 'MODERATE', label: 'Getting Busy (5-9)' },
    { id: 'HIGH', label: 'Busy (10-19)' },
    { id: 'CRITICAL', label: 'Very Busy (≥20)' }
  ];

  return (
    <div className="card" style={{ padding: '0.875rem 1.15rem', marginBottom: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        {/* Floor Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <Layers size={13} /> Floor:
          </span>
          <button
            className={`filter-chip-btn ${floorFilter === 'ALL' ? 'active' : ''}`}
            onClick={() => setFloorFilter('ALL')}
          >
            All (247)
          </button>
          <button
            className={`filter-chip-btn ${floorFilter === 0 ? 'active' : ''}`}
            onClick={() => setFloorFilter(0)}
          >
            Floor 0 (73)
          </button>
          <button
            className={`filter-chip-btn ${floorFilter === 1 ? 'active' : ''}`}
            onClick={() => setFloorFilter(1)}
          >
            Floor 1 (85)
          </button>
          <button
            className={`filter-chip-btn ${floorFilter === 2 ? 'active' : ''}`}
            onClick={() => setFloorFilter(2)}
          >
            Floor 2 (89)
          </button>
        </div>

        {/* Risk / Load Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <Filter size={13} /> Status:
          </span>
          {statusOptions.map(opt => (
            <button
              key={opt.id}
              className={`filter-chip-btn ${riskFilter === opt.id ? 'active' : ''}`}
              onClick={() => setRiskFilter(opt.id)}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div style={{ position: 'relative', minWidth: '200px', flex: '1', maxWidth: '300px' }}>
          <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            className="search-input"
            style={{ paddingLeft: '2.2rem', width: '100%' }}
            placeholder="Search AP ID or area..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            aria-label="Search access points"
          />
        </div>
      </div>

      <div style={{ marginTop: '0.65rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
        <span>Showing <strong>{totalMatching}</strong> of <strong>{totalAps}</strong> access points</span>
        <span>Click any AP tile for details</span>
      </div>
    </div>
  );
}

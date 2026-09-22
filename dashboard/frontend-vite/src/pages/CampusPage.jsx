import React, { useState, useMemo } from 'react';
import { useTelemetry } from '../context/TelemetryContext';
import FloorFilterBar from '../components/campus/FloorFilterBar';
import SpatialAPMatrix from '../components/campus/SpatialAPMatrix';
import APDetailDrawer from '../components/campus/APDetailDrawer';
import { CardSkeleton } from '../components/common/LoadingSkeleton';
import { ErrorAlert } from '../components/common/EmptyState';

export default function CampusPage({ initialFloor = 'ALL', onNavigate }) {
  const { aps, selectedAPId, setSelectedAPId, selectedAP, loading, error, refreshData } = useTelemetry();
  
  const [floorFilter, setFloorFilter] = useState(initialFloor);
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Filter APs dynamically
  const filteredAPs = useMemo(() => {
    return aps.filter(ap => {
      // Floor filter
      if (floorFilter !== 'ALL' && ap.floor !== Number(floorFilter)) {
        return false;
      }
      // Risk filter
      if (riskFilter !== 'ALL' && ap.risk_level !== riskFilter) {
        return false;
      }
      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchId = String(ap.ap_id).includes(query) || `ap-${ap.ap_id}`.includes(query);
        const matchRegion = ap.region && ap.region.toLowerCase().includes(query);
        if (!matchId && !matchRegion) return false;
      }
      return true;
    });
  }, [aps, floorFilter, riskFilter, searchQuery]);

  const handleSelectAP = (apId) => {
    setSelectedAPId(apId);
    setIsDrawerOpen(true);
  };

  const handleNavigateToPrediction = (apId) => {
    setSelectedAPId(apId);
    setIsDrawerOpen(false);
    if (onNavigate) {
      onNavigate('PREDICTION');
    }
  };

  if (loading && aps.length === 0) {
    return <CardSkeleton count={4} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {error && (
        <ErrorAlert
          title="Campus Data Offline"
          message={error}
          onRetry={refreshData}
        />
      )}

      {/* Page Header */}
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Campus Access Point Matrix</h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          Spatial distribution across 3 floors (Floor 0: 73 APs • Floor 1: 85 APs • Floor 2: 89 APs • Total: 247 APs)
        </p>
      </div>

      {/* Filter Bar */}
      <FloorFilterBar
        floorFilter={floorFilter}
        setFloorFilter={setFloorFilter}
        riskFilter={riskFilter}
        setRiskFilter={setRiskFilter}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        totalMatching={filteredAPs.length}
        totalAps={aps.length}
      />

      {/* AP Matrix */}
      <SpatialAPMatrix
        aps={filteredAPs}
        selectedAPId={selectedAPId}
        onSelectAP={handleSelectAP}
      />

      {/* Side Drawer for Selected AP */}
      {isDrawerOpen && selectedAP && (
        <APDetailDrawer
          ap={selectedAP}
          onClose={() => setIsDrawerOpen(false)}
          onNavigateToPrediction={handleNavigateToPrediction}
        />
      )}
    </div>
  );
}

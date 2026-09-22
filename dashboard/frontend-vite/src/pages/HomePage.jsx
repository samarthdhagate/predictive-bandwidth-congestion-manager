import React from 'react';
import { useTelemetry } from '../context/TelemetryContext';
import RecommendationHero from '../components/home/RecommendationHero';
import CampusSummaryCards from '../components/home/CampusSummaryCards';
import UpcomingSurgesCard from '../components/home/UpcomingSurgesCard';
import StatCard from '../components/common/StatCard';
import { CardSkeleton } from '../components/common/LoadingSkeleton';
import { ErrorAlert } from '../components/common/EmptyState';
import { Wifi, Users, ShieldAlert, Cpu, Activity } from 'lucide-react';

export default function HomePage({ onNavigate }) {
  const { aps, overview, floorStats, loading, error, refreshData, setSelectedAPId } = useTelemetry();

  const handleSelectAP = (apId) => {
    setSelectedAPId(apId);
    if (onNavigate) {
      onNavigate('PREDICTION');
    }
  };

  const handleSelectFloor = (floorId) => {
    if (onNavigate) {
      onNavigate('CAMPUS', { floor: floorId });
    }
  };

  if (loading && aps.length === 0) {
    return (
      <div>
        <CardSkeleton count={3} />
        <div style={{ marginTop: '2rem' }}>
          <CardSkeleton count={3} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {error && (
        <ErrorAlert
          title="Telemetry Synchronization Warning"
          message={error}
          onRetry={refreshData}
        />
      )}

      {/* Main Student / User Hero */}
      <RecommendationHero
        aps={aps}
        onSelectAP={handleSelectAP}
        onNavigateToCampus={() => onNavigate && onNavigate('CAMPUS')}
      />

      {/* Campus Floor Summaries */}
      <CampusSummaryCards
        floorStats={floorStats}
        onSelectFloor={handleSelectFloor}
      />

      {/* Upcoming Surge Watch */}
      <UpcomingSurgesCard
        aps={aps}
        onSelectAP={handleSelectAP}
      />
    </div>
  );
}

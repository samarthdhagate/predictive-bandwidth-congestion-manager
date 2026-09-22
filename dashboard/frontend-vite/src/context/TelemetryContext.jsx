import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { apiService } from '../services/api';

const TelemetryContext = createContext(null);

export function TelemetryProvider({ children }) {
  const [aps, setAps] = useState([]);
  const [overview, setOverview] = useState(null);
  const [selectedAPId, setSelectedAPId] = useState(10);
  const [isBackendHealthy, setIsBackendHealthy] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastSyncTime, setLastSyncTime] = useState(null);

  // Fetch baseline telemetry
  const refreshData = useCallback(async () => {
    try {
      setError(null);
      
      // Parallel fetch overview and all APs
      const [healthRes, overviewRes, apsRes] = await Promise.allSettled([
        apiService.getHealth(),
        apiService.getSystemOverview(),
        apiService.getAPs()
      ]);

      if (healthRes.status === 'fulfilled') {
        setIsBackendHealthy(true);
      } else {
        setIsBackendHealthy(false);
      }

      if (overviewRes.status === 'fulfilled') {
        setOverview(overviewRes.value);
      }

      if (apsRes.status === 'fulfilled' && Array.isArray(apsRes.value)) {
        setAps(apsRes.value);
      } else if (apsRes.status === 'rejected') {
        throw new Error(apsRes.reason?.message || 'Failed to fetch access points');
      }

      setLastSyncTime(new Date());
    } catch (err) {
      console.error('TelemetryContext sync error:', err);
      setError(err.message || 'Unable to communicate with backend server.');
      setIsBackendHealthy(false);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Auto-refresh interval (30 seconds)
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      refreshData();
    }, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshData]);

  // Compute selected AP object
  const selectedAP = useMemo(() => {
    if (!aps || aps.length === 0) return null;
    const found = aps.find(a => a.ap_id === selectedAPId);
    return found || aps[0];
  }, [aps, selectedAPId]);

  // Computed floor statistics from actual AP data
  const floorStats = useMemo(() => {
    const stats = {
      0: { total: 0, normal: 0, moderate: 0, high: 0, critical: 0, avgUsers: 0, totalUsers: 0 },
      1: { total: 0, normal: 0, moderate: 0, high: 0, critical: 0, avgUsers: 0, totalUsers: 0 },
      2: { total: 0, normal: 0, moderate: 0, high: 0, critical: 0, avgUsers: 0, totalUsers: 0 }
    };

    aps.forEach(ap => {
      const f = ap.floor;
      if (stats[f] !== undefined) {
        stats[f].total += 1;
        stats[f].totalUsers += ap.current_users || 0;
        const r = (ap.risk_level || 'NORMAL').toLowerCase();
        if (stats[f][r] !== undefined) {
          stats[f][r] += 1;
        }
      }
    });

    [0, 1, 2].forEach(f => {
      if (stats[f].total > 0) {
        stats[f].avgUsers = Number((stats[f].totalUsers / stats[f].total).toFixed(1));
      }
    });

    return stats;
  }, [aps]);

  const value = {
    aps,
    overview,
    selectedAPId,
    setSelectedAPId,
    selectedAP,
    floorStats,
    isBackendHealthy,
    loading,
    error,
    autoRefresh,
    setAutoRefresh,
    lastSyncTime,
    refreshData
  };

  return (
    <TelemetryContext.Provider value={value}>
      {children}
    </TelemetryContext.Provider>
  );
}

export function useTelemetry() {
  const context = useContext(TelemetryContext);
  if (!context) {
    throw new Error('useTelemetry must be used within a TelemetryProvider');
  }
  return context;
}

import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import QoSConceptFlow from '../components/qos/QoSConceptFlow';
import BreakthroughBanner from '../components/qos/BreakthroughBanner';
import ScenarioCompareGrid from '../components/qos/ScenarioCompareGrid';
import TradeOffCallout from '../components/qos/TradeOffCallout';
import { CardSkeleton } from '../components/common/LoadingSkeleton';
import { ErrorAlert } from '../components/common/EmptyState';

export default function QoSPage() {
  const [benchmarks, setBenchmarks] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    apiService.getQoSBenchmarks()
      .then(res => {
        if (isMounted) setBenchmarks(res);
      })
      .catch(err => {
        if (isMounted) setError(err.message || 'Failed to fetch QoS benchmarks');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <CardSkeleton count={4} />
        <CardSkeleton count={3} />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {error && <ErrorAlert title="Benchmark Data Error" message={error} />}

      {/* Page Header */}
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Quality of Service (QoS) Testbed Benchmarks</h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          Closed-loop actuation results demonstrating how proactive bandwidth shaping eliminates queue bufferbloat during congestion peaks.
        </p>
      </div>

      {/* 4-Step Plain English Conceptual Flow */}
      <QoSConceptFlow />

      {/* Breakthrough Critical-Load Reductions */}
      <BreakthroughBanner />

      {/* 3-Way Scenario Comparison Table */}
      <ScenarioCompareGrid benchmarks={benchmarks} />

      {/* Transparent Engineering Trade-off & Tuning Matrix */}
      <TradeOffCallout tradeoffs={benchmarks?.tradeoffs} />
    </div>
  );
}

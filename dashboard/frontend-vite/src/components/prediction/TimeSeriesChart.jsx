import React, { useState, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function TimeSeriesChart({ history, apId }) {
  const [windowSize, setWindowSize] = useState(40); // show last 40 observations for readable chart

  if (!history || !history.timestamps || history.timestamps.length === 0) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-md)' }}>
        <p style={{ color: 'var(--text-muted)' }}>
          Prediction history is currently unavailable for AP-{apId}.
        </p>
      </div>
    );
  }

  const totalLen = history.timestamps.length;
  const sliceStart = Math.max(0, totalLen - windowSize);

  const slicedTimestamps = history.timestamps.slice(sliceStart);
  const slicedActual = (history.actual_users || []).slice(sliceStart);
  const slicedPred = (history.predicted_users || []).slice(sliceStart);

  // Format timestamps into readable hour:minute format
  const labels = slicedTimestamps.map((ts, idx) => {
    try {
      const cleanTs = ts.replace(' CEST', '').replace(' CET', '');
      const d = new Date(cleanTs);
      if (!isNaN(d.getTime())) {
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      return `T+${idx}`;
    } catch {
      return `T+${idx}`;
    }
  });

  const data = {
    labels,
    datasets: [
      {
        label: 'Actual People Connected',
        data: slicedActual,
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.08)',
        borderWidth: 2.2,
        pointRadius: windowSize > 60 ? 1 : 2.5,
        pointHoverRadius: 5,
        tension: 0.2,
        fill: true,
      },
      {
        label: 'Expected in ~17 min (LightGBM)',
        data: slicedPred,
        borderColor: '#38bdf8',
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderDash: [4, 4],
        pointRadius: windowSize > 60 ? 1 : 2.5,
        pointHoverRadius: 5,
        tension: 0.2,
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#cbd5e1',
          font: { family: 'Inter', size: 12, weight: 500 },
          usePointStyle: true,
          boxWidth: 8
        }
      },
      tooltip: {
        backgroundColor: '#0f172a',
        titleColor: '#f8fafc',
        bodyColor: '#cbd5e1',
        borderColor: 'rgba(255, 255, 255, 0.12)',
        borderWidth: 1,
        padding: 10,
        callbacks: {
          label: function(context) {
            return ` ${context.dataset.label}: ${Number(context.parsed.y).toFixed(1)} people`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(255, 255, 255, 0.04)' },
        ticks: { color: '#64748b', maxTicksLimit: 12, font: { size: 11 } }
      },
      y: {
        title: { display: true, text: 'People Connected', color: '#94a3b8', font: { size: 11 } },
        grid: { color: 'rgba(255, 255, 255, 0.04)' },
        ticks: { color: '#64748b', font: { size: 11 } },
        beginAtZero: true
      }
    }
  };

  return (
    <div>
      {/* Zoom / Window Selector */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Display window:</span>
          {[
            { label: 'Last 20 (~5.5 hrs)', val: 20 },
            { label: 'Last 40 (~11 hrs)', val: 40 },
            { label: 'Last 100 (~28 hrs)', val: 100 },
            { label: 'Full Replay (770)', val: 770 }
          ].map(w => (
            <button
              key={w.val}
              className={`filter-chip-btn ${windowSize === w.val ? 'active' : ''}`}
              style={{ padding: '0.25rem 0.55rem', fontSize: '0.75rem' }}
              onClick={() => setWindowSize(w.val)}
            >
              {w.label}
            </button>
          ))}
        </div>

        <span className="source-badge">
          HISTORICAL MODEL REPLAY • Lead time: ~17 min
        </span>
      </div>

      <div style={{ height: '320px', width: '100%', position: 'relative' }}>
        <Line data={data} options={options} />
      </div>
    </div>
  );
}

import React from 'react';
import { Line } from 'react-chartjs-2';

export default function LatencyTelemetryChart({ history }) {
  if (!history || !history.timestamps || history.timestamps.length === 0 || !history.pred_latency_ms || history.pred_latency_ms.length === 0) {
    return null;
  }

  const labels = history.timestamps.map((ts, idx) => {
    try {
      const d = new Date(ts);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return `T+${idx}`;
    }
  });

  const data = {
    labels,
    datasets: [
      {
        label: 'Baseline No-QoS Latency (ms)',
        data: history.base_latency_ms || [],
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.05)',
        borderWidth: 2,
        pointRadius: 2,
        tension: 0.25,
      },
      {
        label: 'Predictive QoS Latency (ms)',
        data: history.pred_latency_ms || [],
        borderColor: '#38bdf8',
        backgroundColor: 'rgba(56, 189, 248, 0.1)',
        borderWidth: 2,
        pointRadius: 2,
        tension: 0.25,
        fill: true,
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#cbd5e1',
          font: { family: 'Inter', size: 11 },
          usePointStyle: true,
          boxWidth: 8
        }
      },
      tooltip: {
        backgroundColor: '#0f172a',
        callbacks: {
          label: function(context) {
            return ` ${context.dataset.label}: ${context.parsed.y.toFixed(2)} ms`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#64748b', maxTicksLimit: 10, font: { size: 10 } }
      },
      y: {
        title: { display: true, text: 'RTT Latency (ms)', color: '#94a3b8', font: { size: 11 } },
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#64748b', font: { size: 10 } },
        beginAtZero: true
      }
    }
  };

  return (
    <div style={{ height: '240px', width: '100%', position: 'relative' }}>
      <Line data={data} options={options} />
    </div>
  );
}

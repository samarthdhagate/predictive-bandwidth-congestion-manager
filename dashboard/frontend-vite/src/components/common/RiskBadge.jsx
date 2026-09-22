import React from 'react';
import { ShieldCheck, AlertCircle, AlertTriangle, Flame } from 'lucide-react';

const STATUS_CONFIG = {
  NORMAL: {
    humanLabel: 'LOW LOAD',
    techLabel: 'NORMAL (<5)',
    className: 'low',
    icon: ShieldCheck,
    text: 'Low traffic load (<5 people connected)'
  },
  MODERATE: {
    humanLabel: 'GETTING BUSY',
    techLabel: 'MODERATE (5-9)',
    className: 'moderate',
    icon: AlertCircle,
    text: 'Rising load (5-9 people connected)'
  },
  HIGH: {
    humanLabel: 'BUSY',
    techLabel: 'HIGH (10-19)',
    className: 'high',
    icon: AlertTriangle,
    text: 'High traffic (10-19 people connected)'
  },
  CRITICAL: {
    humanLabel: 'VERY BUSY',
    techLabel: 'CRITICAL (≥20)',
    className: 'critical',
    icon: Flame,
    text: 'Severe congestion (≥20 people connected)'
  }
};

export default function RiskBadge({ level = 'NORMAL', showIcon = true, showSubtext = false, size = 'md', isTechnical = false }) {
  const normalized = (level || 'NORMAL').toUpperCase();
  const config = STATUS_CONFIG[normalized] || STATUS_CONFIG.NORMAL;
  const IconComponent = config.icon;

  const sizeStyles = {
    sm: { padding: '0.15rem 0.45rem', fontSize: '0.6875rem' },
    md: { padding: '0.25rem 0.6rem', fontSize: '0.75rem' },
    lg: { padding: '0.35rem 0.8rem', fontSize: '0.8125rem' }
  }[size] || { padding: '0.25rem 0.6rem', fontSize: '0.75rem' };

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.2rem' }}>
      <span
        className={`status-badge ${config.className}`}
        style={sizeStyles}
      >
        {showIcon && <IconComponent size={size === 'lg' ? 15 : 12} />}
        {isTechnical ? config.techLabel : config.humanLabel}
      </span>
      {showSubtext && (
        <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
          {config.text}
        </span>
      )}
    </div>
  );
}

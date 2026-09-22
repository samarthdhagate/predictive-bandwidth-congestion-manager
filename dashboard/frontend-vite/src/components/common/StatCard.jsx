import React from 'react';

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendPositive = true,
  badgeText,
  badgeType = 'default',
  accentColor
}) {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 500 }}>
          {title}
        </span>
        {Icon && (
          <div style={{
            padding: '0.4rem',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: 'var(--radius-sm)',
            color: accentColor || 'var(--accent-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Icon size={18} />
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
        <span style={{
          fontFamily: 'var(--font-heading)',
          fontSize: '1.875rem',
          fontWeight: 700,
          color: accentColor || 'var(--text-primary)',
          letterSpacing: '-0.02em',
          lineHeight: 1
        }}>
          {value}
        </span>
        {badgeText && (
          <span style={{
            fontSize: '0.7rem',
            fontWeight: 600,
            padding: '0.15rem 0.45rem',
            borderRadius: 'var(--radius-sm)',
            background: badgeType === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(56, 189, 248, 0.15)',
            color: badgeType === 'success' ? '#10b981' : '#38bdf8',
            border: `1px solid ${badgeType === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(56, 189, 248, 0.3)'}`
          }}>
            {badgeText}
          </span>
        )}
      </div>

      {(subtitle || trend) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem' }}>
          {trend && (
            <span style={{
              fontWeight: 600,
              color: trendPositive ? '#10b981' : '#ef4444'
            }}>
              {trend}
            </span>
          )}
          {subtitle && (
            <span style={{ color: 'var(--text-secondary)' }}>
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

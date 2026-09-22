import React from 'react';
import { Inbox, AlertCircle, RefreshCw } from 'lucide-react';

export function EmptyState({
  title = 'No Data Available',
  message = 'There are no items matching your criteria at this moment.',
  icon: Icon = Inbox,
  actionLabel,
  onAction
}) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '3rem 1.5rem',
      textAlign: 'center',
      background: 'rgba(255, 255, 255, 0.02)',
      border: '1px dashed var(--border-medium)',
      borderRadius: 'var(--radius-lg)',
      width: '100%'
    }}>
      <div style={{
        width: '52px',
        height: '52px',
        borderRadius: 'var(--radius-full)',
        background: 'rgba(255, 255, 255, 0.05)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-muted)',
        marginBottom: '1rem'
      }}>
        <Icon size={24} />
      </div>
      <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.375rem' }}>
        {title}
      </h3>
      <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', maxWidth: '400px', marginBottom: actionLabel ? '1.25rem' : 0 }}>
        {message}
      </p>
      {actionLabel && onAction && (
        <button className="btn btn-secondary" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export function ErrorAlert({
  title = 'Backend Communication Issue',
  message = 'Could not sync latest telemetry with the FastAPI server.',
  onRetry
}) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: '1rem',
      padding: '1rem 1.25rem',
      background: 'rgba(239, 68, 68, 0.1)',
      border: '1px solid rgba(239, 68, 68, 0.3)',
      borderRadius: 'var(--radius-md)',
      marginBottom: '1.5rem'
    }}>
      <AlertCircle size={20} color="#ef4444" style={{ flexShrink: 0, marginTop: '2px' }} />
      <div style={{ flex: 1 }}>
        <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#fca5a5', marginBottom: '0.25rem' }}>
          {title}
        </h4>
        <p style={{ fontSize: '0.8125rem', color: '#fecaca', margin: 0 }}>
          {message}
        </p>
      </div>
      {onRetry && (
        <button
          className="btn btn-secondary"
          onClick={onRetry}
          style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
        >
          <RefreshCw size={14} /> Retry
        </button>
      )}
    </div>
  );
}

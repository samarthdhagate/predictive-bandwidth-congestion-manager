import React from 'react';

export function LoadingSkeleton({ height = '100px', width = '100%', radius = 'var(--radius-md)' }) {
  return (
    <div
      className="skeleton"
      style={{
        height,
        width,
        borderRadius: radius,
        margin: '0.25rem 0'
      }}
    />
  );
}

export function CardSkeleton({ count = 3 }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${count}, 1fr)`, gap: '1rem', width: '100%' }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card" style={{ height: '140px' }}>
          <LoadingSkeleton height="1.2rem" width="40%" />
          <LoadingSkeleton height="2.5rem" width="60%" style={{ margin: '1rem 0' }} />
          <LoadingSkeleton height="0.9rem" width="80%" />
        </div>
      ))}
    </div>
  );
}

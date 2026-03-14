'use client';
import { useState } from 'react';

export default function CompatibilityBadge({ score, breakdown }) {
  const [showTooltip, setShowTooltip] = useState(false);

  // Determine badge color based on score thresholds
  let badgeColor = 'var(--text-primary)';
  let bgGlow = 'rgba(255,255,255,0.1)';
  let icon = '🤍';
  
  if (score >= 80) {
    badgeColor = 'var(--success)';
    bgGlow = 'rgba(16, 185, 129, 0.15)';
    icon = '💚';
  } else if (score >= 60) {
    badgeColor = 'var(--accent-light)';
    bgGlow = 'rgba(251, 191, 36, 0.15)';
    icon = '💛';
  } else {
    badgeColor = 'var(--danger)';
    bgGlow = 'rgba(239, 68, 68, 0.15)';
    icon = '💔';
  }

  return (
    <div 
      style={{ position: 'relative', display: 'inline-block' }}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px 10px',
        borderRadius: 'var(--radius-full)',
        background: bgGlow,
        color: badgeColor,
        fontSize: '0.8rem',
        fontWeight: '700',
        cursor: 'help',
        border: `1px solid ${badgeColor}40`
      }}>
        <span>{icon}</span> {score}% Match
      </div>

      {showTooltip && breakdown && (
        <div style={{
          position: 'absolute',
          bottom: 'calc(100% + 8px)',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          padding: '16px',
          width: '240px',
          boxShadow: 'var(--shadow-lg)',
          zIndex: 100,
          color: 'var(--text-primary)'
        }}>
          <h4 style={{ fontSize: '0.85rem', marginBottom: '12px', color: 'var(--text-secondary)' }}>Compatibility Breakdown</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {Object.entries(breakdown).map(([key, val]) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ flex: 1, fontSize: '0.8rem', textTransform: 'capitalize' }}>{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                <div style={{ width: '60px', height: '6px', background: 'var(--bg-tertiary)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${val}%`, height: '100%', background: val >= 70 ? 'var(--success)' : (val >= 40 ? 'var(--accent)' : 'var(--danger)') }} />
                </div>
                <span style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>{val}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

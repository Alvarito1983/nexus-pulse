import { useState } from 'react';

export function Input({ label, error, style = {}, ...props }) {
  const [focused, setFocused] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && (
        <label style={{
          fontSize: 'var(--text-xs)',
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          fontWeight: 'var(--weight-medium)',
        }}>
          {label}
        </label>
      )}
      <input
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: '100%',
          background: 'var(--bg-base)',
          border: `1px solid ${error ? 'var(--color-danger)' : focused ? 'var(--accent)' : 'var(--border-default)'}`,
          borderRadius: 'var(--radius-md)',
          padding: '9px 12px',
          color: 'var(--text-primary)',
          fontSize: 'var(--text-sm)',
          outline: 'none',
          transition: 'border-color var(--transition-fast)',
          fontFamily: 'var(--font-sans)',
          ...style,
        }}
        {...props}
      />
      {error && (
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-danger)' }}>{error}</span>
      )}
    </div>
  );
}

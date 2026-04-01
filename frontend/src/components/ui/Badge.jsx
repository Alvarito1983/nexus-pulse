const BADGE_STYLES = {
  up: {
    bg: 'rgba(0,200,150,0.12)',
    color: 'var(--status-up)',
    border: 'rgba(0,200,150,0.25)',
    dot: true,
  },
  down: {
    bg: 'rgba(239,68,68,0.12)',
    color: 'var(--status-down)',
    border: 'rgba(239,68,68,0.25)',
    dot: true,
  },
  pending: {
    bg: 'rgba(240,165,0,0.12)',
    color: 'var(--status-pending)',
    border: 'rgba(240,165,0,0.25)',
    dot: false,
  },
  paused: {
    bg: 'rgba(85,85,106,0.15)',
    color: 'var(--status-paused)',
    border: 'rgba(85,85,106,0.30)',
    dot: false,
  },
  info: {
    bg: 'var(--accent-dim)',
    color: 'var(--accent)',
    border: 'rgba(59,130,246,0.25)',
    dot: false,
  },
  warning: {
    bg: 'rgba(240,165,0,0.12)',
    color: 'var(--color-warning)',
    border: 'rgba(240,165,0,0.25)',
    dot: false,
  },
};

export function Badge({ variant = 'info', children, style = {} }) {
  const b = BADGE_STYLES[variant] || BADGE_STYLES.info;
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      background: b.bg,
      color: b.color,
      border: `1px solid ${b.border}`,
      borderRadius: 'var(--radius-sm)',
      padding: '2px 8px',
      fontSize: 'var(--text-xs)',
      fontWeight: 'var(--weight-semibold)',
      whiteSpace: 'nowrap',
      ...style,
    }}>
      {b.dot && (
        <span style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: b.color,
          flexShrink: 0,
          animation: variant === 'up' ? 'none' : variant === 'down' ? 'none' : undefined,
        }} />
      )}
      {children}
    </span>
  );
}

export function Card({ children, style = {}, ...props }) {
  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-lg)',
      ...style,
    }} {...props}>
      {children}
    </div>
  );
}

const ACCENT_COLORS = {
  default: 'var(--accent)',
  success: 'var(--color-success)',
  danger:  'var(--color-danger)',
  warning: 'var(--color-warning)',
  info:    'var(--color-info)',
};

export function StatCard({ label, value, accent = 'default', style = {} }) {
  const color = ACCENT_COLORS[accent] || ACCENT_COLORS.default;
  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-lg)',
      padding: '20px 24px',
      position: 'relative',
      overflow: 'hidden',
      ...style,
    }}>
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0,
        height: 2,
        background: color,
        borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
      }} />
      <div style={{
        fontSize: 'var(--text-xs)',
        color: 'var(--text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        fontWeight: 'var(--weight-medium)',
        marginBottom: 8,
      }}>
        {label}
      </div>
      <div style={{
        fontSize: 'var(--text-2xl)',
        fontWeight: 'var(--weight-semibold)',
        color,
        letterSpacing: '-0.02em',
        lineHeight: 1,
      }}>
        {value}
      </div>
    </div>
  );
}

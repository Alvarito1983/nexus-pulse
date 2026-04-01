export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '64px 24px',
      gap: 12,
      textAlign: 'center',
    }}>
      {Icon && (
        <div style={{
          width: 48,
          height: 48,
          borderRadius: '50%',
          background: 'var(--accent-dim)',
          border: '1px solid rgba(59,130,246,0.20)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 4,
        }}>
          <Icon size={22} color="var(--accent)" />
        </div>
      )}
      <div style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)', color: 'var(--text-primary)' }}>
        {title}
      </div>
      {description && (
        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', maxWidth: 300 }}>
          {description}
        </div>
      )}
      {action && <div style={{ marginTop: 8 }}>{action}</div>}
    </div>
  );
}

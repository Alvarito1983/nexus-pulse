export function Skeleton({ width, height = 14, style = {} }) {
  return (
    <div className="skeleton" style={{ width: width || '100%', height, ...style }} />
  );
}

export function SkeletonRow() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0' }}>
      <Skeleton width={10} height={10} style={{ borderRadius: '50%', flexShrink: 0 }} />
      <Skeleton width={140} />
      <Skeleton width={200} />
      <div style={{ flex: 1 }} />
      <Skeleton width={120} height={20} />
      <Skeleton width={60} />
    </div>
  );
}

export function SkeletonMonitorCard() {
  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-lg)',
      padding: '16px 20px',
      marginBottom: 8,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Skeleton width={10} height={10} style={{ borderRadius: '50%', flexShrink: 0 }} />
        <Skeleton width={150} height={14} />
        <Skeleton width={220} height={12} />
        <div style={{ flex: 1 }} />
        <Skeleton width={140} height={20} />
        <Skeleton width={50} height={14} />
        <Skeleton width={70} height={22} style={{ borderRadius: 'var(--radius-sm)' }} />
      </div>
    </div>
  );
}

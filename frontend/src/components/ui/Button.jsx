import { Loader2 } from 'lucide-react';

const VARIANTS = {
  primary: {
    background: 'var(--accent)',
    color: '#fff',
    border: 'none',
  },
  secondary: {
    background: 'var(--accent-dim)',
    color: 'var(--accent)',
    border: '1px solid rgba(59,130,246,0.30)',
  },
  ghost: {
    background: 'transparent',
    color: 'var(--text-secondary)',
    border: '1px solid var(--border-default)',
  },
  danger: {
    background: 'transparent',
    color: 'var(--color-danger)',
    border: '1px solid rgba(239,68,68,0.40)',
  },
};

const SIZES = {
  sm: { padding: '4px 10px', fontSize: 'var(--text-xs)', borderRadius: 'var(--radius-sm)' },
  md: { padding: '8px 16px', fontSize: 'var(--text-sm)', borderRadius: 'var(--radius-md)' },
};

export function Button({ variant = 'primary', size = 'md', loading = false, disabled = false, children, style = {}, ...props }) {
  const v = VARIANTS[variant] || VARIANTS.primary;
  const s = SIZES[size] || SIZES.md;
  const isDisabled = disabled || loading;

  return (
    <button
      disabled={isDisabled}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        cursor: isDisabled ? 'default' : 'pointer',
        fontWeight: 'var(--weight-semibold)',
        transition: 'opacity var(--transition-fast), box-shadow var(--transition-fast)',
        opacity: isDisabled ? 0.6 : 1,
        flexShrink: 0,
        ...v,
        ...s,
        ...style,
      }}
      {...props}
    >
      {loading && <Loader2 size={12} style={{ animation: 'spin 0.8s linear infinite' }} />}
      {children}
    </button>
  );
}

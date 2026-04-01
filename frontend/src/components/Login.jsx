import { useState } from 'react';
import { t, useLang, LangSelector } from './i18n.jsx';

const PulseLogo = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192" width="52" height="52" style={{ borderRadius: 10, flexShrink: 0 }}>
    <rect width="192" height="192" rx="40" fill="#001233"/>
    <rect x="18" y="18" width="72" height="72" rx="14" fill="#3b82f6"/>
    <rect x="102" y="18" width="72" height="72" rx="14" fill="#3b82f6" opacity="0.55"/>
    <rect x="18" y="102" width="72" height="72" rx="14" fill="#3b82f6" opacity="0.3"/>
    <rect x="102" y="102" width="72" height="72" rx="14" fill="none" stroke="#3b82f6" strokeWidth="5"/>
    <text x="138" y="158" fontFamily="Arial Black, Arial, sans-serif" fontSize="56" fontWeight="900" fill="#3b82f6" textAnchor="middle">P</text>
    <line x1="90" y1="54" x2="102" y2="54" stroke="#3b82f6" strokeWidth="5" opacity="0.45" strokeLinecap="round"/>
    <line x1="54" y1="90" x2="54" y2="102" stroke="#3b82f6" strokeWidth="5" opacity="0.45" strokeLinecap="round"/>
    <line x1="90" y1="138" x2="102" y2="138" stroke="#3b82f6" strokeWidth="5" opacity="0.45" strokeLinecap="round"/>
    <line x1="138" y1="90" x2="138" y2="102" stroke="#3b82f6" strokeWidth="5" opacity="0.45" strokeLinecap="round"/>
  </svg>
);

export default function Login({ onLogin }) {
  useLang();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [userFocused, setUserFocused] = useState(false);
  const [passFocused, setPassFocused] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!username || !password) return setError(t('enterCredentials'));
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (data.ok) {
        localStorage.setItem('pulse-token', data.token);
        localStorage.setItem('pulse-user', JSON.stringify(data.user));
        onLogin(data.token, data.user);
      } else {
        setError(t('invalidCredentials'));
      }
    } catch { setError(t('connectionError')); }
    finally { setLoading(false); }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-base)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Radial blue glow */}
      <div style={{
        position: 'absolute',
        top: '30%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 600,
        height: 600,
        background: 'radial-gradient(circle, rgba(59,130,246,0.10) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Language selector */}
      <div style={{ position: 'fixed', top: 20, right: 24, zIndex: 10 }}>
        <LangSelector />
      </div>

      {/* Login card */}
      <div className="animate-in" style={{
        width: '100%',
        maxWidth: 380,
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-lg)',
        padding: 40,
        margin: '0 16px',
        position: 'relative',
        zIndex: 1,
      }}>
        {/* Logo + header */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 32, gap: 16 }}>
          <PulseLogo />
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-semibold)', color: 'var(--text-primary)', marginBottom: 6 }}>
              {t('welcomeBack')}
            </h1>
            <p style={{ fontSize: 'var(--text-base)', color: 'var(--text-secondary)' }}>
              {t('signInDesc')}
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{
              display: 'block',
              fontSize: 'var(--text-xs)',
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: 6,
              fontWeight: 'var(--weight-medium)',
            }}>
              {t('username')}
            </label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              onFocus={() => setUserFocused(true)}
              onBlur={() => setUserFocused(false)}
              autoFocus
              style={{
                width: '100%',
                background: 'var(--bg-base)',
                border: `1px solid ${userFocused ? 'var(--accent)' : 'var(--border-default)'}`,
                borderRadius: 'var(--radius-md)',
                padding: '10px 14px',
                color: 'var(--text-primary)',
                fontSize: 'var(--text-base)',
                outline: 'none',
                transition: 'border-color var(--transition-fast)',
                fontFamily: 'var(--font-sans)',
              }}
            />
          </div>
          <div>
            <label style={{
              display: 'block',
              fontSize: 'var(--text-xs)',
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: 6,
              fontWeight: 'var(--weight-medium)',
            }}>
              {t('password')}
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onFocus={() => setPassFocused(true)}
              onBlur={() => setPassFocused(false)}
              style={{
                width: '100%',
                background: 'var(--bg-base)',
                border: `1px solid ${passFocused ? 'var(--accent)' : 'var(--border-default)'}`,
                borderRadius: 'var(--radius-md)',
                padding: '10px 14px',
                color: 'var(--text-primary)',
                fontSize: 'var(--text-base)',
                outline: 'none',
                transition: 'border-color var(--transition-fast)',
                fontFamily: 'var(--font-sans)',
              }}
            />
          </div>

          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.25)',
              borderRadius: 'var(--radius-md)',
              padding: '10px 14px',
              color: 'var(--color-danger)',
              fontSize: 'var(--text-sm)',
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              background: 'var(--accent)',
              color: '#fff',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              padding: '11px',
              fontSize: 'var(--text-base)',
              fontWeight: 'var(--weight-semibold)',
              cursor: loading ? 'default' : 'pointer',
              opacity: loading ? 0.7 : 1,
              transition: 'opacity var(--transition-fast), box-shadow var(--transition-fast)',
              boxShadow: loading ? 'none' : '0 0 0 0 var(--accent-glow)',
              fontFamily: 'var(--font-sans)',
              marginTop: 4,
            }}
            onMouseEnter={e => { if (!loading) e.target.style.boxShadow = 'var(--shadow-accent)'; }}
            onMouseLeave={e => { e.target.style.boxShadow = 'none'; }}
          >
            {loading ? t('signingIn') : t('signIn')}
          </button>
        </form>

        {/* Footer */}
        <p style={{
          marginTop: 24,
          fontSize: 'var(--text-xs)',
          color: 'var(--text-muted)',
          textAlign: 'center',
          fontFamily: 'var(--font-mono)',
        }}>
          NEXUS Pulse v{__APP_VERSION__}
        </p>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { t, useLang, LangSelector } from './i18n.jsx';

const PulseLogo = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192"
       width="52" height="52" style={{borderRadius:10}}>
    <rect width="192" height="192" rx="40" fill="#001233"/>
    <rect x="18" y="18" width="72" height="72" rx="14" fill="#3b82f6"/>
    <rect x="102" y="18" width="72" height="72" rx="14" fill="#3b82f6" opacity="0.55"/>
    <rect x="18" y="102" width="72" height="72" rx="14" fill="#3b82f6" opacity="0.3"/>
    <rect x="102" y="102" width="72" height="72" rx="14"
          fill="none" stroke="#3b82f6" strokeWidth="5"/>
    <text x="138" y="158" fontFamily="Arial Black, Arial, sans-serif"
          fontSize="56" fontWeight="900" fill="#3b82f6" textAnchor="middle">P</text>
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

  const s = { bg: '#0d1117', surface: '#161b22', border: '#30363d', accent: '#3b82f6', text: '#e6edf3', muted: '#8b949e' };

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
    <div style={{ minHeight: '100vh', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'fixed', top: 20, right: 24 }}><LangSelector /></div>
      <div style={{ display: 'flex', width: '100%', maxWidth: 900, minHeight: 480, borderRadius: 16, overflow: 'hidden', border: `1px solid ${s.border}` }}>
        {/* Left */}
        <div style={{ flex: 1, background: '#0a0f1e', padding: '48px 40px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <PulseLogo />
            <h1 style={{ marginTop: 24, fontSize: 32, fontWeight: 700, color: s.text, lineHeight: 1.2 }}>{t('appSubtitle')}</h1>
            <p style={{ marginTop: 16, color: s.muted, fontSize: 14, lineHeight: 1.7 }}>{t('monitor')}</p>
          </div>
          <div style={{ display: 'flex', gap: 24 }}>
            {[{l: t('realTime'), s: 'Live'}, {l: t('autoRecover'), s: 'Docker'}, {l: t('alerts'), s: 'Telegram'}].map(f => (
              <div key={f.l}>
                <div style={{ fontSize: 13, fontWeight: 600, color: s.accent }}>{f.l}</div>
                <div style={{ fontSize: 11, color: s.muted }}>{f.s}</div>
              </div>
            ))}
          </div>
        </div>
        {/* Right */}
        <div style={{ width: 380, background: s.surface, padding: '48px 40px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h2 style={{ fontSize: 22, fontWeight: 600, color: s.text, marginBottom: 6 }}>{t('welcomeBack')}</h2>
          <p style={{ fontSize: 13, color: s.muted, marginBottom: 32 }}>{t('signInDesc')}</p>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, color: s.muted, marginBottom: 6 }}>{t('username')}</label>
              <input type="text" value={username} onChange={e => setUsername(e.target.value)} autoFocus
                style={{ width: '100%', background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8, padding: '10px 14px', color: s.text, fontSize: 14, outline: 'none' }} />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 12, color: s.muted, marginBottom: 6 }}>{t('password')}</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                style={{ width: '100%', background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8, padding: '10px 14px', color: s.text, fontSize: 14, outline: 'none' }} />
            </div>
            {error && <div style={{ background: '#2d1a1a', border: '1px solid #5a2a2a', borderRadius: 6, padding: '10px 14px', color: '#f85149', fontSize: 13, marginBottom: 16 }}>{error}</div>}
            <button type="submit" disabled={loading}
              style={{ width: '100%', background: s.accent, color: '#fff', border: 'none', borderRadius: 8, padding: '11px', fontSize: 14, fontWeight: 600, cursor: loading ? 'default' : 'pointer', opacity: loading ? 0.7 : 1 }}>
              {loading ? t('signingIn') : t('signIn')}
            </button>
          </form>
          <p style={{ marginTop: 24, fontSize: 11, color: s.muted, textAlign: 'center' }}>NEXUS Pulse v1.0.0</p>
        </div>
      </div>
    </div>
  );
}

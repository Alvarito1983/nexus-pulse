import { useState, useEffect } from 'react';
import { t, useLang, LangSelector } from './i18n.jsx';
import ContainersView from './ContainersView.jsx';
import MonitorsView from './MonitorsView.jsx';
import SettingsView from './SettingsView.jsx';

const API = '/api';

export function authFetch(url, options = {}) {
  const token = localStorage.getItem('pulse-token');
  return fetch(url, {
    ...options,
    headers: { ...options.headers, Authorization: token ? `Bearer ${token}` : '', 'Content-Type': 'application/json' },
  });
}

const PulseLogo = ({ size = 32 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192" width={size} height={size} style={{ borderRadius: size * 0.22, flexShrink: 0 }}>
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

function timeAgo(ts) {
  if (!ts) return t('never');
  const d = Date.now() - new Date(ts).getTime();
  const m = Math.floor(d / 60000);
  if (m < 1) return t('justNow');
  if (m < 60) return `${m}m ${t('ago')}`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ${t('ago')}`;
  return `${Math.floor(h / 24)}d ${t('ago')}`;
}

export default function Dashboard({ token, user, onLogout }) {
  useLang();
  const [status, setStatus] = useState(null);
  const [containers, setContainers] = useState([]);
  const [monitors, setMonitors] = useState([]);
  const [events, setEvents] = useState([]);
  const [checking, setChecking] = useState(false);
  const [tab, setTab] = useState('containers');
  const [toast, setToast] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const s = {
    bg: '#0d1117', surface: '#161b22', surface2: '#1c2128', border: '#30363d',
    accent: '#3b82f6', accentDim: '#3b82f615', accentBorder: '#3b82f630',
    text: '#e6edf3', muted: '#8b949e', dim: '#4b5563',
    danger: '#f85149', success: '#3fb950', warning: '#f0a500',
  };

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  async function load() {
    try {
      const [st, c, m, e] = await Promise.all([
        fetch('/status').then(r => r.json()),
        authFetch(`${API}/containers`).then(r => r.json()),
        authFetch(`${API}/monitors`).then(r => r.json()),
        authFetch(`${API}/monitors/events/history`).then(r => r.json()),
      ]);
      if (st.ok) setStatus(st.data);
      if (c.ok) setContainers(c.data);
      if (m.ok) setMonitors(m.data);
      if (e.ok) setEvents(e.data);
    } catch (e) { console.error('Load error:', e); }
  }

  useEffect(() => { load(); const i = setInterval(load, 15000); return () => clearInterval(i); }, []);

  async function checkNow() {
    setChecking(true);
    try { await authFetch(`${API}/containers/check`, { method: 'POST' }); await load(); }
    finally { setChecking(false); }
  }

  // Badge counts for sidebar
  const downByType = (type) => monitors.filter(m => m.type === type && m.enabled && m.lastResult && !m.lastResult.ok).length;
  const stoppedContainers = containers.filter(c => c.status !== 'running').length;

  const NAV = [
    { id: 'containers', icon: '◫', label: t('containers'), badge: stoppedContainers },
    { id: 'web',        icon: '🌐', label: t('web'),       badge: downByType('web') },
    { id: 'tcp',        icon: '🔌', label: t('tcp'),       badge: downByType('tcp') },
    { id: 'dns',        icon: '🔍', label: t('dns'),       badge: downByType('dns') },
    { id: 'database',   icon: '🗄️', label: t('database'),  badge: downByType('database') },
    { id: 'api',        icon: '📡', label: t('api'),       badge: downByType('api') },
    { id: 'history',    icon: '📋', label: t('history') },
    { id: 'settings',   icon: '⚙',  label: t('settings') },
  ];

  const monitorTypes = ['web', 'tcp', 'dns', 'database', 'api'];

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', position: 'relative', background: s.bg, color: s.text }}>
      <div className={`sidebar-overlay${sidebarOpen ? ' visible' : ''}`} onClick={() => setSidebarOpen(false)} />

      {/* Sidebar */}
      <div className={`nexus-sidebar${sidebarOpen ? ' open' : ''}`} style={{ width: 220, flexShrink: 0, background: s.surface, borderRight: `1px solid ${s.border}`, display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <div style={{ padding: '18px 16px', borderBottom: `1px solid ${s.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <PulseLogo size={32} />
            <div>
              <div style={{ fontWeight: 700, fontSize: 13 }}>{t('appName')}</div>
              <div style={{ fontSize: 10, color: s.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('appSubtitle')}</div>
            </div>
          </div>
        </div>

        <div style={{ padding: '12px 10px 4px' }}>
          <button onClick={checkNow} disabled={checking}
            style={{ width: '100%', background: checking ? s.border : s.accentDim, color: checking ? s.muted : s.accent, border: `1px solid ${checking ? s.border : s.accentBorder}`, borderRadius: 8, padding: '8px 12px', cursor: checking ? 'default' : 'pointer', fontSize: 13, fontWeight: 600 }}>
            {checking ? t('checking') : `↻ ${t('checkNow')}`}
          </button>
        </div>

        <nav style={{ flex: 1, padding: '6px 8px', overflowY: 'auto' }}>
          {NAV.map(item => (
            <button key={item.id} onClick={() => { setTab(item.id); setSidebarOpen(false); }}
              style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', background: tab === item.id ? s.accentDim : 'none', border: 'none', borderLeft: `2px solid ${tab === item.id ? s.accent : 'transparent'}`, borderRadius: '0 8px 8px 0', color: tab === item.id ? s.text : s.muted, padding: '9px 12px', cursor: 'pointer', fontSize: 13, fontWeight: tab === item.id ? 600 : 400, textAlign: 'left', marginBottom: 2 }}>
              <span style={{ color: tab === item.id ? s.accent : s.dim, fontSize: 14, width: 18, textAlign: 'center', flexShrink: 0 }}>{item.icon}</span>
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.badge > 0 && (
                <span style={{ background: s.danger, color: '#fff', borderRadius: 10, padding: '1px 6px', fontSize: 10, fontWeight: 700 }}>{item.badge}</span>
              )}
            </button>
          ))}
        </nav>

        <div style={{ padding: '12px 14px', borderTop: `1px solid ${s.border}` }}>
          <LangSelector style={{ marginBottom: 14 }} />
          {user && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, padding: '8px 10px', background: s.surface2, border: `1px solid ${s.border}`, borderRadius: 8 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: s.accentDim, border: `1px solid ${s.accentBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: s.accent, flexShrink: 0 }}>
                  {(user?.username || user)?.[0]?.toUpperCase()}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: s.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.username || user}</div>
                  <div style={{ fontSize: 11, color: s.accent, fontWeight: 500 }}>admin</div>
                </div>
              </div>
              <button onClick={onLogout} style={{ width: '100%', background: 'none', color: s.muted, border: `1px solid ${s.border}`, borderRadius: 6, padding: '7px', cursor: 'pointer', fontSize: 12 }}>{t('signOut')}</button>
            </>
          )}
        </div>
      </div>

      {/* Main */}
      <div className="nexus-main" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        {/* Topbar */}
        <header style={{ display: 'flex', alignItems: 'center', padding: '12px 20px', borderBottom: `1px solid ${s.border}`, background: s.bg, flexShrink: 0, gap: 10 }}>
          <button className="hamburger" onClick={() => setSidebarOpen(v => !v)} style={{ background: 'transparent', border: `1px solid ${s.border}`, borderRadius: 6, color: s.muted, fontSize: '1em', cursor: 'pointer', padding: '6px 10px', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>☰</button>
          <span style={{ fontSize: '1em', fontWeight: 600 }}>{NAV.find(n => n.id === tab)?.label || ''}</span>
        </header>
        {/* Stats bar */}
        <div className="pulse-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1, background: s.border, borderBottom: `1px solid ${s.border}`, flexShrink: 0 }}>
          {[
            { label: t('totalContainers'), value: status?.totalContainers ?? '—', color: s.text },
            { label: t('running'),         value: status?.running ?? '—',          color: status?.running > 0 ? s.success : s.text },
            { label: t('totalMonitors'),   value: status?.totalMonitors ?? '—',    color: s.text },
            { label: t('monitorsDown'),    value: status?.monitorsDown ?? '—',     color: status?.monitorsDown > 0 ? s.danger : s.text },
          ].map((stat, i) => (
            <div key={i} style={{ background: s.surface, padding: '16px 24px' }}>
              <div style={{ fontSize: 11, color: s.muted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>{stat.label}</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: stat.color, letterSpacing: '-0.02em' }}>{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="nexus-content" style={{ padding: '24px 28px', flex: 1, overflow: 'auto' }}>
          {tab === 'containers' && <ContainersView containers={containers} onAction={load} onToast={showToast} isAdmin={true} />}
          {monitorTypes.includes(tab) && <MonitorsView type={tab} monitors={monitors.filter(m => m.type === tab)} onAction={load} onToast={showToast} />}
          {tab === 'history' && <HistoryView events={events} onClear={async () => {
            if (!confirm(t('clearHistoryConfirm'))) return;
            await authFetch(`${API}/monitors/events/history`, { method: 'DELETE' });
            showToast(t('historyCleared'));
            load();
          }} s={s} />}
          {tab === 'settings' && <SettingsView onToast={showToast} user={user} />}
        </div>
      </div>

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: toast.type === 'error' ? s.danger : s.success, color: '#fff', padding: '10px 20px', borderRadius: 8, fontSize: 13, fontWeight: 500, zIndex: 999 }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}

function HistoryView({ events, onClear, s }) {
  useLang();
  const stateColor = st => ({ up: '#3fb950', down: '#f85149', running: '#3fb950', exited: '#f85149', stopped: '#f85149' }[st] || '#8b949e');
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button onClick={onClear} style={{ background: 'none', border: `1px solid ${s.danger}`, color: s.danger, borderRadius: 6, padding: '6px 14px', cursor: 'pointer', fontSize: 12 }}>{t('clearHistory')}</button>
      </div>
      {events.length === 0
        ? <div style={{ color: s.muted, textAlign: 'center', padding: 60, fontSize: 13 }}>{t('noHistory')}</div>
        : events.map((ev, i) => (
          <div key={i} style={{ background: s.surface, border: `1px solid ${s.border}`, borderRadius: 8, padding: '10px 16px', marginBottom: 6, display: 'flex', gap: 14, alignItems: 'center', fontSize: 13 }}>
            <span style={{ fontSize: 11, color: s.muted, whiteSpace: 'nowrap', minWidth: 140 }}>{new Date(ev.at).toLocaleString()}</span>
            <span style={{ fontSize: 10, color: s.muted, background: s.surface2, border: `1px solid ${s.border}`, borderRadius: 3, padding: '1px 6px', textTransform: 'uppercase' }}>{ev.type}</span>
            <span style={{ fontWeight: 600, flex: 1, color: s.text }}>{ev.name}</span>
            {ev.from && <><span style={{ color: stateColor(ev.from) }}>{ev.from}</span><span style={{ color: s.muted }}>→</span></>}
            <span style={{ color: stateColor(ev.to || ev.status), fontWeight: 600 }}>{ev.to || ev.status}</span>
            {ev.ms && <span style={{ color: s.muted, fontSize: 11 }}>{ev.ms}{t('ms')}</span>}
          </div>
        ))
      }
    </div>
  );
}

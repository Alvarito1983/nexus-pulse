import { useState, useEffect } from 'react';
import {
  Box, Globe, Plug, Search, Database, Zap,
  History, Settings, LogOut, Menu, RefreshCw,
  Activity,
} from 'lucide-react';
import { t, useLang, LangSelector } from './i18n.jsx';
import ContainersView from './ContainersView.jsx';
import MonitorsView from './MonitorsView.jsx';
import SettingsView from './SettingsView.jsx';

const API = '/api';

export function authFetch(url, options = {}) {
  const token = localStorage.getItem('pulse-token');
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json',
    },
  });
}

/* ── Scoped CSS — mirrors NEXUS Dashboard structure ── */
const CSS = `
  /* ── Sidebar ── */
  .nx-sidebar {
    width: 220px;
    flex-shrink: 0;
    background: var(--bg-subtle);
    border-right: 1px solid var(--border-subtle);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    height: 100vh;
    overflow: hidden;
  }

  .nx-sidebar-top {
    padding: 0 12px;
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
  }

  /* Logo */
  .nx-logo {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 20px 8px 16px;
    border-bottom: 1px solid var(--border-subtle);
    margin-bottom: 8px;
  }

  .nx-logo-text { font-weight: var(--weight-semibold); font-size: 15px; letter-spacing: 0.14em; color: var(--text-primary); }
  .nx-logo-sub  { font-size: var(--text-xs); letter-spacing: 0.1em; color: var(--text-muted); margin-top: 1px; }

  /* Nav section heading */
  .nx-nav-section {
    font-size: var(--text-xs);
    font-weight: var(--weight-medium);
    letter-spacing: 0.1em;
    color: var(--text-muted);
    text-transform: uppercase;
    padding: 10px 8px 4px;
  }

  /* Nav item */
  .nx-nav-item {
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 8px 10px;
    margin: 1px 0;
    border-radius: var(--radius-md);
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
    color: var(--text-secondary);
    background: transparent;
    border: none;
    cursor: pointer;
    transition: all var(--transition-fast);
    text-align: left;
    width: 100%;
    position: relative;
    font-family: var(--font-sans);
  }

  .nx-nav-item:hover {
    background: var(--bg-overlay);
    color: var(--text-primary);
  }

  .nx-nav-item.active {
    background: var(--accent-dim);
    color: var(--accent);
  }

  .nx-nav-item.active .nx-nav-icon {
    color: var(--accent);
  }

  .nx-nav-icon {
    width: 18px;
    height: 18px;
    flex-shrink: 0;
    color: var(--text-muted);
    transition: color var(--transition-fast);
  }

  .nx-nav-item:hover .nx-nav-icon {
    color: var(--text-primary);
  }

  .nx-alert-badge {
    margin-left: auto;
    background: var(--color-danger);
    color: white;
    font-size: 10px;
    font-weight: var(--weight-semibold);
    border-radius: 20px;
    padding: 1px 6px;
  }

  /* Sidebar bottom */
  .nx-sidebar-bottom {
    border-top: 1px solid var(--border-subtle);
    padding: 12px 12px 16px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    flex-shrink: 0;
  }

  /* User row */
  .nx-user-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 0 4px;
  }

  .nx-user-avatar {
    width: 30px;
    height: 30px;
    background: var(--accent-dim);
    border: 1px solid rgba(59,130,246,0.25);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: var(--text-sm);
    font-weight: var(--weight-semibold);
    color: var(--accent);
    flex-shrink: 0;
  }

  .nx-user-info { flex: 1; min-width: 0; }
  .nx-user-name {
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
    color: var(--text-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .nx-user-role { font-size: var(--text-xs); }

  .nx-logout-btn {
    background: transparent;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    padding: 4px;
    border-radius: var(--radius-sm);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all var(--transition-fast);
    flex-shrink: 0;
  }

  .nx-logout-btn:hover {
    background: var(--bg-overlay);
    color: var(--color-danger);
  }

  /* ── TopBar ── */
  .nx-topbar {
    height: 56px;
    background: var(--bg-surface);
    border-bottom: 1px solid var(--border-subtle);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 24px;
    position: sticky;
    top: 0;
    z-index: 10;
    backdrop-filter: blur(8px);
    flex-shrink: 0;
    gap: 12px;
  }

  .nx-topbar-left {
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1;
    min-width: 0;
  }

  .nx-page-title {
    font-size: var(--text-lg);
    font-weight: var(--weight-medium);
    color: var(--text-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .nx-refresh-badge {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: var(--text-xs);
    color: var(--text-muted);
    background: var(--bg-elevated);
    border: 1px solid var(--border-subtle);
    border-radius: 20px;
    padding: 3px 10px;
    white-space: nowrap;
    flex-shrink: 0;
  }

  .nx-refresh-dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: var(--color-success);
    animation: pulse 2s ease-in-out infinite;
    flex-shrink: 0;
  }

  .nx-topbar-right {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }

  .nx-icon-btn {
    background: var(--bg-elevated);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md);
    color: var(--text-secondary);
    cursor: pointer;
    padding: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all var(--transition-fast);
  }

  .nx-icon-btn:hover {
    background: var(--bg-overlay);
    color: var(--text-primary);
    border-color: var(--border-default);
  }

  .nx-lang-toggle {
    display: flex;
    gap: 2px;
    background: var(--bg-elevated);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md);
    padding: 2px;
  }

  .nx-lang-btn {
    padding: 4px 8px;
    background: transparent;
    border: none;
    border-radius: var(--radius-sm);
    cursor: pointer;
    font-size: var(--text-sm);
    color: var(--text-muted);
    transition: all var(--transition-fast);
  }

  .nx-lang-btn.active {
    background: var(--bg-overlay);
    color: var(--text-primary);
  }

  .nx-hamburger {
    background: var(--bg-elevated);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md);
    color: var(--text-secondary);
    cursor: pointer;
    padding: 6px 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
`;

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

/* ── Stat cards ── */
function StatCards({ status, loading }) {
  if (loading) {
    return (
      <div className="stat-cards-grid stagger">
        {[0,1,2,3].map(i => (
          <div key={i} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '20px 24px' }}>
            <div className="skeleton" style={{ height: 28, width: '60%', marginBottom: 8 }} />
            <div className="skeleton" style={{ height: 11, width: '40%' }} />
          </div>
        ))}
      </div>
    );
  }

  const monitorsDown = status?.monitorsDown ?? 0;
  const monitorsUp   = (status?.totalMonitors ?? 0) - monitorsDown;

  const cards = [
    { label: t('totalMonitors'),   value: status?.totalMonitors ?? '—', color: 'var(--accent)',         statColor: 'var(--accent)' },
    { label: t('running'),         value: monitorsUp,                    color: 'var(--color-success)',  statColor: 'var(--color-success)' },
    { label: t('monitorsDown'),    value: monitorsDown,                  color: monitorsDown > 0 ? 'var(--color-danger)' : 'var(--text-primary)', statColor: 'var(--color-danger)' },
    { label: t('totalContainers'), value: status?.totalContainers ?? '—', color: 'var(--text-primary)', statColor: 'var(--accent)' },
  ];

  return (
    <div className="stat-cards-grid stagger">
      {cards.map(card => (
        <div key={card.label} className="stat-card" style={{ '--stat-color': card.statColor }}>
          <div className="stat-card-value" style={{ color: card.color }}>{card.value}</div>
          <div className="stat-card-label">{card.label}</div>
        </div>
      ))}
    </div>
  );
}

/* ── Pulse Logo ── */
const PulseLogo = ({ size = 32 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192" width={size} height={size}
    style={{ borderRadius: size * 0.22, flexShrink: 0 }}>
    <rect width="192" height="192" rx="40" fill="#001233"/>
    <rect x="18" y="18" width="72" height="72" rx="14" fill="#3b82f6"/>
    <rect x="102" y="18" width="72" height="72" rx="14" fill="#3b82f6" opacity="0.55"/>
    <rect x="18" y="102" width="72" height="72" rx="14" fill="#3b82f6" opacity="0.3"/>
    <rect x="102" y="102" width="72" height="72" rx="14" fill="none" stroke="#3b82f6" strokeWidth="5"/>
    <text x="138" y="158" fontFamily="Arial Black, Arial, sans-serif" fontSize="56" fontWeight="900"
      fill="#3b82f6" textAnchor="middle">P</text>
    <line x1="90" y1="54" x2="102" y2="54" stroke="#3b82f6" strokeWidth="5" opacity="0.45" strokeLinecap="round"/>
    <line x1="54" y1="90" x2="54" y2="102" stroke="#3b82f6" strokeWidth="5" opacity="0.45" strokeLinecap="round"/>
    <line x1="90" y1="138" x2="102" y2="138" stroke="#3b82f6" strokeWidth="5" opacity="0.45" strokeLinecap="round"/>
    <line x1="138" y1="90" x2="138" y2="102" stroke="#3b82f6" strokeWidth="5" opacity="0.45" strokeLinecap="round"/>
  </svg>
);

const NAV_ICONS = {
  containers: Box,
  web:        Globe,
  tcp:        Plug,
  dns:        Search,
  database:   Database,
  api:        Zap,
  history:    History,
  settings:   Settings,
};

export default function Dashboard({ token, user, onLogout }) {
  useLang();
  const [status,      setStatus]      = useState(null);
  const [containers,  setContainers]  = useState([]);
  const [monitors,    setMonitors]    = useState([]);
  const [events,      setEvents]      = useState([]);
  const [checking,    setChecking]    = useState(false);
  const [tab,         setTab]         = useState('containers');
  const [toast,       setToast]       = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading,     setLoading]     = useState(true);
  const [lastRefresh, setLastRefresh] = useState(null);

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
      if (c.ok)  setContainers(c.data);
      if (m.ok)  setMonitors(m.data);
      if (e.ok)  setEvents(e.data);
      setLastRefresh(new Date());
    } catch (err) {
      console.error('Load error:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const i = setInterval(load, 15000);
    return () => clearInterval(i);
  }, []);

  async function checkNow() {
    setChecking(true);
    try {
      await authFetch(`${API}/containers/check`, { method: 'POST' });
      await load();
    } finally {
      setChecking(false);
    }
  }

  const downByType    = type => monitors.filter(m => m.type === type && m.enabled && m.lastResult && !m.lastResult.ok).length;
  const stoppedContainers = containers.filter(c => c.status !== 'running').length;

  const NAV_MONITORS = [
    { id: 'web',      label: t('web'),      badge: downByType('web') },
    { id: 'tcp',      label: t('tcp'),      badge: downByType('tcp') },
    { id: 'dns',      label: t('dns'),      badge: downByType('dns') },
    { id: 'database', label: t('database'), badge: downByType('database') },
    { id: 'api',      label: t('api'),      badge: downByType('api') },
  ];

  const monitorTypes = ['web', 'tcp', 'dns', 'database', 'api'];
  const allNavItems = [
    { id: 'containers', label: t('containers'), badge: stoppedContainers },
    ...NAV_MONITORS,
    { id: 'history',  label: t('history') },
    { id: 'settings', label: t('settings') },
  ];

  const handleNavClick = id => { setTab(id); setSidebarOpen(false); };
  const isMonitorView = monitorTypes.includes(tab);
  const showStats = ['containers', ...monitorTypes].includes(tab);

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', position: 'relative', background: 'var(--bg-base)' }}>
      <style>{CSS}</style>
      <div className={`sidebar-overlay${sidebarOpen ? ' visible' : ''}`} onClick={() => setSidebarOpen(false)} />

      {/* ── Sidebar ── */}
      <aside className={`nexus-sidebar nx-sidebar${sidebarOpen ? ' open' : ''}`}>
        <div className="nx-sidebar-top">
          {/* Logo */}
          <div className="nx-logo">
            <PulseLogo size={32} />
            <div>
              <div className="nx-logo-text">Pulse</div>
              <div className="nx-logo-sub">UPTIME MONITOR</div>
            </div>
          </div>

          {/* Check Now button */}
          <div style={{ padding: '8px 4px 4px' }}>
            <button
              onClick={checkNow}
              disabled={checking}
              style={{
                width: '100%',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                background: checking ? 'transparent' : 'var(--accent-dim)',
                color: checking ? 'var(--text-muted)' : 'var(--accent)',
                border: `1px solid ${checking ? 'var(--border-subtle)' : 'rgba(59,130,246,0.25)'}`,
                borderRadius: 'var(--radius-md)',
                padding: '7px 12px',
                cursor: checking ? 'default' : 'pointer',
                fontSize: 'var(--text-sm)',
                fontWeight: 'var(--weight-semibold)',
                fontFamily: 'var(--font-sans)',
                transition: 'all var(--transition-fast)',
                marginBottom: 4,
              }}
            >
              <RefreshCw size={13} style={{ animation: checking ? 'spin 0.8s linear infinite' : 'none' }} />
              {checking ? t('checking') : t('checkNow')}
            </button>
          </div>

          {/* Navigation */}
          <nav>
            <div className="nx-nav-section">MONITORS</div>
            {NAV_MONITORS.map(item => {
              const Icon = NAV_ICONS[item.id];
              return (
                <button
                  key={item.id}
                  className={`nx-nav-item${tab === item.id ? ' active' : ''}`}
                  onClick={() => handleNavClick(item.id)}
                >
                  {Icon && <Icon size={16} className="nx-nav-icon" />}
                  {item.label}
                  {item.badge > 0 && <span className="nx-alert-badge">{item.badge}</span>}
                </button>
              );
            })}

            <div className="nx-nav-section">INFRASTRUCTURE</div>
            <button
              className={`nx-nav-item${tab === 'containers' ? ' active' : ''}`}
              onClick={() => handleNavClick('containers')}
            >
              <Box size={16} className="nx-nav-icon" />
              {t('containers')}
              {stoppedContainers > 0 && <span className="nx-alert-badge">{stoppedContainers}</span>}
            </button>

            <div className="nx-nav-section">ACCOUNT</div>
            <button
              className={`nx-nav-item${tab === 'history' ? ' active' : ''}`}
              onClick={() => handleNavClick('history')}
            >
              <History size={16} className="nx-nav-icon" />
              {t('history')}
            </button>
            <button
              className={`nx-nav-item${tab === 'settings' ? ' active' : ''}`}
              onClick={() => handleNavClick('settings')}
            >
              <Settings size={16} className="nx-nav-icon" />
              {t('settings')}
            </button>
          </nav>
        </div>

        {/* Sidebar bottom — user row */}
        <div className="nx-sidebar-bottom">
          <div className="nx-user-row">
            <div className="nx-user-avatar">
              {(user?.username || user)?.[0]?.toUpperCase()}
            </div>
            <div className="nx-user-info">
              <div className="nx-user-name">{user?.username || user}</div>
              <div className="nx-user-role">
                {user?.role === 'admin'
                  ? <span style={{ color: 'var(--accent)' }}>Administrator</span>
                  : <span style={{ color: 'var(--text-muted)' }}>Viewer</span>
                }
              </div>
            </div>
            <button className="nx-logout-btn" onClick={onLogout} title="Logout">
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main area ── */}
      <div className="nexus-main" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

        {/* TopBar */}
        <header className="nx-topbar">
          <div className="nx-topbar-left">
            <button className="hamburger nx-hamburger" onClick={() => setSidebarOpen(v => !v)}>
              <Menu size={18} />
            </button>
            <h1 className="nx-page-title">
              {allNavItems.find(n => n.id === tab)?.label || ''}
            </h1>
            {lastRefresh && !['settings', 'history'].includes(tab) && (
              <span className="nx-refresh-badge">
                <span className="nx-refresh-dot" />
                {lastRefresh.toLocaleTimeString()}
              </span>
            )}
          </div>

          <div className="nx-topbar-right">
            <LangSelector />
            <button className="nx-icon-btn" onClick={load} title="Refresh">
              <RefreshCw size={15} />
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="nexus-content" style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
          <div key={tab} className="fade-up">
            {showStats && <StatCards status={status} loading={loading} />}

            {tab === 'containers' && (
              <ContainersView containers={containers} onAction={load} onToast={showToast} isAdmin={true} />
            )}
            {monitorTypes.includes(tab) && (
              <MonitorsView
                type={tab}
                monitors={monitors.filter(m => m.type === tab)}
                onAction={load}
                onToast={showToast}
              />
            )}
            {tab === 'history' && (
              <HistoryView events={events} onClear={async () => {
                if (!confirm(t('clearHistoryConfirm'))) return;
                await authFetch(`${API}/monitors/events/history`, { method: 'DELETE' });
                showToast(t('historyCleared'));
                load();
              }} />
            )}
            {tab === 'settings' && <SettingsView onToast={showToast} user={user} />}
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24,
          background: toast.type === 'error' ? 'var(--color-danger)' : 'var(--color-success)',
          color: '#fff', padding: '10px 20px',
          borderRadius: 'var(--radius-md)',
          fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)',
          zIndex: 999, boxShadow: 'var(--shadow-md)',
          animation: 'fadeSlideUp 200ms ease both',
        }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}

/* ── History view ── */
function HistoryView({ events, onClear }) {
  useLang();
  const stateColor = st => ({
    up: 'var(--status-up)', down: 'var(--status-down)',
    running: 'var(--status-up)', exited: 'var(--status-down)', stopped: 'var(--status-down)',
  }[st] || 'var(--text-muted)');

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button onClick={onClear} style={{
          background: 'transparent',
          border: '1px solid var(--danger-border)',
          color: 'var(--color-danger)',
          borderRadius: 'var(--radius-md)',
          padding: '6px 14px', cursor: 'pointer',
          fontSize: 'var(--text-sm)', fontFamily: 'var(--font-sans)',
        }}>
          {t('clearHistory')}
        </button>
      </div>
      {events.length === 0 ? (
        <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 60, fontSize: 'var(--text-sm)' }}>
          {t('noHistory')}
        </div>
      ) : events.map((ev, i) => (
        <div key={i} style={{
          background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)', padding: '10px 16px', marginBottom: 6,
          display: 'flex', gap: 14, alignItems: 'center', fontSize: 'var(--text-sm)',
        }}>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', whiteSpace: 'nowrap', minWidth: 140, fontFamily: 'var(--font-mono)' }}>
            {new Date(ev.at).toLocaleString()}
          </span>
          <span style={{ fontSize: 10, color: 'var(--text-muted)', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 3, padding: '1px 6px', textTransform: 'uppercase' }}>
            {ev.type}
          </span>
          <span style={{ fontWeight: 'var(--weight-semibold)', flex: 1, color: 'var(--text-primary)' }}>{ev.name}</span>
          {ev.from && <><span style={{ color: stateColor(ev.from) }}>{ev.from}</span><span style={{ color: 'var(--text-muted)' }}>→</span></>}
          <span style={{ color: stateColor(ev.to || ev.status), fontWeight: 'var(--weight-semibold)' }}>{ev.to || ev.status}</span>
          {ev.ms && <span style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)' }}>{ev.ms}{t('ms')}</span>}
        </div>
      ))}
    </div>
  );
}

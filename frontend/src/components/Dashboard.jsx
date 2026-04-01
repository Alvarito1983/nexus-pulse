import { useState, useEffect } from 'react';
import {
  Activity, Box, Globe, Plug, Search, Database, Zap,
  History, Settings, LogOut, Menu, RefreshCw, Plus,
  ChevronDown, ChevronUp, User,
} from 'lucide-react';
import { t, useLang, LangSelector } from './i18n.jsx';
import ContainersView from './ContainersView.jsx';
import MonitorsView from './MonitorsView.jsx';
import SettingsView from './SettingsView.jsx';
import { StatCard } from './ui/Card.jsx';
import { Button } from './ui/Button.jsx';

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

const PulseLogo = ({ size = 32 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192" width={size} height={size}
    style={{ borderRadius: size * 0.22, flexShrink: 0 }}>
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
  const [loading, setLoading] = useState(true);

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
    finally { setLoading(false); }
  }

  useEffect(() => { load(); const i = setInterval(load, 15000); return () => clearInterval(i); }, []);

  async function checkNow() {
    setChecking(true);
    try { await authFetch(`${API}/containers/check`, { method: 'POST' }); await load(); }
    finally { setChecking(false); }
  }

  const downByType = (type) => monitors.filter(m => m.type === type && m.enabled && m.lastResult && !m.lastResult.ok).length;
  const stoppedContainers = containers.filter(c => c.status !== 'running').length;

  const NAV = [
    { id: 'containers', Icon: Box,      label: t('containers'), badge: stoppedContainers },
    { id: 'web',        Icon: Globe,     label: t('web'),        badge: downByType('web') },
    { id: 'tcp',        Icon: Plug,      label: t('tcp'),        badge: downByType('tcp') },
    { id: 'dns',        Icon: Search,    label: t('dns'),        badge: downByType('dns') },
    { id: 'database',   Icon: Database,  label: t('database'),   badge: downByType('database') },
    { id: 'api',        Icon: Zap,       label: t('api'),        badge: downByType('api') },
    { id: 'history',    Icon: History,   label: t('history') },
    { id: 'settings',   Icon: Settings,  label: t('settings') },
  ];

  const monitorTypes = ['web', 'tcp', 'dns', 'database', 'api'];
  const currentNav = NAV.find(n => n.id === tab);

  const statusData = [
    { label: t('totalContainers'), value: status?.totalContainers ?? '—', accent: 'default' },
    { label: t('running'),         value: status?.running ?? '—',          accent: (status?.running > 0) ? 'success' : 'default' },
    { label: t('totalMonitors'),   value: status?.totalMonitors ?? '—',    accent: 'default' },
    { label: t('monitorsDown'),    value: status?.monitorsDown ?? '—',     accent: (status?.monitorsDown > 0) ? 'danger' : 'success' },
  ];

  return (
    <div className="app-shell">
      {/* Overlay */}
      <div
        className={`sidebar-overlay${sidebarOpen ? ' visible' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`sidebar${sidebarOpen ? ' open' : ''}`}>
        {/* Logo */}
        <div style={{
          padding: '16px 16px 14px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          flexShrink: 0,
        }}>
          <PulseLogo size={32} />
          <div>
            <div style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>
              {t('appName')}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {t('appSubtitle')}
            </div>
          </div>
        </div>

        {/* Check Now */}
        <div style={{ padding: '10px 12px 6px' }}>
          <button
            onClick={checkNow}
            disabled={checking}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              background: checking ? 'transparent' : 'var(--accent-dim)',
              color: checking ? 'var(--text-muted)' : 'var(--accent)',
              border: `1px solid ${checking ? 'var(--border-subtle)' : 'rgba(59,130,246,0.30)'}`,
              borderRadius: 'var(--radius-md)',
              padding: '7px 12px',
              cursor: checking ? 'default' : 'pointer',
              fontSize: 'var(--text-sm)',
              fontWeight: 'var(--weight-semibold)',
              transition: 'all var(--transition-fast)',
              fontFamily: 'var(--font-sans)',
            }}
          >
            <RefreshCw size={13} style={{ animation: checking ? 'spin 0.8s linear infinite' : 'none' }} />
            {checking ? t('checking') : t('checkNow')}
          </button>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '4px 8px', overflowY: 'auto' }}>
          {NAV.map(item => {
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { setTab(item.id); setSidebarOpen(false); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  width: '100%',
                  background: active ? 'var(--accent-dim)' : 'transparent',
                  border: 'none',
                  borderLeft: `2px solid ${active ? 'var(--accent)' : 'transparent'}`,
                  borderRadius: '0 var(--radius-md) var(--radius-md) 0',
                  color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                  padding: '8px 12px',
                  cursor: 'pointer',
                  fontSize: 'var(--text-sm)',
                  fontWeight: active ? 'var(--weight-semibold)' : 'var(--weight-normal)',
                  textAlign: 'left',
                  marginBottom: 2,
                  transition: 'all var(--transition-fast)',
                  fontFamily: 'var(--font-sans)',
                }}
              >
                <item.Icon
                  size={15}
                  color={active ? 'var(--accent)' : 'var(--text-muted)'}
                  style={{ flexShrink: 0 }}
                />
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.badge > 0 && (
                  <span style={{
                    background: 'var(--color-danger)',
                    color: '#fff',
                    borderRadius: 10,
                    padding: '1px 6px',
                    fontSize: 10,
                    fontWeight: 700,
                    flexShrink: 0,
                  }}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom: language + user */}
        <div style={{ padding: '10px 14px 14px', borderTop: '1px solid var(--border-subtle)', flexShrink: 0 }}>
          <div style={{ marginBottom: 10 }}>
            <LangSelector />
          </div>
          {user && (
            <>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 10px',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                marginBottom: 8,
              }}>
                <div style={{
                  width: 30,
                  height: 30,
                  borderRadius: '50%',
                  background: 'var(--accent-dim)',
                  border: '1px solid rgba(59,130,246,0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                  fontWeight: 700,
                  color: 'var(--accent)',
                  flexShrink: 0,
                }}>
                  {(user?.username || user)?.[0]?.toUpperCase()}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{
                    fontWeight: 'var(--weight-semibold)',
                    fontSize: 'var(--text-sm)',
                    color: 'var(--text-primary)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {user?.username || user}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 'var(--weight-medium)' }}>
                    {user?.role || 'admin'}
                  </div>
                </div>
              </div>
              <button
                onClick={onLogout}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  background: 'transparent',
                  color: 'var(--text-muted)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '7px',
                  cursor: 'pointer',
                  fontSize: 'var(--text-xs)',
                  fontFamily: 'var(--font-sans)',
                  transition: 'all var(--transition-fast)',
                }}
                onMouseEnter={e => { e.currentTarget.style.color = 'var(--color-danger)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.30)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
              >
                <LogOut size={12} />
                {t('signOut')}
              </button>
            </>
          )}
        </div>
      </aside>

      {/* Main area */}
      <div className="main-area">
        {/* TopBar */}
        <header className="topbar">
          <button
            className="hamburger"
            onClick={() => setSidebarOpen(v => !v)}
            aria-label="Toggle sidebar"
          >
            <Menu size={16} />
          </button>
          <span style={{
            fontSize: 'var(--text-lg)',
            fontWeight: 'var(--weight-semibold)',
            color: 'var(--text-primary)',
            flex: 1,
          }}>
            {currentNav?.label || ''}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {monitorTypes.includes(tab) && (
              <button
                onClick={() => { /* trigger add in MonitorsView via event */ }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  background: 'var(--accent)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  padding: '7px 14px',
                  cursor: 'pointer',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 'var(--weight-semibold)',
                  fontFamily: 'var(--font-sans)',
                }}
              >
                <Plus size={14} />
                {t('addMonitor')}
              </button>
            )}
            {user && (
              <div style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'var(--accent-dim)',
                border: '1px solid rgba(59,130,246,0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 13,
                fontWeight: 700,
                color: 'var(--accent)',
                flexShrink: 0,
              }}>
                {(user?.username || user)?.[0]?.toUpperCase()}
              </div>
            )}
          </div>
        </header>

        {/* Stat cards */}
        <div className="stat-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 12,
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-subtle)',
          flexShrink: 0,
        }}>
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 76, borderRadius: 'var(--radius-lg)' }} />
            ))
            : statusData.map((stat, i) => (
              <div key={i} className="animate-in stagger" style={{ animationDelay: `${i * 60}ms` }}>
                <StatCard label={stat.label} value={stat.value} accent={stat.accent} />
              </div>
            ))
          }
        </div>

        {/* Content */}
        <div className="content-area">
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

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          background: toast.type === 'error' ? 'var(--color-danger)' : 'var(--color-success)',
          color: '#fff',
          padding: '10px 20px',
          borderRadius: 'var(--radius-md)',
          fontSize: 'var(--text-sm)',
          fontWeight: 'var(--weight-medium)',
          zIndex: 999,
          boxShadow: 'var(--shadow-md)',
          animation: 'fadeSlideUp 200ms ease both',
        }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}

function HistoryView({ events, onClear }) {
  useLang();
  const stateColor = st => ({
    up: 'var(--status-up)', down: 'var(--status-down)',
    running: 'var(--status-up)', exited: 'var(--status-down)', stopped: 'var(--status-down)',
  }[st] || 'var(--text-muted)');

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button
          onClick={onClear}
          style={{
            background: 'transparent',
            border: '1px solid rgba(239,68,68,0.40)',
            color: 'var(--color-danger)',
            borderRadius: 'var(--radius-md)',
            padding: '6px 14px',
            cursor: 'pointer',
            fontSize: 'var(--text-sm)',
            fontFamily: 'var(--font-sans)',
          }}
        >
          {t('clearHistory')}
        </button>
      </div>
      {events.length === 0
        ? (
          <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 60, fontSize: 'var(--text-sm)' }}>
            {t('noHistory')}
          </div>
        )
        : events.map((ev, i) => (
          <div key={i} style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '10px 16px',
            marginBottom: 6,
            display: 'flex',
            gap: 14,
            alignItems: 'center',
            fontSize: 'var(--text-sm)',
          }}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', whiteSpace: 'nowrap', minWidth: 140, fontFamily: 'var(--font-mono)' }}>
              {new Date(ev.at).toLocaleString()}
            </span>
            <span style={{
              fontSize: 10,
              color: 'var(--text-muted)',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 3,
              padding: '1px 6px',
              textTransform: 'uppercase',
            }}>
              {ev.type}
            </span>
            <span style={{ fontWeight: 'var(--weight-semibold)', flex: 1, color: 'var(--text-primary)' }}>{ev.name}</span>
            {ev.from && (
              <>
                <span style={{ color: stateColor(ev.from) }}>{ev.from}</span>
                <span style={{ color: 'var(--text-muted)' }}>→</span>
              </>
            )}
            <span style={{ color: stateColor(ev.to || ev.status), fontWeight: 'var(--weight-semibold)' }}>{ev.to || ev.status}</span>
            {ev.ms && <span style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)' }}>{ev.ms}{t('ms')}</span>}
          </div>
        ))
      }
    </div>
  );
}

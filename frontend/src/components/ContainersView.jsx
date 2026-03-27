import { useState } from 'react';
import { t, useLang } from './i18n.jsx';

function authFetch(url, opts = {}) {
  const token = localStorage.getItem('pulse-token');
  return fetch(url, { ...opts, headers: { ...opts.headers, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } });
}

const STATUS_COLOR = { running: '#3fb950', paused: '#f0a500', exited: '#f85149', stopped: '#f85149', unhealthy: '#ff7043', restarting: '#f0a500', created: '#8b949e', dead: '#f85149' };
const STATE_KEY = { running: 'stateRunning', stopped: 'stateStopped', paused: 'statePaused', unhealthy: 'stateUnhealthy', exited: 'stateExited', created: 'stateCreated', restarting: 'stateRestarting', dead: 'stateDead' };

function timeAgo(epochSecs) {
  if (!epochSecs) return '—';
  const m = Math.floor((Date.now() - epochSecs * 1000) / 60000);
  if (m < 1) return t('justNow');
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  return h < 24 ? `${h}h ${m % 60}m` : `${Math.floor(h / 24)}d`;
}

function Group({ label, containers, color, s, onAction, onToast, isAdmin, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  if (!containers.length) return null;
  return (
    <div style={{ marginBottom: 12 }}>
      <button onClick={() => setOpen(!open)}
        style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', padding: '6px 0', marginBottom: open ? 8 : 0 }}>
        <span style={{ fontSize: 11, color }}>{open ? '▼' : '▶'}</span>
        <span style={{ fontWeight: 600, fontSize: 13, color }}>{label}</span>
        <span style={{ background: `${color}20`, color, border: `1px solid ${color}40`, borderRadius: 10, padding: '1px 8px', fontSize: 11, fontWeight: 700 }}>{containers.length}</span>
      </button>
      {open && containers.map(c => <ContainerRow key={c.id} container={c} s={s} onAction={onAction} onToast={onToast} isAdmin={isAdmin} />)}
    </div>
  );
}

export default function ContainersView({ containers, onAction, onToast, isAdmin }) {
  useLang();
  const s = { bg: '#0d1117', surface: '#161b22', surface2: '#1c2128', border: '#30363d', accent: '#3b82f6', text: '#e6edf3', muted: '#8b949e', danger: '#f85149', success: '#3fb950' };
  if (!containers.length) return <div style={{ color: s.muted, textAlign: 'center', padding: 60, fontSize: 13 }}>{t('noContainers')}</div>;

  const running = containers.filter(c => c.status === 'running');
  const stopped = containers.filter(c => ['exited', 'stopped'].includes(c.status));
  const other   = containers.filter(c => !['running', 'exited', 'stopped'].includes(c.status));

  return (
    <div>
      <Group label={t('groupRunning')} containers={running} color="#3fb950" s={s} onAction={onAction} onToast={onToast} isAdmin={isAdmin} defaultOpen={true} />
      <Group label={t('groupStopped')} containers={stopped} color="#f85149" s={s} onAction={onAction} onToast={onToast} isAdmin={isAdmin} defaultOpen={true} />
      <Group label={t('groupOther')}   containers={other}   color="#8b949e" s={s} onAction={onAction} onToast={onToast} isAdmin={isAdmin} defaultOpen={true} />
    </div>
  );
}

function ContainerRow({ container: c, s, onAction, onToast, isAdmin }) {
  useLang();
  const [open, setOpen] = useState(false);
  const [showEnv, setShowEnv] = useState(false);
  const [details, setDetails] = useState(null);
  const [actioning, setActioning] = useState(null);
  const color = STATUS_COLOR[c.status] || '#8b949e';

  async function loadDetails() {
    if (details) return;
    try { const r = await authFetch(`/api/containers/${c.id}`); const d = await r.json(); if (d.ok) setDetails(d.data); } catch {}
  }

  async function doAction(action) {
    setActioning(action);
    try {
      const r = await authFetch(`/api/containers/${c.id}/${action}`, { method: 'POST' });
      const d = await r.json();
      if (d.ok) { onToast(`${action} OK`); setTimeout(onAction, 1200); }
      else onToast(d.error || t('error'), 'error');
    } catch (e) { onToast(e.message, 'error'); }
    finally { setActioning(null); }
  }

  return (
    <div style={{ background: s.surface, border: `1px solid ${c.status === 'running' ? s.border : '#5a2a2a40'}`, borderRadius: 8, marginBottom: 6, overflow: 'hidden' }}>
      <div onClick={() => { setOpen(!open); if (!open) loadDetails(); }} style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
        <span style={{ fontWeight: 600, fontSize: 13, flex: 1 }}>{c.name}</span>
        <span style={{ fontFamily: 'monospace', fontSize: 11, color: s.muted, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.image}</span>
        <span style={{ fontSize: 11, fontWeight: 600, color, background: `${color}18`, border: `1px solid ${color}40`, borderRadius: 4, padding: '2px 7px' }}>{t(STATE_KEY[c.status] || c.status)}</span>
        {c.status === 'running' && <span style={{ fontSize: 11, color: s.muted }}>{timeAgo(c.started)}</span>}
        {isAdmin && (
          <div style={{ display: 'flex', gap: 4 }} onClick={e => e.stopPropagation()}>
            {c.status !== 'running' && <ABtn label={t('start')} color="#3fb950" loading={actioning === 'start'} onClick={() => doAction('start')} />}
            {c.status === 'running' && <ABtn label={t('stop')} color="#f85149" loading={actioning === 'stop'} onClick={() => doAction('stop')} />}
            <ABtn label={t('restart')} color="#3b82f6" loading={actioning === 'restart'} onClick={() => doAction('restart')} />
          </div>
        )}
        <span style={{ color: s.muted, fontSize: 11 }}>{open ? '▲' : '▼'}</span>
      </div>
      {open && (
        <div style={{ borderTop: `1px solid ${s.border}`, padding: 14, background: s.surface2, fontSize: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            <D label={t('containerId')} value={c.id?.substring(0, 20) + '...'} mono />
            <D label={t('image')} value={c.image} mono />
            {(c.ports || []).length > 0 && <D label={t('ports')} value={c.ports.map(p => p.PublicPort ? `${p.PublicPort}:${p.PrivatePort}` : p.PrivatePort).join(', ')} mono />}
          </div>
          {details?.Mounts?.length > 0 && <Section label={t('volumes')} items={details.Mounts.map(m => `${m.Source} → ${m.Destination}`)} />}
          {details?.NetworkSettings?.Networks && <Section label={t('networks')} items={Object.keys(details.NetworkSettings.Networks)} />}
          {details?.Config?.Env?.length > 0 && (
            <div style={{ marginTop: 10 }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 6, alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: '#8b949e', textTransform: 'uppercase', letterSpacing: 0.8 }}>{t('environment')}</span>
                <button onClick={() => setShowEnv(!showEnv)} style={{ background: 'none', border: '1px solid #30363d', color: '#8b949e', borderRadius: 4, padding: '1px 8px', cursor: 'pointer', fontSize: 11 }}>
                  {showEnv ? t('hideEnv') : t('showEnv')}
                </button>
              </div>
              {showEnv && details.Config.Env.map((e, i) => <div key={i} style={{ fontFamily: 'monospace', color: '#8b949e', marginBottom: 2, wordBreak: 'break-all' }}>{e}</div>)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function D({ label, value, mono }) {
  return <div><div style={{ fontSize: 11, color: '#8b949e', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 3 }}>{label}</div><div style={{ fontFamily: mono ? 'monospace' : 'inherit', color: '#e6edf3', wordBreak: 'break-all' }}>{value || '—'}</div></div>;
}
function Section({ label, items }) {
  return <div style={{ marginTop: 10 }}><div style={{ fontSize: 11, color: '#8b949e', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>{label}</div>{items.map((it, i) => <div key={i} style={{ fontFamily: 'monospace', color: '#8b949e', marginBottom: 2 }}>{it}</div>)}</div>;
}
function ABtn({ label, color, loading, onClick }) {
  return <button onClick={onClick} disabled={loading} style={{ background: 'none', border: `1px solid ${color}`, color, borderRadius: 5, padding: '2px 9px', cursor: loading ? 'default' : 'pointer', fontSize: 11, fontWeight: 600, opacity: loading ? 0.5 : 1 }}>{loading ? '...' : label}</button>;
}

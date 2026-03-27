import { useState } from 'react';
import { t, useLang } from './i18n.jsx';

const API = '/api';
function authFetch(url, opts = {}) {
  const token = localStorage.getItem('pulse-token');
  return fetch(url, { ...opts, headers: { ...opts.headers, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } });
}

const INTERVALS = [
  { value: 30, label: '30s' }, { value: 60, label: '1m' },
  { value: 300, label: '5m' }, { value: 900, label: '15m' },
  { value: 3600, label: '1h' },
];

const DB_TYPES = ['mysql', 'postgresql', 'redis', 'mongodb'];
const HTTP_METHODS = ['GET', 'HEAD', 'POST', 'PUT'];
const AUTH_TYPES = ['none', 'bearer', 'basic'];

function defaultConfig(type) {
  if (type === 'web')      return { url: 'https://', method: 'GET', expectedStatus: 200, checkSSL: true };
  if (type === 'tcp')      return { host: '', port: 80 };
  if (type === 'dns')      return { hostname: '', expectedIp: '', dnsServer: '8.8.8.8' };
  if (type === 'database') return { dbType: 'mysql', host: '', port: 3306, user: '', password: '', database: '' };
  if (type === 'api')      return { url: 'https://', method: 'GET', headers: '{}', body: '', expectedStatus: 200, authType: 'none', authValue: '' };
  return {};
}

export default function MonitorsView({ type, monitors, onAction, onToast }) {
  useLang();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const s = { bg: '#0d1117', surface: '#161b22', surface2: '#1c2128', border: '#30363d', accent: '#3b82f6', accentDim: '#3b82f615', text: '#e6edf3', muted: '#8b949e', danger: '#f85149', success: '#3fb950' };

  function openAdd() { setEditing(null); setShowForm(true); }
  function openEdit(m) { setEditing(m); setShowForm(true); }
  function closeForm() { setShowForm(false); setEditing(null); }

  async function handleDelete(id) {
    if (!confirm(t('deleteMonitor') + '?')) return;
    await authFetch(`${API}/monitors/${id}`, { method: 'DELETE' });
    onAction();
  }

  async function handleCheckNow(id) {
    await authFetch(`${API}/monitors/${id}/check`, { method: 'POST' });
    setTimeout(onAction, 500);
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button onClick={openAdd} style={{ background: s.accent, color: '#fff', border: 'none', borderRadius: 7, padding: '7px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>+ {t('addMonitor')}</button>
      </div>

      {showForm && (
        <MonitorForm type={type} monitor={editing} onSave={() => { closeForm(); onAction(); }} onCancel={closeForm} onToast={onToast} s={s} />
      )}

      {monitors.length === 0 && !showForm
        ? <div style={{ color: s.muted, textAlign: 'center', padding: 60, fontSize: 13 }}>{t('noMonitors')}</div>
        : monitors.map(m => <MonitorRow key={m.id} monitor={m} s={s} onEdit={openEdit} onDelete={handleDelete} onCheckNow={handleCheckNow} />)
      }
    </div>
  );
}

function MonitorRow({ monitor: m, s, onEdit, onDelete, onCheckNow }) {
  useLang();
  const [open, setOpen] = useState(false);
  const r = m.lastResult;
  const isUp = r?.ok;
  const isUnknown = !r;
  const statusColor = isUnknown ? s.muted : isUp ? s.success : s.danger;
  const statusLabel = isUnknown ? t('stateUnknown') : isUp ? t('stateUp') : t('stateDown');

  // History bar — last 30 checks
  const hist = m.history || [];

  function target() {
    const c = m.config || {};
    if (m.type === 'web' || m.type === 'api') return c.url;
    if (m.type === 'tcp') return `${c.host}:${c.port}`;
    if (m.type === 'dns') return c.hostname;
    if (m.type === 'database') return `${c.dbType}://${c.host}:${c.port}`;
    return '';
  }

  function timeAgo(ts) {
    if (!ts) return t('never');
    const m = Math.floor((Date.now() - ts) / 60000);
    if (m < 1) return t('justNow');
    if (m < 60) return `${m}m ${t('ago')}`;
    return `${Math.floor(m / 60)}h ${t('ago')}`;
  }

  return (
    <div style={{ background: s.surface, border: `1px solid ${isUnknown ? s.border : isUp ? '#3fb95025' : '#f8514925'}`, borderRadius: 8, marginBottom: 8, overflow: 'hidden' }}>
      {/* Main row */}
      <div onClick={() => setOpen(!open)} style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: statusColor, flexShrink: 0, boxShadow: isUp ? `0 0 6px ${s.success}` : isUnknown ? 'none' : `0 0 6px ${s.danger}` }} />
        <span style={{ fontWeight: 600, fontSize: 13, flex: 1 }}>{m.name}</span>
        <span style={{ fontFamily: 'monospace', fontSize: 11, color: s.muted, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{target()}</span>

        {/* History bar */}
        <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          {Array.from({ length: 30 }).map((_, i) => {
            const h = hist[i];
            const c = !h ? '#30363d' : h.ok ? '#3fb950' : '#f85149';
            return <div key={i} style={{ width: 4, height: 16, borderRadius: 2, background: c }} />;
          })}
        </div>

        {m.uptime24h !== null && m.uptime24h !== undefined && (
          <span style={{ fontSize: 11, color: m.uptime24h >= 99 ? s.success : m.uptime24h >= 90 ? s.warning : s.danger, fontWeight: 600, whiteSpace: 'nowrap' }}>{m.uptime24h}%</span>
        )}
        {r?.ms && <span style={{ fontSize: 11, color: s.muted, whiteSpace: 'nowrap' }}>{r.ms}{t('ms')}</span>}
        <span style={{ fontSize: 11, fontWeight: 700, color: statusColor, background: `${statusColor}15`, border: `1px solid ${statusColor}40`, borderRadius: 4, padding: '2px 8px', whiteSpace: 'nowrap' }}>{statusLabel}</span>
        <span style={{ color: s.muted, fontSize: 11 }}>{open ? '▲' : '▼'}</span>
      </div>

      {/* Expanded */}
      {open && (
        <div style={{ borderTop: `1px solid ${s.border}`, padding: '14px 16px', background: s.surface2, fontSize: 12 }}>
          <div style={{ display: 'flex', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
            <span style={{ color: s.muted }}>{t('lastCheck')}: <b style={{ color: s.text }}>{timeAgo(m.lastCheck)}</b></span>
            {r?.status && <span style={{ color: s.muted }}>HTTP: <b style={{ color: s.text }}>{r.status}</b></span>}
            {r?.resolved && <span style={{ color: s.muted }}>Resolved: <b style={{ color: s.text, fontFamily: 'monospace' }}>{r.resolved?.join(', ')}</b></span>}
            {r?.sslDaysLeft !== null && r?.sslDaysLeft !== undefined && (
              <span style={{ color: r.sslDaysLeft < 30 ? s.danger : s.success }}>SSL: {r.sslDaysLeft}d</span>
            )}
            {r?.error && <span style={{ color: s.danger }}>{r.error}</span>}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => onCheckNow(m.id)} style={{ background: s.accentDim, color: s.accent, border: `1px solid ${s.accent}40`, borderRadius: 6, padding: '5px 12px', cursor: 'pointer', fontSize: 12 }}>{t('checkNowBtn')}</button>
            <button onClick={() => onEdit(m)} style={{ background: 'none', border: `1px solid ${s.border}`, color: s.muted, borderRadius: 6, padding: '5px 12px', cursor: 'pointer', fontSize: 12 }}>{t('editMonitor')}</button>
            <button onClick={() => onDelete(m.id)} style={{ background: 'none', border: `1px solid ${s.danger}`, color: s.danger, borderRadius: 6, padding: '5px 12px', cursor: 'pointer', fontSize: 12 }}>{t('deleteMonitor')}</button>
          </div>
        </div>
      )}
    </div>
  );
}

function MonitorForm({ type, monitor, onSave, onCancel, onToast, s }) {
  useLang();
  const [name, setName] = useState(monitor?.name || '');
  const [interval, setIntervalVal] = useState(monitor?.interval || 60);
  const [enabled, setEnabled] = useState(monitor?.enabled !== false);
  const [config, setConfig] = useState(monitor?.config || defaultConfig(type));
  const [saving, setSaving] = useState(false);

  function setC(key, val) { setConfig(prev => ({ ...prev, [key]: val })); }

  async function handleSave() {
    if (!name.trim()) return onToast(t('monitorName') + ' required', 'error');
    setSaving(true);
    try {
      const body = JSON.stringify({ name, type, config, interval, enabled });
      const url = monitor ? `${API}/monitors/${monitor.id}` : `${API}/monitors`;
      const method = monitor ? 'PUT' : 'POST';
      const r = await authFetch(url, { method, body });
      const d = await r.json();
      if (d.ok) onSave();
      else onToast(d.error || t('error'), 'error');
    } catch (e) { onToast(e.message, 'error'); }
    finally { setSaving(false); }
  }

  const inp = (val, onChange, placeholder, type = 'text') => (
    <input type={type} value={val} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      style={{ width: '100%', background: s.bg, border: `1px solid ${s.border}`, borderRadius: 6, padding: '7px 10px', color: s.text, fontSize: 13, outline: 'none' }} />
  );

  const lbl = (text) => <div style={{ fontSize: 11, color: s.muted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>{text}</div>;

  return (
    <div style={{ background: s.surface, border: `1px solid ${s.accent}40`, borderRadius: 10, padding: 20, marginBottom: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <div>{lbl(t('monitorName'))}{inp(name, setName, 'My service')}</div>
        <div>
          {lbl(t('monitorInterval'))}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {INTERVALS.map(opt => (
              <button key={opt.value} onClick={() => setIntervalVal(opt.value)}
                style={{ background: interval === opt.value ? '#0a1628' : 'none', border: `1px solid ${interval === opt.value ? s.accent : s.border}`, borderRadius: 6, padding: '5px 10px', cursor: 'pointer', fontSize: 12, color: interval === opt.value ? s.accent : s.muted, fontWeight: interval === opt.value ? 600 : 400 }}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Type-specific fields */}
      {type === 'web' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 120px', gap: 10, marginBottom: 12 }}>
          <div>{lbl(t('url'))}{inp(config.url || '', v => setC('url', v), 'https://example.com')}</div>
          <div>{lbl(t('method'))}<select value={config.method || 'GET'} onChange={e => setC('method', e.target.value)} style={{ width: '100%', background: s.bg, border: `1px solid ${s.border}`, borderRadius: 6, padding: '7px 10px', color: s.text, fontSize: 13 }}>{HTTP_METHODS.map(m => <option key={m}>{m}</option>)}</select></div>
          <div>{lbl(t('expectedStatus'))}{inp(config.expectedStatus || 200, v => setC('expectedStatus', parseInt(v) || 200), '200', 'number')}</div>
        </div>
      )}
      {type === 'tcp' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: 10, marginBottom: 12 }}>
          <div>{lbl(t('host'))}{inp(config.host || '', v => setC('host', v), 'example.com')}</div>
          <div>{lbl(t('port'))}{inp(config.port || 80, v => setC('port', parseInt(v) || 80), '80', 'number')}</div>
        </div>
      )}
      {type === 'dns' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 12 }}>
          <div>{lbl(t('hostname'))}{inp(config.hostname || '', v => setC('hostname', v), 'example.com')}</div>
          <div>{lbl(t('expectedIp'))}{inp(config.expectedIp || '', v => setC('expectedIp', v), '1.2.3.4 (optional)')}</div>
          <div>{lbl(t('dnsServer'))}{inp(config.dnsServer || '8.8.8.8', v => setC('dnsServer', v), '8.8.8.8')}</div>
        </div>
      )}
      {type === 'database' && (
        <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 80px 1fr 1fr 1fr', gap: 10, marginBottom: 12 }}>
          <div>{lbl(t('dbType'))}<select value={config.dbType || 'mysql'} onChange={e => setC('dbType', e.target.value)} style={{ width: '100%', background: s.bg, border: `1px solid ${s.border}`, borderRadius: 6, padding: '7px 10px', color: s.text, fontSize: 13 }}>{DB_TYPES.map(d => <option key={d}>{d}</option>)}</select></div>
          <div>{lbl(t('host'))}{inp(config.host || '', v => setC('host', v), 'localhost')}</div>
          <div>{lbl(t('port'))}{inp(config.port || 3306, v => setC('port', parseInt(v) || 3306), '3306', 'number')}</div>
          <div>{lbl(t('dbUser'))}{inp(config.user || '', v => setC('user', v), 'root')}</div>
          <div>{lbl(t('dbPassword'))}{inp(config.password || '', v => setC('password', v), '••••', 'password')}</div>
          <div>{lbl(t('dbName'))}{inp(config.database || '', v => setC('database', v), 'mydb')}</div>
        </div>
      )}
      {type === 'api' && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 120px', gap: 10, marginBottom: 10 }}>
            <div>{lbl(t('url'))}{inp(config.url || '', v => setC('url', v), 'https://api.example.com/health')}</div>
            <div>{lbl(t('method'))}<select value={config.method || 'GET'} onChange={e => setC('method', e.target.value)} style={{ width: '100%', background: s.bg, border: `1px solid ${s.border}`, borderRadius: 6, padding: '7px 10px', color: s.text, fontSize: 13 }}>{HTTP_METHODS.map(m => <option key={m}>{m}</option>)}</select></div>
            <div>{lbl(t('expectedStatus'))}{inp(config.expectedStatus || 200, v => setC('expectedStatus', parseInt(v) || 200), '200', 'number')}</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 10 }}>
            <div>{lbl(t('authType'))}<select value={config.authType || 'none'} onChange={e => setC('authType', e.target.value)} style={{ width: '100%', background: s.bg, border: `1px solid ${s.border}`, borderRadius: 6, padding: '7px 10px', color: s.text, fontSize: 13 }}>{AUTH_TYPES.map(a => <option key={a}>{a}</option>)}</select></div>
            {config.authType !== 'none' && <div>{lbl(t('authValue'))}{inp(config.authValue || '', v => setC('authValue', v), config.authType === 'bearer' ? 'token...' : 'user:pass')}</div>}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button onClick={handleSave} disabled={saving} style={{ background: s.accent, color: '#fff', border: 'none', borderRadius: 7, padding: '8px 18px', cursor: 'pointer', fontSize: 13, fontWeight: 600, opacity: saving ? 0.7 : 1 }}>{saving ? '...' : t('saveMonitor')}</button>
        <button onClick={onCancel} style={{ background: 'none', border: `1px solid ${s.border}`, color: s.muted, borderRadius: 7, padding: '8px 16px', cursor: 'pointer', fontSize: 13 }}>{t('cancel')}</button>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', marginLeft: 8, fontSize: 13, color: s.muted }}>
          <input type="checkbox" checked={enabled} onChange={e => setEnabled(e.target.checked)} />
          {t('monitorEnabled')}
        </label>
      </div>
    </div>
  );
}

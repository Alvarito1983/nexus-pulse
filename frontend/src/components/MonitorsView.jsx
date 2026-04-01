import { useState } from 'react';
import { Plus, CheckCircle2, XCircle, Clock, Pencil, Trash2, Play, RefreshCw, ChevronDown, ChevronUp, Activity } from 'lucide-react';
import { t, useLang } from './i18n.jsx';
import { HistoryBar } from './ui/HistoryBar.jsx';
import { Badge } from './ui/Badge.jsx';
import { EmptyState } from './ui/EmptyState.jsx';
import { Button } from './ui/Button.jsx';

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

function uptimeBadgeVariant(uptime) {
  if (uptime === null || uptime === undefined) return 'info';
  if (uptime >= 99) return 'up';
  if (uptime >= 95) return 'warning';
  return 'down';
}

export default function MonitorsView({ type, monitors, onAction, onToast }) {
  useLang();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

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
        <Button variant="primary" size="md" onClick={openAdd} style={{ gap: 6, display: 'flex', alignItems: 'center' }}>
          <Plus size={14} />
          {t('addMonitor')}
        </Button>
      </div>

      {showForm && (
        <MonitorForm type={type} monitor={editing} onSave={() => { closeForm(); onAction(); }} onCancel={closeForm} onToast={onToast} />
      )}

      {monitors.length === 0 && !showForm ? (
        <EmptyState
          icon={Activity}
          title={t('noMonitors')}
          description={t('addFirstMonitor') || 'Add your first monitor to start tracking uptime.'}
          action={
            <Button variant="secondary" size="md" onClick={openAdd}>
              <Plus size={14} />
              {t('addMonitor')}
            </Button>
          }
        />
      ) : (
        monitors.map(m => (
          <MonitorRow
            key={m.id}
            monitor={m}
            onEdit={openEdit}
            onDelete={handleDelete}
            onCheckNow={handleCheckNow}
          />
        ))
      )}
    </div>
  );
}

function MonitorRow({ monitor: m, onEdit, onDelete, onCheckNow }) {
  useLang();
  const [open, setOpen] = useState(false);
  const r = m.lastResult;
  const isUp = r?.ok;
  const isUnknown = !r;

  const statusVariant = isUnknown ? 'paused' : isUp ? 'up' : 'down';
  const statusLabel = isUnknown ? t('stateUnknown') : isUp ? t('stateUp') : t('stateDown');

  const dotColor = isUnknown ? 'var(--status-paused)' : isUp ? 'var(--status-up)' : 'var(--status-down)';
  const dotGlow  = isUp ? '0 0 6px rgba(0,200,150,0.5)' : (!isUnknown) ? '0 0 6px rgba(239,68,68,0.5)' : 'none';

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
    const mins = Math.floor((Date.now() - ts) / 60000);
    if (mins < 1) return t('justNow');
    if (mins < 60) return `${mins}m ${t('ago')}`;
    return `${Math.floor(mins / 60)}h ${t('ago')}`;
  }

  const borderColor = isUnknown
    ? 'var(--border-subtle)'
    : isUp
      ? 'rgba(0,200,150,0.15)'
      : 'rgba(239,68,68,0.20)';

  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: `1px solid ${borderColor}`,
      borderRadius: 'var(--radius-lg)',
      marginBottom: 8,
      overflow: 'hidden',
      transition: 'border-color var(--transition-base)',
    }}>
      {/* Down indicator bar */}
      {!isUnknown && !isUp && (
        <div style={{
          height: 2,
          background: 'var(--color-danger)',
        }} />
      )}

      {/* Main row */}
      <div
        onClick={() => setOpen(!open)}
        style={{
          padding: '14px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          cursor: 'pointer',
          flexWrap: 'nowrap',
        }}
      >
        {/* Status dot */}
        <div style={{
          width: 10,
          height: 10,
          borderRadius: '50%',
          background: dotColor,
          flexShrink: 0,
          boxShadow: dotGlow,
          animation: statusVariant === 'pending' ? 'pulse 2s ease-in-out infinite' : 'none',
        }} />

        {/* Name */}
        <span style={{
          fontWeight: 'var(--weight-medium)',
          fontSize: 'var(--text-base)',
          color: 'var(--text-primary)',
          minWidth: 120,
          flex: '0 1 160px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {m.name}
        </span>

        {/* URL/target */}
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--text-xs)',
          color: 'var(--text-secondary)',
          flex: '1 1 200px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {target()}
        </span>

        {/* History bar */}
        <div style={{ flexShrink: 0 }}>
          <HistoryBar checks={hist} />
        </div>

        {/* Uptime */}
        {m.uptime24h !== null && m.uptime24h !== undefined && (
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-xs)',
            fontWeight: 'var(--weight-semibold)',
            color: m.uptime24h >= 99
              ? 'var(--color-success)'
              : m.uptime24h >= 95
                ? 'var(--color-warning)'
                : 'var(--color-danger)',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}>
            {m.uptime24h}%
          </span>
        )}

        {/* Response time badge */}
        {r?.ms && (
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-xs)',
            color: 'var(--text-muted)',
            padding: '2px 6px',
            background: 'var(--bg-elevated)',
            borderRadius: 'var(--radius-sm)',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}>
            {r.ms}{t('ms')}
          </span>
        )}

        {/* Status badge */}
        <Badge variant={statusVariant}>{statusLabel}</Badge>

        {/* Expand icon */}
        {open ? <ChevronUp size={14} color="var(--text-muted)" /> : <ChevronDown size={14} color="var(--text-muted)" />}
      </div>

      {/* Expanded details */}
      {open && (
        <div style={{
          borderTop: '1px solid var(--border-subtle)',
          padding: '14px 20px',
          background: 'var(--bg-elevated)',
          fontSize: 'var(--text-sm)',
        }}>
          <div style={{ display: 'flex', gap: 16, marginBottom: 12, flexWrap: 'wrap', color: 'var(--text-muted)' }}>
            <span>{t('lastCheck')}: <b style={{ color: 'var(--text-primary)' }}>{timeAgo(m.lastCheck)}</b></span>
            {r?.status && <span>HTTP: <b style={{ color: 'var(--text-primary)' }}>{r.status}</b></span>}
            {r?.resolved && <span>Resolved: <b style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{r.resolved?.join(', ')}</b></span>}
            {r?.sslDaysLeft !== null && r?.sslDaysLeft !== undefined && (
              <span style={{ color: r.sslDaysLeft < 30 ? 'var(--color-danger)' : 'var(--color-success)' }}>
                SSL: {r.sslDaysLeft}d
              </span>
            )}
            {r?.error && <span style={{ color: 'var(--color-danger)' }}>{r.error}</span>}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="secondary" size="sm" onClick={() => onCheckNow(m.id)}>
              <RefreshCw size={11} />
              {t('checkNowBtn')}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onEdit(m)}>
              <Pencil size={11} />
              {t('editMonitor')}
            </Button>
            <Button variant="danger" size="sm" onClick={() => onDelete(m.id)}>
              <Trash2 size={11} />
              {t('deleteMonitor')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function FormInput({ label, value, onChange, placeholder, type = 'text' }) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5, fontWeight: 'var(--weight-medium)' }}>
        {label}
      </div>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: '100%',
          background: 'var(--bg-base)',
          border: `1px solid ${focused ? 'var(--accent)' : 'var(--border-default)'}`,
          borderRadius: 'var(--radius-md)',
          padding: '7px 10px',
          color: 'var(--text-primary)',
          fontSize: 'var(--text-sm)',
          outline: 'none',
          fontFamily: 'var(--font-sans)',
          transition: 'border-color var(--transition-fast)',
        }}
      />
    </div>
  );
}

function FormSelect({ label, value, onChange, options }) {
  return (
    <div>
      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5, fontWeight: 'var(--weight-medium)' }}>
        {label}
      </div>
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{
          width: '100%',
          background: 'var(--bg-base)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-md)',
          padding: '7px 10px',
          color: 'var(--text-primary)',
          fontSize: 'var(--text-sm)',
          outline: 'none',
          fontFamily: 'var(--font-sans)',
        }}
      >
        {options.map(o => <option key={o}>{o}</option>)}
      </select>
    </div>
  );
}

function MonitorForm({ type, monitor, onSave, onCancel, onToast }) {
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

  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: '1px solid rgba(59,130,246,0.30)',
      borderRadius: 'var(--radius-lg)',
      padding: 20,
      marginBottom: 20,
    }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
        <FormInput label={t('monitorName')} value={name} onChange={setName} placeholder="My service" />
        <div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5, fontWeight: 'var(--weight-medium)' }}>
            {t('monitorInterval')}
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {INTERVALS.map(opt => (
              <button key={opt.value} onClick={() => setIntervalVal(opt.value)}
                style={{
                  background: interval === opt.value ? 'rgba(59,130,246,0.15)' : 'transparent',
                  border: `1px solid ${interval === opt.value ? 'var(--accent)' : 'var(--border-default)'}`,
                  borderRadius: 'var(--radius-md)',
                  padding: '5px 10px',
                  cursor: 'pointer',
                  fontSize: 'var(--text-sm)',
                  color: interval === opt.value ? 'var(--accent)' : 'var(--text-muted)',
                  fontWeight: interval === opt.value ? 'var(--weight-semibold)' : 'var(--weight-normal)',
                  fontFamily: 'var(--font-sans)',
                }}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {type === 'web' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 120px', gap: 10, marginBottom: 14 }}>
          <FormInput label={t('url')} value={config.url || ''} onChange={v => setC('url', v)} placeholder="https://example.com" />
          <FormSelect label={t('method')} value={config.method || 'GET'} onChange={v => setC('method', v)} options={HTTP_METHODS} />
          <FormInput label={t('expectedStatus')} value={config.expectedStatus || 200} onChange={v => setC('expectedStatus', parseInt(v) || 200)} placeholder="200" type="number" />
        </div>
      )}
      {type === 'tcp' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: 10, marginBottom: 14 }}>
          <FormInput label={t('host')} value={config.host || ''} onChange={v => setC('host', v)} placeholder="example.com" />
          <FormInput label={t('port')} value={config.port || 80} onChange={v => setC('port', parseInt(v) || 80)} placeholder="80" type="number" />
        </div>
      )}
      {type === 'dns' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 14 }}>
          <FormInput label={t('hostname')} value={config.hostname || ''} onChange={v => setC('hostname', v)} placeholder="example.com" />
          <FormInput label={t('expectedIp')} value={config.expectedIp || ''} onChange={v => setC('expectedIp', v)} placeholder="1.2.3.4 (optional)" />
          <FormInput label={t('dnsServer')} value={config.dnsServer || '8.8.8.8'} onChange={v => setC('dnsServer', v)} placeholder="8.8.8.8" />
        </div>
      )}
      {type === 'database' && (
        <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 80px 1fr 1fr 1fr', gap: 10, marginBottom: 14 }}>
          <FormSelect label={t('dbType')} value={config.dbType || 'mysql'} onChange={v => setC('dbType', v)} options={DB_TYPES} />
          <FormInput label={t('host')} value={config.host || ''} onChange={v => setC('host', v)} placeholder="localhost" />
          <FormInput label={t('port')} value={config.port || 3306} onChange={v => setC('port', parseInt(v) || 3306)} placeholder="3306" type="number" />
          <FormInput label={t('dbUser')} value={config.user || ''} onChange={v => setC('user', v)} placeholder="root" />
          <FormInput label={t('dbPassword')} value={config.password || ''} onChange={v => setC('password', v)} placeholder="••••" type="password" />
          <FormInput label={t('dbName')} value={config.database || ''} onChange={v => setC('database', v)} placeholder="mydb" />
        </div>
      )}
      {type === 'api' && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 120px', gap: 10, marginBottom: 10 }}>
            <FormInput label={t('url')} value={config.url || ''} onChange={v => setC('url', v)} placeholder="https://api.example.com/health" />
            <FormSelect label={t('method')} value={config.method || 'GET'} onChange={v => setC('method', v)} options={HTTP_METHODS} />
            <FormInput label={t('expectedStatus')} value={config.expectedStatus || 200} onChange={v => setC('expectedStatus', parseInt(v) || 200)} placeholder="200" type="number" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 10 }}>
            <FormSelect label={t('authType')} value={config.authType || 'none'} onChange={v => setC('authType', v)} options={AUTH_TYPES} />
            {config.authType !== 'none' && (
              <FormInput label={t('authValue')} value={config.authValue || ''} onChange={v => setC('authValue', v)} placeholder={config.authType === 'bearer' ? 'token...' : 'user:pass'} />
            )}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <Button variant="primary" size="md" loading={saving} onClick={handleSave}>
          {t('saveMonitor')}
        </Button>
        <Button variant="ghost" size="md" onClick={onCancel}>
          {t('cancel')}
        </Button>
        <label style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          cursor: 'pointer',
          marginLeft: 8,
          fontSize: 'var(--text-sm)',
          color: 'var(--text-muted)',
          fontFamily: 'var(--font-sans)',
        }}>
          <input type="checkbox" checked={enabled} onChange={e => setEnabled(e.target.checked)} />
          {t('monitorEnabled')}
        </label>
      </div>
    </div>
  );
}

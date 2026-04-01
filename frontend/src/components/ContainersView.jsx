import { useState } from 'react';
import { ChevronDown, ChevronUp, Play, Square, RotateCcw, Eye, EyeOff } from 'lucide-react';
import { t, useLang } from './i18n.jsx';
import { Badge } from './ui/Badge.jsx';
import { EmptyState } from './ui/EmptyState.jsx';
import { Button } from './ui/Button.jsx';

function authFetch(url, opts = {}) {
  const token = localStorage.getItem('pulse-token');
  return fetch(url, { ...opts, headers: { ...opts.headers, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } });
}

const STATUS_COLOR = {
  running: 'var(--status-up)',
  paused: 'var(--status-pending)',
  exited: 'var(--status-down)',
  stopped: 'var(--status-down)',
  unhealthy: 'var(--color-danger)',
  restarting: 'var(--status-pending)',
  created: 'var(--text-muted)',
  dead: 'var(--status-down)',
};

const STATUS_BADGE = {
  running: 'up',
  paused: 'pending',
  exited: 'down',
  stopped: 'down',
  unhealthy: 'down',
  restarting: 'pending',
  created: 'paused',
  dead: 'down',
};

const STATE_KEY = {
  running: 'stateRunning', stopped: 'stateStopped', paused: 'statePaused',
  unhealthy: 'stateUnhealthy', exited: 'stateExited', created: 'stateCreated',
  restarting: 'stateRestarting', dead: 'stateDead',
};

function timeAgo(epochSecs) {
  if (!epochSecs) return '—';
  const m = Math.floor((Date.now() - epochSecs * 1000) / 60000);
  if (m < 1) return t('justNow');
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  return h < 24 ? `${h}h ${m % 60}m` : `${Math.floor(h / 24)}d`;
}

function Group({ label, containers, color, onAction, onToast, isAdmin, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  if (!containers.length) return null;
  return (
    <div style={{ marginBottom: 16 }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '6px 0',
          marginBottom: open ? 8 : 0,
          fontFamily: 'var(--font-sans)',
        }}
      >
        {open ? <ChevronDown size={13} color={color} /> : <ChevronUp size={13} color={color} />}
        <span style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)', color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {label}
        </span>
        <span style={{
          background: `${color}18`,
          color,
          border: `1px solid ${color}35`,
          borderRadius: 10,
          padding: '1px 8px',
          fontSize: 11,
          fontWeight: 700,
        }}>
          {containers.length}
        </span>
      </button>
      {open && containers.map(c => (
        <ContainerRow key={c.id} container={c} onAction={onAction} onToast={onToast} isAdmin={isAdmin} />
      ))}
    </div>
  );
}

export default function ContainersView({ containers, onAction, onToast, isAdmin }) {
  useLang();
  if (!containers.length) {
    return (
      <EmptyState
        icon={null}
        title={t('noContainers')}
        description="No Docker containers found."
      />
    );
  }

  const running = containers.filter(c => c.status === 'running');
  const stopped = containers.filter(c => ['exited', 'stopped'].includes(c.status));
  const other   = containers.filter(c => !['running', 'exited', 'stopped'].includes(c.status));

  return (
    <div>
      <Group label={t('groupRunning')} containers={running} color="var(--status-up)"  onAction={onAction} onToast={onToast} isAdmin={isAdmin} defaultOpen={true} />
      <Group label={t('groupStopped')} containers={stopped} color="var(--status-down)" onAction={onAction} onToast={onToast} isAdmin={isAdmin} defaultOpen={true} />
      <Group label={t('groupOther')}   containers={other}   color="var(--text-muted)"  onAction={onAction} onToast={onToast} isAdmin={isAdmin} defaultOpen={true} />
    </div>
  );
}

function ContainerRow({ container: c, onAction, onToast, isAdmin }) {
  useLang();
  const [open, setOpen] = useState(false);
  const [showEnv, setShowEnv] = useState(false);
  const [details, setDetails] = useState(null);
  const [actioning, setActioning] = useState(null);

  const color = STATUS_COLOR[c.status] || 'var(--text-muted)';
  const badgeVariant = STATUS_BADGE[c.status] || 'paused';

  async function loadDetails() {
    if (details) return;
    try {
      const r = await authFetch(`/api/containers/${c.id}`);
      const d = await r.json();
      if (d.ok) setDetails(d.data);
    } catch {}
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

  const borderColor = c.status === 'running'
    ? 'var(--border-subtle)'
    : 'rgba(239,68,68,0.15)';

  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: `1px solid ${borderColor}`,
      borderRadius: 'var(--radius-lg)',
      marginBottom: 6,
      overflow: 'hidden',
      transition: 'border-color var(--transition-base)',
    }}>
      <div
        onClick={() => { setOpen(!open); if (!open) loadDetails(); }}
        style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
      >
        <div style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: color,
          flexShrink: 0,
          boxShadow: c.status === 'running' ? '0 0 6px rgba(0,200,150,0.4)' : 'none',
        }} />

        <span style={{
          fontWeight: 'var(--weight-medium)',
          fontSize: 'var(--text-base)',
          color: 'var(--text-primary)',
          flex: 1,
        }}>
          {c.name}
        </span>

        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--text-xs)',
          color: 'var(--text-muted)',
          maxWidth: 200,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {c.image}
        </span>

        <Badge variant={badgeVariant}>{t(STATE_KEY[c.status] || c.status)}</Badge>

        {c.status === 'running' && (
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            {timeAgo(c.started)}
          </span>
        )}

        {isAdmin && (
          <div style={{ display: 'flex', gap: 4 }} onClick={e => e.stopPropagation()}>
            {c.status !== 'running' && (
              <Button variant="ghost" size="sm" loading={actioning === 'start'} onClick={() => doAction('start')}
                style={{ color: 'var(--status-up)', borderColor: 'rgba(0,200,150,0.35)' }}>
                <Play size={10} />
                {t('start')}
              </Button>
            )}
            {c.status === 'running' && (
              <Button variant="ghost" size="sm" loading={actioning === 'stop'} onClick={() => doAction('stop')}
                style={{ color: 'var(--status-down)', borderColor: 'rgba(239,68,68,0.35)' }}>
                <Square size={10} />
                {t('stop')}
              </Button>
            )}
            <Button variant="ghost" size="sm" loading={actioning === 'restart'} onClick={() => doAction('restart')}
              style={{ color: 'var(--accent)', borderColor: 'rgba(59,130,246,0.35)' }}>
              <RotateCcw size={10} />
              {t('restart')}
            </Button>
          </div>
        )}

        {open ? <ChevronUp size={14} color="var(--text-muted)" /> : <ChevronDown size={14} color="var(--text-muted)" />}
      </div>

      {open && (
        <div style={{
          borderTop: '1px solid var(--border-subtle)',
          padding: '14px 20px',
          background: 'var(--bg-elevated)',
          fontSize: 'var(--text-sm)',
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <DetailField label={t('containerId')} value={c.id?.substring(0, 20) + '...'} mono />
            <DetailField label={t('image')} value={c.image} mono />
            {(c.ports || []).length > 0 && (
              <DetailField
                label={t('ports')}
                value={c.ports.map(p => p.PublicPort ? `${p.PublicPort}:${p.PrivatePort}` : p.PrivatePort).join(', ')}
                mono
              />
            )}
          </div>
          {details?.Mounts?.length > 0 && (
            <DetailSection label={t('volumes')} items={details.Mounts.map(m => `${m.Source} → ${m.Destination}`)} />
          )}
          {details?.NetworkSettings?.Networks && (
            <DetailSection label={t('networks')} items={Object.keys(details.NetworkSettings.Networks)} />
          )}
          {details?.Config?.Env?.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 6, alignItems: 'center' }}>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {t('environment')}
                </span>
                <button
                  onClick={() => setShowEnv(!showEnv)}
                  style={{
                    background: 'none',
                    border: '1px solid var(--border-default)',
                    color: 'var(--text-muted)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '1px 8px',
                    cursor: 'pointer',
                    fontSize: 11,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    fontFamily: 'var(--font-sans)',
                  }}
                >
                  {showEnv ? <EyeOff size={10} /> : <Eye size={10} />}
                  {showEnv ? t('hideEnv') : t('showEnv')}
                </button>
              </div>
              {showEnv && details.Config.Env.map((e, i) => (
                <div key={i} style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: 2, wordBreak: 'break-all' }}>
                  {e}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DetailField({ label, value, mono }) {
  return (
    <div>
      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>
        {label}
      </div>
      <div style={{ fontFamily: mono ? 'var(--font-mono)' : 'var(--font-sans)', color: 'var(--text-primary)', wordBreak: 'break-all', fontSize: 'var(--text-sm)' }}>
        {value || '—'}
      </div>
    </div>
  );
}

function DetailSection({ label, items }) {
  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
        {label}
      </div>
      {items.map((it, i) => (
        <div key={i} style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: 2 }}>
          {it}
        </div>
      ))}
    </div>
  );
}

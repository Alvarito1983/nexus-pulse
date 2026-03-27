import { useState, useEffect } from 'react';
import { t, useLang } from './i18n.jsx';

function authFetch(url, opts = {}) {
  const token = localStorage.getItem('pulse-token');
  return fetch(url, { ...opts, headers: { ...opts.headers, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } });
}

const INTERVALS = [
  { value: 30, key: 'every30s' }, { value: 60, key: 'every1m' },
  { value: 300, key: 'every5m' }, { value: 900, key: 'every15m' }, { value: 1800, key: 'every30m' },
];

export default function SettingsView({ onToast }) {
  useLang();
  const [pollInterval, setPollInterval] = useState(30);
  const [telegramToken, setTelegramToken] = useState('');
  const [telegramChatId, setTelegramChatId] = useState('');
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  const s = { bg: '#0d1117', surface: '#161b22', border: '#30363d', accent: '#3b82f6', text: '#e6edf3', muted: '#8b949e', danger: '#f85149' };

  useEffect(() => {
    authFetch('/api/settings').then(r => r.json()).then(d => {
      if (d.ok) { setPollInterval(d.data.pollInterval || 30); setTelegramToken(d.data.telegramToken || ''); setTelegramChatId(d.data.telegramChatId || ''); }
    }).catch(() => {});
  }, []);

  async function save() {
    setSaving(true);
    try {
      const r = await authFetch('/api/settings', { method: 'POST', body: JSON.stringify({ pollInterval, telegramToken, telegramChatId }) });
      const d = await r.json();
      if (d.ok) onToast(t('settingsSaved')); else onToast(t('settingsError'), 'error');
    } catch { onToast(t('settingsError'), 'error'); }
    finally { setSaving(false); }
  }

  async function testNotification() {
    setTesting(true);
    try {
      const r = await authFetch('/api/settings/test-notification', { method: 'POST' });
      const d = await r.json();
      if (d.ok) onToast(t('notifSent')); else onToast(d.error || t('settingsError'), 'error');
    } catch { onToast(t('settingsError'), 'error'); }
    finally { setTesting(false); }
  }

  async function clearHistory() {
    if (!confirm(t('clearHistoryConfirm'))) return;
    await authFetch('/api/monitors/events/history', { method: 'DELETE' });
    onToast(t('historyCleared'));
  }

  const Card = ({ title, desc, children }) => (
    <div style={{ background: s.surface, border: `1px solid ${s.border}`, borderRadius: 10, padding: 24, marginBottom: 16 }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: s.text }}>{title}</div>
        {desc && <div style={{ fontSize: 13, color: s.muted, marginTop: 4 }}>{desc}</div>}
      </div>
      {children}
    </div>
  );
  const Lbl = ({ c }) => <div style={{ fontSize: 12, color: s.muted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>{c}</div>;

  return (
    <div style={{ maxWidth: 680 }}>
      <Card title={t('pollSettings')} desc={t('pollIntervalDesc')}>
        <Lbl c={t('pollInterval')} />
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {INTERVALS.map(opt => (
            <button key={opt.value} onClick={() => setPollInterval(opt.value)}
              style={{ background: pollInterval === opt.value ? '#0a1628' : 'none', border: `1px solid ${pollInterval === opt.value ? s.accent : s.border}`, borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: 13, color: pollInterval === opt.value ? s.accent : s.muted, fontWeight: pollInterval === opt.value ? 600 : 400 }}>
              {t(opt.key)}
            </button>
          ))}
        </div>
      </Card>

      <Card title={t('notifSettings')} desc={t('telegramDesc')}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <div><Lbl c={t('telegramToken')} /><input type="password" value={telegramToken} onChange={e => setTelegramToken(e.target.value)} placeholder="123456:ABC..." style={{ width: '100%', background: s.bg, border: `1px solid ${s.border}`, borderRadius: 6, padding: '8px 12px', color: s.text, fontSize: 13, outline: 'none' }} /></div>
          <div><Lbl c={t('telegramChatId')} /><input type="text" value={telegramChatId} onChange={e => setTelegramChatId(e.target.value)} placeholder="-100123456789" style={{ width: '100%', background: s.bg, border: `1px solid ${s.border}`, borderRadius: 6, padding: '8px 12px', color: s.text, fontSize: 13, outline: 'none' }} /></div>
        </div>
        <button onClick={testNotification} disabled={testing || !telegramToken || !telegramChatId}
          style={{ background: s.border, color: s.text, border: 'none', borderRadius: 6, padding: '7px 16px', cursor: 'pointer', fontSize: 13, opacity: (!telegramToken || !telegramChatId) ? 0.5 : 1 }}>
          {testing ? '...' : t('testNotification')}
        </button>
      </Card>

      <button onClick={save} disabled={saving} style={{ background: s.accent, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', cursor: 'pointer', fontSize: 14, fontWeight: 600, marginBottom: 24, opacity: saving ? 0.7 : 1 }}>
        {saving ? '...' : t('saveSettings')}
      </button>

      <Card title={t('danger')}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 14, color: s.text }}>{t('clearHistory')}</div>
            <div style={{ fontSize: 12, color: s.muted, marginTop: 2 }}>{t('clearHistoryDesc')}</div>
          </div>
          <button onClick={clearHistory} style={{ background: 'none', border: `1px solid ${s.danger}`, color: s.danger, borderRadius: 6, padding: '6px 14px', cursor: 'pointer', fontSize: 12, whiteSpace: 'nowrap', marginLeft: 16 }}>{t('clearHistory')}</button>
        </div>
      </Card>
    </div>
  );
}

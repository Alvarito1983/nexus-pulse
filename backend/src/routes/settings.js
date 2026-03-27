const router = require('express').Router();
const fs = require('fs');
const path = require('path');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '../../../data');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');

const defaults = {
  pollInterval: parseInt(process.env.POLL_INTERVAL || '30'),
  telegramToken: process.env.TELEGRAM_BOT_TOKEN || '',
  telegramChatId: process.env.TELEGRAM_CHAT_ID || '',
};

function load() {
  try {
    if (fs.existsSync(SETTINGS_FILE))
      return { ...defaults, ...JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8')) };
  } catch (e) { console.error('[settings] Load error:', e.message); }
  return { ...defaults };
}

function save(data) {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(data, null, 2));
  } catch (e) { console.error('[settings] Save error:', e.message); }
}

router.get('/', (req, res) => {
  const s = load();
  res.json({ ok: true, data: { ...s, telegramToken: s.telegramToken ? '••••••••' : '' } });
});

router.post('/', (req, res) => {
  const cur = load();
  const { pollInterval, telegramToken, telegramChatId } = req.body;
  const updated = {
    ...cur,
    pollInterval: pollInterval || cur.pollInterval,
    telegramChatId: telegramChatId ?? cur.telegramChatId,
    telegramToken: (telegramToken && !telegramToken.includes('•')) ? telegramToken : cur.telegramToken,
  };
  save(updated);
  const { updateContainerSchedule } = require('../services/containerMonitor');
  updateContainerSchedule(updated.pollInterval);
  res.json({ ok: true, data: updated });
});

router.post('/test-notification', async (req, res) => {
  const s = load();
  if (!s.telegramToken || !s.telegramChatId)
    return res.status(400).json({ ok: false, error: 'Telegram not configured' });
  try {
    const r = await fetch(`https://api.telegram.org/bot${s.telegramToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: s.telegramChatId, text: '✅ *NEXUS Pulse* — Test OK', parse_mode: 'Markdown' }),
    });
    if (!r.ok) { const e = await r.json(); return res.status(500).json({ ok: false, error: e.description }); }
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

module.exports = { router, load };

const { load: loadSettings } = require('../routes/settings');

async function notify(text) {
  const { telegramToken, telegramChatId } = loadSettings();
  if (!telegramToken || !telegramChatId) return;
  try {
    await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: telegramChatId, text, parse_mode: 'Markdown' }),
    });
  } catch (e) {
    console.error('[notifier] Telegram error:', e.message);
  }
}

module.exports = { notify };

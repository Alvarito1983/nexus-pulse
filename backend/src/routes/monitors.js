const router = require('express').Router();
const crypto = require('crypto');
const store = require('../store');
const { runCheck, scheduleMonitor, unscheduleMonitor } = require('../services/monitorRunner');

// GET /api/monitors
router.get('/', (req, res) => {
  const { type } = req.query;
  let monitors = store.getMonitors();
  if (type) monitors = monitors.filter(m => m.type === type);
  res.json({ ok: true, data: monitors });
});

// GET /api/monitors/:id
router.get('/:id', (req, res) => {
  const m = store.getMonitor(req.params.id);
  if (!m) return res.status(404).json({ ok: false, error: 'Not found' });
  res.json({ ok: true, data: m });
});

// POST /api/monitors
router.post('/', (req, res) => {
  const { name, type, config, interval = 60, enabled = true } = req.body || {};
  if (!name || !type || !config) return res.status(400).json({ ok: false, error: 'name, type and config required' });
  const id = crypto.randomBytes(8).toString('hex');
  const monitor = { id, name, type, config, interval, enabled, createdAt: Date.now(), lastCheck: null, lastResult: null, history: [] };
  store.setMonitor(id, monitor);
  if (enabled) scheduleMonitor(monitor);
  res.json({ ok: true, data: monitor });
});

// PUT /api/monitors/:id
router.put('/:id', (req, res) => {
  const existing = store.getMonitor(req.params.id);
  if (!existing) return res.status(404).json({ ok: false, error: 'Not found' });
  const updated = { ...existing, ...req.body, id: existing.id };
  store.setMonitor(existing.id, updated);
  unscheduleMonitor(existing.id);
  if (updated.enabled) scheduleMonitor(updated);
  res.json({ ok: true, data: updated });
});

// DELETE /api/monitors/:id
router.delete('/:id', (req, res) => {
  const existing = store.getMonitor(req.params.id);
  if (!existing) return res.status(404).json({ ok: false, error: 'Not found' });
  unscheduleMonitor(existing.id);
  store.deleteMonitor(existing.id);
  res.json({ ok: true });
});

// POST /api/monitors/:id/check
router.post('/:id/check', async (req, res) => {
  const m = store.getMonitor(req.params.id);
  if (!m) return res.status(404).json({ ok: false, error: 'Not found' });
  try {
    const result = await runCheck(m);
    res.json({ ok: true, data: result });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// GET /api/history
router.get('/events/history', (req, res) => {
  res.json({ ok: true, data: store.getEvents() });
});

// DELETE /api/history
router.delete('/events/history', (req, res) => {
  store.clearEvents();
  res.json({ ok: true });
});

module.exports = router;

const router = require('express').Router();
const store = require('../store');
const docker = require('../services/docker');
const { runContainerPoll } = require('../services/containerMonitor');

router.get('/', (req, res) => {
  res.json({ ok: true, data: store.getContainers() });
});

router.get('/:id', (req, res) => {
  const c = store.getContainer(req.params.id);
  if (!c) return res.status(404).json({ ok: false, error: 'Not found' });
  res.json({ ok: true, data: c });
});

router.post('/:id/start', async (req, res) => {
  try {
    await docker.getContainer(req.params.id).start();
    setTimeout(runContainerPoll, 1000);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

router.post('/:id/stop', async (req, res) => {
  try {
    await docker.getContainer(req.params.id).stop();
    setTimeout(runContainerPoll, 1000);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

router.post('/:id/restart', async (req, res) => {
  try {
    await docker.getContainer(req.params.id).restart();
    setTimeout(runContainerPoll, 1000);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

router.post('/check', async (req, res) => {
  try {
    await runContainerPoll();
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

module.exports = router;

const router = require('express').Router();
const store = require('../store');

router.get('/health', (req, res) => {
  res.json({ ok: true, service: 'nexus-pulse', version: '1.0.0' });
});

router.get('/status', (req, res) => {
  res.json({ ok: true, data: store.getStatus() });
});

router.get('/metrics', (req, res) => {
  const st = store.getStatus();
  const lines = [
    `# HELP pulse_containers_total Total containers`,
    `pulse_containers_total ${st.totalContainers}`,
    `# HELP pulse_containers_running Running containers`,
    `pulse_containers_running ${st.running}`,
    `# HELP pulse_monitors_total Total monitors`,
    `pulse_monitors_total ${st.totalMonitors}`,
    `# HELP pulse_monitors_down Monitors currently down`,
    `pulse_monitors_down ${st.monitorsDown}`,
  ];
  res.set('Content-Type', 'text/plain');
  res.send(lines.join('\n'));
});

module.exports = router;

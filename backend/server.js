const express = require('express');
const cors = require('cors');
const path = require('path');

const healthRouter = require('./src/routes/health');
const containersRouter = require('./src/routes/containers');
const monitorsRouter = require('./src/routes/monitors');
const { router: authRouter, sessions } = require('./src/routes/auth');
const { router: settingsRouter, load: loadSettings } = require('./src/routes/settings');
const { startContainerMonitor } = require('./src/services/containerMonitor');
const { startAllMonitors } = require('./src/services/monitorRunner');

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());

const publicDir = path.join(__dirname, 'public');
app.use(express.static(publicDir));

app.use('/', healthRouter);
app.use('/api/auth', authRouter);

app.use('/api', (req, res, next) => {
  if (req.path.startsWith('/auth')) return next();
  const token = req.headers['authorization']?.replace('Bearer ', '') || req.headers['x-api-key'];
  if (!token) return res.status(401).json({ ok: false, error: 'Unauthorized' });
  if (sessions.has(token)) return next();
  return res.status(401).json({ ok: false, error: 'Unauthorized' });
});

app.use('/api/containers', containersRouter);
app.use('/api/monitors', monitorsRouter);
app.use('/api/settings', settingsRouter);

app.get('*', (req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

const settings = loadSettings();
startContainerMonitor(settings.pollInterval);
startAllMonitors();

app.listen(PORT, () => {
  console.log(`NEXUS Pulse on port ${PORT}`);
  console.log(`Admin: ${process.env.ADMIN_USER || 'admin'} | Poll: ${settings.pollInterval}s`);
});

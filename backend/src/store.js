const fs = require('fs');
const path = require('path');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '../../data');
const STORE_FILE = path.join(DATA_DIR, 'store.json');

let state = {
  containers: {},  // id → { id, name, image, status, health, started, ports, updatedAt }
  monitors: {},    // id → { id, name, type, config, interval, enabled, lastCheck, lastResult, history[], uptime24h }
  events: [],      // last 500: { type, name, from/to or status, ms, at }
  lastCheck: null,
};

function save() {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(STORE_FILE, JSON.stringify(state, null, 2));
  } catch (e) { console.error('[store] Save error:', e.message); }
}

function load() {
  try {
    if (fs.existsSync(STORE_FILE)) {
      state = JSON.parse(fs.readFileSync(STORE_FILE, 'utf8'));
      console.log(`[store] Loaded — ${Object.keys(state.containers).length} containers, ${Object.keys(state.monitors).length} monitors`);
    }
  } catch (e) { console.error('[store] Load error:', e.message); }
}

load();

module.exports = {
  // Containers
  getContainers: () => Object.values(state.containers),
  getContainer: (id) => state.containers[id],
  setContainer: (id, data) => { state.containers[id] = { ...state.containers[id], ...data }; save(); },
  removeContainer: (id) => { delete state.containers[id]; save(); },

  // Monitors
  getMonitors: () => Object.values(state.monitors),
  getMonitor: (id) => state.monitors[id],
  setMonitor: (id, data) => { state.monitors[id] = data; save(); },
  deleteMonitor: (id) => { delete state.monitors[id]; save(); },

  // Events
  getEvents: () => state.events,
  addEvent: (ev) => { state.events.unshift(ev); state.events = state.events.slice(0, 500); save(); },
  clearEvents: () => { state.events = []; save(); },

  // Meta
  getLastCheck: () => state.lastCheck,
  setLastCheck: (ts) => { state.lastCheck = ts; save(); },

  getStatus: () => {
    const containers = Object.values(state.containers);
    const monitors = Object.values(state.monitors);
    return {
      totalContainers: containers.length,
      running: containers.filter(c => c.status === 'running').length,
      totalMonitors: monitors.length,
      monitorsDown: monitors.filter(m => m.enabled && m.lastResult && !m.lastResult.ok).length,
      lastCheck: state.lastCheck,
    };
  },
};

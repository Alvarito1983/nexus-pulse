const cron = require('node-cron');
const docker = require('./docker');
const store = require('../store');
const notifier = require('./notifier');

let cronJob = null;

async function runContainerPoll() {
  try {
    const list = await docker.listContainers({ all: true });
    const currentIds = new Set(list.map(c => c.Id));

    for (const c of list) {
      const prev = store.getContainer(c.Id);
      const curr = {
        id: c.Id,
        name: c.Names[0]?.replace('/', '') || c.Id.substring(0, 12),
        image: c.Image,
        status: c.State,
        health: c.Status,
        started: c.Created,
        ports: c.Ports || [],
        updatedAt: Date.now(),
      };
      if (prev && prev.status !== curr.status) {
        store.addEvent({ type: 'container', name: curr.name, from: prev.status, to: curr.status, at: Date.now() });
        await notifier.notify(`Container \`${curr.name}\` changed: ${prev.status} → ${curr.status}`);
      }
      store.setContainer(c.Id, curr);
    }

    for (const c of store.getContainers()) {
      if (!currentIds.has(c.id)) store.removeContainer(c.id);
    }

    store.setLastCheck(Date.now());
    console.log(`[containers] Poll: ${list.length} containers`);
  } catch (e) {
    console.error('[containers] Poll error:', e.message);
  }
}

function startContainerMonitor(intervalSeconds = 30) {
  console.log(`[containers] Starting, interval: ${intervalSeconds}s`);
  setTimeout(runContainerPoll, 3000);
  scheduleCron(intervalSeconds);
}

function scheduleCron(secs) {
  if (cronJob) { cronJob.stop(); cronJob = null; }
  const s = Math.max(10, parseInt(secs) || 30);
  cronJob = cron.schedule(`*/${s} * * * * *`, runContainerPoll);
}

function updateContainerSchedule(secs) {
  scheduleCron(secs);
  console.log(`[containers] Interval updated to ${secs}s`);
}

module.exports = { startContainerMonitor, updateContainerSchedule, runContainerPoll };

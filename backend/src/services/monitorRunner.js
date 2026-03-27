const cron = require('node-cron');
const net = require('net');
const tls = require('tls');
const dns = require('dns');
const store = require('../store');
const notifier = require('./notifier');

// Map of monitorId → cronJob
const jobs = new Map();

// ─── Check implementations ────────────────────────────────────────────────

async function checkWeb({ url, method = 'GET', expectedStatus = 200, checkSSL = true }) {
  const start = Date.now();
  try {
    const res = await fetch(url, {
      method,
      signal: AbortSignal.timeout(10000),
      redirect: 'follow',
    });
    const ms = Date.now() - start;
    const ok = res.status === expectedStatus;
    let sslDaysLeft = null;
    if (checkSSL && url.startsWith('https')) {
      sslDaysLeft = await getSslDaysLeft(url);
    }
    return { ok, ms, status: res.status, sslDaysLeft };
  } catch (e) {
    return { ok: false, ms: Date.now() - start, error: e.message };
  }
}

async function getSslDaysLeft(url) {
  return new Promise((resolve) => {
    try {
      const { hostname, port } = new URL(url);
      const socket = tls.connect({ host: hostname, port: parseInt(port) || 443, servername: hostname }, () => {
        const cert = socket.getPeerCertificate();
        socket.destroy();
        if (!cert || !cert.valid_to) return resolve(null);
        const days = Math.floor((new Date(cert.valid_to) - Date.now()) / 86400000);
        resolve(days);
      });
      socket.on('error', () => resolve(null));
      socket.setTimeout(5000, () => { socket.destroy(); resolve(null); });
    } catch { resolve(null); }
  });
}

async function checkTcp({ host, port }) {
  return new Promise((resolve) => {
    const start = Date.now();
    const socket = net.createConnection({ host, port: parseInt(port), timeout: 5000 });
    socket.on('connect', () => { socket.destroy(); resolve({ ok: true, ms: Date.now() - start }); });
    socket.on('error', (e) => resolve({ ok: false, ms: Date.now() - start, error: e.message }));
    socket.on('timeout', () => { socket.destroy(); resolve({ ok: false, ms: 5000, error: 'Timeout' }); });
  });
}

async function checkDns({ hostname, expectedIp, dnsServer = '8.8.8.8' }) {
  const start = Date.now();
  try {
    const resolver = new dns.promises.Resolver();
    if (dnsServer) resolver.setServers([dnsServer]);
    const addresses = await resolver.resolve4(hostname);
    const ms = Date.now() - start;
    const ok = !expectedIp || addresses.includes(expectedIp);
    return { ok, ms, resolved: addresses };
  } catch (e) {
    return { ok: false, ms: Date.now() - start, error: e.message };
  }
}

async function checkDatabase({ dbType, host, port, user, password, database }) {
  const start = Date.now();
  try {
    if (dbType === 'redis') {
      const Redis = require('ioredis');
      const client = new Redis({ host, port: parseInt(port) || 6379, password, connectTimeout: 5000, lazyConnect: true });
      await client.connect();
      await client.ping();
      await client.quit();
      return { ok: true, ms: Date.now() - start };
    }
    if (dbType === 'mysql') {
      const mysql = require('mysql2/promise');
      const conn = await mysql.createConnection({ host, port: parseInt(port) || 3306, user, password, database, connectTimeout: 5000 });
      await conn.ping();
      await conn.end();
      return { ok: true, ms: Date.now() - start };
    }
    if (dbType === 'postgresql') {
      const { Client } = require('pg');
      const client = new Client({ host, port: parseInt(port) || 5432, user, password, database, connectionTimeoutMillis: 5000 });
      await client.connect();
      await client.query('SELECT 1');
      await client.end();
      return { ok: true, ms: Date.now() - start };
    }
    if (dbType === 'mongodb') {
      const { MongoClient } = require('mongodb');
      const uri = `mongodb://${user ? `${user}:${password}@` : ''}${host}:${port || 27017}/${database || ''}`;
      const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
      await client.connect();
      await client.db().command({ ping: 1 });
      await client.close();
      return { ok: true, ms: Date.now() - start };
    }
    return { ok: false, ms: 0, error: `Unknown dbType: ${dbType}` };
  } catch (e) {
    return { ok: false, ms: Date.now() - start, error: e.message };
  }
}

async function checkApi({ url, method = 'GET', headers = {}, body, expectedStatus = 200, authType = 'none', authValue = '' }) {
  const start = Date.now();
  try {
    const authHeader = authType === 'bearer' ? { Authorization: `Bearer ${authValue}` }
                     : authType === 'basic'  ? { Authorization: `Basic ${Buffer.from(authValue).toString('base64')}` }
                     : {};
    const opts = {
      method,
      headers: { ...headers, ...authHeader },
      signal: AbortSignal.timeout(10000),
    };
    if (body && !['GET', 'HEAD'].includes(method)) opts.body = body;
    const res = await fetch(url, opts);
    const ms = Date.now() - start;
    return { ok: res.status === expectedStatus, ms, status: res.status };
  } catch (e) {
    return { ok: false, ms: Date.now() - start, error: e.message };
  }
}

// ─── Runner ───────────────────────────────────────────────────────────────

async function runCheck(monitor) {
  let result;
  switch (monitor.type) {
    case 'web':      result = await checkWeb(monitor.config); break;
    case 'tcp':      result = await checkTcp(monitor.config); break;
    case 'dns':      result = await checkDns(monitor.config); break;
    case 'database': result = await checkDatabase(monitor.config); break;
    case 'api':      result = await checkApi(monitor.config); break;
    default:         result = { ok: false, error: `Unknown type: ${monitor.type}` };
  }
  result.at = Date.now();

  const prev = store.getMonitor(monitor.id);
  const wasUp = prev?.lastResult?.ok;
  const isUp = result.ok;

  // Keep last 30 results for history bar
  const history = [...(prev?.history || []), { ok: result.ok, ms: result.ms, at: result.at }].slice(-30);

  // Uptime % over last 24h
  const since24h = Date.now() - 86400000;
  const recent = history.filter(h => h.at > since24h);
  const uptime24h = recent.length ? Math.round((recent.filter(h => h.ok).length / recent.length) * 100) : null;

  store.setMonitor(monitor.id, { ...prev, lastCheck: result.at, lastResult: result, history, uptime24h });

  if (prev && wasUp !== undefined && wasUp !== isUp) {
    const msg = isUp
      ? `✅ *${monitor.name}* is UP (${monitor.type})`
      : `🔴 *${monitor.name}* is DOWN (${monitor.type})${result.error ? ': ' + result.error : ''}`;
    store.addEvent({ type: monitor.type, name: monitor.name, status: isUp ? 'up' : 'down', ms: result.ms, at: result.at });
    await notifier.notify(msg);
  }

  return result;
}

// ─── Scheduler ────────────────────────────────────────────────────────────

function scheduleMonitor(monitor) {
  if (jobs.has(monitor.id)) return;
  const secs = Math.max(10, parseInt(monitor.interval) || 60);
  const job = cron.schedule(`*/${secs} * * * * *`, () => runCheck(monitor).catch(console.error));
  jobs.set(monitor.id, job);
  // Run immediately after 2s delay
  setTimeout(() => runCheck(monitor).catch(console.error), 2000);
}

function unscheduleMonitor(id) {
  const job = jobs.get(id);
  if (job) { job.stop(); jobs.delete(id); }
}

function startAllMonitors() {
  const monitors = store.getMonitors().filter(m => m.enabled);
  console.log(`[monitors] Starting ${monitors.length} monitors`);
  monitors.forEach(m => scheduleMonitor(m));
}

module.exports = { runCheck, scheduleMonitor, unscheduleMonitor, startAllMonitors };

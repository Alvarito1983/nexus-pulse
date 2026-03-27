<div align="center">

<img src="https://raw.githubusercontent.com/Alvarito1983/nexus-pulse/main/docs/nexus-pulse.png" width="120" height="120" alt="NEXUS Pulse logo" />

# NEXUS Pulse

**A lightweight, beautiful uptime & health monitoring tool — for Docker containers and network services.**

[![License MIT](https://img.shields.io/badge/license-MIT-3b82f6?style=flat-square)](LICENSE)
[![Docker ready](https://img.shields.io/badge/docker-ready-3b82f6?style=flat-square&logo=docker&logoColor=white)](https://hub.docker.com/r/afraguas1983/nexus-pulse)
[![docker pulls](https://img.shields.io/docker/pulls/afraguas1983/nexus-pulse?style=flat-square&logo=docker&logoColor=white&color=3b82f6)](https://hub.docker.com/r/afraguas1983/nexus-pulse)
[![Node.js 24](https://img.shields.io/badge/node-24--alpine-3b82f6?style=flat-square&logo=node.js&logoColor=white)](https://hub.docker.com/_/node)
[![React 18](https://img.shields.io/badge/react-18-3b82f6?style=flat-square&logo=react&logoColor=white)](https://react.dev)

[Docker Hub](https://hub.docker.com/r/afraguas1983/nexus-pulse) · [Report Bug](https://github.com/Alvarito1983/nexus-pulse/issues)

</div>

---

## ✨ Features

- 🐳 **Container monitoring** — real-time status of all Docker containers grouped by state (Running / Stopped / Other)
- 🌐 **Web monitors** — HTTP/HTTPS checks with response time, status code and SSL certificate expiry
- 🔌 **TCP monitors** — port availability checks for any host and port
- 🔍 **DNS monitors** — DNS resolution checks with optional IP validation
- 🗄️ **Database monitors** — connection checks for MySQL, PostgreSQL, Redis and MongoDB
- 📡 **API monitors** — HTTP checks with custom headers, auth (Bearer / Basic) and expected status
- 📊 **Uptime history** — visual 30-check history bar per monitor (green/red pixels)
- 🔔 **Telegram alerts** — instant notifications when a monitor goes DOWN or recovers UP
- 🌍 **Full EN/ES i18n** — English and Spanish UI
- 📱 **PWA** — installable on mobile and desktop
- 🔒 **Multi-user** — Admin and Viewer roles with session-based auth

---

## Quickstart

```bash
docker run -d \
  --name nexus-pulse \
  -p 9092:3002 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v pulse-data:/app/data \
  afraguas1983/nexus-pulse:latest
```

Or with Docker Compose (recommended):

```bash
git clone https://github.com/Alvarito1983/nexus-pulse.git
cd nexus-pulse
cp .env.example .env
docker compose up -d
```

Open **http://localhost:9092** — default credentials: `admin` / `admin`

---

## 📸 Screenshots

| Login | Containers |
|-------|-----------|
| ![Login](https://raw.githubusercontent.com/Alvarito1983/nexus-pulse/main/docs/screenshots/login.png) | ![Containers](https://raw.githubusercontent.com/Alvarito1983/nexus-pulse/main/docs/screenshots/containers.png) |

| Web monitors | TCP monitors |
|-------------|-------------|
| ![Web](https://raw.githubusercontent.com/Alvarito1983/nexus-pulse/main/docs/screenshots/web.png) | ![TCP](https://raw.githubusercontent.com/Alvarito1983/nexus-pulse/main/docs/screenshots/tcp.png) |

| DNS monitors | Database monitors |
|-------------|------------------|
| ![DNS](https://raw.githubusercontent.com/Alvarito1983/nexus-pulse/main/docs/screenshots/dns.png) | ![Database](https://raw.githubusercontent.com/Alvarito1983/nexus-pulse/main/docs/screenshots/database.png) |

| API monitors | History |
|-------------|---------|
| ![API](https://raw.githubusercontent.com/Alvarito1983/nexus-pulse/main/docs/screenshots/api.png) | ![History](https://raw.githubusercontent.com/Alvarito1983/nexus-pulse/main/docs/screenshots/history.png) |

---

## 🗺️ Roadmap

### v1.0.0 — Current ✅
- Docker container monitoring with grouped view (Running / Stopped / Other)
- Web (HTTP/HTTPS + SSL), TCP, DNS, Database and API monitors
- Visual 30-check uptime history bar per monitor
- Telegram notifications on state changes
- EN/ES i18n
- PWA support
- Session-based auth with Admin/Viewer roles

### v1.1.0 _(coming soon)_
- Response time charts (last 24h per monitor)
- Incident history per monitor (when it went down, how long)
- Status page — public read-only overview
- NEXUS Hub integration (SSO + centralised user management)

### v2.0.0 — NEXUS Ecosystem 🚀 _(Q4 2026)_

NEXUS Pulse is part of the **NEXUS Ecosystem** — a suite of modular, standalone Docker tools that integrate seamlessly when used together.

> *"Each tool works. Together, they think."*

```
NEXUS Hub             — Unified dashboard, SSO, service registry  :9095
├── NEXUS             — Docker manager                             :9090  ✅ live
├── NEXUS Watcher     — Image update detection                     :9091  ✅ live
├── NEXUS Pulse       — Uptime & health monitoring                 :9092  ✅ live
├── NEXUS Security    — CVEs, SSL & audit                          :9093  🔜 coming
└── NEXUS Notify      — Unified alert routing                      :9094  🔜 coming
```

---

## ⚙️ Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `ADMIN_USER` | `admin` | Admin username |
| `ADMIN_PASSWORD` | `admin` | Admin password |
| `POLL_INTERVAL` | `30` | Container poll interval in seconds |

---

## Tech stack

- **Backend** — Node.js 24, Express, Dockerode, node-cron
- **Frontend** — React 18, Vite
- **Base image** — `node:24-alpine`
- **Auth** — Session tokens, Admin/Viewer roles
- **Docker socket** — always via `tecnativa/docker-socket-proxy` (never mounted directly)

---

## License

MIT © [Alvarito1983](https://github.com/Alvarito1983)

---

<div align="center">

Made with ☕ by [Alvarito1983](https://github.com/Alvarito1983)

</div>

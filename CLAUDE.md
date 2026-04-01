# NEXUS Pulse — Design System & Development Context

## Project Overview

NEXUS Pulse is a standalone uptime monitor. It tracks Docker containers, web endpoints (HTTP/HTTPS + SSL), TCP ports, DNS, databases, and APIs. Shows a 30-check visual history bar per monitor and sends Telegram alerts. Part of the NEXUS ecosystem but fully independent.

### Ecosystem context

| Tool     | Color      | Hex       | Port |
|----------|------------|-----------|------|
| NEXUS    | Green      | `#00c896` | 9090 |
| Watcher  | Amber      | `#F0A500` | 9091 |
| **Pulse**    | **Blue**   | **`#3b82f6`** | **9092** |
| Security | Red        | `#ef4444` | 9093 |
| Notify   | Purple     | `#8b5cf6` | 9094 |
| Hub      | Deep Purple| `#534AB7` | 9095 |

### Tech Stack

- **Framework**: React 18 + Vite
- **Styling**: CSS custom properties (no Tailwind)
- **Icons**: Lucide React
- **State**: React Context + hooks
- **Auth**: JWT (standalone users, Admin/Viewer roles)
- **Backend**: Node.js + Express + Socket.io
- **Target**: Self-hosted Docker environments (desktop + mobile)

### Dev path
- **Development**: `E:\Claude\nexus-pulse`
- **Production stack**: `E:\arr\stack\nexus-pulse\`
- **GitHub**: github.com/Alvarito1983/nexus-pulse
- **Docker Hub**: afraguas1983/nexus-pulse
- **CI/CD**: push to `main` → GitHub Actions → Docker Hub + GHCR

---

## Visual Identity — Dark Premium (Blue)

The Pulse design language follows the NEXUS ecosystem Dark Premium standard. Same foundations, but the accent color is **blue `#3b82f6`** — communicating reliability, uptime, monitoring, trust.

### Design Philosophy

- **Dark-first**: Deep dark backgrounds, blue as the signal color
- **Blue = reliability**: Used for active monitors, uptime bars, live status
- **Heartbeat metaphor**: The 30-check history bar is the visual centerpiece
- **Motion as data**: Animations communicate real system state, not decoration

---

## Color System

### Base Palette (CSS Variables)

```css
:root {
  /* Backgrounds — layered depth */
  --bg-base:       #0a0a0f;
  --bg-surface:    #111118;
  --bg-elevated:   #1a1a24;
  --bg-overlay:    #22222e;
  --bg-subtle:     #16161f;

  /* Borders */
  --border-subtle:  rgba(255,255,255,0.06);
  --border-default: rgba(255,255,255,0.10);
  --border-strong:  rgba(255,255,255,0.18);

  /* Text */
  --text-primary:   #f0f0f8;
  --text-secondary: #9090a8;
  --text-muted:     #55556a;
  --text-disabled:  #3a3a4a;

  /* Pulse Accent — Blue */
  --accent:         #3b82f6;
  --accent-dim:     rgba(59, 130, 246, 0.12);
  --accent-glow:    rgba(59, 130, 246, 0.20);

  /* Semantic */
  --color-success:  #00c896;
  --color-warning:  #F0A500;
  --color-danger:   #ef4444;
  --color-info:     #3b82f6;

  /* Monitor status */
  --status-up:      #00c896;
  --status-down:    #ef4444;
  --status-pending: #F0A500;
  --status-paused:  #55556a;

  /* History bar check colors */
  --check-up:      #00c896;
  --check-down:    #ef4444;
  --check-pending: #F0A500;
  --check-empty:   #1a1a24;

  /* Layout */
  --radius-sm:  6px;
  --radius-md:  8px;
  --radius-lg:  12px;
  --radius-xl:  16px;

  /* Shadows */
  --shadow-sm:     0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.3);
  --shadow-md:     0 4px 12px rgba(0,0,0,0.5), 0 2px 4px rgba(0,0,0,0.3);
  --shadow-lg:     0 8px 32px rgba(0,0,0,0.6), 0 4px 8px rgba(0,0,0,0.4);
  --shadow-accent: 0 0 20px var(--accent-glow);

  /* Transitions */
  --transition-fast: 120ms ease;
  --transition-base: 200ms ease;
  --transition-slow: 350ms ease;
}
```

---

## Typography

```css
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;

--text-xs:   11px;
--text-sm:   13px;
--text-base: 14px;
--text-lg:   18px;
--text-xl:   22px;
--text-2xl:  28px;

--weight-normal:   400;
--weight-medium:   500;
--weight-semibold: 600;
```

### Typography Rules

- **Page titles**: 22px / 600 / `--text-primary`
- **Section headers**: 13px / 500 / `--text-secondary` / UPPERCASE / letter-spacing: 0.08em
- **Monitor names**: 14px / 500 / `--text-primary`
- **URLs / endpoints**: `--font-mono` / 13px / `--text-secondary`
- **Labels**: 12px / 400 / `--text-muted`
- **Response times**: `--font-mono` / 13px / color semántico

---

## Layout Architecture

```
┌─────────────────────────────────────────────────┐
│  Sidebar (220px fixed)  │  Main Content Area     │
│  ─────────────────────  │  ─────────────────────  │
│  Logo + "Pulse"         │  TopBar (56px)          │
│  ─────────────────────  │  ─────────────────────  │
│  Nav items              │  Page Content           │
│  - Dashboard            │  (scrollable)           │
│  - Monitors             │                         │
│  - Docker               │                         │
│  - Alerts               │                         │
│  - Settings             │                         │
│  ─────────────────────  │                         │
│  User + Settings        │                         │
└─────────────────────────────────────────────────┘
```

---

## Pulse-specific Components

### History Bar (30 checks)

The visual centerpiece of Pulse. 30 thin vertical bars representing the last 30 checks.

```css
.history-bar {
  display: flex;
  gap: 2px;
  align-items: flex-end;
  height: 28px;
}

.history-check {
  width: 6px;
  height: 100%;
  border-radius: 2px;
  transition: opacity var(--transition-fast);
}

.history-check.up      { background: var(--check-up); }
.history-check.down    { background: var(--check-down); }
.history-check.pending { background: var(--check-pending); }
.history-check.empty   { background: var(--check-empty); }

.history-check:hover { opacity: 0.7; cursor: pointer; }
```

### Monitor Card

```css
.monitor-card {
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: 16px 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  transition: border-color var(--transition-base);
}

.monitor-card:hover {
  border-color: var(--border-default);
}

.monitor-card.down {
  border-color: rgba(239,68,68,0.25);
}

.monitor-card.down::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 2px;
  background: var(--color-danger);
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
}

/* Status dot */
.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}
.status-dot.up      { background: var(--status-up); box-shadow: 0 0 6px rgba(0,200,150,0.5); }
.status-dot.down    { background: var(--status-down); box-shadow: 0 0 6px rgba(239,68,68,0.5); }
.status-dot.pending { background: var(--status-pending); animation: pulse 2s ease-in-out infinite; }
.status-dot.paused  { background: var(--status-paused); }
```

### Uptime Percentage

```css
.uptime-value {
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  font-weight: var(--weight-semibold);
}

.uptime-value.high   { color: var(--color-success); }  /* > 99% */
.uptime-value.medium { color: var(--color-warning); }  /* 95-99% */
.uptime-value.low    { color: var(--color-danger); }   /* < 95% */
```

### Response Time Badge

```css
.response-time {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--text-muted);
  padding: 2px 6px;
  background: var(--bg-elevated);
  border-radius: var(--radius-sm);
}
```

---

## Shared Components (src/components/ui/)

- `Button.jsx` — primary / secondary / ghost / danger · sm/md · loading state
- `Badge.jsx` — up / down / pending / paused / info · dot animado
- `Card.jsx` — Card base + StatCard con línea de acento superior
- `Input.jsx` — label, placeholder, focus ring de acento, error state
- `EmptyState.jsx` — icon + title + description + optional action
- `Skeleton.jsx` — Skeleton, SkeletonRow, SkeletonTable

---

## Version as single source of truth

```js
// vite.config.js
const { version } = JSON.parse(readFileSync('./package.json', 'utf8'));
export default defineConfig({
  define: { __APP_VERSION__: JSON.stringify(version) }
});
```

Use `{__APP_VERSION__}` everywhere. Never hardcode version strings.

---

## Motion & Animation

```css
@keyframes fadeSlideUp {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.4; }
}
@keyframes shimmer {
  from { background-position: -200% 0; }
  to   { background-position:  200% 0; }
}
@keyframes heartbeat {
  0%, 100% { transform: scale(1); }
  50%       { transform: scale(1.15); }
}

.animate-in { animation: fadeSlideUp 300ms ease both; }
.stagger > *:nth-child(1) { animation-delay: 0ms; }
.stagger > *:nth-child(2) { animation-delay: 60ms; }
.stagger > *:nth-child(3) { animation-delay: 120ms; }
.stagger > *:nth-child(4) { animation-delay: 180ms; }
.skeleton {
  background: linear-gradient(90deg,
    var(--bg-elevated) 25%, var(--bg-overlay) 50%, var(--bg-elevated) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
  border-radius: var(--radius-sm);
}
```

---

## Quality Standards

Every screen must have:
1. Proper visual hierarchy
2. Empty states
3. Loading states (skeleton screens)
4. Error states
5. Responsive 1280px → 768px

Anti-patterns to avoid:
- ❌ Hardcoded version strings
- ❌ Hardcoded colors outside CSS variables
- ❌ `&&` in PowerShell
- ❌ History bar sin tooltip en hover

## CRLF fix (Windows builds)

```bash
docker run --rm -v "${PWD}:/work" alpine sh -c "sed -i 's/\r//' /work/backend/entrypoint.sh"
```

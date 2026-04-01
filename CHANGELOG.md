# Changelog

## [1.1.0] — 2026-04-01

### Changed
- Complete UI redesign — Dark Premium visual system (blue accent `#3b82f6`)
- New design tokens: `src/styles/tokens.css` with all CSS variables for every visual property
- `src/styles/global.css`: Google Fonts (Inter + JetBrains Mono), keyframes, responsive layout classes
- Login page: single centered card (380px), blue radial glow, `fadeSlideUp` animation, dynamic version footer
- Sidebar: dark surface (`--bg-subtle`), Lucide icons, blue active indicator, hover logout
- TopBar: 56px, `backdrop-filter: blur(8px)`, page title, avatar
- Dashboard: stat cards with 2px semantic accent line, stagger animation, skeleton loading state
- Monitor cards: status dot with glow, 30-check `HistoryBar`, uptime %, response time badge, `Badge` component
- `HistoryBar` component: 30 vertical bars (6px) with tooltip on hover (timestamp + response time)
- Typography: Inter for UI, JetBrains Mono for code/endpoints/values
- Shared UI library: `Button`, `Badge`, `Card`/`StatCard`, `Input`, `EmptyState`, `Skeleton`/`SkeletonMonitorCard`
- Container rows: Lucide icons for actions (Play, Stop, Restart), `Eye`/`EyeOff` for env vars
- All inline hardcoded colors replaced with CSS variables
- Version now dynamic from `package.json` via `__APP_VERSION__` (Vite `define`)
- `lucide-react` added as dependency

### Fixed
- Responsive layout: hamburger sidebar overlay on mobile (< 768px)
- Frontend version synced to 1.1.0 (was 1.0.0)

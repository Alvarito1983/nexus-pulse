# Changelog

## [1.2.0] — 2026-04-01

### Changed
- Complete UI overhaul — Dark Premium design language (Linear/Vercel aesthetic), blue accent `#3b82f6`
- Unified layout with NEXUS ecosystem standard (identical sidebar/topbar structure)
- Login: centered card (380px), blue radial glow via `::before`, `fadeSlideUp` animation, scoped CSS approach matching NEXUS
- Sidebar: `nx-sidebar` CSS class, dark surface (`--bg-subtle`), Lucide icons, `.nx-nav-item.active` in blue, user card + logout at bottom
- TopBar: `nx-topbar` CSS class, 56px height, `backdrop-filter: blur(8px)`, sticky, live refresh badge
- Stat cards: `.stat-cards-grid` + `.stat-card` with 2px `::before` semantic accent line, stagger animation, skeleton loading
- `HistoryBar` component: 30 vertical bars (6px each) with hover tooltips (timestamp + ms)
- Shared UI library: `Button`, `Badge`, `Card`/`StatCard`, `Input`, `EmptyState`, `Skeleton`, `HistoryBar`
- Design tokens: `src/styles/tokens.css` with complete CSS variable set + bridge aliases
- Global CSS: `src/styles/global.css` matching NEXUS pattern (keyframes, responsive, skeleton, stat cards)
- Typography: Inter (UI) + JetBrains Mono (code, endpoints, values) via Google Fonts
- `LangSelector` updated to use CSS variables (no hardcoded colors)
- Version dynamic from `package.json` via Vite `define: { __APP_VERSION__ }` — no hardcoded strings
- `lucide-react` added as dependency

### Fixed
- Responsive layout: hamburger + overlay sidebar on mobile (< 768px)
- Frontend and backend versions synced to 1.2.0

## [1.1.0] — 2026-04-01

### Changed
- Initial UI foundation — Dark Premium visual system (blue accent `#3b82f6`)
- Design tokens CSS variables, Google Fonts integration
- Login page: single centered card, blue radial glow, `fadeSlideUp` animation
- Sidebar with Lucide icons and blue active state
- TopBar 56px with backdrop blur
- Stat cards with semantic accent lines and skeleton loading
- Monitor cards: status dot, `HistoryBar` 30-check, uptime %, response time badge
- Shared components: `Button`, `Badge`, `Card`, `Input`, `EmptyState`, `Skeleton`
- Container rows: Lucide action icons

### Fixed
- Responsive layout: hamburger sidebar overlay on mobile
- Frontend version synced from 1.0.0 → 1.1.0

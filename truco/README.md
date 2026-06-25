# Truco Lab

Argentine Truco trainer built with **Expo + React Native Web**. Portfolio project demonstrating domain-driven design, cross-platform UI, and testable game rules.

## Stack

| Layer | Choice |
|-------|--------|
| Runtime | Expo SDK 56, React Native Web |
| Navigation | Expo Router (file-based) |
| Language | TypeScript strict |
| Lint / format | Biome |
| Tests | jest-expo |
| i18n | expo-localization + i18n-js (es/en menus, Spanish game jargon) |
| Deploy | Vercel static export |

## Architecture

```
src/
├── app/          # Expo Router — thin route files
├── domain/       # Pure TS game rules (Phase 3+)
├── features/     # Screen logic + components
└── shared/       # theme, i18n, ui primitives
```

**Dependency rule:** `app/` → `features/` → `shared/`. `domain/` has zero React/RN imports.

## Setup

```bash
yarn install
yarn start        # Expo dev server
yarn web          # Web only
```

## Scripts

| Command | Description |
|---------|-------------|
| `yarn start` | Start Expo dev server |
| `yarn web` | Start web dev server |
| `yarn web:export` | Static export to `dist/` |
| `yarn lint` | Biome check |
| `yarn format` | Biome format |
| `yarn typecheck` | TypeScript strict check |
| `yarn test` | Jest smoke tests |

## Routes (Phase 1 placeholders)

| Path | Screen |
|------|--------|
| `/` | Main menu |
| `/game` | Game table |
| `/game/setup` | New game setup |
| `/rules` | Rules & tutorial |
| `/rules/ranking` | Card ranking |
| `/result` | Match result |
| `/settings` | Settings (locale toggle) |
| `/about` | About / portfolio |

## Deploy (Vercel)

1. Connect repo to Vercel
2. Build command: `yarn web:export`
3. Output directory: `dist`

`vercel.json` includes SPA rewrites for Expo Router deep links.

## Design system (Phase 2)

Visual direction: **Nocturnal Bodegón** — cozy Argentine bodegón aesthetic. Full tokens in `docs/design-tokens.md`.

### Theme (`src/shared/theme/`)

| Module | Purpose |
|--------|---------|
| `colors.ts` | Full MD3 palette + `teamNos` / `teamEllos` |
| `spacing.ts` | 4px baseline scale |
| `typography.ts` | Libre Caslon Text + Hanken Grotesk scales |
| `shadows.ts` | Cross-platform elevation (0–3) |
| `tokens.ts` | Composed `Theme` type — import via `@/shared/theme` |

Fonts load via `FontGate` in `src/app/_layout.tsx` before rendering.

### UI primitives (`src/shared/ui/`)

| Component | Use |
|-----------|-----|
| `Screen` | SafeArea + background + optional title/scroll |
| `Button` | Primary (gold) / secondary (wood), disabled state |
| `Card` | Surface container with elevation 1–2 |
| `Pill` | Tags and Spanish game jargon |
| `ScoreBadge` | Team-colored score stub (palotes in Phase 7) |

### Layout (`src/shared/layout/`)

| Helper | Use |
|--------|-----|
| `useBreakpoint()` | Returns `mobile` / `tablet` / `desktop` |
| `Stack` | Vertical flex with token gap |
| `Row` | Horizontal flex with token gap |

## Roadmap

See `docs/backlog.md` for the full 12-phase plan. MVP = Phases 1–9 (playable 1v1 vs CPU with truco/envido).

## SDD

Spec-driven development artifacts live in `openspec/`. Active change: none — next up Phase 3 (`spanish-deck`).

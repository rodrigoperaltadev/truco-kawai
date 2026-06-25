# Exploration: Phase 2 — Design System

**Change:** `design-system`  
**Date:** 2026-06-25  
**Status:** Complete — ready for proposal

## Executive Summary

Phase 1 left a **theme stub** (`src/shared/theme/tokens.ts`) with partial Nocturnal Bodegón tokens and ad-hoc styles per screen. Phase 2 turns that into a **cohesive RN design system**: full token set, base components, layout helpers, and refactored screens using shared primitives — without web/CSS assumptions.

Visual direction stays **cozy Argentine bodegón** (felt green, wood, gold accents), not casino/poker.

## Current State

| Asset | Status |
|-------|--------|
| `docs/design-tokens.md` | Full Stitch tokens preserved |
| `src/shared/theme/tokens.ts` | Partial subset (colors, spacing, radius, typography) |
| `src/shared/theme/ThemeProvider.tsx` | Static theme, no dark/light toggle needed |
| Screen styles | Per-feature `*.styles.ts` (menu, settings, placeholder) — good pattern |
| Base components | **None** — screens use raw `View`/`Text`/`Pressable` |
| Fonts | System defaults — Libre Caslon / Hanken Grotesk **not loaded yet** |
| Shadows/elevation | Not modeled |
| Layout helpers | No responsive breakpoints |

## Backlog Scope (Phase 2)

1. Extract full reusable tokens from `design-tokens.md`
2. Confirm visual direction (Nocturnal Bodegón, not kawaii-casino)
3. Build: `Screen`, `Card`, `Button`, `Pill`, `ScoreBadge`
4. Responsive layout helpers (mobile-first, desktop later)
5. Replace ad-hoc styling with shared components

## Approaches

### 1. Token expansion

| Option | Pros | Cons | Effort |
|--------|------|------|--------|
| **A. Extend `tokens.ts`** | Matches Phase 1; typed `Theme` | Large file if everything inline | Low |
| **B. Split token modules** | `colors.ts`, `spacing.ts`, `shadows.ts` | More files | Med |

**Recommendation:** **B** — split modules, re-export from `tokens.ts` for stable `Theme` type.

### 2. Component library location

| Option | Pros | Cons | Effort |
|--------|------|------|--------|
| **`src/shared/ui/`** | Already has `PlaceholderScreen` | — | Low |
| **`src/components/`** | Expo default | Breaks feature-sliced convention | — |

**Recommendation:** **`src/shared/ui/`** with one folder per component (`Button/`, `Screen/`, etc.).

### 3. Styling pattern

Follow **rn-refactor** skill (already in use):
- `ComponentName.tsx` — presentational only
- `ComponentName.styles.ts` — `createXStyles(theme)` factory
- No hardcoded colors/strings
- i18n for labels; theme for visuals

### 4. Fonts

| Option | Pros | Cons | Effort |
|--------|------|------|--------|
| **expo-font + Google Fonts** | Matches DESIGN.md | Bundle size, load gate | Med |
| **System fonts Phase 2, fonts Phase 2.1** | Ship components faster | Visual gap vs mockups | Low |

**Recommendation:** **Load fonts in Phase 2** via `@expo-google-fonts/libre-caslon-text` + `@expo-google-fonts/hanken-grotesk` — portfolio piece needs typography fidelity.

### 5. Responsive layout

| Option | Pros | Cons | Effort |
|--------|------|------|--------|
| **`useWindowDimensions` + breakpoints** | RN-native, no deps | Manual breakpoint constants | Low |
| **react-native-responsive-screen** | Convenience | Extra dep | Low |

**Recommendation:** **`useWindowDimensions` + `src/shared/layout/breakpoints.ts`** — keep deps minimal.

### 6. ScoreBadge / Pill

- **Pill:** generic tag (jargon, status) — extract from `PlaceholderScreen`
- **ScoreBadge:** palotes/tanto UI — stub with team colors (`teamNos`, `teamEllos` already in tokens)

## Proposed Component API (draft)

```
Screen       — SafeArea + scroll + background + optional title
Card         — surface container, elevation level 1–2
Button       — primary (gold/tertiary), secondary (wood/surface), disabled
Pill         — small label chip (jargon, tags)
ScoreBadge   — team score display (red/blue, palote placeholder)
```

## Affected Areas

| Path | Impact |
|------|--------|
| `src/shared/theme/` | Expand tokens, shadows, font families |
| `src/shared/ui/` | New base components |
| `src/shared/layout/` | Breakpoints, `useResponsiveLayout` |
| `src/features/menu/` | Refactor to `Screen` + `Button` |
| `src/features/settings/` | Refactor to shared components |
| `src/shared/ui/PlaceholderScreen/` | Use `Screen`, `Pill` |
| `app/_layout.tsx` | Font loading gate (if fonts in scope) |

## Risks

| Risk | Mitigation |
|------|------------|
| Font loading flash | `expo-splash-screen` hold until fonts ready |
| Scope creep into game table UI | Phase 2 = primitives only; table layout is Phase 7 |
| Shadow cross-platform | Use RN `elevation` (Android) + `shadow*` (iOS) helpers |
| Refactor breaks i18n | Keep hooks; only swap presentational layer |

## Estimated Scope

| Category | Lines |
|----------|-------|
| Token expansion | ~120–180 |
| 5 base components | ~400–550 |
| Layout helpers | ~60–80 |
| Screen refactors | ~150–200 |
| Font setup | ~40–60 |
| Tests (component smoke) | ~80–120 |

**Total:** ~850–1200 lines → **review budget risk: High** → consider single PR with `size:exception` or split: **2a tokens+fonts**, **2b components**, **2c refactors**.

## Skills to Load at Apply

- `/Users/rodrigo.peralta/.agents/skills/rn-refactor/SKILL.md`
- `/Users/rodrigo.peralta/Documents/little-goals/truco/.agents/skills/building-native-ui/SKILL.md`

## Ready for Proposal

**Yes** — pending product confirmation on fonts-in-Phase-2 vs deferred.

## Next Step

`sdd-propose` → `openspec/changes/design-system/proposal.md`

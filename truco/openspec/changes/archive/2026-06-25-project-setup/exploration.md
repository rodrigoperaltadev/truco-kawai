# Exploration: Project Setup & Stack

**Change:** `project-setup`  
**Date:** 2026-06-24  
**Status:** Complete — ready for proposal

---

## Executive Summary

Truco Lab is a **greenfield** portfolio app: no `package.json`, a 12-phase backlog in `docs/backlog.md`, and a Stitch HTML export used only as visual reference. The MVP needs a **testable Argentine Truco domain engine**, a **mobile-first RN Web game table**, and clean separation between rules and UI.

**Recommended stack:** Expo SDK **54** (stable default), **`default` template** (Expo Router + TypeScript, not tabs), **TypeScript strict**, **Biome** as primary linter/formatter, **Vitest for `src/domain/`** + **Jest + `jest-expo` for RNTL**, **Expo Router** file-based navigation, **pure domain reducers + Zustand** as a thin UI bridge, and **`@/*` path aliases** into `src/`. Stitch `DESIGN.md` tokens map to `src/shared/theme/` — no HTML/CSS in production.

The highest-leverage architectural choice is **keeping all Truco rules in framework-agnostic TypeScript** and treating React state as a projection of domain events.

---

## Recommended Stack

| Area | Recommendation | Rationale |
|------|----------------|-----------|
| **Expo SDK** | **SDK 54** via `create-expo-app@latest` | Stable default; full RN Web + Expo Router |
| **Create command** | **`default` template** (not `tabs`, not `blank`) | Stack/deep-link IA (menu → game → result), not bottom tabs |
| **TypeScript** | **`strict: true`** (+ `noUncheckedIndexedAccess` recommended) | Backlog requirement; catches illegal game transitions |
| **Lint / format** | **Biome** (primary) | Single fast tool; add `expo lint` later if needed |
| **Tests — domain** | **Vitest** | Pure TS without Metro overhead; ideal for rules TDD |
| **Tests — UI** | **Jest + `jest-expo` + RNTL** | Official Expo path for component tests |
| **Navigation** | **Expo Router** | File-based `app/` routes, web URLs, deep linking |
| **Game state** | **Pure domain reducer + Zustand bridge** | Rules in testable pure functions; Zustand for UI session only |
| **Styling** | `StyleSheet` + theme tokens | RN-compatible; rebuild Stitch look without Tailwind/HTML |
| **Package manager** | **pnpm** (or npm) | Fast, strict; fine for single-package app |
| **Stitch HTML** | **Reference only** | Extract tokens + layout intent; never ship HTML |

### Init command (draft — apply phase)

```bash
cd /Users/rodrigo.peralta/Documents/little-goals/truco
npx create-expo-app@latest . --template default
npx expo install jest-expo jest @testing-library/react-native
pnpm add -D vitest @biomejs/biome typescript @types/react
```

> If `create-expo-app` refuses a non-empty root, scaffold into `_expo-scaffold/` and merge upward — keep `stitch_*`, `docs/`, `openspec/` untouched.

---

## Folder Structure

```
truco/
├── app/                          # Expo Router — thin route files only
├── src/
│   ├── domain/                   # NO react/rn/expo imports
│   ├── features/                 # game-table, menu, tutorial
│   └── shared/                   # theme, ui, layout
├── assets/
├── docs/
├── openspec/
└── stitch_truco_lab_premium_ui/  # frozen reference — not imported at runtime
```

---

## Alternatives Rejected

| Alternative | Reason |
|-------------|--------|
| `tabs` template | Wrong IA for immersive game table |
| `blank-typescript` | Loses Router scaffold |
| ESLint + Prettier only | Heavier config for solo greenfield |
| Jest-only for all tests | Slower domain TDD loop |
| XState / Redux | Over-engineering for MVP |
| NativeWind in Phase 1 | Theme tokens clearer for cross-platform |
| Copying Stitch card art | Wrong suits; placeholders until post-MVP |

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| `create-expo-app` in non-empty repo | Scaffold subfolder + merge |
| RN Web layout ≠ Stitch desktop | Mobile-first; `useWindowDimensions` |
| Dual test runners | `.test.ts` → Vitest, `.test.tsx` → Jest |
| Game table UI overlap | Strong zone model; log as drawer on mobile |
| Zustand stores game rules | Rule: Zustand only stores domain output + UI flags |

---

## Open Questions (proposal phase)

1. **Package manager:** pnpm vs npm?
2. **SDK pin:** SDK 54 (stable + Expo Go) vs SDK 56?
3. **Test policy:** Dual Vitest+Jest vs Jest-only for simplicity?
4. **Biome-only vs Biome + `expo lint` from day 1?**
5. **Route shape:** Single `/game` vs `/game/[matchId]`?
6. **Flor:** Explicitly out of MVP — confirm?
7. **CPU difficulty:** Single strategy vs tiered?
8. **Portfolio hosting:** `expo export -p web` vs EAS Hosting?

---

## Next Step

Run **`sdd-propose`** for change `project-setup`.

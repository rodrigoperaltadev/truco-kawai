# Tasks: Phase 2 — Design System

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 850–1200 |
| 400-line budget risk | **High** |
| Chained PRs recommended | **Yes** (2 slices) |
| Suggested split | Slice A → Slice B |
| Delivery strategy | ask-always (user approved slices in proposal) |

---

## Slice A — tokens, fonts, Screen, Button

### 1. Dependencies
- [x] 1.1 `yarn add @expo-google-fonts/libre-caslon-text @expo-google-fonts/hanken-grotesk`

### 2. Token modules
- [x] 2.1 Create `src/shared/theme/colors.ts` (full palette from design-tokens.md)
- [x] 2.2 Create `spacing.ts`, `radius.ts`, `typography.ts`, `shadows.ts`
- [x] 2.3 Refactor `tokens.ts` to compose modules; keep `Theme` API stable
- [x] 2.4 Update `ThemeProvider` if needed

### 3. Font loading
- [x] 3.1 Create `src/app/FontGate.tsx` with SplashScreen hold
- [x] 3.2 Wire FontGate in `src/app/_layout.tsx`
- [x] 3.3 Map font families in typography tokens

### 4. Screen + Button primitives
- [x] 4.1 `src/shared/ui/Screen/` (tsx + styles)
- [x] 4.2 `src/shared/ui/Button/` (tsx + styles, primary/secondary/disabled)

### 5. Refactor main menu
- [x] 5.1 `MainMenuScreen` → Screen + Button + Pill (jargon)

### 6. Tests (Slice A)
- [x] 6.1 `__tests__/theme.test.ts` — token values
- [x] 6.2 `__tests__/ui/Button.test.tsx` — disabled state

### 7. Verify Slice A
- [x] 7.1 `yarn typecheck && yarn lint && yarn test && yarn web:export` — passed (local run 2026-06-25)

---

## Slice B — Card, Pill, ScoreBadge, layout, refactors

### 8. Remaining primitives
- [x] 8.1 `src/shared/ui/Card/`
- [x] 8.2 `src/shared/ui/Pill/` — created in Slice A for menu jargon
- [x] 8.3 `src/shared/ui/ScoreBadge/`

### 9. Layout helpers
- [x] 9.1 `src/shared/layout/breakpoints.ts`
- [x] 9.2 `src/shared/layout/useBreakpoint.ts`
- [x] 9.3 `src/shared/layout/Stack/` + `Row/`

### 10. Screen refactors
- [x] 10.1 `SettingsScreen` → Screen + Button + Stack
- [x] 10.2 `PlaceholderScreen` → Screen + Pill

### 11. Tests (Slice B)
- [x] 11.1 `__tests__/layout/useBreakpoint.test.ts`
- [x] 11.2 ScoreBadge smoke test

### 12. Verify Slice B
- [x] 12.1 `yarn typecheck && yarn lint && yarn test && yarn web:export` — verified locally 2026-06-25

### 13. Documentation
- [x] 13.1 Update README design system section (component list + token usage)

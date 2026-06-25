# Proposal: Phase 2 — Design System

## Intent

Turn the Phase 1 theme stub into a reusable **Nocturnal Bodegón** design system: full tokens, loaded typography, base UI primitives, and responsive layout helpers. Refactor placeholder screens to consume shared components per `rn-refactor` conventions.

## Scope

### In Scope
- Expand `src/shared/theme/tokens.ts` from `docs/design-tokens.md` (colors, spacing, radius, shadows, elevation)
- Load **Libre Caslon Text** + **Hanken Grotesk** via Expo Google Fonts in root layout
- Base components: `Screen`, `Button`, `Card`, `Pill`, `ScoreBadge`
- Layout helpers: `useBreakpoint`, `Stack`, `Row`
- Refactor `MainMenuScreen`, `SettingsScreen`, `PlaceholderScreen` to use primitives
- Component/smoke tests for theme + Button

### Out of Scope
- Game table layout (Phase 7)
- Illustrated Spanish deck (Phase 3+)
- `@expo/ui` native-only widgets
- Animations, haptics, sound (Phase 11)

## Capabilities

### New Capabilities
- `design-tokens`: full theme, typography with fonts, shadows, typed `Theme`
- `ui-primitives`: Screen, Button, Card, Pill, ScoreBadge
- `responsive-layout`: breakpoints, Stack/Row helpers

### Modified Capabilities
- `app-shell`: root layout loads fonts before rendering children

## Approach

1. Expand tokens + typed `Theme`; add shadow/elevation maps
2. `expo-font` + Google Fonts in `_layout.tsx`; gate on `SplashScreen`
3. Build primitives under `src/shared/ui/` — each with `*.styles.ts`
4. Add `src/shared/layout/` with breakpoint hook and flex helpers
5. Refactor menu/settings/placeholder screens; keep i18n keys
6. Apply in **2 slices** if diff exceeds 400 lines: (A) tokens + fonts + Screen/Button, (B) rest + refactors

| Area | Impact | Description |
|------|--------|-------------|
| `src/shared/theme/` | Modified | Full token set + font families |
| `src/shared/ui/` | New | 5 base components |
| `src/shared/layout/` | New | Breakpoint + Stack/Row |
| `src/app/_layout.tsx` | Modified | Font loading |
| `src/features/menu/` | Modified | Uses Button + Screen |
| `src/features/settings/` | Modified | Uses Button + Screen |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Font flash on web | Med | SplashScreen until fonts loaded |
| RN Web shadow mismatch | Med | Platform-specific shadow styles |
| Scope > 400 lines | High | Chained apply slices A/B |
| Refactor breaks navigation | Low | Existing smoke tests + manual route check |

## Rollback Plan

Revert commits; screens fall back to Phase 1 ad-hoc styles. Remove new `shared/ui` and `shared/layout` folders.

## Dependencies

- Phase 1 complete (`project-tooling`, `app-shell` specs)
- `@expo-google-fonts/libre-caslon-text`, `@expo-google-fonts/hanken-grotesk`, `expo-font`

## Success Criteria

- [ ] All colors/spacing from design tokens; no hardcoded hex in components
- [ ] Fonts render on web and native
- [ ] Five primitives exported and used by at least one screen each
- [ ] `yarn typecheck`, `yarn lint`, `yarn test`, `yarn web:export` pass
- [ ] Mobile/desktop breakpoint available for future table UI

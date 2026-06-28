# Proposal: App Screens

## Intent

Complete Phase 8 by replacing placeholder routes and wiring the MVP loop: main menu → setup → CPU match → result.

## Scope

### In Scope
- Setup, result, rules, ranking, settings, and about screens.
- 15/30 point setup; opponent fixed to CPU.
- Setup → game search params; result via AsyncStorage.
- Argentine Truco rules, 40-card ranking, language switcher, music/voice controls, about copy.

### Out of Scope
- Multiplayer, accounts, ranked mode, trainer features, flor, and desktop-specific redesign.
- Persisting in-progress matches.
- Final portfolio/demo link.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
- `app-shell`: replace Phase 8 placeholders with functional screens, settings controls, and user-facing app flow.
- `game-table-ui`: read match setup from route params and trigger result persistence/navigation on match completion.

## Approach

Use existing Expo Router routes; keep implementation in feature folders. `GameSetupScreen` pushes `/game?pointsToWin=...&opponentId=cpu`. `GameScreen` builds `CreateMatchOptions` from params, defaulting to 15/CPU. On match over, write a compact payload to `@truco/last-result` and route to `/result`; `ResultScreen` reads it with loading/empty states. Settings uses i18n plus local state/storage for music and voice controls. Static content composes existing UI primitives.

Alternatives: React context is type-safe but heavier; module singletons are fragile.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/app/*` | Modified | Routes/stack options. |
| `src/features/game/` | Modified | Setup, params, result handoff. |
| `src/features/result/` | Modified | Stored result. |
| `src/features/rules/` | Modified | Rules/ranking. |
| `src/features/settings/` | Modified | Locale/music/voice. |
| `src/features/about/` | Modified | Portfolio placeholder. |
| `src/shared/i18n/locales/*` | Modified | es/en copy. |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Result loading flash | Med | Show loading/empty states. |
| Back from `/game` loses match | Med | Accept for MVP. |
| Inaccurate rules copy | Med | Use Argentine rules; flor out. |
| Volume controls imply audio | Low | Label as settings-ready. |

## Rollback Plan

Revert change and implementation commits. Routes can return to `PlaceholderScreen`, `/game` can restore hardcoded `pointsToWin: 15`, and `@truco/last-result` can be ignored or removed.

## Dependencies

- Expo Router, AsyncStorage, i18n provider, UI primitives, and game engine.

## Success Criteria

- [ ] All Phase 8 routes render real content without placeholder screens.
- [ ] A user can choose 15 or 30 points, play CPU, and see a persisted result.
- [ ] Rules and ranking accurately describe Argentine Truco and the 40-card hierarchy.
- [ ] Settings can switch language and expose music/voice controls.
- [ ] Screens remain mobile-first, themed, and compatible with existing tests/typecheck.

# Proposal: Game Table UI

## Intent

Replace the placeholder game screen with a readable, mobile-first Truco table showing scores, turns, hands, played cards, enabled actions, and full event history without copying Stitch HTML/CSS.

## Scope

### In Scope
- Vertical layout: opponent top, table middle, action buttons, player hand bottom.
- Text cards: `7 Espada`, `1 Espada`, `12 Oro`, etc.
- Score, hand/round, turn indicator, played cards, opponent backs, player hand, and scrollable log.
- Render only enabled current-turn actions: calls, responses, and fold.
- Feature-level components/hooks under `src/features/game/`; domain rules stay in `src/domain/game/`.

### Out of Scope
- Multiplayer, accounts, ranked mode, persistence.
- Illustrated card art or copied Stitch markup/styles.
- Flor, advanced CPU strategy, animations, haptics, trainer explanations.
- Desktop-first redesign beyond responsive support.

## Capabilities

### New Capabilities
- `game-table-ui`: Playable table UI contract for zones, card display, enabled actions, turn state, and event log behavior.

### Modified Capabilities
- None

## Approach

`GameScreen.tsx` composes `ScoreHeader`, `OpponentZone`, `TableZone`, `ActionBar`, `PlayerHandZone`, `EventLog`, and shared card views. A hook maps pure domain state/functions (`createMatch`, `playCard`, calls, envido, `currentTurn`) to UI data and command handlers.

Stack choice: React Native/Expo Router styles plus existing theme/shared primitives. Alternative rejected: monolithic `GameScreen`, because it hides turn/action logic in presentation.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/features/game/GameScreen.tsx` | Modified | Replace placeholder with table composition. |
| `src/features/game/hooks/` | New/Modified | Add UI-state bridge and action gating. |
| `src/features/game/components/` | New | Add zones, card views, action bar, event log. |
| `src/shared/i18n/` | Modified | Add labels if missing; keep jargon Spanish. |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Action gating diverges from domain | Med | Derive actions from domain state; add focused tests. |
| Mobile log crowds cards | Med | Keep log in normal scroll flow; no table overlay. |
| Card text unreadable on small screens | Med | Responsive sizing and 44px touch targets. |

## Rollback Plan

Revert `src/features/game/` UI changes to `PlaceholderScreen` and remove related i18n labels. Domain logic remains untouched.

## Dependencies

- Existing domain game engine and shared UI/theme primitives.
- Backlog Phase 7 constraints and user decisions for this change.

## Success Criteria

- [ ] `/game` shows opponent, table, actions, player hand, score, turn indicator, and full scrollable log.
- [ ] Cards display as Spanish text labels and the player has exactly 3 dealt cards.
- [ ] Only valid current-turn actions render; unavailable actions are absent.
- [ ] Event log never covers cards or controls.
- [ ] Typecheck, lint, and relevant tests pass.

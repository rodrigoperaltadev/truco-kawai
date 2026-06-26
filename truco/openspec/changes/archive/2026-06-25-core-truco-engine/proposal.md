# Proposal: Core Truco Engine

## Intent

Create a pure, testable Argentine Truco engine that models match, hand, round, trick, turn order, card play, scoring, and match completion. This fills Phase 4’s domain gap so future UI, betting, envido, and CPU phases consume stable rules instead of duplicating game logic.

## Scope

### In Scope
- Add a functional core under `src/domain/game/` for `createMatch()`, match state, actions, trick/hand resolution, and score updates.
- Support 1v1 Argentine Truco hands with 3 cards per player, mano/pie turn order, and best-of-3 trick resolution.
- Accept match options in `createMatch({ pointsToWin })` with `pointsToWin: 15 | 30`.
- Model CPU separately through a future-facing `CPUPlayer` interface boundary, not an `isCPU` player flag.

### Out of Scope
- Truco/envido betting calls and stakes.
- `GameLog` / event chronicle, replay, undo, and trainer analytics; deferred to Phase 10.
- UI integration, animations, persistence, multiplayer, and CPU strategy implementation.

## Capabilities

### New Capabilities
- `core-truco-engine`: Match creation, legal card play, turn order, trick/hand winner resolution, scoring, and match completion for 1v1 Argentine Truco.

### Modified Capabilities
- None — `spanish-deck` is consumed as-is for cards, dealing, shuffling, and `trucoRank()`.

## Approach

Use a Functional Core / Imperative Shell approach: plain serializable TypeScript state plus pure transition functions. Alternative class/entity and event-sourced designs were rejected for MVP because they add boilerplate or replay infrastructure before product value. Keep domain logic isolated from React Native UI and side effects.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/domain/game/` | New | Engine types, match creation, actions, mano rules, resolution helpers, tests. |
| `src/domain/deck/` | Referenced | Imported by game engine; no requirement changes. |
| `src/features/truco/` | Future | Will consume engine state/actions later; no Phase 4 UI work. |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Mano/pie turn order bugs | Med | Isolate in `mano.ts` with focused unit tests. |
| Tie handling ambiguity | Med | Encode rule: closest to mano wins tied hand. |
| Overbuilding future phases | Med | Exclude betting, logs, CPU strategy, and UI. |

## Rollback Plan

Remove `src/domain/game/`, its tests, and the `core-truco-engine` change specs/tasks. Since `spanish-deck` is unchanged, rollback does not affect existing deck behavior.

## Dependencies

- Existing `spanish-deck` capability and pure deck helpers.
- Jest/TypeScript test baseline from project tooling.

## Success Criteria

- [ ] `createMatch({ pointsToWin: 15 | 30 })` initializes valid 1v1 match state.
- [ ] Legal card play advances turns and rejects invalid player/card actions.
- [ ] Trick, hand, and match winners resolve correctly, including mano tie-breakers.
- [ ] Domain tests pass without React Native/UI dependencies.

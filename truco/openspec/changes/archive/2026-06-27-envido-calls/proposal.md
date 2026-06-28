# Proposal: Envido Calls

## Intent

Implement Phase 6 envido rules in the pure game engine. Today, envido has no model, scoring, or pending-call behavior.

## Scope

### In Scope
- Model `envido`, `real_envido`, and `falta_envido` state.
- Calculate envido points from 3-card Spanish-deck hands.
- Accept/reject calls, award points, and reset per hand.
- Enforce round-1 timing before the caller plays their card.
- Resolve envido before truco when both are pending.
- Test scoring, tie-breaks, timing, and coexistence.

### Out of Scope
- Flor rules or flor/envido interaction.
- Multiplayer, UI actions, CPU envido strategy, or tutorial copy.
- Changing truco escalation semantics except interaction order.

## Capabilities

### New Capabilities
- `envido-calls`: Envido lifecycle, point calculation, scoring, timing, and pending-truco interaction.

### Modified Capabilities
- None — no existing `openspec/specs/` capabilities are present.

## Approach

Use parallel `EnvidoState` on `HandState`, reset by `dealHand`. Envido is point-comparison; `CallState` is truco escalation. Separation keeps rules testable and avoids overloading `acceptedLevel`.

Add pure `src/domain/game/envido.ts` helpers for validation, point calculation, acceptance, rejection, falta scoring, and mano tie-breaks. `playCard` blocks on either pending track. Truco rejection resolves pending envido first. Stack remains Expo + TypeScript strict + jest-expo. Rejected alternatives: unified `CallState` and shared `CallTrack`; both mix distinct scoring semantics.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/domain/game/types.ts` | Modified | Envido types/state/errors. |
| `src/domain/game/envido.ts` | New | Lifecycle and scoring rules. |
| `src/domain/game/calls.ts` | Modified | Envido-first resolution on truco rejection. |
| `src/domain/game/match.ts` | Modified | Initialize/reset envido state and score accepted/rejected envido. |
| `src/domain/game/play.ts` | Modified | Block card play while envido is pending. |
| `src/domain/game/*.test.ts` | Modified/New | Cover envido rules. |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Pending order creates score bugs | Med | Test coexistence and rejection order. |
| Falta scoring near target is wrong | Med | Test 15- and 30-point matches. |
| Timing regresses truco | Low | Keep envido guard separate. |

## Rollback Plan

Revert `envido.ts`, `HandState.envidoState`, and interaction checks. Truco remains isolated in `callState`, so rollback needs no migration.

## Dependencies

- Existing Spanish deck `Card`/`Suit` model.
- Confirmed rules: round 1 before caller card, mano wins ties, envido before truco, falta scores points needed to target.

## Success Criteria

- [ ] Envido levels can be called, accepted, rejected, and scored.
- [ ] Tie envido points award to mano.
- [ ] Falta envido awards only points needed to reach 15 or 30.
- [ ] Truco and envido can coexist in round 1, with envido resolving first.
- [ ] `yarn test` passes for new and existing game-domain tests.

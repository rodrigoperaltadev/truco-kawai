# Proposal: Truco Calls

## Intent

Add Argentine Truco call escalation (`truco`, `retruco`, `vale cuatro`) to the pure game engine. This closes the Phase 5 gap where tricks work but the defining betting flow does not.

## Scope

### In Scope
- Model call state, pending responses, accepted levels, rejection winners, and history.
- Enforce turn-bound call rules: calls only on the player's own turn; round 1 mano must call before playing.
- Apply scoring: accepted levels score 2/3/4; rejected escalation awards the previous active level to the escalator.
- Block card play while a call is pending.

### Out of Scope
- Envido calls.
- Flor calls (tracked as configurable future feature; default off for MVP).
- CPU call strategy or UI controls.
- Multiplayer/network synchronization.

### Tracked for Future Phases
- `MatchOptions.florEnabled?: boolean` — when true, enables `flor`/`contraflor` calls. Default `false` for MVP to align with the most common casual rule set.

## Capabilities

### New Capabilities
- `truco-calls`: Domain behavior for calling, accepting, rejecting, escalating, and scoring Truco wagers.

### Modified Capabilities
- `core-truco-engine`: Match state, turn validation, card play blocking, and hand scoring now account for call state.

## Approach

Use a separate pure `src/domain/game/calls.ts` module. This keeps call rules testable and preserves the domain-only architecture. Alternative considered: inline logic in `play.ts` is smaller initially but couples card play, scoring, and bidding, making future Envido/CPU work harder.

Integrate with `playCard` and `resolveMatch`: create/answer calls through explicit commands, block play during pending calls, reset per hand, and compute points from accepted/rejected level.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/domain/game/types.ts` | Modified | Add `CallType`, `CallState`, call commands/errors. |
| `src/domain/game/calls.ts` | New | Pure call validation, transitions, and point calculation. |
| `src/domain/game/play.ts` | Modified | Block play on pending calls; preserve turn rules. |
| `src/domain/game/match.ts` | Modified | Score hands using call points and reset per hand. |
| `src/domain/game/index.ts` | Modified | Export call API. |
| `__tests__/domain/game/` | Modified | Add call, escalation, rejection, and scoring tests. |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Wrong rejection points | Med | Test Truco, Retruco, Vale Cuatro rejection paths, including previous-level scoring. |
| Turn-state regression | Med | Cover call-before-card and card-passes-turn scenarios. |
| Call state leaks between hands | Low | Reset call state in match hand transition tests. |

## Rollback Plan

Remove `calls.ts`, `callState` fields, exports, and play/match integrations; restore fixed 1-point scoring and delete call tests/spec deltas.

## Dependencies

- Existing `core-truco-engine` and Jest domain tests.

## Success Criteria

- [ ] Calls are only accepted on the current player's turn.
- [ ] Pending calls block card play until answered.
- [ ] Round 1 mano cannot call after playing a card.
- [ ] Accepted Truco/Retruco/Vale Cuatro score 2/3/4.
- [ ] Rejected Retruco/Vale Cuatro award previous active level to the escalator.

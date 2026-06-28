# Design: Envido Calls

## Technical Approach

Envido is a pure call track (`src/domain/game/envido.ts`) parallel to `calls.ts`. It owns `EnvidoState` on `HandState`, reset by `dealHand`. Entry points take `MatchState` and return `Result<MatchState>` (same envelope as `playCard`). Unlike truco, envido scores **mid-hand without dealing a new hand** via `scoreEnvido` in `match.ts`, NOT `resolveMatch`.

The rewrite's pivot is **counter-calls (recantos)**: a responder facing a pending envido may raise instead of accept/reject. Raising **implicitly accepts** the pending level (points fold into `stake`), advances `acceptedLevel`, and sets a NEW `pendingEnvido` aimed back at the original caller. This lives **inside `callEnvido`** as a branch, replacing the old `ENVIDO_CALL_PENDING` hard-block. `playCard` and truco `rejectCall` are unchanged.

## Architecture Decisions

| Decision | Choice | Rationale |
|---|---|---|
| State shape | Separate `envidoState`, never unified with `callState` | Comparison vs escalation are distinct scoring; overloading `acceptedLevel` mixes them. Independent tests. |
| Counter-call | Implicit-accept-then-raise handled **inside `callEnvido`**, gated by `caller === currentTurn` | No separate `raiseEnvido` API; existing turn check already gates it to the responder. |
| `stake` | Single source of truth for accumulated **accepted** points | Counter-accept folds prior level; reject pays from it; accept adds to it. History stays record-only. |
| Recanto turn | After a raise, `currentTurn → original caller`; cold call → `opponent` | A raise hands the decision back. Two transfer rules, one per branch. |
| Same-level recanto | Equal level valid for `envido`/`real_envido`; `falta_envido` terminal | Real Truco allows "envido, envido" / "real envido, real envido". |
| Reject formula | non-falta `awarded = max(stake + 1, levelPoints(pending) − 1)` | Cold `real_envido` (stake=0) must pay **2**, not `stake+1=1`. The `max` covers cold higher calls (`lvl−1`) and accepted-base escalations (`stake+1`). Verified vs every spec table row. |
| Falta scoring | `faltaPoints(state, teamIdx)` = `max(1, pointsToWin − teamScore)` | Needs `MatchState`, so all envido fns take it, like `calls.ts`. |
| `calcEnvidoPoints` cap | Deck cap `7 + 6 + 20 = 33` | Faces and ranks 4/5 score 0; max pair is 7 + 6. |
| Truco-reject order | `rejectCall` resolves pending envido (rejection) **first**, threads state, then awards truco | Spec mandates envido-before-truco; truco reject only sequences them. |

## Data Flow (counter-call — the novel path)

```
A ──callEnvido("envido")──► pending{A:envido}, stake=0          turn→B
B ──callEnvido("real_envido")  COUNTER: accept envido(stake=2, accepted="envido"),
                               new pending{B:real_envido}        turn→A
A ──acceptEnvido─► winner = scoreEnvido(state, w, stake+3 = 5); resolved
   (or) A ──rejectEnvido─► B wins max(stake+1, lvl−1)=3; turn→A
```

Cold call mirrors this without the fold (`pending{A}` → `turn→B`, accept pays `stake+levelPoints`, play resumes). Tie → mano wins. Falta → `scoreEnvido(state, w, faltaPoints(...))`, may set `matchOver`.

## Types (`types.ts`) — already present, no change

`EnvidoLevel = "envido" | "real_envido" | "falta_envido"`; `PendingEnvido{caller, level, status:"pending"}`; `EnvidoState{pendingEnvido, acceptedLevel, stake, resolved, history}`. `HandState.envidoState` and the four `ENVIDO_*` `GameError` codes already declared. `stake` = accumulated **accepted** points (0 until first accept/counter-call).

## Module API (`envido.ts` — pure, deck-only imports)

```typescript
calcEnvidoPoints(cards): number;          // same-suit pair +20 else highest single; cap 33
envidoCardValue(rank): number;            // 1-3→rank, 4/5→0, 6/7→rank, 10/11/12→0
levelPoints(level): number;               // envido→2, real→3, falta→0
isEnvidoWindowOpen(state, caller): bool;  // round 1, caller not in trick, !resolved
isValidEnvidoLevel(accepted, next): bool; // includes equal-case recanto for envido/real
callEnvido(state, caller, level): Result; // cold call OR counter-call
acceptEnvido(state, responder): Result;
rejectEnvido(state, responder): Result;
```

`callEnvido` order: `MATCH_OVER → OUT_OF_TURN → CALL_PENDING (truco) → [counter-call | ENVIDO_WINDOW_CLOSED] → ENVIDO_INVALID_LEVEL`.
- **No pending**: check `isEnvidoWindowOpen` + `isValidEnvidoLevel(acceptedLevel, level)`; set pending; `turn → opponent`.
- **Pending + `caller === currentTurn`** (COUNTER-CALL): check `isValidEnvidoLevel(pendingLevel, level)`; `stake += levelPoints(pendingLevel)`; `acceptedLevel = pendingLevel`; new `pendingEnvido{caller, level}`; `turn → original caller`.

`acceptEnvido`/`rejectEnvido` require a pending envido and `responder === currentTurn`. Accept: higher pts wins (tie→mano); falta→`faltaPoints` else `stake + levelPoints(pending)`; `turn → caller`. Reject: caller wins `falta ? faltaPoints : max(stake + 1, levelPoints(pending) − 1)`; `turn → opponent`. Both `scoreEnvido` then set `resolved`.

## Integration Points

| File | Change |
|---|---|
| `envido.ts` | Replace `ENVIDO_CALL_PENDING` hard-block in `callEnvido` with counter-call branch. Extend `isValidEnvidoLevel` for equal `envido`/`real_envido`. Keep reject `max` formula. |
| `match.ts` | `emptyEnvidoState`, `dealHand` wiring, `scoreEnvido` (no new deal), `faltaPoints` — present, no change. |
| `calls.ts` | `makeCall` `ENVIDO_CALL_PENDING` guard + `rejectCall` envido-first — present, no change. |
| `play.ts` | `playCard` `ENVIDO_CALL_PENDING` guard — present, no change. |
| `index.ts` | API + types exported — no change. |
| `*.test.ts` | **New** — no game-domain tests exist. Add suites below; all literals use `emptyEnvidoState()`. |

## Testing Strategy

| Layer | What |
|---|---|
| `calcEnvidoPoints` | same-suit +20; faces→20; 4/5→20; 3-same-suit take-two=33; no-pair=7 |
| `callEnvido` cold | each error; skip-to-real/falta; turn→opponent |
| `callEnvido` counter | real-after-envido folds stake; recanto envido/real valid; falta-after-falta→`ENVIDO_INVALID_LEVEL`; turn→caller |
| `acceptEnvido` | higher wins; tie→mano; 2+3=5 & 2+2+3=7; falta accept; turn→caller |
| `rejectEnvido` | 1 initial; 2 cold real; 3 real-after-accept; 3 envido recanto; falta deficit; turn→opponent |
| `scoreEnvido`/`faltaPoints` | adds score, same `handNumber`; `matchOver` at target; 15/30 deficits |
| Integration | cold→accept→play resumes; counter chain→accept; envido+truco round 1; truco-reject resolves envido first (assert `resolved` + deltas) |

All crafted `MatchState`/`HandState` literals use `emptyEnvidoState()`. Points set via crafted same-suit cards; chains start from `createMatch`.

## Migration / Rollout

No data migration — pure in-memory engine. Only behavioral change: `callEnvido` goes from hard-block-when-pending to allow-counter-call-when-`currentTurn`-raises. Rollback = restore the hard-block and drop the equal-case in `isValidEnvidoLevel`; no state-shape change, serialized matches stay valid.

## Risks

| Risk | Mitigation |
|---|---|
| Counter-call turn desync | Integration asserts `currentTurn === originalCaller` after each recanto, `=== exResponder` after reject. |
| Reject off-by-one on cold higher calls | Keep `max(stake+1, lvl−1)`; unit-test all four table rows. |
| `scoreEnvido` vs `resolveMatch` (new-hand side effect) | Distinct names + "no deal" test asserting unchanged `handNumber`. |
| `stake` desync from `history` | `stake` is the only scoring source; test every accumulation path. |
| Truco-reject double-scores | Integration asserts `resolved=true` + exact per-team deltas before truco points. |

## Open Questions

- [x] Recanto returns `currentTurn` to the **original caller** (spec-confirmed).
- [x] Same-level recanto allowed for `envido`/`real_envido`, not `falta_envido`.
- [x] Cold `real_envido` reject pays **2**; reject uses `max(stake + 1, levelPoints − 1)`.
- [x] Faces (10/11/12) and ranks 4/5 score 0; max envido = `7 + 6 + 20 = 33`.

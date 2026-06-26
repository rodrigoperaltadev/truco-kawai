# Tasks: Core Truco Engine

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~1,400–1,800 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 → PR 2 → PR 3 |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Domain types + turn order + match creation | PR 1 | Base: `main`. types.ts, turn.ts, match.ts, match tests. Pure foundation, no cross-file deps beyond types. |
| 2 | playCard + trick/hand resolution | PR 2 | Base: PR 1 branch. play.ts, trick.ts, hand.ts + unit tests. Builds on Unit 1. |
| 3 | Index barrel + purity test + verify commands | PR 3 | Base: PR 2 branch. index.ts, purity.test.ts, final verification. |

## Phase 1: Domain Types (Unit 1)

- [x] 1.1 Create `src/domain/game/types.ts` — `Player`, `Team`, `MatchState`, `HandState`, `RoundState`, `TrickState`, `PlayedCard`, `PlayCardCmd`, `Result`, `PlayError` union, `CPUPlayer` interface. No `isCPU` anywhere.
- [x] 1.2 Create `src/domain/game/index.ts` — barrel re-export stub (filled after other modules exist).

## Phase 2: Turn Order + Match Creation (Unit 1)

- [x] 2.1 Create `src/domain/game/turn.ts` — `manoLeads(handNumber, players)`, `nextRoundLeader(previousTrick, mano)`, `currentTurn(hand)` derivations. Export for direct unit testing.
- [x] 2.2 Create `src/domain/game/match.ts` — `createMatch(options: { players, pointsToWin, rng? })` with `RangeError` on invalid `pointsToWin`, `TypeError` on duplicate player ids. Deal first hand, assign mano = players[0] for hand 1, dealer = players[1]. `resolveMatch()` for scoring + match-over transition.
- [x] 2.3 Create `__tests__/domain/game/match.test.ts` — valid init scenarios, RangeError/TypeError rejects, mano = players[0], 3 cards dealt, no-overlap, scoring +1, match ends at pointsToWin. Use seeded rng for determinism.

## Phase 3: playCard + Resolution (Unit 2)

- [x] 3.1 Create `src/domain/game/trick.ts` — `resolveTrick(trick: TrickState): TrickWinner` — compare `trucoRank`, lower wins, equal → `"tie"`.
- [x] 3.2 Create `src/domain/game/hand.ts` — `resolveHand(hand: HandState): HandWinner` — best-of-3 tally, mano tie-breaker per spec table, `"draw"` for all-tie edge case.
- [x] 3.3 Create `src/domain/game/play.ts` — `playCard(state, cmd): Result<MatchState>` — validate turn + card in hand + not-already-played + phase not matchOver; append card to trick; compose `resolveTrick` on trick complete; compose `resolveHand` on hand complete; call `resolveMatch` on hand complete.
- [x] 3.4 Create `__tests__/domain/game/trick.test.ts` — higher rank wins, equal rank ties, guards on incomplete trick.
- [x] 3.5 Create `__tests__/domain/game/hand.test.ts` — 2–0, 2–1 decisive; 1–1+tie → mano; 1–0+ties → leader with 1; all-ties → mano; all-tie `"draw"`.
- [x] 3.6 Create `__tests__/domain/game/play.test.ts` — valid play removes card + appends to cardsPlayed; card-not-in-hand rejected; already-played rejected; out-of-turn rejected; no-play-after-matchOver; turn advances correctly after each play.

## Phase 4: Index + Purity + Verification (Unit 3)

- [x] 4.1 Update `src/domain/game/index.ts` — full barrel export: `createMatch`, `playCard`, `resolveTrick`, `resolveHand`, `resolveMatch`, all types, `CPUPlayer`.
- [x] 4.2 Create `__tests__/domain/game/purity.test.ts` — static scan of all `src/domain/game/*.ts` source files; assert no import line matches `/react$|react-native|expo|@\/features|@\/shared/`; only `@/domain/deck` allowed.
- [x] 4.3 Run `yarn test` — all game domain tests pass.
- [x] 4.4 Run `yarn typecheck` — no errors in `src/domain/game/`.
- [x] 4.5 Run `yarn lint` — no errors in `src/domain/game/`.

## Phase 5: Integration Verification (Unit 3)

- [x] 5.1 Play a complete 15-point match — createMatch → series of playCard calls → verify `phase: "matchOver"` and `winner` set when a team reaches 15.
- [x] 5.2 Verify mano leads round 1, winner leads next round, tie restores mano.
- [x] 5.3 Verify hand winner resolves correctly per best-of-3 + mano tie-break.

---

### Implementation Order

1. **types.ts** — all interfaces/types; nothing depends on it yet.
2. **turn.ts** — pure mano/pie logic; depends only on types.
3. **match.ts** — `createMatch`; depends on types + turn + deck dealing; turn.ts is a peer, not a dep.
4. **trick.ts** — pure `resolveTrick`; depends only on types + deck ranking.
5. **hand.ts** — pure `resolveHand`; depends only on types.
6. **play.ts** — orchestrates everything; depends on all above.
7. **index.ts** — barrels all exports.
8. **Tests** per-phase alongside each module.

### Notes
- `createMatch` accepts optional `rng?: () => number` forwarded to `shuffle`; defaults to `Math.random`.
- `noUncheckedIndexedAccess` requires guards on array access — incomplete trick/hand is a programmer error (precondition), not a runtime error.
- `"draw"` from `resolveHand` is defensive; standard Truco always resolves via mano tie-break.

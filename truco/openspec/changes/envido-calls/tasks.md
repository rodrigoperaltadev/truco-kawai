# Tasks: Envido Calls

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~530 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 (Foundation) → PR 2 (Integration) → PR 3 (Tests) |
| Delivery strategy | ask-always |
| Chain strategy | stacked-to-main |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Types + pure envido module | PR 1 → main | types.ts additions + envido.ts; self-contained |
| 2 | Integration with match/calls/play | PR 2 → main | Hook envido into match, calls, play; no new logic |
| 3 | Full test suite | PR 3 → main | All envido scenarios + coexistence + falta |

---

## Phase 1: Types (`src/domain/game/types.ts`)

- [x] 1.1 Add `EnvidoLevel = "envido" | "real_envido" | "falta_envido"` type
- [x] 1.2 Add `EnvidoAction = "issued" | "accepted" | "rejected"` type
- [x] 1.3 Add `PendingEnvido = Readonly<{ caller: string; level: EnvidoLevel; status: "pending" }>` type
- [x] 1.4 Add `EnvidoHistoryEntry = Readonly<{ actor: string; level: EnvidoLevel; action: EnvidoAction; round: number }>` type
- [x] 1.5 Add `EnvidoState = Readonly<{ pendingEnvido: PendingEnvido | null; acceptedLevel: EnvidoLevel | null; stake: number; resolved: boolean; history: readonly EnvidoHistoryEntry[] }>` type
- [x] 1.6 Add `envidoState: EnvidoState` to `HandState`
- [x] 1.7 Extend `GameError` with `"ENVIDO_CALL_PENDING" | "ENVIDO_WINDOW_CLOSED" | "ENVIDO_ALREADY_RESOLVED" | "ENVIDO_INVALID_LEVEL"`

## Phase 2: Pure Envido Module (`src/domain/game/envido.ts` — new file)

- [x] 2.1 Implement `envidoCardValue(rank: Rank): number` — 1-3→rank, 4/5→0, 6/7→rank, 10/11/12→10
- [x] 2.2 Implement `calcEnvidoPoints(cards: readonly Card[]): number` — two same-suit bonus (+20), highest single otherwise, cap 33
- [x] 2.3 Implement `levelPoints(level: EnvidoLevel): number` — envido→2, real_envido→3, falta_envido→0 (falta uses faltaPoints)
- [x] 2.4 Implement `isEnvidoWindowOpen(state: MatchState, caller: string): boolean` — round 1, caller hasn't played in current trick, envidoState not resolved
- [x] 2.5 Implement `isValidEnvidoLevel(currentAccepted: EnvidoLevel | null, newLevel: EnvidoLevel): boolean` — escalation rules: null→{envido,real,falta}, envido→{real,falta}, real→falta
- [x] 2.6 Implement `callEnvido(state: MatchState, caller: string, level: EnvidoLevel): Result<MatchState>` with all validation guards and history append
- [x] 2.7 Implement `acceptEnvido(state: MatchState, responder: string): Result<MatchState>` — compare points, tie→mano, stake accumulation, scoreEnvido call
- [x] 2.8 Implement `rejectEnvido(state: MatchState, responder: string): Result<MatchState>` — caller wins rejection points, scoreEnvido call

## Phase 3: Match Integration (`src/domain/game/match.ts`)

- [x] 3.1 Add `emptyEnvidoState(): EnvidoState` — returns `{ pendingEnvido: null, acceptedLevel: null, stake: 0, resolved: false, history: [] }`
- [x] 3.2 Update `dealHand` to set `envidoState: emptyEnvidoState()` on returned `HandState`
- [x] 3.3 Add `faltaPoints(state: MatchState, winnerTeamIdx: number): number` — `max(1, pointsToWin - teamScore)`
- [x] 3.4 Add `scoreEnvido(state: MatchState, winnerId: string, points: number): MatchState` — adds points, sets `matchOver` if `≥ pointsToWin`, **does NOT deal new hand**, restores `currentTurn` to opponent

## Phase 4: Calls Integration (`src/domain/game/calls.ts`)

- [x] 4.1 Add `ENVIDO_CALL_PENDING` guard to `makeCall` — return error if `envidoState.pendingEnvido?.status === "pending"`
- [x] 4.2 Update `rejectCall` to check `envidoState.pendingEnvido` — if pending, call `rejectEnvido` first, thread resulting `MatchState`, then award truco rejection points

## Phase 5: Play Integration (`src/domain/game/play.ts`)

- [x] 5.1 Add envido pending guard in `playCard` after `CALL_PENDING` check: `if (state.hand.envidoState.pendingEnvido?.status === "pending") return { ok: false, error: "ENVIDO_CALL_PENDING" }`

## Phase 6: Exports (`src/domain/game/index.ts`)

- [x] 6.1 Export `EnvidoLevel`, `PendingEnvido`, `EnvidoHistoryEntry`, `EnvidoState` from `types`
- [x] 6.2 Export `calcEnvidoPoints`, `callEnvido`, `acceptEnvido`, `rejectEnvido` from `envido`

## Phase 7: Tests (`src/domain/game/envido.test.ts` — new file)

- [x] 7.1 `calcEnvidoPoints` — two same-suit (oro-1, oro-7, basto-3 → 28), faces=0→20, 4/5=0, no-suit highest (espada-7, copa-3, basto-1 → 7), all-diff with face (espada-12, copa-7, basto-3 → 10)
- [x] 7.2 `callEnvido` — valid call sets pending and transfers turn; skip-to-real_envido valid; round 2 blocked; caller already played blocked; truco pending blocked; already resolved blocked; duplicate level rejected
- [x] 7.3 `acceptEnvido` — higher points wins; tie→mano wins; accumulated points (envido+real → 5); falta accept
- [x] 7.4 `rejectEnvido` — initial envido = 1pt; real_envido cold = 2pt; real_envido after accept = 3pt; falta reject deficit
- [x] 7.5 `scoreEnvido` — adds score without dealing; `matchOver` at target; 15-pt and 30-pt falta deficits
- [x] 7.6 `faltaPoints` — 15-pt match at 12 wins 3; 30-pt match at 10 wins 20; rejection at 10 wins 5

## Phase 8: Integration Tests (`src/domain/game/envido-integration.test.ts` — new file)

- [x] 8.1 `callEnvido→accept→play resumes` — envido called, accepted, points awarded, play continues
- [x] 8.2 `callEnvido→reject→caller wins 1pt→play continues` — rejection resolves mid-hand
- [x] 8.3 `envido+truco coexist round 1` — envido pending, then truco called (only one track pending at a time — clarify per spec)
- [x] 8.4 `truco reject with envido unresolved` — envido resolved first (rejection scoring), then truco rejection points awarded; assert `envidoState.resolved === true` and correct team deltas
- [x] 8.5 `falta envido accept matchOver` — falta envido accepted when winner would reach 15, assert `phase === "matchOver"`
- [x] 8.6 `dealHand resets envidoState` — envido resolved in hand N, next hand has empty envidoState

## Phase 9: Test Fixture / Migration Helper

- [x] 9.1 Create shared `emptyEnvidoState()` test helper exported from a `__tests__/helpers.ts` (or inline in test files) for future HandState fixture construction

---

## Implementation Order

1. **PR 1 — Types + envido.ts**: Phases 1–2. New file `envido.ts` is fully isolated; types are additive. Zero risk to existing logic.
2. **PR 2 — Integration**: Phases 3–6. `match.ts`, `calls.ts`, `play.ts`, `index.ts`. Changes are local and mechanical.
3. **PR 3 — Tests**: Phases 7–9. Full coverage, including coexistence scenarios.

## Notes

- `envido.ts` imports only `@/domain/deck` and `types.ts` — must stay UI-free.
- `scoreEnvido` must NOT call `dealHand` — unlike `resolveMatch` which always advances to next hand, envido resolves mid-hand.
- Truco/envido "only one pending at a time" means a player can't call envido while truco is pending and vice versa; the design clarifies both tracks may be *active* (resolved vs pending) simultaneously but only one can be in `pending` status.
- Falta scoring uses winner's team deficit from `pointsToWin` — not a fixed table.

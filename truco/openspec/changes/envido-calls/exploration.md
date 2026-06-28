# Exploration: envido-calls

## Current State

Truco calls (`truco`, `retruco`, `vale_cuatro`) are fully implemented in `src/domain/game/calls.ts`. The `CallState` model handles pending calls, accepted levels, and history — all per-hand, reset via `emptyCallState()` on new hand. `play.ts` blocks card play while a call is pending.

No envido logic exists anywhere in the codebase. Only a `jargon.envido` i18n string and a placeholder screen reference exist.

---

## Affected Areas

- `src/domain/game/types.ts` — `CallType`, `CallState`, `CallHistoryEntry`, and related types must be extended or a parallel `EnvidoState` introduced
- `src/domain/game/calls.ts` — existing `makeCall`, `acceptCall`, `rejectCall` operate exclusively on `CallType`; new envido-specific functions needed
- `src/domain/game/match.ts` — `emptyCallState()` and `dealHand()` reset call state per hand; envido state must be similarly scoped
- `src/domain/game/play.ts` — `playCard` blocks on `pendingCall?.status === "pending"`; envido calls must also block card play
- `src/domain/game/hand.ts` — `resolveHand` not affected but may need hooks for envido resolution timing
- `src/domain/deck/types.ts` — `Suit` and `Card` types are the foundation for envido point calculation
- `src/domain/deck/ranking.ts` — separate from truco ranking; envido scoring has its own rules

---

## Envido Rules Reference (Argentine Truco)

### Call Hierarchy

| Call | Spanish | Points if accepted |
|------|---------|-------------------:|
| Envido | "envido" | 2 |
| Real Envido | "real_envido" | 3 |
| Falta Envido | "falta_envido" | 1–30 (match-winning) |

Escalation order: no call → envido → real_envido → falta_envido.
A player MAY skip directly to real envido (equivalent to calling envido and being ignored, then calling real). Falta envido can be called directly after envido or real envido.

### Point Calculation

Two cards of the **same suit** form an envido. Points = sum of card values, with face cards (10, 11, 12) worth 10 each. The 4 and 5 have no envido value.

| Card rank | Envido value |
|-----------|-------------|
| 1 (Ancho) | 1 |
| 2 | 2 |
| 3 | 3 |
| 4 | — (no envido) |
| 5 | — (no envido) |
| 6 | 6 |
| 7 | 7 |
| 10, 11, 12 | 10 |

**Examples:**
- `oro-1` + `oro-7` = 1 + 7 + 10 (envido bonus) = **18**
- `espada-3` + `espada-6` = 3 + 6 + 10 = **19**
- `basto-10` + `basto-12` = 10 + 10 + 10 = **30** (max)

**No envido**: no two cards share a suit → the player has 0 envido points. This is a valid state — the player can still be forced to answer if the opponent calls.

**Special case — single envido card**: In Argentine Truco, some variants treat a single card as having envido points equal to its rank (with 10/11/12 = 10). Confirm with product before implementing. Most standard rules require **two cards of the same suit**.

**Envido bonus**: +10 is added when counting two cards of the same suit. This is NOT a separate call — it's included in the sum automatically.

### Call Timing

- Envido calls happen **at the start of a hand**, before any card is played in round 1
- The player with **mano** (first to play in round 1) speaks first
- Envido can be called **before** playing the first card, or **after** the opponent has played their first card (same round)
- **After a card is played in a trick**, the envido window for that player is closed (same rule as truco)
- Envido **cannot** be called after both players have played in round 1
- Envido can **only** be called in round 1 — once round 2 begins, the envido window is closed
- A player who already played their card CANNOT call envido in that same trick

### Interaction with Truco Calls

Truco and envido are **independent call tracks**. Both can be active simultaneously in the same hand:
1. A player calls **envido**
2. Opponent responds (accepts/rejects/ignores)
3. While envido is pending, **truco** can also be called (or vice versa)
4. If any call is rejected, points go to the caller's team

**Important**: In Argentine Truco, envido is resolved before truco if both are pending. Some variants resolve in order of declaration. The current `truco-calls` spec resolves `rejected` by awarding points based on `acceptedLevel` — envido rejection must follow the same pattern but award envido points.

### Scoring on Rejection

| Call rejected | Points to caller |
|---------------|-----------------|
| envido (no prior) | 2 |
| real_envido (envido not accepted) | 3 |
| falta_envido | 1 (if tied at 0), or difference to win (max 30) |

On acceptance: both players reveal envido points; higher total wins the envido points.

### Edge Cases

- **No envido (no two same-suit cards)**: Player has 0. If called, they lose the envido exchange.
- **Both players have 0 envido**: The caller still wins (opponent has nothing to match).
- **Tie in envido points**: The player who **called** envido loses (caller always loses on tie — some variants use mano tiebreak, confirm).
- **Envido after truco**: The `truco-calls` spec does not block envido after truco is accepted. Both can coexist. However, envido must still be called in round 1.
- **Flor (out of scope)**: Three cards of the same suit. If implemented later, envido and flor interact (flor beats envido, must be answered). Keep `florEnabled` flag in `CreateMatchOptions` for future use.

---

## Design Options

### Option A: Unified `CallState` (extend existing)

Merge envido into the existing `CallState` by expanding `CallType` to include `"envido" | "real_envido" | "falta_envido"`. Add an `EnvidoResult` field to `CallState` for resolved envido points.

**Pros:** Single state object, leverage existing `makeCall`/`acceptCall`/`rejectCall` patterns, minimal new types.
**Cons:** Mixing two conceptually different call tracks (truco escalation vs. envido scoring). `acceptedLevel` semantics differ: truco's acceptedLevel locks in the points base, while envido's acceptedLevel is just a marker. `nextLevel` logic becomes more complex.

**Effort:** Medium

### Option B: Parallel `EnvidoState` on `HandState`

Add a new top-level field `envidoState: EnvidoState | null` alongside `callState`. Create a new `envido.ts` module with separate functions: `callEnvido`, `acceptEnvido`, `rejectEnvido`, `resolveEnvidoPoints`.

**Pros:** Clean separation of concerns. Truco calls and envido are architecturally distinct (one is escalation, one is a value comparison). Easier to test envido in isolation. Follows existing pattern where each domain concern has its own module.
**Cons:** Two independent call states to manage. Need to handle interactions (both pending simultaneously).

**Effort:** Medium-High

### Option C: Separate `CallTrack` union on `HandState`

Introduce a `CallTrack = "truco" | "envido"` label and a single `pendingCall: PendingCall | null` that can carry either track. The `PendingCall` type carries a `track` field. Both tracks share the same pending/accept/reject machinery but resolve differently.

**Pros:** Unified handling of "something is pending, block card play". Shares history and turn-transfer logic. More flexible if more call types appear.
**Cons:** More complex type branching in resolution logic. Envido resolution is fundamentally different (point comparison vs. escalation), so sharing `acceptCall`/`rejectCall` may not work cleanly.

**Effort:** High

---

## Recommendation

**Option B (Parallel `EnvidoState`)** is the recommended approach.

Rationale:
- Envido is semantically distinct from truco escalation — it is a **point-comparison** call, not an escalation. Mixing them obscures the domain model.
- The existing `callState` in `HandState` is tightly scoped to truco semantics (`CallType` hierarchy, `acceptedLevel` as points base). Envido needs its own `envidoState` with `pendingEnvido: PendingEnvido | null`, `acceptedEnvido: EnvidoLevel | null`, and resolved point fields.
- A separate `envido.ts` module follows the existing pattern (`calls.ts`, `trick.ts`, `hand.ts`) and keeps envido logic independently testable.
- Interaction handling (both tracks pending) can be resolved in `play.ts` by checking both `callState.pendingCall` and `envidoState.pendingEnvido` before allowing card play.

### Key Architecture Decisions

1. `EnvidoState` lives alongside `callState` in `HandState` — both reset per hand via `dealHand`.
2. Envido calls are blocked by the same `CALL_PENDING` guard in `playCard` (check both tracks).
3. When envido is accepted, both players' point totals must be computed and compared. The resolution happens immediately on accept (not deferred to hand end).
4. On envido rejection, points are awarded using `callPoints`-style logic but for envido levels.
5. Envido timing is enforced by checking `hand.rounds.length === 1 && currentRound.trick.cardsPlayed.length < 2` — envido can only be called in round 1 before the second card is played.

---

## Risks

- **Timing complexity**: Envido can be called before or after the opponent plays their first card, which means the call window depends on trick state. The current `hasCallerPlayedInCurrentTrick` guard works for truco but envido has a stricter window (round 1 only). A separate guard function `canCallEnvido(state, playerId)` is needed.
- **Flor interference**: If `florEnabled` is true in the future, envido and flor interact. The current `florEnabled` flag in `CreateMatchOptions` should be extended to also gate envido (for leagues that don't use envido), but this is out of scope for now.
- **Tie-breaking rule**: Argentine Truco rules vary on envido tie-breaking (some use mano, some use caller-loses). This must be confirmed with product before spec.
- **Dual-pending state**: When both truco and envido are pending simultaneously, the resolution order matters. Standard Argentine rules resolve envido first. This interaction needs explicit handling in `rejectCall` and `resolveMatch`.
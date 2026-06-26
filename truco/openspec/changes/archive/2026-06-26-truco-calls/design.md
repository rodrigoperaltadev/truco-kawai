# Design: Truco Calls

## Technical Approach

Add Truco call escalation as a separate pure module `src/domain/game/calls.ts` (Approach A from exploration). `calls.ts` owns call validation, state transitions, and point math; it returns the same `Result<MatchState>` envelope as `playCard`. `playCard` gains one early guard (`CALL_PENDING`); `resolveMatch` is extended to derive points from `callState` and accept a rejection override. `callState` lives in `HandState` (per spec) and is initialized by `dealHand`, so it resets automatically on every new hand. This preserves domain purity (deck-only imports) and keeps card play, scoring, and bidding independently testable.

## Architecture Decisions

### Decision: `calls.ts` returns `Result<MatchState>`, not raw mutations

**Choice**: `makeCall`/`acceptCall`/`rejectCall` take `MatchState` and return `Result<MatchState>` — same envelope `playCard` already uses.
**Alternatives considered**: Operate on `CallState` alone; throw on invalid call; return a tagged union distinct from `playCard`.
**Rationale**: Call commands mutate `currentTurn` (turn transfer) and, on reject, `teams`/`phase` via `resolveMatch` — these are `MatchState` concerns, not `CallState`-local. Reusing `Result<MatchState>` gives callers one uniform success/error shape and one error channel.

### Decision: `callState` lives in `HandState`, not `MatchState`

**Choice**: Add `callState: CallState` to `HandState`.
**Alternatives considered**: Top-level `MatchState.callState`.
**Rationale**: The spec mandates it. Per-hand lifecycle (reset every deal) maps cleanly to `HandState`, and `dealHand` becomes the single init/reset point — no separate reset logic in `resolveMatch`.

### Decision: Extend `PlayError` into a shared `GameError`, keep one `Result<T>`

**Choice**: Rename the union to `GameError` (superset of `PlayError`) covering call errors; keep `Result<T>` as-is. Re-export `PlayError = GameError` alias for back-compat.
**Alternatives considered**: A separate `CallError` union + separate `CallResult`.
**Rationale**: One error type and one `Result` keep the surface minimal and avoid two parallel result shapes the UI shell must branch on. Aliasing avoids breaking the existing `PlayError` export.

### Decision: `resolveMatch` gains an optional `points` arg (default derived from `callState`)

**Choice**: `resolveMatch(state, handWinnerId, pointsOverride?)`. When `pointsOverride` is undefined, points come from `callPoints(callState.acceptedLevel)` (null → 1). When defined (rejection), use it verbatim.
**Alternatives considered**: A separate `resolveRejection` function; a `points` field threaded through state.
**Rationale**: Single scoring path keeps the "exactly one place adds score" invariant. Default-from-`callState` covers normal hand wins; override covers the only exception (rejection awards previous level). Two args + one optional stays within the 2-required-arg hygiene rule (override is optional config).

### Decision: Call window enforced via the active trick's `cardsPlayed`

**Choice**: A player's call window is open only if they have NOT yet played in the current (unresolved) trick. `CALL_WINDOW_CLOSED` otherwise.
**Alternatives considered**: A separate `hasPlayedThisTrick` flag on state.
**Rationale**: The data already exists in `rounds[last].trick.cardsPlayed`. No new state field; derive the predicate. Matches the confirmed rule variant (call before your own card, opponent may call before theirs).

## Data Flow

Normal escalation (no reject), turns shown as `currentTurn`:

```
A's turn ──makeCall(truco)──► pending{caller:A}      currentTurn → B
   │                                                       │
   │   playCard BLOCKED (CALL_PENDING) for both            │
   ▼                                                       ▼
B's turn ──acceptCall──► accepted, acceptedLevel=truco  currentTurn → A
   │
A's turn ──playCard──► normal trick flow ... ──► resolveMatch(winner, undefined)
                                                  points = callPoints(acceptedLevel)
```

Rejection (hand ends immediately):

```
A pending{retruco}  currentTurn → B
   │
B's turn ──rejectCall──► resolveMatch(callerTeamPlayer=A, override=callPoints(prevLevel))
                          prevLevel = acceptedLevel before this call (truco → 2 pts)
                          phase scoring applied, next hand dealt (callState reset)
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/domain/game/types.ts` | Modify | Add `CallType`, `CallStatus`, `CallAction`, `PendingCall`, `CallHistoryEntry`, `CallState`; add `callState` to `HandState`; add `florEnabled?` to `CreateMatchOptions`; extend error union to `GameError` (alias `PlayError`) with `CALL_PENDING`, `OUT_OF_TURN`, `INVALID_CALL_LEVEL`, `CALL_ALREADY_PENDING`, `CALL_WINDOW_CLOSED`, `MATCH_OVER`. |
| `src/domain/game/calls.ts` | Create | Pure `makeCall`, `acceptCall`, `rejectCall`, `callPoints`, `nextLevel`, internal validators + history append. |
| `src/domain/game/match.ts` | Modify | `dealHand` initializes `callState`; `resolveMatch` derives points from `callState` and accepts `pointsOverride`. |
| `src/domain/game/play.ts` | Modify | Insert `CALL_PENDING` guard right after `MATCH_OVER`; update validation-order doc comment. |
| `src/domain/game/index.ts` | Modify | Export call API + new types (`CallType`, `CallState`, `PendingCall`, `CallHistoryEntry`, `CallAction`, `GameError`). |
| `__tests__/domain/game/calls.test.ts` | Create | Call/escalate/reject/scoring/history/reset scenarios. |
| `__tests__/domain/game/play.test.ts` | Modify | Add `CALL_PENDING` block + resume cases; add `callState` to `HandState` literals. |
| `__tests__/domain/game/match.test.ts` | Modify | Add escalated-scoring + reset cases; add `callState` to literals. |

## Interfaces / Contracts

```typescript
// types.ts additions
export type CallType = "truco" | "retruco" | "vale_cuatro";
export type CallStatus = "pending" | "accepted" | "rejected";
export type CallAction = "issued" | "accepted" | "rejected";

export type PendingCall = Readonly<{
  caller: string;        // player id
  level: CallType;
  status: CallStatus;
}>;

export type CallHistoryEntry = Readonly<{
  caller: string;        // actor for this action (caller on issue, responder on accept/reject)
  level: CallType;
  action: CallAction;
  resolvedAt: number;    // round number when the action occurred
}>;

export type CallState = Readonly<{
  pendingCall: PendingCall | null;
  acceptedLevel: CallType | null;
  history: readonly CallHistoryEntry[];
}>;

// HandState gains:  callState: CallState
// CreateMatchOptions gains:  florEnabled?: boolean
// Error union becomes GameError (PlayError aliases it):
export type GameError =
  | "MATCH_OVER" | "CALL_PENDING" | "OUT_OF_TURN"
  | "CARD_NOT_IN_HAND" | "CARD_ALREADY_PLAYED"
  | "INVALID_CALL_LEVEL" | "CALL_ALREADY_PENDING" | "CALL_WINDOW_CLOSED";
export type PlayError = GameError;
```

```typescript
// calls.ts API
export function makeCall(state: MatchState, caller: string, level: CallType): Result<MatchState>;
export function acceptCall(state: MatchState, responder: string): Result<MatchState>;
export function rejectCall(state: MatchState, responder: string): Result<MatchState>;
export function callPoints(level: CallType | null): number; // null→1, truco→2, retruco→3, vale_cuatro→4
export function nextLevel(level: CallType | null): CallType | null; // null→truco→retruco→vale_cuatro→null
```

**`makeCall` validation order**: `MATCH_OVER → OUT_OF_TURN (caller ≠ currentTurn) → CALL_ALREADY_PENDING → CALL_WINDOW_CLOSED (caller already in current trick) → INVALID_CALL_LEVEL (level ≠ nextLevel(acceptedLevel))`. On success: set `pendingCall{caller, level, "pending"}`, append `{action:"issued"}`, transfer `currentTurn` to opponent.

**`acceptCall`**: requires `responder === currentTurn` and a pending call → `status:"accepted"`, `acceptedLevel = level`, append `{action:"accepted"}`, `currentTurn` back to caller.

**`rejectCall`**: requires `responder === currentTurn` and a pending call → append `{action:"rejected"}`, compute `override = callPoints(acceptedLevelBeforeThisCall)`, call `resolveMatch(state, callerPlayerId, override)`. (Caller's *player id* maps to their team inside `resolveMatch`.) `acceptedLevelBeforeThisCall` is the `acceptedLevel` recorded *before* the rejected pending call — for a rejected `truco` it is `null` → 1 pt.

**`playCard` guard** (new order): `MATCH_OVER → CALL_PENDING → OUT_OF_TURN → CARD_NOT_IN_HAND → CARD_ALREADY_PLAYED`.

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit (`calls.ts`) | `callPoints`/`nextLevel` mapping; level-skip → `INVALID_CALL_LEVEL`; off-turn → `OUT_OF_TURN`; double-call → `CALL_ALREADY_PENDING`; call-after-own-card → `CALL_WINDOW_CLOSED`; turn transfer on issue/accept; history entries per action; reject point math for all three levels incl. previous-level award | Hand-built `MatchState` fixtures with explicit `callState`, deterministic cards (reuse `play.test.ts` fixture pattern) |
| Unit (`play.ts`) | `CALL_PENDING` blocks all plays; play resumes after accept; play absent after reject (hand transitioned) | Set `pendingCall.status="pending"` then assert error; accept then assert normal advance |
| Unit (`match.ts`) | `resolveMatch` scores 2/3/4 by `acceptedLevel`; 1 pt when null; override path; `dealHand` resets `callState`; match-over at threshold with escalated points (13 + retruco 3 ≥ 15) | Direct `resolveMatch`/`dealHand` calls |
| Integration | Full `truco→accept→retruco→reject` sequence end-to-end; history length 4; correct team scored | Chain real commands from `createMatch`, deterministic `rng` |
| Purity | `calls.ts` imports deck-only | Existing `purity.test.ts` auto-scans new file — no change needed |
| Flor flag | `florEnabled` default off rejects `flor`; flag true changes nothing | `createMatch` + `makeCall` with unsupported level |

## Migration / Rollout

No data migration. **Breaking type change**: every test/fixture that constructs a `HandState` literal must add `callState: { pendingCall: null, acceptedLevel: null, history: [] }`. Affected: `play.test.ts`, `match.test.ts`, `integration.test.ts`, and any helper building `HandState`. Add a shared `emptyCallState()` test helper to minimize churn. `dealHand` covers all runtime construction paths, so production code needs the field set in exactly one place.

## Open Questions

- [ ] `CallHistoryEntry.caller` is overloaded as "actor of this action" (responder on accept/reject). Spec scenarios confirm this (accept entry records responder's id). Confirm the field name `caller` is acceptable vs. renaming to `actor` — kept as `caller` to match spec wording, but `actor` reads truer.
- [ ] `rejectCall` needs the caller's **player id** to pass to `resolveMatch`; it reads it from `pendingCall.caller`. Confirmed available — no extra plumbing.

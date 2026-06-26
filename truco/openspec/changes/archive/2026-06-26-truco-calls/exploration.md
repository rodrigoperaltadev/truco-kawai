# Exploration: Truco Calls (Phase 5)

## Executive Summary

Truco calls are a bidirectional escalation mechanism layered on top of the existing trick-taking flow. The engine currently has **no call state** — a `MatchState` has no concept of `truco`, `retruco`, or `vale cuatro`. Adding calls requires:

1. A new `CallState` / `CallType` domain model
2. A new `CallAction` command discriminated union (`call`, `accept`, `reject`)
3. A `callState` field in `MatchState` tracking `pendingCall` and `callHistory`
4. Integration into `playCard` to block normal play while a call is pending
5. Points escalation (1 → 2 → 3 → 4) applied when the hand resolves

**Recommended approach**: New `src/domain/game/calls.ts` module (pure domain, no UI imports), integrated into `playCard` and `resolveHand` flow.

---

## Current State

### MatchState shape (types.ts)

```typescript
type MatchState = Readonly<{
  phase: MatchPhase;          // "playing" | "matchOver"
  pointsToWin: PointsToWin;   // 15 | 30
  players: readonly [Player, Player];
  teams: readonly [Team, Team];
  hand: HandState;
  currentTurn: string;        // player id
  winner: string | null;
}>;
```

### HandState → RoundState → TrickState (current nesting)

```
MatchState
└── hand: HandState
    ├── handNumber: number
    ├── dealer: string
    ├── mano: string
    ├── players: [PlayerHand, PlayerHand]
    └── rounds: readonly RoundState[]
        └── roundNumber, trick: TrickState
            ├── cardsPlayed: readonly PlayedCard[]
            ├── winner: TrickWinner | null
            └── resolved: boolean
```

**No call state exists anywhere in this tree.**

### playCard flow (play.ts)

Validation order: `MATCH_OVER → OUT_OF_TURN → CARD_NOT_IN_HAND → CARD_ALREADY_PLAYED`

Current turn is advanced after each card. When 2 cards are played → `resolveTrick` → check `isHandDecided` → `resolveHand` → `resolveMatch` (score + possible new hand).

---

## Affected Areas

- `src/domain/game/types.ts` — Add `CallType`, `CallStatus`, `CallState`, `PendingCall`, `CallAction` types
- `src/domain/game/play.ts` — Add call validation before normal turn check; block play while call is pending; apply escalated points on hand resolution
- `src/domain/game/match.ts` — `resolveMatch` needs `callState` to compute points
- `src/domain/game/hand.ts` — May need to know if a call is active to compute hand winner
- `src/domain/game/index.ts` — Re-export new call functions
- `__tests__/domain/game/` — New test suite for call scenarios

---

## Truco Call Rules (Argentine Truco)

### Call Levels

| Call | Trigger condition | Points if accepted | Points if rejected |
|------|-------------------|--------------------|--------------------|
| **Truco** | Any player, any time (before/during round) | 2 | Caller gets 1 |
| **Retruco** | Only after Truco is pending/active | 3 | Caller gets 1 |
| **Vale Cuatro** | Only after Retruco is pending/active | 4 | Caller gets 1 |

### Call Flow

1. Player A calls `truco` → `callState.pendingCall = { caller: A, level: TRUCO, status: PENDING }`
2. Turn passes to Player B. `playCard` is BLOCKED — only `accept` or `reject` is valid.
3. Player B accepts → `pendingCall.status = ACCEPTED`, level stays TRUCO. Turn returns to Player A (who just called).
4. OR: Player B rejects → `pendingCall.status = REJECTED`. Hand ends immediately. Caller's team gets 1 point. `resolveMatch` called.

### Escalation flow

```
[no call] 
  → Player A calls TRUCO → pending (B must respond)
  → B accepts TRUCO → active (both bound)
  → Player B calls RETRUCO → pending (A must respond)
  → A accepts RETRUCO → active (bound to 3 pts)
  → Player A calls VALE CUATRO → pending (B must respond)
  → B accepts VALE CUATRO → active (bound to 4 pts)
```

Either player can call at any time when it's their turn and no call is pending.

### Points calculation

```
if (pendingCall?.status === "REJECTED"):
  callerTeam gets 1 point → resolveMatch(callerTeam)
elif (hand winner determined):
  winningTeam gets escalated_points(pendingCall?.level) → resolveMatch(winningTeam)
else:
  normal flow continues
```

### Call availability rules

| Condition | Can call Truco? | Can call Retruco? | Can call Vale Cuatro? |
|-----------|-----------------|-------------------|----------------------|
| No active/pending call | ✓ (own turn) | ✗ | ✗ |
| Truco active | ✗ | ✓ (own turn) | ✗ |
| Retruco active | ✗ | ✗ | ✓ (own turn) |
| Vale Cuatro active | ✗ | ✗ | ✗ |
| Call pending | ✗ | ✗ | ✗ |
| Phase = matchOver | ✗ | ✗ | ✗ |

---

## Approaches

### Approach A: Separate `calls.ts` module

Create `src/domain/game/calls.ts` with:
- `CallType = "truco" | "retruco" | "vale_cuatro"`
- `CallStatus = "pending" | "accepted" | "rejected"`
- `PendingCall = { caller: string; level: CallType; status: CallStatus }`
- `CallHistoryEntry = { ...PendingCall, timestamp: number }`
- `makeCall(state, caller, level)` — validates and creates pending call
- `acceptCall(state)` — accepts pending call
- `rejectCall(state)` — rejects pending call
- `callPoints(level)` — returns 1/2/3/4

Integrate into `play.ts`:
- `playCard` first checks `state.callState?.pendingCall` — if pending and player is responder, return error
- After trick resolves in `playCard`, check call status → apply escalated points or resolve immediately on reject
- Pass `callState` to `resolveMatch`

**Pros**: Clean separation of concerns; call logic is independently testable; domain purity preserved.

**Cons**: Need to thread `callState` through `playCard` and `resolveMatch`; more state fields to manage.

**Effort**: Medium

---

### Approach B: Inline into existing `play.ts` / `match.ts`

Add call types to `types.ts`, add call-handling branches directly inside `playCard` and `resolveMatch`. No new module file.

**Pros**: Fewer files; smaller diff.

**Cons**: `play.ts` is already handling turn validation + card play + trick resolution + hand resolution. Adding call logic here violates Single Responsibility. Harder to test call scenarios in isolation. Violates domain purity principle if mixed with UI concerns later.

**Effort**: Low initially, but technical debt.

**Effort**: Low (initial) / High (maintenance)

---

### Approach C: Hybrid — CallState in types, call logic in calls.ts, integration in play.ts

Same as Approach A, but `callPoints` and `escalateCall` live in `calls.ts`, and `playCard` calls `calls.applyCallResult()` as a pure function at each resolution point.

**Pros**: Same as A but explicit about the integration contract.

**Cons**: Same as A.

**Effort**: Medium

---

## Recommendation

**Approach A (separate `calls.ts` module)** is the correct design.

The call escalation chain is complex enough to warrant its own module with clear input/output. The engine must remain testable in isolation from UI. Threading `callState` through `playCard` and `resolveMatch` is straightforward — the `MatchState` already carries `hand` and `currentTurn`, adding `callState` is the same pattern.

The key integration points are:
1. `playCard` — early return if `pendingCall` exists and player is not the responder
2. `playCard` — after trick resolves, check `pendingCall.status`:
   - `"rejected"` → call `resolveMatch` with caller as winner immediately
   - `"accepted"` → record escalated points, continue normal flow
3. `resolveMatch` — accept `callState` param to compute correct points

---

## Risks

1. **State explosion**: Adding `callState` to `MatchState` means every reducer/wrapper that creates `MatchState` (e.g., `createMatch`, `dealHand`, `resolveMatch`) needs to propagate it correctly. Immutable updates make this manageable but error-prone without tests.
2. **Turn order during pending call**: After a call, `currentTurn` points to the *responder*. `playCard` must block the caller from playing while waiting. This is a new validation branch — must be tested explicitly.
3. **Point escalation leaks across hands**: If a call is active and the hand ends normally, the escalated points must apply. If no call was ever made, normal 1-point scoring applies. These two paths must not cross.
4. **No call after hand over**: Once `isHandDecided` returns true, calls should no longer be processed — the hand is over. Need to verify `playCard` handles this correctly.
5. **CPU interface compatibility**: The `CPUPlayer.chooseCard` interface currently takes `MatchState`. If `callState` is added, CPU implementations receive it but don't need to act on it — this is fine since CPU logic is external. However, the CPU strategy skill (Phase 9) will need to call `acceptCall`/`rejectCall` as well.

---

## Open Questions for User

1. **Call timing**: Can a player call Truco *after* playing their card in a round (i.e., after seeing what they played)? Or must calls happen *before* playing? Argentine Truco rules vary by region — some allow "truco" after playing, some require it before. **Which rule variant does Truco Lab implement?**

2. **Who can call after first card**: In many variants, once the first card of a round is played, the *next* player can call Truco (before playing). Can the player who just played also call? **Can the leader of a round call after playing their card?**

3. **Multiple calls in same round**: If Team A calls Truco, Team B accepts, then Team B calls Retruco — can Team A reject the Retruco and still get 1 point for the Truco? Or does rejecting Retruco only forfeit the Retruco escalation, leaving Truco's 2 points on the table? **What is the rejection behavior on escalated calls?**

4. **Call logging**: The backlog mentions "add call history to game log." Should this be a simple `CallHistoryEntry[]` in `MatchState`, or does the game log need a richer structured format? **Is call history only for scoring audit, or also for the UI event log?**

---

## Ready for Proposal

**No — Open Questions #1–#3 must be answered before proposing.**

The call escalation logic and scoring rules are well-understood and implementable. However, the exact timing rules for *when* a call can be made (before/after playing, who can call when) affect the state machine design directly. Without these answers, the proposal would need to guess, and the spec would be incomplete.

**What the orchestrator should tell the user:**

> Before I write the proposal for Phase 5 (Truco calls), I need clarification on three Argentine Truco rule variants that affect the state machine design:
>
> 1. **Call timing**: Can a player call Truco *after* playing their card for the round (opponent's turn), or must the call happen *before* playing?
>
> 2. **Lead-call timing**: In round 1, mano leads first. Can mano call Truco *after* playing their card (before opponent plays), or only before playing?
>
> 3. **Rejection behavior on escalation**: If Truco is active and the other team calls Retruco, can the first team *reject* the Retruco while keeping the Truco's 2 points alive? Or does any rejection end the hand with 1 point for the caller?
>
> These are the only blockers for the Phase 5 proposal. Once you confirm the rule variant, I can write a complete proposal covering the domain model, API surface, and test scenarios.

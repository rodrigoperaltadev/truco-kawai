# Truco Calls Specification

## Purpose

Domain behavior for the Argentine Truco call escalation cycle: calling, accepting,
rejecting, and scoring `truco`, `retruco`, and `vale cuatro`. Resides in
`src/domain/game/calls.ts` — pure domain, no UI imports.

---

## Requirements

### Requirement: Call type hierarchy

The system MUST recognize exactly three call types in ascending order:
`truco` → `retruco` → `vale_cuatro`.
A player MUST NOT issue a call that skips a level.
Each call MUST be issued only when it is the correct next level for the
current call state.

| Call | Prerequisite | Points if accepted |
|------|--------------|--------------------|
| `truco` | No active or pending call | 2 |
| `retruco` | `truco` is accepted | 3 |
| `vale_cuatro` | `retruco` is accepted | 4 |

#### Scenario: Truco issued with no prior call

- GIVEN no active or pending call exists in the hand
- WHEN a player on their turn issues `truco`
- THEN `callState.pendingCall` is set with `level: "truco"` and `status: "pending"`

#### Scenario: Retruco requires accepted Truco

- GIVEN `truco` is accepted (`status: "accepted"`)
- WHEN the opponent issues `retruco` on their turn
- THEN `callState.pendingCall` is updated with `level: "retruco"` and `status: "pending"`

#### Scenario: Call level skipping rejected

- GIVEN no active or pending call exists
- WHEN a player issues `retruco` directly
- THEN an error `INVALID_CALL_LEVEL` is returned and state is unchanged

#### Scenario: Vale Cuatro requires accepted Retruco

- GIVEN `retruco` is accepted (`status: "accepted"`)
- WHEN the caller issues `vale_cuatro` on their turn
- THEN `callState.pendingCall` is updated with `level: "vale_cuatro"` and `status: "pending"`

---

### Requirement: Call state model

The system MUST maintain a `CallState` in `HandState` with:
- `pendingCall: PendingCall | null` — the in-flight unanswered call
- `acceptedLevel: CallType | null` — highest confirmed level both players are bound to
- `history: readonly CallHistoryEntry[]` — ordered record of all call actions in the hand

`PendingCall` MUST record `caller: string` (player id), `level: CallType`,
and `status: "pending" | "accepted" | "rejected"`.

#### Scenario: Initial call state is null

- GIVEN a hand is dealt
- WHEN `callState` is read
- THEN `pendingCall` is `null`, `acceptedLevel` is `null`, and `history` is empty

#### Scenario: History records every action

- GIVEN a full truco → accept → retruco → reject sequence
- WHEN `callState.history` is read
- THEN it contains four entries in chronological order

---

### Requirement: Turn-bound call rules

A player MUST only issue a call on their own turn (`state.currentTurn === caller`).
A player MUST NOT issue a call while a call is already pending.
After a player issues a call, `currentTurn` MUST transfer to the opponent
so the opponent can respond.

#### Scenario: Off-turn call rejected

- GIVEN it is player A's turn
- WHEN player B attempts to issue a call
- THEN an error `OUT_OF_TURN` is returned and state is unchanged

#### Scenario: Call during pending call rejected

- GIVEN a call is pending (`pendingCall.status === "pending"`)
- WHEN any player attempts to issue another call
- THEN an error `CALL_ALREADY_PENDING` is returned and state is unchanged

#### Scenario: Turn transfers to opponent after call

- GIVEN it is player A's turn and no call is pending
- WHEN player A issues `truco`
- THEN `currentTurn` becomes player B's id

---

### Requirement: Call timing — calling before or after playing

In round 1, `mano` MAY call before playing their card.
After a player plays a card (their turn ends), the opponent MAY call before
playing their own card in the same round.
A player MUST NOT call after playing their card in the current trick —
once a card is in `cardsPlayed` for the active round, that player's call window
is closed until a new trick begins.

#### Scenario: Mano calls before playing round 1

- GIVEN round 1 has begun and no cards are played yet
- WHEN `mano` issues `truco` before playing
- THEN the call is registered and `mano`'s card play is not consumed

#### Scenario: Opponent calls after mano plays (same round)

- GIVEN `mano` played their card in round 1 and it is now `pie`'s turn
- WHEN `pie` issues `truco` before playing their card
- THEN the call is registered and `pie` has not yet played

#### Scenario: Call after own card in round is rejected

- GIVEN player A played a card in the current trick
- WHEN player A attempts to issue a call in the same trick
- THEN an error `CALL_WINDOW_CLOSED` is returned

---

### Requirement: Block card play while call is pending

While `callState.pendingCall.status === "pending"`, `playCard` MUST return
an error `CALL_PENDING` for any player attempting to play a card.
Only `acceptCall` or `rejectCall` MUST be accepted while a call is pending.

#### Scenario: Card play blocked during pending call

- GIVEN `pendingCall` is not null and `status` is `"pending"`
- WHEN any player calls `playCard`
- THEN an error `CALL_PENDING` is returned and state is unchanged

#### Scenario: Play resumes after call accepted

- GIVEN a call was pending and the responder accepts it
- WHEN the caller attempts to play a card on their turn
- THEN the card is accepted and state is updated normally

#### Scenario: Play resumes after call rejected (hand ends)

- GIVEN a call was pending and the responder rejects it
- WHEN the hand resolution fires
- THEN `state.phase` transitions appropriately (match scoring applied, no further play)

---

### Requirement: Accept call and escalation

A player MUST only accept a call on their own turn (i.e., when `currentTurn`
equals the responder). Accepting MUST move `pendingCall.status` to `"accepted"`,
set `acceptedLevel` to the call's level, and return `currentTurn` to the
original caller so they may play or escalate next.

#### Scenario: Responder accepts call

- GIVEN player A called `truco` and it is now player B's turn
- WHEN player B accepts
- THEN `pendingCall.status` is `"accepted"` and `acceptedLevel` is `"truco"`
- AND `currentTurn` returns to player A

#### Scenario: Caller escalates after acceptance

- GIVEN `truco` is accepted and it is player A's turn
- WHEN player A issues `retruco`
- THEN `pendingCall` is `{ level: "retruco", status: "pending", caller: A }`

---

### Requirement: Reject call and award points

A player MUST only reject a call on their own turn. Rejecting MUST end the
hand immediately. The CALLER'S team MUST receive points equal to the
previously accepted level (or 1 point if no level was previously accepted).
`resolveMatch` MUST be invoked with the caller's team as winner and the
appropriate point delta.

| Rejected call | Previously accepted | Caller gets |
|---------------|--------------------:|------------:|
| `truco` | none | 1 pt |
| `retruco` | `truco` (2 pts) | 2 pts |
| `vale_cuatro` | `retruco` (3 pts) | 3 pts |

#### Scenario: Reject truco with no prior level

- GIVEN player A called `truco` and player B rejects
- WHEN rejection is processed
- THEN player A's team receives 1 point
- AND the hand ends (a new hand is dealt or match ends)

#### Scenario: Reject retruco awards truco points to escalator

- GIVEN `truco` is accepted (player A called), then player A calls `retruco`,
  and player B rejects
- WHEN rejection is processed
- THEN player A's team receives 2 points
- AND the hand ends

#### Scenario: Reject vale cuatro awards retruco points to escalator

- GIVEN `retruco` is accepted, then escalated to `vale_cuatro` by the original caller,
  and the responder rejects
- WHEN rejection is processed
- THEN the escalator's team receives 3 points

---

### Requirement: Call history in hand state

`HandState` MUST contain `callState: CallState`. Every call action (issue,
accept, reject) MUST append a `CallHistoryEntry` to `callState.history`.
Each entry MUST record `actor` (the player who performed the action),
`level`, `action`, and `resolvedAt` (round number).

#### Scenario: History entry on issue

- GIVEN a player issues `truco`
- WHEN `callState.history` is read
- THEN it contains one entry with `action: "issued"` and the caller's id

#### Scenario: History entry on accept

- GIVEN `truco` is pending and the responder accepts
- WHEN `callState.history` is read
- THEN it gains an entry with `action: "accepted"` and the responder's id

#### Scenario: History entry on reject

- GIVEN `truco` is pending and the responder rejects
- WHEN `callState.history` is read
- THEN it gains an entry with `action: "rejected"` and the responder's id

---

### Requirement: Reset call state per hand

When a new hand begins (via `resolveMatch` transitioning to the next hand),
`callState` MUST be reset to `{ pendingCall: null, acceptedLevel: null, history: [] }`.
Call state from a previous hand MUST NOT carry into the next hand.

#### Scenario: Call state cleared on new hand

- GIVEN a hand ended with an accepted `retruco` scoring 3 points
- WHEN the next hand is dealt
- THEN `callState.pendingCall` is `null` and `callState.history` is empty

---

### Requirement: Flor calls — configurable future feature

`CreateMatchOptions` MAY include `florEnabled?: boolean` (default `false`).
When `florEnabled` is `false`, the engine MUST NOT recognize `flor` or
`contraflor` as valid call types. When `florEnabled` is `true`, behavior is
defined in a future phase spec. This flag MUST exist in the type but MUST NOT
affect any behavior in Phase 5.

#### Scenario: Flor disabled by default

- GIVEN `createMatch` is called without specifying `florEnabled`
- WHEN a player attempts to issue a `flor` call
- THEN an error `INVALID_CALL_LEVEL` is returned

#### Scenario: Flag accepted but ignored

- GIVEN `createMatch` is called with `florEnabled: true`
- WHEN normal truco/retruco/vale_cuatro calls are issued
- THEN behavior is identical to `florEnabled: false` (no flor logic active)

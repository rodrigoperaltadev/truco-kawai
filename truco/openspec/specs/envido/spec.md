# Envido Calls Specification

## Purpose

Lifecycle, point calculation, scoring, call timing, escalation, and truco coexistence rules
for `envido`, `real_envido`, and `falta_envido` in the pure game engine.

---

## Requirements

### Requirement: EnvidoState type and reset

`HandState` MUST carry `envidoState: EnvidoState`. `EnvidoState` MUST contain:

| Field | Type | Description |
|---|---|---|
| `pendingEnvido` | `PendingEnvido \| null` | Active unanswered envido call |
| `acceptedLevel` | `EnvidoLevel \| null` | Highest level accepted this hand |
| `stake` | `number` | Points accumulated by accepted calls so far |
| `resolved` | `boolean` | True once envido is scored |
| `history` | `EnvidoHistoryEntry[]` | Ordered call/response log |

`EnvidoLevel` MUST be `"envido" | "real_envido" | "falta_envido"`.  
`PendingEnvido` MUST carry `caller: string`, `level: EnvidoLevel`, `status: "pending"`.  
`dealHand` MUST initialize `envidoState` to `{ pendingEnvido: null, acceptedLevel: null, stake: 0, resolved: false, history: [] }`.

Error codes: `ENVIDO_CALL_PENDING`, `ENVIDO_WINDOW_CLOSED`, `ENVIDO_ALREADY_RESOLVED`, `ENVIDO_INVALID_LEVEL`.

#### Scenario: EnvidoState initializes empty on new hand

- GIVEN a new hand is dealt
- WHEN `hand.envidoState` is read
- THEN `pendingEnvido` is `null`, `acceptedLevel` is `null`, `resolved` is `false`, `stake` is `0`

#### Scenario: EnvidoState resets between hands

- GIVEN envido was resolved in the previous hand
- WHEN `dealHand` is called
- THEN the new hand's `envidoState` is fully reset to empty

---

### Requirement: Envido point calculation

`calcEnvidoPoints(cards: Card[]): number` MUST apply Argentine Truco scoring:

| Rank | Envido value |
|---|---|
| 1 | 1 |
| 2 | 2 |
| 3 | 3 |
| 4 | 0 |
| 5 | 0 |
| 6 | 6 |
| 7 | 7 |
| 10, 11, 12 | 0 |

If two or more cards share the same suit: envido = sum of the two highest same-suit values **+ 20**.  
If no two cards share a suit: envido = highest single card value (no bonus).  
Maximum: **33** (7 + 6 + 20).

When `florEnabled` is `true` AND all three cards share the same suit, the hand has **flor** (3 pts, out of scope). `calcEnvidoPoints` MUST NOT be used for envido comparison in that case.

#### Scenario: Two same-suit cards score with bonus

- GIVEN hand `[oro-1, oro-7, basto-3]`
- WHEN `calcEnvidoPoints` is called
- THEN result is `28` (1 + 7 + 20)

#### Scenario: Face cards are worth 0

- GIVEN hand `[espada-12, espada-10, copa-3]`
- WHEN `calcEnvidoPoints` is called
- THEN result is `20` (0 + 0 + 20)

#### Scenario: Ranks 4 and 5 are worth 0

- GIVEN hand `[oro-4, oro-5, basto-1]`
- WHEN `calcEnvidoPoints` is called
- THEN result is `20` (0 + 0 + 20)

#### Scenario: Three same-suit cards, flor disabled — take two highest

- GIVEN hand `[espada-7, espada-6, espada-1]` and `florEnabled` is `false`
- WHEN `calcEnvidoPoints` is called
- THEN result is `33` (7 + 6 + 20; rank-1 card is ignored)

#### Scenario: No same-suit pair — no bonus

- GIVEN hand `[espada-7, copa-3, basto-1]`
- WHEN `calcEnvidoPoints` is called
- THEN result is `7` (highest single value; no bonus)

---

### Requirement: Calling envido

`callEnvido(state, caller, level)` MUST enforce:

| Validation | Error |
|---|---|
| Match over | `MATCH_OVER` |
| Not caller's turn | `OUT_OF_TURN` |
| Truco call pending | `CALL_PENDING` |
| Envido call already pending | `ENVIDO_CALL_PENDING` |
| Window closed (not round 1, caller already played this trick, or resolved) | `ENVIDO_WINDOW_CLOSED` |
| Level out of escalation order | `ENVIDO_INVALID_LEVEL` |

Escalation from `acceptedLevel`:

| Accepted level | Allowed next calls |
|---|---|
| `null` | `envido`, `real_envido`, `falta_envido` |
| `envido` | `envido` (recanto), `real_envido`, `falta_envido` |
| `real_envido` | `real_envido` (recanto), `falta_envido` |
| `falta_envido` | none |

**Counter-call rule**: when the responder calls a higher level instead of accepting/rejecting,
this constitutes both accepting the prior level AND raising. The prior level's points are added
to `stake`, `acceptedLevel` advances, and the new level is set as `pendingEnvido`. `currentTurn`
transfers back to the original caller.

On success: appends history entry, transfers `currentTurn` to opponent.

#### Scenario: Valid envido call from scratch

- GIVEN round 1, no cards played, no pending calls
- WHEN mano calls `callEnvido(state, mano, "envido")`
- THEN `pendingEnvido.level` is `"envido"` and `currentTurn` is opponent's id

#### Scenario: Skip directly to real_envido is valid

- GIVEN round 1, no prior envido call
- WHEN mano calls `callEnvido(state, mano, "real_envido")`
- THEN `pendingEnvido.level` is `"real_envido"`

#### Scenario: Recanto — envido after envido accepted

- GIVEN `acceptedLevel` is `"envido"` (stake = 2)
- WHEN caller calls `callEnvido(state, caller, "envido")`
- THEN `pendingEnvido.level` is `"envido"` and call is valid

#### Scenario: Recanto — real_envido after real_envido accepted

- GIVEN `acceptedLevel` is `"real_envido"` (stake = 5)
- WHEN caller calls `callEnvido(state, caller, "real_envido")`
- THEN `pendingEnvido.level` is `"real_envido"` and call is valid

#### Scenario: Envido blocked in round 2

- GIVEN round 2 has started
- WHEN a player calls `callEnvido`
- THEN error is `ENVIDO_WINDOW_CLOSED`

#### Scenario: Envido blocked after caller played in round 1

- GIVEN round 1, mano already played a card this trick
- WHEN mano calls `callEnvido`
- THEN error is `ENVIDO_WINDOW_CLOSED`

#### Scenario: Envido blocked when truco is pending

- GIVEN `callState.pendingCall.status === "pending"`
- WHEN a player calls `callEnvido`
- THEN error is `CALL_PENDING`

#### Scenario: Envido blocked when already resolved

- GIVEN `envidoState.resolved` is `true`
- WHEN a player calls `callEnvido`
- THEN error is `ENVIDO_WINDOW_CLOSED`

#### Scenario: falta_envido blocked after falta_envido accepted

- GIVEN `acceptedLevel` is `"falta_envido"`
- WHEN caller calls `callEnvido(state, caller, "falta_envido")`
- THEN error is `ENVIDO_INVALID_LEVEL`

---

### Requirement: Accepting envido

`acceptEnvido(state, responder)` requires a pending envido and `responder === currentTurn`.

On accept: compute `calcEnvidoPoints` for both players. Higher wins. **Tie → mano wins**.  
Points awarded = `stake + levelPoints(pendingLevel)` where:

| Level | `levelPoints` |
|---|---|
| `envido` | 2 |
| `real_envido` | 3 |
| `falta_envido` | see Falta Envido Scoring |

Accumulated examples: envido + envido accepted = 4; envido + real_envido accepted = 5;
envido + envido + real_envido accepted = 7.

Sets `resolved = true`. `currentTurn` returns to the original caller.

#### Scenario: Higher points wins accepted envido

- GIVEN envido pending; player A has 28 pts, player B has 20 pts
- WHEN `acceptEnvido` is called by B
- THEN player A's team receives `stake + levelPoints` points and `resolved` is `true`

#### Scenario: Mano wins on tie

- GIVEN envido pending; both players compute to 25 pts; player A is mano
- WHEN `acceptEnvido` is called
- THEN player A's team receives the points

#### Scenario: Accumulated chain — envido then real_envido accepted

- GIVEN envido was called and accepted (stake = 2); then real_envido called and accepted
- WHEN `acceptEnvido` is called
- THEN winning team receives `5` points (2 + 3)

#### Scenario: currentTurn returns to caller after acceptance

- GIVEN pending envido; caller is player A; responder is player B
- WHEN B calls `acceptEnvido`
- THEN `state.currentTurn` is player A's id

---

### Requirement: Rejecting envido

`rejectEnvido(state, responder)` requires a pending envido and `responder === currentTurn`.

Caller wins. Points awarded = points staked **before** the rejected level:

| Scenario | Points to caller |
|---|---|
| `envido` rejected (stake = 0) | 1 |
| `real_envido` rejected cold (stake = 0) | 2 |
| `real_envido` rejected after envido accepted (stake = 2) | 3 (stake + 1) |
| `falta_envido` rejected | `faltaPoints(state, callerTeamIdx)` |

General formula (non-falta): `awarded = stake + 1`.  
Sets `resolved = true`. `currentTurn` returns to the original caller.

#### Scenario: Rejecting initial envido awards 1 point

- GIVEN envido pending, stake = 0
- WHEN `rejectEnvido` is called
- THEN caller's team receives `1` point and `resolved` is `true`

#### Scenario: Rejecting cold real_envido awards 2 points

- GIVEN real_envido pending, stake = 0
- WHEN `rejectEnvido` is called
- THEN caller's team receives `2` points

#### Scenario: Rejecting real_envido after envido accepted awards 3 points

- GIVEN envido accepted (stake = 2), real_envido now pending
- WHEN `rejectEnvido` is called
- THEN caller's team receives `3` points (stake 2 + 1)

#### Scenario: currentTurn returns to caller after rejection

- GIVEN pending envido; caller is player A
- WHEN responder calls `rejectEnvido`
- THEN `state.currentTurn` is player A's id

---

### Requirement: Falta envido scoring

When `falta_envido` is accepted or rejected, points = `max(1, pointsToWin - winnerTeamScore)`.

On **acceptance**: winner determined by point comparison (tie → mano); awarded = winner's deficit.  
On **rejection**: caller's team awarded = `max(1, pointsToWin - callerTeamScore)`.  
This call MAY immediately end the match (`phase = "matchOver"`).

#### Scenario: Falta accepted awards winner's deficit in 15-point match

- GIVEN 15-point match; caller at 12 pts; falta accepted; caller wins comparison
- WHEN falta scores
- THEN caller's team receives `3` pts, reaching 15 and `phase` is `"matchOver"`

#### Scenario: Falta accepted awards winner's deficit in 30-point match

- GIVEN 30-point match; winning team at 10 pts; falta accepted
- WHEN falta scores
- THEN winning team receives `20` pts

#### Scenario: Rejected falta envido awards caller's deficit

- GIVEN 15-point match; caller's team at 10 pts; falta envido rejected
- WHEN `rejectEnvido` is called
- THEN caller's team receives `5` pts

---

### Requirement: Envido and truco coexistence

Truco and envido are independent call tracks. Both MAY be active simultaneously in round 1.  
Only one track MAY have a pending call at a time per turn.

`playCard` MUST return `ENVIDO_CALL_PENDING` when `envidoState.pendingEnvido?.status === "pending"`.

When truco is rejected and `envidoState.resolved` is `false`, envido MUST be resolved via rejection
scoring before truco rejection points are awarded.

When envido resolves, it MUST NOT deal a new hand — resolution happens mid-hand.

#### Scenario: Card play blocked while envido pending

- GIVEN `pendingEnvido.status === "pending"`
- WHEN a player calls `playCard`
- THEN error is `ENVIDO_CALL_PENDING` and state is unchanged

#### Scenario: Truco rejection with envido pending resolves envido first

- GIVEN envido is pending (unresolved) AND truco is pending
- WHEN the responder rejects truco
- THEN envido rejection is scored before truco rejection points
- AND `envidoState.resolved` is `true` in the resulting state

#### Scenario: Envido resolution does not deal a new hand

- GIVEN envido is accepted mid-hand; teams have not yet won enough points to end match
- WHEN `acceptEnvido` resolves
- THEN `state.hand.handNumber` is unchanged and cards remain as dealt

---

### Requirement: Domain purity for envido module

`src/domain/game/envido.ts` MUST NOT import from React, React Native, Expo, or any UI package.
It MAY import from `src/domain/deck/` and `src/domain/game/types.ts` only.
All exported functions MUST be pure: same input → same output, no side effects.

#### Scenario: No UI imports

- GIVEN `src/domain/game/envido.ts` is statically analyzed
- WHEN all import paths are checked
- THEN none resolve to `react`, `react-native`, `expo`, or any UI library

#### Scenario: calcEnvidoPoints is deterministic

- GIVEN a fixed card array
- WHEN `calcEnvidoPoints` is called twice with the same input
- THEN both calls return the same value

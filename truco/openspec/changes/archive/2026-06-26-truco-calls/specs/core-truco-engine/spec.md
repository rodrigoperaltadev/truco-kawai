# Delta for Core Truco Engine

## MODIFIED Requirements

### Requirement: Match creation

The system MUST expose `createMatch(options)` where
`options = { players: [Player, Player], pointsToWin: 15 | 30, florEnabled?: boolean }`.
It MUST return a `MatchState` with `phase: "playing"`, both teams at `score: 0`,
a dealt first hand with `callState` initialized to
`{ pendingCall: null, acceptedLevel: null, history: [] }`,
and `mano` assigned to `players[0]`.
Values other than `15` or `30` for `pointsToWin` MUST throw a `RangeError`.
(Previously: no `florEnabled` option; `HandState` had no `callState`.)

#### Scenario: Valid match initialized at 15 points

- GIVEN `options = { players: [playerA, playerB], pointsToWin: 15 }`
- WHEN `createMatch(options)` is called
- THEN `state.phase` is `"playing"`
- AND `state.teams[0].score` and `state.teams[1].score` are both `0`
- AND `state.hand.callState.pendingCall` is `null`

#### Scenario: Invalid pointsToWin rejected

- GIVEN `options = { players: [...], pointsToWin: 20 }`
- WHEN `createMatch(options)` is called
- THEN a `RangeError` is thrown

---

### Requirement: Playing a card

The system MUST expose `playCard(state, { playerId, card })` returning a new
`MatchState`. The card MUST be in the player's current hand.
A card MUST NOT be played more than once per hand.
If `callState.pendingCall` is not `null` and `status` is `"pending"`,
`playCard` MUST return an error `CALL_PENDING` before any other validation.
Any other violation MUST return the appropriate error — state MUST NOT be
mutated on error.
(Previously: no call-pending check existed; validation order was
`MATCH_OVER → OUT_OF_TURN → CARD_NOT_IN_HAND → CARD_ALREADY_PLAYED`.)

New validation order:
`MATCH_OVER → CALL_PENDING → OUT_OF_TURN → CARD_NOT_IN_HAND → CARD_ALREADY_PLAYED`

#### Scenario: Card play blocked during pending call

- GIVEN `callState.pendingCall` is not `null` with `status: "pending"`
- WHEN any player calls `playCard`
- THEN an error `CALL_PENDING` is returned and state is unchanged

#### Scenario: Valid card play advances state (no call pending)

- GIVEN it is player A's turn, no call is pending, and player A holds `espada-7`
- WHEN `playCard(state, { playerId: A, card: espada-7 })` is called
- THEN the returned state reflects `espada-7` in `cardsPlayed`
- AND `espada-7` is removed from player A's hand

#### Scenario: Card not in hand rejected

- GIVEN player A's hand is `[espada-7, basto-2, oro-3]`
- WHEN `playCard` is called with `copa-1` for player A
- THEN an error is returned and state is unchanged

#### Scenario: Already-played card rejected

- GIVEN player A already played `espada-7` in round 1
- WHEN `playCard` is called again with `espada-7` in a later round
- THEN an error is returned

---

### Requirement: Match scoring and winner

After each hand resolves, the winning team MUST receive points determined by
`callState`: if `callState.acceptedLevel` is non-null, the team receives
the accepted level's points (truco → 2, retruco → 3, vale_cuatro → 4);
otherwise the team receives `1` point.
If a call was rejected, `resolveMatch` MUST accept a `points` override from
the rejection handler — the caller's team receives that override instead of 1.
When a team's cumulative `score` reaches `pointsToWin`, `MatchState.phase`
MUST transition to `"matchOver"` and `MatchState.winner` MUST be set to that
team's id. No further card plays or calls MUST be accepted once
`phase` is `"matchOver"`.
(Previously: the winning team always received exactly 1 point per hand;
no `callState` or points override existed.)

#### Scenario: Accepted truco scores 2 points

- GIVEN `callState.acceptedLevel` is `"truco"` and player A's team wins the hand
- WHEN scoring is applied
- THEN `teams[A].score` increases by `2`

#### Scenario: Accepted retruco scores 3 points

- GIVEN `callState.acceptedLevel` is `"retruco"` and player A's team wins the hand
- WHEN scoring is applied
- THEN `teams[A].score` increases by `3`

#### Scenario: Accepted vale cuatro scores 4 points

- GIVEN `callState.acceptedLevel` is `"vale_cuatro"` and player A's team wins the hand
- WHEN scoring is applied
- THEN `teams[A].score` increases by `4`

#### Scenario: No call scores 1 point (baseline unchanged)

- GIVEN `callState.acceptedLevel` is `null`
- WHEN player A's team wins the hand
- THEN `teams[A].score` increases by `1`

#### Scenario: Rejection routes correct points to caller

- GIVEN player A called `retruco` and player B rejected
- WHEN rejection handling calls `resolveMatch` with `points: 2` override
- THEN `teams[A].score` increases by `2`

#### Scenario: Match ends at pointsToWin

- GIVEN player A's team score is `13` and `pointsToWin` is `15`
- AND `callState.acceptedLevel` is `"retruco"`
- WHEN player A's team wins the hand
- THEN `state.phase` is `"matchOver"` (13 + 3 = 16 ≥ 15)
- AND `state.winner` is player A's team id

#### Scenario: No play after match over

- GIVEN `state.phase` is `"matchOver"`
- WHEN `playCard` is called
- THEN an error is returned and state is unchanged

## ADDED Requirements

### Requirement: Call state reset on new hand

When `resolveMatch` transitions to a new hand by calling `dealHand`,
the returned `HandState` MUST have `callState` initialized to
`{ pendingCall: null, acceptedLevel: null, history: [] }`.

#### Scenario: Call state cleared on hand transition

- GIVEN a hand ended with `callState.acceptedLevel: "truco"` and history entries
- WHEN `resolveMatch` deals the next hand
- THEN `hand.callState.pendingCall` is `null`
- AND `hand.callState.history` is empty

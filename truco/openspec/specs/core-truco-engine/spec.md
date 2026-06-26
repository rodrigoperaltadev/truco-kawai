# Core Truco Engine Specification

## Purpose

Pure, serializable Argentine Truco engine: match creation, player/team models, hand dealing, turn order (mano/pie), card play, trick and hand resolution, match scoring, and CPU interface boundary. All logic is domain-only — no UI or side-effect imports.

---

## Requirements

### Requirement: Match creation

The system MUST expose `createMatch(options)` where `options = { players: [Player, Player], pointsToWin: 15 | 30 }`. It MUST return a `MatchState` with `phase: "playing"`, both teams at `score: 0`, a dealt first hand, and `mano` assigned to `players[0]`. Values other than `15` or `30` for `pointsToWin` MUST throw a `RangeError`.

#### Scenario: Valid match initialized at 15 points

- GIVEN `options = { players: [playerA, playerB], pointsToWin: 15 }`
- WHEN `createMatch(options)` is called
- THEN `state.phase` is `"playing"`
- AND `state.teams[0].score` and `state.teams[1].score` are both `0`
- AND `state.pointsToWin` is `15`

#### Scenario: Invalid pointsToWin rejected

- GIVEN `options = { players: [...], pointsToWin: 20 }`
- WHEN `createMatch(options)` is called
- THEN a `RangeError` is thrown

---

### Requirement: Player and Team models

A `Player` MUST have `id: string` and `name: string`. A `Team` MUST have `id: string`, `players: [Player]` (one per team in 1v1), and `score: number`. `score` MUST default to `0` and MUST NOT be negative. Player `id` values MUST be unique within a match.

#### Scenario: Team score defaults to zero

- GIVEN `createMatch` is called with two valid players
- WHEN team scores are read from the returned state
- THEN both are `0`

#### Scenario: Duplicate player IDs rejected

- GIVEN two `Player` objects with the same `id`
- WHEN `createMatch` is called with them
- THEN a `TypeError` is thrown

---

### Requirement: Hand structure

At the start of each hand the system MUST deal exactly `3` cards to each player from a shuffled 40-card Spanish deck. Each player's `hand` MUST contain exactly those cards; the same card MUST NOT appear in both hands. The `HandState` MUST record `handNumber` (1-indexed), `dealer` (player id), and `mano` (player id of the non-dealer, who leads).

#### Scenario: Deal 3 cards per player

- GIVEN a new hand is started
- WHEN `handState.players` card arrays are inspected
- THEN each contains exactly `3` cards
- AND no `cardId` appears in both hands

#### Scenario: Mano is the non-dealer

- GIVEN player A is dealer for hand 1
- WHEN `handState.mano` is read
- THEN it equals player B's id

---

### Requirement: Round and trick structure

Each hand MUST contain up to `3` rounds. Each round MUST contain exactly one `Trick` — one card play per player. `TrickState` MUST record `cardsPlayed: [{ playerId, card }]`, `winner: string | "tie"`, and `resolved: boolean`. `RoundState` MUST record `roundNumber` (1-indexed) and `trick`.

#### Scenario: Round structure after one card played

- GIVEN a hand has started and player A plays a card in round 1
- WHEN `roundState.trick.cardsPlayed` is inspected
- THEN it contains exactly one entry with player A's id and the played card
- AND `resolved` is `false`

#### Scenario: Round resolves after both players play

- GIVEN round 1 is active and player A then player B both play a card
- WHEN the trick is resolved
- THEN `resolved` is `true`
- AND `winner` is set to a player id or `"tie"`

---

### Requirement: Mano/pie turn order

In round 1 of each hand, `mano` MUST play first. In rounds 2 and 3, the winner of the previous trick MUST lead; if the previous trick was a `"tie"`, `mano` MUST lead. Only the player whose turn it is MAY play a card; any other player attempting to play MUST be rejected.

#### Scenario: Mano leads round 1

- GIVEN a new hand where player A is mano
- WHEN `currentTurn` is read at the start of round 1
- THEN it equals player A's id

#### Scenario: Trick winner leads next round

- GIVEN player B won the trick in round 1
- WHEN round 2 begins
- THEN `currentTurn` equals player B's id

#### Scenario: Tie restores mano leadership

- GIVEN round 1 ended in a tie
- WHEN round 2 begins
- THEN `currentTurn` equals the mano player's id

#### Scenario: Out-of-turn play rejected

- GIVEN it is player A's turn
- WHEN player B attempts to play a card
- THEN the action returns an error and state is unchanged

---

### Requirement: Playing a card

The system MUST expose `playCard(state, { playerId, card })` returning a new `MatchState`. The card MUST be in the player's current hand. A card MUST NOT be played more than once per hand. Any violation MUST return an error result — state MUST NOT be mutated on error.

#### Scenario: Valid card play advances state

- GIVEN it is player A's turn and player A holds `espada-7`
- WHEN `playCard(state, { playerId: A, card: espada-7 })` is called
- THEN the returned state reflects `espada-7` in `cardsPlayed`
- AND `espada-7` is removed from player A's hand

#### Scenario: Card not in hand rejected

- GIVEN player A's hand is `[espada-7, basto-2, oro-3]`
- WHEN `playCard` is called with `copa-1` for player A
- THEN an error is returned
- AND state is unchanged

#### Scenario: Already-played card rejected

- GIVEN player A already played `espada-7` in round 1
- WHEN `playCard` is called again with `espada-7` in a later round
- THEN an error is returned

---

### Requirement: Resolving a trick winner

`resolveTrick(state)` MUST compare the `trucoRank` of each card played. The player with the lower `trucoRank` value (stronger card) MUST win. If both cards share the same `trucoRank`, the result MUST be `"tie"`. The resolved trick MUST be persisted in `TrickState.winner`.

#### Scenario: Higher-ranked card wins

- GIVEN player A played `espada-4` (rank 1) and player B played `basto-2` (rank 6)
- WHEN `resolveTrick` is called
- THEN `trick.winner` is player A's id

#### Scenario: Equal-ranked cards tie

- GIVEN player A played `copa-7` (rank 10) and player B played `basto-7` (rank 10)
- WHEN `resolveTrick` is called
- THEN `trick.winner` is `"tie"`

---

### Requirement: Resolving a hand winner

`resolveHand(state)` MUST apply best-of-3 trick logic: the player winning 2 or more tricks wins the hand. If tricks are split `1–1–tie` or `0–0–tie` (all ties), the player closest to `mano` (i.e., `mano` themselves) MUST win. The result MUST be a player id or `"draw"` only if no winner can be determined (all 3 tricks tied).

| Tricks won (A / B) | Winner |
|--------------------|--------|
| 2 – 0 or 2 – 1 | Player with 2 wins |
| 1 – 1, 3rd = tie | Mano |
| 0 – 0, all ties | Mano |
| 0 – 0 – 0 explicit 3-tie | Mano |

#### Scenario: Two tricks decides the hand

- GIVEN player A wins tricks 1 and 2
- WHEN `resolveHand` is called
- THEN hand winner is player A

#### Scenario: Tie-break to mano

- GIVEN trick 1 → player A wins, trick 2 → player B wins, trick 3 → tie
- WHEN `resolveHand` is called
- THEN hand winner is the mano player

#### Scenario: All ties go to mano

- GIVEN all 3 tricks are `"tie"`
- WHEN `resolveHand` is called
- THEN hand winner is the mano player

---

### Requirement: Match scoring and winner

After each hand resolves, the winning player's team MUST receive `1` point. When a team's `score` reaches `pointsToWin`, `MatchState.phase` MUST transition to `"matchOver"` and `MatchState.winner` MUST be set to that team's id. No further card plays MUST be accepted once `phase` is `"matchOver"`.

#### Scenario: Score increments after hand

- GIVEN player A's team wins a hand
- WHEN scoring is applied
- THEN `teams[A].score` increases by `1`

#### Scenario: Match ends at pointsToWin

- GIVEN player A's team score is `14` and `pointsToWin` is `15`
- WHEN player A's team wins a hand
- THEN `state.phase` is `"matchOver"`
- AND `state.winner` is player A's team id

#### Scenario: No play after match over

- GIVEN `state.phase` is `"matchOver"`
- WHEN `playCard` is called
- THEN an error is returned and state is unchanged

---

### Requirement: CPUPlayer interface boundary

The engine MUST NOT embed CPU strategy. The system MUST define a `CPUPlayer` interface with a single method `chooseCard(hand: Card[], state: MatchState): Card`. CPU implementations MUST sit outside `src/domain/game/`. The engine only calls `chooseCard` through this interface — no conditional `isCPU` checks inside core functions.

#### Scenario: Interface decouples strategy

- GIVEN a `CPUPlayer` implementation that always plays the first card
- WHEN it is passed to the game shell and invoked
- THEN the engine receives a `Card` from `chooseCard` and processes it via `playCard` without knowing implementation details

#### Scenario: No isCPU in domain types

- GIVEN `src/domain/game/types.ts` is inspected
- WHEN its exports are enumerated
- THEN no `isCPU` flag exists on `Player`, `Team`, or `MatchState`

---

### Requirement: Domain purity

All files under `src/domain/game/` MUST NOT import from `react`, `react-native`, `expo`, or any UI package. `src/domain/game/` MAY import from `src/domain/deck/` only. `src/domain/game/` MUST NOT import from `src/features/` or `src/shared/`. Violations MUST be caught by a lint rule or TypeScript path alias restriction.

#### Scenario: No UI imports in domain

- GIVEN `src/domain/game/` files are statically analyzed
- WHEN import paths are checked
- THEN no import resolves to `react`, `react-native`, `expo`, or any UI library

#### Scenario: Deck imports are allowed

- GIVEN `src/domain/game/match.ts` imports `trucoRank` from `src/domain/deck/ranking`
- WHEN the project builds
- THEN no error is thrown

# Game Table UI — Specification

> This spec captures the complete Game Table UI implementation derived from SDD change `game-table-ui`.

## ADDED Requirements

### Requirement: GameScreen Table Composition

`GameScreen` MUST read `pointsToWin` and `opponentId` from Expo Router search params via `useLocalSearchParams()` and pass them as `CreateMatchOptions` to `useGameState`. It MUST default to `pointsToWin: 15` and `opponentId: "cpu"` if params are absent or invalid.

#### Scenario: Game starts with 30 points from params

- **GIVEN** the app navigates to `/game?pointsToWin=30&opponentId=cpu`
- **WHEN** `GameScreen` mounts
- **THEN** `useGameState` is initialized with `{ pointsToWin: 30, opponentId: "cpu" }`
- **AND** the score header shows target as 30

#### Scenario: Game defaults to 15 when params absent

- **GIVEN** the app navigates to `/game` with no search params
- **WHEN** `GameScreen` mounts
- **THEN** `useGameState` is initialized with `pointsToWin: 15`

#### Scenario: Match over triggers result persistence and navigation

- **GIVEN** `matchState.phase === "matchOver"`
- **WHEN** the state transition is detected
- **THEN** `@truco/last-result` is written to AsyncStorage with `{ winner, nosScore, ellosScore, pointsToWin }`
- **AND** the router navigates to `/result`

---

### Requirement: GameScreen Table Layout

`GameScreen` MUST replace the placeholder with a composed table layout that renders `ScoreHeader`, `OpponentZone`, `TableZone`, `ActionBar`, `PlayerHandZone`, and `EventLog` as distinct children, driven by a `useGameState` hook.

#### Scenario: Game screen renders all zones

- GIVEN the app has navigated to `/game`
- WHEN `GameScreen` mounts with an active `MatchState`
- THEN all six zones are visible: score header, opponent zone, table zone, action bar, player hand zone, and event log
- AND the `PlaceholderScreen` is no longer rendered

#### Scenario: Game screen renders in correct vertical order

- GIVEN the app is on a mobile viewport (< 768px)
- WHEN `GameScreen` mounts
- THEN zone order top-to-bottom is: `ScoreHeader` → `OpponentZone` → `TableZone` → `ActionBar` → `PlayerHandZone` → `EventLog`

---

### Requirement: Mobile-First Vertical Layout

The game table layout MUST use a mobile-first vertical flex stack. No zone SHALL overlap another zone. On viewports ≥ 768px, the layout MAY shift to a grid, but the mobile stack MUST be the baseline.

#### Scenario: Zones do not overlap on small viewport

- GIVEN a 390px wide viewport (iPhone 14 size)
- WHEN all zones are rendered simultaneously
- THEN no zone renders on top of another zone
- AND the full layout is reachable by vertical scrolling

#### Scenario: Event log does not cover table or hand zones

- GIVEN the event log is open/visible
- WHEN the log contains more than 10 entries
- THEN the log is scrollable within its own bounds
- AND the `TableZone` and `PlayerHandZone` remain fully visible above it

---

### Requirement: Card Text Display

Cards MUST be displayed as Spanish text labels combining rank and suit name. The format MUST be `{rank} {suit}` using display names from `src/shared/i18n/jargon.ts` (e.g., `7 Espada`, `1 Espada`, `12 Oro`).

#### Scenario: Player hand card displays text label

- GIVEN the player has the card `{ rank: 7, suit: 'espada' }` in hand
- WHEN `PlayerHandZone` renders
- THEN a touchable element displays the text "7 Espada"

#### Scenario: Played card in table zone shows text label

- GIVEN the player played card `{ rank: 1, suit: 'espada' }`
- WHEN `TableZone` renders the current trick
- THEN the played card slot shows the text "1 Espada" with the player's attribution

#### Scenario: Opponent hand shows card backs

- GIVEN the opponent has 3 unplayed cards
- WHEN `OpponentZone` renders
- THEN 3 card back elements are shown
- AND no card rank or suit text is revealed

---

### Requirement: Player Hand Interaction

`PlayerHandZone` MUST render exactly the cards in the player's current `PlayerHand.cards` array. Cards MUST be tappable when it is the player's turn and no call is pending. Cards MUST be non-interactive otherwise.

#### Scenario: Player can tap a card on their turn

- GIVEN `matchState.currentTurn === player.id`
- AND `matchState.hand.callState.pendingCall === null`
- WHEN the player taps a card in `PlayerHandZone`
- THEN `playCard` is invoked with the correct `PlayCardCmd`

#### Scenario: Cards are non-interactive when not player's turn

- GIVEN `matchState.currentTurn !== player.id`
- WHEN `PlayerHandZone` renders
- THEN all card elements have `accessibilityState.disabled: true`
- AND tapping a card does NOT invoke `playCard`

#### Scenario: Player hand shows exactly dealt card count

- GIVEN a fresh hand has been dealt
- WHEN `PlayerHandZone` renders
- THEN exactly 3 card face elements are rendered (one per `PlayerHand.cards` entry)

---

### Requirement: Action Bar — Enabled Actions Only

`ActionBar` MUST render only the action buttons that are currently valid given `MatchState`. Buttons for actions outside their valid window MUST NOT be rendered (not merely disabled).

| Action | Render condition |
|--------|-----------------|
| Truco | `currentTurn === player.id` AND no pending call AND no accepted call |
| Re Truco | `currentTurn === player.id` AND accepted call is `truco` AND no pending call |
| Vale 4 | `currentTurn === player.id` AND accepted call is `retruco` AND no pending call |
| Envido | `currentTurn === player.id` AND `isEnvidoWindowOpen` AND no pending envido |
| Real Envido | `currentTurn === player.id` AND `isEnvidoWindowOpen` AND no pending envido |
| Falta Envido | `currentTurn === player.id` AND `isEnvidoWindowOpen` AND no pending envido |
| Quiero | Pending call or envido issued by opponent AND `currentTurn === player.id` |
| No Quiero | Same as Quiero |
| Me Voy al Mazo | `currentTurn === player.id` AND no pending call AND no pending envido AND `phase !== "matchOver"` |

#### Scenario: Truco button visible when call window is open

- GIVEN it is the player's turn, no call is pending, and no call has been accepted
- WHEN `ActionBar` renders
- THEN a "Truco" button is rendered

#### Scenario: Truco button absent when call is pending

- GIVEN `matchState.hand.callState.pendingCall !== null`
- WHEN `ActionBar` renders
- THEN no "Truco", "Re Truco", or "Vale 4" buttons are rendered

#### Scenario: Response buttons shown on pending call from opponent

- GIVEN the opponent has issued a pending call and it is the player's turn
- WHEN `ActionBar` renders
- THEN "Quiero" and "No Quiero" buttons are rendered
- AND no call initiation buttons ("Truco", "Re Truco", "Vale 4") are rendered

#### Scenario: Action bar empty when not player's turn

- GIVEN `matchState.currentTurn !== player.id`
- WHEN `ActionBar` renders
- THEN zero action buttons are rendered

---

### Requirement: Score Display

`ScoreHeader` MUST display both teams' current scores using `ScoreBadge` components. It MUST also show the current hand number and active round number. The header MUST persist across all game states.

#### Scenario: Scores reflect current team totals

- GIVEN `teamNos.score === 5` and `teamEllos.score === 12`
- WHEN `ScoreHeader` renders
- THEN a `ScoreBadge` for `teamNos` shows `5` and a `ScoreBadge` for `teamEllos` shows `12`

#### Scenario: Hand and round number are visible

- GIVEN `hand.handNumber === 2` and the current round is round `2`
- WHEN `ScoreHeader` renders
- THEN a label indicates hand 2, round 2 (e.g., "Mano 2 · Ronda 2")

---

### Requirement: Turn Indicator

`TurnIndicator` MUST clearly communicate whose turn it is. When it is the human player's turn, it MUST display "Tu turno". When it is the opponent's turn, it MUST display the opponent's name followed by a turn suffix.

#### Scenario: Player turn indicator shows local copy

- GIVEN `matchState.currentTurn === player.id`
- WHEN `TurnIndicator` renders
- THEN the text "Tu turno" is visible

#### Scenario: Opponent turn indicator names the opponent

- GIVEN `matchState.currentTurn === opponent.id`
- WHEN `TurnIndicator` renders
- THEN the text contains the opponent's `Player.name`

---

### Requirement: Event Log

`EventLog` MUST render a full, scrollable list of game events. Events MUST include: card plays, trick resolutions, call issuances, call responses, envido issuances and resolutions, and fold actions. The log MUST NOT overlay any card or control zone.

#### Scenario: Log appends card play event

- GIVEN the player plays a card
- WHEN the game state updates
- THEN the event log appends an entry describing the card played and the player name

#### Scenario: Log appends call event

- GIVEN the player issues a "Truco" call
- WHEN the state updates
- THEN the event log appends an entry with the call type and caller name

#### Scenario: Log appends trick resolution

- GIVEN a trick resolves with a winner
- WHEN the state updates
- THEN the log appends an entry with the winner's name and the winning card

#### Scenario: Log is independently scrollable

- GIVEN the log contains 20+ entries
- WHEN the user scrolls within the log area
- THEN the `TableZone` and `PlayerHandZone` do not scroll with it

---

### Requirement: Touch Target Size

All interactive elements MUST meet a minimum touch target of 44×44 points. This applies to card faces in `PlayerHandZone` and all buttons in `ActionBar`.

#### Scenario: Card face touch target meets minimum

- GIVEN a card face is rendered in `PlayerHandZone`
- WHEN measured
- THEN its tappable area is at least 44×44 points

#### Scenario: Action button touch target meets minimum

- GIVEN an action button is rendered in `ActionBar`
- WHEN measured
- THEN its tappable area is at least 44×44 points

---

### Requirement: Accessibility Labels

All interactive and informational elements MUST carry `accessibilityLabel` props that describe their content in human-readable terms. Card backs MUST label as "Carta boca abajo". Card faces MUST label as the card's text (e.g., "7 Espada"). Action buttons MUST label with their call name.

#### Scenario: Card face has descriptive accessibility label

- GIVEN a card face for `{ rank: 7, suit: 'espada' }`
- WHEN rendered in `PlayerHandZone`
- THEN `accessibilityLabel` equals `"7 Espada"`

#### Scenario: Card back has generic accessibility label

- GIVEN an opponent card back is rendered
- WHEN the element is inspected
- THEN `accessibilityLabel` equals `"Carta boca abajo"`

#### Scenario: Disabled card has correct accessibility state

- GIVEN it is not the player's turn
- WHEN a card is rendered in `PlayerHandZone`
- THEN `accessibilityState.disabled` is `true`

---

### Requirement: Me Voy al Mazo — Button Visibility

`ActionBar` MUST render a "Me Voy al Mazo" button only when it is the player's turn and the current hand is not over (`phase !== "matchOver"`). It MUST NOT be rendered when a call or envido is pending (per the existing `canInitiate` gate).

#### Scenario: Button visible on player's turn with no pending calls

- GIVEN `matchState.currentTurn === player.id`
- AND `callState.pendingCall === null` AND `envidoState.pendingEnvido === null`
- AND `matchState.phase !== "matchOver"`
- WHEN `ActionBar` renders
- THEN a "Me Voy al Mazo" button is rendered

#### Scenario: Button absent when not player's turn

- GIVEN `matchState.currentTurn !== player.id`
- WHEN `ActionBar` renders
- THEN no "Me Voy al Mazo" button is rendered

#### Scenario: Button absent when a call is pending

- GIVEN `callState.pendingCall !== null` (pending truco/retruco/vale_cuatro)
- WHEN `ActionBar` renders
- THEN no "Me Voy al Mazo" button is rendered

---

### Requirement: Me Voy al Mazo — Fold Scoring

When `onMazo` is dispatched the hook MUST resolve the hand and award points to the opponent team.
Point rules (evaluated in this order):

| Condition | Points to opponent |
|---|---|
| Truco/retruco/vale_cuatro pending | Apply `rejectCall` logic first (caller wins 1 or accepted-level pts); fold ends hand — no additional fold penalty |
| Envido pending (no truco) | Apply `rejectEnvido` logic first (caller wins rejection pts); then fold awards opponent 1 pt via `resolveMatch` |
| Round 1 AND folder is `hand.mano` AND no truco involved | 2 pts to opponent |
| Any other case (round > 1, or folder is pie, and no truco pending) | 1 pt to opponent |

After scoring, `resolveMatch` MUST be called with the opponent as winner and the computed points override. The hook then reflects the new `MatchState` (next hand dealt or `matchOver`).

#### Scenario: Fold on round 1 as mano — opponent gets 2 points

- GIVEN `hand.rounds.length === 1` AND `hand.rounds[0].trick.cardsPlayed.length === 0`
- AND the folding player id equals `hand.mano`
- AND no truco call is pending or accepted
- WHEN the player dispatches `onMazo`
- THEN the opponent team receives 2 points
- AND a new hand is dealt (or `matchOver` if score threshold reached)

#### Scenario: Fold after round 1 — opponent gets 1 point

- GIVEN `hand.rounds.length > 1` (at least round 2 in progress)
- AND no truco call is pending or accepted
- WHEN the player dispatches `onMazo`
- THEN the opponent team receives 1 point
- AND a new hand is dealt (or `matchOver` if score threshold reached)

#### Scenario: Fold as pie on round 1 — opponent gets 1 point

- GIVEN `hand.rounds.length === 1` AND the folding player id is NOT `hand.mano`
- AND no truco call is pending or accepted
- WHEN the player dispatches `onMazo`
- THEN the opponent team receives 1 point

#### Scenario: Fold with truco pending — reject logic applies, hand ends

- GIVEN `callState.pendingCall !== null` (truco pending, issued by the opponent)
- WHEN the player dispatches `onMazo`
- THEN `rejectCall` logic runs: the truco caller wins `callPoints(acceptedLevel)` points
- AND the hand ends and a new hand is dealt
- AND no additional fold penalty is added on top of the rejection points

#### Scenario: Fold with envido pending and no truco — rejection then 1-point fold

- GIVEN `envidoState.pendingEnvido !== null` AND `callState.pendingCall === null`
- WHEN the player dispatches `onMazo`
- THEN `rejectEnvido` logic runs: the envido caller wins rejection points
- AND then the opponent receives 1 additional point via `resolveMatch` for the fold
- AND a new hand is dealt

---

### Requirement: Me Voy al Mazo — Event Log Entry

The event log MUST append an entry whenever a player folds. The entry MUST name the folding player and indicate the action.

#### Scenario: Fold appends log entry with actor name

- GIVEN the player dispatches `onMazo`
- WHEN the state updates
- THEN the event log appends an entry with `kind: "fold"` and the folding player's name
## Exploration: Truco Core Engine (Phase 4)

### Current State

The `src/domain/deck/` module provides a complete, immutable card model:

| File | Exports | Notes |
|---|---|---|
| `types.ts` | `Suit`, `Rank`, `Card`, `SuitMeta` | Pure data, no state |
| `suits.ts` | `SUITS`, `SUIT_ORDER` | 4 suits with metadata |
| `ranks.ts` | `RANKS` | 10 valid ranks |
| `card.ts` | `cardId()` | Stable string key `"${suit}-${rank}"` |
| `deck.ts` | `createDeck()`, `shuffle()`, `deal()` | Functional deck ops |
| `ranking.ts` | `trucoRank()` | 1–14 hierarchy (lower = stronger) |

The deck layer is well-isolated: `Card` is `Readonly`, all functions are pure, and `shuffle` accepts a custom RNG for testability.

### Affected Areas

- `src/domain/deck/` — foundation; stays as-is, imported by engine
- `src/domain/game/` — **new module** for Phase 4
- `src/domain/match/` — **new module** for Phase 4 (score tracking, win condition)
- `src/features/truco/` — where the engine will be consumed by UI

---

### What the Truco Engine Needs

Truco has a hierarchical game structure that must be modeled:

```
Match
└── Hands (until 15 or 30 points)
    └── Rounds (3 per hand)
        └── Tricks (1 card per player per round)
            └── Cards played
```

**Entities required:**

| Entity | Responsibilities |
|---|---|
| `Player` | `id`, `name`, current `Hand` (cards) |
| `Team` | `id`, `name`, players[], accumulated score |
| `Hand` | `handNumber`, `dealer`, cards dealt, envido state |
| `Round` | `roundNumber`, `cardsPlayed[]`, resolved flag |
| `Trick` | Which cards were played, winner, `mano` player |
| `Match` | `teams[]`, `currentHand`, `currentRound`, phase, win condition |

**Key rules to encode:**
- **Mano/pie:** First player to play in round 1 = "mano" (advantage). In rounds 2+, winner of previous trick leads (or pie if tied).
- **Hand winner:** Best of 3 tricks. If tied after 3, closest to mano wins.
- **Match winner:** First team to 15 or 30 points (configurable).
- **Turn order:** Round-robin dealing, mano leads first trick of each hand.

---

### Approaches

#### 1. Flat State Machine (`GameState` object)

Single immutable `GameState` with all fields. Actions return new state via a `reduce(state, action)` function.

```ts
type GameState = {
  phase: "betting" | "playing" | "handOver" | "matchOver";
  hands: Hand[];
  currentHandIndex: number;
  currentRoundIndex: number;
  teams: Team[];
  players: Player[];
};
```

| Pros | Cons |
|---|---|
| Simple mental model, easy to serialize | Flat namespace gets crowded; hard to add nested logic |
| Pure functions = trivial to test | No encapsulation of invariants per entity |
| All state in one place = easy to diff | Verbose accessor chains (`state.hands[0].rounds[1].tricks[2]`) |

#### 2. Entity Graph with Domain Classes

Each entity (`Player`, `Hand`, `Round`, `Trick`) is a class or module with its own invariants. Relationships form a tree/graph.

```ts
class Match {
  constructor(teams: Team[], options: MatchOptions);
  deal(handSize: number): void;
  playCard(playerId: PlayerId, card: Card): TrickResult;
  currentRound(): Round;
  currentHand(): Hand;
}
```

| Pros | Cons |
|---|---|
| Encapsulates logic per entity | More boilerplate; classes harder to compose |
| Natural domain language | Requires dependency management if entities reference each other |
| Easy to enforce invariants (e.g., "hand has exactly 3 cards") | Harder to serialize for replay/debug |

#### 3. Event Sourcing — State as Chronicle

All game events (`CardPlayed`, `TrickWon`, `HandWon`, `TrucoCalled`) are appended to a log. State is derived by replaying events.

```ts
type GameEvent = CardPlayed | TrickResolved | HandWon | ScoreUpdated;
function applyEvents(events: GameEvent[]): GameState;
function nextState(state: GameState, event: GameEvent): GameState;
```

| Pros | Cons |
|---|---|
| Built-in replay, undo, audit trail | Overhead for MVP; overkill if replay not needed |
| State transitions are explicit and testable | Event schema versioning adds complexity |
| Decouples "what happened" from "how to display it" | Requires building projection logic separately |

#### 4. Functional Core / Imperative Shell (Recommended)

Hybrid: pure internal engine functions operate on plain state objects. External layer (UI, CPU) sits outside. No classes; only data + functions.

```ts
// Pure core
type MatchState = { /* all fields */ };
function playCard(state: MatchState, cmd: PlayCardCmd): MatchState;
function resolveTrick(state: MatchState): MatchState;
function resolveHand(state: MatchState): MatchState;

// Impure shell (UI/CPU)
const store = createStore(reducer);
dispatch({ type: "PLAY_CARD", playerId, card });
```

| Pros | Cons |
|---|---|
| Testable without mocking | Requires discipline to keep core pure |
| Easy to serialize (JSON-serializable state) | No runtime invariants enforced by types |
| Fits React Native / Redux-free architecture | — |
| Phases 5–6 (Truco/Envido calls) extend cleanly | — |

---

### Recommendation

**Approach 4: Functional Core / Imperative Shell** for `src/domain/game/`.

Rationale:
- The existing `deck/` layer is already pure/functional — extending this pattern maintains consistency.
- Plain state objects are serializable, enabling future replay/debug features without architectural changes.
- This architecture scales through Phases 5–6 (calls) and Phase 9 (CPU) without refactoring.
- Unit tests are straightforward: call the pure function, assert the returned state.

**Proposed module structure:**

```
src/domain/game/
├── types.ts         # MatchState, Player, Team, Hand, Round, Trick, commands
├── match.ts         # createMatch(), applyAction(), resolveTrick(), resolveHand()
├── mano.ts          # mano/pie rules, turn order
└── __tests__/       # one test file per module
```

**Key design decisions to resolve in Proposal:**
- Fixed 1v1 (`playerCount = 2`) for MVP vs. extensible `PlayerId[]`
- Points to win: 15 (short) vs 30 (standard) as configurable option
- Tie-breaking in hand: closest to mano wins (Truco rule), not random

---

### Risks

1. **Mano/pie logic is subtle** — getting turn order wrong breaks the entire game. Needs a dedicated `mano.ts` module with clear tests.
2. **Hand vs. Round vs. Trick vocabulary** — team must agree on these terms early. Ambiguity here will cause confusion in Phases 4–6.
3. **Deck dependency** — `deal()` is already implemented in `deck/`. The game engine must consume it without circular imports. Resolution: `game/` imports from `deck/`, never the reverse.
4. **CPU opponent (Phase 9) sharing state** — if the engine has side effects (e.g., reads wall clock for "think time"), testability suffers. Keep the core purely functional.

---

### Open Questions

1. Should `Player` have a `isCPU` flag, or is CPU a separate interface (`CPUPlayer`) that implements the same `Player` protocol?
2. Is the hand "closest to mano wins on tie" rule standard, or should ties be broken differently for MVP?
3. Do we need a `GameLog` (event chronicle) from day one, or build it in Phase 10 as part of trainer features?
4. Should match options (`pointsToWin`, `handSize`) be passed at match creation or derived from a game mode enum?

---

### Ready for Proposal

**Yes.** The deck layer is complete and stable. The gap is clearly the game state hierarchy described above. A Proposal should define the `MatchState` shape, the action set, and the resolution rules with enough specificity to write tests before UI exists.

# Design: Core Truco Engine

## Technical Approach

Functional Core / Imperative Shell, as the proposal mandates. The engine is plain,
JSON-serializable `MatchState` plus pure transition functions. No classes, no side
effects, no UI imports. This mirrors the existing `src/domain/deck/` style (readonly
data, pure functions, injectable RNG) so the codebase stays consistent.

`createMatch` deals via `deal()` from the deck layer. `playCard` is the single public
mutation entry point; it validates, appends the card, then internally drives
`resolveTrick` → `resolveHand` → `resolveMatch` when a round/hand completes. Resolution
helpers are exported for direct unit testing but are also composed inside `playCard` so
the shell only ever calls `createMatch` and `playCard`.

Error handling uses a `Result<MatchState>` union (`{ ok: true; state } | { ok: false; error }`)
for recoverable rule violations (out-of-turn, card not in hand, match over). Programmer
errors at construction (`pointsToWin` not 15/30, duplicate ids) throw, matching the deck
layer's `RangeError` precedent.

## Architecture Decisions

### Decision: Result union for play errors, throw for construction errors

**Choice**: `playCard` returns `Result<MatchState>`; `createMatch` throws `RangeError`/`TypeError`.
**Alternatives considered**: throw everywhere; return `null` on error; mutate + return boolean.
**Rationale**: The spec demands "state MUST NOT be mutated on error" and "an error is returned"
for play violations (recoverable, shell-driven). Construction errors are caller bugs the
spec says MUST throw (`RangeError`, `TypeError`). A typed Result keeps the shell pure and
forces callers to handle the rejected-play path without try/catch noise.

### Decision: Card identity via `cardId()`, not a new id field

**Choice**: Reuse `cardId(card)` from the deck layer for "in hand" and "already played" checks.
**Alternatives considered**: add `id` to `Card`; compare by reference.
**Rationale**: `Card` is `Readonly<{ suit; rank }>` with no id, and `cardId()` already yields
the stable `"suit-rank"` key. Reference compare breaks after JSON round-trips (serializable
state is a goal). No deck changes — proposal forbids touching `spanish-deck`.

### Decision: Lower `trucoRank` wins; equal rank is a tie

**Choice**: Trick winner = card with the minimum `trucoRank()` value; equal values → `"tie"`.
**Alternatives considered**: higher-value-wins (would invert the deck's hierarchy).
**Rationale**: `ranking.ts` encodes lower = stronger (espada-4 = 1 is the best card). The spec
restates this explicitly. Centralizing the compare in `trick.ts` keeps the rule in one place.

### Decision: Tests in top-level `__tests__/domain/game/` mirror, not co-located

**Choice**: Place tests under `__tests__/domain/game/*.test.ts`, mirroring `src/domain/game/`.
**Alternatives considered**: `src/domain/game/__tests__/` as the exploration suggested.
**Rationale**: GROUND TRUTH from the repo — existing deck tests live at `__tests__/domain/deck.test.ts`,
and `jest.config.js` `testMatch` is `**/__tests__/**/*.test.[jt]s?(x)` while `tsconfig.json`
EXCLUDES `__tests__`. Co-locating would break the established layout. The exploration's
assumption is corrected here.

### Decision: Purity enforced by path alias + a guard test, not ESLint

**Choice**: Restrict imports via the `@/domain/deck` alias convention plus a unit test that
scans `src/domain/game/` source for forbidden import substrings.
**Alternatives considered**: ESLint `no-restricted-imports`.
**Rationale**: The linter is BIOME, not ESLint, and `biome.json` has no `noRestrictedImports`
rule. The spec allows "a lint rule OR TypeScript path alias restriction". A small static-scan
test satisfies the spec's "Domain purity" scenarios deterministically in CI.

## Data Flow

    Shell (UI / CPU)
        │  createMatch({ players, pointsToWin })
        ▼
    match.ts ──deal()──► deck/deck.ts
        │  MatchState (phase: "playing", hand 1 dealt, mano = players[0])
        ▼
    Shell: playCard(state, { playerId, card })
        │
        ▼
    play.ts ──validate(turn, in-hand, not-played, phase)──► turn.ts
        │  append to current trick
        ├─ trick incomplete ──► return state (other player's turn)
        └─ trick complete
              ▼
           trick.ts  resolveTrick → winner | "tie"
              ▼
           turn.ts   next leader = winner (or mano on tie)
              │
              ├─ hand incomplete ──► start next round, return state
              └─ hand complete (2 tricks decided OR 3 rounds played)
                    ▼
                 hand.ts  resolveHand → winnerPlayerId | "draw"
                    ▼
                 match.ts resolveMatch → +1 to winner's team
                    │
                    ├─ score < pointsToWin ──► deal next hand, alternate dealer
                    └─ score == pointsToWin ──► phase = "matchOver", winner = teamId

CPU never lives in the core: the shell calls `cpuPlayer.chooseCard(hand, state)` and feeds
the returned `Card` back into `playCard`. The engine has no `isCPU` branch.

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/domain/game/types.ts` | Create | All types: `MatchState`, `Player`, `Team`, `HandState`, `RoundState`, `TrickState`, `PlayCardCmd`, `Result`, `CPUPlayer`, phase/winner unions. No `isCPU` anywhere. |
| `src/domain/game/match.ts` | Create | `createMatch()`, `resolveMatch()`, internal `startHand()` (deal + assign dealer/mano), dealer alternation, win-condition + `matchOver` transition. |
| `src/domain/game/play.ts` | Create | `playCard()` — validation pipeline, append card, drive trick/hand/match resolution. Returns `Result<MatchState>`. |
| `src/domain/game/trick.ts` | Create | `resolveTrick()` — compare `trucoRank`, set `winner`/`"tie"`, `resolved: true`. |
| `src/domain/game/hand.ts` | Create | `resolveHand()` — best-of-3 tally + mano tie-breaker, returns playerId or `"draw"`. |
| `src/domain/game/turn.ts` | Create | Mano/pie turn order: round-1 leader, next-round leader from trick winner, tie → mano. `currentTurn` derivation. |
| `src/domain/game/index.ts` | Create | Barrel re-export of public API and types (mirrors `deck/index.ts`). |
| `__tests__/domain/game/match.test.ts` | Create | createMatch validation, scoring, match-over. |
| `__tests__/domain/game/play.test.ts` | Create | turn order, legal/illegal play, no-play-after-over. |
| `__tests__/domain/game/trick.test.ts` | Create | rank compare, tie. |
| `__tests__/domain/game/hand.test.ts` | Create | best-of-3, all tie-break branches. |
| `__tests__/domain/game/purity.test.ts` | Create | static scan: no react/react-native/expo/features/shared imports in `src/domain/game/`. |

## Interfaces / Contracts

```ts
// types.ts — all serializable; cards carried by value, identity via cardId()
export type Player = Readonly<{ id: string; name: string }>;
export type Team   = Readonly<{ id: string; players: readonly [Player]; score: number }>;

export type MatchPhase  = "playing" | "matchOver";
export type PointsToWin = 15 | 30;
export type TrickWinner = string | "tie";        // playerId or tie
export type HandWinner  = string | "draw";       // playerId or all-tied draw

export type PlayedCard = Readonly<{ playerId: string; card: Card }>;

export type TrickState = Readonly<{
  cardsPlayed: readonly PlayedCard[];            // 0..2 entries
  winner: TrickWinner | null;                    // null until resolved
  resolved: boolean;
}>;

export type RoundState = Readonly<{
  roundNumber: 1 | 2 | 3;
  trick: TrickState;
}>;

export type PlayerHand = Readonly<{ playerId: string; cards: readonly Card[] }>;

export type HandState = Readonly<{
  handNumber: number;                            // 1-indexed
  dealer: string;                                // player id
  mano: string;                                  // non-dealer (leads)
  players: readonly [PlayerHand, PlayerHand];    // remaining cards per player
  rounds: readonly RoundState[];                 // 1..3, current is last
}>;

export type MatchState = Readonly<{
  phase: MatchPhase;
  pointsToWin: PointsToWin;
  players: readonly [Player, Player];
  teams: readonly [Team, Team];
  hand: HandState;                               // current hand
  currentTurn: string;                           // playerId whose turn it is
  winner: string | null;                         // winning team id, set on matchOver
}>;

export type CreateMatchOptions = Readonly<{
  players: readonly [Player, Player];
  pointsToWin: PointsToWin;
}>;

export type PlayCardCmd = Readonly<{ playerId: string; card: Card }>;

// Recoverable rule violations: never throw, never mutate.
export type PlayError =
  | "OUT_OF_TURN"
  | "CARD_NOT_IN_HAND"
  | "CARD_ALREADY_PLAYED"
  | "MATCH_OVER";

export type Result<T> =
  | Readonly<{ ok: true;  state: T }>
  | Readonly<{ ok: false; error: PlayError }>;

// Strategy boundary — implemented OUTSIDE src/domain/game/.
export interface CPUPlayer {
  chooseCard(hand: readonly Card[], state: MatchState): Card;
}
```

```ts
// Public function signatures
export function createMatch(options: CreateMatchOptions): MatchState;
export function playCard(state: MatchState, cmd: PlayCardCmd): Result<MatchState>;
export function resolveTrick(trick: TrickState): TrickWinner;     // pure, input-narrow
export function resolveHand(hand: HandState): HandWinner;         // pure, input-narrow
export function resolveMatch(state: MatchState, handWinnerId: string): MatchState;
```

Note: `resolveTrick`/`resolveHand` take the narrow `TrickState`/`HandState` (not the whole
`MatchState`) so they are trivially unit-testable in isolation, matching the deck layer's
small-pure-function style. The spec's `resolveTrick(state)`/`resolveHand(state)` intent is
honored by `playCard` composing them against the current trick/hand.

## Mano/Pie Turn Order (turn.ts)

```
startHand(handNumber):
  dealer = (handNumber is odd) ? players[1].id : players[0].id   // hand 1 → dealer = players[1]
  mano   = the OTHER player                                       // hand 1 → mano = players[0]
  currentTurn = mano                                              // mano leads round 1
```

Spec requires hand-1 `mano = players[0]`. So hand-1 dealer is `players[1]`; dealer alternates
each hand. `mano` is always the non-dealer.

```
nextRoundLeader(previousTrick):
  if previousTrick.winner == "tie": return mano        // tie restores mano leadership
  else:                             return winner       // trick winner leads next round
```

Within a round, after the leader plays, `currentTurn` becomes the other player. The round
resolves once both have played (`cardsPlayed.length == 2`).

## Trick Resolution Algorithm (trick.ts)

```
resolveTrick(trick):
  [a, b] = trick.cardsPlayed                  // exactly 2 (guarded; noUncheckedIndexedAccess)
  rankA = trucoRank(a.card)                   // lower = stronger
  rankB = trucoRank(b.card)
  if rankA < rankB:  winner = a.playerId
  elif rankB < rankA: winner = b.playerId
  else:              winner = "tie"           // equal trucoRank
  return winner
```

`playCard` then writes `{ winner, resolved: true }` into the trick. Because
`noUncheckedIndexedAccess` is on, the implementation guards `a`/`b` for `undefined` and
treats an incomplete trick as a programmer error (only called when length === 2).

## Hand Resolution Algorithm (hand.ts)

Best-of-3 with mano tie-breaker. Tally decided tricks (ties don't count toward either player).

```
resolveHand(hand):
  winsA = winsB = 0
  for round in hand.rounds (resolved only):
    w = round.trick.winner
    if w == playerA.id: winsA++
    elif w == playerB.id: winsB++
    // "tie" contributes to neither

  if winsA >= 2: return playerA.id
  if winsB >= 2: return playerB.id

  // No one reached 2 wins. Decide by spec table:
  if winsA == winsB:        // 0-0 (all ties) or 1-1 with 3rd tie
      return hand.mano       // closest-to-mano wins → mano
  // 1-0 or 0-1 with remaining rounds still tie-capped at 3:
  // after 3 rounds a 1-0 split means the other two were ties → leader by count wins
  return (winsA > winsB) ? playerA.id : playerB.id
```

| Tricks won (A / B) | resolveHand returns |
|--------------------|---------------------|
| 2–0 or 2–1 | player with 2 |
| 1–1, 3rd = tie | mano |
| 1–0, other two ties | the player with 1 |
| 0–0, all 3 ties | mano |

A literal `"draw"` is returned ONLY if the rules ever yield no decidable winner after 3
rounds (defensive; under standard Truco the mano tie-break always resolves, so `"draw"` is
effectively unreachable but kept to satisfy the type and the spec's stated contract).

## Match Scoring Algorithm (match.ts)

```
resolveMatch(state, handWinnerId):
  teamIdx = team index whose single player.id == handWinnerId
  newTeams = teams with newTeams[teamIdx].score += 1
  if newTeams[teamIdx].score >= pointsToWin:
      return { ...state, teams: newTeams, phase: "matchOver", winner: teams[teamIdx].id }
  else:
      nextHand = startHand(handNumber + 1)      // re-deal, alternate dealer, mano leads
      return { ...state, teams: newTeams, hand: nextHand,
               currentTurn: nextHand.mano }
```

`playCard` short-circuits with `{ ok: false, error: "MATCH_OVER" }` whenever
`state.phase === "matchOver"`, satisfying "No play after match over". 1v1 scoring gives the
hand winner's team exactly +1 (no truco stakes in this phase).

## Testing Strategy

| Layer | What to Test | Approach |
|-------|--------------|----------|
| Unit — match | `createMatch` valid init (phase, scores 0, pointsToWin); `RangeError` on 20; `TypeError` on duplicate ids; scoring +1; match ends at pointsToWin; mano = players[0]; 3 cards dealt, no overlap | Pure calls, assert returned `MatchState`; deterministic via `shuffle(deck, () => 0.5)`-style injected RNG passed through `createMatch` (add optional `rng` param for tests). |
| Unit — turn | mano leads round 1; trick winner leads round 2; tie → mano leads; out-of-turn rejected (state unchanged) | Build a known `MatchState`, drive `playCard`, assert `currentTurn` and `Result.ok`. |
| Unit — play | valid play removes card from hand + appears in `cardsPlayed`; card-not-in-hand rejected; already-played rejected; no-play-after-matchOver | Hold-known-hands fixtures; assert immutability (input state deep-equal before/after on error). |
| Unit — trick | higher-ranked (lower rank value) wins; equal rank ties | Call `resolveTrick(trick)` with crafted `cardsPlayed`. |
| Unit — hand | 2–0 / 2–1 decisive; 1–1+tie → mano; all-ties → mano; 1–0+ties → leader | Call `resolveHand(hand)` with crafted resolved rounds. |
| Unit — purity | no import of react/react-native/expo/`@/features`/`@/shared` in `src/domain/game/**` | Read source files, regex-scan import lines, assert none match forbidden modules. |

Conventions to match (from existing deck tests): import via `@/domain/...` alias, `describe`/`it`,
guard array destructures for `undefined` (because `noUncheckedIndexedAccess`), inject a seeded
RNG for determinism rather than mocking. All tests under `__tests__/domain/game/`.

Determinism note: `createMatch` will accept an optional `rng?: () => number` (defaulting to
`Math.random`) forwarded to `shuffle`, so tests can fix the deal without mocking — exactly the
pattern `shuffle`/`deal` already established.

## Migration / Rollout

No data migration. New module only; `spanish-deck` untouched. Rollback = delete
`src/domain/game/`, `__tests__/domain/game/`, and the change folder. No consumers exist yet
(`src/features/truco/` integration is a later phase), so there is zero blast radius.

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Mano/pie order wrong (hand-1 dealer vs mano inversion) | Med | Isolate in `turn.ts`; spec pins `mano = players[0]` for hand 1, so dealer = players[1]; dedicated turn tests for all 4 scenarios. |
| Hand tie-break edge cases (1–0+ties vs 1–1+tie) | Med | Encode the full spec table in `hand.ts`; one test per table row; `"draw"` kept defensive. |
| `noUncheckedIndexedAccess` `undefined` leaks | Med | Guard every array destructure; treat incomplete trick as precondition violation (only resolved at length 2). |
| Test layout drift (co-located vs mirror) | High→Resolved | Corrected: tests go in `__tests__/domain/game/` per repo reality (`jest.config.js` testMatch + tsconfig exclude). |
| Purity not enforced by tooling (Biome lacks rule) | Med | Add `purity.test.ts` static scan; relies on `@/domain/deck` alias for allowed imports. |
| `resolveTrick(state)` spec signature vs narrow input | Low | Public helpers take narrow `TrickState`/`HandState` for testability; `playCard` composes them on `MatchState`, preserving spec intent. |

## Open Questions

- [ ] None blocking. The optional `rng` param on `createMatch` is a design addition (test
  determinism) not contradicting the spec; confirm acceptable during apply, otherwise tests
  fall back to asserting structural invariants (counts, no-overlap) without fixing the deal.

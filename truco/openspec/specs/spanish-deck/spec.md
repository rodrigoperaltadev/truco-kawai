# Spanish Deck Specification

## Purpose

Defines the 40-card Spanish deck domain for Argentine Truco: suit and rank models, card identity, deck generation, shuffle/deal helpers, and the Truco ranking hierarchy.

---

## Requirements

### Requirement: Suit model

The system MUST define exactly four suits — `espada`, `basto`, `copa`, `oro` — as a TypeScript literal union. Each suit MUST carry a `label` (Spanish display string) and an `accentColor` (hex token). The union MUST be the authoritative type used by every domain module.

#### Scenario: Four suits with metadata

- GIVEN `SUITS` is imported from the domain
- WHEN its keys are enumerated
- THEN the keys are exactly `['espada', 'basto', 'copa', 'oro']`
- AND each entry has a non-empty `label` and a valid hex `accentColor`

#### Scenario: Type exhaustiveness

- GIVEN a function that accepts `Suit`
- WHEN TypeScript checks all branches
- THEN adding a fifth suit literal causes a compile error on unhandled branches

---

### Requirement: Rank model

The system MUST define exactly ten ranks — `1, 2, 3, 4, 5, 6, 7, 10, 11, 12` — as a TypeScript literal union `Rank`. Ranks `8` and `9` MUST NOT appear (they are not part of the Spanish deck). The type MUST be narrowed so that passing `8` or `9` is a compile-time error.

#### Scenario: Valid ranks accepted

- GIVEN `Rank` is imported
- WHEN a variable is assigned any value in `[1, 2, 3, 4, 5, 6, 7, 10, 11, 12]`
- THEN TypeScript compiles without error

#### Scenario: Excluded ranks rejected

- GIVEN `Rank` is imported
- WHEN a variable is assigned `8` or `9`
- THEN TypeScript emits a type error

---

### Requirement: Card identity and uniqueness

A `Card` MUST be defined as `{ suit: Suit; rank: Rank }`. Two cards are identical if and only if their `suit` and `rank` are equal. A `Card` MUST NOT carry mutable state. The system SHALL provide a pure `cardId(card)` helper that returns a stable string key (`"${suit}-${rank}"`).

#### Scenario: Cards with same suit and rank are equal

- GIVEN two `Card` objects with `suit: 'espada'` and `rank: 7`
- WHEN `cardId` is called on both
- THEN both return `"espada-7"`

#### Scenario: Cards with different suit or rank are distinct

- GIVEN `Card { suit: 'espada', rank: 7 }` and `Card { suit: 'oro', rank: 7 }`
- WHEN `cardId` is called on each
- THEN the results differ (`"espada-7"` vs `"oro-7"`)

---

### Requirement: Deck generation

The system MUST provide a `createDeck()` function that returns a `ReadonlyArray<Card>` of exactly 40 cards — 10 ranks per suit across all 4 suits. Each (suit, rank) pair MUST appear exactly once. The returned array MUST NOT contain duplicates.

#### Scenario: Deck contains 40 cards

- GIVEN `createDeck()` is called
- WHEN the length of the result is checked
- THEN it equals `40`

#### Scenario: Each suit has 10 cards

- GIVEN `createDeck()` is called
- WHEN cards are grouped by `suit`
- THEN each suit group has exactly `10` cards

#### Scenario: No duplicate cards

- GIVEN `createDeck()` is called
- WHEN all `cardId` values are put in a `Set`
- THEN the set size equals `40`

---

### Requirement: Shuffle helper

The system SHALL provide a `shuffle(deck)` function that accepts a `ReadonlyArray<Card>` and returns a new `Card[]` with the same elements in a randomised order. The original array MUST NOT be mutated. The shuffle SHOULD produce a different order than the input across repeated calls (statistical guarantee, not deterministic).

#### Scenario: Shuffle preserves all cards

- GIVEN `createDeck()` returns 40 cards
- WHEN `shuffle(deck)` is called
- THEN the result has 40 cards
- AND every `cardId` from the original deck appears exactly once in the shuffled result

#### Scenario: Original array is not mutated

- GIVEN a deck is stored in a `const` reference
- WHEN `shuffle(deck)` is called
- THEN the original reference's order is unchanged

---

### Requirement: Deal helper

The system SHALL provide a `deal(input: DealInput)` function where `DealInput = { deck: Card[]; handSize: number; playerCount?: number }`. It MUST deal `handSize` cards to each hand in round-robin order. The default `playerCount` MUST be `2`. It MUST return `{ hands: Card[][], remaining: Card[] }`. If `deck.length` is less than the required cards, it MUST throw a `RangeError`.

#### Scenario: Deal 3 cards to 2 players

- GIVEN a shuffled deck of 40 cards and `input = { deck, handSize: 3, playerCount: 2 }`
- WHEN `deal(input)` is called
- THEN each of the 2 hands has exactly 3 cards
- AND `remaining` has 34 cards
- AND no card appears in more than one hand

#### Scenario: Deal fails when deck is too small

- GIVEN a deck of 2 cards and `input = { deck, handSize: 3, playerCount: 2 }`
- WHEN `deal(input)` is called
- THEN a `RangeError` is thrown

---

### Requirement: Truco ranking hierarchy

The system MUST provide a `trucoRank(card)` function that returns a number representing the card's relative strength in Argentine Truco. Lower numbers MUST mean higher strength (1 = strongest). The hierarchy MUST follow this exact table:

| Truco Rank | Card | Jargon |
|------------|------|--------|
| 1 | espada-4 | Ancho de Espada |
| 2 | basto-4 | Ancho de Basto |
| 3 | espada-7 | Siete de Espada |
| 4 | oro-7 | Siete de Oro |
| 5 | any-3 | Tres |
| 6 | any-2 | Dos |
| 7 | any-12 | Rey |
| 8 | any-11 | Caballo |
| 9 | any-10 | Sota |
| 10 | copa-7 | Siete (igual) |
| 10 | basto-7 | Siete (igual) |

`copa-7` and `basto-7` MUST have the same rank (tied, no winner). All cards sharing a rank tier (3s, 2s, 12s, 11s, 10s, copa-7, basto-7) MUST return identical `trucoRank` values.

#### Scenario: Special card ordering

- GIVEN cards `espada-4`, `basto-4`, `espada-7`, `oro-7`
- WHEN `trucoRank` is called on each
- THEN the result is `1, 2, 3, 4` respectively
- AND `trucoRank(espada-4) < trucoRank(basto-4) < trucoRank(espada-7) < trucoRank(oro-7)`

#### Scenario: Ordinary cards by rank tier

- GIVEN two cards with `rank: 3`, different suits
- WHEN `trucoRank` is called on both
- THEN both return the same value (`5`)

#### Scenario: 7s tie — copa equals basto

- GIVEN `Card { suit: 'copa', rank: 7 }` and `Card { suit: 'basto', rank: 7 }`
- WHEN `trucoRank` is called on both
- THEN both return the same value (`10`)

#### Scenario: Known hierarchy is exhaustive

- GIVEN `createDeck()` is called
- WHEN `trucoRank` is called on every card
- THEN no card throws or returns `undefined`
- AND the minimum value is `1` and maximum is `14`

---

### Requirement: Rank jargon in i18n

The system MUST extend `src/shared/i18n/jargon.ts` with a `ranks` record that maps every `Rank` value to its Spanish display string. Labels MUST cover ranks `1, 2, 3, 4, 5, 6, 7, 10, 11, 12`. The existing `suits` record MUST NOT be modified or removed.

| Rank | Label |
|------|-------|
| 1 | Ancho |
| 2 | Dos |
| 3 | Tres |
| 4 | Cuatro |
| 5 | Cinco |
| 6 | Seis |
| 7 | Siete |
| 10 | Sota |
| 11 | Caballo |
| 12 | Rey |

#### Scenario: Rank labels are accessible

- GIVEN `jargon.ranks` is imported
- WHEN `jargon.ranks[1]` is accessed
- THEN the value is `"Ancho"`

#### Scenario: All ranks covered

- GIVEN `jargon.ranks` is imported
- WHEN the keys are compared against the `Rank` union
- THEN every `Rank` value has a corresponding entry
- AND no entry is `undefined` or empty string

#### Scenario: Suits record is unchanged

- GIVEN `jargon.suits` is imported after the ranks addition
- WHEN `jargon.suits.espada` is accessed
- THEN the value is still `"Espada"`
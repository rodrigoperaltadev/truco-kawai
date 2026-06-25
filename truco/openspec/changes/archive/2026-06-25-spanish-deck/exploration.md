# Exploration: Spanish Deck Model for Argentine Truco

## Executive Summary

Phase 3 requires modeling a 40-card Spanish deck with 4 suits (espada, basto, copa, oro) and a non-linear Truco ranking hierarchy. The `src/domain` folder is empty — this is a greenfield domain modeling task. Key decision: whether to model cards as typed unions with embedded rank values, or as data-driven records with a separate ranking engine.

---

## Current State

### `src/domain/` — Empty
Only `.gitkeep` exists. No game logic, types, or services yet.

### i18n — Suits already defined
`src/shared/i18n/jargon.ts` already contains:
```ts
suits: {
  espada: "Espada",
  basto: "Basto",
  copa: "Copa",
  oro: "Oro",
}
```
These are marked `as const` and used by `Pill` components for jargon display.

### Design Tokens — No suit colors
`src/shared/theme/colors.ts` has `teamNos` and `teamEllos` for score UI, but **no per-suit colors**. The Nocturnal Bodegón theme describes a "cozy Argentine bodegón" aesthetic but doesn't specify suit symbol colors. Card illustrations are deferred post-MVP.

### Existing patterns
- Domain logic goes in `src/domain/` (per `openspec/config.yaml`: "Domain-driven — src/domain (pure rules)")
- UI uses `*.styles.ts` co-location pattern (per `rn-refactor` skill)
- All user-facing text via i18n, jargon always Spanish
- TypeScript strict mode enforced

---

## Affected Areas

| File/Directory | Why Affected |
|----------------|-------------|
| `src/domain/` | New card types, suit enum, rank values, Truco hierarchy |
| `src/shared/i18n/jargon.ts` | May need rank names added (4, 5, 6, 7, 10, 11, 12, etc.) |
| `src/shared/theme/colors.ts` | May need suit accent colors for future card illustrations |
| `src/shared/theme/tokens.ts` | Theme interface may grow if suit colors added |
| `docs/design-tokens.md` | Reference for visual direction (no suit colors defined yet) |

---

## Options

### 1. Card Model

**Option A — Discriminated union with embedded rank values**
```ts
type Suit = 'espada' | 'basto' | 'copa' | 'oro';

type TrucoRank = 4 | 5 | 6 | 7 | 10 | 11 | 12;

type Card = {
  suit: Suit;
  rank: TrucoRank;
  trucoValue: number; // computed or stored
};
```
- Pros: Type-safe, exhaustiveness checked, rank and suit clearly separated
- Cons: `trucoValue` is mutable or requires computed property; linear rank storage

**Option B — Tuple-based lookup model**
```ts
type Suit = 'espada' | 'basto' | 'copa' | 'oro';
type Rank = 4 | 5 | 6 | 7 | 10 | 11 | 12;

const TRUCO_RANKING: ReadonlyArray<{ suit: Suit; rank: Rank }> = [
  { suit: 'espada', rank: 4 }, // 1 (Ancho de Espada)
  // ... full 40-card deck
];

const trucoValue = (card: Card): number => TRUCO_RANKING.indexOf(card) + 1;
```
- Pros: Data-driven, ranking logic is a pure function, easy to test
- Cons: Index-based ranking is fragile if deck order changes

**Option C — Nominal types via branded strings**
```ts
type Suit = 'espada' | 'basto' | 'copa' | 'oro';
type Rank = 4 | 5 | 6 | 7 | 10 | 11 | 12;
type Card = string; // 'espada-4', 'basto-7', etc.

const card = (suit: Suit, rank: Rank): Card => `${suit}-${rank}`;
```
- Pros: Simple, deck is just `Set<Card>`, serialization trivial
- Cons: No type safety on card structure, rank/suit extraction needs helpers

**Recommendation**: Option A with Option B's data-driven ranking approach — discriminated union for the `Card` type, but Truco values defined in a separate readonly ranking map for testability.

---

### 2. Suit Representation

**Option A — String literal union**
```ts
type Suit = 'espada' | 'basto' | 'copa' | 'oro';
```
- Pros: Simple, aligns with `jargon.ts` keys, exhaustive matching
- Cons: No shared behavior or metadata per suit

**Option B — Const object with metadata**
```ts
const SUITS = {
  espada: { label: 'Espada', symbol: '🗡️', accentColor: '#...' },
  basto: { label: 'Basto', symbol: '🌿', accentColor: '#...' },
  copa: { label: 'Copa', symbol: '🍷', accentColor: '#...' },
  oro: { label: 'Oro', symbol: '🪙', accentColor: '#...' },
} as const;

type Suit = keyof typeof SUITS;
```
- Pros: Single source of truth for suit metadata, easy to extend, aligns with theme token pattern
- Cons: Slightly more verbose

**Recommendation**: Option B — aligns with the Nocturnal Bodegón theme's token pattern, future-proofs for card illustration colors, and keeps suit metadata centralized.

---

### 3. Ranking Approach

The Spanish deck in Truco has a **non-linear hierarchy**:

| Relative Rank | Spanish Deck Values |
|---------------|---------------------|
| 1 (highest) | 4 Espada (Ancho de Espada) |
| 2 | 4 Basto (Ancho de Basto) |
| 3 | 7 Espada |
| 4 | 7 Oro |
| 5 | 3 (any suit) |
| ... | ... |
| 10 (lowest) | 2 (any suit) |

**Option A — Hardcoded switch/if chains**
```ts
const trucoValue = (card: Card): number => {
  if (card.suit === 'espada' && card.rank === 4) return 1;
  if (card.suit === 'basto' && card.rank === 4) return 2;
  // ...
};
```
- Pros: Explicit, no data table needed
- Cons: Error-prone, hard to test exhaustively, 40-card table is unwieldy

**Option B — Lookup map (data-driven)**
```ts
const TRUCO_RANKING: Record<string, number> = {
  'espada-4': 1,
  'basto-4': 2,
  'espada-7': 3,
  'oro-7': 4,
  // ...
};

const trucoValue = (card: Card): number => TRUCO_RANKING[`${card.suit}-${card.rank}`];
```
- Pros: Easy to test (one assertion per entry), easy to visualize full hierarchy, separates data from logic
- Cons: Requires string key construction

**Recommendation**: Option B — aligns with "testable game engine" goal in backlog, and the `jargon.ts` pattern already uses `as const` objects that mirror this structure.

---

## Recommendation

**Model structure:**

```
src/domain/
  deck/
    types.ts          # Suit, Rank, Card, CardValue types
    suits.ts          # SUITS const object with metadata
    ranking.ts        # TRUCO_RANKING map + trucoValue() function
    deck.ts           # createDeck(), shuffle(), deal()
  card/
    Card.ts           # Card value object (optional: class for behavior)
    Card.styles.ts    # No — domain has no styles, this is pure logic
```

**Suit metadata to add to `jargon.ts`:**
```ts
suits: {
  espada: { label: "Espada", symbol: "E", accentColor: "#8B4513" },
  basto: { label: "Basto", symbol: "B", accentColor: "#228B22" },
  copa: { label: "Copa", symbol: "C", accentColor: "#DC143C" },
  oro: { label: "Oro", symbol: "O", accentColor: "#FFD700" },
}
```

**Key invariants to test:**
1. Deck has exactly 40 unique cards
2. Each suit has exactly 10 cards
3. `trucoValue(Ancho de Espada) > trucoValue(Ancho de Basto) > trucoValue(7 Espada) > ...`
4. Cards from same rank/suit are equal
5. Shuffle produces different order (probabilistic test)

---

## Risks

1. **Suit accent colors not defined** — Without card illustrations, accent colors are premature. Could add placeholders now and validate with actual art later.

2. **Truco ranking has edge cases** — The 7s are suit-dependent (7 Espada > 7 Oro > 7 Copa/Basto). The exact table of 40 card values must be verified against Argentine Truco rules — wrong values would break the entire game engine.

3. **i18n for rank names missing** — `jargon.ts` has suit labels but no rank labels (4, 5, 6, 7, 10, 11, 12). Card UI will need these eventually.

4. **Domain/test separation** — `rn-refactor` patterns are for UI. Domain tests follow standard jest-expo patterns. Need to ensure `src/domain/` doesn't accidentally import UI concerns.

---

## Ready for Proposal

**Yes** — with the following decisions to confirm with the user:

1. Should suit accent colors be added to the theme now (as placeholders), or deferred until card illustrations exist?
2. Should rank names (4, 5, 6, 7, 10, 11, 12) be added to `jargon.ts` now, or when card UI is built?
3. Confirm the full 40-card ranking table — particularly the 7-suit interactions and 3/2/1 relative ordering.

The domain model itself (types + Suits const + ranking map + deck factory) is low-risk and ready to propose.

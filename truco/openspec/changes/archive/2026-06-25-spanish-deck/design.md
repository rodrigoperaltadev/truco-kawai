# Design: Spanish Deck Model

## Technical Approach

Model the 40-card Spanish deck as a pure, framework-free domain in `src/domain/deck/`. Strict literal unions (`Suit`, `Rank`) back `readonly` tables. Truco strength resolves via explicit lookup (`SPECIAL_RANK` by `cardId`, `TIER_RANK` by `Rank`) — no switch chains — keeping the non-linear order and `copa-7 = basto-7` tie declarative. No React/theme inside `src/domain/`. Jargon and suit colors extend their existing modules; UI consumption stays deferred (proposal "Out of Scope").

## Architecture Decisions

| Decision | Choice | Rejected | Why |
|----------|--------|----------|-----|
| Ranking model | `SPECIAL_RANK[cardId] ?? TIER_RANK[rank]` tables merged by `trucoRank` | Nested `switch`; flat 40-entry map | Hierarchy is non-linear with a tie; tables = data, not control flow. Flat map duplicates tier values 30× and drifts. |
| Index safety | Total `??` resolver, never `!` or `as` | `SPECIAL_RANK[id]!`; cast | tsconfig sets `noUncheckedIndexedAccess` (every index read is `T \| undefined`); rn-refactor bans unsafe casts. |
| `deal` arity | Single `DealInput` object | Positional `deal(deck,3,2)` | Spec prose (2 args) vs scenarios (3 args) conflict; 3 positional args breaks rn-refactor "max 2 args → typed object". |
| `cardId` | Sole identity primitive `\`${suit}-${rank}\`` | Inline templates per call site | One source of truth for the `"espada-7"` format; keeps `SPECIAL_RANK` keys aligned with tests. |
| Shuffle | Fisher–Yates, copy-then-mutate, injectable `rng` | `.sort(() => Math.random()-0.5)` | Random-comparator sort is biased/non-uniform; injectable `rng` makes "no mutation" + permutation tests deterministic. |

## Data Flow

`createDeck()` → `Card[40]` → `shuffle(deck, rng?)` → reordered `Card[40]` → `deal({deck,handSize,playerCount})` → `{ hands, remaining }`. Independently, `trucoRank(card) = SPECIAL_RANK[cardId] ?? TIER_RANK[rank]` → `1..10`. Future UI reads labels from `jargon.suits`+`jargon.ranks` and colors from `theme.colors.suits`; domain imports neither.

## File Layout — `src/domain/deck/`

| File | Action | Exports |
|------|--------|---------|
| `types.ts` | Create | `Suit`, `Rank`, `Card`, `SuitMeta` |
| `suits.ts` | Create | `SUITS`, `SUIT_ORDER` |
| `ranks.ts` | Create | `RANKS` (source of `Rank`) |
| `card.ts` | Create | `cardId(card)` |
| `deck.ts` | Create | `createDeck`, `shuffle`, `deal`, `DealInput`, `DealResult` |
| `ranking.ts` | Create | `trucoRank` (+ private `SPECIAL_RANK`, `TIER_RANK`) |
| `index.ts` | Create | Barrel re-export of public API |

Outside domain: `jargon.ts` (add `ranks`, keep `suits`), `colors.ts` (add `suits`, extend `ThemeColors` via `typeof`). `tokens.ts`/`index.ts` unchanged — `colors` re-export surfaces `suits`. Tests: `__tests__/domain/{deck,ranking,jargon}.test.ts` + extend `__tests__/theme.test.ts`.

## Type Definitions & Contracts

```typescript
export type Suit = "espada" | "basto" | "copa" | "oro";
export type Rank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 10 | 11 | 12; // see Open Question
export type Card = Readonly<{ suit: Suit; rank: Rank }>;
export type SuitMeta = Readonly<{ label: string; accentColor: string }>;

export const SUIT_ORDER = ["espada", "basto", "copa", "oro"] as const;
export const SUITS: Readonly<Record<Suit, SuitMeta>> = {
  espada: { label: "Espada", accentColor: "#7B8FA1" },
  basto:  { label: "Basto",  accentColor: "#5A7A4A" },
  copa:   { label: "Copa",   accentColor: "#A0522D" },
  oro:    { label: "Oro",    accentColor: "#C8972A" },
};

export const RANKS = [1,2,3,4,5,6,7,10,11,12] as const; // Rank = typeof RANKS[number]
export function cardId(card: Card): string;              // `${suit}-${rank}`

export function createDeck(): ReadonlyArray<Card>;       // 40 unique
export function shuffle(deck: ReadonlyArray<Card>, rng?: () => number): Card[];
export type DealInput  = { deck: Card[]; handSize: number; playerCount: number };
export type DealResult = { hands: Card[][]; remaining: Card[] };
export function deal(input: DealInput): DealResult;      // RangeError if too small
export function trucoRank(card: Card): number;           // 1..10, total
```

**`SUITS`** keyed by `Suit`, each `{ label, accentColor }` — `label` mirrors `jargon.suits`, `accentColor` mirrors `theme.colors.suits` (one hierarchy source for future UI).

**`TRUCO_RANKING`** — `trucoRank` body, total under `noUncheckedIndexedAccess`:
```typescript
const SPECIAL_RANK: Record<string, number> = {       // by cardId
  "espada-4":1, "basto-4":2, "espada-7":3, "oro-7":4,
};
const TIER_RANK: Record<Rank, number> = {            // ordinary tiers (1/2/3 pending)
  3:5, 2:6, 12:7, 11:8, 10:9, 7:10, 6:11, 5:12, 4:13, 1:14,
};
export function trucoRank(card: Card): number {
  const special = SPECIAL_RANK[cardId(card)];
  if (special !== undefined) return special;
  return TIER_RANK[card.rank] ?? FALLBACK_TIER;       // ?? not ! (index widens to | undefined)
}
```
`copa-7`/`basto-7` are absent from `SPECIAL_RANK`, so both fall to `TIER_RANK[7]` → equal value (the spec tie).

## Jargon Extension

Add sibling `ranks: Record<Rank, string>` to `jargon as const`; `suits` untouched. Numeric `Rank` keys, labels per spec (`4 Ancho … 12 Rey`, plus `1,2,3` once rank set confirmed). `Record<Rank,string>` forces exhaustiveness.

## Theme Token Extension

Add `suits: { espada:"#7B8FA1", basto:"#5A7A4A", copa:"#A0522D", oro:"#C8972A" }` to `colors`. `ThemeColors = typeof colors` propagates it — `colors.suits.poker` becomes a compile error (type-safety scenario). `tokens.ts`/`index.ts` unchanged.

## Testing Strategy

| Area | Assertions | File |
|------|-----------|------|
| Deck | 40 cards, 10/suit, `Set(cardId)` size 40 | `domain/deck.test.ts` |
| Shuffle | all `cardId`s preserved; original `const` order unchanged (inject `rng`) | `domain/deck.test.ts` |
| Deal | `{handSize:3,playerCount:2}` → 34 remaining, no overlap; `RangeError` on short deck | `domain/deck.test.ts` |
| Ranking | specials = 1,2,3,4; 3s tie at 5; `copa-7==basto-7`; full-deck min 1 / no undefined | `domain/ranking.test.ts` |
| i18n | `ranks[4]==="Ancho"`; every `Rank` covered & non-empty; `suits.espada` still `"Espada"` | `domain/jargon.test.ts` |
| Tokens | `colors.suits.espada` non-empty hex; exactly 4 keys | extend `theme.test.ts` |

Type-level checks (5th suit, rank `8`/`9`) are enforced by `tsc --noEmit`, not runtime. Gate: `tsc --noEmit` + `yarn jest` (`**/__tests__/**/*.test.[jt]s?(x)`).

## Risks

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Wrong Truco order / 7-tie | Med | Fixtures for all 4 specials + assert `copa-7==basto-7` from full-deck sweep |
| Index-access `undefined` leaks | Med | `??` resolver + `Record<Rank,_>` exhaustiveness; no `!`/`as` |
| Token/jargon drift | Low | Add only in token/jargon modules; `typeof` exports keep types in sync |
| Rank-set ambiguity blocks tasks | Med | Open Question resolved before sdd-tasks |

## Migration / Rollout

No data migration — additive domain + token/jargon extension. Rollback: delete `src/domain/deck/`, revert `jargon.ranks` and `colors.suits`.

## Open Questions

- [ ] **Rank set (BLOCKING)** — spec names "ten ranks `4,5,6,7,10,11,12`", but that list is **7 values**, and the ranking references `any-3`/`any-2` (Tres/Dos) absent from it. `4 suits × 10 ranks = 40` only closes with `1,2,3,4,5,6,7,10,11,12` (no 8/9). Design adopts this true set; spec rank list must be corrected before sdd-tasks.
- [ ] **`deal` signature** — prose `deal(deck, handSize)` vs scenarios `deal(deck,3,2)`. Design uses `deal(input: DealInput)`. Confirm so scenarios are reworded.

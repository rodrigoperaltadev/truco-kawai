# Tasks: Spanish Deck Model

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~380–420 |
| 400-line budget risk | Medium |
| Chained PRs recommended | No |
| Suggested split | Single PR |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Medium

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Full implementation | PR 1 | Types, domain logic, jargon/tokens, tests |

---

## Phase 1: Domain Types

- [x] 1.1 Create `src/domain/deck/types.ts` — export `Suit = "espada" | "basto" | "copa" | "oro"`, `Rank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 10 | 11 | 12"`, `Card = Readonly<{ suit: Suit; rank: Rank }>`, `SuitMeta = Readonly<{ label: string; accentColor: string }>`
- [x] 1.2 Create `src/domain/deck/suits.ts` — export `SUIT_ORDER` as const tuple and `SUITS: Readonly<Record<Suit, SuitMeta>>` with label + accentColor per suit
- [x] 1.3 Create `src/domain/deck/ranks.ts` — export `RANKS = [1,2,3,4,5,6,7,10,11,12] as const` (derives `Rank` via `typeof RANKS[number]`)
- [x] 1.4 Create `src/domain/deck/card.ts` — export `cardId(card: Card): string` returning `"${suit}-${rank}"`

---

## Phase 2: Deck Factory & Helpers

- [x] 2.1 Create `src/domain/deck/deck.ts` — export `createDeck(): ReadonlyArray<Card>` (40 cards, 10 per suit, no duplicates)
- [x] 2.2 Create `src/domain/deck/deck.ts` — export `shuffle(deck: ReadonlyArray<Card>, rng?: () => number): Card[]` (Fisher–Yates, copy-only mutation, injectable rng, no mutation of original)
- [x] 2.3 Create `src/domain/deck/deck.ts` — export `DealInput = { deck: Card[]; handSize: number; playerCount: number }` and `DealResult = { hands: Card[][]; remaining: Card[] }`
- [x] 2.4 Create `src/domain/deck/deck.ts` — export `deal(input: DealInput): DealResult` (round-robin, default playerCount=2, throws RangeError when deck too short)
- [x] 2.5 Create `src/domain/deck/ranking.ts` — export `SPECIAL_RANK: Record<string, number>` (espada-4→1, basto-4→2, espada-7→3, oro-7→4) and `TIER_RANK: Record<Rank, number>` (3→5, 2→6, 12→7, 11→8, 10→9, 7→10, 6→11, 5→12, 4→13, 1→14)
- [x] 2.6 Create `src/domain/deck/ranking.ts` — export `trucoRank(card: Card): number` using `SPECIAL_RANK[cardId(card)] ?? TIER_RANK[card.rank]` (no `!`, no `as`; `copa-7`/`basto-7` tie at 10 via TIER_RANK[7])
- [x] 2.7 Create `src/domain/deck/index.ts` — barrel re-export of all public API (`Suit`, `Rank`, `Card`, `SuitMeta`, `SUITS`, `SUIT_ORDER`, `RANKS`, `cardId`, `createDeck`, `shuffle`, `deal`, `DealInput`, `DealResult`, `trucoRank`)

---

## Phase 3: Jargon Extension

- [x] 3.1 Extend `src/shared/i18n/jargon.ts` — add `ranks: Record<Rank, string>` with labels per spec (1→"Ancho", 2→"Dos", 3→"Tres", 4→"Cuatro", 5→"Cinco", 6→"Seis", 7→"Siete", 10→"Sota", 11→"Caballo", 12→"Rey"); keep existing `suits` record unchanged

---

## Phase 4: Theme Token Extension

- [x] 4.1 Extend `src/shared/theme/colors.ts` — add `suits: { espada: "#7B8FA1"; basto: "#5A7A4A"; copa: "#A0522D"; oro: "#C8972A" }` to `colors` const
- [x] 4.2 Update `ThemeColors` type in `colors.ts` to `typeof colors` (propagates `suits` type-safety; accessing `colors.suits.poker` is a compile error)

---

## Phase 5: Tests

- [x] 5.1 Create `__tests__/domain/deck.test.ts` — test `createDeck`: 40 cards, 10/suit, no duplicates (Set of cardIds)
- [x] 5.2 Create `__tests__/domain/deck.test.ts` — test `shuffle`: preserves all cardIds, original array reference unchanged (inject deterministic `rng`)
- [x] 5.3 Create `__tests__/domain/deck.test.ts` — test `deal`: 3 cards to 2 players → 2 hands of 3 + 34 remaining, no overlap; throw `RangeError` on short deck
- [x] 5.4 Create `__tests__/domain/ranking.test.ts` — test `trucoRank`: espada-4→1, basto-4→2, espada-7→3, oro-7→4; two 3s tie; `copa-7 === basto-7`; full-deck min=1, max=14, no undefined
- [x] 5.5 Create `__tests__/domain/jargon.test.ts` — test `jargon.ranks[1]==="Ancho"`, all `Rank` keys covered & non-empty, `jargon.suits.espada==="Espada"` unchanged
- [x] 5.6 Create `__tests__/domain/tokens.test.ts` — test `colors.suits.espada` non-empty hex, exactly 4 keys, type-safe access to nonexistent suit key is compile error

---

## Phase 6: Verification

- [x] 6.1 Run `yarn typecheck` — confirm zero TypeScript errors
- [x] 6.2 Run `yarn test` — confirm all new tests pass
- [x] 6.3 Run `yarn lint` — confirm no lint errors
- [x] 6.4 Run `yarn web:export` — confirm build succeeds

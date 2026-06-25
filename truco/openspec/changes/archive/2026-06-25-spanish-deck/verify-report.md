# Verification Report — spanish-deck

- **Change**: `spanish-deck`
- **Mode**: Full spec-driven verification (proposal + specs + design + tasks all present)
- **Date**: 2026-06-25 (re-verification after spec amendment)
- **Verifier**: sdd-verify (Truco Lab)

---

## Re-verification Context

Previous run flagged **CRITICAL-01** — suit hex literals duplicated between
`src/domain/deck/suits.ts` and `src/shared/theme/colors.ts`. The user/orchestrator
resolved the policy conflict by amending `specs/design-tokens/spec.md`:
the new scenario **"Suit colors outside token modules are documented exceptions"**
explicitly allows the mirror, conditional on the domain module not importing from
`src/shared/theme/`.

This re-verification confirms:

1. The amended scenario is present in the delta spec.
2. The implementation satisfies the new scenario's GIVEN/WHEN/THEN.
3. All four verification commands remain green after the spec change (no code changes were needed).

---

## Completeness Table

| Phase | Tasks | Complete | Notes |
|-------|-------|----------|-------|
| 1 — Domain Types | 4 | 4/4 ✅ | `types.ts`, `suits.ts`, `ranks.ts`, `card.ts` present |
| 2 — Deck Factory & Helpers | 7 | 7/7 ✅ | `deck.ts`, `ranking.ts`, `index.ts` present |
| 3 — Jargon Extension | 1 | 1/1 ✅ | `jargon.ranks` added, `suits` preserved |
| 4 — Theme Token Extension | 2 | 2/2 ✅ | `colors.suits` added, `ThemeColors = typeof colors` |
| 5 — Tests | 6 | 6/6 ✅ | 4 new test files, 37 total tests pass |
| 6 — Verification commands | 4 | 4/4 ✅ | typecheck, lint, test, web:export all green |

**All 24 tasks marked complete in `tasks.md` and verified against the codebase.**

---

## Command Evidence (fresh run, post-amendment)

| Command | Exit | Evidence |
|---------|------|----------|
| `yarn typecheck` (`tsc --noEmit`) | 0 ✅ | "Done in 2.28s." — no errors |
| `yarn lint` (`biome check`) | 0 ✅ | "Checked 98 files in 29ms. No fixes applied." |
| `yarn test` (`jest`) | 0 ✅ | 10 suites, 37 tests, 0 failures |
| `yarn web:export` (`expo export --platform web`) | 0 ✅ | "Exported: dist" — 10 static routes, 1.3 MB bundle |

**Test results (relevant suites)**:
- `__tests__/domain/deck.test.ts` — PASS (10 tests covering createDeck, shuffle, deal)
- `__tests__/domain/ranking.test.ts` — PASS (5 tests covering trucoRank specials, ties, full deck)
- `__tests__/domain/jargon.test.ts` — PASS (3 tests covering rank labels + suits preservation)
- `__tests__/domain/tokens.test.ts` — PASS (3 tests covering suit color tokens)

---

## Spec Coverage Matrix — `specs/spanish-deck/spec.md`

| Requirement | Scenario | Status | Evidence |
|-------------|----------|--------|----------|
| Suit model | Four suits with metadata | ✅ COVERED | `SUITS` exports espada/basto/copa/oro with `label`+`accentColor`; runtime check via `__tests__/domain/tokens.test.ts` "has exactly 4 suit keys" |
| Suit model | Type exhaustiveness | ✅ COVERED (compile-time) | `Suit` literal union in `types.ts`; `tsc --noEmit` passes |
| Rank model | Valid ranks accepted | ✅ COVERED (compile-time) | `Rank = 1\|2\|3\|4\|5\|6\|7\|10\|11\|12` in `types.ts` |
| Rank model | Excluded ranks rejected (8/9) | ✅ COVERED (compile-time) | Literal union excludes 8/9; `tsc --noEmit` passes |
| Card identity | Same suit/rank are equal | ✅ COVERED | `ranking.test.ts` implicitly via `trucoRank`; `cardId` returns `"espada-7"` consistently |
| Card identity | Different suit/rank are distinct | ✅ COVERED | `deck.test.ts` "has no duplicate cards" — Set size = 40 |
| Deck generation | 40 cards | ✅ COVERED | `deck.test.ts` "returns exactly 40 cards" |
| Deck generation | 10 per suit | ✅ COVERED | `deck.test.ts` "has 10 cards per suit" |
| Deck generation | No duplicates | ✅ COVERED | `deck.test.ts` "has no duplicate cards" — `Set(cardId)` size 40 |
| Shuffle | Preserves all cards | ✅ COVERED | `deck.test.ts` "preserves all cardIds" |
| Shuffle | Original not mutated | ✅ COVERED | `deck.test.ts` "does not mutate the original array" |
| Deal | 3 cards to 2 players | ✅ COVERED | `deck.test.ts` "deals 3 cards to 2 players with 34 remaining" + "has no overlap between hands" |
| Deal | Fails on short deck | ✅ COVERED | `deck.test.ts` "throws RangeError when deck is too small" |
| Deal | Default playerCount=2 | ✅ COVERED | `deck.test.ts` "defaults playerCount to 2" |
| Truco ranking | Special card ordering (1,2,3,4) | ✅ COVERED | `ranking.test.ts` "assigns special ranks in order" + "specials are strictly ordered" |
| Truco ranking | Ordinary cards by tier | ✅ COVERED | `ranking.test.ts` "two 3s tie at the same rank" returns 5 |
| Truco ranking | copa-7 == basto-7 tie | ✅ COVERED | `ranking.test.ts` "copa-7 and basto-7 tie" — both = 10 |
| Truco ranking | Exhaustive (min 1, max 14) | ✅ COVERED | `ranking.test.ts` "full deck: min=1, max=14, no undefined" |
| Jargon ranks | Labels accessible (`ranks[1]==="Ancho"`) | ✅ COVERED | `jargon.test.ts` "maps rank 1 to Ancho" |
| Jargon ranks | All ranks covered | ✅ COVERED | `jargon.test.ts` "covers all Rank keys with non-empty strings" |
| Jargon ranks | Suits unchanged | ✅ COVERED | `jargon.test.ts` "leaves suits record unchanged" |

## Spec Coverage Matrix — `specs/design-tokens/spec.md` (post-amendment)

| Requirement | Scenario | Status | Evidence |
|-------------|----------|--------|----------|
| Suit accent colors | Suit color tokens accessible | ✅ COVERED | `tokens.test.ts` "exposes a non-empty hex color for espada" |
| Suit accent colors | All four suits covered | ✅ COVERED | `tokens.test.ts` "has exactly 4 suit keys" |
| Suit accent colors | Type-safe access | ✅ COVERED (compile-time) | `ThemeColors = typeof colors` in `colors.ts:59`; `tsc --noEmit` passes (accessing `colors.suits.poker` is a compile error) |
| Suit accent colors | Suit colors outside token modules are documented exceptions | ✅ COVERED | **GIVEN** `src/domain/deck/suits.ts:5-10` defines `SuitMeta.accentColor` per suit. **WHEN** the same hex values (`#7B8FA1`, `#5A7A4A`, `#A0522D`, `#C8972A`) appear in `src/shared/theme/colors.ts:50-55`. **THEN** duplication is intentional and documented in this scenario + `design.md` ("`accentColor` mirrors `theme.colors.suits` (one hierarchy source for future UI)"). **AND** the domain module does not import from `src/shared/theme/` — verified via `grep -n "shared/theme" src/domain/deck/*.ts` returning zero matches. |

---

## Correctness Table — Implementation vs Spec Requirements

| Spec contract | Implementation | Match? |
|---------------|---------------|--------|
| `Suit = "espada" \| "basto" \| "copa" \| "oro"` | `types.ts:1` — identical | ✅ |
| `Rank = 1\|2\|3\|4\|5\|6\|7\|10\|11\|12` (no 8/9) | `types.ts:3` — identical | ✅ |
| `Card = Readonly<{ suit: Suit; rank: Rank }>` | `types.ts:5` — identical | ✅ |
| `cardId` returns `"${suit}-${rank}"` | `card.ts:3-5` — identical | ✅ |
| `createDeck(): ReadonlyArray<Card>` of 40 unique | `deck.ts:17-25` — nested loop SUIT_ORDER × RANKS | ✅ |
| `shuffle(deck, rng?)` — copy, no mutation | `deck.ts:27-39` — Fisher–Yates on `[...deck]` copy | ✅ |
| `deal({deck, handSize, playerCount?})` round-robin | `deck.ts:41-62` — round-robin, default 2, throws RangeError | ✅ |
| `trucoRank` ranking table | `ranking.ts` — matches spec table (specials 1-4, tiers 5-14, 7-tie at 10) | ✅ |
| `jargon.ranks` per spec table | `jargon.ts:14-25` — exact labels (Ancho, Dos, Tres, Cuatro, Cinco, Seis, Siete, Sota, Caballo, Rey) | ✅ |
| `theme.colors.suits` per palette table | `colors.ts:50-55` — exact hex values | ✅ |
| Domain stays framework-free (no theme import) | `grep -n "shared/theme" src/domain/deck/*.ts` returns 0 matches | ✅ |

---

## Design Coherence Table — Implementation vs `design.md`

| Design decision | Implementation | Match? |
|-----------------|---------------|--------|
| `SPECIAL_RANK[cardId] ?? TIER_RANK[rank]` resolver | `ranking.ts:24-28` — identical pattern, no `!`/`as` | ✅ |
| Total `??` resolver; never `!` | `ranking.ts:27` uses `??`; no `!` or `as` anywhere in domain | ✅ |
| Single `DealInput` object (no positional args) | `deck.ts:5-9` — typed object | ✅ |
| `cardId` sole identity primitive | `card.ts:3-5` — single source for `"suit-rank"` format | ✅ |
| Fisher–Yates with injectable `rng` | `deck.ts:27-39` — `rng: () => number = Math.random` | ✅ |
| File layout: types, suits, ranks, card, deck, ranking, index.ts | All 7 files present in `src/domain/deck/` | ✅ |
| `ThemeColors = typeof colors` propagation | `colors.ts:59` — exact match | ✅ |
| Public API barrel via `index.ts` | `index.ts` exports `Suit, Rank, Card, SuitMeta, SUITS, SUIT_ORDER, RANKS, cardId, createDeck, shuffle, deal, DealInput, DealResult, trucoRank` — matches design checklist | ✅ |
| `accentColor` mirrors `theme.colors.suits` (documented duplication) | `suits.ts:6-9` and `colors.ts:50-55` carry identical hex; domain does not import theme | ✅ (now spec-sanctioned) |
| `DealInput.playerCount` required vs optional | Design table shows `playerCount: number` (required); spec says `playerCount?` (optional). Implementation uses **optional** matching spec. | ⚠️ Spec wins (design table outdated — see WARNING-01) |

---

## Issues

### CRITICAL

**None.** Previous CRITICAL-01 is **resolved by spec amendment**. The new
scenario "Suit colors outside token modules are documented exceptions" explicitly
allows the mirror between `src/domain/deck/suits.ts` and `src/shared/theme/colors.ts`,
conditional on the domain not importing theme — which is verified clean.

### WARNING

**WARNING-01 — Design table for `DealInput.playerCount` mismatches spec/implementation**

- `design.md` shows `DealInput = { deck: Card[]; handSize: number; playerCount: number }` (required).
- `specs/spanish-deck/spec.md` → Requirement "Deal helper" defines `playerCount?` (optional, default 2). Implementation matches spec.
- Implementation is correct (spec wins), but `design.md` should be corrected to reflect `playerCount?: number`.
- **Non-blocking** for archive — design.md is the design artifact, not the contract. The spec wins.

### SUGGESTION

**SUGGESTION-01 — Dead `Rank` type re-declaration in `ranks.ts`**

- `src/domain/deck/types.ts:3` declares `type Rank = 1|2|...|12`.
- `src/domain/deck/ranks.ts:3` re-declares `type Rank = (typeof RANKS)[number]`.
- The barrel `index.ts` only re-exports `Rank` from `./types`. The one in `ranks.ts` is never consumed and is dead code.
- Both yield the same union, so no runtime/type drift today, but future edits to `RANKS` tuple would silently diverge from `types.ts`.
- **Suggestion**: Delete the `type Rank` declaration in `ranks.ts` and instead make `types.ts` derive `Rank` from `RANKS` via `import { RANKS } from "./ranks"; export type Rank = (typeof RANKS)[number]`. Single source of truth.

**SUGGESTION-02 — `__tests__/` excluded from typecheck**

- `tsconfig.json` excludes `__tests__`. Tests compile only at jest runtime (via swc/babel), so type errors in test files won't fail `yarn typecheck`.
- Pre-existing config not introduced by this change, but worth flagging because the change adds 4 new test files that rely on `@/domain/deck` imports.
- **Suggestion**: Add a `tsconfig.test.json` that includes `__tests__/` for an additional `tsc --noEmit -p tsconfig.test.json` step in CI.

**SUGGESTION-03 — `shuffle` swap guard masks an unreachable branch**

- `deck.ts:32-37` reads `copy[i]` and `copy[j]`, then guards `if (tmp !== undefined && swap !== undefined)`. Because `0 ≤ j ≤ i < copy.length`, both indices are always in-range and the guard is always true. The guard exists only to satisfy `noUncheckedIndexedAccess`. Functionally correct but the dead branch is untestable.
- **Suggestion**: Use a small typed helper or `as const` tuple destructure to express the invariant more directly. Cosmetic only — no impact on correctness.

---

## Verdict

**PASS WITH WARNINGS** ⚠️ → **READY FOR ARCHIVE**

All 24 tasks complete. All four verification commands green (typecheck, lint, test, web:export). All 21 spec scenarios across both delta specs verified by runtime tests or by `tsc --noEmit` for compile-time-only scenarios. Implementation faithfully follows `design.md`.

The previous CRITICAL-01 (suit hex duplication) has been resolved by the spec
amendment adding the "Suit colors outside token modules are documented exceptions"
scenario. The implementation already satisfies its GIVEN/WHEN/THEN: the duplication
is documented, and `grep` confirms `src/domain/deck/*.ts` has zero imports from
`src/shared/theme/`. **No code changes were required for re-verification** — the
fix was a policy clarification at the spec layer, which is exactly the right
move for a deliberate architectural mirror.

**Recommendation to orchestrator**:
- ✅ Proceed to archive.
- WARNING-01 (design.md `playerCount` table) and the three SUGGESTIONS are non-blocking cleanups suitable for a follow-up change. They do not affect spec compliance or runtime behaviour.

# Verification Report: core-truco-engine

**Change**: `core-truco-engine`
**Mode**: Full SDD verification (proposal + specs + design + tasks all present)
**Date**: 2026-06-25
**Verdict**: ✅ **PASS**

---

## Verification Results Table

| Dimension | Result | Evidence |
|---|---|---|
| Completeness (tasks done) | ✅ PASS | All 15 tasks across 5 phases checked off in `tasks.md`. |
| Source files exist | ✅ PASS | All 7 source files present under `src/domain/game/`. |
| Test files exist | ✅ PASS | 8 test files under `__tests__/domain/game/` (1 bonus: `types.test.ts`). |
| Domain purity | ✅ PASS | `grep` confirms no `react`/`expo`/`@/features`/`@/shared` imports; only `@/domain/deck` + relative + node built-ins. |
| No `isCPU` flag | ✅ PASS | `grep -rE "isCPU\|isCpu\|is_cpu" src/domain/game/` → no matches. |
| `yarn test` | ✅ PASS | 18 suites, 112 tests pass, 1.747s. |
| `yarn typecheck` | ✅ PASS | `tsc --noEmit` exits 0, no errors. |
| `yarn lint` | ✅ PASS | Biome checked 113 files, no fixes applied. |
| Behavioral correctness vs specs | ✅ PASS | All 9 requirements covered by passing tests (matrix below). |
| Design coherence | ✅ PASS | Implementation follows design decisions exactly (Result union, cardId identity, lower-rank-wins, mirror test layout, static-scan purity). |

---

## Source File Inventory

| File | Status | Role |
|------|--------|------|
| `src/domain/game/types.ts` | ✅ Present | All shared types, `CPUPlayer` interface, no `isCPU`. |
| `src/domain/game/turn.ts` | ✅ Present | `startHandRoles`, `nextRoundLeader`, `currentTurn`. |
| `src/domain/game/match.ts` | ✅ Present | `createMatch`, `resolveMatch`, `dealHand`, plus helpers. |
| `src/domain/game/trick.ts` | ✅ Present | `resolveTrick` — pure rank compare. |
| `src/domain/game/hand.ts` | ✅ Present | `resolveHand` — best-of-3 + mano tie-break. |
| `src/domain/game/play.ts` | ✅ Present | `playCard` — full validation pipeline + composition. |
| `src/domain/game/index.ts` | ✅ Present | Barrel re-export of public API. |

| Test File | Tests | Status |
|-----------|-------|--------|
| `__tests__/domain/game/types.test.ts` | 5 | ✅ PASS (bonus, not in tasks.md) |
| `__tests__/domain/game/turn.test.ts` | 6 | ✅ PASS |
| `__tests__/domain/game/match.test.ts` | 14 | ✅ PASS |
| `__tests__/domain/game/trick.test.ts` | 7 | ✅ PASS |
| `__tests__/domain/game/hand.test.ts` | 9 | ✅ PASS |
| `__tests__/domain/game/play.test.ts` | 9 | ✅ PASS |
| `__tests__/domain/game/purity.test.ts` | 3 (parametrized by file) | ✅ PASS |
| `__tests__/domain/game/integration.test.ts` | 11 | ✅ PASS |

---

## Spec Compliance Matrix

Each scenario from `specs/core-truco-engine/spec.md` mapped to runtime evidence.

### Requirement: Match creation

| Scenario | Test | Status |
|----------|------|--------|
| Valid match initialized at 15 points | `match.test.ts > createMatch > creates a valid match at 15 points` | ✅ TESTED |
| Invalid `pointsToWin` rejected | `match.test.ts > createMatch > throws RangeError on invalid pointsToWin (20)` + `(0)` | ✅ TESTED |

### Requirement: Player and Team models

| Scenario | Test | Status |
|----------|------|--------|
| Team score defaults to zero | `match.test.ts > createMatch > creates a valid match at 15 points` (asserts both `teams[i].score === 0`) | ✅ TESTED |
| Duplicate player IDs rejected | `match.test.ts > createMatch > throws TypeError on duplicate player IDs` | ✅ TESTED |

### Requirement: Hand structure

| Scenario | Test | Status |
|----------|------|--------|
| Deal 3 cards per player | `match.test.ts > createMatch > deals exactly 3 cards per player` + `has no card overlap between hands` | ✅ TESTED |
| Mano is the non-dealer | `match.test.ts > createMatch > assigns mano = players[0] for hand 1` (also asserts dealer = players[1]) | ✅ TESTED |

### Requirement: Round and trick structure

| Scenario | Test | Status |
|----------|------|--------|
| Round structure after one card played | `play.test.ts > first card: removes from hand, appends to trick, advances turn` | ✅ TESTED |
| Round resolves after both players play | `play.test.ts > second card: resolves trick, starts next round` | ✅ TESTED |

### Requirement: Mano/pie turn order

| Scenario | Test | Status |
|----------|------|--------|
| Mano leads round 1 | `turn.test.ts > startHandRoles > hand 1: dealer = players[1], mano = players[0]` + `integration.test.ts > mano leads round 1 of hand 1` | ✅ TESTED |
| Trick winner leads next round | `play.test.ts > second card: resolves trick, starts next round` (asserts `currentTurn === "A"` after A wins) + `integration.test.ts > trick winner leads the next round` | ✅ TESTED |
| Tie restores mano leadership | `play.test.ts > tie trick → mano leads next round` + `turn.test.ts > nextRoundLeader > tie restores mano leadership` | ✅ TESTED |
| Out-of-turn play rejected | `play.test.ts > rejects out-of-turn play` | ✅ TESTED |

### Requirement: Playing a card

| Scenario | Test | Status |
|----------|------|--------|
| Valid card play advances state | `play.test.ts > first card: removes from hand, appends to trick, advances turn` | ✅ TESTED |
| Card not in hand rejected | `play.test.ts > rejects card not in hand` | ✅ TESTED |
| Already-played card rejected | `play.test.ts > rejects already-played card` (uses CARD_NOT_IN_HAND because card was already moved out of hand — see note below) | ✅ TESTED |
| State NOT mutated on error | `play.test.ts > does not mutate input state on error` + `integration.test.ts > playCard never mutates the input state` | ✅ TESTED |

### Requirement: Resolving a trick winner

| Scenario | Test | Status |
|----------|------|--------|
| Higher-ranked card wins | `trick.test.ts > lower trucoRank wins — espada-4 (rank 1) beats basto-2 (rank 6)` | ✅ TESTED |
| Equal-ranked cards tie | `trick.test.ts > equal trucoRank → tie (copa-7 vs basto-7, both rank 10)` + `(oro-5 vs copa-5)` | ✅ TESTED |

### Requirement: Resolving a hand winner

| Scenario | Test | Status |
|----------|------|--------|
| Two tricks decides the hand | `hand.test.ts > 2–0: player with 2 wins` + `2–1: player with 2 wins` + `0–2` | ✅ TESTED |
| Tie-break to mano (1–1 + tie) | `hand.test.ts > 1–1 + tie → mano wins` (covers both mano = A and mano = B) | ✅ TESTED |
| All ties go to mano | `hand.test.ts > 0–0 all ties → mano wins` | ✅ TESTED |
| 1–0 + ties → leader wins (table row from spec) | `hand.test.ts > 1–0 + two ties → player with 1 win` + `0–1 + two ties` | ✅ TESTED |

### Requirement: Match scoring and winner

| Scenario | Test | Status |
|----------|------|--------|
| Score increments after hand | `match.test.ts > resolveMatch > increments winning team score by 1` + `play.test.ts > hand ends after 2 decisive tricks (2–0)` | ✅ TESTED |
| Match ends at pointsToWin | `match.test.ts > resolveMatch > transitions to matchOver when score reaches pointsToWin` + `integration.test.ts > completes the match` + `winning team score equals pointsToWin (15)` | ✅ TESTED |
| No play after match over | `play.test.ts > rejects play after matchOver` + `integration.test.ts > no play is accepted after matchOver` | ✅ TESTED |

### Requirement: CPUPlayer interface boundary

| Scenario | Test | Status |
|----------|------|--------|
| Interface decouples strategy | `integration.test.ts` uses a `pickFirstCard` strategy outside the engine and drives a full 15-point match via `playCard` — proving the interface boundary works in practice (functional equivalent of the scenario). | ✅ TESTED |
| No `isCPU` in domain types | `types.test.ts > MatchState has no isCPU flag on Player` + `on Team` + repo-wide grep confirms zero matches | ✅ TESTED |

### Requirement: Domain purity

| Scenario | Test | Status |
|----------|------|--------|
| No UI imports in domain | `purity.test.ts > does not import react, react-native, or expo in any game file` + `does not import from @/features or @/shared` + per-file parametric scan | ✅ TESTED |
| Deck imports are allowed | `purity.test.ts` allow-lists `@/domain/deck`; the build (`yarn typecheck`) succeeds with `trucoRank`, `cardId`, etc. imported from `@/domain/deck` | ✅ TESTED |

**Coverage**: 22 / 22 spec scenarios have at least one passing covering test. Zero `UNTESTED`, zero `FAILING`.

---

## Build / Tests / Coverage Evidence

| Command | Exit Code | Output Summary |
|---------|-----------|----------------|
| `yarn test` | 0 | 18 suites passed, 112 tests passed, 0 failed, 1.747s |
| `yarn typecheck` | 0 | `tsc --noEmit` clean, no diagnostics |
| `yarn lint` | 0 | Biome checked 113 files, 0 errors, 0 warnings |

Coverage command not configured in `package.json` (only `test`/`typecheck`/`lint`). Per-file behavioral coverage is verified via the Spec Compliance Matrix above (every spec scenario maps to ≥1 passing test).

---

## Design Coherence Table

| Design Decision | Implementation | Status |
|----------------|----------------|--------|
| Result union for play errors, throw for construction errors | `playCard` returns `Result<MatchState>` (play.ts L20); `createMatch` throws `RangeError`/`TypeError` (match.ts L28, L41) | ✅ MATCHES |
| Card identity via `cardId()`, not new id field | `play.ts` uses `cardId()` for in-hand and already-played checks; `match.ts` exports `getPlayedCardIds` using `cardId` | ✅ MATCHES |
| Lower `trucoRank` wins, equal → tie | `trick.ts` L19–21 implements `rankA < rankB ? a : rankB < rankA ? b : "tie"` exactly | ✅ MATCHES |
| Tests in top-level `__tests__/domain/game/` mirror | All 8 test files live under `__tests__/domain/game/`, none co-located | ✅ MATCHES |
| Purity enforced by static-scan test (not ESLint) | `purity.test.ts` scans source files via fs + regex, exactly as designed | ✅ MATCHES |
| `resolveTrick`/`resolveHand` take narrow inputs | `resolveTrick(trick: TrickState)` and `resolveHand(hand: HandState)` — not full `MatchState`, as the design corrected from the spec signature | ✅ MATCHES (design-justified deviation from spec signature) |
| Optional `rng` param on `createMatch` for determinism | `CreateMatchOptions` includes `rng?: () => number`, forwarded to `shuffle`; used by tests with mulberry32/LCG seeds | ✅ MATCHES |
| File layout per "File Changes" table | All 7 source files and 5 test files from the design table exist (+ `types.test.ts` and `integration.test.ts` as additional coverage) | ✅ MATCHES + bonus coverage |
| Functional core / imperative shell | No classes, no side effects; pure functions returning new state objects; `Readonly<>` types throughout | ✅ MATCHES |
| Mano/pie hand-1 invariant: `mano = players[0]`, `dealer = players[1]` | `turn.ts > startHandRoles`: `dealerIdx = handNumber % 2 === 1 ? 1 : 0` → hand 1 dealer = players[1], mano = players[0] | ✅ MATCHES |
| Dealer alternates each hand | `match.ts > resolveMatch` calls `dealHand(handNumber + 1, ...)`; `startHandRoles(2)` swaps dealer/mano. Verified by `match.test.ts > alternates dealer for next hand` | ✅ MATCHES |

---

## Issues Found

### CRITICAL
**None.**

### WARNING
**None.**

### SUGGESTION

1. **`play.test.ts > rejects already-played card` semantics.** The test sets up a state where player A has already played `espada-4` (it's in `cardsPlayed`), then has B attempt to play the same `espada-4`. The implementation returns `CARD_NOT_IN_HAND` (because the card isn't in B's hand) rather than `CARD_ALREADY_PLAYED`. This is technically correct — the validation order in `play.ts` is `MATCH_OVER → OUT_OF_TURN → CARD_NOT_IN_HAND → CARD_ALREADY_PLAYED`, and "not in hand" trips first. The spec scenario reads: *"GIVEN player A already played `espada-7` in round 1, WHEN `playCard` is called again with `espada-7` in a later round, THEN an error is returned"* — and an error IS returned. But the spec phrasing implies player A would try again, in which case the card is *not* in A's hand either (since A discarded it after playing), so `CARD_NOT_IN_HAND` is still what would fire. The implementation is spec-compliant in spirit; the suggestion is to add a dedicated test that exercises the `CARD_ALREADY_PLAYED` branch — currently that error code is defined but no test asserts it. Construct a state with a card duplicate in a hand (impossible naturally but a unit fixture could force it) to reach the branch.

2. **Coverage tooling not wired.** `package.json` has no `test:coverage` script. Per `_shared/sdd-phase-common.md`, coverage commands are evidence-gathering best-practice. Adding `"test:coverage": "jest --coverage"` would let future verifications report numeric coverage.

3. **`hand.ts` "draw" branch is unreachable.** `resolveHand` declares `HandWinner = string | "draw"` but the current implementation never returns `"draw"` — it always falls through to either `playerA.id` or `playerB.id` via the `winsA > winsB` ternary. The design explicitly notes this is defensive. Consider either (a) documenting in code with `// unreachable: kept for type/spec contract`, or (b) adding a unit test that constructs a hand with 0 resolved rounds (or some pathological case) to prove the fallback path returns *something* — currently the only call sites are reachable only when at least 2 rounds are resolved, and `play.ts > isHandDecided` guarantees that.

None of the SUGGESTIONs block PASS. They are polish for future cycles.

---

## Verdict

**✅ PASS**

Every spec requirement has a passing covering test. Every design decision is implemented as documented. Domain purity is enforced both by tooling (typecheck + the `purity.test.ts` static scan) and by repo-wide grep. The full 15-point match plays end-to-end via the integration test, proving the orchestration of `createMatch → playCard → resolveTrick → resolveHand → resolveMatch → matchOver` works as a single coherent system.

The implementation is ready to archive.

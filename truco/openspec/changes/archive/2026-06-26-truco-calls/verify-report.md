# Verification Report — `truco-calls`

- **Change**: `truco-calls`
- **Branch**: `feature/truco-calls-integration`
- **Mode**: full SDD (proposal + spec + design + tasks)
- **Persistence**: openspec
- **Date**: 2026-06-26

---

## Completeness — Tasks

| Phase | Implemented | Marked in `tasks.md` | Status |
|-------|-------------|----------------------|--------|
| 1 — Foundation (types + `calls.ts`) | YES | ❌ all 10 still `[ ]` | CRITICAL — bookkeeping gap |
| 2 — Integration (`play.ts`, `match.ts`, `index.ts`) | YES | ✅ all 6 `[x]` | OK |
| 3 — Tests (`calls.test.ts`, fixtures, integration) | 20 / 21 | ❌ all 21 still `[ ]` | CRITICAL — bookkeeping gap + 1 missing test |
| 4 — Cleanup / Polish | partial | ❌ all 3 still `[ ]` | WARNING (see below) |

**Findings**:
- Phase 1 (10 tasks) and Phase 3 (21 tasks) are fully (or near-fully) implemented but every checkbox is still unchecked in `openspec/changes/truco-calls/tasks.md`. Per sdd-verify contract, unchecked implementation tasks block archive readiness.
- One genuine test gap: task **3.21** (`florEnabled` flag → `INVALID_CALL_LEVEL`) has no covering test in `__tests__/domain/game/`. The behavior is type-enforced (`CallType` union excludes `flor`), so a runtime call with a forced cast would still fall through to the `INVALID_CALL_LEVEL` branch, but no test asserts this.
- Phase 4 cleanup is partially satisfied: full test suite passes (4.1 ✔), purity test covers `calls.ts` automatically (4.2 ✔), exports are present (4.3 ✔). Only the checkboxes are missing.

---

## Build / Tests / Lint Evidence

| Command | Result |
|---------|--------|
| `npm test -- __tests__/domain/game` | ✅ 9 suites, **119 tests passed**, 0 failed (1.1 s) |
| `npm run typecheck` (`tsc --noEmit`) | ✅ clean, 0 errors |
| `npm run lint` (Biome) | ❌ **3 formatter errors** — all auto-fixable (`biome format --write`) |

### Lint detail
1. `src/domain/game/calls.ts` — type import block should be inlined on one line.
2. `__tests__/domain/game/match.test.ts` — `import { emptyCallState }` should be sorted before `import type { HandState, RoundState }`.
3. `__tests__/domain/game/play.test.ts` — `import { emptyCallState }` should be sorted before `import { playCard }`.

These are cosmetic ordering issues, not correctness defects. Single command resolves them: `npx biome check --write src __tests__`.

---

## Spec Compliance Matrix

| Requirement | Scenario | Covering test(s) | Verdict |
|---|---|---|---|
| Call type hierarchy | Truco issued with no prior call | `makeCall — success / mano calls truco…` | ✅ PASSED |
| Call type hierarchy | Retruco requires accepted Truco | `makeCall — success / escalation` + `nextLevel` | ✅ PASSED |
| Call type hierarchy | Call level skipping rejected | `makeCall — validations / rejects level skip` | ✅ PASSED |
| Call type hierarchy | Vale Cuatro requires accepted Retruco | `makeCall — validations / rejects vale_cuatro with no accepted retruco` | ✅ PASSED |
| Call state model | Initial call state is null | `dealHand — callState reset / initializes callState with empty values` | ✅ PASSED |
| Call state model | History records every action | `call history / full sequence truco→accept→retruco→reject` (3 entries before hand reset; 4th written then reset on reject) | ✅ PASSED |
| Turn-bound call rules | Off-turn call rejected | `makeCall — validations / rejects off-turn call` | ✅ PASSED |
| Turn-bound call rules | Call during pending call rejected | `makeCall — validations / rejects call when another call is already pending` | ✅ PASSED |
| Turn-bound call rules | Turn transfers to opponent after call | `makeCall — success / mano calls truco…` (`currentTurn === "B"`) | ✅ PASSED |
| Call timing | Mano calls before playing round 1 | `playCard — call interaction / call timing: mano can call before playing in round 1` | ✅ PASSED |
| Call timing | Opponent calls after mano plays (same round) | `playCard — call interaction / call timing: opponent can call after mano plays` | ✅ PASSED |
| Call timing | Call after own card in round rejected | `makeCall — validations / rejects call when caller already played in current trick` | ✅ PASSED |
| Block card play while pending | Card play blocked during pending call | `playCard — validations / rejects play when a call is pending (CALL_PENDING)` + priority test | ✅ PASSED |
| Block card play while pending | Play resumes after call accepted | `playCard — call interaction / blocks play while call is pending, resumes after accept` | ✅ PASSED |
| Block card play while pending | Play resumes after call rejected (hand ends) | `Integration / full escalation: truco accepted, retruco rejected…` (next hand dealt, `handNumber === 2`) | ✅ PASSED |
| Accept call and escalation | Responder accepts call | `acceptCall / accepts call: sets status accepted…` | ✅ PASSED |
| Accept call and escalation | Caller escalates after acceptance | `makeCall — success / escalation: retruco after accepted truco` | ✅ PASSED |
| Reject call and award points | Reject truco with no prior level → 1 pt | `rejectCall / reject truco (no prior level): caller team gets 1 pt, hand ends` | ✅ PASSED |
| Reject call and award points | Reject retruco → 2 pts | `rejectCall / reject retruco (accepted truco): caller team gets 2 pts` | ✅ PASSED |
| Reject call and award points | Reject vale cuatro → 3 pts | `rejectCall / reject vale_cuatro (accepted retruco): caller team gets 3 pts` | ✅ PASSED |
| Call history in hand state | History entry on issue | covered by `makeCall — success / mano calls truco…` (`history[0].action === "issued"`) | ✅ PASSED |
| Call history in hand state | History entry on accept | covered by `acceptCall / accepts call…` (`history[1].action === "accepted"`) | ✅ PASSED |
| Call history in hand state | History entry on reject | covered transitively by `call history / full sequence` (entry written before hand reset) and by integration test sequence | ✅ PASSED |
| Reset call state per hand | Call state cleared on new hand | `dealHand — callState reset / resets callState on every new hand` + integration assertions on `handNumber === 2` | ✅ PASSED |
| Flor calls — configurable future feature | Flor disabled by default rejects `flor` call | **NONE** — no test covers `makeCall(..., "flor" as CallType)` | ❌ **NOT TESTED** |
| Flor calls — configurable future feature | Flag accepted but ignored | implicitly OK (no behavior keyed on `florEnabled`), but **no explicit test** | ⚠️ **NOT TESTED** |

### Compliance summary
- 24 / 26 spec scenarios covered by passing runtime tests.
- 2 / 26 (both Flor scenarios) lack covering tests. Behavior is type-safe at compile time, but runtime assertion is missing.

---

## Correctness (spec ↔ implementation)

| Spec rule | Implementation | Verdict |
|---|---|---|
| `makeCall` validation order: `MATCH_OVER → OUT_OF_TURN → CALL_ALREADY_PENDING → CALL_WINDOW_CLOSED → INVALID_CALL_LEVEL` | `src/domain/game/calls.ts:53-77` — exact order | ✅ |
| `acceptCall` requires pending call + correct turn; sets `status: "accepted"`, `acceptedLevel`, transfers turn to caller | `src/domain/game/calls.ts:96-126` | ✅ |
| `rejectCall` computes override from previous `acceptedLevel` (not the rejected level) | `src/domain/game/calls.ts:166` — `callPoints(state.hand.callState.acceptedLevel)` read **before** writing pendingCall | ✅ |
| `playCard` guard order: `MATCH_OVER → CALL_PENDING → OUT_OF_TURN → CARD_NOT_IN_HAND → CARD_ALREADY_PLAYED` | `src/domain/game/play.ts:22-49` — exact order; priority covered by `CALL_PENDING takes priority over OUT_OF_TURN` test | ✅ |
| `resolveMatch` derives points from `callState.acceptedLevel` when no override | `src/domain/game/match.ts:147` | ✅ |
| `dealHand` resets `callState` via `emptyCallState()` | `src/domain/game/match.ts:128` | ✅ |
| `CallType` excludes `flor`/`contraflor` (type-level enforcement) | `src/domain/game/types.ts:73` | ✅ (compile-time) |
| `florEnabled` flag exists in `CreateMatchOptions` but does not affect Phase 5 behavior | `src/domain/game/types.ts:63` — present, unused, no branching | ✅ |
| `CallHistoryEntry.caller` field name kept (spec wording) | `src/domain/game/types.ts:84-89` | ✅ |
| `currentRoundNumber` falls back to 1 when no rounds exist | `src/domain/game/calls.ts:180-184` | ✅ defensive |

---

## Design Coherence

| Design decision | Implementation | Verdict |
|---|---|---|
| `calls.ts` returns `Result<MatchState>` (same envelope as `playCard`) | All three commands return `Result<MatchState>` | ✅ |
| `callState` lives in `HandState` (not `MatchState`) | `HandState.callState` in `types.ts:50` | ✅ |
| One unified `GameError` union; `PlayError = GameError` alias | `types.ts:103-114` | ✅ |
| `resolveMatch(state, winnerId, pointsOverride?)` signature | `match.ts:142-147` | ✅ |
| Call window derived from `rounds[last].trick.cardsPlayed` (no new state field) | `calls.ts:174-178` (`hasCallerPlayedInCurrentTrick`) | ✅ |
| Purity: `calls.ts` only imports deck-only + sibling domain files | `calls.ts:1-9` — imports `./match` and `./types` only; purity test covers it | ✅ |

No design deviations.

---

## Issues

### CRITICAL
1. **Tasks bookkeeping incomplete** — Phases 1 (1.1–1.10) and 3 (3.1–3.21) are all unchecked in `tasks.md` despite being implemented and passing tests. This blocks archive readiness per sdd-verify contract.
2. **Task 3.21 has no covering test** — Spec scenario "Flor disabled by default" requires a runtime assertion that `makeCall(..., "flor")` returns `INVALID_CALL_LEVEL`. The behavior is type-safe at compile time but never exercised at runtime. Add a single test in `calls.test.ts` casting through the type (or via `createMatch({..., florEnabled: false})` + cast) to close this gap.

### WARNING
1. **Lint: 3 Biome formatter errors** (import sorting, type-import line wrapping). All auto-fixable with `npx biome check --write src __tests__`. Build cannot be promoted to "lint-clean" until this runs.
2. **Phase 4 cleanup checkboxes** (4.1–4.3) are unchecked, but the actual conditions (test suite green, purity preserved, exports present) are all satisfied. Just bookkeeping.

### SUGGESTION
1. **Flag-ignored test (spec scenario "Flag accepted but ignored")** — Worth a one-liner: `createMatch({..., florEnabled: true})` → normal `truco` call still works identically. Currently implicit.
2. **`emptyCallState()` is exported from `match.ts`** but conceptually belongs alongside the call types. Acceptable as-is (single-source init) but could move to `calls.ts` in a future cleanup.
3. **Open question from design** about renaming `CallHistoryEntry.caller` → `actor`: the field is overloaded (caller on issue, responder on accept/reject). Spec uses "caller" so current name is correct, but worth a JSDoc note clarifying the dual meaning.

---

## Final Verdict

**PASS WITH WARNINGS** — implementation is correct, tests are green, types and design align with the spec. Two CRITICAL items must be resolved before archive:

1. Tick every implemented checkbox in `openspec/changes/truco-calls/tasks.md` (Phases 1, 3, 4) — leave 3.21 unchecked until the flor test is added.
2. Add the one missing flor test (Task 3.21).

The lint formatter errors should also be resolved in the same polish PR.

**Recommendation**: **needs PR 3 polish** before archive. Suggested scope for the polish PR:
- Add `flor` rejection test in `calls.test.ts` (Task 3.21).
- Run `npx biome check --write src __tests__` to fix the 3 formatter errors.
- Update `tasks.md`: tick 1.1–1.10, 3.1–3.20, 3.21 (after test added), 4.1–4.3.

Once polish PR lands, the change is **ready for archive**.

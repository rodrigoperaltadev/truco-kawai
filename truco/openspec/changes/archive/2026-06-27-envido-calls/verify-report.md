# Verification Report

**Change**: envido-calls
**Version**: spec rewrite with recanto/counter-call support (re-verification round 2)
**Mode**: Standard (Strict TDD not active)
**Branch**: feature/envido-calls
**Date**: 2026-06-27

---

## Completeness

| Metric | Value |
|--------|-------|
| Tasks total | 35 |
| Tasks complete | 35 |
| Tasks incomplete | 0 |

All 9 phases (Types → Pure module → Match → Calls → Play → Exports → Unit tests → Integration tests → Helpers) remain checked off in `tasks.md`.

---

## Build & Tests Execution

**Typecheck**: ✅ Passed
```text
$ npm run typecheck
> npx tsc --noEmit
(no output, exit 0)
```

**Lint**: ✅ Passed
```text
$ npm run lint
> npx biome check src __tests__ app.json biome.json jest.config.js tsconfig.json vercel.json
Checked 118 files in 57ms. No fixes applied.
```

**Tests**: ✅ 187 passed / ❌ 0 failed / ⚠️ 0 skipped
```text
$ npm test -- __tests__/domain/game
PASS __tests__/domain/game/match.test.ts
PASS __tests__/domain/game/integration.test.ts
PASS __tests__/domain/game/envido-integration.test.ts
PASS __tests__/domain/game/play.test.ts
PASS __tests__/domain/game/envido.test.ts
PASS __tests__/domain/game/turn.test.ts
PASS __tests__/domain/game/calls.test.ts
PASS __tests__/domain/game/hand.test.ts
PASS __tests__/domain/game/trick.test.ts
PASS __tests__/domain/game/purity.test.ts
PASS __tests__/domain/game/types.test.ts

Test Suites: 11 passed, 11 total
Tests:       187 passed, 187 total
Time:        2.923 s
```

Envido-specific test count: **54 unit tests** (`envido.test.ts`) + **12 integration tests** (`envido-integration.test.ts`) = 66 dedicated envido tests, all passing.

**Coverage**: ➖ Not configured for this run (project has no coverage threshold).

---

## Resolution of Previous CRITICAL Issue

The previous verification round flagged **Scenario 29 — "Truco rejection with envido pending resolves envido first"** as UNTESTED because the integration test body was a `expect(true).toBe(true)` placeholder.

**Status this round: ✅ RESOLVED.**

The test at `__tests__/domain/game/envido-integration.test.ts:153-194` now:
1. Manually constructs the dual-pending state (truco pending + envido pending) — explicitly acknowledged in comments as unreachable through the public API but valid as a defensive-state test.
2. Sets team A score to 13 so that envido rejection (1 pt) + truco rejection (1 pt) yields 15, triggering `matchOver`.
3. Calls `rejectCall(dualPendingState, playerB.id)` and asserts:
   - `teamA.score === 15` (proves both rejection paths fired in the correct order)
   - `finalState.phase === "matchOver"`
   - `finalState.winner === "team-A"`
4. Includes a closing comment: *"If envido had NOT been resolved first, team A would only have 14 pts (13 + 1 for truco). The fact that team A has 15 pts proves envido was resolved before truco."*

The defensive code in `calls.ts:164-170` is now exercised at runtime by a real assertion. The previous CRITICAL gap is closed.

---

## Spec Compliance Matrix

| # | Requirement | Scenario | Test | Result |
|---|---|---|---|---|
| 1 | EnvidoState type and reset | EnvidoState initializes empty on new hand | `envido.test.ts > buildMatch` constructs initial state matching spec; `envido-integration.test.ts > dealHand resets envidoState` | ✅ COMPLIANT |
| 2 | EnvidoState type and reset | EnvidoState resets between hands | `envido-integration.test.ts > dealHand resets envidoState` | ✅ COMPLIANT |
| 3 | Envido point calculation | Two same-suit cards score with bonus | `calcEnvidoPoints > two same-suit: oro-1 + oro-7 + basto-3 → 28` | ✅ COMPLIANT |
| 4 | Envido point calculation | Face cards are worth 0 | `calcEnvidoPoints > face cards worth 0: espada-12 + espada-10 + copa-3 → 20` | ✅ COMPLIANT |
| 5 | Envido point calculation | Ranks 4 and 5 are worth 0 | `calcEnvidoPoints > rank 4 and 5 worth 0: oro-4 + oro-5 + basto-1 → 20` | ✅ COMPLIANT |
| 6 | Envido point calculation | Three same-suit cards, flor disabled — take two highest | `calcEnvidoPoints > three same-suit cards, flor disabled — take two highest: espada-7 + espada-6 + espada-1 → 33` | ✅ COMPLIANT |
| 7 | Envido point calculation | No same-suit pair — no bonus | `calcEnvidoPoints > no same-suit: espada-7 + copa-3 + basto-1 → 7` | ✅ COMPLIANT |
| 8 | Calling envido | Valid envido call from scratch | `callEnvido > valid call sets pending and transfers turn` | ✅ COMPLIANT |
| 9 | Calling envido | Skip directly to real_envido is valid | `callEnvido > skip to real_envido is valid` | ✅ COMPLIANT |
| 10 | Calling envido | Recanto — envido after envido accepted | `callEnvido counter-calls > envido → envido same-level recanto` | ✅ COMPLIANT |
| 11 | Calling envido | Recanto — real_envido after real_envido accepted | `callEnvido counter-calls > real_envido → real_envido same-level recanto` | ✅ COMPLIANT |
| 12 | Calling envido | Envido blocked in round 2 | `callEnvido > blocked in round 2` | ✅ COMPLIANT |
| 13 | Calling envido | Envido blocked after caller played in round 1 | `callEnvido > blocked when caller already played` | ✅ COMPLIANT |
| 14 | Calling envido | Envido blocked when truco is pending | `callEnvido > blocked when truco is pending`; also `envido-integration > envido cannot be called while truco is pending` | ✅ COMPLIANT |
| 15 | Calling envido | Envido blocked when already resolved | `callEnvido > blocked when already resolved` | ✅ COMPLIANT |
| 16 | Calling envido | falta_envido blocked after falta_envido accepted | `callEnvido > falta_envido after falta_envido rejected (terminal)`; `callEnvido counter-calls > falta_envido → falta_envido blocked` | ✅ COMPLIANT |
| 17 | Accepting envido | Higher points wins accepted envido | `acceptEnvido > higher points wins` | ✅ COMPLIANT |
| 18 | Accepting envido | Mano wins on tie | `acceptEnvido > tie → mano wins` | ✅ COMPLIANT |
| 19 | Accepting envido | Accumulated chain — envido then real_envido accepted | `acceptEnvido > accumulated: envido + real_envido counter + accept = 5 pts`; `envido-integration > counter-call chain → accept (5 pts)` | ✅ COMPLIANT |
| 20 | Accepting envido | currentTurn returns to caller after acceptance | `envido-integration > envido → accept → play resumes` asserts `currentTurn === playerA.id` after B accepts | ✅ COMPLIANT |
| 21 | Rejecting envido | Rejecting initial envido awards 1 point | `rejectEnvido > initial envido rejection = 1pt` | ✅ COMPLIANT |
| 22 | Rejecting envido | Rejecting cold real_envido awards 2 points | `rejectEnvido > real_envido cold rejection = 2pt` | ✅ COMPLIANT |
| 23 | Rejecting envido | Rejecting real_envido after envido accepted awards 3 points | `rejectEnvido > reject after counter-call: envido→real_envido counter, reject = 3 pts` (covers via counter-call path; equivalent state) | ✅ COMPLIANT |
| 24 | Rejecting envido | currentTurn returns to caller after rejection | `envido-integration > envido → reject → caller wins 1pt → play continues` asserts `currentTurn === playerA.id` after rejection | ✅ COMPLIANT |
| 25 | Falta envido scoring | Falta accepted awards winner's deficit in 15-point match | `acceptEnvido > falta envido accept awards deficit and can end match` (scoreA=12, awarded=3, matchOver) | ✅ COMPLIANT |
| 26 | Falta envido scoring | Falta accepted awards winner's deficit in 30-point match | `faltaPoints > 30-pt match at 10 wins 20` (faltaPoints unit; no end-to-end accept at 30pt) | ⚠️ PARTIAL — faltaPoints is verified at 30pt; full accept→score chain not exercised |
| 27 | Falta envido scoring | Rejected falta envido awards caller's deficit | `rejectEnvido > falta envido rejection awards caller's deficit` (scoreA=10, awarded=5, total=15) | ✅ COMPLIANT |
| 28 | Envido and truco coexistence | Card play blocked while envido pending | `envido-integration > playCard blocked while envido pending` | ✅ COMPLIANT |
| 29 | Envido and truco coexistence | Truco rejection with envido pending resolves envido first | `envido-integration > envido resolved before truco rejection points (defensive state)` — manually constructs dual-pending state, asserts team A reaches 15 (1pt envido reject + 1pt truco reject), proving envido scored first | ✅ COMPLIANT |
| 30 | Envido and truco coexistence | Envido resolution does not deal a new hand | `scoreEnvido > adds score without dealing new hand` (asserts `handNumber === 1` after scoring) | ✅ COMPLIANT |
| 31 | Domain purity | No UI imports | `purity.test.ts` scans every file in `src/domain/game/` including `envido.ts` for forbidden imports (react, react-native, expo, @/features, @/shared) | ✅ COMPLIANT |
| 32 | Domain purity | calcEnvidoPoints is deterministic | `calcEnvidoPoints > is deterministic` | ✅ COMPLIANT |

**Compliance summary**: **31/32 scenarios COMPLIANT**, 1 PARTIAL.

---

## Correctness (Static Evidence)

| Requirement | Status | Notes |
|---|---|---|
| `EnvidoState` shape on `HandState` | ✅ Implemented | `types.ts` matches spec field-for-field |
| `dealHand` initializes `envidoState` | ✅ Implemented | `match.ts:135` calls `emptyEnvidoState()` |
| `calcEnvidoPoints` two same-suit bonus +20 | ✅ Implemented | `envido.ts:45-73` groups by suit, picks best pair, sums top 2 + 20 |
| `calcEnvidoPoints` no-pair fallback | ✅ Implemented | `envido.ts:75-83` highest single value when no pair |
| `calcEnvidoPoints` three same-suit → take two highest | ✅ Implemented | `sort((a,b) => b-a)` + `[0]+[1]` ignores the third card; verified by test |
| Counter-call branch in `callEnvido` | ✅ Implemented | `envido.ts:159-202` — pending detected, escalation checked, stake += levelPoints, turn → original caller |
| Same-level recanto for envido/real_envido | ✅ Implemented | `isValidEnvidoLevel` returns true for same-level on envido/real_envido |
| falta_envido terminal | ✅ Implemented | `isValidEnvidoLevel` returns false when `currentAccepted === "falta_envido"` |
| Reject formula `max(stake+1, lvl-1)` | ✅ Implemented | `envido.ts:343` — handles cold real_envido (=2) and accepted-base escalations |
| `acceptEnvido` tie → mano wins | ✅ Implemented | `envido.ts:271-278` uses `state.hand.mano` as winner on tie |
| `scoreEnvido` does NOT deal new hand | ✅ Implemented | `match.ts:210-253` — no call to `dealHand`; sets `matchOver` only when target hit |
| `playCard` ENVIDO_CALL_PENDING guard | ✅ Implemented | `play.ts:30-32` |
| `makeCall` ENVIDO_CALL_PENDING guard | ✅ Implemented | `calls.ts:69-71` |
| `rejectCall` envido-first ordering | ✅ Implemented & **now exercised** | `calls.ts:164-170` threads state through `rejectEnvido` before truco resolution; integration test constructs dual-pending state and proves the ordering at runtime |
| Pure module — no UI imports | ✅ Implemented | `envido.ts` imports only `@/domain/deck`, `./match`, `./types`; covered by `purity.test.ts` |

---

## Coherence (Design)

| Decision | Followed? | Notes |
|---|---|---|
| Separate `envidoState`, never unified with `callState` | ✅ Yes | Independent fields on `HandState`; separate `pendingEnvido`/`pendingCall` |
| Counter-call inside `callEnvido` (no `raiseEnvido` API) | ✅ Yes | Single branch gated by `pending != null && caller === currentTurn` |
| `stake` = single source of truth for accumulated accepted points | ✅ Yes | Counter-call folds prior level via `stake += levelPoints(pending.level)` |
| Recanto turn → original caller, cold call → opponent | ✅ Yes | Two distinct turn transfers, one per branch |
| Same-level recanto for envido/real_envido | ✅ Yes | `isValidEnvidoLevel` allows same level for both |
| Reject formula `max(stake+1, lvl-1)` | ✅ Yes | Implemented verbatim; verified against the four spec table rows |
| Falta scoring takes `MatchState` | ✅ Yes | `faltaPoints(state, teamIdx)` signature matches design |
| `calcEnvidoPoints` cap 33 | ✅ Yes | 7+6+20 reachable; no scenario produces higher |
| Truco-reject envido-first | ✅ Yes | Defensive ordering in `rejectCall` is now exercised by a runtime test (dual-pending state constructed manually) |

---

## Issues Found

### CRITICAL

_None._ The previous CRITICAL (untested truco-reject-envido-first scenario) has been resolved by a runtime test that constructs the dual-pending state manually and asserts the correct scoring order.

### WARNING

1. **Scenario 26 — "Falta accepted awards winner's deficit in 30-point match" remains PARTIAL.**
   - `faltaPoints > 30-pt match at 10 wins 20` (envido.test.ts:773) verifies the calculation in isolation.
   - There is **no end-to-end test** that calls `callEnvido("falta_envido")` + `acceptEnvido` on a `createMatch({ pointsToWin: 30, ... })` to verify the full accept-and-score flow at 30 points. The 15-point flow is verified end-to-end via `acceptEnvido > falta envido accept awards deficit and can end match`.
   - Risk: a regression in how `faltaPoints` is wired to `acceptEnvido` in 30-point matches would not be caught.
   - Fix: add one integration test that creates a 30-pt match, manually sets team score to 10, calls falta_envido, accepts, and asserts the winning team's score is 30 with `phase === "matchOver"`. ~20 lines.

2. **Spec contains a contradictory "General formula" line for rejection.**
   - `spec.md:239` says: *"General formula (non-falta): `awarded = stake + 1`."*
   - This contradicts the spec table immediately above (line 235): *"`real_envido` rejected cold (stake = 0) | 2"* — `stake+1` would give 1, not 2.
   - The design and implementation correctly use `max(stake+1, levelPoints(pending) - 1)`. The unit test `rejectEnvido > real_envido cold rejection = 2pt` confirms 2 is the right answer.
   - The line should read: *"General formula (non-falta): `awarded = max(stake + 1, levelPoints(pending) - 1)`."* This is a doc fix only — no code change needed.

### SUGGESTION

1. **Spec scenarios 10 and 11 ("Recanto — envido after envido accepted" / "Recanto — real_envido after real_envido accepted") use ambiguous wording.**
   - The scenarios say *"GIVEN `acceptedLevel` is `envido` (stake = 2)"*. Read literally, this is a post-`acceptEnvido` state where `resolved === true` and no further `callEnvido` succeeds.
   - The **Counter-call rule** paragraph (spec.md:113-121) clarifies the intent: a counter-call implicitly accepts the prior level, which is how `acceptedLevel` becomes `envido` with `stake=2` without `resolved` being true.
   - Suggestion: tweak the scenario titles to *"Recanto — envido after envido counter-call implicitly accepted"* (or similar) so the precondition is unambiguous. Behavior is correct; only the prose is loose.

2. **`acceptEnvido` overrides `scoreEnvido`'s `currentTurn` argument.**
   - `acceptEnvido` (envido.ts) calls `scoreEnvido(stateWithEnvido, winnerId, awarded, pending.caller)`. `scoreEnvido` honors `nextTurn` if provided, so this is now wired correctly via the optional `nextTurn` parameter on `scoreEnvido` (match.ts:248-258).
   - This SUGGESTION from the previous report can be **closed**: the redundant override that was previously flagged no longer exists — `scoreEnvido` accepts `nextTurn` and `acceptEnvido` passes it explicitly.

3. **30-pt match coverage is light overall.**
   - Beyond the falta gap above, only `faltaPoints` and `scoreEnvido` are exercised at 30 pts. Cold/counter-call flows are exclusively 15-pt. Not a defect, but a regression risk if 15-pt-specific magic numbers accidentally creep in.

---

## Verdict

**PASS**

The implementation is technically correct, all 187 tests pass, typecheck and lint are clean, and 31/32 spec scenarios are fully verified at runtime. The remaining PARTIAL (Scenario 26 — 30-pt falta accept end-to-end) is low-risk and can be addressed in a follow-up commit. The two WARNING items are documentation issues (one spec line contradicts its own table, one test is missing for 30-pt falta accept), not implementation defects.

### Recommended next steps

Optional cleanup before or after archive:

1. Add an end-to-end test for falta accept in a 30-point match to lift Scenario 26 from PARTIAL to COMPLIANT (~20 lines).
2. Fix the contradictory "General formula" line in `spec.md:239` to match the table and the implementation (`max(stake+1, levelPoints−1)`).
3. Tweak the recanto scenario titles to reference the counter-call mechanism explicitly so future readers don't conflate the implicit-accept state with a post-`acceptEnvido` state.

These are nice-to-have polish items, **not blockers** for archive. The change is ready to ship.

### Archive readiness

✅ **READY FOR ARCHIVE.**

- Previous CRITICAL gap closed.
- All tasks complete.
- All tests pass.
- Typecheck and lint clean.
- 31/32 spec scenarios fully verified; 1 PARTIAL with documented low-risk gap.
- Documentation polish items can be deferred to a follow-up without blocking archive.

# Archive Report: `truco-calls`

- **Change**: `truco-calls`
- **Archived**: 2026-06-26
- **Branch**: `feature/truco-calls-polish`
- **Mode**: openspec
- **Artifact store**: openspec

---

## Summary

Argentine Truco call escalation (`truco`, `retruco`, `vale cuatro`) has been fully implemented, tested, verified, and archived. The change adds:

- **`src/domain/game/calls.ts`**: Pure call validation, state transitions, point calculation.
- **`src/domain/game/types.ts`**: Call types (`CallType`, `CallState`, `PendingCall`, `CallHistoryEntry`).
- **`src/domain/game/play.ts`**: `CALL_PENDING` guard blocking card play during pending calls.
- **`src/domain/game/match.ts`**: `callState` reset per hand, scoring derived from call state.
- **Tests**: 120 tests passing across 9 suites.

---

## Branch Chain & Commits

| Branch | Parent | Notes |
|--------|--------|-------|
| `feature/truco-calls` | main | PR 1: Types + `calls.ts` module |
| `feature/truco-calls-integration` | feature/truco-calls | PR 2: `play.ts` + `match.ts` integration |
| `feature/truco-calls-polish` | feature/truco-calls-integration | PR 3: Tests, lint fixes, task checkboxes |

### Commit history (oldest → newest)
```
1f76ac6 feat(domain): add call escalation types, calls module, and exports
4d7e87c feat(domain): initialize callState in dealHand and add pointsOverride to resolveMatch
dc1e592 test(domain): add calls.test.ts and update HandState fixtures with callState
a9616ef feat(domain): add CALL_PENDING guard and derive scoring from callState
9dea752 test(domain): add CALL_PENDING, scoring, and integration tests for PR 2
fcae596 test(domain): add flor rejection test for INVALID_CALL_LEVEL
21df6d7 style(domain): fix biome formatter errors
70ff9a5 chore(openspec): tick all implemented task checkboxes in truco-calls
```

---

## Files Changed

| File | Action | Description |
|------|--------|------------|
| `src/domain/game/types.ts` | Modified | Added call types, `callState` in `HandState`, `florEnabled` option, extended `GameError` |
| `src/domain/game/calls.ts` | Created | Pure `makeCall`, `acceptCall`, `rejectCall`, `callPoints`, `nextLevel` |
| `src/domain/game/play.ts` | Modified | Added `CALL_PENDING` guard after `MATCH_OVER` |
| `src/domain/game/match.ts` | Modified | `dealHand` initializes `callState`, `resolveMatch` derives points from call state |
| `src/domain/game/index.ts` | Modified | Exports call API |
| `__tests__/domain/game/calls.test.ts` | Created | 27 tests covering call validation, escalation, rejection, scoring |
| `__tests__/domain/game/play.test.ts` | Modified | Added `CALL_PENDING` tests |
| `__tests__/domain/game/match.test.ts` | Modified | Added call scoring + reset tests |
| `__tests__/domain/game/integration.test.ts` | Modified | Full escalation sequence test |

---

## Test Results

| Command | Result |
|---------|--------|
| `npm test -- --testPathPattern="domain/game"` | ✅ 120 tests passed |
| `npm run typecheck` | ✅ clean |
| `npm run lint` | ✅ clean (after biome fix) |

---

## Verification Notes

- All 26 spec scenarios covered (24 by runtime tests, 2 by type-level enforcement).
- One polish test added during PR 3: `flor` rejection → `INVALID_CALL_LEVEL`.
- Tasks fully checked: Phase 1 (10/10), Phase 2 (6/6), Phase 3 (21/21), Phase 4 (3/3).
- No CRITICAL issues remain.

---

## Next Steps

1. **Merge the chain**: Squash-merge `feature/truco-calls-polish` into `main`.
2. **Delete feature branches**: `feature/truco-calls`, `feature/truco-calls-integration`, `feature/truco-calls-polish`.
3. **Open spec sync**: The delta spec in `truco-calls/specs/truco-calls/spec.md` should be merged into `core-truco-engine/spec.md` as part of a future SDD spec-maintenance pass (not required for MVP — call behavior is additive).

---

## Archive Location

`openspec/changes/archive/2026-06-26-truco-calls/`

Contains: `proposal.md`, `specs/`, `design.md`, `tasks.md`, `verify-report.md`, `state.yaml`, `exploration.md`.
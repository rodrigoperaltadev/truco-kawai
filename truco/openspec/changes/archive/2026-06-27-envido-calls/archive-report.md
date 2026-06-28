# Archive Report: Envido Calls

**Change**: envido-calls
**Archived**: 2026-06-27
**Artifact Store**: openspec
**Branch**: feature/envido-calls

---

## Summary

Full implementation of Phase 6 envido rules in the pure game engine: `envido`, `real_envido`, and `falta_envido` lifecycle, point calculation, scoring, timing enforcement, and truco coexistence.

---

## Artifacts Archived

| Artifact | Path | Notes |
|----------|------|-------|
| proposal.md | `archive/2026-06-27-envido-calls/proposal.md` | Original intent and scope |
| spec.md | `archive/2026-06-27-envido-calls/specs/envido-calls/spec.md` | Delta spec (became main spec) |
| design.md | `archive/2026-06-27-envido-calls/design.md` | Technical approach |
| tasks.md | `archive/2026-06-27-envido-calls/tasks.md` | 35 tasks, all complete |
| verify-report.md | `archive/2026-06-27-envido-calls/verify-report.md` | 187 tests pass, 31/32 compliant |

---

## Specs Synced

| Domain | Action | Details |
|--------|--------|--------|
| envido | Created | `openspec/specs/envido/spec.md` — full spec from delta |

---

## Source of Truth Updated

- `openspec/specs/envido/spec.md` — new envido specification (was delta, now main)

---

## Files Changed (Branch: feature/envido-calls)

| File | Change |
|------|--------|
| `src/domain/game/types.ts` | Added `EnvidoLevel`, `PendingEnvido`, `EnvidoState`, `EnvidoHistoryEntry`, error codes |
| `src/domain/game/envido.ts` | **NEW** — pure envido module with calc, call, accept, reject |
| `src/domain/game/match.ts` | Added `emptyEnvidoState`, `faltaPoints`, `scoreEnvido` |
| `src/domain/game/calls.ts` | Added envido pending guard, envido-first rejection |
| `src/domain/game/play.ts` | Added envido pending guard |
| `src/domain/game/index.ts` | Exports |
| `__tests__/domain/game/envido.test.ts` | **NEW** — 54 unit tests |
| `__tests__/domain/game/envido-integration.test.ts` | **NEW** — 12 integration tests |

---

## Test Results

- **187 tests passed** / 0 failed
- **Typecheck**: ✅ clean
- **Lint**: ✅ clean

---

## SDD Cycle Complete

The change has been fully planned (proposal), specified (spec), designed (design), implemented (tasks), verified (verify-report), and archived.

Ready for next steps: create PR from `feature/envido-calls` → `main`.

---

## Notes

- Previous CRITICAL issue (untested truco-reject-envido-first) was resolved before archive
- 1 PARTIAL scenario (30-pt falta accept end-to-end) — low-risk, documented in verify-report
- 2 WARNING doc issues — can be addressed in follow-up without blocking
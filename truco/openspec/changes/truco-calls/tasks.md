# Tasks: Truco Calls

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~620–680 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 (Foundation) → PR 2 (Integration) → PR 3 (Tests) |
| Delivery strategy | ask-always |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Foundation: types + `calls.ts` module | PR 1 → `feature/truco-calls` | Types, `calls.ts`, exports — fully testable in isolation |
| 2 | Integration: `play.ts` + `match.ts` + `index.ts` | PR 2 → PR 1 branch | Depends on PR 1; `CALL_PENDING` guard, scoring integration, `dealHand` reset |
| 3 | Tests: `calls.test.ts`, `play.test.ts` updates, `match.test.ts` updates | PR 3 → PR 2 branch | Depends on PR 2; integration test |

## Phase 1: Foundation — Types & `calls.ts` (PR 1)

- [x] 1.1 Add `CallType`, `CallStatus`, `CallAction`, `PendingCall`, `CallHistoryEntry`, `CallState` to `src/domain/game/types.ts`
- [x] 1.2 Add `callState: CallState` field to `HandState` in `src/domain/game/types.ts`
- [x] 1.3 Add `florEnabled?: boolean` to `CreateMatchOptions` in `src/domain/game/types.ts`
- [x] 1.4 Extend `PlayError` union to `GameError` (alias back `PlayError = GameError`); add `CALL_PENDING`, `OUT_OF_TURN`, `INVALID_CALL_LEVEL`, `CALL_ALREADY_PENDING`, `CALL_WINDOW_CLOSED`, `MATCH_OVER` to the union in `src/domain/game/types.ts`
- [x] 1.5 Create `src/domain/game/calls.ts` with `callPoints(level: CallType | null): number` (null→1, truco→2, retruco→3, vale_cuatro→4)
- [x] 1.6 Add `nextLevel(level: CallType | null): CallType | null` to `src/domain/game/calls.ts` (null→truco, truco→retruco, retruco→vale_cuatro, vale_cuatro→null)
- [x] 1.7 Add `makeCall(state: MatchState, caller: string, level: CallType): Result<MatchState>` to `src/domain/game/calls.ts` with validation order: `MATCH_OVER → OUT_OF_TURN → CALL_ALREADY_PENDING → CALL_WINDOW_CLOSED → INVALID_CALL_LEVEL`; on success: set `pendingCall`, append history entry, transfer `currentTurn` to opponent
- [x] 1.8 Add `acceptCall(state: MatchState, responder: string): Result<MatchState>` to `src/domain/game/calls.ts` with validation: `currentTurn === responder` + pending call exists; on success: set `status:"accepted"`, `acceptedLevel = level`, append history, `currentTurn` → caller
- [x] 1.9 Add `rejectCall(state: MatchState, responder: string): Result<MatchState>` to `src/domain/game/calls.ts` with validation: `currentTurn === responder` + pending call exists; on reject: append history, compute `override = callPoints(acceptedLevelBeforeThisCall)`, call `resolveMatch(state, callerPlayerId, override)`. Use `acceptedLevel` from state (before pendingCall update) for the previous-level award math
- [x] 1.10 Export `CallType`, `CallState`, `PendingCall`, `CallHistoryEntry`, `CallAction`, `GameError`, `makeCall`, `acceptCall`, `rejectCall`, `callPoints`, `nextLevel` from `src/domain/game/index.ts`

## Phase 2: Integration — `play.ts`, `match.ts`, `index.ts` (PR 2)

- [x] 2.1 Insert `CALL_PENDING` guard after `MATCH_OVER` check in `playCard` in `src/domain/game/play.ts`: if `state.hand.callState.pendingCall?.status === "pending"`, return `{ ok: false, error: "CALL_PENDING" }`
- [x] 2.2 Update `playCard` doc comment validation order to reflect `CALL_PENDING` insertion in `src/domain/game/play.ts`
- [x] 2.3 Modify `dealHand` in `src/domain/game/match.ts` to initialize `callState: { pendingCall: null, acceptedLevel: null, history: [] }` in returned `HandState`
- [x] 2.4 Modify `resolveMatch` signature in `src/domain/game/match.ts` to accept optional third arg `pointsOverride?: number`; when undefined, derive points from `callPoints(state.hand.callState.acceptedLevel)` (null→1)
- [x] 2.5 Modify `resolveMatch` in `src/domain/game/match.ts` to apply `pointsOverride` when provided (rejection path), otherwise use derived points
- [x] 2.6 After `resolveMatch` transitions to next hand, verify `dealHand` at 2.3 covers `callState` reset (no separate reset needed — confirmed by design)

## Phase 3: Tests — Unit & Integration (PR 3)

- [x] 3.1 Create `__tests__/domain/game/calls.test.ts` with `emptyCallState()` helper; test `callPoints` mapping for null/truco/retruco/vale_cuatro
- [x] 3.2 Test `nextLevel` mapping: null→truco, truco→retruco, retruco→vale_cuatro, vale_cuatro→null
- [x] 3.3 Test `makeCall` success: mano calls truco → `pendingCall` set, `currentTurn` transfers, history entry appended
- [x] 3.4 Test `makeCall` escalation: retruco after accepted truco → `pendingCall` level updated; vale_cuatro after accepted retruco
- [x] 3.5 Test `makeCall` level-skip error: calling retruco with no accepted truco → `INVALID_CALL_LEVEL`
- [x] 3.6 Test `makeCall` off-turn: player B calls when player A is `currentTurn` → `OUT_OF_TURN`
- [x] 3.7 Test `makeCall` double-call: second call while pending → `CALL_ALREADY_PENDING`
- [x] 3.8 Test `makeCall` `CALL_WINDOW_CLOSED`: player calls after playing in current trick → error
- [x] 3.9 Test `acceptCall`: responder accepts → `status:"accepted"`, `acceptedLevel` set, `currentTurn` → caller, history entry
- [x] 3.10 Test `acceptCall` followed by escalation: accepted truco → retruco on caller's next turn
- [x] 3.11 Test `rejectCall` — truco rejected (no prior level) → caller team gets 1 pt, hand ends
- [x] 3.12 Test `rejectCall` — retruco rejected → caller team gets 2 pts (truco level)
- [x] 3.13 Test `rejectCall` — vale_cuatro rejected → caller team gets 3 pts (retruco level)
- [x] 3.14 Test history: full sequence `truco→accept→retruco→reject` → history.length === 4 with correct actions
- [x] 3.15 Update `__tests__/domain/game/play.test.ts` HandState literals to include `callState: { pendingCall: null, acceptedLevel: null, history: [] }`
- [x] 3.16 Add `playCard` `CALL_PENDING` test: with `pendingCall.status === "pending"`, `playCard` returns `CALL_PENDING`
- [x] 3.17 Add `playCard` resume-after-accept test: accept call → `playCard` succeeds normally
- [x] 3.18 Update `__tests__/domain/game/match.test.ts` HandState literals with `callState`; add `dealHand` reset test: verify `callState` is empty after new hand
- [x] 3.19 Add `resolveMatch` scoring tests: accepted truco→2pts, retruco→3pts, vale_cuatro→4pts; `pointsOverride` rejection path
- [x] 3.20 Add integration test: full `truco→accept→retruco→reject` sequence from `createMatch`; verify history length, winning team scored correct points
- [x] 3.21 Test `florEnabled` flag: createMatch with unsupported level `flor` → `INVALID_CALL_LEVEL`

## Phase 4: Cleanup / Polish

- [x] 4.1 Run full test suite (`go test ./...` or `npm test`) — all tests must pass
- [x] 4.2 Verify `calls.ts` has zero non-deck imports (purity check)
- [x] 4.3 Confirm all new exports in `src/domain/game/index.ts` are present

# Tasks: Game Table UI

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~950–1150 (domain fold + hook + 7 zones + 2 card views + screen + ~10 test files) |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 → PR 2 → PR 3 → PR 4 |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending (user must choose: stacked-to-main vs feature-branch-chain)
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Domain fold helper + tests | PR 1 | `src/domain/game/fold.ts` + spec; no UI dep |
| 2 | Shared card primitives + tests | PR 2 | `CardFace`, `CardBack` in `src/shared/ui/`; domain + i18n dep only |
| 3 | `useGameState` hook + `deriveActions` + `logEntry` + tests | PR 3 | Full hook with opponent auto-play; domain dep |
| 4 | Zone components + `GameScreen` integration + tests | PR 4 | All 7 zones; screen; depends on PRs 1–3 |

---

## Phase 1: Domain Fold Helper

- [x] 1.1 Create `src/domain/game/fold.ts` with `foldHand(state, folderId)` per the 4-branch scoring table (truco-pending → `rejectCall`; envido-pending → `rejectEnvido` + 1pt; round1-mano → +2; else → +1)
- [x] 1.2 Export `foldHand` from `src/domain/game/index.ts` barrel
- [x] 1.3 Write unit tests: all 4 branches, `MATCH_OVER` guard, `OUT_OF_TURN` guard, purity (same input → same output)

---

## Phase 2: Shared Card Primitives

- [x] 2.1 Create `src/shared/ui/CardFace/CardFace.tsx` + `CardFace.styles.ts` — text label `"{rank} {suit}"` via `jargon.ts`, suit color from theme, `onPress?`, `disabled?`, `testID?`, `accessibilityLabel` = same text, touch target ≥ 44×44
- [x] 2.2 Create `src/shared/ui/CardFace/index.ts` re-exporting `CardFace`
- [x] 2.3 Create `src/shared/ui/CardBack/CardBack.tsx` + `CardBack.styles.ts` — generic card back visual, `accessibilityLabel: "Carta boca abajo"`, touch target ≥ 44×44
- [x] 2.4 Create `src/shared/ui/CardBack/index.ts` re-exporting `CardBack`
- [x] 2.5 Write RTL component tests: `CardFace` label + a11y, `CardBack` label, disabled state

---

## Phase 3: `useGameState` Hook + Logic Selectors

- [ ] 3.1 Create `src/features/game/logic/deriveActions.ts` — pure `deriveActions(state, playerId)` per spec table (truco/retruco/vale4/envido/real/falta/quiero/noQuiero/mazo gates)
- [ ] 3.2 Create `src/features/game/logic/logEntry.ts` — `LogEntry` type + `foldLogEntry(folderId, prevState)` + diff-based derivers for play/trick/call/envido transitions
- [ ] 3.3 Create `src/features/game/hooks/useGameState.ts` — `useReducer` with actions `PLAY | CALL | CALL_ENVIDO | ACCEPT | REJECT | MAZO | OPPONENT_PLAY`; dispatches domain fns; derives view + actions + handlers; `useEffect` for opponent auto-play with `setTimeout(~700ms)`
- [ ] 3.4 Write logic unit tests: `deriveActions` full spec table (all 9 action gates × valid/invalid states), log derivation per transition kind
- [ ] 3.5 Write hook RTL tests: play/call/accept/reject/mazo flows; opponent auto-play via `jest.useFakeTimers`

---

## Phase 4: Zone Components

- [ ] 4.1 Create `src/features/game/components/ScoreHeader/ScoreHeader.tsx` + `ScoreHeader.styles.ts` — `ScoreBadge` × 2 + "Mano N · Ronda N" label; `scores`, `handNumber`, `roundNumber` props
- [ ] 4.2 Create `src/features/game/components/ScoreHeader/index.ts`
- [ ] 4.3 Create `src/features/game/components/TurnIndicator/TurnIndicator.tsx` + `TurnIndicator.styles.ts` — `"Tu turno"` vs `"{opponent} está Jugando"`; `kind: "player" | { kind: "opponent"; name: string }` prop
- [ ] 4.4 Create `src/features/game/components/TurnIndicator/index.ts`
- [ ] 4.5 Create `src/features/game/components/OpponentZone/OpponentZone.tsx` + `OpponentZone.styles.ts` — opponent `name`, `cardCount`, `isActive` (TurnIndicator overlay); renders N× `CardBack`
- [ ] 4.6 Create `src/features/game/components/OpponentZone/index.ts`
- [ ] 4.7 Create `src/features/game/components/TableZone/TableZone.tsx` + `TableZone.styles.ts` — `PlayedCard[]` with `CardFace` + player attribution; horizontal layout
- [ ] 4.8 Create `src/features/game/components/TableZone/index.ts`
- [ ] 4.9 Create `src/features/game/components/PlayerHandZone/PlayerHandZone.tsx` + `PlayerHandZone.styles.ts` — cards ~80px wide, fan overlap via negative `marginLeft`; tappable when `enabled`; `disabled` state with `accessibilityState.disabled`
- [ ] 4.10 Create `src/features/game/components/PlayerHandZone/index.ts`
- [ ] 4.11 Create `src/features/game/components/ActionBar/ActionBar.tsx` + `ActionBar.styles.ts` — renders only enabled buttons (from `GameActions`); fold button; `handlers` prop; ≥ 44×44 touch targets
- [ ] 4.12 Create `src/features/game/components/ActionBar/index.ts`
- [ ] 4.13 Create `src/features/game/components/EventLog/EventLog.tsx` + `EventLog.styles.ts` — `ScrollView` with fixed max-height; own bounds; `label-sm` + `body-md` typography; `LogEntry[]` prop
- [ ] 4.14 Create `src/features/game/components/EventLog/index.ts`
- [ ] 4.15 Write RTL component tests: `ActionBar` only renders enabled buttons (`queryByText` absent ≠ disabled); `PlayerHandZone` 3 cards + tap calls `onPlay`; `EventLog` independent scroll; `TurnIndicator` player/opponent text; `OpponentZone` card backs count

---

## Phase 5: GameScreen Integration

- [ ] 5.1 Replace `GameScreen.tsx` body with `Screen` (scrollable) + vertical flex column composing all 6 zones; zone order: `ScoreHeader` → `OpponentZone` → `TableZone` → `ActionBar` → `PlayerHandZone` → `EventLog`; no `PlaceholderScreen`
- [ ] 5.2 Add missing i18n keys to `src/shared/i18n/locales/es.ts` under `screens.game.actions.*` (truco, retruco, vale4, envido, real_envido, falta_envido, quiero, no_quiero, mazo, tu_turno, opponent_turn) and `screens.game.zones.*` if needed
- [ ] 5.3 Write screen smoke test: all 6 zones present, vertical order, no `PlaceholderScreen`

---

## Phase 6: i18n Integration

- [ ] 6.1 Add `screens.game.actions.mazo: "Me voy al mazo"` and `screens.game.turn.player: "Tu turno"` and `screens.game.turn.opponent: "{name} está jugando"` to `es.ts`
- [ ] 6.2 Add English translations to `en.ts` for same keys

---

## Phase 7: Opponent Auto-Play (Hook Integration)

- [ ] 7.1 Confirm `CPUPlayer.chooseCard` is not yet implemented; schedule `setTimeout` in `useEffect` when `currentTurn === opponent.id && !callPending && !envPending`; dispatch `OPPONENT_PLAY` after ~700ms with random valid card
- [ ] 7.2 Cleanup timer on unmount / state change

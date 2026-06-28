# Design: Game Table UI

## Technical Approach

Replace `PlaceholderScreen` in `GameScreen.tsx` with a mobile-first vertical stack of six zones driven by one `useGameState` hook. The hook is the sole bridge to the pure domain (`src/domain/game/`): owns `MatchState`, exposes typed handlers, derives the action gate + event log, and schedules opponent auto-play. Zones are presentational and read view-model data — none import the domain. This is exploration **Approach 2** (feature zones + state hook), matching existing `src/features/*` + `*.styles.ts` + `hooks/` conventions.

## Architecture Decisions

| Decision | Choice | Rejected alternative | Rationale |
|---|---|---|---|
| State container | `useReducer` in `useGameState` holding `MatchState` + `log` | `useState` per field; React Context | Domain is pure (`state → cmd → state`); a reducer keeps the single source atomic and testable. No cross-tree sharing needed → Context is overkill. |
| Event log source | Hook **derives** entries from each transition (`callState.history`, `envidoState.history`, trick resolution diff) | Mutate domain to emit events | Domain emits no events and must stay pure (`purity.test.ts` guards this). Deriving keeps domain untouched. |
| Opponent moves | `useEffect` watches `currentTurn === opponent.id`, fires a random valid card via `setTimeout` | Synchronous loop | MVP needs a responsive opponent without Phase 9 strategy; timeout avoids UI jank and shows turn handoff. |
| Action gating | Pure `deriveActions(state, playerId)` helper in `src/features/game/logic/` | Inline `disabled` per button | Spec requires absent (not disabled) buttons; a pure selector is unit-testable in isolation and mirrors domain validation order. |
| Card rendering | Text labels via `jargon.ts` (`CardFace`/`CardBack`) | SVG art | Backlog Phase 7 + proposal: text deck now, illustrations later. |
| Component placement | New zones in `src/features/game/components/`, reusable card views in `src/shared/ui/` | All under `features/` | `CardFace`/`CardBack` are presentation primitives reused across zones → shared; zones are game-specific → feature. |

## Data Flow

    domain/game (pure) ── createMatch · playCard · makeCall · acceptCall
         │               rejectCall · callEnvido · acceptEnvido · rejectEnvido
         ▼
    useGameState (reducer: { matchState, log })
         │  dispatch(cmd) → domain fn → Result<MatchState>
         │  ok ⇒ set state + append derived log; useEffect ⇒ opponent setTimeout
         ▼
    view model { matchState, view, actions, handlers, log }
         ▼
    GameScreen → ScoreHeader · OpponentZone · TableZone · ActionBar · PlayerHandZone · EventLog

`view` flattens domain state into UI fields. `handlers` bind to the human `playerId`. Components never see raw `Result` — the hook unwraps it; gating prevents invalid commands, rejected ones no-op.

## useGameState Hook API

```ts
// src/features/game/hooks/useGameState.ts
type GameView = {
  playerHand: readonly Card[];          // hand.players[playerIndex].cards
  opponentCardCount: number;            // hand.players[opponentIndex].cards.length
  currentTrick: readonly PlayedCard[];  // last round's trick.cardsPlayed
  scores: { nos: number; ellos: number };
  handNumber: number;
  roundNumber: 1 | 2 | 3;
  isPlayerTurn: boolean;
  turnLabel: { kind: "player" } | { kind: "opponent"; name: string };
  phase: MatchPhase;
};

type GameActions = {                    // each true ⇒ render that button
  truco: boolean; retruco: boolean; valeCuatro: boolean;
  envido: boolean; realEnvido: boolean; faltaEnvido: boolean;
  quiero: boolean; noQuiero: boolean; mazo: boolean;
};

type GameHandlers = {
  onPlayCard: (card: Card) => void;
  onCall: (level: CallType) => void;          // makeCall
  onCallEnvido: (level: EnvidoLevel) => void; // callEnvido
  onAccept: () => void;   // acceptCall or acceptEnvido (whichever is pending)
  onReject: () => void;   // rejectCall or rejectEnvido
  onMazo: () => void;     // fold → rejectCall-equivalent / concede hand
};

export function useGameState(opts: CreateMatchOptions & { playerId: string }): {
  view: GameView; actions: GameActions; handlers: GameHandlers; log: readonly LogEntry[];
};
```

`onAccept`/`onReject` inspect state to route to the truco vs envido fn, keeping `ActionBar` dumb. `playerIndex` resolves once from `opts.playerId`.

## Action Gating Logic

Pure selector mirroring domain validation order; encodes the spec table. Buttons are **omitted** when false.

```ts
// src/features/game/logic/deriveActions.ts
export function deriveActions(s: MatchState, pid: string): GameActions {
  const turn = s.currentTurn === pid;
  const call = s.hand.callState;
  const env = s.hand.envidoState;
  const callPending = call.pendingCall?.status === "pending";
  const envPending = env.pendingEnvido?.status === "pending";
  const pendingFromOpponent =
    (call.pendingCall?.caller !== pid && callPending) ||
    (env.pendingEnvido?.caller !== pid && envPending);
  const envidoOpen = isEnvidoWindowOpen(s, pid); // reuse domain helper
  const canInitiate = turn && !callPending && !envPending;
  return {
    truco:      canInitiate && call.acceptedLevel === null,
    retruco:    canInitiate && call.acceptedLevel === "truco",
    valeCuatro: canInitiate && call.acceptedLevel === "retruco",
    envido:     canInitiate && envidoOpen,
    realEnvido: canInitiate && envidoOpen,
    faltaEnvido:canInitiate && envidoOpen,
    quiero:     turn && pendingFromOpponent,
    noQuiero:   turn && pendingFromOpponent,
    mazo:       canInitiate,
  };
}
```

## Me Voy al Mazo (Fold Hand)

Folding concedes the current hand. There is no `fold` in the domain yet, so we add ONE pure helper, `foldHand`, and route the `MAZO` reducer action through it. The helper reuses existing engine functions (`rejectCall`, `rejectEnvido`, `resolveMatch`) — it never re-implements scoring or hand sequencing.

### Decision: where fold scoring lives

| Choice | Rejected alternative | Rationale |
|---|---|---|
| New pure `foldHand(state, folderId)` in `src/domain/game/fold.ts`, exported via the domain barrel | Inline the branching inside the hook reducer | Fold has 4 scoring branches with point rules — that is game logic, and `config.yaml rules.design` mandates "separate domain logic from UI (testable game engine)". A pure fn is unit-testable without React and keeps the hook dumb (it just dispatches). |
| Reuse `rejectCall` / `rejectEnvido` / `resolveMatch` | Add bespoke scoring math | `rejectCall` already chains `rejectEnvido` when envido is pending and calls `resolveMatch` with the caller as winner — fold-with-truco is exactly that. Reusing avoids divergent scoring and double-counting. |

### Scoring branches (evaluated in this order)

`opponent = the other player id`. Branch selection mirrors the spec's fold-scoring table.

| # | Guard | Action | Points to opponent |
|---|---|---|---|
| 1 | `callState.pendingCall?.status === "pending"` | `return rejectCall(state, folderId)` | caller wins `callPoints(acceptedLevel)`; `rejectCall` ends the hand. **No extra fold penalty.** (If envido is also pending, `rejectCall` already chains `rejectEnvido` first.) |
| 2 | `envidoState.pendingEnvido?.status === "pending"` (no truco) | `rejectEnvido(state, folderId)` → then `resolveMatch(s2, opponent, 1)` | caller wins envido rejection pts, THEN opponent +1 for the fold |
| 3 | round 1 (`rounds.length === 1`) AND `folderId === hand.mano` AND no truco pending/accepted | `resolveMatch(state, opponent, 2)` | 2 |
| 4 | else (round > 1, or folder is pie) AND no truco pending | `resolveMatch(state, opponent, 1)` | 1 |

Branch 1 short-circuits because `rejectCall` is the canonical "I don't want the truco" path and already resolves the hand. Branches 3/4 use a `pointsOverride` so the fold penalty is independent of any *accepted* truco level (an accepted-but-not-pending truco still folds at the branch-3/4 base, matching the spec's "no truco pending" wording — folding after accepting truco without a new pending call is the round>1/pie path).

### Domain helper signature

```ts
// src/domain/game/fold.ts
import { rejectCall } from "./calls";
import { rejectEnvido } from "./envido";
import { resolveMatch } from "./match";
import type { MatchState, Result } from "./types";

/**
 * Player concedes the current hand ("me voy al mazo").
 * Validation: MATCH_OVER → OUT_OF_TURN.
 * Scoring (in order): truco pending → rejectCall; envido pending → rejectEnvido + 1pt;
 * round1 & folder is mano → opponent +2; else → opponent +1.
 * Always resolves the hand via resolveMatch (next hand dealt or matchOver).
 */
export function foldHand(state: MatchState, folderId: string): Result<MatchState>;
```

Exported from `src/domain/game/index.ts` barrel: `export { foldHand } from "./fold";`. The opponent id is resolved inline (`state.hand.players.find(p => p.playerId !== folderId)`), matching the existing private `otherPlayer` pattern in `calls.ts`/`envido.ts`/`play.ts` (which are not exported). `foldHand` MUST stay pure — same `state → Result<state>` shape as every other domain fn, so `purity` guarantees hold and `resolveMatch` handles all hand-sequencing.

### Hook handler (`onMazo`)

```ts
// reducer case in useGameState
case "MAZO": {
  const res = foldHand(state.matchState, action.folderId); // folderId = human playerId
  if (!res.ok) return state;                                // gated; no-op on error
  return {
    matchState: res.state,
    log: [...state.log, foldLogEntry(action.folderId, state.matchState)],
  };
}
```

`handlers.onMazo = () => dispatch({ type: "MAZO", folderId: playerId })`. The hook does NOT branch on truco/envido — that logic is entirely inside `foldHand`. After dispatch, `resolveMatch` (called by `foldHand`) has already dealt the next hand or flipped `phase: "matchOver"`, so the view reflects it with no extra sequencing.

The `mazo` action is already covered in `deriveActions` above (`mazo: canInitiate`), which encodes the spec gate: player's turn, no call pending, no envido pending. `canInitiate` is false when `phase === "matchOver"` because `currentTurn` no longer equals the human after a match ends, satisfying the "absent when match over" scenario; the hook MAY also `&& phase !== "matchOver"` explicitly for clarity.

`ActionBar` renders the fold button purely from `actions.mazo`:

```tsx
{actions.mazo && (
  <Button onPress={handlers.onMazo} accessibilityLabel="Me voy al mazo">
    {t("screens.game.actions.mazo")} {/* "Me voy al mazo" */}
  </Button>
)}
```

No special casing — it sits alongside the other gated buttons, omitted (not disabled) when `actions.mazo` is false, per the Action Bar spec.

## Event Log Entry Type

```ts
// src/features/game/logic/logEntry.ts
type LogEntry = Readonly<{
  id: string;                 // `${seq}` monotonic
  kind: "play" | "trick" | "call" | "callResponse" | "envido" | "envidoResponse" | "fold";
  actorName: string;          // resolved from playerId
  text: string;               // pre-localized line, e.g. "Vos: 7 Espada"
}>;
```

Derivation per transition (reducer compares prev→next):
- **play**: trick gained a `PlayedCard` → `{actor}: {rank} {suit}`.
- **trick**: a round's `trick.resolved` flipped true → winner name + winning card.
- **call/callResponse**: new tail in `callState.history`.
- **envido/envidoResponse**: new tail in `envidoState.history`; on accept, append scored result.
- **fold**: built directly by `foldLogEntry(folderId, prevState)` in the `MAZO` case (not diffed) → `{kind: "fold", actorName, text}` e.g. `"Mauro se fue al mazo"`. Required because the fold has no domain history tail to diff against.

Log is append-only state, never recomputed ⇒ stable `EventLog` order.

## Component Hierarchy & Props

```
GameScreen                         // uses useGameState; Screen wrapper (scrollable)
├─ ScoreHeader     { scores, handNumber, roundNumber }   → 2× ScoreBadge + label
├─ OpponentZone    { name, cardCount, isActive }         → name + N× CardBack + TurnIndicator
├─ TableZone       { trick: PlayedCard[], playerId }     → played-card slots (CardFace + attribution)
├─ ActionBar       { actions, handlers }                 → renders only enabled Buttons
├─ PlayerHandZone  { cards, enabled, onPlay }            → N× CardFace (touchable/disabled)
└─ EventLog        { entries }                           → ScrollView, own bounds, label-sm + body-md
```

Shared primitives:

```
src/shared/ui/
├─ CardFace   { rank, suit, onPress?, disabled?, testID }
│             // Text "{rank} {suit}"; accessibilityLabel = same; suit color = theme.colors.suits[suit]
└─ CardBack   { testID }
              // accessibilityLabel "Carta boca abajo"; no rank/suit text
```

Each component: presentational, `useTheme()` + co-located `*.styles.ts` factory `(theme) => StyleSheet.create({...})`, no domain import, no magic numbers, strings via `t()`/`jargon.ts`.

## State Management Approach

- Single `useReducer`; actions: `PLAY`, `CALL`, `CALL_ENVIDO`, `ACCEPT`, `REJECT`, `MAZO`, `OPPONENT_PLAY`.
- Each action calls the matching domain fn (`MAZO` → `foldHand`); on `ok:true` swap `matchState` + append `LogEntry[]`; on `ok:false` no-op (gating already prevents these).
- `resolveMatch` auto-deals the next hand and resets turn — the hook reflects it; no manual hand sequencing.
- Opponent: `useEffect([matchState.currentTurn])` → if opponent's turn and nothing pending, `setTimeout(() => dispatch(OPPONENT_PLAY), ~700ms)` plays a random valid card (Phase 9 adds strategy). Cleanup clears the timer.

## Mobile Layout Strategy

- Root `Screen` → `ScrollView` with `contentContainerStyle` gap; vertical flex column, mobile-first.
- Order fixed top→bottom (per spec); no absolute positioning between zones ⇒ no overlap.
- Hand fan: cards ~80px wide; overlap via negative `marginLeft` constant on cards 2–3; horizontal-scroll fallback if width-constrained.
- `EventLog`: fixed-max-height `ScrollView` in normal flow below the hand (not a drawer/overlay) ⇒ never covers table/hand; scrolls within its bounds.
- Touch targets ≥ 44×44 via `minWidth`/`minHeight` constants on `CardFace` + `Button`.
- Safe area via existing `Screen` (both insets). ≥768px grid is out of scope for this slice.

## Testing Strategy

| Layer | What | Approach |
|---|---|---|
| Logic | `deriveActions` full spec table + window edges (incl. `mazo` gate) | Pure unit, fabricated `MatchState`, no render |
| Domain | `foldHand` all 4 branches: truco-pending→`rejectCall`, envido-pending→reject+1, round1-mano→+2, else→+1; MATCH_OVER/OUT_OF_TURN guards | Pure unit, seeded `MatchState`, assert team scores + next hand / matchOver |
| Logic | log derivation per transition kind (incl. `foldLogEntry`) | prev/next states → assert `LogEntry[]` |
| Hook | `useGameState` play/call/accept/reject/**mazo** + opponent auto-play | RTL `renderHook` + `jest.useFakeTimers()` |
| Component | `CardFace` label+a11y, `CardBack` "Carta boca abajo", disabled state | RTL in `ThemeProvider`; assert text + `accessibilityState.disabled` |
| Component | `ActionBar` only enabled buttons; `PlayerHandZone` 3 cards + tap→`onPlay`; `EventLog` independent scroll | RTL `getByText`/`queryByText` (absent≠disabled), `fireEvent.press` |
| Screen | six zones present, vertical order, no `PlaceholderScreen` | RTL smoke render, seeded `rng` |

Tests live under `__tests__/` mirroring source, wrapped in `ThemeProvider` (+ `I18nProvider` where `t()` used), seeded via `CreateMatchOptions.rng`.

## Migration / Rollout

No data migration; domain untouched. New i18n keys under `screens.game.*` (turn/action labels not in `jargon.ts`); jargon stays Spanish. Rollback = restore `PlaceholderScreen` and drop new keys.

## Open Questions

- [ ] Opponent auto-play delay (~700ms) — confirm value or make it a constant tuned later.

### Resolved

- [x] **"Me Voy al Mazo" mid-hand scoring** — RESOLVED by the spec's fold-scoring table and the `foldHand` domain helper (see *Me Voy al Mazo (Fold Hand)* above). Fold routes through existing `rejectCall`/`rejectEnvido`/`resolveMatch` engine functions; no bespoke scoring. Branches: truco-pending→`rejectCall`; envido-pending(no truco)→`rejectEnvido` + opponent +1; round-1-mano→opponent +2; else→opponent +1.

## Key Learnings

1. The Truco domain (`src/domain/game/`) emits NO events and has NO opponent/CPU auto-play; the event log must be DERIVED in the UI hook from `callState.history`, `envidoState.history`, and trick-resolution diffs, and opponent moves must be scheduled via `useEffect` + `setTimeout` in the hook.
2. `resolveMatch` auto-deals the next hand and resets `currentTurn` inside the domain, so the UI must NOT sequence hands manually — it just reflects the returned `MatchState`.
3. Action gating must render buttons ABSENT (not disabled) per spec; a pure `deriveActions(state, playerId)` selector mirroring the domain's validation order (and reusing `isEnvidoWindowOpen`) keeps it unit-testable and aligned with the engine.
4. Project conventions are strict: presentational components use `useTheme()` + co-located `*.styles.ts` factory `(theme) => StyleSheet.create(...)`, logic lives in hooks, strings go through `jargon.ts`/`t()`, and tests are RTL wrapped in `ThemeProvider`, seeded deterministically via `CreateMatchOptions.rng`.
5. "Me voy al mazo" needs ONE new pure domain fn `foldHand(state, folderId)` in `src/domain/game/fold.ts` (barrel-exported) — it does NOT live in the hook. It reuses `rejectCall`/`rejectEnvido`/`resolveMatch` instead of bespoke scoring: truco-pending folds are exactly `rejectCall` (which already chains `rejectEnvido`), envido-pending(no truco) is `rejectEnvido` + opponent +1, round-1-mano is opponent +2, everything else opponent +1. The hook's `MAZO` case just dispatches `foldHand` + appends a `foldLogEntry` (built directly, since fold has no domain history tail to diff). `deriveActions` already gates `mazo: canInitiate`.

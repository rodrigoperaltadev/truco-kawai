# Exploration: game-table-ui

## Topic
Rebuild the Stitch game table as a proper React Native Web screen (Phase 7 of the backlog).

## Current State

### App Structure
- **Expo Router** with Stack navigator (`src/app/_layout.tsx` exports a single `Stack`)
- Routes already exist under `src/app/`: `/` (menu), `/game` (index + setup)
- Path alias `@/*` maps to `./src/*`
- Strict TypeScript, Biome linting, jest-expo testing

### Existing UI Primitives (Phase 2 complete)
| Component | Location | What it does |
|-----------|----------|--------------|
| `Screen` | `src/shared/ui/Screen/` | SafeAreaView wrapper, optional title, scrollable prop |
| `Card` | `src/shared/ui/Card/` | Elevated container (elevation 1 or 2), accepts `testID` |
| `Button` | `src/shared/ui/Button/` | Pressable with `primary`/`secondary` variants, disabled state |
| `Pill` | `src/shared/ui/Pill/` | Small label badge with `default`/`jargon` variants |
| `ScoreBadge` | `src/shared/ui/ScoreBadge/` | Team score display with `teamNos`/`teamEllos` colors |
| `PlaceholderScreen` | `src/shared/ui/PlaceholderScreen/` | Full-placeholder placeholder screen used by GameScreen |

### Theme Tokens (Phase 2 complete)
All Nocturnal Bodegón design tokens are implemented in `src/shared/theme/`:
- **Colors**: dark green surface (`#151406`), cream text (`#e8e3cb`), team accents (`teamNos` red, `teamEllos` blue), suit accent colors
- **Typography**: Libre Caslon Text (display/headline), Hanken Grotesk (body/label)
- **Spacing**: 4px base unit — `xs=4`, `sm=8`, `md=16`, `lg=24`, `xl=32`
- **Radius**: `sm=4`, `md=8`, `lg=12`, `full=9999`
- **Shadows**: Platform-appropriate elevation (0–3) via `shadows.elevation(n)`

### Game Domain (Phases 3–6 complete)
- `src/domain/deck/`: Card types, suits, ranks
- `src/domain/game/`: `MatchState`, `HandState`, `RoundState`, `TrickState`, all game logic (play, calls, envido)
- `useGameScreen` and `useGameSetupScreen` hooks exist in `src/features/game/hooks/`
- `GameScreen` currently just renders `PlaceholderScreen` with translations

### i18n
- `src/shared/i18n/jargon.ts` already defines Spanish terms for suits, ranks, and calls
- `src/shared/i18n/locales/` has menu translations for es/en

### Key Gap
**No actual game table UI exists.** `GameScreen` is a stub. The Stitch export folder (`stitch_truco_lab_premium_ui/`) does not exist in the repo — it is explicitly noted as visual reference only and its HTML/CSS must not be copied.

---

## Affected Areas

| Path | Why affected |
|------|-------------|
| `src/features/game/GameScreen.tsx` | Will be replaced with real game table layout |
| `src/features/game/hooks/useGameScreen.ts` | Needs state integration (match state, actions) |
| `src/features/game/` | New zone components needed: `OpponentZone`, `TableZone`, `PlayerHand`, `ActionBar`, `EventLog`, `TurnIndicator` |
| `src/shared/ui/` | May need new `CardFace` component (for Spanish deck display) |
| `src/shared/theme/` | May add layout-specific tokens (e.g. `cardOverlap`) |
| `src/app/game/index.tsx` | Currently just re-exports GameScreen — no change needed |

---

## What the Game Table Needs

### Zone breakdown

1. **Opponent Zone** (top of screen)
   - Opponent's 3 card backs (fan layout)
   - Opponent name
   - Cards remain face-down until played

2. **Table Zone** (center)
   - Played cards laid out in sequence (up to 6 cards — 3 per player per hand)
   - Each card slot shows who played it and the card face
   - Won tricks get a subtle indicator (filled vs. empty slot)

3. **Player Hand Zone** (bottom)
   - 3 card faces in a fan, overlapping horizontally
   - Tappable to play a card
   - Disabled when not player's turn

4. **Score Display** (persistent header or top bar)
   - Two `ScoreBadge` components — `teamNos` and `teamEllos`
   - Current hand/round indicator

5. **Action Buttons** (centered below table or in a bottom bar)
   - **Truco flow**: `Truco`, `ReTruco`, `Vale4` buttons (state-gated)
   - **Envido flow**: `Envido`, `Real Envido`, `Falta Envido` buttons (state-gated)
   - **Responses**: `Quiero`, `No Quiero`
   - **Other**: `Me Voy al Mazo` (fold)
   - All buttons disabled when not player's turn or window closed

6. **Event Log** (side panel on desktop, collapsible drawer on mobile)
   - Scrollable list of game events
   - Timestamps, call history, trick resolutions
   - Uses `label-sm` for timestamps, `body-md` for content
   - Background: `surfaceContainer`, gold-bordered key events

7. **Turn Indicator**
   - Pulsing/glowing indicator on active player zone
   - Text: "Tu turno" / "Turno de [name]"
   - Can use `Pill` with jargon variant

### Layout Constraints

**Mobile-first** (per backlog Phase 7):
- Vertical stack: opponent zone → table zone → action buttons → player hand
- Event log: collapsible bottom drawer, NOT overlapping the table
- Cards sized to fit 3 visible in a row with overlap (~80px wide on mobile)
- Touch targets minimum 44px

**Desktop** (after mobile is clear):
- 12-column fluid grid: outer 2 columns for log/scores, center 8 for table
- Cards can be larger (~100px wide)
- Log is a permanent sidebar

### Card Layout Math

With 3 cards at 80px wide, 40px overlap (per design tokens `cardOverlap: -40px`):
- Total hand width = `80 + 2 * (80 - 40) = 80 + 80 = 160px` — very compact
- On desktop: 100px wide cards → `100 + 80 = 180px` total

---

## Approaches

### Approach 1: Single monolithic GameScreen with inline zone components

Build everything inside `src/features/game/GameScreen.tsx` using the existing `Screen` wrapper, composing zones as local components.

- **Pros**: Fast to build, easy to co-locate, simple for MVP
- **Cons**: Hard to test individually, will grow unwieldy
- **Effort**: Low

### Approach 2: Feature-level components with a game state hook

Extract zones into `src/features/game/components/{OpponentZone,TableZone,...}.tsx`, driven by a central `useGameState` hook that reads from the domain engine.

- **Pros**: Testable zones, clear boundaries, follows existing `src/features/` pattern
- **Cons**: More files, needs hook wiring
- **Effort**: Medium

### Approach 3: Full component library — game-specific atoms

Create `src/components/game/` with primitive game atoms (`CardSlot`, `PlayedCardView`, `FanHand`, `ActionButton`, `TrickPile`, `GameLog`) composed into zone components, driven by a game state context.

- **Pros**: Most reusable, most testable, proper separation of concerns
- **Cons**: Most upfront investment, may be over-engineered for Phase 7
- **Effort**: High

---

## Recommendation

**Approach 2** — Feature-level zone components with a game state hook.

Rationale:
- Matches existing project conventions (`src/features/` structure already used for menu, rules, settings, result, shared)
- Keeps zone logic co-located in `src/features/game/components/`
- A `useGameState` hook can bridge the domain `MatchState` to UI state (selected card, pending call, log entries)
- Avoids monolithic screen while not over-engineering with atom-level components before the MVP is proven
- Subsequent phases (CPU opponent, trainer features) can extend the same hook

### State management approach

The domain engine (`src/domain/game/`) is pure — it takes a `MatchState` + command and returns a new `MatchState`. The UI layer should:
1. Hold `MatchState` in a React context or local state
2. Use the domain functions directly (no middleware needed for MVP)
3. `useGameState` hook exposes: `{ matchState, playCard, makeCall, acceptCall, rejectCall, acceptEnvido, rejectEnvido }`
4. CPU moves are triggered via `setTimeout` or a `useEffect` watching `currentTurn !== playerId`

### Component boundary sketch

```
src/features/game/
  GameScreen.tsx              # Root screen — uses zone components + Screen wrapper
  hooks/
    useGameState.ts           # Bridge: domain MatchState → UI state
    useGameScreen.ts          # (existing) i18n for screen title
  components/
    OpponentZone.tsx          # 3 card backs, name, turn indicator
    TableZone.tsx             # Trick pile + won tricks display
    PlayerHandZone.tsx        # 3 tappable card faces, selected state
    ScoreHeader.tsx           # ScoreBadges + round indicator
    ActionBar.tsx             # Truco/Envido/MeVoy buttons, Quiero/NoQuiero responses
    EventLog.tsx              # Scrollable game log (desktop sidebar / mobile drawer)
    TurnIndicator.tsx        # Animated "Tu turno" pill
    CardBack.tsx              # Reusable opponent card back
    CardFace.tsx              # Reusable player card face with suit/rank
    TrickPile.tsx             # 2–6 played cards in center
```

---

## Risks

1. **Event log overlap on mobile**: The log drawer must not cover the table zone — needs careful z-index and animation. Design token `spacing.container=24` and careful flex ordering will be critical.
2. **Card overlap math**: The fan layout with `-40px` overlap is aggressive on small screens. May need a responsive overlap value or a horizontal scroll fallback.
3. **No actual card illustrations**: The backlog notes "temporary vector/card placeholders" — Phase 3 mentions this. The game table will need at least suit symbols and rank numerals to be functional.
4. **Turn management**: The domain engine has `currentTurn` but no built-in turn transition. CPU auto-play needs careful sequencing to avoid UI jank.
5. **Call button state gating**: Truco/Envido calls must be disabled outside their windows. The domain has `CallState.pendingCall` and `isCallWindowOpen` logic — wiring this to button disabled states is non-trivial.

---

## Ready for Proposal

**Yes.**

The orchestrator should confirm:
1. Is Approach 2 (feature-level zones + useGameState hook) the right granularity?
2. Should `CardFace` display use text-based suit/rank (from `jargon.ts`) or SVG illustrations?
3. Is the mobile-first layout: OpponentZone → TableZone → ActionBar → PlayerHand the intended vertical order?
4. Does the event log need real-time updates (WebSocket) or is local state sufficient for MVP?

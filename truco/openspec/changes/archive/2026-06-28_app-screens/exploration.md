# Exploration: app-screens

## Current State

### Navigation Structure

The app uses **Expo Router** with routes living in `src/app/` (not the standard `app/` directory — the Expo Router convention is overridden here). The root layout at `src/app/_layout.tsx` wraps the entire app in a `Stack` navigator and three providers: `FontGate`, `ThemeProvider`, and `I18nProvider`.

All 8 Phase 8 screens already have route files and placeholder/feature screen implementations:

| Route | Route File | Screen | Status |
|-------|-----------|--------|--------|
| `/` | `src/app/index.tsx` | `MainMenuScreen` | ✅ Implemented |
| `/game/setup` | `src/app/game/setup.tsx` | `GameSetupScreen` | ⚠️ Placeholder |
| `/game` | `src/app/game/index.tsx` | `GameScreen` | ✅ Implemented |
| `/rules` | `src/app/rules/index.tsx` | `RulesScreen` | ⚠️ Placeholder |
| `/rules/ranking` | `src/app/rules/ranking.tsx` | `RankingScreen` | ⚠️ Placeholder |
| `/result` | `src/app/result.tsx` | `ResultScreen` | ⚠️ Placeholder |
| `/settings` | `src/app/settings.tsx` | `SettingsScreen` | ⚠️ Placeholder |
| `/about` | `src/app/about.tsx` | `AboutScreen` | ⚠️ Placeholder |

`MainMenuScreen` and `GameScreen` are fully implemented. The remaining 6 screens all render `PlaceholderScreen` (a shared UI component that takes `title` and `subtitle` props and optionally shows jargon pills).

### Existing Navigation Pattern

`MainMenuScreen` uses `useMainMenu()` which calls `router.push(href)` from `expo-router` to navigate. The hook defines a typed `MenuItem` union of all valid hrefs. This is the established pattern for programmatic navigation.

### i18n Setup

Defined in `src/shared/i18n/index.tsx`. Uses `i18n-js` with `I18nProvider` context. Supports `es` (default) and `en`. Locale is resolved from device (`expo-localization`), overridable via `AsyncStorage` key `@truco/locale`. Translations live in `src/shared/i18n/locales/es.ts` and `en.ts`. The `useTranslations()` hook returns `{ t, locale }`. Jargon terms (truco, envido, suits, ranks) are kept Spanish in both locales via a separate `jargon.ts` module.

### Game State Architecture

`GameScreen` uses `useGameState()` hook which owns a `useReducer` over `MatchState`. It takes `CreateMatchOptions` (players, pointsToWin, playerId) directly in props — **no navigation params yet**. The match is created inside the hook via `createMatch()`. CPU opponent auto-plays with a 700ms delay via `setTimeout`.

`MatchState` carries `players: readonly [Player, Player]` and `pointsToWin: 15 | 30`. This is the domain entry point.

### Shared UI Primitives

- `Screen` — wraps content in `SafeAreaView` + `ScrollView` (or plain `View`), accepts `title`, `scrollable`, `testID`. Uses `useTheme()`.
- `Button` — variants `primary` / `secondary`, uses `Pressable` with `boxShadow` styles.
- `PlaceholderScreen` — renders `Screen` + title + subtitle + optional jargon pills.
- `Pill` — small labeled badge (e.g. jargon pills).
- `Row`, `Stack` — layout helpers.

### Domain Models

The full Truco engine exists in `src/domain/game/`:
- `types.ts` — all domain types (`Player`, `Team`, `MatchState`, `HandState`, `CallState`, `EnvidoState`, etc.)
- `match.ts` — `createMatch()`, `dealHand()`, `resolveMatch()`, `scoreEnvido()`
- `calls.ts` — `makeCall`, `acceptCall`, `rejectCall` for truco escalation
- `envido.ts` — envido-specific call logic (Phase 6 done)
- `turn.ts` — mano/pie role assignment
- `play.ts` — `playCard` with all guards

### What Is Missing for Phase 8

1. **Game setup screen** — needs to collect `pointsToWin` (15/30) and `opponentType` (vs CPU only for MVP), then launch the game with those options.
2. **Navigation params wiring** — `GameScreen` currently receives `CreateMatchOptions` as hook props, not as Expo Router search params. The flow `menu → game/setup → game` is not wired.
3. **Result screen** — needs to receive and display match outcome (`winner`, `finalScores`, `pointsToWin`) from `MatchState`.
4. **Settings screen** — currently a placeholder. Needs locale switcher UI wired to `I18nProvider.setLocale()`.
5. **Rules screen** — static tutorial content. Needs a scrollable text-based rules view.
6. **Ranking screen** — static reference showing the 40-card Spanish deck ranking (1–7, 10–12 per suit, with envido values).
7. **About screen** — static portfolio text.
8. **Main menu → game setup → game flow** — no deep linking or back navigation handling yet.

---

## Affected Areas

- `src/app/_layout.tsx` — root `Stack` needs `headerBackVisible` or `headerBackTitle` for back navigation on child routes
- `src/app/game/setup.tsx` — placeholder → needs real form with points/opponent selection
- `src/features/game/GameSetupScreen.tsx` — placeholder → needs to accept user input and pass to `useGameState`
- `src/features/game/hooks/useGameSetupScreen.ts` — placeholder hook → needs state for form
- `src/app/game/index.tsx` — currently hardcodes `playerId: "human"` and `pointsToWin: 15`; needs to read from search params
- `src/features/game/GameScreen.tsx` — already reads `useGameState(opts)`; needs opts from params
- `src/features/game/hooks/useGameState.ts` — currently takes `CreateMatchOptions` as hook props; needs to accept from router params
- `src/app/result.tsx` — placeholder → needs to read match result from a shared state store (e.g. AsyncStorage or a module-level singleton) or navigation params
- `src/features/result/hooks/useResultScreen.ts` — placeholder → needs to load match result
- `src/app/settings.tsx` — placeholder → needs locale switcher
- `src/features/settings/hooks/useSettingsScreen.ts` — needs `setLocale` integration
- `src/shared/i18n/locales/es.ts` — `rules` and `ranking` screen copy needed
- `src/shared/i18n/locales/en.ts` — `rules` and `ranking` screen copy needed
- `src/app/rules/index.tsx` and `src/app/rules/ranking.tsx` — currently delegate to placeholder features; need real implementations

---

## Approaches

### 1. Screen-by-Screen Ad-hoc (No Shared State)

Each screen is built independently. Game setup uses `localStorage`/`AsyncStorage` to pass match config to game screen. Result screen reads from a module-level exported variable or AsyncStorage key set by `useGameState` when `phase === "matchOver"`.

**Pros:** No architecture changes, works with existing `useGameState` API.
**Cons:** AsyncStorage is async and slow for this use case. Module-level singletons are fragile and untestable. No back navigation support — if the user presses back from result, game state is lost. Tight coupling between screens via implicit state.

**Effort:** Medium (6 screens to build, each with its own data-fetching strategy)

---

### 2. Expo Router Search Params + Redirect

`/game/setup` collects options, writes them as **search params** on the `/game` route (e.g. `/game?pointsToWin=15&opponentId=cpu`). `GameScreen` reads `useLocalSearchParams()` to construct `CreateMatchOptions`. Match result is written to an AsyncStorage key at match-over time; `/result` reads it. Settings writes locale to AsyncStorage (already done).

**Pros:** Clean URL state, back navigation works naturally, no module singletons, aligns with Expo Router conventions.
**Cons:** Search params are visible in URL (acceptable for game config). AsyncStorage for result is still async overhead. Result screen needs a loading state while reading AsyncStorage.

**Effort:** Medium

---

### 3. React Context for Game Session

Introduce a `GameSessionContext` that wraps the stack. When `/game/setup` completes, it writes the match config into context. `GameScreen` reads from context. When match ends, the context holds the result and `/result` reads it. Settings locale already uses `I18nContext`.

**Pros:** Type-safe, synchronous, no AsyncStorage overhead for game config/results. Easy to test — just wrap with a custom provider. No URL pollution.
**Cons:** Requires a new context file (`GameSessionProvider`) and wrapping the game stack in `_layout.tsx`. Slightly more initial architecture work.

**Effort:** Medium-High (context setup + wire up)

---

### 4. URL-Based Game State with Shared result via AsyncStorage (Hybrid)

Use search params for setup (clean, REST-like). On match over, write result to a stable AsyncStorage key (`@truco/last-result`). `/result` reads and clears it. Settings keeps existing AsyncStorage pattern for locale.

**Pros:** Best of both — clean setup flow via URL, result survives back-navigation from result to menu, matches Expo Router idioms.
**Cons:** AsyncStorage is async; needs `useEffect` + loading state in result screen. Still two AsyncStorage keys (`@truco/locale` and `@truco/last-result`).

**Effort:** Medium

---

## Recommendation

**Approach 4 (Search Params + AsyncStorage result)** is the recommended path.

Rationale:
- `GameSetupScreen` → `GameScreen` via search params is idiomatic Expo Router and requires zero new architecture.
- Writing match result to a dedicated AsyncStorage key (`@truco/last-result`) is the simplest way to preserve the result across back-navigation without introducing a context layer.
- Settings already uses AsyncStorage correctly for locale — no change needed there.
- The existing `useGameState` hook is already the right abstraction; it just needs its options source to change from hardcoded props to search params.
- The `Screen`, `Button`, `PlaceholderScreen` shared components provide a consistent base; each new screen composes them.
- Backlog already defines these screens as Phase 8 deliverables — this approach stays within the stated scope.

### Navigation Flow

```
/ (MainMenuScreen)
  └── /game/setup (GameSetupScreen — form: pointsToWin, opponent=CPU)
        └── /game?pointsToWin=15&opponentId=cpu (GameScreen)
              └── on matchOver → write to @truco/last-result
                    └── /result (ResultScreen — reads + clears storage)
                          └── back → / (MainMenuScreen)
```

Additional routes (no data passing):
- `/rules` — static rules content
- `/rules/ranking` — static ranking table
- `/settings` — locale switcher (already wired to I18nProvider)
- `/about` — static portfolio text

---

## Risks

- **AsyncStorage latency on result screen**: Result screen will need a `useEffect` to load from AsyncStorage, creating a brief loading flash. Mitigation: show a loading state or skeleton while reading.
- **Search params URL pollution**: `/game?pointsToWin=15` is visible in the URL. Not a security risk for a game app but worth noting. Mitigation: use a hash or post-message if URL cleanliness matters.
- **CPU opponent only for MVP**: `GameSetupScreen` form only needs `pointsToWin` selector; opponent is always CPU. The `opponentId` param can be hardcoded to `"cpu"` until multiplayer is added.
- **No rollback if user presses back**: If the user presses back from `/game` to `/game/setup` mid-match, the in-progress game state is lost (no persistence layer for active games). This is acceptable for MVP.
- **i18n copy for rules/ranking**: `es.ts` and `en.ts` currently have empty `screens.rules` and `screens.ranking` keys (only `placeholder` value). All rules/tutorial and ranking content copy needs to be added to both locale files.
- **`rn-refactor` skill not found**: The skill file at `.agents/skills/rn-refactor/SKILL.md` does not exist. Only `building-native-ui` was available and loaded. The refactor patterns described in that skill (container/presentational split, hook extraction) are already partially in use (e.g. `useGameState`, `useMainMenu`) but no explicit `rn-refactor` guidance was applied.
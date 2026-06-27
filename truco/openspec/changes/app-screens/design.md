# Design: App Screens

## Technical Approach

Replace 6 placeholder screens with domain content, following the established
feature-folder convention: each screen = `Screen.tsx` (presentational, composes
`@/shared/ui` + `@/shared/layout`) + `hooks/useX.ts` (logic, i18n, storage, nav)
+ `Screen.styles.ts` (`createXStyles(theme)`). No new dependencies, no new
architecture layer. Setup → game passes config via Expo Router search params;
match result flows menu-ward via a single AsyncStorage key. Domain stays pure —
the ranking screen *derives* from `createDeck()`/`trucoRank()` rather than
hardcoding. (Spec: `app-shell`, `game-table-ui`; Exploration: Approach 4.)

## Architecture Decisions

| Decision | Choice | Rejected | Rationale |
|----------|--------|----------|-----------|
| Setup → game handoff | Expo Router search params (`useLocalSearchParams`) | Context, module singleton | Idiomatic; survives back-nav; zero new wiring |
| Result handoff | AsyncStorage `@truco/last-result` written on `matchOver` | Params (lost on back), context provider | Survives back from `/result`; existing dep |
| Volume controls | Stepped `Button` segments, value 0–1 | `@react-native-community/slider` | Slider not installed; MVP is "settings-ready", unwired |
| Ranking data | Derive via `createDeck()` + `trucoRank()`, sort asc | Hardcode 40 rows | DRY; single source of truth; testable |
| `winner` semantics | Team id `team-{playerId}`; compare to `team-human` | Store player id | Domain emits team id (`match.ts`) — do not invent |
| Rules/About copy | i18n keys, composed `<Text>` sections in a `ScrollView` | Markdown lib | No dep; locale-aware; matches stack |

## Data Flow

    /game/setup  ──push(/game?pointsToWin=&opponentId=cpu)──▶  /game
       (form)                                              (useGameState)
                                                                │ matchOver
                                          AsyncStorage.setItem  │
                                          @truco/last-result ◀──┘
                                                   │ router.replace
                                                   ▼
                          /result ──getItem──▶ loading | result | empty ──▶ /

## useGameState Refactor (param-driven)

`GameScreen` drops `TEMP_PLAYERS`/hardcoded opts. New `useGameScreen` hook reads
params and builds `UseGameStateOptions`, defaulting safely (params absent in
jest — `GameScreen.test.tsx` renders with no router):

```ts
const { pointsToWin, opponentId } = useLocalSearchParams();
const pts = pointsToWin === "30" ? 30 : 15;        // default 15
const players = [{ id: "human", name: t("...") },
                 { id: opponentId === "cpu" ? "cpu" : "cpu", name: "CPU" }];
useGameState({ players, pointsToWin: pts, playerId: "human" });
```

Match-over side effect (new `useEffect` keyed on `view.phase`):

```ts
if (view.phase === "matchOver") {
  await AsyncStorage.setItem("@truco/last-result", JSON.stringify(result));
  router.replace("/result");
}
```

`useGameState`'s public API is unchanged; only its caller's option source moves.

## Result Persistence Shape + Hook

Key `@truco/last-result`, JSON:

```ts
type LastResult = {
  isPlayerWin: boolean;   // winner === `team-${playerId}`
  nosScore: number;       // human team score
  ellosScore: number;     // opponent team score
  pointsToWin: 15 | 30;
};
```

`useResultScreen`: state machine `"loading" | "ready" | "empty"`; `useEffect`
reads + `JSON.parse` (try/catch → empty), exposes `result`, status, and
`backToMenu`/`playAgain` (`router.replace("/")` / `"/game/setup"`).

## Screen Breakdown

| Screen | Presentational composes | Hook responsibilities |
|--------|------------------------|----------------------|
| Setup | `Screen`, segmented `Button` (15/30), CPU `Pill`, start `Button` | `pointsToWin` state (default 15); `start()` pushes param URL |
| Result | `Screen`, scores, win/lose `Text`, two `Button`s, loading/empty | load+parse storage; status; nav actions |
| Rules | `Screen scrollable`, sectioned `Text` blocks, Flor note | map `rules.*` keys to sections |
| Ranking | `Screen scrollable`, header `Row` + 40 rows | derive+sort cards; per-card suit/rank/position/envido |
| Settings | existing locale `Row` + 2 volume controls | add music/voice state + persistence |
| About | `Screen`, description, tech-stack, demo placeholder | map `about.*` keys |

## Settings State + Persistence

Add to `useSettingsScreen`: `musicVolume`/`voiceVolume` (number 0–1, step 0.25),
loaded in `useEffect`, persisted on change to `@truco/music-volume` /
`@truco/voice-volume`. Locale path unchanged.

## Rules / Ranking Content

Rules = static i18n sections (objective, suits, hierarchy, truco ladder, envido,
rounds, **Flor out-of-scope note**). Ranking = `createDeck()` →
`.sort((a,b) => trucoRank(a) - trucoRank(b))` → rows `{ position, suit (jargon),
rank (jargon), envidoValue: rank <= 7 ? rank : 0 }`. Suit/rank labels from
`jargon.ts` (stay Spanish across locales).

## i18n Key Additions

Add the 28 keys from spec's i18n table to both `es.ts` and `en.ts` under
`setup.*`, `result.*`, `rules.*`, `ranking.*`, `settings.*`, `about.*`. Jargon
(suits, ranks, truco, envido) is NOT added — sourced from `jargon.ts`.

## Testing Strategy

`yarn test` (jest-expo), unit only (`config.yaml`: integration/e2e off, coverage 0).

| Layer | What | Approach |
|-------|------|----------|
| Hook | param parse defaults; result load/parse/empty; volume persist | `renderHook` + AsyncStorage mock; assert defaults when params absent |
| Component | each screen renders content, `placeholder-screen` absent; ranking shows 40 rows | `render` helper (Theme+I18n wrappers); `testID` queries |
| Regression | existing `GameScreen.test.tsx` stays green | refactor must default 15/cpu with no router context |

Mock `expo-router` (`useLocalSearchParams`, `useRouter`) and AsyncStorage in
new tests; route files (`src/app/*`) remain thin re-exports (untested).

## Migration / Rollout

No data migration. `@truco/last-result` is additive; absence → empty state.
Per-PR feature folders; route files unchanged.

## Open Questions

- [ ] None blocking — `playAgain` target (`/game/setup` vs prior params) is a UX choice; spec lists `result.play_again`, default to `/game/setup`.

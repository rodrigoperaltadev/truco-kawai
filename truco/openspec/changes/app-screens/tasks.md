# Tasks: App Screens

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 650–850 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1: Setup/Game params + Result persistence + i18n additions / PR 2: Remaining screens + tests |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Setup screen form + GameScreen params refactor + Result persistence + i18n keys | PR 1 → main | Base: `main` |
| 2 | Settings volume + Rules + Ranking + About screens + all tests | PR 2 → main | Base: PR 1 merged |

---

## Phase 1: Infrastructure — i18n Keys + Hooks

- [x] 1.1 Add `setup.*` keys to `src/shared/i18n/locales/es.ts` and `en.ts` (7 keys: `points_to_win`, `points_15`, `points_30`, `opponent`, `opponent_cpu`, `start`, `player_turn`)
- [x] 1.2 Add `result.*` keys to both locale files (7 keys: `you_win`, `cpu_wins`, `final_score`, `play_again`, `back_to_menu`, `loading`, `empty`)
- [x] 1.3 Add `rules.*` keys to both locale files (8 keys: `title`, `objective`, `suits`, `hierarchy`, `truco_calls`, `envido_points`, `rounds`, `flor_note`)
- [x] 1.4 Add `ranking.*` keys to both locale files (3 keys: `title`, `hierarchy_position`, `envido_value`)
- [x] 1.5 Add `settings.music_volume` and `settings.voice_volume` to both locale files
- [x] 1.6 Add `about.demo_link_placeholder` and `about.tech_stack` to both locale files
- [ ] 1.7 Update `useSettingsScreen` hook to expose `musicVolume`, `voiceVolume`, `setMusicVolume`, `setVoiceVolume` — load from `@truco/music-volume` / `@truco/voice-volume` via `useEffect`, persist on change (stepped 0–1, step 0.25)

---

## Phase 2: Setup + GameScreen Refactor + Result Persistence

- [x] 2.1 Rewrite `GameSetupScreen` presentational: replace `PlaceholderScreen` with `Screen`, segmented `Button` pair for 15/30 points, `Pill` showing CPU opponent, primary `Button` "Start game"; default selection = 15
- [x] 2.2 Update `useGameSetupScreen` hook: add `pointsToWin` state (default `15`), `startGame()` nav function that calls `router.push('/game?pointsToWin=15&opponentId=cpu')` or `'/game?pointsToWin=30&opponentId=cpu'`
- [x] 2.3 Refactor `GameScreen` — drop `TEMP_PLAYERS` / hardcoded opts; add `useLocalSearchParams()` to read `pointsToWin` and `opponentId`; build `players` array and call `useGameState` with parsed options; default to `15` / `"cpu"` when params absent
- [x] 2.4 Add `useEffect` to `GameScreen` keyed on `view.phase === "matchOver"` — on match over: `AsyncStorage.setItem("@truco/last-result", JSON.stringify({ isPlayerWin, nosScore, ellosScore, pointsToWin }))` then `router.replace("/result")`
- [x] 2.5 Update `useGameScreen` hook: expose `startMatchOverEffect` or restructure so GameScreen handles the effect; update `translations` to remove placeholder reference
- [x] 2.6 Update `GameScreen.styles.ts`: add styles for new layout if needed (or confirm existing styles suffice)

---

## Phase 3: Result Screen

- [x] 3.1 Rewrite `ResultScreen` presentational: replace `PlaceholderScreen` with `Screen` + loading state (activity indicator), result state (winner banner, `Text` for `you_win` / `cpu_wins` i18n keys, score display), empty state (message + "Back to menu" `Button`)
- [x] 3.2 Define `LastResult` type: `{ isPlayerWin: boolean; nosScore: number; ellosScore: number; pointsToWin: 15 | 30 }`
- [x] 3.3 Update `useResultScreen` hook: add state machine `"loading" | "ready" | "empty"`; `useEffect` reads `@truco/last-result` → `JSON.parse` (try/catch → `"empty"`); expose `result`, `status`, `backToMenu()` → `router.replace("/")`, `playAgain()` → `router.replace("/game/setup")`; update translations to use real keys instead of placeholder

---

## Phase 4: Settings Screen (Volume Controls)

- [ ] 4.1 Add `Row` of stepped `Button` segments (0, 0.25, 0.5, 0.75, 1) for music volume in `SettingsScreen` below locale switcher — use existing `Button` component with `variant` toggling
- [ ] 4.2 Add identical stepped control for voice volume
- [ ] 4.3 Update `createSettingsStyles` in `SettingsScreen.styles.ts`: add style for volume control row and label
- [ ] 4.4 Confirm locale change already persists via existing `useSettingsScreen`; volume changes persist via updated hook from task 1.7

---

## Phase 5: Rules Screen

- [ ] 5.1 Rewrite `RulesScreen` presentational: replace `PlaceholderScreen` with `Screen scrollable` + `ScrollView` containing sectioned `Text` blocks for each Argentine Truco topic (objective, suits, card hierarchy, truco call ladder, envido point counting, round structure, flor out-of-scope note)
- [ ] 5.2 Update `useRulesScreen` hook: remove `subtitle` placeholder; add `sectionKeys` array mapping to `rules.*` i18n keys; no async needed (static i18n)
- [ ] 5.3 Confirm all jargon (suits, ranks, Truco, Envido) remains Spanish — sourced from `jargon.ts`

---

## Phase 6: Ranking Screen

- [ ] 6.1 Rewrite `RankingScreen` presentational: replace `PlaceholderScreen` with `Screen scrollable`; render `View` header row (`Position | Suit | Rank | Envido`) + 40 `View` rows derived from hook
- [ ] 6.2 Update `useRankingScreen` hook: import `createDeck`, `trucoRank`, `Suit`, `Rank`; build array of 40 cards → sort by `trucoRank` asc → map to `{ position, suitLabel (from jargon), rankLabel (from jargon), envidoValue: rank <= 7 ? rank : 0 }`; expose `cards` array sorted
- [ ] 6.3 Confirm 40 rows render (ranks 1–7, 10–12 across 4 suits = 11×4 = 44; minus 8–9 = 40 cards)

---

## Phase 7: About Screen

- [ ] 7.1 Rewrite `AboutScreen` presentational: replace `PlaceholderScreen` with `Screen`; static description paragraph, tech stack line, demo link placeholder `Text` with muted style
- [ ] 7.2 Update `useAboutScreen` hook: update translations to use `about.demo_link_placeholder` and `about.tech_stack` keys instead of `about.description` only

---

## Phase 8: Navigation + Back Button

- [ ] 8.1 Confirm `Stack` in `_layout.tsx` has `headerBackTitle` / back button visible on all sub-routes — no changes needed if existing setup covers it
- [ ] 8.2 Verify back from `/game/setup` goes to `/` (main menu) — Expo Router default stack behavior
- [ ] 8.3 Verify back from `/result`, `/settings`, `/rules`, `/rules/ranking`, `/about` goes to correct parent routes

---

## Phase 9: Tests

- [x] 9.1 Add `GameSetupScreen.test.tsx`: render with Theme+I18n wrappers; assert 15/30 buttons present, CPU pill present, start button present; assert default 15 selected
- [x] 9.2 Add `GameScreen.test.tsx` (or extend existing): render with no router context → defaults to 15/cpu; render with `pointsToWin=30` param → verify `useGameState` called with 30; verify `matchOver` triggers AsyncStorage write + navigation
- [ ] 9.3 Add `ResultScreen.test.tsx`: mock AsyncStorage to return null → assert empty state; return valid result → assert winner text shown; return loading → assert loading indicator
- [ ] 9.4 Add `SettingsScreen.test.tsx`: render; assert locale buttons, music/voice volume controls present
- [ ] 9.5 Add `useResultScreen.test.ts`: `renderHook`; mock AsyncStorage; assert status machine transitions `loading → ready` and `loading → empty`
- [ ] 9.6 Add `useSettingsScreen.test.ts`: `renderHook`; mock AsyncStorage; assert music/voice volume load from storage and persist on change
- [ ] 9.7 Add `useRankingScreen.test.ts`: assert returned array has 40 entries; assert sorted by `trucoRank` (first = espada-1)
- [x] 9.8 Run full `yarn test` suite; confirm existing tests still green

---

## Implementation Order

1. **i18n keys first** — all screens depend on translations
2. **Hook infrastructure** — `useSettingsScreen` volume extension + `useResultScreen` state machine
3. **Setup screen** — form + nav; isolated, no other deps
4. **GameScreen params** — drop temp players, read search params, add matchOver effect; depends on setup nav shape
5. **Result screen** — depends on AsyncStorage shape from GameScreen matchOver effect
6. **Settings volume** — depends on hook from step 2
7. **Rules + Ranking** — independent of game flow, can parallelize
8. **About** — simplest, last
9. **Tests** — after all screens are implemented and typecheck passes

---

## Files to Modify

| File | Change |
|------|--------|
| `src/shared/i18n/locales/es.ts` | Add 28 i18n keys under setup, result, rules, ranking, settings, about |
| `src/shared/i18n/locales/en.ts` | Same 28 keys in English |
| `src/features/game/GameSetupScreen.tsx` | Replace PlaceholderScreen with real UI |
| `src/features/game/hooks/useGameSetupScreen.ts` | Add pointsToWin state + startGame nav |
| `src/features/game/GameScreen.tsx` | Read search params, add matchOver effect |
| `src/features/game/hooks/useGameScreen.ts` | Update translations |
| `src/features/result/ResultScreen.tsx` | Replace PlaceholderScreen with loading/result/empty states |
| `src/features/result/hooks/useResultScreen.ts` | Add AsyncStorage read, state machine |
| `src/features/settings/SettingsScreen.tsx` | Add music/voice volume stepped controls |
| `src/features/settings/SettingsScreen.styles.ts` | Add volume control styles |
| `src/features/settings/hooks/useSettingsScreen.ts` | Add music/voice volume state + AsyncStorage |
| `src/features/rules/RulesScreen.tsx` | Replace PlaceholderScreen with scrollable rules |
| `src/features/rules/hooks/useRulesScreen.ts` | Update translations |
| `src/features/rules/RankingScreen.tsx` | Replace PlaceholderScreen with 40-card table |
| `src/features/rules/hooks/useRankingScreen.ts` | Derive + sort deck, compute envido values |
| `src/features/about/AboutScreen.tsx` | Replace PlaceholderScreen with static copy |
| `src/features/about/hooks/useAboutScreen.ts` | Update translations |
| `src/features/game/__tests__/GameSetupScreen.test.tsx` | New test |
| `src/features/game/__tests__/GameScreen.test.tsx` | Update/extend existing |
| `src/features/result/__tests__/ResultScreen.test.tsx` | New test |
| `src/features/settings/__tests__/SettingsScreen.test.tsx` | New test |
| `src/features/result/__tests__/useResultScreen.test.ts` | New hook test |
| `src/features/settings/__tests__/useSettingsScreen.test.ts` | New hook test |
| `src/features/rules/__tests__/useRankingScreen.test.ts` | New hook test |

# Delta: app-screens

Covers `app-shell` (Modified) and `game-table-ui` (Modified) for change `app-screens`.

---

## app-shell — MODIFIED Requirements

### Requirement: Placeholder screens

The app SHALL expose fully implemented routes for all Phase 8 screens. No route SHALL render `PlaceholderScreen` in production builds.

(Previously: routes existed but rendered `PlaceholderScreen` with a title and subtitle)

| Route | Screen | Required content |
|-------|--------|-----------------|
| `/` | Main menu | Unchanged — already implemented |
| `/game/setup` | Setup form | Points selector (15 / 30), CPU opponent fixed |
| `/game` | Game table | Reads search params; unchanged beyond param wiring |
| `/rules` | Rules & tutorial | Argentine Truco rules content (scrollable) |
| `/rules/ranking` | Card ranking | 40-card Spanish deck ordered by Truco hierarchy |
| `/result` | Match result | Winner, final scores read from `@truco/last-result` |
| `/settings` | Settings | Language switcher, music volume, voice volume |
| `/about` | About | Portfolio explanation placeholder |

#### Scenario: No placeholder screens remain

- GIVEN the app is in production mode
- WHEN any Phase 8 route is opened
- THEN the screen renders domain content, not `PlaceholderScreen`

#### Scenario: Back navigation works from all screens

- GIVEN the user is on any sub-route (not `/`)
- WHEN the user presses the back button
- THEN the app navigates to the correct parent without crashing

---

### Requirement: Locale switching

The settings screen SHALL allow switching between `es` and `en`, persisting the choice via `AsyncStorage` key `@truco/locale`. All non-jargon UI text SHALL update immediately without app restart.

(Previously: settings rendered `PlaceholderScreen`; locale switching was specified but UI was not built)

#### Scenario: Switch to English

- GIVEN the locale is `es`
- WHEN the user selects English in settings
- THEN all menu labels, screen titles, and settings labels update to English immediately
- AND on next cold start the locale is still `en`

#### Scenario: Switch back to Spanish

- GIVEN the locale is `en`
- WHEN the user selects Español in settings
- THEN all labels revert to Spanish immediately

#### Scenario: Jargon stays Spanish across locales

- GIVEN the locale is `en`
- WHEN game jargon is displayed (Truco, Envido, Espada, Basto, Copa, Oro)
- THEN those terms remain in Spanish

---

## app-shell — ADDED Requirements

### Requirement: Game setup screen

`GameSetupScreen` MUST render a form allowing the player to select `pointsToWin` (15 or 30). The opponent MUST be fixed to CPU for MVP. On submission the screen MUST navigate to `/game?pointsToWin={value}&opponentId=cpu`.

#### Scenario: Default selection is 15 points

- GIVEN the user opens `/game/setup`
- WHEN the screen renders
- THEN the 15-point option is selected by default

#### Scenario: Player selects 30 points

- GIVEN the setup screen is open with 15 selected
- WHEN the player taps the 30-point option
- THEN the 30-point option becomes selected and 15 deselects

#### Scenario: Start game navigates with params

- GIVEN `pointsToWin` is 30
- WHEN the player taps the start button
- THEN the app navigates to `/game?pointsToWin=30&opponentId=cpu`

#### Scenario: Setup screen does not allow no-selection start

- GIVEN neither 15 nor 30 is selected (impossible via UI — default enforces 15)
- WHEN the screen renders
- THEN the start button is always enabled with a valid selection

---

### Requirement: Result screen

`ResultScreen` MUST read `@truco/last-result` from AsyncStorage and display the match winner, both teams' final scores, and the `pointsToWin` target. While loading it MUST show a loading state. If no result is found it MUST show an empty state with a return-to-menu action.

#### Scenario: Result renders winner and scores

- GIVEN `@truco/last-result` contains `{ winner, nosScore, ellosScore, pointsToWin }`
- WHEN `ResultScreen` mounts
- THEN the winner's name or label is prominently displayed
- AND both team scores are shown alongside `pointsToWin`

#### Scenario: Loading state while reading AsyncStorage

- GIVEN `ResultScreen` mounts before AsyncStorage resolves
- WHEN the component is in its loading phase
- THEN a loading indicator is shown and no result data is rendered

#### Scenario: Empty state when no result exists

- GIVEN `@truco/last-result` is null or missing
- WHEN `ResultScreen` finishes loading
- THEN an empty-state message is shown
- AND a "Back to menu" button navigates to `/`

#### Scenario: Player win message

- GIVEN `@truco/last-result.winner` equals the human player's team
- WHEN `ResultScreen` renders
- THEN the i18n key `result.you_win` is displayed (es: "¡Ganaste!", en: "You won!")

#### Scenario: CPU win message

- GIVEN `@truco/last-result.winner` equals the CPU team
- WHEN `ResultScreen` renders
- THEN the i18n key `result.cpu_wins` is displayed (es: "Ganó la CPU", en: "CPU wins")

---

### Requirement: Rules screen

`RulesScreen` MUST render scrollable Argentine Truco rules content. Content MUST cover: objective, suits (espada, basto, copa, oro), card hierarchy, truco call ladder, envido point counting, and round structure. Flor MUST be explicitly noted as out of scope. Content MUST render using the active locale via i18n keys under `rules.*`.

#### Scenario: Rules content is scrollable

- GIVEN the user navigates to `/rules`
- WHEN the screen renders
- THEN a scrollable view containing rules sections is visible

#### Scenario: Rules are in the correct locale

- GIVEN the locale is `en`
- WHEN `/rules` renders
- THEN all rules headings and body text appear in English

#### Scenario: Flor is noted as out of scope

- GIVEN the user reads the rules
- WHEN they reach the calls section
- THEN the text states that Flor is not included in this version

---

### Requirement: Ranking screen

`RankingScreen` MUST render a reference table of all 40 Spanish-deck cards ordered by their Truco hierarchy (highest to lowest). For each card it MUST show: rank, suit, Truco hierarchy position, and envido value. The layout MUST be scannable on mobile (table or vertical list).

#### Scenario: All 40 cards displayed

- GIVEN the user navigates to `/rules/ranking`
- WHEN the screen renders
- THEN exactly 40 card entries are shown (ranks 1–7, 10–12 across 4 suits)

#### Scenario: Hierarchy order is correct

- GIVEN the ranking table renders
- WHEN the user reads from top to bottom
- THEN the first entry is 1 Espada (highest) and the order matches the Argentine Truco card hierarchy

#### Scenario: Envido values are shown

- GIVEN the ranking table renders
- WHEN the user views any row
- THEN the envido point value (0 for 10–12, face value for 1–7) is visible per card

---

### Requirement: Settings screen — volume controls

`SettingsScreen` MUST expose a music volume control and a voice volume control alongside the language switcher. Controls MUST be clearly labeled. Volume state MUST persist to AsyncStorage keys `@truco/music-volume` and `@truco/voice-volume`. Controls are considered settings-ready (not wired to audio output for MVP).

#### Scenario: Settings screen shows all three controls

- GIVEN the user navigates to `/settings`
- WHEN the screen renders
- THEN a language switcher, a music volume control, and a voice volume control are all visible

#### Scenario: Volume value persists across sessions

- GIVEN the user sets music volume to 0.5
- WHEN the app restarts
- THEN the music volume control initializes at 0.5

#### Scenario: Volume labels use i18n

- GIVEN the locale is `en`
- WHEN `/settings` renders
- THEN the music control is labeled using `settings.music_volume` ("Music volume")
- AND the voice control is labeled using `settings.voice_volume` ("Voice volume")

---

### Requirement: About screen

`AboutScreen` MUST render a static portfolio explanation describing Truco Lab's purpose, the technologies used (React Native, Expo Router, Expo, domain modeling), and a placeholder for a demo link. Content MUST use i18n keys under `about.*`.

#### Scenario: About screen renders static content

- GIVEN the user navigates to `/about`
- WHEN the screen renders
- THEN a description of Truco Lab and its portfolio purpose is visible
- AND a demo link placeholder is shown

#### Scenario: About content renders in active locale

- GIVEN the locale is `en`
- WHEN `/about` renders
- THEN the description text appears in English

---

## game-table-ui — MODIFIED Requirements

### Requirement: GameScreen Table Composition

`GameScreen` MUST read `pointsToWin` and `opponentId` from Expo Router search params via `useLocalSearchParams()` and pass them as `CreateMatchOptions` to `useGameState`. It MUST default to `pointsToWin: 15` and `opponentId: "cpu"` if params are absent or invalid.

(Previously: `GameScreen` received `CreateMatchOptions` directly as hook props, with `pointsToWin` hardcoded to `15` and `playerId` hardcoded to `"human"`)

#### Scenario: Game starts with 30 points from params

- GIVEN the app navigates to `/game?pointsToWin=30&opponentId=cpu`
- WHEN `GameScreen` mounts
- THEN `useGameState` is initialized with `{ pointsToWin: 30, opponentId: "cpu" }`
- AND the score header shows target as 30

#### Scenario: Game defaults to 15 points when params absent

- GIVEN the app navigates to `/game` with no search params
- WHEN `GameScreen` mounts
- THEN `useGameState` is initialized with `pointsToWin: 15`

#### Scenario: Match over triggers result persistence and navigation

- GIVEN `matchState.phase === "matchOver"`
- WHEN the state transition is detected
- THEN `@truco/last-result` is written to AsyncStorage with `{ winner, nosScore, ellosScore, pointsToWin }`
- AND the router navigates to `/result`

---

## i18n Copy Requirements

The following keys MUST be added to `src/shared/i18n/locales/es.ts` and `en.ts`:

| Key path | es | en |
|----------|----|----|
| `setup.points_to_win` | "Puntos para ganar" | "Points to win" |
| `setup.points_15` | "15 puntos" | "15 points" |
| `setup.points_30` | "30 puntos" | "30 points" |
| `setup.opponent` | "Rival" | "Opponent" |
| `setup.opponent_cpu` | "CPU" | "CPU" |
| `setup.start` | "Empezar" | "Start game" |
| `result.you_win` | "¡Ganaste!" | "You won!" |
| `result.cpu_wins` | "Ganó la CPU" | "CPU wins" |
| `result.final_score` | "Marcador final" | "Final score" |
| `result.play_again` | "Jugar de nuevo" | "Play again" |
| `result.back_to_menu` | "Volver al menú" | "Back to menu" |
| `result.loading` | "Cargando resultado…" | "Loading result…" |
| `result.empty` | "No hay resultado guardado" | "No saved result" |
| `rules.title` | "Reglas del Truco Argentino" | "Argentine Truco Rules" |
| `rules.objective` | "Objetivo" | "Objective" |
| `rules.suits` | "Palos" | "Suits" |
| `rules.hierarchy` | "Jerarquía de cartas" | "Card hierarchy" |
| `rules.truco_calls` | "Cantos de Truco" | "Truco calls" |
| `rules.envido_points` | "Puntos de Envido" | "Envido points" |
| `rules.rounds` | "Estructura de la mano" | "Hand structure" |
| `rules.flor_note` | "La Flor no está incluida en esta versión" | "Flor is not included in this version" |
| `ranking.title` | "Jerarquía completa" | "Full hierarchy" |
| `ranking.hierarchy_position` | "Posición" | "Position" |
| `ranking.envido_value` | "Valor Envido" | "Envido value" |
| `settings.music_volume` | "Volumen de música" | "Music volume" |
| `settings.voice_volume` | "Volumen de voces" | "Voice volume" |
| `about.demo_link_placeholder` | "Demo disponible próximamente" | "Demo coming soon" |
| `about.tech_stack` | "Construido con React Native, Expo Router y TypeScript" | "Built with React Native, Expo Router, and TypeScript" |

---

## Acceptance Criteria

- [ ] All 6 previously-placeholder screens render domain content.
- [ ] `GameSetupScreen` collects `pointsToWin` (15 or 30); opponent is always CPU.
- [ ] `/game` reads `pointsToWin` and `opponentId` from search params; defaults to 15/cpu.
- [ ] On `matchOver`, `@truco/last-result` is written and router navigates to `/result`.
- [ ] `ResultScreen` handles loading, success, and empty states.
- [ ] `RulesScreen` covers all mandatory Argentine Truco topics; Flor noted as out of scope.
- [ ] `RankingScreen` shows all 40 cards in correct hierarchy order with envido values.
- [ ] `SettingsScreen` exposes language, music volume, and voice volume; all persist to AsyncStorage.
- [ ] `AboutScreen` renders portfolio copy and demo link placeholder.
- [ ] All new i18n keys exist in both `es.ts` and `en.ts`.
- [ ] TypeScript compiles without errors; existing tests remain green.

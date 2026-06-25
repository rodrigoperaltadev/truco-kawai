# app-shell

## ADDED Requirements

### Requirement: Expo Router navigation

The app SHALL use Expo Router with file-based routes under `app/`.

#### Scenario: Root layout renders
- **GIVEN** the app is running
- **WHEN** the user opens `/`
- **THEN** a root layout renders without error

### Requirement: Placeholder screens

The app SHALL expose placeholder routes for all backlog screens defined in Phase 8.

| Route | Purpose |
|-------|---------|
| `/` | Main menu |
| `/game` | Game table |
| `/game/setup` | New game setup |
| `/rules` | Rules / tutorial |
| `/rules/ranking` | Card ranking reference |
| `/result` | Match result |
| `/settings` | Settings |
| `/about` | Portfolio / about |

#### Scenario: Navigate to game
- **GIVEN** the app is on the main menu
- **WHEN** the user navigates to `/game`
- **THEN** a placeholder game screen renders

#### Scenario: All routes reachable
- **GIVEN** the dev server is running
- **WHEN** each route path is opened in the browser
- **THEN** each renders a titled placeholder without crash

### Requirement: Bilingual menus (es / en)

The app SHALL support Spanish and English for navigation labels and settings UI. Game jargon (truco, envido, suit names, call names) SHALL remain Spanish in both locales.

#### Scenario: Spanish menus
- **GIVEN** the locale is `es`
- **WHEN** the main menu renders
- **THEN** navigation labels appear in Spanish

#### Scenario: English menus
- **GIVEN** the locale is `en`
- **WHEN** the main menu renders
- **THEN** navigation labels appear in English

#### Scenario: Jargon stays Spanish
- **GIVEN** the locale is `en`
- **WHEN** game-related terms are displayed (e.g. "Truco", "Envido", "Espada")
- **THEN** those terms remain in Spanish

### Requirement: Locale switching

The settings screen SHALL allow switching between `es` and `en`, persisting the choice for the session (AsyncStorage or equivalent).

#### Scenario: Switch to English
- **GIVEN** the locale is `es`
- **WHEN** the user selects English in settings
- **THEN** menu labels update to English without app restart

### Requirement: Theme stub

The app SHALL include a theme stub in `src/shared/theme/` with tokens sourced from `docs/design-tokens.md` (colors, spacing, typography references).

#### Scenario: Theme available
- **GIVEN** a screen imports the theme
- **WHEN** the screen renders
- **THEN** it uses shared color and spacing tokens (not hardcoded hex per screen)

### Requirement: README documentation

The project SHALL include a README covering setup (`yarn install`, `yarn start`), architecture overview, i18n approach, and portfolio purpose.

#### Scenario: New developer onboarding
- **GIVEN** a developer reads `README.md`
- **WHEN** they follow setup instructions
- **THEN** they can run the app locally without additional context

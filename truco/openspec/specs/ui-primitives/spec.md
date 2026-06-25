# ui-primitives

## ADDED Requirements

### Requirement: Screen component

The app SHALL provide a `Screen` component in `src/shared/ui/Screen/` that wraps SafeArea, background, optional title, and scrollable content.

#### Scenario: Screen renders with theme background
- **GIVEN** a feature route uses `<Screen title={translations.title}>`
- **WHEN** the screen mounts
- **THEN** background uses `theme.colors.background` and title uses theme typography

#### Scenario: Screen supports scroll
- **GIVEN** content exceeds viewport height
- **WHEN** rendered inside `Screen` with `scrollable`
- **THEN** content scrolls without clipping the safe area

### Requirement: Button component

The app SHALL provide `Button` with variants: `primary` (gold/tertiary), `secondary` (wood/surface), and `disabled` state.

#### Scenario: Primary button press
- **GIVEN** a enabled primary `Button`
- **WHEN** the user presses it
- **THEN** `onPress` fires and visual pressed state applies

#### Scenario: Disabled button
- **GIVEN** a `Button` with `disabled={true}`
- **WHEN** the user presses it
- **THEN** `onPress` does NOT fire and style reflects disabled state

### Requirement: Card component

The app SHALL provide a `Card` surface container with configurable elevation (levels 1–2).

#### Scenario: Card renders children
- **GIVEN** a `Card` wrapping menu items
- **WHEN** rendered
- **THEN** children appear on a themed surface with border radius from tokens

### Requirement: Pill component

The app SHALL provide a `Pill` chip for tags and jargon labels (e.g. Truco, Envido).

#### Scenario: Jargon pill
- **GIVEN** `Pill` displays `jargon.truco`
- **WHEN** rendered on any screen
- **THEN** label text stays Spanish regardless of locale

### Requirement: ScoreBadge component

The app SHALL provide a `ScoreBadge` stub showing team-colored score placeholder (palotes/tanto UI deferred to Phase 7).

#### Scenario: Team score display
- **GIVEN** `ScoreBadge` for team "ellos" with score 5
- **WHEN** rendered
- **THEN** it uses `theme.colors.teamEllos` and displays the numeric score

### Requirement: rn-refactor styling pattern

Each primitive SHALL follow: presentational `.tsx`, `*.styles.ts` with `createXStyles(theme)`, no hardcoded strings in JSX.

#### Scenario: Styles separated
- **GIVEN** any primitive under `src/shared/ui/`
- **WHEN** inspected
- **THEN** styled layout lives in a co-located `*.styles.ts` file

### Requirement: Screen refactors

`MainMenuScreen`, `SettingsScreen`, and `PlaceholderScreen` SHALL use `Screen` and at least one other primitive (`Button`, `Pill`, or `Card`).

#### Scenario: Main menu uses primitives
- **GIVEN** the main menu route `/`
- **WHEN** rendered
- **THEN** it uses `Screen` and `Button` (not raw `Pressable` for menu items)

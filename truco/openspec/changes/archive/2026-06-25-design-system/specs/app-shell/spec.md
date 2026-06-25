# app-shell (delta)

## MODIFIED Requirements

### Requirement: Theme stub

The app SHALL include a complete design system theme in `src/shared/theme/` sourced from `docs/design-tokens.md`, including colors, spacing, typography with loaded fonts, shadows, and elevation — replacing the Phase 1 stub.

#### Scenario: Theme available
- **GIVEN** a screen imports the theme
- **WHEN** the screen renders after fonts load
- **THEN** it uses shared tokens and typography (not hardcoded hex per screen)

### Requirement: Font loading gate

The root layout SHALL load Libre Caslon Text and Hanken Grotesk via `expo-font` and hold the splash screen until fonts are ready.

#### Scenario: No font flash
- **GIVEN** the app cold-starts on web
- **WHEN** the first screen renders
- **THEN** headline and body text use the correct font families (not system fallback)

#### Scenario: Splash held during load
- **GIVEN** fonts are still loading
- **WHEN** root layout mounts
- **THEN** children do not render until `SplashScreen.hideAsync()` is called after fonts load

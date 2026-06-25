# design-tokens

## ADDED Requirements

### Requirement: Full Nocturnal Bodegón token set

The theme SHALL expose all color, spacing, radius, typography, shadow, and elevation tokens defined in `docs/design-tokens.md` through a typed `Theme` interface.

#### Scenario: Colors available
- **GIVEN** `src/shared/theme` is imported
- **WHEN** a component reads `theme.colors.primary`
- **THEN** the value matches `docs/design-tokens.md`

#### Scenario: No hardcoded colors in shared UI
- **GIVEN** any file under `src/shared/ui/`
- **WHEN** inspected for color literals
- **THEN** no hex/rgb literals appear outside theme token definitions

### Requirement: Split token modules

Tokens SHALL be organized in separate modules (`colors`, `spacing`, `radius`, `typography`, `shadows`) and re-exported from `tokens.ts`.

#### Scenario: Stable import path
- **GIVEN** a feature screen imports `theme` from `@/shared/theme`
- **WHEN** the module resolves
- **THEN** the public API remains `Theme` and `theme` without breaking Phase 1 consumers

### Requirement: Team accent colors

The theme SHALL include `teamNos` and `teamEllos` accent colors for score UI (red/blue per design direction).

#### Scenario: Team colors for ScoreBadge
- **GIVEN** `ScoreBadge` renders for team "nos"
- **WHEN** it reads theme tokens
- **THEN** it uses `theme.colors.teamNos` (not inline hex)

### Requirement: Typography with loaded fonts

Typography tokens SHALL reference **Libre Caslon Text** (display/headline) and **Hanken Grotesk** (body/label) font families loaded via Expo Google Fonts.

#### Scenario: Display font applied
- **GIVEN** fonts have finished loading
- **WHEN** a headline uses `theme.typography.headlineLg`
- **THEN** text renders with Libre Caslon Text

#### Scenario: Body font applied
- **GIVEN** fonts have finished loading
- **WHEN** body text uses `theme.typography.bodyMd`
- **THEN** text renders with Hanken Grotesk

### Requirement: Elevation and shadows

The theme SHALL define elevation levels (0–3) with platform-appropriate shadow styles for iOS, Android, and web.

#### Scenario: Card elevation
- **GIVEN** a `Card` at elevation level 2
- **WHEN** rendered on web
- **THEN** a visible shadow appears without breaking layout

### Requirement: Suit accent colors

The theme SHALL expose one accent color token per suit (`espada`, `basto`, `copa`, `oro`) under `theme.colors.suits`. Each token MUST be a hex color string aligned with the Nocturnal Bodegón palette. Tokens MUST be typed — accessing a non-existent suit key MUST be a compile error.

| Suit | Suggested Hex | Rationale |
|------|--------------|-----------|
| espada | `#7B8FA1` | Steel-blue — sword metal |
| basto | `#5A7A4A` | Muted green — club/wood |
| copa | `#A0522D` | Warm terracotta — wine cup |
| oro | `#C8972A` | Muted gold — coin |

#### Scenario: Suit color tokens accessible

- GIVEN `theme.colors.suits` is imported
- WHEN `theme.colors.suits.espada` is read
- THEN it returns a non-empty hex color string

#### Scenario: All four suits covered

- GIVEN `theme.colors.suits` is imported
- WHEN its keys are checked
- THEN exactly `['espada', 'basto', 'copa', 'oro']` are present

#### Scenario: Type-safe access

- GIVEN `theme.colors.suits` is typed
- WHEN code attempts to access `theme.colors.suits.poker`
- THEN TypeScript emits a compile error

#### Scenario: Suit colors outside token modules are documented exceptions

- GIVEN `src/domain/deck/suits.ts` defines `SuitMeta.accentColor` for each suit
- WHEN the same hex values appear in `src/shared/theme/colors.ts`
- THEN the duplication is an intentional, documented exception
- AND the domain module does not import from `src/shared/theme/`

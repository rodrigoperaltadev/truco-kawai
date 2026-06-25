# responsive-layout

## ADDED Requirements

### Requirement: Breakpoint constants

The app SHALL define mobile and desktop breakpoints in `src/shared/layout/breakpoints.ts` using `useWindowDimensions` (no extra responsive library).

#### Scenario: Breakpoint detection
- **GIVEN** viewport width is below the mobile breakpoint
- **WHEN** `useBreakpoint()` is called
- **THEN** it returns `"mobile"`

#### Scenario: Desktop breakpoint
- **GIVEN** viewport width is at or above the desktop breakpoint
- **WHEN** `useBreakpoint()` is called
- **THEN** it returns `"desktop"`

### Requirement: Stack and Row layout helpers

The app SHALL provide `Stack` (vertical) and `Row` (horizontal) flex helpers with token-based gap spacing.

#### Scenario: Stack spacing
- **GIVEN** a `Stack` with `gap="md"`
- **WHEN** rendering three children
- **THEN** vertical spacing uses `theme.spacing.md`

#### Scenario: Row alignment
- **GIVEN** a `Row` with `align="center"`
- **WHEN** children have different heights
- **THEN** children align on the cross axis

### Requirement: Mobile-first default

Layout helpers SHALL default to mobile-friendly spacing; desktop overrides MAY widen gaps but MUST NOT break mobile layouts.

#### Scenario: Mobile menu layout
- **GIVEN** breakpoint is `mobile`
- **WHEN** main menu renders
- **THEN** menu items stack vertically with readable touch targets (min 44pt height)

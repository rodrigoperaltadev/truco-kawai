# Delta for design-tokens

## ADDED Requirements

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

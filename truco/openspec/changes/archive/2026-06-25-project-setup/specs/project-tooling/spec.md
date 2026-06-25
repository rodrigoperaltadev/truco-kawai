# project-tooling

## ADDED Requirements

### Requirement: Expo application scaffold

The repository SHALL contain a Yarn-managed Expo application at the repo root using the `default` template (Expo Router + TypeScript).

#### Scenario: Install dependencies
- **GIVEN** a fresh clone with Node 20+
- **WHEN** the developer runs `yarn install`
- **THEN** all dependencies install without errors

#### Scenario: Start development server
- **GIVEN** dependencies are installed
- **WHEN** the developer runs `yarn start`
- **THEN** the Expo dev server starts and the app loads

### Requirement: TypeScript strict mode

The project SHALL enable TypeScript `strict: true` and `noUncheckedIndexedAccess: true`.

#### Scenario: Typecheck passes on scaffold
- **GIVEN** the project is configured
- **WHEN** the developer runs `yarn typecheck` (or `tsc --noEmit`)
- **THEN** the command exits with code 0

### Requirement: Biome lint and format

The project SHALL use Biome as the sole linter and formatter for Phase 1.

#### Scenario: Lint passes
- **GIVEN** Biome is configured in `biome.json`
- **WHEN** the developer runs `yarn lint`
- **THEN** the command exits with code 0 on the scaffold codebase

### Requirement: Jest smoke test

The project SHALL include jest-expo with at least one passing smoke test.

#### Scenario: Tests pass
- **GIVEN** jest-expo is configured
- **WHEN** the developer runs `yarn test`
- **THEN** all tests pass

### Requirement: Feature-sliced folder structure

The project SHALL organize code under `app/`, `src/domain/`, `src/features/`, and `src/shared/`.

#### Scenario: Domain isolation
- **GIVEN** the folder structure exists
- **WHEN** inspecting `src/domain/`
- **THEN** no file in `src/domain/` imports from `react`, `react-native`, or `expo`

### Requirement: Path aliases

The project SHALL map `@/*` to `src/*` in both TypeScript and Metro/Babel config.

#### Scenario: Alias resolves
- **GIVEN** path aliases are configured
- **WHEN** a file imports from `@/shared/...`
- **THEN** the import resolves at build and typecheck time

### Requirement: Design tokens preserved

Design tokens from the Stitch export SHALL be copied to `docs/design-tokens.md` before the Stitch folder is removed.

#### Scenario: Tokens documented
- **GIVEN** the Stitch `DESIGN.md` existed
- **WHEN** Phase 1 apply completes
- **THEN** `docs/design-tokens.md` contains color, typography, and spacing tokens

### Requirement: Stitch export excluded

The `stitch_truco_lab_premium_ui/` folder SHALL be removed from the repo and listed in `.gitignore`.

#### Scenario: Stitch absent after apply
- **GIVEN** Phase 1 apply completed
- **WHEN** listing the repo root
- **THEN** `stitch_truco_lab_premium_ui/` is not present

# web-deploy

## ADDED Requirements

### Requirement: Static web export

The Expo app SHALL configure `expo.web.output: "static"` for static site generation.

#### Scenario: Export succeeds
- **GIVEN** dependencies are installed
- **WHEN** the developer runs `yarn web:export`
- **THEN** a `dist/` directory is produced with static assets

### Requirement: Vercel deployment config

The project SHALL include a `vercel.json` (or equivalent) that serves the static export output.

#### Scenario: Vercel build
- **GIVEN** the project is connected to Vercel
- **WHEN** Vercel runs the configured build command
- **THEN** the deployment succeeds and the app is reachable at the deployment URL

### Requirement: Web scripts

`package.json` SHALL expose scripts for web development and export.

| Script | Command |
|--------|---------|
| `web` | Start Expo for web platform |
| `web:export` | `expo export --platform web` |

#### Scenario: Web dev script
- **GIVEN** dependencies are installed
- **WHEN** the developer runs `yarn web`
- **THEN** the app opens in a browser via Expo web dev server

### Requirement: SPA routing on Vercel

Vercel configuration SHALL rewrite unknown paths to `index.html` so Expo Router deep links work on refresh.

#### Scenario: Deep link refresh
- **GIVEN** the app is deployed on Vercel
- **WHEN** the user refreshes on `/rules`
- **THEN** the rules page loads (not a 404)

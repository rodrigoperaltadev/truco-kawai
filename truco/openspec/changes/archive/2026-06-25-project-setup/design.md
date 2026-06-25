# Design: Phase 1 — Project Setup

**Change:** `project-setup`  
**Decisions:** Yarn · Vercel · es/en menus · Spanish jargon · exclude Stitch

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│  app/ (Expo Router — thin routes, no business logic)    │
└──────────────────────────┬──────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────┐
│  src/features/ (screen placeholders, future game UI)    │
└──────────────────────────┬──────────────────────────────┘
                           │
         ┌─────────────────┴─────────────────┐
         ▼                                   ▼
┌─────────────────┐                 ┌─────────────────────┐
│  src/domain/    │                 │  src/shared/        │
│  (empty Phase 1)│                 │  theme, i18n, ui    │
│  pure TS later  │                 │  stubs              │
└─────────────────┘                 └─────────────────────┘
```

**Dependency rule:** `app/` → `features/` → `shared/`. `domain/` imports nothing from React/RN/Expo.

## Stack

| Layer | Choice | Notes |
|-------|--------|-------|
| Runtime | Expo SDK 54+ `default` template | Expo Router + TypeScript pre-wired |
| Package manager | **Yarn** | `yarn.lock` committed |
| Language | TypeScript strict + `noUncheckedIndexedAccess` | `tsc --noEmit` in CI |
| Lint/format | Biome only | `biome.json` at root |
| Tests | jest-expo + RNTL | One smoke test; domain Vitest deferred to Phase 3 |
| i18n | `expo-localization` + `i18n-js` | Lightweight; no react-i18next overhead in Phase 1 |
| Locale persistence | `@react-native-async-storage/async-storage` | Settings toggle es/en |
| Web deploy | Vercel static export | `expo.web.output: "static"` |

## Folder Structure

```
truco/
├── app/
│   ├── _layout.tsx          # Root layout: ThemeProvider + I18nProvider
│   ├── index.tsx            # Main menu
│   ├── game/
│   │   ├── index.tsx        # Game table placeholder
│   │   └── setup.tsx        # New game setup
│   ├── rules/
│   │   ├── index.tsx        # Rules / tutorial
│   │   └── ranking.tsx      # Card ranking reference
│   ├── result.tsx
│   ├── settings.tsx
│   └── about.tsx
├── src/
│   ├── domain/
│   │   └── .gitkeep         # Phase 3+ game engine
│   ├── features/
│   │   ├── menu/
│   │   ├── game/
│   │   ├── rules/
│   │   ├── result/
│   │   ├── settings/
│   │   └── about/
│   └── shared/
│       ├── theme/
│       │   ├── tokens.ts    # From docs/design-tokens.md
│       │   └── ThemeProvider.tsx
│       ├── i18n/
│       │   ├── index.ts     # i18n-js setup + locale hook
│       │   ├── locales/
│       │   │   ├── es.ts
│       │   │   └── en.ts
│       │   └── jargon.ts    # Shared Spanish game terms (both locales)
│       └── ui/
│           └── PlaceholderScreen.tsx
├── docs/
│   ├── backlog.md
│   └── design-tokens.md     # Extracted from Stitch DESIGN.md
├── openspec/
├── app.json
├── biome.json
├── jest.config.js
├── tsconfig.json
├── vercel.json
├── package.json
└── README.md
```

## Scaffold Strategy

The repo root is non-empty (`docs/`, `openspec/`, `stitch_*`). Apply order:

1. **Preserve tokens:** copy `stitch_truco_lab_premium_ui/nocturnal_bodeg_n/DESIGN.md` → `docs/design-tokens.md`
2. **Scaffold attempt:** `yarn create expo-app@latest . --template default`
3. **Fallback:** if blocked, scaffold to `_expo-scaffold/`, merge `app/`, `assets/`, configs, and `package.json` upward
4. **Post-scaffold:** add Biome, jest-expo, i18n deps; create `src/` tree; remove template demo routes
5. **Cleanup:** delete `stitch_truco_lab_premium_ui/`; add to `.gitignore`

## i18n Design

**Principle:** menus and settings are bilingual; game jargon is always Spanish.

```typescript
// locales/es.ts — navigation only
{ menu: { play: 'Jugar', rules: 'Reglas', settings: 'Ajustes' } }

// locales/en.ts
{ menu: { play: 'Play', rules: 'Rules', settings: 'Settings' } }

// jargon.ts — imported by both locales
export const jargon = {
  truco: 'Truco',
  envido: 'Envido',
  suits: { espada: 'Espada', basto: 'Basto', copa: 'Copa', oro: 'Oro' },
};
```

Screens use `t('menu.play')` for UI chrome and `jargon.truco` for game terms. Settings exposes a locale toggle for `es` | `en`, stored in AsyncStorage key `@truco/locale`.

## Route Map

| Path | File | Feature module |
|------|------|----------------|
| `/` | `app/index.tsx` | `features/menu` |
| `/game` | `app/game/index.tsx` | `features/game` |
| `/game/setup` | `app/game/setup.tsx` | `features/game` |
| `/rules` | `app/rules/index.tsx` | `features/rules` |
| `/rules/ranking` | `app/rules/ranking.tsx` | `features/rules` |
| `/result` | `app/result.tsx` | `features/result` |
| `/settings` | `app/settings.tsx` | `features/settings` |
| `/about` | `app/about.tsx` | `features/about` |

Each route file is ≤15 lines: import feature screen, export default.

## Config Files

### tsconfig.json (additions)

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "paths": { "@/*": ["./src/*"] }
  }
}
```

### vercel.json

```json
{
  "buildCommand": "yarn web:export",
  "outputDirectory": "dist",
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

### package.json scripts (additions)

```json
{
  "scripts": {
    "lint": "biome check .",
    "format": "biome format --write .",
    "typecheck": "tsc --noEmit",
    "test": "jest",
    "web": "expo start --web",
    "web:export": "expo export --platform web"
  }
}
```

## Theme Stub

`src/shared/theme/tokens.ts` exports typed constants from `docs/design-tokens.md`. `ThemeProvider` exposes tokens via React context. Placeholder screens use shared tokens — no per-screen hex.

## Decisions Log

| Decision | Rationale |
|----------|-----------|
| Yarn over pnpm/npm | User preference |
| jest-expo only (no Vitest yet) | Simpler Phase 1; Vitest with domain in Phase 3 |
| i18n-js over react-i18next | Lighter bundle for menu strings |
| Remove Stitch folder | User decision; tokens preserved in docs |
| Placeholder routes now | Reduces rework when Phase 8 screens ship |

## Out of Scope (this change)

- Game engine, deck model, CPU (Phases 3–9)
- Design system components beyond `PlaceholderScreen` (Phase 2)
- Trainer, animations, portfolio case study (Phases 10–12)

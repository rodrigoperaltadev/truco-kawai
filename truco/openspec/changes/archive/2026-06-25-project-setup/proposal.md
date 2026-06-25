# Proposal: Phase 1 — Project Setup

## Intent

Bootstrap **Truco Lab** as a documented, testable Expo + React Native Web app. Establish stack, architecture, i18n, and deploy path so later phases (domain engine, game UI, CPU) can ship without rework.

## Scope

### In Scope
- Expo SDK 54+ `default` template at repo root (Yarn)
- TypeScript strict + Biome + jest-expo smoke test
- Folders: `app/`, `src/{domain,features,shared}`
- Path aliases `@/*` → `src/*`
- **i18n scaffold**: `es` + `en` for menus/settings; game terms stay Spanish (`truco`, `envido`, suits)
- **Placeholder routes** for backlog screens (menu, game, rules, result, settings, about)
- **Vercel** static export config (`vercel.json`, `expo.web.output: static`)
- Copy design tokens to `docs/design-tokens.md` before removing Stitch export
- `.gitignore` Stitch folder; remove `stitch_truco_lab_premium_ui/` from repo
- README: setup, architecture, deploy, portfolio purpose

### Out of Scope
- Game rules, deck model, CPU (Phases 3–9)
- Design system components beyond theme stub (Phase 2)
- Trainer, polish, portfolio case study (Phases 10–12)
- Flor, multiplayer, accounts

## Capabilities

### New Capabilities
- `project-tooling`: Yarn, TS strict, Biome, Jest, path aliases, CI-ready scripts
- `app-shell`: Expo Router routes, layout, i18n provider, theme stub
- `web-deploy`: Static export + Vercel config

### Modified Capabilities
- None

## Approach

1. Extract `DESIGN.md` tokens → `docs/design-tokens.md`
2. Scaffold with `yarn create expo-app . --template default` (temp-dir merge if root blocked)
3. Add Biome, jest-expo, `expo-localization` + `i18n-js` (or `react-i18next`)
4. Create thin route files under `app/` pointing to feature placeholders
5. Add `vercel.json` + export script; document `yarn web:export`
6. Delete Stitch folder; update `openspec/config.yaml` context

| Area | Impact | Description |
|------|--------|-------------|
| `/` | New | Expo app, configs, README |
| `app/` | New | Router screens |
| `src/shared/i18n/` | New | es/en catalogs |
| `docs/design-tokens.md` | New | Preserved tokens |
| `stitch_*` | Removed | Excluded per decision |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Non-empty root blocks scaffold | High | Temp dir + merge |
| i18n adds scope | Med | Menus only; jargon keys shared |
| Route placeholders inflate diff | Med | Thin stubs, no UI logic |

## Rollback Plan

Revert commit; delete generated `node_modules`, `app/`, `src/`, configs. Restore Stitch from git if needed.

## Dependencies

- Node 20+, Yarn, Expo CLI
- Vercel account (deploy manual post-apply)

## Success Criteria

- [ ] `yarn`, `yarn test`, `yarn lint` pass
- [ ] `yarn web:export` produces `dist/`
- [ ] All placeholder routes render in es/en
- [ ] Stitch folder absent; tokens in `docs/`
- [ ] README documents stack and Vercel deploy

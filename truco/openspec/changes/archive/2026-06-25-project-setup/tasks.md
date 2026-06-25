# Tasks: Phase 1 — Project Setup

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 350–500 |
| 400-line budget risk | Medium |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | ask-always |

---

## 1. Preserve design tokens
- [x] 1.1 Copy stitch DESIGN.md → docs/design-tokens.md

## 2. Expo scaffold (Yarn)
- [x] 2.1 Scaffold default template (temp dir if needed)
- [x] 2.2 Merge into repo root
- [x] 2.3 yarn install; yarn start works
- [x] 2.4 Remove template demo routes

## 3. TypeScript strict
- [x] 3.1 strict + noUncheckedIndexedAccess
- [x] 3.2 yarn typecheck script

## 4. Biome
- [x] 4.1 biome.json + yarn lint/format

## 5. Jest smoke test
- [x] 5.1 jest-expo config + one passing test

## 6. Folder structure + aliases
- [x] 6.1 src/domain, features, shared
- [x] 6.2 @/* → src/* in tsconfig + Metro

## 7. Theme stub
- [x] 7.1 src/shared/theme from design-tokens.md

## 8. i18n
- [x] 8.1 expo-localization + i18n-js + AsyncStorage
- [x] 8.2 es/en catalogs + shared jargon module
- [x] 8.3 Locale toggle in settings

## 9. Placeholder routes
- [x] 9.1 All 8 backlog routes with thin feature placeholders
- [x] 9.2 i18n labels on each screen

## 10. Web deploy
- [x] 10.1 static export + vercel.json + web scripts

## 11. Stitch cleanup
- [x] 11.1 Delete stitch folder; .gitignore entry

## 12. Documentation
- [x] 12.1 README + update openspec/config.yaml

## 13. Verification
- [x] 13.1 typecheck — passed (local run 2026-06-25)
- [x] 13.2 lint — passed (local run 2026-06-25)
- [x] 13.3 test — passed (local run 2026-06-25, 2 tests)
- [x] 13.4 web:export — passed (local run 2026-06-25, 10 static routes → dist/)

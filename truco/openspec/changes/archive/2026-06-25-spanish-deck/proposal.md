# Proposal: Spanish Deck Model

## Intent

Model the 40-card Spanish deck and Argentine Truco hierarchy as pure domain data so future phases can compare cards, deal hands, and display suit/rank jargon consistently.

## Scope

### In Scope
- Add a `spanish-deck` domain capability for suits, ranks, card identity, deck generation, and Truco ordering.
- Include hierarchy rules: 4 espada > 4 basto > 7 espada > 7 oro, with 7 copa = 7 basto.
- Add rank jargon for 4, 5, 6, 7, 10, 11, and 12.
- Add suit accent color tokens aligned with Nocturnal Bodegón.

### Out of Scope
- Card illustrations, animations, and gameplay.
- Envido scoring, dealing strategy, bots, or multiplayer state.
- App shell navigation changes.

## Capabilities

### New Capabilities
- `spanish-deck`: Defines deck model, suit/rank metadata, deck generation, and card comparison hierarchy.

### Modified Capabilities
- `design-tokens`: Adds suit accent colors to the typed theme token set.

## Approach

Use strict TypeScript literal unions for `Suit`, `Rank`, and `Card`, backed by readonly data tables. Keep game rules in `src/domain/` with no React or theme dependency. Represent ranking through explicit lookup/comparison helpers rather than switch chains, making non-linear ordering and ties testable. Extend `jargon.ts` with rank labels and theme tokens with suit accents; UI consumption remains deferred.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/domain/` | New | Spanish deck types, constants, deck creation, ranking helpers. |
| `src/shared/i18n/jargon.ts` | Modified | Adds rank names while preserving Spanish game jargon. |
| `src/shared/theme/colors.ts` | Modified | Adds suit accent colors from Nocturnal Bodegón direction. |
| `src/shared/theme/tokens.ts` | Modified | Exposes typed suit colors. |
| `openspec/specs/design-tokens/spec.md` | Modified | Records suit color token requirement. |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Incorrect Truco hierarchy | Med | Encode explicit fixtures for special cards and equal 7 copa/basto behavior. |
| Theme token drift | Low | Add colors only in token modules and typed exports. |
| Over-modeling gameplay early | Low | Limit domain to deck identity, generation, and comparison. |

## Rollback Plan

Remove new deck files, revert `jargon.ts` rank additions, remove suit color tokens, and revert the `design-tokens` delta.

## Dependencies

- Existing strict TypeScript, path aliases, and Jest setup.
- No new runtime dependency.

## Success Criteria

- [ ] Deck generation returns exactly 40 unique cards across 4 suits and 10 ranks.
- [ ] Card comparison matches Argentine Truco hierarchy including 7 espada > 7 oro > 7 copa = 7 basto.
- [ ] Rank jargon and suit colors are typed and importable without hardcoded UI literals.

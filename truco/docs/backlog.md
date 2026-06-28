# Truco Lab Backlog

Backlog for turning the Stitch export into a React Native Web portfolio app. The goal is to show solid product thinking, domain modeling, UI implementation, and cross-platform React Native skills.

## Current source material

| Asset | Location | Use |
|---|---|---|
| Stitch export | `/Users/rodrigo.peralta/Documents/little-goals/truco/stitch_truco_lab_premium_ui` | Visual reference only |
| Design tokens | `/Users/rodrigo.peralta/Documents/little-goals/truco/stitch_truco_lab_premium_ui/nocturnal_bodeg_n/DESIGN.md` | Colors, typography, spacing, visual direction |
| Screens | `main_menu`, `game_table`, `match_result`, `rules_tutorial`, `settings` | Reference screens to rebuild in RN Web |

## Product direction

Build **Truco Lab**: a cozy, approachable Argentine Truco game/trainer for React Native Web.

The first version should prioritize:

- Clear game table layout.
- Accurate Spanish deck suits: espada, basto, copa, oro.
- Playable 1v1 local/CPU experience.
- A rules/tutorial flow that helps non-experts understand the game.
- Clean architecture and testable game rules.

## Phase 1 — Project setup

- [ ] Create Expo + React Native Web app inside `/Users/rodrigo.peralta/Documents/little-goals/truco`.
- [ ] Configure TypeScript strict mode.
- [ ] Configure Biome or ESLint/Prettier.
- [ ] Configure path aliases.
- [ ] Add basic folder structure: `app`, `src/features`, `src/shared`, `src/domain`.
- [ ] Add test runner.
- [ ] Add README with setup and app purpose.

## Phase 2 — Design system

- [ ] Extract reusable colors from Stitch `DESIGN.md`.
- [ ] Decide final visual direction: cozy/kawaii Argentine Truco, not casino/poker.
- [ ] Create theme tokens for colors, spacing, radius, typography, shadows.
- [ ] Build base components: `Screen`, `Card`, `Button`, `Pill`, `ScoreBadge`.
- [ ] Build responsive layout helpers for mobile and desktop.
- [ ] Replace Stitch-only web/CSS assumptions with React Native-compatible styles.

## Phase 3 — Spanish deck model

- [ ] Define card suits: `espada`, `basto`, `copa`, `oro`.
- [ ] Define card ranks for 40-card Spanish deck.
- [ ] Implement Truco card hierarchy.
- [ ] Add tests for ranking rules.
- [ ] Create temporary vector/card placeholders.
- [ ] Later: replace placeholders with proper card illustrations.

## Phase 4 — Core Truco engine

- [ ] Model players, teams, hand, round, trick, match score.
- [ ] Implement shuffle/deal flow.
- [ ] Implement turn order and mano/pie rules.
- [ ] Implement playing a card.
- [ ] Resolve each trick winner.
- [ ] Resolve hand winner.
- [ ] Resolve match winner at 15 or 30 points.
- [ ] Add unit tests for every game-state transition.

## Phase 5 — Truco calls

- [ ] Model `truco`, `retruco`, and `vale cuatro` states.
- [ ] Implement accepted/rejected call scoring.
- [ ] Disable unavailable calls based on current state.
- [ ] Add call history to game log.
- [ ] Add tests for call escalation and scoring.

## Phase 6 — Envido calls

- [x] Implement envido point calculation.
- [x] Model `envido`, `real envido`, and `falta envido`.
- [x] Implement accepted/rejected scoring.
- [x] Add tests for envido combinations and edge cases.
- [x] Decide whether flor is out of scope for MVP.

## Phase 7 — Game table UI

- [x] Rebuild the Stitch game table as a proper RN Web screen.
- [x] Separate zones clearly: opponent, table, player hand, actions, score, log.
- [x] Ensure player has exactly 3 cards in hand.
- [x] Show played cards in the center without overlapping controls.
- [x] Add clear turn indicator.
- [x] Render only enabled action buttons.
- [x] Add compact event log that never covers cards.
- [x] Validate mobile layout first.
- [ ] Add desktop layout after mobile is clear.

## Phase 8 — App screens

- [ ] Main menu.
- [ ] New game setup.
- [ ] Game table.
- [ ] Rules/tutorial.
- [ ] Card ranking reference.
- [ ] Match result.
- [ ] Settings.
- [ ] About/portfolio explanation screen.

## Phase 9 — CPU opponent

- [ ] Implement simple CPU strategy: random valid card.
- [ ] Improve CPU to prefer winning tricks when possible.
- [ ] Add basic bluff/call behavior for truco/envido.
- [ ] Keep CPU decisions explainable for tutorial mode.

## Phase 10 — Trainer features

- [ ] Add “Why did this card win?” explanation.
- [ ] Add “What would you play?” practice prompt.
- [ ] Add post-hand summary.
- [ ] Add rule explanations inline when a player makes a call.
- [ ] Add stats: wins, accepted calls, rejected calls, envido accuracy.

## Phase 11 — Polish

- [ ] Add card play animations.
- [ ] Add haptics on supported native platforms.
- [ ] Add sound toggle.
- [ ] Add empty/loading/error states where relevant.
- [ ] Add accessibility labels.
- [ ] Test keyboard and screen-reader basics on web.
- [ ] Optimize card readability at small sizes.

## Phase 12 — Portfolio readiness

- [ ] Add project README with screenshots.
- [ ] Document architecture decisions.
- [ ] Document game-rule testing strategy.
- [ ] Add public demo link.
- [ ] Add GitHub topics.
- [ ] Add portfolio case study: problem, constraints, architecture, tradeoffs.
- [ ] Record short demo GIF/video.

## Known issues / future improvements

- [ ] Current table is visually confusing and overlaps important UI.
- [ ] Current suit visuals are inaccurate: espada/basto/copa/oro must not look like poker suits.
- [ ] Current cards look like generic kawaii cards, not Spanish deck cards.
- [ ] Current layout needs stronger hierarchy before implementation.
- [ ] Generated HTML should be treated as visual reference, not production architecture.
- [ ] Game table UI needs visual polish to match the Stitch design reference (colors, spacing, card style, kawaii feel).
- [ ] Envido flow should be turn-based with speech bubbles (comic-style) and manual point declaration: "Envido" → "Quiero" → "28" → "30" → "Son buenas".

## MVP definition

The MVP is done when:

- [ ] A player can complete a full 1v1 match against a simple CPU.
- [ ] Truco card ranking is correct and tested.
- [ ] Basic truco and envido flows work.
- [ ] The table is readable on mobile web.
- [ ] The UI uses React Native components/styles, not copied Stitch HTML.
- [ ] The README explains why the project demonstrates React Native Web skills.

## Out of scope for MVP

- [ ] Real multiplayer.
- [ ] Online accounts.
- [ ] Ranked mode.
- [ ] Full custom illustrated Spanish deck.
- [ ] Flor, unless added deliberately after MVP.
- [ ] Payments, shop, or cosmetic economy.

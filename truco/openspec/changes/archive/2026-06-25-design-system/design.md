# Design: Phase 2 — Design System

**Change:** `design-system`  
**Depends on:** `project-setup` (archived 2026-06-25)  
**Visual direction:** Nocturnal Bodegón — cozy Argentine bodegón, not casino/poker

## Architecture Overview

```
app/_layout.tsx
  └── FontGate (loads fonts, holds SplashScreen)
        └── ThemeProvider
              └── I18nProvider
                    └── Stack (routes)

src/shared/
  theme/
    colors.ts          ← from docs/design-tokens.md
    spacing.ts
    radius.ts
    typography.ts      ← fontFamily keys after load
    shadows.ts         ← platform-specific elevation maps
    tokens.ts          ← re-exports Theme type + theme singleton
    ThemeProvider.tsx
  layout/
    breakpoints.ts
    useBreakpoint.ts
    Stack.tsx + Stack.styles.ts
    Row.tsx + Row.styles.ts
  ui/
    Screen/
    Button/
    Card/
    Pill/
    ScoreBadge/
    PlaceholderScreen/  ← refactored to use Screen + Pill
```

**Dependency rule:** `features/` → `shared/ui` + `shared/layout` + `shared/theme`. Primitives never import from `features/`.

## Token Design

### Module split

| Module | Contents |
|--------|----------|
| `colors.ts` | Full MD3-style palette from `design-tokens.md` + `teamNos` / `teamEllos` |
| `spacing.ts` | 4px baseline: xs(4), sm(8), md(16), lg(24), xl(32), container(24), gutter(16) |
| `radius.ts` | sm(4), md(8), lg(12), full(9999) |
| `typography.ts` | Named scales: `displayLg`, `headlineLg`, `titleMd`, `bodyMd`, `labelSm` — each with `fontFamily`, `fontSize`, `fontWeight`, `lineHeight`, `letterSpacing` |
| `shadows.ts` | `elevation0`–`elevation3` returning `{ shadowColor, shadowOffset, shadowOpacity, shadowRadius, elevation }` per platform |

`tokens.ts` composes modules into `Theme` and exports `theme` singleton. Phase 1 imports (`theme.colors.background`) remain valid.

### Typography + fonts

```typescript
// typography.ts — fontFamily populated after load
export const fontFamilies = {
  display: 'LibreCaslonText_700Bold',
  headline: 'LibreCaslonText_600SemiBold',
  body: 'HankenGrotesk_400Regular',
  label: 'HankenGrotesk_700Bold',
} as const;
```

Packages:
- `@expo-google-fonts/libre-caslon-text`
- `@expo-google-fonts/hanken-grotesk`
- `expo-font` (already in project)
- `expo-splash-screen` (already in project)

### FontGate component

New file: `src/app/FontGate.tsx`

1. `SplashScreen.preventAutoHideAsync()` on mount
2. `useFonts({ ... })` from expo-google-fonts
3. On `fontsLoaded || fontError`: `SplashScreen.hideAsync()`
4. Return `null` until ready; then render `children`

`_layout.tsx` wraps providers inside `<FontGate>`.

## Component APIs

### Screen

```typescript
type ScreenProps = {
  children: ReactNode;
  title?: string;
  scrollable?: boolean;
  testID?: string;
};
```

- Uses `SafeAreaView` + `theme.colors.background`
- Optional `ScrollView` when `scrollable`
- Title uses `theme.typography.headlineLg` (Libre Caslon)

### Button

```typescript
type ButtonVariant = 'primary' | 'secondary';

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  testID?: string;
};
```

| Variant | Background | Text |
|---------|------------|------|
| primary | `tertiary` (gold) | `onTertiary` / dark brown |
| secondary | `surfaceContainerHigh` (wood) | `onSurface` (cream) |
| disabled | reduced opacity | `onSurfaceVariant` |

Min height: 44pt touch target. Pressed state via `Pressable` style callback.

### Card

```typescript
type CardProps = {
  children: ReactNode;
  elevation?: 1 | 2;
  testID?: string;
};
```

Surface: `surfaceContainer`, radius `md`, shadow from `shadows.elevation1|2`.

### Pill

```typescript
type PillProps = {
  label: string;
  variant?: 'default' | 'jargon';
  testID?: string;
};
```

`jargon` variant uses gold accent border; label is always caller-provided (Spanish jargon from `jargon.ts`).

### ScoreBadge

```typescript
type ScoreBadgeProps = {
  team: 'nos' | 'ellos';
  score: number;
  testID?: string;
};
```

Team color from `teamNos` / `teamEllos`. Palote graphics deferred — numeric score + team label only (Phase 7 adds palotes).

## Layout Helpers

### breakpoints.ts

```typescript
export const BREAKPOINTS = { mobile: 0, tablet: 768, desktop: 1024 } as const;
export type Breakpoint = 'mobile' | 'tablet' | 'desktop';
```

### useBreakpoint()

Returns `'mobile' | 'tablet' | 'desktop'` from `useWindowDimensions().width`.

### Stack / Row

```typescript
type StackProps = {
  children: ReactNode;
  gap?: keyof ThemeSpacing;
  align?: 'start' | 'center' | 'end' | 'stretch';
};
```

`Row` adds `justify` prop. Gap maps to `theme.spacing[gap]`.

## Screen Refactor Plan

| Screen | Changes |
|--------|---------|
| `MainMenuScreen` | `Screen` wrapper; menu items → `Button` secondary; jargon → `Pill` |
| `SettingsScreen` | `Screen` + `Button` for locale toggle; `Stack` for layout |
| `PlaceholderScreen` | `Screen` + `Pill` for jargon; remove duplicate safe-area logic |

Hooks (`useMainMenu`, `useSettingsScreen`) unchanged — only presentational layer swaps.

## Shadow Strategy (cross-platform)

```typescript
// shadows.ts
import { Platform, ViewStyle } from 'react-native';

export function elevation(level: 0 | 1 | 2 | 3): ViewStyle {
  if (Platform.OS === 'android') return { elevation: level };
  if (Platform.OS === 'web') return { boxShadow: '...' }; // from design tokens
  return { shadowColor, shadowOffset, shadowOpacity, shadowRadius };
}
```

## Testing

| Test | Location | Asserts |
|------|----------|---------|
| Theme tokens | `__tests__/theme.test.ts` | Key colors match `design-tokens.md` |
| Button disabled | `__tests__/ui/Button.test.tsx` | `onPress` not called when disabled |
| useBreakpoint | `__tests__/layout/useBreakpoint.test.ts` | Returns mobile/desktop at widths |

Keep smoke test from Phase 1 passing.

## Apply Slices

Per review budget (est. 850–1200 lines):

### Slice A — `tokens-fonts-screen-button` (~400 lines)
1. Split token modules + expand palette
2. FontGate + font packages
3. `Screen` + `Button` components
4. Refactor `MainMenuScreen`
5. Theme + Button tests

### Slice B — `card-pill-scorebadge-layout-refactors` (~450 lines)
1. `Card`, `Pill`, `ScoreBadge`
2. `Stack`, `Row`, `useBreakpoint`
3. Refactor `SettingsScreen` + `PlaceholderScreen`
4. Layout tests

## Skills

- `/Users/rodrigo.peralta/.agents/skills/rn-refactor/SKILL.md` — styles in `*.styles.ts`, hooks for logic, theme tokens, i18n
- `.agents/skills/building-native-ui/SKILL.md` — RN layout and platform patterns

## Risks

| Risk | Mitigation |
|------|------------|
| Font bundle size | Load only weights used (400, 600, 700) |
| Web shadow inconsistency | Separate web `boxShadow` string in `shadows.ts` |
| Slice A blocks Slice B | Slice B depends only on `Screen`/`Button` from A |

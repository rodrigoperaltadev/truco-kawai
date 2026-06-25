export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  container: 24,
  gutter: 16,
} as const;

export type ThemeSpacing = typeof spacing;

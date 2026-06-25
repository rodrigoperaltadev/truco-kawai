import { type ThemeColors, colors } from "./colors";
import { type ThemeRadius, radius } from "./radius";
import { type ThemeShadows, shadows } from "./shadows";
import { type ThemeSpacing, spacing } from "./spacing";
import { type ThemeTypography, typography } from "./typography";

export type Theme = {
  colors: ThemeColors;
  spacing: ThemeSpacing;
  radius: ThemeRadius;
  typography: ThemeTypography;
  shadows: ThemeShadows;
};

export const theme: Theme = {
  colors,
  spacing,
  radius,
  typography,
  shadows,
};

export { colors, spacing, radius, typography, shadows };
export { fontFamilies } from "./fontFamilies";

export type { ThemeColors, ThemeSpacing, ThemeRadius, ThemeTypography, ThemeShadows };

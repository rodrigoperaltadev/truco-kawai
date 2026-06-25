import { fontFamilies } from "./fontFamilies";

type TypographyScale = {
  fontFamily: string;
  fontSize: number;
  fontWeight: "400" | "600" | "700";
  lineHeight: number;
  letterSpacing?: number;
};

function scale(
  fontFamily: string,
  fontSize: number,
  fontWeight: TypographyScale["fontWeight"],
  lineHeight: number,
  letterSpacing?: number,
): TypographyScale {
  return { fontFamily, fontSize, fontWeight, lineHeight, letterSpacing };
}

export const typography = {
  displayLg: scale(fontFamilies.display, 48, "700", 56, -0.96),
  headlineLg: scale(fontFamilies.headline, 32, "600", 40),
  titleMd: scale(fontFamilies.title, 18, "600", 24, 0.18),
  bodyMd: scale(fontFamilies.body, 16, "400", 24),
  labelSm: scale(fontFamilies.label, 12, "700", 16, 0.6),
  display: scale(fontFamilies.display, 32, "700", 40),
  headline: scale(fontFamilies.headline, 24, "600", 32),
  title: scale(fontFamilies.title, 18, "600", 24, 0.18),
  body: scale(fontFamilies.body, 16, "400", 24),
  label: scale(fontFamilies.label, 12, "700", 16, 0.6),
} as const;

export type ThemeTypography = typeof typography;

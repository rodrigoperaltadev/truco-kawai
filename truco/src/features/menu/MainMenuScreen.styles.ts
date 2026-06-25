import { StyleSheet } from "react-native";

import type { Theme } from "@/shared/theme/tokens";

export function createMainMenuStyles(theme: Theme) {
  return StyleSheet.create({
    header: {
      marginBottom: theme.spacing.xl,
      gap: theme.spacing.sm,
    },
    appName: {
      color: theme.colors.primary,
      fontFamily: theme.typography.display.fontFamily,
      fontSize: theme.typography.display.fontSize,
      fontWeight: theme.typography.display.fontWeight,
      lineHeight: theme.typography.display.lineHeight,
    },
    tagline: {
      color: theme.colors.onSurfaceVariant,
      fontFamily: theme.typography.body.fontFamily,
      fontSize: theme.typography.body.fontSize,
      lineHeight: theme.typography.body.lineHeight,
    },
    menuList: {
      gap: theme.spacing.sm,
    },
  });
}

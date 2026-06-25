import { StyleSheet } from "react-native";

import type { Theme } from "@/shared/theme/tokens";

export function createPlaceholderStyles(theme: Theme) {
  return StyleSheet.create({
    title: {
      color: theme.colors.onBackground,
      fontFamily: theme.typography.headline.fontFamily,
      fontSize: theme.typography.headline.fontSize,
      fontWeight: theme.typography.headline.fontWeight,
      lineHeight: theme.typography.headline.lineHeight,
      marginBottom: theme.spacing.sm,
    },
    subtitle: {
      color: theme.colors.onSurfaceVariant,
      fontFamily: theme.typography.bodyMd.fontFamily,
      fontSize: theme.typography.bodyMd.fontSize,
      fontWeight: theme.typography.bodyMd.fontWeight,
      lineHeight: theme.typography.bodyMd.lineHeight,
      marginBottom: theme.spacing.md,
    },
  });
}

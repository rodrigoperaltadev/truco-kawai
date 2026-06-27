import { StyleSheet } from "react-native";

import type { Theme } from "@/shared/theme/tokens";

export function createRulesStyles(theme: Theme) {
  return StyleSheet.create({
    sectionTitle: {
      color: theme.colors.onSurface,
      fontFamily: theme.typography.titleMd.fontFamily,
      fontSize: theme.typography.titleMd.fontSize,
      fontWeight: theme.typography.titleMd.fontWeight,
      lineHeight: theme.typography.titleMd.lineHeight,
      marginBottom: 4,
    },
    body: {
      color: theme.colors.onSurfaceVariant,
      fontFamily: theme.typography.bodyMd.fontFamily,
      fontSize: theme.typography.bodyMd.fontSize,
      fontWeight: theme.typography.bodyMd.fontWeight,
      lineHeight: theme.typography.bodyMd.lineHeight,
    },
    florNote: {
      color: theme.colors.outline,
      fontFamily: theme.typography.bodyMd.fontFamily,
      fontSize: theme.typography.bodyMd.fontSize,
      fontStyle: "italic",
      lineHeight: theme.typography.bodyMd.lineHeight,
    },
  });
}

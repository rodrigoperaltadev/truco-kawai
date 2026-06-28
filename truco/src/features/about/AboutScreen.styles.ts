import { StyleSheet } from "react-native";

import type { Theme } from "@/shared/theme/tokens";

export function createAboutStyles(theme: Theme) {
  return StyleSheet.create({
    body: {
      color: theme.colors.onSurface,
      fontFamily: theme.typography.bodyMd.fontFamily,
      fontSize: theme.typography.bodyMd.fontSize,
      fontWeight: theme.typography.bodyMd.fontWeight,
      lineHeight: theme.typography.bodyMd.lineHeight,
    },
    muted: {
      color: theme.colors.onSurfaceVariant,
      fontFamily: theme.typography.bodyMd.fontFamily,
      fontSize: theme.typography.bodyMd.fontSize,
      fontStyle: "italic",
      lineHeight: theme.typography.bodyMd.lineHeight,
    },
  });
}

import { StyleSheet } from "react-native";

import type { Theme } from "@/shared/theme/tokens";

export function createTurnIndicatorStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      alignItems: "center",
      paddingVertical: theme.spacing.sm,
    },
    playerTurn: {
      color: theme.colors.primary,
      fontFamily: theme.typography.titleMd.fontFamily,
      fontSize: theme.typography.titleMd.fontSize,
      fontWeight: theme.typography.titleMd.fontWeight,
      lineHeight: theme.typography.titleMd.lineHeight,
    },
    opponentTurn: {
      color: theme.colors.onSurfaceVariant,
      fontFamily: theme.typography.titleMd.fontFamily,
      fontSize: theme.typography.titleMd.fontSize,
      fontWeight: theme.typography.titleMd.fontWeight,
      lineHeight: theme.typography.titleMd.lineHeight,
    },
  });
}

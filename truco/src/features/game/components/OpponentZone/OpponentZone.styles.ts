import { StyleSheet } from "react-native";

import type { Theme } from "@/shared/theme/tokens";

export function createOpponentZoneStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      alignItems: "center",
      gap: theme.spacing.sm,
    },
    name: {
      color: theme.colors.onSurface,
      fontFamily: theme.typography.titleMd.fontFamily,
      fontSize: theme.typography.titleMd.fontSize,
      fontWeight: theme.typography.titleMd.fontWeight,
      lineHeight: theme.typography.titleMd.lineHeight,
    },
    cardsRow: {
      alignItems: "center",
      flexDirection: "row",
      gap: theme.spacing.xs,
      justifyContent: "center",
    },
  });
}

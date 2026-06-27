import { StyleSheet } from "react-native";

import type { Theme } from "@/shared/theme/tokens";

export function createTableZoneStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      alignItems: "center",
      gap: theme.spacing.sm,
      paddingVertical: theme.spacing.md,
    },
    label: {
      color: theme.colors.onSurfaceVariant,
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: theme.typography.labelSm.fontSize,
      fontWeight: theme.typography.labelSm.fontWeight,
      letterSpacing: theme.typography.labelSm.letterSpacing,
      lineHeight: theme.typography.labelSm.lineHeight,
    },
    cardsRow: {
      alignItems: "center",
      flexDirection: "row",
      gap: theme.spacing.md,
      justifyContent: "center",
    },
    playedCard: {
      alignItems: "center",
      gap: theme.spacing.xs,
    },
    playerLabel: {
      color: theme.colors.onSurfaceVariant,
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: theme.typography.labelSm.fontSize,
      fontWeight: theme.typography.labelSm.fontWeight,
      letterSpacing: theme.typography.labelSm.letterSpacing,
      lineHeight: theme.typography.labelSm.lineHeight,
    },
    empty: {
      color: theme.colors.onSurfaceVariant,
      fontFamily: theme.typography.bodyMd.fontFamily,
      fontSize: theme.typography.bodyMd.fontSize,
      fontStyle: "italic",
      opacity: 0.6,
    },
  });
}

import { StyleSheet } from "react-native";

import type { Theme } from "@/shared/theme/tokens";

export function createScoreHeaderStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      alignItems: "center",
      gap: theme.spacing.sm,
    },
    badgesRow: {
      alignItems: "center",
      flexDirection: "row",
      gap: theme.spacing.md,
      justifyContent: "center",
    },
    handLabel: {
      color: theme.colors.onSurfaceVariant,
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: theme.typography.labelSm.fontSize,
      fontWeight: theme.typography.labelSm.fontWeight,
      letterSpacing: theme.typography.labelSm.letterSpacing,
      lineHeight: theme.typography.labelSm.lineHeight,
    },
  });
}

import { StyleSheet } from "react-native";

import type { Theme } from "@/shared/theme/tokens";

export function createGameSetupScreenStyles(theme: Theme) {
  return StyleSheet.create({
    content: {
      flex: 1,
      gap: theme.spacing.lg,
      paddingTop: theme.spacing.lg,
    },
    section: {
      gap: theme.spacing.sm,
    },
    sectionLabel: {
      fontSize: 18,
      fontWeight: "600",
      color: theme.colors.onSurface,
    },
    segmentedRow: {
      flexDirection: "row",
      gap: theme.spacing.sm,
    },
    opponentRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.sm,
    },
    startButton: {
      marginTop: theme.spacing.md,
    },
  });
}

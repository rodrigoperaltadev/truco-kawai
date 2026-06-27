import { StyleSheet } from "react-native";

import type { Theme } from "@/shared/theme/tokens";

export function createGameScreenStyles(theme: Theme) {
  return StyleSheet.create({
    content: {
      flex: 1,
      gap: theme.spacing.md,
      paddingBottom: theme.spacing.lg,
    },
  });
}

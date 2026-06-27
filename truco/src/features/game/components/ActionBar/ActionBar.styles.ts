import { StyleSheet } from "react-native";

import type { Theme } from "@/shared/theme/tokens";

export function createActionBarStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      alignItems: "center",
      flexDirection: "row",
      flexWrap: "wrap",
      gap: theme.spacing.sm,
      justifyContent: "center",
      paddingVertical: theme.spacing.sm,
    },
  });
}

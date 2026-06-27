import { StyleSheet } from "react-native";

import type { Theme } from "@/shared/theme/tokens";

const CARD_OVERLAP = -20;

export function createPlayerHandZoneStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "center",
      paddingVertical: theme.spacing.md,
    },
    card: {
      marginLeft: CARD_OVERLAP,
    },
    firstCard: {
      marginLeft: 0,
    },
  });
}

import { StyleSheet } from "react-native";

import type { ElevationLevel } from "@/shared/theme/shadows";
import type { Theme } from "@/shared/theme/tokens";

type CardStyleInput = {
  elevation: 1 | 2;
};

export function createCardStyles(theme: Theme, input: CardStyleInput) {
  const level = input.elevation as ElevationLevel;

  return StyleSheet.create({
    container: {
      backgroundColor: theme.colors.surfaceContainer,
      borderRadius: theme.radius.md,
      padding: theme.spacing.md,
      ...theme.shadows.elevation(level),
    },
  });
}

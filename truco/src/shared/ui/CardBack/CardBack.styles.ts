import { StyleSheet } from "react-native";

import type { Theme } from "@/shared/theme/tokens";

const MIN_TOUCH_TARGET = 44;
const CARD_WIDTH = 80;
const CARD_HEIGHT = 100;
const INNER_INSET = 6;

export function createCardBackStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      alignItems: "center",
      backgroundColor: theme.colors.primaryContainer,
      borderColor: theme.colors.inversePrimary,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      height: CARD_HEIGHT,
      justifyContent: "center",
      minWidth: MIN_TOUCH_TARGET,
      width: CARD_WIDTH,
    },
    inner: {
      backgroundColor: theme.colors.inversePrimary,
      borderRadius: theme.radius.sm,
      height: CARD_HEIGHT - INNER_INSET * 2,
      opacity: 0.5,
      width: CARD_WIDTH - INNER_INSET * 2,
    },
  });
}

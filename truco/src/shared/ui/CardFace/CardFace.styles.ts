import { StyleSheet } from "react-native";

import type { Suit } from "@/domain/deck";
import type { Theme } from "@/shared/theme/tokens";

const MIN_TOUCH_TARGET = 44;
const CARD_WIDTH = 80;
const CARD_HEIGHT = 100;

type CardFaceStyleInput = {
  suit: Suit;
};

export function createCardFaceStyles(theme: Theme, input: CardFaceStyleInput) {
  const suitColor = theme.colors.suits[input.suit];

  return StyleSheet.create({
    container: {
      alignItems: "center",
      backgroundColor: theme.colors.surfaceContainer,
      borderColor: theme.colors.outlineVariant,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      height: CARD_HEIGHT,
      justifyContent: "center",
      minWidth: MIN_TOUCH_TARGET,
      width: CARD_WIDTH,
    },
    label: {
      color: suitColor,
      fontFamily: theme.typography.titleMd.fontFamily,
      fontSize: theme.typography.titleMd.fontSize,
      fontWeight: theme.typography.titleMd.fontWeight,
      lineHeight: theme.typography.titleMd.lineHeight,
    },
    pressed: {
      opacity: 0.85,
    },
    disabled: {
      opacity: 0.5,
    },
  });
}

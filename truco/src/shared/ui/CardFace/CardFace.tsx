import { Pressable, Text } from "react-native";

import type { Rank, Suit } from "@/domain/deck";
import { jargon } from "@/shared/i18n/jargon";
import { useTheme } from "@/shared/theme/ThemeProvider";

import { createCardFaceStyles } from "./CardFace.styles";

type CardFaceProps = {
  rank: Rank;
  suit: Suit;
  onPress?: () => void;
  disabled?: boolean;
  testID?: string;
};

export function CardFace({ rank, suit, onPress, disabled = false, testID }: CardFaceProps) {
  const theme = useTheme();
  const styles = createCardFaceStyles(theme, { suit });
  const label = `${rank} ${jargon.suits[suit]}`;

  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
      ]}
      testID={testID}
    >
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

import { View } from "react-native";

import { useTheme } from "@/shared/theme/ThemeProvider";

import { createCardBackStyles } from "./CardBack.styles";

type CardBackProps = {
  testID?: string;
};

const ACCESSIBILITY_LABEL = "Carta boca abajo";

export function CardBack({ testID }: CardBackProps) {
  const theme = useTheme();
  const styles = createCardBackStyles(theme);

  return (
    <View accessibilityLabel={ACCESSIBILITY_LABEL} style={styles.container} testID={testID}>
      <View style={styles.inner} />
    </View>
  );
}

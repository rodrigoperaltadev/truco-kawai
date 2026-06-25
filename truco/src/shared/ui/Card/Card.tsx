import type { ReactNode } from "react";
import { View } from "react-native";

import { useTheme } from "@/shared/theme/ThemeProvider";

import { createCardStyles } from "./Card.styles";

type CardProps = {
  children: ReactNode;
  elevation?: 1 | 2;
  testID?: string;
};

export function Card({ children, elevation = 1, testID }: CardProps) {
  const theme = useTheme();
  const styles = createCardStyles(theme, { elevation });

  return (
    <View style={styles.container} testID={testID}>
      {children}
    </View>
  );
}

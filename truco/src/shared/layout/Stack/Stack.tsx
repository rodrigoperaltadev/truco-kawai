import type { ReactNode } from "react";
import { View } from "react-native";

import { useTheme } from "@/shared/theme/ThemeProvider";
import type { ThemeSpacing } from "@/shared/theme/tokens";

import { createStackStyles } from "./Stack.styles";

type StackAlign = "start" | "center" | "end" | "stretch";

type StackProps = {
  children: ReactNode;
  gap?: keyof ThemeSpacing;
  align?: StackAlign;
  testID?: string;
};

export function Stack({ children, gap, align = "stretch", testID }: StackProps) {
  const theme = useTheme();
  const styles = createStackStyles(theme, { gap, align });

  return (
    <View style={styles.container} testID={testID}>
      {children}
    </View>
  );
}

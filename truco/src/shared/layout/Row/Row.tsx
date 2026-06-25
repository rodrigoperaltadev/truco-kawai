import type { ReactNode } from "react";
import { View } from "react-native";

import { useTheme } from "@/shared/theme/ThemeProvider";
import type { ThemeSpacing } from "@/shared/theme/tokens";

import { createRowStyles } from "./Row.styles";

type RowAlign = "start" | "center" | "end" | "stretch";
type RowJustify = "start" | "center" | "end" | "between" | "around";

type RowProps = {
  children: ReactNode;
  gap?: keyof ThemeSpacing;
  align?: RowAlign;
  justify?: RowJustify;
  testID?: string;
};

export function Row({ children, gap, align = "center", justify = "start", testID }: RowProps) {
  const theme = useTheme();
  const styles = createRowStyles(theme, { gap, align, justify });

  return (
    <View style={styles.container} testID={testID}>
      {children}
    </View>
  );
}

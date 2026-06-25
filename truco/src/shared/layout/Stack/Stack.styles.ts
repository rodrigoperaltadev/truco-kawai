import { StyleSheet } from "react-native";

import type { Theme, ThemeSpacing } from "@/shared/theme/tokens";

type StackStyleInput = {
  gap?: keyof ThemeSpacing;
  align?: "start" | "center" | "end" | "stretch";
};

export function createStackStyles(theme: Theme, input: StackStyleInput) {
  const alignMap = {
    start: "flex-start",
    center: "center",
    end: "flex-end",
    stretch: "stretch",
  } as const;

  return StyleSheet.create({
    container: {
      alignItems: alignMap[input.align ?? "stretch"],
      flexDirection: "column",
      gap: input.gap ? theme.spacing[input.gap] : undefined,
    },
  });
}

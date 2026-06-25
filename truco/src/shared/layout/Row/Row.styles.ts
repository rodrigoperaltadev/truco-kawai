import { StyleSheet } from "react-native";

import type { Theme, ThemeSpacing } from "@/shared/theme/tokens";

type RowStyleInput = {
  gap?: keyof ThemeSpacing;
  align?: "start" | "center" | "end" | "stretch";
  justify?: "start" | "center" | "end" | "between" | "around";
};

export function createRowStyles(theme: Theme, input: RowStyleInput) {
  const alignMap = {
    start: "flex-start",
    center: "center",
    end: "flex-end",
    stretch: "stretch",
  } as const;

  const justifyMap = {
    start: "flex-start",
    center: "center",
    end: "flex-end",
    between: "space-between",
    around: "space-around",
  } as const;

  return StyleSheet.create({
    container: {
      alignItems: alignMap[input.align ?? "center"],
      flexDirection: "row",
      gap: input.gap ? theme.spacing[input.gap] : undefined,
      justifyContent: justifyMap[input.justify ?? "start"],
    },
  });
}

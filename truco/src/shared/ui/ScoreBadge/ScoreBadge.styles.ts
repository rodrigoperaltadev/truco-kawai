import { StyleSheet } from "react-native";

import type { Theme } from "@/shared/theme/tokens";

type Team = "nos" | "ellos";

type ScoreBadgeStyleInput = {
  team: Team;
};

export function createScoreBadgeStyles(theme: Theme, input: ScoreBadgeStyleInput) {
  const teamColor = input.team === "nos" ? theme.colors.teamNos : theme.colors.teamEllos;

  return StyleSheet.create({
    container: {
      alignItems: "center",
      backgroundColor: theme.colors.surfaceContainerLow,
      borderColor: teamColor,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      minWidth: 64,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
    },
    score: {
      color: teamColor,
      fontFamily: theme.typography.headline.fontFamily,
      fontSize: theme.typography.headline.fontSize,
      fontWeight: theme.typography.headline.fontWeight,
      lineHeight: theme.typography.headline.lineHeight,
    },
    teamLabel: {
      color: theme.colors.onSurfaceVariant,
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: theme.typography.labelSm.fontSize,
      fontWeight: theme.typography.labelSm.fontWeight,
      lineHeight: theme.typography.labelSm.lineHeight,
      letterSpacing: theme.typography.labelSm.letterSpacing,
      textTransform: "uppercase",
    },
  });
}

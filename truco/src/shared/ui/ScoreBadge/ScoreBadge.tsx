import { Text, View } from "react-native";

import { useTheme } from "@/shared/theme/ThemeProvider";

import { createScoreBadgeStyles } from "./ScoreBadge.styles";

type Team = "nos" | "ellos";

const TEAM_LABELS: Record<Team, string> = {
  nos: "Nos",
  ellos: "Ellos",
};

type ScoreBadgeProps = {
  team: Team;
  score: number;
  testID?: string;
};

export function ScoreBadge({ team, score, testID }: ScoreBadgeProps) {
  const theme = useTheme();
  const styles = createScoreBadgeStyles(theme, { team });

  return (
    <View style={styles.container} testID={testID}>
      <Text style={styles.teamLabel}>{TEAM_LABELS[team]}</Text>
      <Text style={styles.score}>{score}</Text>
    </View>
  );
}

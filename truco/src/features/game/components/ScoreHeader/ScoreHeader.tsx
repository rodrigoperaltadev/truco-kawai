import { Text, View } from "react-native";

import { Row } from "@/shared/layout";
import { useTheme } from "@/shared/theme/ThemeProvider";
import { ScoreBadge } from "@/shared/ui/ScoreBadge";

import { createScoreHeaderStyles } from "./ScoreHeader.styles";

type ScoreHeaderProps = {
  scores: { nos: number; ellos: number };
  handNumber: number;
  roundNumber: number;
  testID?: string;
};

export function ScoreHeader({ scores, handNumber, roundNumber, testID }: ScoreHeaderProps) {
  const theme = useTheme();
  const styles = createScoreHeaderStyles(theme);

  return (
    <View style={styles.container} testID={testID}>
      <Row gap="md" testID={testID ? `${testID}-badges` : undefined}>
        <ScoreBadge team="nos" score={scores.nos} testID={testID ? `${testID}-nos` : undefined} />
        <ScoreBadge
          team="ellos"
          score={scores.ellos}
          testID={testID ? `${testID}-ellos` : undefined}
        />
      </Row>
      <Text style={styles.handLabel}>
        Mano {handNumber} · Ronda {roundNumber}
      </Text>
    </View>
  );
}

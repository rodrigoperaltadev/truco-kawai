import { Text, View } from "react-native";

import { Stack } from "@/shared/layout";
import { useTheme } from "@/shared/theme/ThemeProvider";
import { Screen } from "@/shared/ui/Screen";

import { createRankingStyles } from "./RankingScreen.styles";
import { useRankingScreen } from "./hooks/useRankingScreen";

export function RankingScreen() {
  const theme = useTheme();
  const styles = createRankingStyles(theme);
  const { translations, cards } = useRankingScreen();

  return (
    <Screen scrollable testID="ranking-screen" title={translations.title}>
      <Stack gap="md">
        {/* Header row */}
        <View style={styles.headerRow} testID="ranking-header">
          <Text style={[styles.headerCell, styles.positionCell]}>#</Text>
          <Text style={[styles.headerCell, styles.suitCell]}>{translations.position}</Text>
          <Text style={[styles.headerCell, styles.rankCell]}>Rank</Text>
          <Text style={[styles.headerCell, styles.envidoCell]}>{translations.envidoValue}</Text>
        </View>

        {/* Card rows */}
        {cards.map((card) => (
          <View
            key={`${card.suit}-${card.rank}`}
            style={styles.row}
            testID={`ranking-row-${card.position}`}
          >
            <Text style={[styles.cell, styles.positionCell]}>{card.position}</Text>
            <Text style={[styles.cell, styles.suitCell]}>{card.suitLabel}</Text>
            <Text style={[styles.cell, styles.rankCell]}>{card.rankLabel}</Text>
            <Text style={[styles.cell, styles.envidoCell]}>{card.envidoValue}</Text>
          </View>
        ))}
      </Stack>
    </Screen>
  );
}

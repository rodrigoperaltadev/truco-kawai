import { Text, View } from "react-native";

import { useTheme } from "@/shared/theme/ThemeProvider";
import { Button } from "@/shared/ui/Button";
import { Pill } from "@/shared/ui/Pill";
import { Screen } from "@/shared/ui/Screen";

import { createGameSetupScreenStyles } from "./GameSetupScreen.styles";
import { useGameSetupScreen } from "./hooks/useGameSetupScreen";

export function GameSetupScreen() {
  const theme = useTheme();
  const styles = createGameSetupScreenStyles(theme);
  const { pointsToWin, setPointsToWin, startGame, translations } = useGameSetupScreen();

  return (
    <Screen title={translations.title} testID="game-setup-screen">
      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{translations.pointsToWinLabel}</Text>
          <View style={styles.segmentedRow}>
            <Button
              label={translations.points15}
              onPress={() => setPointsToWin(15)}
              variant={pointsToWin === 15 ? "primary" : "secondary"}
              testID="setup-points-15"
            />
            <Button
              label={translations.points30}
              onPress={() => setPointsToWin(30)}
              variant={pointsToWin === 30 ? "primary" : "secondary"}
              testID="setup-points-30"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{translations.opponentLabel}</Text>
          <View style={styles.opponentRow}>
            <Pill label={translations.opponentCpu} testID="setup-opponent-cpu" />
          </View>
        </View>

        <View style={styles.startButton}>
          <Button
            label={translations.start}
            onPress={startGame}
            variant="primary"
            testID="setup-start"
          />
        </View>
      </View>
    </Screen>
  );
}

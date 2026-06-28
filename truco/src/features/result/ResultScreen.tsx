import { ActivityIndicator, Text, View } from "react-native";

import { Button } from "@/shared/ui/Button";
import { Screen } from "@/shared/ui/Screen";

import { useResultScreen } from "./hooks/useResultScreen";

export function ResultScreen() {
  const { status, result, backToMenu, playAgain, translations } = useResultScreen();

  if (status === "loading") {
    return (
      <Screen testID="result-screen">
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", gap: 12 }}>
          <ActivityIndicator testID="result-loading" />
          <Text>{translations.loading}</Text>
        </View>
      </Screen>
    );
  }

  if (status === "empty" || !result) {
    return (
      <Screen testID="result-screen">
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", gap: 12 }}>
          <Text testID="result-empty">{translations.empty}</Text>
          <Button label={translations.backToMenuLabel} onPress={backToMenu} variant="primary" />
        </View>
      </Screen>
    );
  }

  return (
    <Screen testID="result-screen">
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", gap: 16 }}>
        <Text testID="result-winner" style={{ fontSize: 24, fontWeight: "700" }}>
          {result.isPlayerWin ? translations.youWin : translations.cpuWins}
        </Text>
        <Text testID="result-score">
          {translations.finalScore}: {result.nosScore} - {result.ellosScore}
        </Text>
        <View style={{ flexDirection: "row", gap: 12 }}>
          <Button label={translations.playAgainLabel} onPress={playAgain} variant="primary" />
          <Button label={translations.backToMenuLabel} onPress={backToMenu} variant="secondary" />
        </View>
      </View>
    </Screen>
  );
}

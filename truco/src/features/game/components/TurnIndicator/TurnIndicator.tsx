import { Text, View } from "react-native";

import { useTranslations } from "@/shared/i18n";
import { useTheme } from "@/shared/theme/ThemeProvider";

import { createTurnIndicatorStyles } from "./TurnIndicator.styles";

type TurnLabel = { kind: "player" } | { kind: "opponent"; name: string };

type TurnIndicatorProps = {
  turnLabel: TurnLabel;
  testID?: string;
};

export function TurnIndicator({ turnLabel, testID }: TurnIndicatorProps) {
  const theme = useTheme();
  const styles = createTurnIndicatorStyles(theme);
  const { t } = useTranslations();

  const isPlayer = turnLabel.kind === "player";
  const text = isPlayer ? t("game.turn.player") : t("game.turn.opponent", { name: turnLabel.name });

  return (
    <View style={styles.container} testID={testID}>
      <Text style={isPlayer ? styles.playerTurn : styles.opponentTurn}>{text}</Text>
    </View>
  );
}

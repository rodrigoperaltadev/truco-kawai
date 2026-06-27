import { Text, View } from "react-native";

import { useTheme } from "@/shared/theme/ThemeProvider";
import { CardBack } from "@/shared/ui/CardBack";

import { TurnIndicator } from "../TurnIndicator";
import { createOpponentZoneStyles } from "./OpponentZone.styles";

type TurnLabel = { kind: "player" } | { kind: "opponent"; name: string };

type OpponentZoneProps = {
  name: string;
  cardCount: number;
  isActive: boolean;
  turnLabel: TurnLabel;
  testID?: string;
};

export function OpponentZone({ name, cardCount, isActive, turnLabel, testID }: OpponentZoneProps) {
  const theme = useTheme();
  const styles = createOpponentZoneStyles(theme);

  return (
    <View style={styles.container} testID={testID}>
      <Text style={styles.name}>{name}</Text>
      <View style={styles.cardsRow}>
        {Array.from({ length: cardCount }, (_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: card backs are identical, no state
          <CardBack key={`card-back-${i}`} testID={testID ? `${testID}-card-${i}` : undefined} />
        ))}
      </View>
      {isActive && (
        <TurnIndicator turnLabel={turnLabel} testID={testID ? `${testID}-turn` : undefined} />
      )}
    </View>
  );
}

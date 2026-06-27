import { View } from "react-native";

import type { Card } from "@/domain/deck";
import { useTheme } from "@/shared/theme/ThemeProvider";
import { CardFace } from "@/shared/ui/CardFace";

import { createPlayerHandZoneStyles } from "./PlayerHandZone.styles";

type PlayerHandZoneProps = {
  cards: readonly Card[];
  enabled: boolean;
  onPlay: (card: Card) => void;
  testID?: string;
};

export function PlayerHandZone({ cards, enabled, onPlay, testID }: PlayerHandZoneProps) {
  const theme = useTheme();
  const styles = createPlayerHandZoneStyles(theme);

  return (
    <View style={styles.container} testID={testID}>
      {cards.map((card, i) => (
        <View key={`${card.rank}-${card.suit}`} style={[styles.card, i === 0 && styles.firstCard]}>
          <CardFace
            rank={card.rank}
            suit={card.suit}
            disabled={!enabled}
            onPress={() => onPlay(card)}
            testID={testID ? `${testID}-card-${i}` : undefined}
          />
        </View>
      ))}
    </View>
  );
}

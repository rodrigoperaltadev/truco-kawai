import { Text, View } from "react-native";

import type { PlayedCard } from "@/domain/game/types";
import { useTheme } from "@/shared/theme/ThemeProvider";
import { CardFace } from "@/shared/ui/CardFace";

import { createTableZoneStyles } from "./TableZone.styles";

type TableZoneProps = {
  trick: readonly PlayedCard[];
  playerName: (playerId: string) => string;
  testID?: string;
};

export function TableZone({ trick, playerName, testID }: TableZoneProps) {
  const theme = useTheme();
  const styles = createTableZoneStyles(theme);

  return (
    <View style={styles.container} testID={testID}>
      <Text style={styles.label}>Mesa</Text>
      {trick.length === 0 ? (
        <Text style={styles.empty}>Sin cartas jugadas</Text>
      ) : (
        <View style={styles.cardsRow}>
          {trick.map((pc, i) => (
            <View key={`${pc.playerId}-${i}`} style={styles.playedCard}>
              <CardFace
                rank={pc.card.rank}
                suit={pc.card.suit}
                testID={testID ? `${testID}-card-${i}` : undefined}
              />
              <Text style={styles.playerLabel}>{playerName(pc.playerId)}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

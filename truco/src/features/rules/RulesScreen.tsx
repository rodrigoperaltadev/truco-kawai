import { Text, View } from "react-native";

import { Stack } from "@/shared/layout";
import { useTheme } from "@/shared/theme/ThemeProvider";
import { Screen } from "@/shared/ui/Screen";

import { createRulesStyles } from "./RulesScreen.styles";
import { useRulesScreen } from "./hooks/useRulesScreen";

export function RulesScreen() {
  const theme = useTheme();
  const styles = createRulesStyles(theme);
  const { translations } = useRulesScreen();

  return (
    <Screen scrollable testID="rules-screen" title={translations.title}>
      <Stack gap="lg">
        <View testID="rules-section-objective">
          <Text style={styles.sectionTitle}>{translations.objective}</Text>
          <Text style={styles.body}>
            {translations.objective === "Objetivo"
              ? "Llegar primero a 15 o 30 puntos. Se juega con baraja española de 40 cartas (sin 8 ni 9). Gana el equipo que alcanza el puntaje objetivo."
              : "Reach 15 or 30 points first. Played with a 40-card Spanish deck (no 8s or 9s). The first team to reach the target score wins."}
          </Text>
        </View>

        <View testID="rules-section-suits">
          <Text style={styles.sectionTitle}>{translations.suits}</Text>
          <Text style={styles.body}>
            {translations.suits === "Palos"
              ? "Espada, Basto, Copa, Oro. Cada palo tiene 10 cartas: As (1), 2, 3, 4, 5, 6, 7, Sota (10), Caballo (11) y Rey (12)."
              : "Espada (Sword), Basto (Club), Copa (Cup), Oro (Gold). Each suit has 10 cards: Ace (1), 2, 3, 4, 5, 6, 7, Knave (10), Knight (11) and King (12)."}
          </Text>
        </View>

        <View testID="rules-section-hierarchy">
          <Text style={styles.sectionTitle}>{translations.hierarchy}</Text>
          <Text style={styles.body}>
            {translations.hierarchy === "Jerarquía de cartas"
              ? "De mayor a menor: 1 de Espada, 1 de Basto, 7 de Espada, 7 de Oro, luego los 3, los 2, los 1 no jerárquicos, los 12, los 11, los 10, los 7 no jerárquicos, los 6, los 5, los 4."
              : "Highest to lowest: 1 of Espada, 1 of Basto, 7 of Espada, 7 of Oro, then 3s, 2s, non-special 1s, 12s, 11s, 10s, non-special 7s, 6s, 5s, 4s."}
          </Text>
        </View>

        <View testID="rules-section-truco">
          <Text style={styles.sectionTitle}>{translations.trucoCalls}</Text>
          <Text style={styles.body}>
            {translations.trucoCalls === "Cantos de Truco"
              ? "Truco (1 punto), Retruco (2 puntos), Vale Cuatro (3 puntos). Cada equipo puede cantar; el rival acepta o rechaza. Si rechaza, el cantador gana los puntos del nivel anterior."
              : "Truco (1 point), Retruco (2 points), Vale Cuatro (3 points). Either team can call; the opponent accepts or rejects. On rejection, the caller scores the previous level's points."}
          </Text>
        </View>

        <View testID="rules-section-envido">
          <Text style={styles.sectionTitle}>{translations.envidoPoints}</Text>
          <Text style={styles.body}>
            {translations.envidoPoints === "Puntos de Envido"
              ? "Envido (2 puntos), Real Envido (3 puntos), Falta Envido (todo lo que falte). Se calcula con dos cartas del mismo palo: 10 + la mayor + la diferencia. Cartas de figuras (10, 11, 12) valen 0 para envido."
              : "Envido (2 points), Real Envido (3 points), Falta Envido (all points needed to win). Calculated with two cards of the same suit: 10 + highest + difference. Face cards (10, 11, 12) count as 0 for envido."}
          </Text>
        </View>

        <View testID="rules-section-rounds">
          <Text style={styles.sectionTitle}>{translations.rounds}</Text>
          <Text style={styles.body}>
            {translations.rounds === "Estructura de la mano"
              ? "Cada mano se juega al mejor de 3 bazas. El ganador de cada baza lidera la siguiente. Se juega con 3 cartas por jugador."
              : "Each hand is best of 3 tricks. The winner of each trick leads the next. Each player is dealt 3 cards."}
          </Text>
        </View>

        <View testID="rules-section-flor">
          <Text style={styles.florNote}>{translations.florNote}</Text>
        </View>
      </Stack>
    </Screen>
  );
}

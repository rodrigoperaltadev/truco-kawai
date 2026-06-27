import { useMemo } from "react";
import { View } from "react-native";

import { useTheme } from "@/shared/theme/ThemeProvider";
import { Screen } from "@/shared/ui/Screen";

import { createGameScreenStyles } from "./GameScreen.styles";
import { ActionBar } from "./components/ActionBar";
import { EventLog } from "./components/EventLog";
import { OpponentZone } from "./components/OpponentZone";
import { PlayerHandZone } from "./components/PlayerHandZone";
import { ScoreHeader } from "./components/ScoreHeader";
import { TableZone } from "./components/TableZone";
import { useGameState } from "./hooks/useGameState";

// ── Temporary match options (will come from navigation params) ──────

const TEMP_PLAYERS = [
  { id: "human", name: "Vos" },
  { id: "cpu", name: "Rival" },
] as const;

export function GameScreen() {
  const theme = useTheme();
  const styles = createGameScreenStyles(theme);

  const { view, actions, handlers, log } = useGameState({
    players: [TEMP_PLAYERS[0], TEMP_PLAYERS[1]],
    pointsToWin: 15,
    playerId: "human",
  });

  const playerNameFn = useMemo(() => {
    const players = TEMP_PLAYERS;
    return (playerId: string) => {
      const p = players.find((pl) => pl.id === playerId);
      return p?.name ?? playerId;
    };
  }, []);

  const opponentName =
    view.turnLabel.kind === "opponent" ? view.turnLabel.name : TEMP_PLAYERS[1].name;

  return (
    <Screen scrollable testID="game-screen">
      <View style={styles.content}>
        <ScoreHeader
          scores={view.scores}
          handNumber={view.handNumber}
          roundNumber={view.roundNumber}
          testID="score-header"
        />

        <OpponentZone
          name={opponentName}
          cardCount={view.opponentCardCount}
          isActive={!view.isPlayerTurn}
          turnLabel={view.turnLabel}
          testID="opponent-zone"
        />

        <TableZone trick={view.currentTrick} playerName={playerNameFn} testID="table-zone" />

        <ActionBar actions={actions} handlers={handlers} testID="action-bar" />

        <PlayerHandZone
          cards={view.playerHand}
          enabled={view.isPlayerTurn}
          onPlay={handlers.onPlayCard}
          testID="player-hand"
        />

        <EventLog entries={log} testID="event-log" />
      </View>
    </Screen>
  );
}

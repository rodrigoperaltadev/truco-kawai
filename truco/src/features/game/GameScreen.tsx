import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo } from "react";
import { View } from "react-native";

import type { PointsToWin } from "@/domain/game/types";
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

export type LastResult = {
  isPlayerWin: boolean;
  nosScore: number;
  ellosScore: number;
  pointsToWin: PointsToWin;
};

const LAST_RESULT_KEY = "@truco/last-result";

export function GameScreen() {
  const theme = useTheme();
  const styles = createGameScreenStyles(theme);
  const router = useRouter();
  const params = useLocalSearchParams<{ pointsToWin?: string; opponentId?: string }>();

  const pointsToWin: PointsToWin = params.pointsToWin === "30" ? 30 : 15;
  const opponentId = params.opponentId === "cpu" ? "cpu" : "cpu";

  const players = useMemo(
    () =>
      [
        { id: "human", name: "Vos" },
        { id: opponentId, name: "CPU" },
      ] as const,
    [opponentId],
  );

  const { view, actions, handlers, log } = useGameState({
    players: [players[0], players[1]],
    pointsToWin,
    playerId: "human",
  });

  // Match-over side effect: persist result and navigate to /result
  useEffect(() => {
    if (view.phase !== "matchOver") return;

    const isPlayerWin = view.scores.nos > view.scores.ellos;
    const result: LastResult = {
      isPlayerWin,
      nosScore: view.scores.nos,
      ellosScore: view.scores.ellos,
      pointsToWin,
    };

    AsyncStorage.setItem(LAST_RESULT_KEY, JSON.stringify(result))
      .then(() => {
        router.replace("/result");
      })
      .catch(() => {
        // If storage fails, still navigate
        router.replace("/result");
      });
  }, [view.phase, view.scores.nos, view.scores.ellos, pointsToWin, router]);

  const playerNameFn = useMemo(() => {
    return (playerId: string) => {
      const p = players.find((pl) => pl.id === playerId);
      return p?.name ?? playerId;
    };
  }, [players]);

  const opponentName = view.turnLabel.kind === "opponent" ? view.turnLabel.name : players[1].name;

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

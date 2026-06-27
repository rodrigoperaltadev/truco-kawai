import { useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";

import { useTranslations } from "@/shared/i18n";

import type { PointsToWin } from "@/domain/game/types";

export function useGameSetupScreen() {
  const { t } = useTranslations();
  const router = useRouter();

  const [pointsToWin, setPointsToWin] = useState<PointsToWin>(15);

  const startGame = useCallback(() => {
    router.push(`/game?pointsToWin=${pointsToWin}&opponentId=cpu`);
  }, [router, pointsToWin]);

  const translations = useMemo(
    () => ({
      title: t("screens.game_setup"),
      pointsToWinLabel: t("setup.points_to_win"),
      points15: t("setup.points_15"),
      points30: t("setup.points_30"),
      opponentLabel: t("setup.opponent"),
      opponentCpu: t("setup.opponent_cpu"),
      start: t("setup.start"),
    }),
    [t],
  );

  return {
    pointsToWin,
    setPointsToWin,
    startGame,
    translations,
  };
}

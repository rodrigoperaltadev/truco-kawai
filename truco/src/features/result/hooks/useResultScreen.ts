import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";

import type { PointsToWin } from "@/domain/game/types";
import { useTranslations } from "@/shared/i18n";

export type LastResult = {
  isPlayerWin: boolean;
  nosScore: number;
  ellosScore: number;
  pointsToWin: PointsToWin;
};

type Status = "loading" | "ready" | "empty";

const LAST_RESULT_KEY = "@truco/last-result";

export function useResultScreen() {
  const { t } = useTranslations();
  const router = useRouter();

  const [status, setStatus] = useState<Status>("loading");
  const [result, setResult] = useState<LastResult | null>(null);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(LAST_RESULT_KEY)
      .then((raw) => {
        if (cancelled) return;
        if (!raw) {
          setStatus("empty");
          return;
        }
        try {
          const parsed = JSON.parse(raw) as LastResult;
          setResult(parsed);
          setStatus("ready");
        } catch {
          setStatus("empty");
        }
      })
      .catch(() => {
        if (!cancelled) setStatus("empty");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const backToMenu = useCallback(() => {
    router.replace("/");
  }, [router]);

  const playAgain = useCallback(() => {
    router.replace("/game/setup");
  }, [router]);

  const translations = useMemo(
    () => ({
      title: t("screens.result"),
      youWin: t("result.you_win"),
      cpuWins: t("result.cpu_wins"),
      finalScore: t("result.final_score"),
      playAgainLabel: t("result.play_again"),
      backToMenuLabel: t("result.back_to_menu"),
      loading: t("result.loading"),
      empty: t("result.empty"),
    }),
    [t],
  );

  return { status, result, backToMenu, playAgain, translations };
}

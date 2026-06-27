import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";

import type { PointsToWin } from "@/domain/game/types";
import { useTranslations } from "@/shared/i18n";
import { useTheme } from "@/shared/theme/ThemeProvider";
import { Button } from "@/shared/ui/Button";
import { Screen } from "@/shared/ui/Screen";

export type LastResult = {
  isPlayerWin: boolean;
  nosScore: number;
  ellosScore: number;
  pointsToWin: PointsToWin;
};

type Status = "loading" | "ready" | "empty";

const LAST_RESULT_KEY = "@truco/last-result";

export function ResultScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { t } = useTranslations();

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

  if (status === "loading") {
    return (
      <Screen testID="result-screen">
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", gap: 12 }}>
          <ActivityIndicator testID="result-loading" />
          <Text>{t("result.loading")}</Text>
        </View>
      </Screen>
    );
  }

  if (status === "empty" || !result) {
    return (
      <Screen testID="result-screen">
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", gap: 12 }}>
          <Text testID="result-empty">{t("result.empty")}</Text>
          <Button label={t("result.back_to_menu")} onPress={backToMenu} variant="primary" />
        </View>
      </Screen>
    );
  }

  return (
    <Screen testID="result-screen">
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", gap: 16 }}>
        <Text testID="result-winner" style={{ fontSize: 24, fontWeight: "700" }}>
          {result.isPlayerWin ? t("result.you_win") : t("result.cpu_wins")}
        </Text>
        <Text testID="result-score">
          {t("result.final_score")}: {result.nosScore} - {result.ellosScore}
        </Text>
        <View style={{ flexDirection: "row", gap: 12 }}>
          <Button label={t("result.play_again")} onPress={playAgain} variant="primary" />
          <Button label={t("result.back_to_menu")} onPress={backToMenu} variant="secondary" />
        </View>
      </View>
    </Screen>
  );
}

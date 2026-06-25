import { useMemo } from "react";

import { useTranslations } from "@/shared/i18n";

export function useRankingScreen() {
  const { t } = useTranslations();

  const translations = useMemo(
    () => ({
      title: t("screens.ranking"),
      subtitle: t("screens.placeholder"),
    }),
    [t],
  );

  return { translations };
}

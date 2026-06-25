import { useMemo } from "react";

import { useTranslations } from "@/shared/i18n";

export function useGameScreen() {
  const { t } = useTranslations();

  const translations = useMemo(
    () => ({
      title: t("screens.game"),
      subtitle: t("screens.placeholder"),
    }),
    [t],
  );

  return { translations };
}

import { useMemo } from "react";

import { useTranslations } from "@/shared/i18n";

export function useGameSetupScreen() {
  const { t } = useTranslations();

  const translations = useMemo(
    () => ({
      title: t("screens.game_setup"),
      subtitle: t("screens.placeholder"),
    }),
    [t],
  );

  return { translations };
}

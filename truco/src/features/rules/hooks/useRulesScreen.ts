import { useMemo } from "react";

import { useTranslations } from "@/shared/i18n";

export function useRulesScreen() {
  const { t } = useTranslations();

  const translations = useMemo(
    () => ({
      title: t("screens.rules"),
      subtitle: t("screens.placeholder"),
    }),
    [t],
  );

  return { translations };
}

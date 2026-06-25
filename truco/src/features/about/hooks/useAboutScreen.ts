import { useMemo } from "react";

import { useTranslations } from "@/shared/i18n";

export function useAboutScreen() {
  const { t } = useTranslations();

  const translations = useMemo(
    () => ({
      title: t("screens.about"),
      subtitle: t("about.description"),
    }),
    [t],
  );

  return { translations };
}

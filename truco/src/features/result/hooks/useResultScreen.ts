import { useMemo } from "react";

import { useTranslations } from "@/shared/i18n";

export function useResultScreen() {
  const { t } = useTranslations();

  const translations = useMemo(
    () => ({
      title: t("screens.result"),
      subtitle: t("screens.placeholder"),
    }),
    [t],
  );

  return { translations };
}

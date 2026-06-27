import { useMemo } from "react";

import { useTranslations } from "@/shared/i18n";

export function useAboutScreen() {
  const { t } = useTranslations();

  const translations = useMemo(
    () => ({
      title: t("screens.about"),
      description: t("about.description"),
      techStack: t("about.tech_stack"),
      demoLinkPlaceholder: t("about.demo_link_placeholder"),
    }),
    [t],
  );

  return { translations };
}

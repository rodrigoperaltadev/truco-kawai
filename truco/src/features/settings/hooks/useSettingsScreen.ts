import { useMemo } from "react";

import { type Locale, useI18n } from "@/shared/i18n";

export function useSettingsScreen() {
  const { locale, setLocale, t } = useI18n();

  const translations = useMemo(
    () => ({
      title: t("screens.settings"),
      language: t("settings.language"),
      spanish: t("settings.spanish"),
      english: t("settings.english"),
    }),
    [t],
  );

  const selectLocale = async (nextLocale: Locale) => {
    await setLocale(nextLocale);
  };

  return { locale, translations, selectLocale };
}

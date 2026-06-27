import { useMemo } from "react";

import { useTranslations } from "@/shared/i18n";

export function useRulesScreen() {
  const { t } = useTranslations();

  const translations = useMemo(
    () => ({
      title: t("rules.title"),
      objective: t("rules.objective"),
      suits: t("rules.suits"),
      hierarchy: t("rules.hierarchy"),
      trucoCalls: t("rules.truco_calls"),
      envidoPoints: t("rules.envido_points"),
      rounds: t("rules.rounds"),
      florNote: t("rules.flor_note"),
    }),
    [t],
  );

  return { translations };
}

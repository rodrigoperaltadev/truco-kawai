import { useRouter } from "expo-router";
import { useMemo } from "react";

import { useTranslations } from "@/shared/i18n";

type MenuItem = {
  label: string;
  href: "/game/setup" | "/game" | "/rules" | "/rules/ranking" | "/result" | "/settings" | "/about";
};

export function useMainMenu() {
  const router = useRouter();
  const { t } = useTranslations();

  const translations = useMemo(
    () => ({
      appName: t("app.name"),
      tagline: t("app.tagline"),
    }),
    [t],
  );

  const menuItems: MenuItem[] = useMemo(
    () => [
      { label: t("menu.play"), href: "/game/setup" },
      { label: t("menu.rules"), href: "/rules" },
      { label: t("menu.ranking"), href: "/rules/ranking" },
      { label: t("menu.settings"), href: "/settings" },
      { label: t("menu.about"), href: "/about" },
    ],
    [t],
  );

  const navigateTo = (href: MenuItem["href"]) => {
    router.push(href);
  };

  return { translations, menuItems, navigateTo };
}

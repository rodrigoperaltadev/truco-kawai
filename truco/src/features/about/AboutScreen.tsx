import { PlaceholderScreen } from "@/shared/ui/PlaceholderScreen";

import { useAboutScreen } from "./hooks/useAboutScreen";

export function AboutScreen() {
  const { translations } = useAboutScreen();

  return <PlaceholderScreen title={translations.title} subtitle={translations.subtitle} />;
}

import { PlaceholderScreen } from "@/shared/ui/PlaceholderScreen";

import { useRulesScreen } from "./hooks/useRulesScreen";

export function RulesScreen() {
  const { translations } = useRulesScreen();

  return <PlaceholderScreen title={translations.title} subtitle={translations.subtitle} />;
}

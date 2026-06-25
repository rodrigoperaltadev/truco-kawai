import { PlaceholderScreen } from "@/shared/ui/PlaceholderScreen";

import { useGameSetupScreen } from "./hooks/useGameSetupScreen";

export function GameSetupScreen() {
  const { translations } = useGameSetupScreen();

  return <PlaceholderScreen title={translations.title} subtitle={translations.subtitle} />;
}

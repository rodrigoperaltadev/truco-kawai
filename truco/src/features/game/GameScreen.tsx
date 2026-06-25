import { PlaceholderScreen } from "@/shared/ui/PlaceholderScreen";

import { useGameScreen } from "./hooks/useGameScreen";

export function GameScreen() {
  const { translations } = useGameScreen();

  return (
    <PlaceholderScreen title={translations.title} subtitle={translations.subtitle} showJargon />
  );
}

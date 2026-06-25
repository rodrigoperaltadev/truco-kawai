import { PlaceholderScreen } from "@/shared/ui/PlaceholderScreen";

import { useRankingScreen } from "./hooks/useRankingScreen";

export function RankingScreen() {
  const { translations } = useRankingScreen();

  return (
    <PlaceholderScreen title={translations.title} subtitle={translations.subtitle} showJargon />
  );
}

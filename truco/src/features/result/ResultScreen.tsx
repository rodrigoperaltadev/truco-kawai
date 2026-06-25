import { PlaceholderScreen } from "@/shared/ui/PlaceholderScreen";

import { useResultScreen } from "./hooks/useResultScreen";

export function ResultScreen() {
  const { translations } = useResultScreen();

  return <PlaceholderScreen title={translations.title} subtitle={translations.subtitle} />;
}

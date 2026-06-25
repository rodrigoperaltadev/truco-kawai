import { Text } from "react-native";

import { jargon } from "@/shared/i18n/jargon";
import { Row } from "@/shared/layout";
import { useTheme } from "@/shared/theme/ThemeProvider";
import { Pill } from "@/shared/ui/Pill";
import { Screen } from "@/shared/ui/Screen";

import { createPlaceholderStyles } from "./PlaceholderScreen.styles";

type PlaceholderScreenProps = {
  title: string;
  subtitle: string;
  showJargon?: boolean;
};

export function PlaceholderScreen({ title, subtitle, showJargon = false }: PlaceholderScreenProps) {
  const theme = useTheme();
  const styles = createPlaceholderStyles(theme);

  return (
    <Screen testID="placeholder-screen">
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      {showJargon ? (
        <Row gap="sm" testID="placeholder-jargon-row">
          <Pill label={jargon.truco} testID="placeholder-jargon-truco" variant="jargon" />
          <Pill label={jargon.envido} testID="placeholder-jargon-envido" variant="jargon" />
          <Pill label={jargon.suits.espada} testID="placeholder-jargon-espada" variant="jargon" />
        </Row>
      ) : null}
    </Screen>
  );
}

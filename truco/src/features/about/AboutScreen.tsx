import { Text, View } from "react-native";

import { Stack } from "@/shared/layout";
import { useTheme } from "@/shared/theme/ThemeProvider";
import { Screen } from "@/shared/ui/Screen";

import { createAboutStyles } from "./AboutScreen.styles";
import { useAboutScreen } from "./hooks/useAboutScreen";

export function AboutScreen() {
  const theme = useTheme();
  const styles = createAboutStyles(theme);
  const { translations } = useAboutScreen();

  return (
    <Screen testID="about-screen" title={translations.title}>
      <Stack gap="lg">
        <View testID="about-description">
          <Text style={styles.body}>{translations.description}</Text>
        </View>

        <View testID="about-tech-stack">
          <Text style={styles.muted}>{translations.techStack}</Text>
        </View>

        <View testID="about-demo-link">
          <Text style={styles.muted}>{translations.demoLinkPlaceholder}</Text>
        </View>
      </Stack>
    </Screen>
  );
}

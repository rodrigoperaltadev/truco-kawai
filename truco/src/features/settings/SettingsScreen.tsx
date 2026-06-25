import { Text, View } from "react-native";

import { Row, Stack } from "@/shared/layout";
import { useTheme } from "@/shared/theme/ThemeProvider";
import { Button } from "@/shared/ui/Button";
import { Screen } from "@/shared/ui/Screen";

import { createSettingsStyles } from "./SettingsScreen.styles";
import { useSettingsScreen } from "./hooks/useSettingsScreen";

export function SettingsScreen() {
  const theme = useTheme();
  const styles = createSettingsStyles(theme);
  const { locale, translations, selectLocale } = useSettingsScreen();

  return (
    <Screen testID="settings-screen" title={translations.title}>
      <Stack gap="lg">
        <Text style={styles.sectionLabel}>{translations.language}</Text>
        <Row gap="sm" testID="settings-locale-row">
          <View style={styles.localeButton}>
            <Button
              label={translations.spanish}
              onPress={() => void selectLocale("es")}
              testID="settings-locale-es"
              variant={locale === "es" ? "primary" : "secondary"}
            />
          </View>
          <View style={styles.localeButton}>
            <Button
              label={translations.english}
              onPress={() => void selectLocale("en")}
              testID="settings-locale-en"
              variant={locale === "en" ? "primary" : "secondary"}
            />
          </View>
        </Row>
      </Stack>
    </Screen>
  );
}

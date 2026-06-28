import { Text, View } from "react-native";

import { Row, Stack } from "@/shared/layout";
import { useTheme } from "@/shared/theme/ThemeProvider";
import { Button } from "@/shared/ui/Button";
import { Screen } from "@/shared/ui/Screen";

import { createSettingsStyles } from "./SettingsScreen.styles";
import { useSettingsScreen } from "./hooks/useSettingsScreen";

const VOLUME_LABELS: Record<number, string> = {
  0: "0",
  0.25: "25",
  0.5: "50",
  0.75: "75",
  1: "100",
};

export function SettingsScreen() {
  const theme = useTheme();
  const styles = createSettingsStyles(theme);
  const {
    locale,
    translations,
    selectLocale,
    musicVolume,
    voiceVolume,
    setMusicVolume,
    setVoiceVolume,
    volumeSteps,
  } = useSettingsScreen();

  return (
    <Screen testID="settings-screen" title={translations.title}>
      <Stack gap="lg">
        {/* Language switcher */}
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

        {/* Music volume */}
        <Text style={styles.sectionLabel}>{translations.musicVolume}</Text>
        <Row gap="xs" testID="settings-music-volume">
          {volumeSteps.map((step) => (
            <View key={step} style={styles.volumeButton}>
              <Button
                label={VOLUME_LABELS[step] ?? String(step)}
                onPress={() => setMusicVolume(step)}
                testID={`settings-music-${step}`}
                variant={musicVolume === step ? "primary" : "secondary"}
              />
            </View>
          ))}
        </Row>

        {/* Voice volume */}
        <Text style={styles.sectionLabel}>{translations.voiceVolume}</Text>
        <Row gap="xs" testID="settings-voice-volume">
          {volumeSteps.map((step) => (
            <View key={step} style={styles.volumeButton}>
              <Button
                label={VOLUME_LABELS[step] ?? String(step)}
                onPress={() => setVoiceVolume(step)}
                testID={`settings-voice-${step}`}
                variant={voiceVolume === step ? "primary" : "secondary"}
              />
            </View>
          ))}
        </Row>
      </Stack>
    </Screen>
  );
}

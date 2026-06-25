import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { FontGate } from "@/shared/fonts";
import { I18nProvider } from "@/shared/i18n";
import { ThemeProvider } from "@/shared/theme/ThemeProvider";
import { colors } from "@/shared/theme/tokens";

export default function RootLayout() {
  return (
    <FontGate>
      <ThemeProvider>
        <I18nProvider>
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: colors.background },
              headerTintColor: colors.onSurface,
              contentStyle: { backgroundColor: colors.background },
            }}
          />
          <StatusBar style="light" />
        </I18nProvider>
      </ThemeProvider>
    </FontGate>
  );
}

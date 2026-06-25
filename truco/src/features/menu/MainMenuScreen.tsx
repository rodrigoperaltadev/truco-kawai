import { Text, View } from "react-native";

import { jargon } from "@/shared/i18n/jargon";
import { useTheme } from "@/shared/theme/ThemeProvider";
import { Button } from "@/shared/ui/Button";
import { Pill } from "@/shared/ui/Pill";
import { Screen } from "@/shared/ui/Screen";

import { createMainMenuStyles } from "./MainMenuScreen.styles";
import { useMainMenu } from "./hooks/useMainMenu";

export function MainMenuScreen() {
  const theme = useTheme();
  const styles = createMainMenuStyles(theme);
  const { translations, menuItems, navigateTo } = useMainMenu();

  return (
    <Screen testID="main-menu-screen">
      <View style={styles.header}>
        <Text style={styles.appName}>{translations.appName}</Text>
        <Text style={styles.tagline}>{translations.tagline}</Text>
        <Pill
          label={`${jargon.truco} · ${jargon.envido}`}
          testID="main-menu-jargon-pill"
          variant="jargon"
        />
      </View>
      <View style={styles.menuList}>
        {menuItems.map((item) => (
          <Button
            key={item.href}
            label={item.label}
            onPress={() => navigateTo(item.href)}
            testID={`menu-item-${item.href.replace(/\//g, "-")}`}
            variant="secondary"
          />
        ))}
      </View>
    </Screen>
  );
}

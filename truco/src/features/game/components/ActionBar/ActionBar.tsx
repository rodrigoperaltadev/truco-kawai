import { View } from "react-native";

import type { CallType, EnvidoLevel } from "@/domain/game/types";
import { useTranslations } from "@/shared/i18n";
import { useTheme } from "@/shared/theme/ThemeProvider";
import { Button } from "@/shared/ui/Button";

import type { GameHandlers } from "../../hooks/useGameState";
import type { GameActions } from "../../logic/deriveActions";
import { createActionBarStyles } from "./ActionBar.styles";

type ActionBarProps = {
  actions: GameActions;
  handlers: GameHandlers;
  testID?: string;
};

type ActionEntry = {
  key: keyof GameActions;
  i18nKey: string;
  onPress: (handlers: GameHandlers) => void;
};

const ACTION_ENTRIES: ActionEntry[] = [
  { key: "truco", i18nKey: "game.actions.truco", onPress: (h) => h.onCall("truco" as CallType) },
  {
    key: "retruco",
    i18nKey: "game.actions.retruco",
    onPress: (h) => h.onCall("retruco" as CallType),
  },
  {
    key: "valeCuatro",
    i18nKey: "game.actions.vale_cuatro",
    onPress: (h) => h.onCall("vale_cuatro" as CallType),
  },
  {
    key: "envido",
    i18nKey: "game.actions.envido",
    onPress: (h) => h.onCallEnvido("envido" as EnvidoLevel),
  },
  {
    key: "realEnvido",
    i18nKey: "game.actions.real_envido",
    onPress: (h) => h.onCallEnvido("real_envido" as EnvidoLevel),
  },
  {
    key: "faltaEnvido",
    i18nKey: "game.actions.falta_envido",
    onPress: (h) => h.onCallEnvido("falta_envido" as EnvidoLevel),
  },
  { key: "quiero", i18nKey: "game.actions.quiero", onPress: (h) => h.onAccept() },
  { key: "noQuiero", i18nKey: "game.actions.no_quiero", onPress: (h) => h.onReject() },
  { key: "mazo", i18nKey: "game.actions.mazo", onPress: (h) => h.onMazo() },
];

export function ActionBar({ actions, handlers, testID }: ActionBarProps) {
  const theme = useTheme();
  const styles = createActionBarStyles(theme);
  const { t } = useTranslations();

  const enabledEntries = ACTION_ENTRIES.filter((entry) => actions[entry.key]);

  if (enabledEntries.length === 0) {
    return null;
  }

  return (
    <View style={styles.container} testID={testID}>
      {enabledEntries.map((entry) => (
        <Button
          key={String(entry.key)}
          label={t(entry.i18nKey)}
          onPress={() => entry.onPress(handlers)}
          testID={testID ? `${testID}-${String(entry.key)}` : undefined}
        />
      ))}
    </View>
  );
}

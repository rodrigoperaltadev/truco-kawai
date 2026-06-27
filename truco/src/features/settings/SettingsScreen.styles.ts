import { StyleSheet } from "react-native";

import type { Theme } from "@/shared/theme/tokens";

export function createSettingsStyles(theme: Theme) {
  return StyleSheet.create({
    sectionLabel: {
      color: theme.colors.onSurfaceVariant,
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: theme.typography.labelSm.fontSize,
      fontWeight: theme.typography.labelSm.fontWeight,
      lineHeight: theme.typography.labelSm.lineHeight,
      letterSpacing: theme.typography.labelSm.letterSpacing,
      textTransform: "uppercase",
    },
    localeButton: {
      flex: 1,
    },
    volumeButton: {
      flex: 1,
    },
  });
}

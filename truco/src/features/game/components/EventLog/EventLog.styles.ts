import { StyleSheet } from "react-native";

import type { Theme } from "@/shared/theme/tokens";

const LOG_MAX_HEIGHT = 180;

export function createEventLogStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      maxHeight: LOG_MAX_HEIGHT,
    },
    label: {
      color: theme.colors.onSurfaceVariant,
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: theme.typography.labelSm.fontSize,
      fontWeight: theme.typography.labelSm.fontWeight,
      letterSpacing: theme.typography.labelSm.letterSpacing,
      lineHeight: theme.typography.labelSm.lineHeight,
      marginBottom: theme.spacing.xs,
    },
    entry: {
      color: theme.colors.onSurface,
      fontFamily: theme.typography.bodyMd.fontFamily,
      fontSize: theme.typography.bodyMd.fontSize,
      fontWeight: theme.typography.bodyMd.fontWeight,
      lineHeight: theme.typography.bodyMd.lineHeight,
      paddingVertical: 2,
    },
  });
}

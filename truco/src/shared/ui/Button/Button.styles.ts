import { StyleSheet } from "react-native";

import type { Theme } from "@/shared/theme/tokens";

const MIN_TOUCH_HEIGHT = 44;

export function createButtonStyles(theme: Theme) {
  return StyleSheet.create({
    base: {
      alignItems: "center",
      borderRadius: theme.radius.md,
      justifyContent: "center",
      minHeight: MIN_TOUCH_HEIGHT,
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
    },
    primary: {
      backgroundColor: theme.colors.tertiary,
    },
    secondary: {
      backgroundColor: theme.colors.surfaceContainerHigh,
    },
    disabled: {
      opacity: 0.5,
    },
    pressed: {
      opacity: 0.85,
    },
    label: {
      fontFamily: theme.typography.titleMd.fontFamily,
      fontSize: theme.typography.titleMd.fontSize,
      fontWeight: theme.typography.titleMd.fontWeight,
      lineHeight: theme.typography.titleMd.lineHeight,
    },
    labelPrimary: {
      color: theme.colors.onTertiary,
    },
    labelSecondary: {
      color: theme.colors.onSurface,
    },
    labelDisabled: {
      color: theme.colors.onSurfaceVariant,
    },
  });
}

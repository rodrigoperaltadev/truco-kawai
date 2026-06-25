import { StyleSheet } from "react-native";

import type { Theme } from "@/shared/theme/tokens";

export function createPillStyles(theme: Theme) {
  return StyleSheet.create({
    base: {
      alignSelf: "flex-start",
      borderRadius: theme.radius.full,
      borderWidth: 1,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.xs,
    },
    default: {
      backgroundColor: theme.colors.surfaceContainer,
      borderColor: theme.colors.outlineVariant,
    },
    jargon: {
      backgroundColor: theme.colors.surfaceContainerLow,
      borderColor: theme.colors.tertiary,
    },
    label: {
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: theme.typography.labelSm.fontSize,
      fontWeight: theme.typography.labelSm.fontWeight,
      lineHeight: theme.typography.labelSm.lineHeight,
      letterSpacing: theme.typography.labelSm.letterSpacing,
    },
    labelDefault: {
      color: theme.colors.onSurfaceVariant,
    },
    labelJargon: {
      color: theme.colors.tertiary,
      fontStyle: "italic",
    },
  });
}

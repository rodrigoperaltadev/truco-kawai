import { StyleSheet } from "react-native";

import type { Theme } from "@/shared/theme/tokens";

export function createScreenStyles(theme: Theme) {
  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    content: {
      flex: 1,
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.xl,
    },
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.xl,
      paddingBottom: theme.spacing.lg,
    },
    title: {
      color: theme.colors.onSurface,
      fontFamily: theme.typography.headlineLg.fontFamily,
      fontSize: theme.typography.headlineLg.fontSize,
      fontWeight: theme.typography.headlineLg.fontWeight,
      lineHeight: theme.typography.headlineLg.lineHeight,
      marginBottom: theme.spacing.md,
    },
  });
}

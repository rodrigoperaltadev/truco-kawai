import { StyleSheet } from "react-native";

import type { Theme } from "@/shared/theme/tokens";

export function createRankingStyles(theme: Theme) {
  return StyleSheet.create({
    headerRow: {
      flexDirection: "row",
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outlineVariant,
      paddingBottom: 8,
    },
    headerCell: {
      color: theme.colors.onSurfaceVariant,
      fontFamily: theme.typography.labelSm.fontFamily,
      fontSize: theme.typography.labelSm.fontSize,
      fontWeight: theme.typography.labelSm.fontWeight,
      lineHeight: theme.typography.labelSm.lineHeight,
      textTransform: "uppercase",
    },
    row: {
      flexDirection: "row",
      paddingVertical: 6,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.outlineVariant,
    },
    cell: {
      color: theme.colors.onSurface,
      fontFamily: theme.typography.bodyMd.fontFamily,
      fontSize: theme.typography.bodyMd.fontSize,
      lineHeight: theme.typography.bodyMd.lineHeight,
    },
    positionCell: {
      flex: 1,
    },
    suitCell: {
      flex: 2,
    },
    rankCell: {
      flex: 2,
    },
    envidoCell: {
      flex: 1.5,
      textAlign: "right",
    },
  });
}

import { Text, View } from "react-native";

import { useTheme } from "@/shared/theme/ThemeProvider";

import { createPillStyles } from "./Pill.styles";

type PillVariant = "default" | "jargon";

type PillProps = {
  label: string;
  variant?: PillVariant;
  testID?: string;
};

export function Pill({ label, variant = "default", testID }: PillProps) {
  const theme = useTheme();
  const styles = createPillStyles(theme);

  return (
    <View
      style={[styles.base, variant === "jargon" ? styles.jargon : styles.default]}
      testID={testID}
    >
      <Text style={[styles.label, variant === "jargon" ? styles.labelJargon : styles.labelDefault]}>
        {label}
      </Text>
    </View>
  );
}

import type { ReactNode } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTheme } from "@/shared/theme/ThemeProvider";

import { createScreenStyles } from "./Screen.styles";

type ScreenProps = {
  children: ReactNode;
  title?: string;
  scrollable?: boolean;
  testID?: string;
};

export function Screen({ children, title, scrollable = false, testID }: ScreenProps) {
  const theme = useTheme();
  const styles = createScreenStyles(theme);

  const body = (
    <>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {children}
    </>
  );

  return (
    <SafeAreaView style={styles.safeArea} testID={testID}>
      {scrollable ? (
        <ScrollView contentContainerStyle={styles.scrollContent}>{body}</ScrollView>
      ) : (
        <View style={styles.content}>{body}</View>
      )}
    </SafeAreaView>
  );
}

import { ScrollView, Text, View } from "react-native";

import { useTheme } from "@/shared/theme/ThemeProvider";

import type { LogEntry } from "../../logic/logEntry";
import { createEventLogStyles } from "./EventLog.styles";

type EventLogProps = {
  entries: readonly LogEntry[];
  testID?: string;
};

export function EventLog({ entries, testID }: EventLogProps) {
  const theme = useTheme();
  const styles = createEventLogStyles(theme);

  return (
    <View style={styles.container} testID={testID}>
      <Text style={styles.label}>Evento</Text>
      <ScrollView testID={testID ? `${testID}-scroll` : undefined} showsVerticalScrollIndicator>
        {entries.map((entry) => (
          <Text
            key={entry.id}
            style={styles.entry}
            testID={testID ? `${testID}-entry-${entry.id}` : undefined}
          >
            {entry.text}
          </Text>
        ))}
      </ScrollView>
    </View>
  );
}

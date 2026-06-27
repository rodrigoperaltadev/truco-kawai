import { EventLog } from "@/features/game/components/EventLog";
import type { LogEntry } from "@/features/game/logic/logEntry";
import { render } from "../../../helpers/render";

const ENTRIES: LogEntry[] = [
  { id: "0", kind: "play", actorName: "Alice", text: "Alice: 7 Espada" },
  { id: "1", kind: "play", actorName: "Bob", text: "Bob: 1 Basto" },
  { id: "2", kind: "trick", actorName: "Alice", text: "Alice ganó la baza con 7 Espada" },
];

describe("EventLog", () => {
  it("renders all log entries", async () => {
    const { findByText } = render(<EventLog entries={ENTRIES} testID="log" />);

    expect(await findByText("Alice: 7 Espada")).toBeTruthy();
    expect(await findByText("Bob: 1 Basto")).toBeTruthy();
    expect(await findByText("Alice ganó la baza con 7 Espada")).toBeTruthy();
  });

  it("renders empty state when no entries", async () => {
    const { queryByText } = render(<EventLog entries={[]} testID="log" />);

    // Wait a bit for I18nProvider to initialize, then check
    // Since there are no entries, queryByText should return null
    expect(queryByText("Alice: 7 Espada")).toBeNull();
  });

  it("has a scroll view for independent scrolling", async () => {
    const { findByTestId } = render(<EventLog entries={ENTRIES} testID="log" />);

    expect(await findByTestId("log-scroll")).toBeTruthy();
  });
});

import { render } from "@testing-library/react-native";

import { ThemeProvider } from "@/shared/theme/ThemeProvider";
import { ScoreBadge } from "@/shared/ui/ScoreBadge";

function renderScoreBadge(team: "nos" | "ellos", score: number) {
  return render(
    <ThemeProvider>
      <ScoreBadge score={score} team={team} testID={`score-${team}`} />
    </ThemeProvider>,
  );
}

describe("ScoreBadge", () => {
  it("renders team label and score for nos", () => {
    const { getByText, getByTestId } = renderScoreBadge("nos", 15);

    expect(getByTestId("score-nos")).toBeTruthy();
    expect(getByText("Nos")).toBeTruthy();
    expect(getByText("15")).toBeTruthy();
  });

  it("renders team label and score for ellos", () => {
    const { getByText } = renderScoreBadge("ellos", 8);

    expect(getByText("Ellos")).toBeTruthy();
    expect(getByText("8")).toBeTruthy();
  });
});

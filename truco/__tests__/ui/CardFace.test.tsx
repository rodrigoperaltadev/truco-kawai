import { fireEvent, render } from "@testing-library/react-native";

import { ThemeProvider } from "@/shared/theme/ThemeProvider";
import { CardFace } from "@/shared/ui/CardFace";

function renderCardFace(props: Partial<React.ComponentProps<typeof CardFace>> = {}) {
  const defaultProps = { rank: 7 as const, suit: "espada" as const };
  return render(
    <ThemeProvider>
      <CardFace {...defaultProps} {...props} />
    </ThemeProvider>,
  );
}

describe("CardFace", () => {
  it("renders rank and suit label", () => {
    const { getByText } = renderCardFace({ rank: 7, suit: "espada" });

    expect(getByText("7 Espada")).toBeTruthy();
  });

  it("uses jargon suit names for all suits", () => {
    const { getByText, rerender } = renderCardFace({ rank: 1, suit: "oro" });
    expect(getByText("1 Oro")).toBeTruthy();

    rerender(
      <ThemeProvider>
        <CardFace rank={12} suit="copa" />
      </ThemeProvider>,
    );
    expect(getByText("12 Copa")).toBeTruthy();

    rerender(
      <ThemeProvider>
        <CardFace rank={3} suit="basto" />
      </ThemeProvider>,
    );
    expect(getByText("3 Basto")).toBeTruthy();
  });

  it("sets accessibilityLabel to the card text", () => {
    const { getByLabelText } = renderCardFace({ rank: 7, suit: "espada" });

    expect(getByLabelText("7 Espada")).toBeTruthy();
  });

  it("calls onPress when tapped and enabled", () => {
    const onPress = jest.fn();
    const { getByTestId } = renderCardFace({
      rank: 1,
      suit: "espada",
      onPress,
      testID: "card-face",
    });

    fireEvent.press(getByTestId("card-face"));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("does not call onPress when disabled", () => {
    const onPress = jest.fn();
    const { getByTestId } = renderCardFace({
      rank: 1,
      suit: "espada",
      onPress,
      disabled: true,
      testID: "card-face",
    });

    fireEvent.press(getByTestId("card-face"));

    expect(onPress).not.toHaveBeenCalled();
  });

  it("sets accessibilityState.disabled when disabled", () => {
    const { getByRole } = renderCardFace({
      rank: 7,
      suit: "espada",
      disabled: true,
    });

    expect(getByRole("button", { disabled: true })).toBeTruthy();
  });
});

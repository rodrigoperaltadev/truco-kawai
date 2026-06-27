import { render } from "@testing-library/react-native";

import { ThemeProvider } from "@/shared/theme/ThemeProvider";
import { CardBack } from "@/shared/ui/CardBack";

function renderCardBack(testID?: string) {
  return render(
    <ThemeProvider>
      <CardBack testID={testID} />
    </ThemeProvider>,
  );
}

describe("CardBack", () => {
  it("renders with accessibilityLabel 'Carta boca abajo'", () => {
    const { getByLabelText } = renderCardBack();

    expect(getByLabelText("Carta boca abajo")).toBeTruthy();
  });

  it("does not reveal rank or suit text", () => {
    const { queryByText } = renderCardBack();

    // CardBack must not contain any card rank or suit text
    expect(queryByText(/Espada|Basto|Copa|Oro/)).toBeNull();
    expect(queryByText(/^(1|2|3|4|5|6|7|10|11|12)\s/)).toBeNull();
  });

  it("accepts a testID prop", () => {
    const { getByTestId } = renderCardBack("card-back");

    expect(getByTestId("card-back")).toBeTruthy();
  });
});

import { fireEvent, render } from "@testing-library/react-native";
import type { ComponentProps } from "react";

import { ThemeProvider } from "@/shared/theme/ThemeProvider";
import { Button } from "@/shared/ui/Button";

function renderButton(props: ComponentProps<typeof Button>) {
  return render(
    <ThemeProvider>
      <Button {...props} />
    </ThemeProvider>,
  );
}

describe("Button", () => {
  it("does not call onPress when disabled", () => {
    const onPress = jest.fn();

    const { getByTestId } = renderButton({
      label: "Quiero",
      onPress,
      disabled: true,
      testID: "disabled-button",
    });

    fireEvent.press(getByTestId("disabled-button"));

    expect(onPress).not.toHaveBeenCalled();
  });

  it("calls onPress when enabled", () => {
    const onPress = jest.fn();

    const { getByTestId } = renderButton({
      label: "Quiero",
      onPress,
      testID: "enabled-button",
    });

    fireEvent.press(getByTestId("enabled-button"));

    expect(onPress).toHaveBeenCalledTimes(1);
  });
});

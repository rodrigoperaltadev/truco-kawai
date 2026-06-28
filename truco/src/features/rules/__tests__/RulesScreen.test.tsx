import { render, screen, waitFor } from "@testing-library/react-native";
import type { ReactNode } from "react";

import { I18nProvider } from "@/shared/i18n";
import { ThemeProvider } from "@/shared/theme/ThemeProvider";

import { RulesScreen } from "../RulesScreen";

function wrapper({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <I18nProvider>{children}</I18nProvider>
    </ThemeProvider>
  );
}

describe("RulesScreen", () => {
  it("renders the rules screen", async () => {
    render(<RulesScreen />, { wrapper });
    await waitFor(() => {
      expect(screen.getByTestId("rules-screen")).toBeTruthy();
    });
  });

  it("renders all rule sections", async () => {
    render(<RulesScreen />, { wrapper });
    await waitFor(() => {
      expect(screen.getByTestId("rules-section-objective")).toBeTruthy();
      expect(screen.getByTestId("rules-section-suits")).toBeTruthy();
      expect(screen.getByTestId("rules-section-hierarchy")).toBeTruthy();
      expect(screen.getByTestId("rules-section-truco")).toBeTruthy();
      expect(screen.getByTestId("rules-section-envido")).toBeTruthy();
      expect(screen.getByTestId("rules-section-rounds")).toBeTruthy();
      expect(screen.getByTestId("rules-section-flor")).toBeTruthy();
    });
  });
});

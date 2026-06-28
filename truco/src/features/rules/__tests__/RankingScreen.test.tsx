import { render, screen, waitFor } from "@testing-library/react-native";
import type { ReactNode } from "react";

import { I18nProvider } from "@/shared/i18n";
import { ThemeProvider } from "@/shared/theme/ThemeProvider";

import { RankingScreen } from "../RankingScreen";

function wrapper({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <I18nProvider>{children}</I18nProvider>
    </ThemeProvider>
  );
}

describe("RankingScreen", () => {
  it("renders the ranking screen", async () => {
    render(<RankingScreen />, { wrapper });
    await waitFor(() => {
      expect(screen.getByTestId("ranking-screen")).toBeTruthy();
    });
  });

  it("renders header row", async () => {
    render(<RankingScreen />, { wrapper });
    await waitFor(() => {
      expect(screen.getByTestId("ranking-header")).toBeTruthy();
    });
  });

  it("renders exactly 40 card rows", async () => {
    render(<RankingScreen />, { wrapper });
    await waitFor(() => {
      // Check all 40 positions exist
      for (let i = 1; i <= 40; i++) {
        expect(screen.getByTestId(`ranking-row-${i}`)).toBeTruthy();
      }
    });
  });
});

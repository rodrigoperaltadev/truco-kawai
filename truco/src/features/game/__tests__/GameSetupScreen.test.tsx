import { render, screen, waitFor } from "@testing-library/react-native";
import type { ReactNode } from "react";

import { I18nProvider } from "@/shared/i18n";
import { ThemeProvider } from "@/shared/theme/ThemeProvider";

import { GameSetupScreen } from "../GameSetupScreen";

// Mock expo-router
jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  useLocalSearchParams: () => ({}),
}));

function wrapper({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <I18nProvider>{children}</I18nProvider>
    </ThemeProvider>
  );
}

describe("GameSetupScreen", () => {
  it("renders the setup screen", async () => {
    render(<GameSetupScreen />, { wrapper });
    await waitFor(() => {
      expect(screen.getByTestId("game-setup-screen")).toBeTruthy();
    });
  });

  it("renders 15 and 30 points buttons", async () => {
    render(<GameSetupScreen />, { wrapper });
    await waitFor(() => {
      expect(screen.getByTestId("setup-points-15")).toBeTruthy();
      expect(screen.getByTestId("setup-points-30")).toBeTruthy();
    });
  });

  it("renders CPU opponent pill", async () => {
    render(<GameSetupScreen />, { wrapper });
    await waitFor(() => {
      expect(screen.getByTestId("setup-opponent-cpu")).toBeTruthy();
    });
  });

  it("renders start button", async () => {
    render(<GameSetupScreen />, { wrapper });
    await waitFor(() => {
      expect(screen.getByTestId("setup-start")).toBeTruthy();
    });
  });
});

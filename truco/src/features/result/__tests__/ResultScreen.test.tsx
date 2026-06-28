import AsyncStorage from "@react-native-async-storage/async-storage";
import { render, screen, waitFor } from "@testing-library/react-native";
import type { ReactNode } from "react";

import { I18nProvider } from "@/shared/i18n";
import { ThemeProvider } from "@/shared/theme/ThemeProvider";

import { ResultScreen } from "../ResultScreen";

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

describe("ResultScreen", () => {
  beforeEach(() => {
    (AsyncStorage.getItem as jest.Mock).mockClear();
  });

  it("renders loading state initially", async () => {
    // Allow I18nProvider to resolve, but block the result screen's read
    (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) => {
      if (key === "@truco/locale") return Promise.resolve(null);
      return new Promise(() => {}); // never resolves for @truco/last-result
    });
    render(<ResultScreen />, { wrapper });
    await waitFor(() => {
      expect(screen.getByTestId("result-loading")).toBeTruthy();
    });
  });

  it("renders empty state when no result", async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    render(<ResultScreen />, { wrapper });
    await waitFor(() => {
      expect(screen.getByTestId("result-empty")).toBeTruthy();
    });
  });

  it("renders winner text when result exists", async () => {
    (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) => {
      if (key === "@truco/last-result") {
        return Promise.resolve(
          JSON.stringify({
            isPlayerWin: true,
            nosScore: 15,
            ellosScore: 10,
            pointsToWin: 15,
          }),
        );
      }
      return Promise.resolve(null);
    });
    render(<ResultScreen />, { wrapper });
    await waitFor(() => {
      expect(screen.getByTestId("result-winner")).toBeTruthy();
      expect(screen.getByTestId("result-score")).toBeTruthy();
    });
  });
});

import { act, renderHook, waitFor } from "@testing-library/react-native";
import type { ReactNode } from "react";

import { I18nProvider } from "@/shared/i18n";
import { ThemeProvider } from "@/shared/theme/ThemeProvider";

import { useGameSetupScreen } from "../hooks/useGameSetupScreen";

// Mock expo-router
const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: mockPush,
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

describe("useGameSetupScreen", () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  it("defaults pointsToWin to 15", async () => {
    const { result } = renderHook(() => useGameSetupScreen(), { wrapper });
    await waitFor(() => {
      expect(result.current.pointsToWin).toBe(15);
    });
  });

  it("updates pointsToWin when setPointsToWin is called", async () => {
    const { result } = renderHook(() => useGameSetupScreen(), { wrapper });
    await waitFor(() => {
      expect(result.current.pointsToWin).toBe(15);
    });
    act(() => {
      result.current.setPointsToWin(30);
    });
    expect(result.current.pointsToWin).toBe(30);
  });

  it("navigates to /game with correct params when startGame is called", async () => {
    const { result } = renderHook(() => useGameSetupScreen(), { wrapper });
    await waitFor(() => {
      expect(result.current.startGame).toBeDefined();
    });
    act(() => {
      result.current.setPointsToWin(30);
    });
    act(() => {
      result.current.startGame();
    });
    expect(mockPush).toHaveBeenCalledWith("/game?pointsToWin=30&opponentId=cpu");
  });

  it("navigates with default 15 points when startGame is called without change", async () => {
    const { result } = renderHook(() => useGameSetupScreen(), { wrapper });
    await waitFor(() => {
      expect(result.current.startGame).toBeDefined();
    });
    act(() => {
      result.current.startGame();
    });
    expect(mockPush).toHaveBeenCalledWith("/game?pointsToWin=15&opponentId=cpu");
  });

  it("provides translations", async () => {
    const { result } = renderHook(() => useGameSetupScreen(), { wrapper });
    await waitFor(() => {
      expect(result.current.translations.title).toBeDefined();
    });
    expect(result.current.translations.pointsToWinLabel).toBeDefined();
    expect(result.current.translations.start).toBeDefined();
  });
});

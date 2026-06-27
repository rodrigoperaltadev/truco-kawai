import AsyncStorage from "@react-native-async-storage/async-storage";
import { renderHook, waitFor } from "@testing-library/react-native";
import type { ReactNode } from "react";

import { I18nProvider } from "@/shared/i18n";
import { ThemeProvider } from "@/shared/theme/ThemeProvider";

import { useResultScreen } from "../hooks/useResultScreen";

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

describe("useResultScreen", () => {
  beforeEach(() => {
    (AsyncStorage.getItem as jest.Mock).mockClear();
  });

  it("starts in loading status", async () => {
    // Allow I18nProvider to resolve, but block the result screen's read
    (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) => {
      if (key === "@truco/locale") return Promise.resolve(null);
      return new Promise(() => {}); // never resolves for @truco/last-result
    });
    const { result } = renderHook(() => useResultScreen(), { wrapper });
    await waitFor(() => {
      expect(result.current).not.toBeNull();
    });
    expect(result.current.status).toBe("loading");
  });

  it("transitions to 'empty' when no result stored", async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

    const { result } = renderHook(() => useResultScreen(), { wrapper });

    await waitFor(() => {
      expect(result.current.status).toBe("empty");
    });
    expect(result.current.result).toBeNull();
  });

  it("transitions to 'ready' when valid result stored", async () => {
    const stored = {
      isPlayerWin: true,
      nosScore: 15,
      ellosScore: 10,
      pointsToWin: 15,
    };
    (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) => {
      if (key === "@truco/last-result") return Promise.resolve(JSON.stringify(stored));
      return Promise.resolve(null);
    });

    const { result } = renderHook(() => useResultScreen(), { wrapper });

    await waitFor(() => {
      expect(result.current.status).toBe("ready");
    });
    expect(result.current.result).toEqual(stored);
  });

  it("transitions to 'empty' on invalid JSON", async () => {
    (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) => {
      if (key === "@truco/last-result") return Promise.resolve("not-json{{{");
      return Promise.resolve(null);
    });

    const { result } = renderHook(() => useResultScreen(), { wrapper });

    await waitFor(() => {
      expect(result.current.status).toBe("empty");
    });
  });

  it("provides translations", async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

    const { result } = renderHook(() => useResultScreen(), { wrapper });

    await waitFor(() => {
      expect(result.current.translations.title).toBeDefined();
      expect(result.current.translations.youWin).toBeDefined();
      expect(result.current.translations.cpuWins).toBeDefined();
    });
  });
});

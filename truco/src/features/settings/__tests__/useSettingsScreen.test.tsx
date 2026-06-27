import AsyncStorage from "@react-native-async-storage/async-storage";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import type { ReactNode } from "react";

import { I18nProvider } from "@/shared/i18n";
import { ThemeProvider } from "@/shared/theme/ThemeProvider";

import { useSettingsScreen } from "../hooks/useSettingsScreen";

function wrapper({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <I18nProvider>{children}</I18nProvider>
    </ThemeProvider>
  );
}

describe("useSettingsScreen", () => {
  beforeEach(() => {
    (AsyncStorage as unknown as { getItem: jest.Mock }).getItem.mockClear();
    (AsyncStorage as unknown as { setItem: jest.Mock }).setItem.mockClear();
  });

  it("loads music and voice volume from AsyncStorage on mount", async () => {
    const mockGetItem = AsyncStorage.getItem as jest.Mock;
    mockGetItem.mockImplementation((key: string) => {
      if (key === "@truco/music-volume") return Promise.resolve("0.5");
      if (key === "@truco/voice-volume") return Promise.resolve("0.25");
      return Promise.resolve(null);
    });

    const { result } = renderHook(() => useSettingsScreen(), { wrapper });

    await waitFor(() => {
      expect(result.current.musicVolume).toBe(0.5);
      expect(result.current.voiceVolume).toBe(0.25);
    });
  });

  it("defaults to 0.75 when no stored volume", async () => {
    const mockGetItem = AsyncStorage.getItem as jest.Mock;
    mockGetItem.mockResolvedValue(null);

    const { result } = renderHook(() => useSettingsScreen(), { wrapper });

    await waitFor(() => {
      expect(result.current.musicVolume).toBe(0.75);
      expect(result.current.voiceVolume).toBe(0.75);
    });
  });

  it("persists music volume to AsyncStorage on change", async () => {
    const mockGetItem = AsyncStorage.getItem as jest.Mock;
    mockGetItem.mockResolvedValue(null);
    const mockSetItem = AsyncStorage.setItem as jest.Mock;

    const { result } = renderHook(() => useSettingsScreen(), { wrapper });

    await waitFor(() => {
      expect(result.current.musicVolume).toBe(0.75);
    });

    act(() => {
      result.current.setMusicVolume(0.5);
    });

    expect(result.current.musicVolume).toBe(0.5);
    expect(mockSetItem).toHaveBeenCalledWith("@truco/music-volume", "0.5");
  });

  it("persists voice volume to AsyncStorage on change", async () => {
    const mockGetItem = AsyncStorage.getItem as jest.Mock;
    mockGetItem.mockResolvedValue(null);
    const mockSetItem = AsyncStorage.setItem as jest.Mock;

    const { result } = renderHook(() => useSettingsScreen(), { wrapper });

    await waitFor(() => {
      expect(result.current.voiceVolume).toBe(0.75);
    });

    act(() => {
      result.current.setVoiceVolume(1);
    });

    expect(result.current.voiceVolume).toBe(1);
    expect(mockSetItem).toHaveBeenCalledWith("@truco/voice-volume", "1");
  });

  it("snaps volume to nearest step (0.25 increments)", async () => {
    const mockGetItem = AsyncStorage.getItem as jest.Mock;
    mockGetItem.mockResolvedValue(null);

    const { result } = renderHook(() => useSettingsScreen(), { wrapper });

    await waitFor(() => {
      expect(result.current.musicVolume).toBe(0.75);
    });

    act(() => {
      result.current.setMusicVolume(0.3);
    });

    expect(result.current.musicVolume).toBe(0.25);
  });

  it("provides volumeSteps array", async () => {
    const { result } = renderHook(() => useSettingsScreen(), { wrapper });

    await waitFor(() => {
      expect(result.current.volumeSteps).toEqual([0, 0.25, 0.5, 0.75, 1]);
    });
  });

  it("provides translations for volume labels", async () => {
    const { result } = renderHook(() => useSettingsScreen(), { wrapper });

    await waitFor(() => {
      expect(result.current.translations.musicVolume).toBeDefined();
      expect(result.current.translations.voiceVolume).toBeDefined();
    });
  });
});

import AsyncStorage from "@react-native-async-storage/async-storage";
import { render, screen, waitFor } from "@testing-library/react-native";
import type { ReactNode } from "react";

import { I18nProvider } from "@/shared/i18n";
import { ThemeProvider } from "@/shared/theme/ThemeProvider";

import { SettingsScreen } from "../SettingsScreen";

// Mock AsyncStorage
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

function wrapper({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <I18nProvider>{children}</I18nProvider>
    </ThemeProvider>
  );
}

describe("SettingsScreen", () => {
  beforeEach(() => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
  });

  it("renders the settings screen", async () => {
    render(<SettingsScreen />, { wrapper });
    await waitFor(() => {
      expect(screen.getByTestId("settings-screen")).toBeTruthy();
    });
  });

  it("renders locale buttons", async () => {
    render(<SettingsScreen />, { wrapper });
    await waitFor(() => {
      expect(screen.getByTestId("settings-locale-es")).toBeTruthy();
      expect(screen.getByTestId("settings-locale-en")).toBeTruthy();
    });
  });

  it("renders music volume controls", async () => {
    render(<SettingsScreen />, { wrapper });
    await waitFor(() => {
      expect(screen.getByTestId("settings-music-volume")).toBeTruthy();
    });
    // Check stepped buttons exist
    expect(screen.getByTestId("settings-music-0")).toBeTruthy();
    expect(screen.getByTestId("settings-music-0.25")).toBeTruthy();
    expect(screen.getByTestId("settings-music-0.5")).toBeTruthy();
    expect(screen.getByTestId("settings-music-0.75")).toBeTruthy();
    expect(screen.getByTestId("settings-music-1")).toBeTruthy();
  });

  it("renders voice volume controls", async () => {
    render(<SettingsScreen />, { wrapper });
    await waitFor(() => {
      expect(screen.getByTestId("settings-voice-volume")).toBeTruthy();
    });
    expect(screen.getByTestId("settings-voice-0")).toBeTruthy();
    expect(screen.getByTestId("settings-voice-0.25")).toBeTruthy();
    expect(screen.getByTestId("settings-voice-0.5")).toBeTruthy();
    expect(screen.getByTestId("settings-voice-0.75")).toBeTruthy();
    expect(screen.getByTestId("settings-voice-1")).toBeTruthy();
  });
});

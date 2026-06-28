import { render, screen, waitFor } from "@testing-library/react-native";
import type { ReactNode } from "react";

import { I18nProvider } from "@/shared/i18n";
import { ThemeProvider } from "@/shared/theme/ThemeProvider";

import { AboutScreen } from "../AboutScreen";

function wrapper({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <I18nProvider>{children}</I18nProvider>
    </ThemeProvider>
  );
}

describe("AboutScreen", () => {
  it("renders the about screen", async () => {
    render(<AboutScreen />, { wrapper });
    await waitFor(() => {
      expect(screen.getByTestId("about-screen")).toBeTruthy();
    });
  });

  it("renders description, tech stack, and demo placeholder", async () => {
    render(<AboutScreen />, { wrapper });
    await waitFor(() => {
      expect(screen.getByTestId("about-description")).toBeTruthy();
      expect(screen.getByTestId("about-tech-stack")).toBeTruthy();
      expect(screen.getByTestId("about-demo-link")).toBeTruthy();
    });
  });
});

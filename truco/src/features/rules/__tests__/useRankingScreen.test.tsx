import { renderHook, waitFor } from "@testing-library/react-native";
import type { ReactNode } from "react";

import { I18nProvider } from "@/shared/i18n";
import { ThemeProvider } from "@/shared/theme/ThemeProvider";

import { useRankingScreen } from "../hooks/useRankingScreen";

function wrapper({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <I18nProvider>{children}</I18nProvider>
    </ThemeProvider>
  );
}

describe("useRankingScreen", () => {
  it("returns exactly 40 cards", async () => {
    const { result } = renderHook(() => useRankingScreen(), { wrapper });
    await waitFor(() => {
      expect(result.current.cards).toHaveLength(40);
    });
  });

  it("first card is espada-4 (highest truco rank per domain)", async () => {
    const { result } = renderHook(() => useRankingScreen(), { wrapper });
    await waitFor(() => {
      expect(result.current.cards.length).toBeGreaterThan(0);
    });
    const first = result.current.cards[0];
    expect(first).toBeDefined();
    expect(first?.suit).toBe("espada");
    expect(first?.rank).toBe(4);
    expect(first?.position).toBe(1);
  });

  it("second card is basto-4", async () => {
    const { result } = renderHook(() => useRankingScreen(), { wrapper });
    await waitFor(() => {
      expect(result.current.cards.length).toBeGreaterThan(1);
    });
    const second = result.current.cards[1];
    expect(second).toBeDefined();
    expect(second?.suit).toBe("basto");
    expect(second?.rank).toBe(4);
  });

  it("third card is espada-7", async () => {
    const { result } = renderHook(() => useRankingScreen(), { wrapper });
    await waitFor(() => {
      expect(result.current.cards.length).toBeGreaterThan(2);
    });
    const third = result.current.cards[2];
    expect(third).toBeDefined();
    expect(third?.suit).toBe("espada");
    expect(third?.rank).toBe(7);
  });

  it("positions are sequential 1..40", async () => {
    const { result } = renderHook(() => useRankingScreen(), { wrapper });
    await waitFor(() => {
      expect(result.current.cards.length).toBe(40);
    });
    for (let i = 0; i < result.current.cards.length; i++) {
      const card = result.current.cards[i];
      expect(card).toBeDefined();
      expect(card?.position).toBe(i + 1);
    }
  });

  it("envido values are correct for face cards (0) and number cards", async () => {
    const { result } = renderHook(() => useRankingScreen(), { wrapper });
    await waitFor(() => {
      expect(result.current.cards.length).toBe(40);
    });
    // Find a face card (rank 12) — envido should be 0
    const king = result.current.cards.find((c) => c.rank === 12);
    expect(king).toBeDefined();
    expect(king?.envidoValue).toBe(0);

    // Find a 7 — envido should be 7
    const seven = result.current.cards.find((c) => c.rank === 7 && c.suit === "copa");
    expect(seven).toBeDefined();
    expect(seven?.envidoValue).toBe(7);
  });

  it("provides translations", async () => {
    const { result } = renderHook(() => useRankingScreen(), { wrapper });
    await waitFor(() => {
      expect(result.current.translations.title).toBeDefined();
      expect(result.current.translations.position).toBeDefined();
      expect(result.current.translations.envidoValue).toBeDefined();
    });
  });
});

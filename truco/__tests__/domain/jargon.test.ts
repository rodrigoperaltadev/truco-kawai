import type { Rank } from "@/domain/deck";
import { jargon } from "@/shared/i18n/jargon";

describe("jargon.ranks", () => {
  it("maps rank 1 to Ancho", () => {
    expect(jargon.ranks[1]).toBe("Ancho");
  });

  it("covers all Rank keys with non-empty strings", () => {
    const allRanks: Rank[] = [1, 2, 3, 4, 5, 6, 7, 10, 11, 12];
    for (const rank of allRanks) {
      const label = jargon.ranks[rank];
      expect(label).toBeDefined();
      expect(label.length).toBeGreaterThan(0);
    }
  });

  it("leaves suits record unchanged", () => {
    expect(jargon.suits.espada).toBe("Espada");
    expect(jargon.suits.basto).toBe("Basto");
    expect(jargon.suits.copa).toBe("Copa");
    expect(jargon.suits.oro).toBe("Oro");
  });
});

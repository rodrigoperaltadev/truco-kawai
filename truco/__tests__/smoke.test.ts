import { jargon } from "@/shared/i18n/jargon";
import { theme } from "@/shared/theme";

describe("Truco Lab smoke", () => {
  it("exposes design tokens", () => {
    expect(theme.colors.background).toBe("#151406");
    expect(theme.spacing.md).toBe(16);
  });

  it("keeps game jargon in Spanish", () => {
    expect(jargon.truco).toBe("Truco");
    expect(jargon.suits.espada).toBe("Espada");
  });
});

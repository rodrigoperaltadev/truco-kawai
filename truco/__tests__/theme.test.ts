import { theme } from "@/shared/theme";

describe("theme tokens", () => {
  it("matches Nocturnal Bodegón background and primary colors", () => {
    expect(theme.colors.background).toBe("#151406");
    expect(theme.colors.primary).toBe("#a1d494");
    expect(theme.colors.tertiary).toBe("#e9c349");
  });

  it("exposes team accent colors for score UI", () => {
    expect(theme.colors.teamNos).toBe("#c62828");
    expect(theme.colors.teamEllos).toBe("#1565c0");
  });

  it("maps typography to loaded font families", () => {
    expect(theme.typography.bodyMd.fontFamily).toBe("HankenGrotesk_400Regular");
    expect(theme.typography.headlineLg.fontFamily).toBe("LibreCaslonText_700Bold");
  });

  it("provides elevation helpers", () => {
    expect(theme.shadows.elevation(2)).toBeDefined();
  });
});

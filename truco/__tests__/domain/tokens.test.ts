import { colors } from "@/shared/theme/colors";

describe("theme.colors.suits", () => {
  it("exposes a non-empty hex color for espada", () => {
    expect(colors.suits.espada).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });

  it("has exactly 4 suit keys", () => {
    expect(Object.keys(colors.suits)).toEqual(["espada", "basto", "copa", "oro"]);
  });

  it("all suit colors are valid hex", () => {
    for (const hex of Object.values(colors.suits)) {
      expect(hex).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });
});

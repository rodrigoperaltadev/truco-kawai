import { resolveBreakpoint } from "@/shared/layout/breakpoints";

describe("resolveBreakpoint", () => {
  it("returns mobile for narrow widths", () => {
    expect(resolveBreakpoint(375)).toBe("mobile");
    expect(resolveBreakpoint(767)).toBe("mobile");
  });

  it("returns tablet for medium widths", () => {
    expect(resolveBreakpoint(768)).toBe("tablet");
    expect(resolveBreakpoint(1023)).toBe("tablet");
  });

  it("returns desktop for wide widths", () => {
    expect(resolveBreakpoint(1024)).toBe("desktop");
    expect(resolveBreakpoint(1440)).toBe("desktop");
  });
});

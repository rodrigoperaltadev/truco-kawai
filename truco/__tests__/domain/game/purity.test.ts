import * as fs from "node:fs";
import * as path from "node:path";

/**
 * Purity guard: src/domain/game/ must only import from src/domain/deck/ or node built-ins.
 * No React, React Native, Expo, features, or shared imports allowed.
 */

const GAME_DIR = path.resolve(__dirname, "../../../src/domain/game");

const FORBIDDEN_IMPORT = /react$|react-native|expo|@\/features|@\/shared/;
const ALLOWED_DOMAIN = /^@\/domain\/deck/;
const RELATIVE_IMPORT = /^\./;

function getGameSourceFiles(): string[] {
  return fs
    .readdirSync(GAME_DIR)
    .filter((f) => f.endsWith(".ts") && !f.endsWith(".test.ts") && !f.endsWith(".d.ts"))
    .map((f) => path.join(GAME_DIR, f));
}

function extractImportPaths(source: string): string[] {
  const paths: string[] = [];
  const importRegex = /import\s+(?:.*?\s+from\s+)?["']([^"']+)["']/g;
  const exportRegex = /export\s+(?:.*?\s+from\s+)["']([^"']+)["']/g;

  for (const match of source.matchAll(importRegex)) {
    const captured = match[1];
    if (captured !== undefined) paths.push(captured);
  }
  for (const match of source.matchAll(exportRegex)) {
    const captured = match[1];
    if (captured !== undefined) paths.push(captured);
  }
  return paths;
}

describe("Domain purity — src/domain/game/", () => {
  const files = getGameSourceFiles();

  it("has source files to scan", () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it.each(files.map((f) => [path.basename(f), f]))(
    "%s has no forbidden imports",
    (_name, filePath) => {
      const source = fs.readFileSync(filePath as string, "utf-8");
      const importPaths = extractImportPaths(source);

      for (const importPath of importPaths) {
        if (RELATIVE_IMPORT.test(importPath)) continue;
        if (ALLOWED_DOMAIN.test(importPath)) continue;

        expect(importPath).not.toMatch(FORBIDDEN_IMPORT);

        if (importPath.startsWith("@/")) {
          expect(importPath).toMatch(ALLOWED_DOMAIN);
        }
      }
    },
  );

  it("does not import react, react-native, or expo in any game file", () => {
    for (const filePath of files) {
      const source = fs.readFileSync(filePath, "utf-8");
      const importPaths = extractImportPaths(source);

      for (const importPath of importPaths) {
        expect(importPath).not.toMatch(/^react$/);
        expect(importPath).not.toMatch(/^react-native$/);
        expect(importPath).not.toMatch(/^expo$/);
        expect(importPath).not.toMatch(/^@expo\//);
      }
    }
  });

  it("does not import from @/features or @/shared in any game file", () => {
    for (const filePath of files) {
      const source = fs.readFileSync(filePath, "utf-8");
      const importPaths = extractImportPaths(source);

      for (const importPath of importPaths) {
        expect(importPath).not.toMatch(/^@\/features/);
        expect(importPath).not.toMatch(/^@\/shared/);
      }
    }
  });
});

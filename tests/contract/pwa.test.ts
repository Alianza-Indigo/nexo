import { describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
describe("contrato PWA", () => {
  it("mantiene el fallback offline honesto", async () => { const sw = await readFile("public/sw.js", "utf8"); expect(sw).toContain("/offline"); const offline = await readFile("src/app/offline/page.tsx", "utf8"); expect(offline).toContain("NEXO no puede analizar"); expect(offline).toContain("tel:911"); });
  it("no cachea rutas API", async () => expect(await readFile("public/sw.js", "utf8")).toContain('url.pathname.startsWith("/api/")'));
});

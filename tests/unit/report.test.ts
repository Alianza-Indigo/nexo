import { describe, expect, it } from "vitest";
import { buildReport, SOAP_DISCLAIMER } from "@/domain/postcrisis/report";
describe("documentos postcrisis", () => {
  it("incluye la leyenda SOAP indeleble", () => expect(buildReport("SOAP_DRAFT", { title: "Prueba" }).disclaimer).toBe(SOAP_DISCLAIMER));
  it("marca hipótesis y no inventa datos", () => { const report = buildReport("CRISIS_SHEET", { title: "Hoja", possibleFactors: "cansancio" }); expect(report.sections.find((x) => x.heading.includes("Hipótesis"))?.body).toContain("no confirmado"); expect(JSON.stringify(report)).not.toContain("diagnóstico confirmado"); });
});

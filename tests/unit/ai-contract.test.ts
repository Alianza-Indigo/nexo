import { describe, expect, it } from "vitest";
import { aiTurnSchema, createAIProvider } from "@/infrastructure/ai/provider";
describe("contrato de IA", () => {
  it("rechaza texto libre o estructuras incompletas", () => expect(() => aiTurnSchema.parse({ intent: "crisis_active" })).toThrow());
  it("rechaza una intención fuera del contrato", () => expect(() => aiTurnSchema.parse({ intent: "diagnosis" })).toThrow());
  it("fija Gemini 3.1 Flash-Lite como modelo productivo", () => expect(createAIProvider("gemini", "test-key").model).toBe("gemini-3.1-flash-lite"));
});

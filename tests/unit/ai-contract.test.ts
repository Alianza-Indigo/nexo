import { describe, expect, it } from "vitest";
import { aiTurnSchema } from "@/infrastructure/ai/provider";
describe("contrato de IA", () => {
  it("rechaza texto libre o estructuras incompletas", () => expect(() => aiTurnSchema.parse({ intent: "crisis_active" })).toThrow());
  it("rechaza una intención fuera del contrato", () => expect(() => aiTurnSchema.parse({ intent: "diagnosis" })).toThrow());
});

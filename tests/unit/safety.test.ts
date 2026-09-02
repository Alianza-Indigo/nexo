import { describe, expect, it } from "vitest";
import { containsProhibitedInstruction, evaluateSafety, normalizeAnswer } from "@/domain/safety/engine";

describe("motor de seguridad", () => {
  it("eleva una respuesta no sé a crítica", () => expect(evaluateSafety("", "unknown").level).toBe("CRITICAL"));
  it("detecta dificultad respiratoria", () => expect(evaluateSafety("No respira").flags).toContain("breathing_problem"));
  it("respeta negación explícita de arma", () => expect(evaluateSafety("No tiene un cuchillo").flags).not.toContain("weapon_or_dangerous_object"));
  it("distingue riesgo suicida histórico del intento actual", () => { expect(evaluateSafety("Ayer dijo que quería morirse").level).toBe("URGENT"); expect(evaluateSafety("Lo está intentando ahora").level).toBe("CRITICAL"); });
  it("marca audio crítico incierto", () => expect(evaluateSafety("creo que dijo cuchillo", undefined, true).flags).toContain("transcript_uncertain"));
  it("normaliza respuestas breves", () => { expect(normalizeAnswer("Sí")).toBe("yes"); expect(normalizeAnswer("No sé")).toBe("unknown"); expect(normalizeAnswer("Alto")).toBe("pause"); });
  it("rechaza instrucciones de restricción o dosis", () => { expect(containsProhibitedInstruction("Sujeta sus brazos")).toBe(true); expect(containsProhibitedInstruction("Aumenta la dosis")).toBe(true); expect(containsProhibitedInstruction("Baja el ruido")).toBe(false); });
});

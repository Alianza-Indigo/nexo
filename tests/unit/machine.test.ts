import { describe, expect, it } from "vitest";
import { initialTurn, processTurn } from "@/domain/crisis-machine/machine";
import { containsProhibitedInstruction } from "@/domain/safety/engine";

describe("máquina de crisis", () => {
  it("inicia siempre por peligro", () => { const turn = initialTurn(); expect(turn.state).toBe("DANGER_TRIAGE"); expect(turn.expected).toBe("yes_no_unknown"); });
  it("muestra 911 antes de pedir edad", () => { const turn = processTurn({ state: "DANGER_TRIAGE", answer: "No sé" }); expect(turn.state).toBe("EMERGENCY_ESCALATED"); expect(turn.showEmergencyCall).toBe(true); expect(turn.writtenText).toContain("nueve uno uno"); });
  it("envía al filtro médico después de descartar peligro", () => expect(processTurn({ state: "DANGER_TRIAGE", answer: "No" }).state).toBe("MEDICAL_FILTER"));
  it("da una acción inmediata después de descartar urgencia médica", () => { const turn = processTurn({ state: "MEDICAL_FILTER", answer: "No" }); expect(turn.state).toBe("INTERVENTION_DEMANDS"); expect(turn.expected).toBe("ready"); expect(turn.writtenText).not.toContain("?"); });
  it("revalora antes de ofrecer otra acción", () => { const turn = processTurn({ state: "INTERVENTION_DEMANDS", answer: "Listo" }); expect(turn.state).toBe("REASSESSMENT"); expect(turn.expected).toBe("trend"); });
  it("pide contexto solo cuando la primera acción no mejora la situación", () => { const turn = processTurn({ state: "REASSESSMENT", answer: "Igual" }); expect(turn.state).toBe("OBSERVABLE_BEHAVIOR"); expect(turn.writtenText).toContain("sigue ocurriendo"); });
  it("usa una intervención segura recomendada para la conducta descrita", () => { const turn = processTurn({ state: "OBSERVABLE_BEHAVIOR", text: "Sigue gritando en un lugar público", context: { environment: "public" }, recommendedInterventionId: "environment-reduce-audience" }); expect(turn.interventionId).toBe("environment-reduce-audience"); expect(turn.writtenText).toContain("otras personas"); });
  it("impide conversar mientras conduce", () => { const turn = processTurn({ state: "DRIVING_CHECK", answer: "Sí", context: { environment: "car" } }); expect(turn.state).toBe("DRIVING_CHECK"); expect(turn.writtenText).toContain("No sigas hablando"); });
  it("peor interrumpe y vuelve a triaje", () => expect(processTurn({ state: "REASSESSMENT", answer: "Peor" }).state).toBe("DANGER_TRIAGE"));
  it("una nueva señal crítica interrumpe cualquier estado", () => expect(processTurn({ state: "POSTCRISIS_TIMELINE", text: "No respira" }).state).toBe("EMERGENCY_ESCALATED"));
  it("pausa y reingresa por seguridad", () => { const paused = processTurn({ state: "INTERVENTION_DEMANDS", answer: "Alto" }); expect(paused.state).toBe("PAUSED"); expect(processTurn({ state: "PAUSED", answer: "Seguir" }).state).toBe("REENTRY_SAFETY_CHECK"); });
  it("solo llega a reporte desde postcrisis", () => expect(processTurn({ state: "POSTCRISIS_REPORT_OFFER", answer: "Borrador SOAP" }).state).toBe("REPORT_DRAFT"));
  it("ninguna salida base contiene instrucciones prohibidas", () => { const states = [initialTurn(), processTurn({ state: "KNOWN_SUPPORT", answer: "No" }), processTurn({ state: "INTERVENTION_ENVIRONMENT", answer: "Listo" }), processTurn({ state: "INTERVENTION_DEMANDS", answer: "Listo" })]; expect(states.every((x) => !containsProhibitedInstruction(x.writtenText))).toBe(true); });
});

export const SOAP_DISCLAIMER = "Borrador generado a partir del relato del cuidador. No constituye valoración, diagnóstico ni nota clínica y debe ser revisado por un profesional.";

export type ReportPayload = {
  title: string; approximateDate?: string; environment?: string; priorContext?: string;
  observableSignals?: string; observableBehavior?: string; environmentResponse?: string;
  strategies?: string; acceptance?: string; describedOutcome?: string; injuries?: string;
  possibleFactors?: string; prevention?: string; professionalReview?: string;
};

export function buildReport(type: "CRISIS_SHEET" | "SOAP_DRAFT", payload: ReportPayload) {
  if (type === "SOAP_DRAFT") {
    return {
      title: payload.title || "Borrador SOAP",
      disclaimer: SOAP_DISCLAIMER,
      sections: [
        { heading: "Subjetivo", body: payload.priorContext || "Sin información proporcionada." },
        { heading: "Objetivo", body: `Conductas descritas por el cuidador: ${payload.observableBehavior || "sin información"}. Señales descritas: ${payload.observableSignals || "sin información"}.` },
        { heading: "Evaluación — hipótesis, no diagnóstico", body: payload.possibleFactors ? `Una posibilidad por revisar es: ${payload.possibleFactors}` : "No se formularon hipótesis." },
        { heading: "Plan", body: `Acciones relatadas: ${payload.strategies || "sin información"}. Para revisar con profesional: ${payload.professionalReview || payload.prevention || "sin información"}.` }
      ]
    };
  }
  return {
    title: payload.title || "Hoja de Crisis",
    disclaimer: "Documento descriptivo elaborado a partir del relato del cuidador. No constituye diagnóstico ni valoración clínica.",
    sections: [
      { heading: "Fecha y entorno", body: `${payload.approximateDate || "No indicada"} · ${payload.environment || "No indicado"}` },
      { heading: "Hechos descritos", body: `Contexto previo: ${payload.priorContext || "sin información"}. Señales y conductas observables: ${payload.observableSignals || "sin información"}; ${payload.observableBehavior || "sin información"}.` },
      { heading: "Respuesta y resultado", body: `Respuesta del entorno: ${payload.environmentResponse || "sin información"}. Estrategias ofrecidas: ${payload.strategies || "sin información"}. Aceptación o rechazo: ${payload.acceptance || "sin información"}. Resultado relatado: ${payload.describedOutcome || "sin información"}.` },
      { heading: "Salud y seguridad", body: payload.injuries || "No se proporcionó información sobre lesiones o síntomas." },
      { heading: "Hipótesis por revisar", body: payload.possibleFactors ? `Posible factor, no confirmado: ${payload.possibleFactors}` : "No se formularon hipótesis." },
      { heading: "Próximo paso", body: `${payload.prevention || "Sin estrategia definida"}. Para revisar con profesional: ${payload.professionalReview || "sin asuntos indicados"}.` }
    ]
  };
}

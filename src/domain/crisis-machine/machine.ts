import { evaluateSafety, normalizeAnswer } from "../safety/engine";
import { selectIntervention } from "../interventions/catalog";
import type { CrisisContext, ExpectedAnswer, RiskLevel, TurnInput, TurnOutput } from "./types";

const EMERGENCY = "Llama al nueve uno uno ahora. Pon el teléfono en altavoz si puedes y sigue sus instrucciones. No te pongas en riesgo.";

const options: Record<ExpectedAnswer, string[]> = {
  yes_no_unknown: ["Sí", "No", "No sé"], yes_no: ["Sí", "No"], ready: ["Listo", "No puedo"],
  trend: ["Mejor", "Igual", "Peor"], age_band: ["2 a 4", "5 a 8", "9 a 12", "13 a 17"],
  environment: ["Casa", "Lugar público", "Auto"], scale: ["0–3", "4–7", "8–10"],
  free_short: [], continue_pause: ["Seguir", "Pausar"], report_type: ["Hoja de Crisis", "Borrador SOAP"], none: []
};

function output(
  state: TurnOutput["state"], context: CrisisContext, risk: TurnOutput["risk"], writtenText: string,
  expected: ExpectedAnswer, config: Partial<TurnOutput> = {}
): TurnOutput {
  return {
    state, context, risk, writtenText, audioText: writtenText, speak: true, expected,
    options: options[expected], showEmergencyCall: risk.level === "CRITICAL" || state.startsWith("EMERGENCY"),
    allowPause: state !== "EMERGENCY_ESCALATED", ...config
  };
}

function risk(level: RiskLevel = "MANAGEABLE"): TurnOutput["risk"] {
  return { level, flags: [], uncertain: false, evidenceCategories: [] };
}

function mapAge(text: string): CrisisContext["ageBand"] {
  if (/2\s*(a|-|–)\s*4/.test(text)) return "2-4";
  if (/5\s*(a|-|–)\s*8/.test(text)) return "5-8";
  if (/9\s*(a|-|–)\s*12/.test(text)) return "9-12";
  return "13-17";
}

export function initialTurn(): TurnOutput {
  return output("DANGER_TRIAGE", {}, risk("ELEVATED"), "Estoy contigo. Vamos de uno en uno. ¿Hay peligro inmediato de que alguien se lastime? Sí, no o no sé.", "yes_no_unknown", { showEmergencyCall: true });
}

export function processTurn(input: TurnInput): TurnOutput {
  const context = { ...(input.context ?? {}) };
  const raw = (input.answer ?? input.text ?? "").trim();
  const answer = normalizeAnswer(raw);
  const detected = evaluateSafety(raw, input.state === "DANGER_TRIAGE" || input.state === "REENTRY_SAFETY_CHECK" ? answer : undefined, input.transcriptUncertain);

  if (answer === "pause" && detected.level !== "CRITICAL") {
    return output("PAUSED", { ...context, pausedFrom: input.state }, detected, "Pausamos aquí. Cuando quieras continuar, elige Seguir.", "continue_pause", { speak: false });
  }
  if (input.state !== "DANGER_TRIAGE" && detected.level === "CRITICAL") {
    return output("EMERGENCY_ESCALATED", context, detected, EMERGENCY, "none", { allowPause: false });
  }
  if (input.transcriptUncertain && detected.flags.includes("transcript_uncertain")) {
    return output("DANGER_TRIAGE", context, detected, "No entendí esa parte. Respóndeme solo sí, no o no sé: ¿hay peligro inmediato?", "yes_no_unknown", { showEmergencyCall: true });
  }

  switch (input.state) {
    case "DANGER_TRIAGE":
    case "REENTRY_SAFETY_CHECK":
      if (answer === "yes" || answer === "unknown") return output("EMERGENCY_ESCALATED", context, detected, EMERGENCY, "none", { allowPause: false });
      if (answer === "no") return output("MEDICAL_FILTER", context, risk(), "¿Hay algo médico fuera de lo habitual, como dolor intenso, golpe, fiebre, intoxicación, convulsión o dificultad para respirar? Sí o no.", "yes_no");
      return output("DANGER_TRIAGE", context, risk("ELEVATED"), "Respóndeme solo sí, no o no sé: ¿hay peligro inmediato?", "yes_no_unknown");
    case "EMERGENCY_ESCALATED":
    case "EMERGENCY_WAITING_CONFIRMATION":
      if (answer === "called") return output("EMERGENCY_WAITING_CONFIRMATION", context, risk("CRITICAL"), "Sigue las instrucciones del operador del nueve uno uno por encima de cualquier indicación de NEXO.", "none", { allowPause: true });
      return output("EMERGENCY_ESCALATED", context, risk("CRITICAL"), EMERGENCY, "none", { allowPause: false });
    case "MEDICAL_FILTER":
      if (answer === "yes") return output("SYSTEM_FALLBACK", context, risk("URGENT"), "Busca valoración médica urgente. Si hay dificultad para respirar, alteración de conciencia, lesión grave o empeora rápido, llama al nueve uno uno.", "continue_pause", { showEmergencyCall: true });
      if (answer === "no") return output("AGE_CONTEXT", context, risk(), "¿Qué rango de edad tiene?", "age_band");
      return output("MEDICAL_FILTER", context, risk("ELEVATED"), "Necesito confirmarlo: ¿hay algo médico fuera de lo habitual? Sí o no.", "yes_no");
    case "SYSTEM_FALLBACK":
      if (answer === "continue") return output("DANGER_TRIAGE", context, risk("ELEVATED"), "Antes de continuar: ¿hay peligro inmediato? Sí, no o no sé.", "yes_no_unknown", { showEmergencyCall: true });
      return output("PAUSED", { ...context, pausedFrom: input.state }, risk("URGENT"), "Pausamos aquí. Busca apoyo humano si algo empeora.", "continue_pause");
    case "AGE_CONTEXT":
      context.ageBand = mapAge(raw);
      return output("ENVIRONMENT_CONTEXT", context, risk(), "¿Dónde están?", "environment");
    case "ENVIRONMENT_CONTEXT":
      context.environment = /auto|carro|coche/i.test(raw) ? "car" : /públic|public/i.test(raw) ? "public" : "home";
      if (context.environment === "car") return output("DRIVING_CHECK", context, risk("ELEVATED"), "¿Estás conduciendo ahora? Sí o no.", "yes_no");
      return output("OBSERVABLE_BEHAVIOR", context, risk(), "Dime en pocas palabras qué está haciendo ahora.", "free_short");
    case "DRIVING_CHECK":
      context.driving = answer === "yes";
      if (context.driving) return output("DRIVING_CHECK", context, { level: "URGENT", flags: ["driving"], uncertain: false, evidenceCategories: ["driving"] }, "No sigas hablando conmigo mientras conduces. Oríllate en un lugar seguro, detén el auto y dime ‘listo’.", "ready", { speak: true });
      return output("OBSERVABLE_BEHAVIOR", context, risk(), "Dime en pocas palabras qué está haciendo ahora.", "free_short");
    case "OBSERVABLE_BEHAVIOR":
      context.behavior = raw.slice(0, 500);
      return output("PRECEDING_EVENT", context, detected, "¿Qué pasó justo antes?", "free_short");
    case "PRECEDING_EVENT":
      context.precedingEvent = raw.slice(0, 500);
      return output("KNOWN_SUPPORT", context, risk(), "¿Hay algo que normalmente le ayuda y que acepta?", "free_short");
    case "KNOWN_SUPPORT": {
      context.knownSupport = answer === "no" ? undefined : raw.slice(0, 300);
      const intervention = selectIntervention("environment", context);
      context.lastInterventionId = intervention.id;
      return output("INTERVENTION_ENVIRONMENT", context, risk(), intervention.text, "ready", { interventionId: intervention.id });
    }
    case "INTERVENTION_ENVIRONMENT": {
      if (answer === "cannot") return output("CAREGIVER_ESCALATION", context, risk("URGENT"), "No la fuerces. ¿Puedes alejar el peligro o necesitas ayuda de otro adulto?", "free_short");
      const intervention = selectIntervention("demands", context);
      context.lastInterventionId = intervention.id;
      return output("INTERVENTION_DEMANDS", context, risk(), intervention.text, "ready", { interventionId: intervention.id });
    }
    case "INTERVENTION_DEMANDS": {
      if (answer === "cannot") return output("REASSESSMENT", context, risk(), "Está bien. No la fuerces. ¿Está mejor, igual o peor?", "trend");
      const intervention = selectIntervention("regulation", context);
      context.lastInterventionId = intervention.id;
      return output("INTERVENTION_REGULATION", context, risk(), intervention.text, "ready", { interventionId: intervention.id });
    }
    case "INTERVENTION_REGULATION":
      return output("REASSESSMENT", context, risk(), "¿Está mejor, igual o peor?", "trend");
    case "REASSESSMENT":
      if (answer === "worse") return output("DANGER_TRIAGE", context, risk("ELEVATED"), "¿Hay peligro inmediato de que alguien se lastime? Sí, no o no sé.", "yes_no_unknown", { showEmergencyCall: true });
      if (answer === "better") return output("STABILITY_CHECK", context, risk(), "¿La respiración y su forma de responder son las habituales? Sí o no.", "yes_no");
      if (answer === "same") return output("CAREGIVER_CHECK", context, risk(), "Del cero al diez, ¿qué tan rebasado te sientes, donde diez significa al límite?", "scale");
      return output("REASSESSMENT", context, risk("ELEVATED"), "Necesito confirmarlo: ¿está mejor, igual o peor?", "trend");
    case "CAREGIVER_CHECK": {
      const numeric = Number(raw.match(/\d+/)?.[0] ?? (raw.includes("8") ? 8 : 5));
      context.caregiverLoad = numeric;
      if (numeric >= 8) return output("CAREGIVER_ESCALATION", context, risk("URGENT"), "Baja los hombros, suelta la mandíbula y haz una exhalación lenta si te resulta tolerable.", "ready");
      const intervention = selectIntervention("demands", context);
      context.lastInterventionId = intervention.id;
      return output("INTERVENTION_DEMANDS", context, risk(), intervention.text, "ready", { interventionId: intervention.id });
    }
    case "CAREGIVER_ESCALATION":
      return output("REASSESSMENT", context, risk("URGENT"), "Pide relevo a otro adulto de confianza si puedes. ¿Está mejor, igual o peor?", "trend");
    case "STABILITY_CHECK":
      if (answer === "yes") return output("STABLE", context, risk("STABLE"), "Por ahora está más estable. Mantén pocas demandas y déjale recuperarse. ¿Quieres que sigamos o prefieres pausar?", "continue_pause");
      return output("MEDICAL_FILTER", context, risk("URGENT"), "Busca valoración médica. ¿Hay dificultad para respirar, lesión grave o alteración de conciencia? Sí o no.", "yes_no", { showEmergencyCall: true });
    case "STABLE":
      if (answer === "continue") return output("POSTCRISIS_INJURY_CHECK", context, risk("STABLE"), "Antes de analizarlo, ¿alguien quedó lesionado o tiene dolor fuera de lo habitual? Sí o no.", "yes_no");
      return output("PAUSED", { ...context, pausedFrom: "STABLE" }, risk("STABLE"), "Pausamos aquí. Mantén pocas demandas y busca ayuda si vuelve a empeorar.", "continue_pause", { speak: false });
    case "PAUSED":
      if (answer === "continue") return output("REENTRY_SAFETY_CHECK", context, risk("ELEVATED"), "Antes de continuar: ¿hay peligro inmediato? Sí, no o no sé.", "yes_no_unknown", { showEmergencyCall: true });
      return output("PAUSED", context, risk(), "Pausamos aquí. Cuando quieras continuar, elige Seguir.", "continue_pause", { speak: false });
    case "POSTCRISIS_INJURY_CHECK":
      if (answer === "yes") return output("SYSTEM_FALLBACK", context, risk("URGENT"), "Prioriza una valoración médica. Si hay una lesión grave o empeora rápido, llama al nueve uno uno.", "continue_pause", { showEmergencyCall: true });
      return output("POSTCRISIS_RECOVERY", context, risk("STABLE"), "Fue una situación intensa. Antes de revisarla, ¿necesitas un minuto para recuperarte?", "yes_no");
    case "POSTCRISIS_RECOVERY":
      return output("POSTCRISIS_TIMELINE", context, risk("STABLE"), "Cuando estés listo, describe brevemente qué ocurrió antes, durante y después.", "free_short");
    case "POSTCRISIS_TIMELINE":
      context.postcrisis = { ...(context.postcrisis ?? {}), timeline: raw.slice(0, 1500) };
      return output("POSTCRISIS_ICEBERG", context, risk("STABLE"), "¿Había hambre, cansancio, dolor, cambios de rutina o sobrecarga de estímulos?", "free_short");
    case "POSTCRISIS_ICEBERG":
      context.postcrisis = { ...(context.postcrisis ?? {}), possibleFactors: raw.slice(0, 1000) };
      return output("POSTCRISIS_FACTORS", context, risk("STABLE"), "¿Qué pareció ayudar y qué pareció empeorar la situación?", "free_short");
    case "POSTCRISIS_FACTORS":
      context.postcrisis = { ...(context.postcrisis ?? {}), outcomes: raw.slice(0, 1000) };
      return output("POSTCRISIS_PREVENTION", context, risk("STABLE"), "Elige una prevención para revisar: aviso previo, elección limitada, pausa o ajuste ambiental.", "free_short");
    case "POSTCRISIS_PREVENTION":
      context.postcrisis = { ...(context.postcrisis ?? {}), prevention: raw.slice(0, 500) };
      return output("POSTCRISIS_KIT", context, risk("STABLE"), "Menciona hasta tres apoyos familiares, seguros y aceptados que podrían integrar su kit.", "free_short");
    case "POSTCRISIS_KIT":
      context.postcrisis = { ...(context.postcrisis ?? {}), kit: raw.slice(0, 500) };
      return output("POSTCRISIS_REPORT_OFFER", context, risk("STABLE"), "¿Quieres preparar una Hoja de Crisis o un borrador SOAP para revisión profesional?", "report_type");
    case "POSTCRISIS_REPORT_OFFER":
      if (answer === "crisis_sheet" || answer === "soap") return output("REPORT_DRAFT", { ...context, postcrisis: { ...(context.postcrisis ?? {}), reportType: answer } }, risk("STABLE"), "Prepararé un borrador editable únicamente con la información que proporcionaste.", "none", { speak: false });
      return output("CLOSED", context, risk("STABLE"), "Por ahora la situación está más estable según lo que me cuentas. Busca ayuda profesional si vuelve a empeorar.", "none");
    default:
      return initialTurn();
  }
}

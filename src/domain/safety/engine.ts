import type { NormalizedAnswer, SafetyResult } from "../crisis-machine/types";

type Rule = { flag: string; level: SafetyResult["level"]; phrases: RegExp[]; category: string };

const CRITICAL_RULES: Rule[] = [
  { flag: "breathing_problem", level: "CRITICAL", category: "medical", phrases: [/\bno\s+respira\b/i, /\bse\s+asfixia\b/i, /\bdificultad\s+(grave|importante)?\s*para\s+respirar\b/i] },
  { flag: "unconscious_or_unresponsive", level: "CRITICAL", category: "medical", phrases: [/\binconsciente\b/i, /\bse\s+desmay[oó]/i, /\bno\s+responde\b/i] },
  { flag: "new_or_prolonged_seizure", level: "CRITICAL", category: "medical", phrases: [/\bconvulsi[oó]n\b/i] },
  { flag: "heavy_bleeding", level: "CRITICAL", category: "medical", phrases: [/\bsangrado\s+(abundante|fuerte)\b/i] },
  { flag: "head_injury", level: "CRITICAL", category: "medical", phrases: [/\bgolpe\s+(fuerte\s+)?(en\s+)?la\s+cabeza\b/i, /\bse\s+golpe[oó]\s+fuerte\s+(en\s+)?la\s+cabeza/i] },
  { flag: "poisoning_or_overdose", level: "CRITICAL", category: "medical", phrases: [/\b(sobredosis|intoxicaci[oó]n)\b/i, /\b(tom[oó]|trag[oó])\s+(pastillas|medicamentos)\b/i] },
  { flag: "traffic_water_height_fire", level: "CRITICAL", category: "environment", phrases: [/\b(calle|tr[aá]fico|agua|altura|fuego)\b.*\bpeligro\b/i, /\bcorri[oó]\s+a\s+la\s+calle\b/i] },
  { flag: "weapon_or_dangerous_object", level: "CRITICAL", category: "weapon", phrases: [/\btiene\s+(un|una|el|la)?\s*(arma|cuchillo|pistola|cuerda)\b/i, /\bcon\s+(un|una)\s+(arma|cuchillo|pistola)\b/i] },
  { flag: "imminent_suicide", level: "CRITICAL", category: "suicide", phrases: [/\b(lo|se)\s+est[aá]\s+intentando\s+(ahora|matar)\b/i, /\bquiere\s+(matarse|suicidarse)\s+ahora\b/i, /\bse\s+(ahorca|est[aá]\s+ahorcando)\b/i] },
  { flag: "self_injury_severe", level: "CRITICAL", category: "injury", phrases: [/\bse\s+(golpea|corta|lastima)\s+(muy\s+)?fuerte\b/i, /\bse\s+est[aá]\s+(golpeando|cortando|lastimando)\s+(muy\s+)?fuerte/i] },
  { flag: "aggression_uncontained", level: "CRITICAL", category: "aggression", phrases: [/\bno\s+(puedo|podemos)\s+mantener\s+la\s+seguridad\b/i, /\best[aá]\s+atacando\b/i] },
  { flag: "missing_or_elopement", level: "CRITICAL", category: "missing", phrases: [/\bse\s+perdi[oó]/i, /\bno\s+(lo|la)\s+encuentro\b/i, /\bsali[oó]\s+corriendo/i] },
  { flag: "caregiver_loss_of_control", level: "CRITICAL", category: "caregiver", phrases: [/\b(voy|puedo)\s+a\s+pegarle\b/i, /\bvoy\s+a\s+perder\s+el\s+control\b/i] },
  { flag: "unknown_immediate_danger", level: "CRITICAL", category: "uncertainty", phrases: [/\bno\s+s[eé]\s+si\s+hay\s+peligro/i] },
  { flag: "abuse_immediate", level: "CRITICAL", category: "abuse", phrases: [/\blo\s+est[aá](n)?\s+(golpeando|abusando)\b/i] }
];

const URGENT_RULES: Rule[] = [
  { flag: "imminent_suicide", level: "URGENT", category: "suicide", phrases: [/\b(quiere|quer[ií]a)\s+morirse\b/i, /\bpensamientos?\s+suicidas?\b/i] },
  { flag: "unusual_medical_symptom", level: "URGENT", category: "medical", phrases: [/\brespira\s+(raro|extraño|mal)\b/i, /\bdolor\s+intenso\b/i, /\bfiebre\s+(muy\s+)?alta\b/i] },
  { flag: "abuse_non_immediate", level: "URGENT", category: "abuse", phrases: [/\b(abuso|negligencia|maltrato)\b/i] }
];

const negatedWeapon = /\b(no\s+tiene|sin|no\s+hay)\b.{0,24}\b(arma|cuchillo|pistola|cuerda)\b/i;
const historicOnly = /\b(ayer|la\s+semana\s+pasada|antes)\b/i;

export function normalizeAnswer(value = ""): NormalizedAnswer {
  const text = value.trim().toLocaleLowerCase("es-MX");
  if (["sí", "si", "yes"].includes(text)) return "yes";
  if (["no"].includes(text)) return "no";
  if (["no sé", "no se", "nose", "unknown"].includes(text)) return "unknown";
  if (["listo", "hecho", "ya", "ready"].includes(text)) return "ready";
  if (["mejor", "better"].includes(text)) return "better";
  if (["igual", "same"].includes(text)) return "same";
  if (["peor", "empeoró", "empeoro", "worse"].includes(text)) return "worse";
  if (["no puedo", "cannot"].includes(text)) return "cannot";
  if (["alto", "espera", "pausar", "pause"].includes(text) || /^(alto|espera)\b/.test(text)) return "pause";
  if (["seguir", "continuar", "continue"].includes(text)) return "continue";
  if (["llamé", "llame", "llamamos", "called"].includes(text)) return "called";
  if (text.includes("soap")) return "soap";
  if (text.includes("hoja")) return "crisis_sheet";
  return "other";
}

export function evaluateSafety(text = "", structuredDanger?: NormalizedAnswer, transcriptUncertain = false): SafetyResult {
  const flags = new Set<string>();
  const categories = new Set<string>();
  let level: SafetyResult["level"] = "MANAGEABLE";
  let uncertain = transcriptUncertain;

  if (structuredDanger === "yes" || structuredDanger === "unknown") {
    flags.add(structuredDanger === "unknown" ? "unknown_immediate_danger" : "danger_confirmed");
    categories.add("structured_answer");
    level = "CRITICAL";
    uncertain = structuredDanger === "unknown";
  }

  for (const rule of [...CRITICAL_RULES, ...URGENT_RULES]) {
    if (rule.flag === "weapon_or_dangerous_object" && negatedWeapon.test(text)) continue;
    if (rule.flag === "imminent_suicide" && historicOnly.test(text) && rule.level === "CRITICAL") continue;
    if (!rule.phrases.some((pattern) => pattern.test(text))) continue;
    flags.add(rule.flag);
    categories.add(rule.category);
    if (rule.level === "CRITICAL") level = "CRITICAL";
    else if (level !== "CRITICAL") level = "URGENT";
  }

  if (transcriptUncertain && /\b(respira|sangre|cuchillo|pastillas|ventana|calle|arma|ahorca|convulsi[oó]n|perdi[oó])\b/i.test(text)) {
    flags.add("transcript_uncertain");
    categories.add("uncertain_audio");
    level = level === "MANAGEABLE" ? "ELEVATED" : level;
  }

  return { level, flags: [...flags], uncertain, evidenceCategories: [...categories] };
}

export function containsProhibitedInstruction(text: string): boolean {
  const prohibited = [
    /\b(sujeta|inmoviliza|amarra|enci[eé]rralo|boca abajo)\b/i,
    /\bpresi[oó]n\b.{0,24}\b(cuello|pecho|espalda|abdomen)\b/i,
    /\b(aumenta|reduce|cambia|duplica|suspende)\b.{0,20}\b(dosis|medicamento)\b/i,
    /\b(fuerza|obliga)\b.{0,20}\b(contacto|abrazo|mirada|respirar|hablar)\b/i,
    /\b(castiga|amenaza|humilla|grita)\b/i
  ];
  return prohibited.some((pattern) => pattern.test(text));
}

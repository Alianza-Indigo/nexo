export interface Intervention {
  id: string;
  category: string;
  text: string;
  constraints: { environments?: string[]; requiresKnownSupport?: boolean; maxRisk: string; contraindications?: string[] };
}

export const INTERVENTIONS: Intervention[] = [
  { id: "environment-remove-danger", category: "environment", text: "Aleja los objetos duros o peligrosos sin forcejear. Dime ‘listo’.", constraints: { maxRisk: "MANAGEABLE" } },
  { id: "environment-reduce-audience", category: "environment", text: "Pide a otras personas que se alejen y deja espacio, sin acorralarlo. Dime ‘listo’.", constraints: { environments: ["public", "home"], maxRisk: "MANAGEABLE" } },
  { id: "environment-soft-barrier", category: "environment", text: "Coloca una barrera blanda entre su cabeza y la superficie, sin sujetar su cuerpo. Dime ‘listo’.", constraints: { maxRisk: "ELEVATED", contraindications: ["weapon"] } },
  { id: "demands-reduce-stimuli", category: "demands", text: "Baja el ruido y deja de hacer preguntas por ahora. Quédate cerca y disponible. Dime ‘listo’.", constraints: { maxRisk: "MANAGEABLE" } },
  { id: "demands-allow-silence", category: "demands", text: "Suspende las demandas y permite silencio. Mantén disponible su forma de comunicación. Dime ‘listo’.", constraints: { maxRisk: "MANAGEABLE" } },
  { id: "regulation-known-support", category: "regulation", text: "Ofrécele el apoyo conocido que suele aceptar. Si lo rechaza, retíralo sin insistir. Dime ‘listo’.", constraints: { requiresKnownSupport: true, maxRisk: "MANAGEABLE" } },
  { id: "regulation-space", category: "regulation", text: "Ofrécele un espacio con menos luz y ruido, sin obligarlo a moverse. Dime ‘listo’.", constraints: { maxRisk: "MANAGEABLE" } },
  { id: "caregiver-relief", category: "caregiver", text: "Baja los hombros, suelta la mandíbula y haz una exhalación lenta si te resulta tolerable.", constraints: { maxRisk: "MANAGEABLE" } },
  { id: "stability-maintain", category: "stability", text: "Mantén el ambiente tranquilo y evita añadir demandas por ahora.", constraints: { maxRisk: "STABLE" } }
];

export function selectIntervention(category: string, context: { environment?: string; knownSupport?: string; lastInterventionId?: string }): Intervention {
  const eligible = INTERVENTIONS.filter((item) =>
    item.category === category &&
    item.id !== context.lastInterventionId &&
    (!item.constraints.environments || (!!context.environment && item.constraints.environments.includes(context.environment))) &&
    (!item.constraints.requiresKnownSupport || Boolean(context.knownSupport))
  );
  return eligible[0] ?? INTERVENTIONS.find((item) => item.category === category)!;
}

const ADAPTIVE_CATEGORIES = new Set(["environment", "demands", "regulation"]);

export function selectAdaptiveIntervention(
  recommendedId: string | null | undefined,
  context: { environment?: string; knownSupport?: string; lastInterventionId?: string; behavior?: string }
): Intervention {
  const recommended = INTERVENTIONS.find((item) => item.id === recommendedId);
  if (
    recommended &&
    ADAPTIVE_CATEGORIES.has(recommended.category) &&
    recommended.id !== context.lastInterventionId &&
    (!recommended.constraints.environments || (!!context.environment && recommended.constraints.environments.includes(context.environment))) &&
    (!recommended.constraints.requiresKnownSupport || Boolean(context.knownSupport))
  ) return recommended;

  if (/cabeza/i.test(context.behavior ?? "")) {
    return INTERVENTIONS.find((item) => item.id === "environment-soft-barrier")!;
  }
  if (context.environment === "public") {
    return INTERVENTIONS.find((item) => item.id === "environment-reduce-audience")!;
  }
  if (context.knownSupport && context.lastInterventionId !== "regulation-known-support") {
    return INTERVENTIONS.find((item) => item.id === "regulation-known-support")!;
  }
  return context.lastInterventionId === "demands-reduce-stimuli"
    ? INTERVENTIONS.find((item) => item.id === "regulation-space")!
    : INTERVENTIONS.find((item) => item.id === "demands-reduce-stimuli")!;
}

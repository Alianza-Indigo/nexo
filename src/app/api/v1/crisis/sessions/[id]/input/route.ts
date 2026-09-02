import { z } from "zod";
import { db } from "@/infrastructure/db/client";
import { decryptField, encryptField, secureHash } from "@/infrastructure/crypto/fields";
import { getGuest } from "@/infrastructure/auth/guest";
import { canAccessGuestSession } from "@/application/crisis/session-access";
import { processTurn } from "@/domain/crisis-machine/machine";
import { formatTurn } from "@/application/crisis/format-turn";
import { restrictedAnalysis } from "@/application/orchestration/restricted-ai";
import { INTERVENTIONS } from "@/domain/interventions/catalog";
import { ok, problem, readJson, safeError } from "@/lib/api";

const schema = z.object({
  input: z.string().trim().min(1).max(1500),
  modality: z.enum(["button", "text", "voice"]).default("text"),
  sessionVersion: z.number().int().positive(),
  transcriptUncertain: z.boolean().default(false)
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await readJson(request, schema);
    const idempotency = request.headers.get("idempotency-key");
    if (!idempotency || idempotency.length > 128) return problem(400, "IDEMPOTENCY_REQUIRED", "Falta la clave de idempotencia.");
    const keyHash = secureHash(idempotency);
    const prior = await db.idempotencyKey.findUnique({ where: { scope_keyHash: { scope: id, keyHash } } });
    if (prior) return ok(prior.response);

    const session = await db.crisisSession.findUnique({ where: { id } });
    if (!session) return problem(404, "NOT_FOUND", "La sesión no existe.");
    if (!canAccessGuestSession(session, await getGuest())) return problem(403, "FORBIDDEN", "No tienes acceso a esta sesión.");
    if (session.status === "CLOSED" || session.status === "EXPIRED") return problem(409, "SESSION_CLOSED", "La sesión ya no está activa.");
    if (session.sessionVersion !== body.sessionVersion) return problem(409, "VERSION_CONFLICT", "La sesión cambió en otro dispositivo. Recarga antes de continuar.");

    const context = session.contextEncrypted ? JSON.parse(decryptField(session.contextEncrypted)) : {};
    let turn = processTurn({ state: session.currentState as Parameters<typeof processTurn>[0]["state"], answer: body.modality === "button" ? body.input : undefined, text: body.input, context, transcriptUncertain: body.transcriptUncertain });
    let modelReference: string | null = null;
    if (body.modality !== "button" && turn.risk.level !== "CRITICAL" && process.env.AI_PRIMARY_PROVIDER !== "deterministic") {
      const analysis = await restrictedAnalysis(body.input, INTERVENTIONS.map((item) => item.id));
      if (analysis) {
        modelReference = `${process.env.AI_PRIMARY_PROVIDER ?? "gemini"}:${process.env.AI_PRIMARY_MODEL ?? "gemini-3.1-flash-lite"}`;
        const observations = analysis.observations;
        turn.context = {
          ...turn.context,
          ageBand: turn.context.ageBand ?? observations.age_band ?? undefined,
          environment: turn.context.environment ?? observations.environment ?? undefined,
          driving: turn.context.driving ?? observations.driving ?? undefined,
          behavior: turn.context.behavior ?? observations.behavior ?? undefined,
          precedingEvent: turn.context.precedingEvent ?? observations.preceding_event ?? undefined,
          knownSupport: turn.context.knownSupport ?? observations.known_support ?? undefined
        };
        const criticalFlags = new Set(["breathing_problem", "unconscious_or_unresponsive", "new_or_prolonged_seizure", "heavy_bleeding", "head_injury", "poisoning_or_overdose", "traffic_water_height_fire", "weapon_or_dangerous_object", "imminent_suicide", "self_injury_severe", "aggression_uncontained", "missing_or_elopement", "caregiver_loss_of_control", "abuse_immediate"]);
        if (analysis.risk_flags.some((flag) => criticalFlags.has(flag))) {
          turn = processTurn({ state: "DANGER_TRIAGE", answer: "No sé", context: turn.context });
          turn.risk.flags = [...new Set([...turn.risk.flags, ...analysis.risk_flags.filter((flag) => criticalFlags.has(flag))])];
        } else {
          turn.risk.flags = [...new Set([...turn.risk.flags, ...analysis.risk_flags])];
          turn.risk.uncertain ||= analysis.risk_uncertain;
        }
      }
    }
    const nextVersion = session.sessionVersion + 1;
    const baseSequence = nextVersion * 2;
    const response = formatTurn(id, nextVersion, turn);

    await db.$transaction(async (tx) => {
      const updated = await tx.crisisSession.updateMany({
        where: { id, sessionVersion: body.sessionVersion },
        data: {
          currentState: turn.state, riskLevel: turn.risk.level,
          status: turn.state === "PAUSED" ? "PAUSED" : turn.state === "STABLE" ? "STABLE" : turn.state === "CLOSED" ? "CLOSED" : "ACTIVE",
          sessionVersion: { increment: 1 }, contextEncrypted: encryptField(JSON.stringify(turn.context)),
          stabilizedAt: turn.state === "STABLE" ? new Date() : undefined,
          closedAt: turn.state === "CLOSED" ? new Date() : undefined
        }
      });
      if (updated.count !== 1) throw new Error("VERSION_CONFLICT");
      const userMessage = await tx.crisisMessage.create({ data: { crisisSessionId: id, sequence: baseSequence, role: "USER", modality: body.modality.toUpperCase() as "BUTTON" | "TEXT" | "VOICE", contentEncrypted: encryptField(body.input), savedWithConsent: session.persistenceConsent } });
      await tx.crisisMessage.create({ data: { crisisSessionId: id, sequence: baseSequence + 1, role: "ASSISTANT", modality: "STATIC", contentEncrypted: encryptField(turn.writtenText), expectedAnswer: turn.expected, savedWithConsent: session.persistenceConsent } });
      await tx.crisisEvent.create({ data: { crisisSessionId: id, sequence: nextVersion, stateFrom: session.currentState, stateTo: turn.state, eventType: "turn_processed", riskFlags: turn.risk.flags, interventionId: turn.interventionId, actor: "ENGINE" } });
      await tx.safetyAssessment.create({ data: { crisisSessionId: id, messageId: userMessage.id, flags: turn.risk.flags, riskLevel: turn.risk.level, uncertainty: turn.risk.uncertain, evidenceCategories: turn.risk.evidenceCategories, modelReference, rulesVersion: "1.0" } });
      await tx.idempotencyKey.create({ data: { scope: id, keyHash, response: JSON.parse(JSON.stringify(response)), expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) } });
    });
    return ok(response);
  } catch (error) {
    if (error instanceof Error && error.message === "VERSION_CONFLICT") return problem(409, "VERSION_CONFLICT", "La sesión cambió en otro dispositivo. Recarga antes de continuar.");
    return safeError(error);
  }
}

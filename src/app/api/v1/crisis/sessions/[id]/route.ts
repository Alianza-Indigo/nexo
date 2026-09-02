import { db } from "@/infrastructure/db/client";
import { decryptField } from "@/infrastructure/crypto/fields";
import { getGuest } from "@/infrastructure/auth/guest";
import { canAccessGuestSession } from "@/application/crisis/session-access";
import { formatTurn } from "@/application/crisis/format-turn";
import { ok, problem, safeError } from "@/lib/api";
import type { TurnOutput } from "@/domain/crisis-machine/types";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await db.crisisSession.findUnique({ where: { id }, include: { messages: { where: { role: "ASSISTANT" }, orderBy: { sequence: "desc" }, take: 1 } } });
    if (!session) return problem(404, "NOT_FOUND", "La sesión no existe.");
    if (!canAccessGuestSession(session, await getGuest())) return problem(403, "FORBIDDEN", "No tienes acceso a esta sesión.");
    const last = session.messages[0];
    const turn: TurnOutput = {
      state: session.currentState as TurnOutput["state"],
      context: session.contextEncrypted ? JSON.parse(decryptField(session.contextEncrypted)) : {},
      risk: { level: session.riskLevel, flags: [], uncertain: false, evidenceCategories: [] },
      writtenText: last?.contentEncrypted ? decryptField(last.contentEncrypted) : "Retomemos con seguridad.",
      audioText: last?.contentEncrypted ? decryptField(last.contentEncrypted) : null,
      speak: false, expected: (last?.expectedAnswer ?? "none") as TurnOutput["expected"], options: [],
      showEmergencyCall: session.riskLevel === "CRITICAL", allowPause: session.currentState !== "EMERGENCY_ESCALATED"
    };
    return ok(formatTurn(session.id, session.sessionVersion, turn));
  } catch (error) { return safeError(error); }
}

import { db } from "@/infrastructure/db/client";
import { getGuest } from "@/infrastructure/auth/guest";
import { canAccessGuestSession } from "@/application/crisis/session-access";
import { ok, problem, safeError } from "@/lib/api";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params; const session = await db.crisisSession.findUnique({ where: { id } });
    if (!session || !canAccessGuestSession(session, await getGuest())) return problem(404, "NOT_FOUND", "La sesión no está disponible.");
    const updated = await db.crisisSession.update({ where: { id }, data: { currentState: "REENTRY_SAFETY_CHECK", status: "ACTIVE", sessionVersion: { increment: 1 } } });
    return ok({ sessionId: id, state: updated.currentState, message: "Antes de continuar: ¿hay peligro inmediato? Sí, no o no sé.", version: updated.sessionVersion });
  } catch (error) { return safeError(error); }
}

import { db } from "@/infrastructure/db/client";
import { getGuest } from "@/infrastructure/auth/guest";
import { canAccessGuestSession } from "@/application/crisis/session-access";
import { encryptField } from "@/infrastructure/crypto/fields";
import { ok, problem, safeError } from "@/lib/api";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params; const session = await db.crisisSession.findUnique({ where: { id } });
    if (!session || !canAccessGuestSession(session, await getGuest())) return problem(404, "NOT_FOUND", "La sesión no está disponible.");
    const context = { pausedFrom: session.currentState };
    const updated = await db.crisisSession.update({ where: { id }, data: { currentState: "PAUSED", status: "PAUSED", contextEncrypted: encryptField(JSON.stringify(context)), sessionVersion: { increment: 1 } } });
    return ok({ sessionId: id, state: updated.currentState, version: updated.sessionVersion });
  } catch (error) { return safeError(error); }
}

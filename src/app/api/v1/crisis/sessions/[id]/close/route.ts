import { db } from "@/infrastructure/db/client";
import { getGuest } from "@/infrastructure/auth/guest";
import { canAccessGuestSession } from "@/application/crisis/session-access";
import { ok, problem, safeError } from "@/lib/api";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params; const session = await db.crisisSession.findUnique({ where: { id } });
    if (!session || !canAccessGuestSession(session, await getGuest())) return problem(404, "NOT_FOUND", "La sesión no está disponible.");
    await db.$transaction([
      db.crisisSession.update({ where: { id }, data: { status: "CLOSED", currentState: "CLOSED", closedAt: new Date() } }),
      ...(session.persistenceConsent ? [] : [db.crisisMessage.deleteMany({ where: { crisisSessionId: id } })])
    ]);
    return ok({ closed: true, narrativeDeleted: !session.persistenceConsent });
  } catch (error) { return safeError(error); }
}

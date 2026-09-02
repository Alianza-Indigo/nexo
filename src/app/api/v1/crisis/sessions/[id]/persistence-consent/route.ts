import { z } from "zod";
import { db } from "@/infrastructure/db/client";
import { getGuest } from "@/infrastructure/auth/guest";
import { canAccessGuestSession } from "@/application/crisis/session-access";
import { ok, problem, readJson, safeError } from "@/lib/api";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params; const body = await readJson(request, z.object({ granted: z.boolean() }));
    const session = await db.crisisSession.findUnique({ where: { id } });
    if (!session || !canAccessGuestSession(session, await getGuest())) return problem(404, "NOT_FOUND", "La sesión no está disponible.");
    await db.crisisSession.update({ where: { id }, data: { persistenceConsent: body.granted, retentionUntil: body.granted ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) : new Date(Date.now() + 24 * 60 * 60 * 1000) } });
    await db.consentReceipt.create({ data: { guestSessionHash: session.guestSessionHash, consentType: "SESSION_PERSISTENCE", noticeVersion: process.env.PRIVACY_NOTICE_VERSION ?? "1.0", granted: body.granted, evidence: { source: "explicit_control", sessionId: id } } });
    return ok({ granted: body.granted });
  } catch (error) { return safeError(error); }
}

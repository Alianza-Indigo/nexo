import { del } from "@vercel/blob";
import { db } from "@/infrastructure/db/client";
import { ok, problem, safeError } from "@/lib/api";

export async function GET(request: Request) {
  try {
    const expected = process.env.CRON_SECRET ?? process.env.WORKFLOW_SECRET;
    if (!expected || request.headers.get("authorization") !== `Bearer ${expected}`) return problem(401, "UNAUTHORIZED", "Autorización requerida.");
    const now = new Date(); const expiredAudio = await db.audioAsset.findMany({ where: { deleteAfter: { lte: now }, deletedAt: null }, take: 100 }); let audioDeleted = 0;
    for (const asset of expiredAudio) { await del(asset.privateBlobKey).catch(() => undefined); await db.audioAsset.update({ where: { id: asset.id }, data: { status: "DELETED", deletedAt: now } }); audioDeleted++; }
    const expiredSessions = await db.crisisSession.findMany({ where: { retentionUntil: { lte: now }, persistenceConsent: false }, select: { id: true }, take: 100 });
    await db.crisisSession.deleteMany({ where: { id: { in: expiredSessions.map((s) => s.id) } } });
    await db.idempotencyKey.deleteMany({ where: { expiresAt: { lte: now } } });
    return ok({ audioDeleted, sessionsDeleted: expiredSessions.length });
  } catch (error) { return safeError(error); }
}

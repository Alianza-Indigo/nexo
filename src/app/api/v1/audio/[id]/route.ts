import { del } from "@vercel/blob";
import { db } from "@/infrastructure/db/client";
import { getGuest } from "@/infrastructure/auth/guest";
import { canAccessGuestSession } from "@/application/crisis/session-access";
import { ok, problem, safeError } from "@/lib/api";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params; const asset = await db.audioAsset.findUnique({ where: { id }, include: { session: true } });
    if (!asset || !canAccessGuestSession(asset.session, await getGuest())) return problem(404, "NOT_FOUND", "El audio no está disponible.");
    await del(asset.privateBlobKey).catch(() => undefined);
    await db.audioAsset.update({ where: { id }, data: { status: "DELETED", deletedAt: new Date() } });
    return ok({ deleted: true });
  } catch (error) { return safeError(error); }
}

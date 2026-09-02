import { db } from "@/infrastructure/db/client";
import { getGuest } from "@/infrastructure/auth/guest";
import { canAccessGuestSession } from "@/application/crisis/session-access";
import { ok, problem, safeError } from "@/lib/api";
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) { try { const { id } = await params; const asset = await db.audioAsset.findUnique({ where: { id }, include: { session: true } }); if (!asset || !canAccessGuestSession(asset.session, await getGuest())) return problem(404, "NOT_FOUND", "Trabajo no encontrado."); return ok({ id, status: asset.status, createdAt: asset.createdAt, deletedAt: asset.deletedAt }); } catch (error) { return safeError(error); } }

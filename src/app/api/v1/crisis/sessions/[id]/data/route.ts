import { db } from "@/infrastructure/db/client";
import { getCurrentUser } from "@/infrastructure/auth/session";
import { getGuest } from "@/infrastructure/auth/guest";
import { canAccessGuestSession } from "@/application/crisis/session-access";
import { ok, problem, safeError } from "@/lib/api";
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) { try { const { id } = await params; const session = await db.crisisSession.findUnique({ where: { id } }); const user = await getCurrentUser(); if (!session || !(session.ownerUserId === user?.id || canAccessGuestSession(session, await getGuest()))) return problem(404, "NOT_FOUND", "Sesión no encontrada."); await db.crisisSession.delete({ where: { id } }); return ok({ deleted: true }); } catch (error) { return safeError(error); } }

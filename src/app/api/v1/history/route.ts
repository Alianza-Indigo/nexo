import { db } from "@/infrastructure/db/client";
import { getCurrentUser } from "@/infrastructure/auth/session";
import { ok, problem, safeError } from "@/lib/api";
export async function GET() { try { const user = await getCurrentUser(); if (!user) return problem(401, "AUTH_REQUIRED", "Inicia sesión."); const sessions = await db.crisisSession.findMany({ where: { ownerUserId: user.id, persistenceConsent: true }, select: { id: true, status: true, riskLevel: true, startedAt: true, stabilizedAt: true, closedAt: true, protocolVersion: true }, orderBy: { startedAt: "desc" }, take: 100 }); return ok(sessions); } catch (error) { return safeError(error); } }

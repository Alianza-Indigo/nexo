import { db } from "@/infrastructure/db/client";
import { getCurrentUser } from "@/infrastructure/auth/session";
import { ok, problem, safeError } from "@/lib/api";
export async function GET() { try { const user = await getCurrentUser(); if (!user) return problem(401, "AUTH_REQUIRED", "Inicia sesión."); const reports = await db.postcrisisReport.findMany({ where: { ownerUserId: user.id, deletedAt: null }, select: { id: true, reportType: true, status: true, createdAt: true, updatedAt: true }, orderBy: { createdAt: "desc" } }); return ok(reports); } catch (error) { return safeError(error); } }

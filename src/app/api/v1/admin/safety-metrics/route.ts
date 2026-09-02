import { db } from "@/infrastructure/db/client";
import { requireAdmin } from "@/application/admin/authorize";
import { ok, problem, safeError } from "@/lib/api";
export async function GET() { try { const admin = await requireAdmin(); if (!admin) return problem(403, "FORBIDDEN", "Acceso administrativo requerido."); const [sessions, critical, pendingAudio] = await Promise.all([db.crisisSession.count(), db.safetyAssessment.count({ where: { riskLevel: "CRITICAL" } }), db.audioAsset.count({ where: { deletedAt: null, deleteAfter: { lt: new Date() } } })]); return ok({ sessions, criticalAssessments: critical, audioPastRetention: pendingAudio }); } catch (error) { return safeError(error); } }

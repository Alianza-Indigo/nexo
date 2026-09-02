import { db } from "@/infrastructure/db/client";
import { requireAdmin } from "@/application/admin/authorize";
import { ok, problem, safeError } from "@/lib/api";
export async function GET() { try { const admin = await requireAdmin(); if (!admin) return problem(403, "FORBIDDEN", "Acceso administrativo requerido."); return ok(await db.protocolVersion.findMany({ orderBy: { createdAt: "desc" } })); } catch (error) { return safeError(error); } }

import { z } from "zod";
import { db } from "@/infrastructure/db/client";
import { getCurrentUser } from "@/infrastructure/auth/session";
import { secureHash } from "@/infrastructure/crypto/fields";
import { ok, problem, readJson, safeError } from "@/lib/api";
const schema = z.object({ reportId: z.string(), recipientEmail: z.email().transform((v) => v.toLowerCase()), permissions: z.array(z.enum(["view", "comment", "download"])).min(1), expiresHours: z.number().int().min(1).max(720) });
export async function POST(request: Request) { try { const user = await getCurrentUser(); if (!user) return problem(401, "AUTH_REQUIRED", "Inicia sesión."); const body = await readJson(request, schema); const report = await db.postcrisisReport.findFirst({ where: { id: body.reportId, ownerUserId: user.id, deletedAt: null } }); if (!report) return problem(404, "NOT_FOUND", "Reporte no encontrado."); const grant = await db.shareGrant.create({ data: { ownerUserId: user.id, resourceType: "PostcrisisReport", resourceId: report.id, recipientHash: secureHash(body.recipientEmail), permissions: body.permissions, expiresAt: new Date(Date.now() + body.expiresHours * 60 * 60_000) } }); return ok({ shareUrl: `${process.env.APP_BASE_URL ?? ""}/shared/${grant.id}`, note: "NEXO no envió este enlace. Compártelo manualmente." }, 201); } catch (error) { return safeError(error); } }

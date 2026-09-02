import { z } from "zod";
import { db } from "@/infrastructure/db/client";
import { getCurrentUser } from "@/infrastructure/auth/session";
import { encryptField } from "@/infrastructure/crypto/fields";
import { ok, problem, readJson, safeError } from "@/lib/api";
const schema = z.object({ title: z.string().trim().min(1).max(120), content: z.string().trim().min(1).max(10_000), source: z.enum(["caregiver", "professional"]), authorLabel: z.string().max(120).optional(), verified: z.boolean().default(false) });
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) { try { const user = await getCurrentUser(); if (!user) return problem(401, "AUTH_REQUIRED", "Inicia sesión."); const { id } = await params; const profile = await db.dependentProfile.findFirst({ where: { id, ownerUserId: user.id, deletedAt: null } }); if (!profile) return problem(404, "NOT_FOUND", "Perfil no encontrado."); const body = await readJson(request, schema); const plan = await db.crisisPlan.create({ data: { dependentProfileId: id, titleEncrypted: encryptField(body.title), contentEncrypted: encryptField(body.content), source: body.source, authorLabelEncrypted: body.authorLabel ? encryptField(body.authorLabel) : null, verifiedAt: body.verified ? new Date() : null } }); return ok({ id: plan.id }, 201); } catch (error) { return safeError(error); } }

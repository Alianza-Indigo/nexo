import { z } from "zod";
import { db } from "@/infrastructure/db/client";
import { getCurrentUser } from "@/infrastructure/auth/session";
import { decryptField, encryptField } from "@/infrastructure/crypto/fields";
import { ok, problem, readJson, safeError } from "@/lib/api";

const patchSchema = z.object({ alias: z.string().trim().min(1).max(50).optional(), ageBand: z.enum(["2-4", "5-8", "9-12", "13-17"]).optional(), pronouns: z.string().max(50).nullable().optional(), communicationModes: z.array(z.string().max(40)).max(8).optional(), sensitivities: z.string().max(1000).nullable().optional(), observableSigns: z.string().max(1000).nullable().optional(), emergencyNotes: z.string().max(1000).nullable().optional(), saveOfflineAllowed: z.boolean().optional() });

async function owned(id: string, userId: string) { return db.dependentProfile.findFirst({ where: { id, ownerUserId: userId, deletedAt: null } }); }
export async function GET(_r: Request, { params }: { params: Promise<{ id: string }> }) {
  try { const user = await getCurrentUser(); if (!user) return problem(401, "AUTH_REQUIRED", "Inicia sesión."); const p = await owned((await params).id, user.id); if (!p) return problem(404, "NOT_FOUND", "Perfil no encontrado."); return ok({ id: p.id, alias: decryptField(p.aliasEncrypted), ageBand: p.ageBand, communicationModes: p.communicationModes, sensitivities: p.sensitivitiesEncrypted ? decryptField(p.sensitivitiesEncrypted) : null, observableSigns: p.observableSignsEncrypted ? decryptField(p.observableSignsEncrypted) : null }); } catch (error) { return safeError(error); }
}
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try { const user = await getCurrentUser(); if (!user) return problem(401, "AUTH_REQUIRED", "Inicia sesión."); const { id } = await params; if (!await owned(id, user.id)) return problem(404, "NOT_FOUND", "Perfil no encontrado."); const body = await readJson(request, patchSchema); await db.dependentProfile.update({ where: { id }, data: { ...(body.alias && { aliasEncrypted: encryptField(body.alias) }), ...(body.ageBand && { ageBand: body.ageBand }), ...(body.pronouns !== undefined && { pronounsEncrypted: body.pronouns ? encryptField(body.pronouns) : null }), ...(body.communicationModes && { communicationModes: body.communicationModes }), ...(body.sensitivities !== undefined && { sensitivitiesEncrypted: body.sensitivities ? encryptField(body.sensitivities) : null }), ...(body.observableSigns !== undefined && { observableSignsEncrypted: body.observableSigns ? encryptField(body.observableSigns) : null }), ...(body.emergencyNotes !== undefined && { emergencyNotesEncrypted: body.emergencyNotes ? encryptField(body.emergencyNotes) : null }), ...(body.saveOfflineAllowed !== undefined && { saveOfflineAllowed: body.saveOfflineAllowed }) } }); return ok({ updated: true }); } catch (error) { return safeError(error); }
}
export async function DELETE(_r: Request, { params }: { params: Promise<{ id: string }> }) {
  try { const user = await getCurrentUser(); if (!user) return problem(401, "AUTH_REQUIRED", "Inicia sesión."); const { id } = await params; if (!await owned(id, user.id)) return problem(404, "NOT_FOUND", "Perfil no encontrado."); await db.dependentProfile.update({ where: { id }, data: { deletedAt: new Date() } }); return ok({ deleted: true }); } catch (error) { return safeError(error); }
}

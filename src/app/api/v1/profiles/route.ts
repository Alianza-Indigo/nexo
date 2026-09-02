import { z } from "zod";
import { db } from "@/infrastructure/db/client";
import { getCurrentUser } from "@/infrastructure/auth/session";
import { decryptField, encryptField } from "@/infrastructure/crypto/fields";
import { ok, problem, readJson, safeError } from "@/lib/api";

const createSchema = z.object({ alias: z.string().trim().min(1).max(50), ageBand: z.enum(["2-4", "5-8", "9-12", "13-17"]), pronouns: z.string().trim().max(50).optional(), communicationModes: z.array(z.string().max(40)).max(8).default([]), sensitivities: z.string().max(1000).optional(), observableSigns: z.string().max(1000).optional(), emergencyNotes: z.string().max(1000).optional(), saveOfflineAllowed: z.boolean().default(false) });

export async function GET() {
  try {
    const user = await getCurrentUser(); if (!user) return problem(401, "AUTH_REQUIRED", "Inicia sesión para ver perfiles.");
    const profiles = await db.dependentProfile.findMany({ where: { ownerUserId: user.id, deletedAt: null }, include: { supports: { where: { retiredAt: null } }, plans: { where: { active: true } } }, orderBy: { createdAt: "desc" } });
    return ok(profiles.map((p) => ({ id: p.id, alias: decryptField(p.aliasEncrypted), ageBand: p.ageBand, pronouns: p.pronounsEncrypted ? decryptField(p.pronounsEncrypted) : null, communicationModes: p.communicationModes, sensitivities: p.sensitivitiesEncrypted ? decryptField(p.sensitivitiesEncrypted) : null, observableSigns: p.observableSignsEncrypted ? decryptField(p.observableSignsEncrypted) : null, saveOfflineAllowed: p.saveOfflineAllowed, supports: p.supports.map((s) => ({ id: s.id, label: decryptField(s.labelEncrypted), accepted: s.accepted, type: s.supportType, source: s.source })), plans: p.plans.map((plan) => ({ id: plan.id, title: decryptField(plan.titleEncrypted), source: plan.source, version: plan.version, verifiedAt: plan.verifiedAt })) })));
  } catch (error) { return safeError(error); }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser(); if (!user) return problem(401, "AUTH_REQUIRED", "Inicia sesión para crear perfiles.");
    const body = await readJson(request, createSchema);
    const profile = await db.dependentProfile.create({ data: { ownerUserId: user.id, aliasEncrypted: encryptField(body.alias), ageBand: body.ageBand, pronounsEncrypted: body.pronouns ? encryptField(body.pronouns) : null, communicationModes: body.communicationModes, sensitivitiesEncrypted: body.sensitivities ? encryptField(body.sensitivities) : null, observableSignsEncrypted: body.observableSigns ? encryptField(body.observableSigns) : null, emergencyNotesEncrypted: body.emergencyNotes ? encryptField(body.emergencyNotes) : null, saveOfflineAllowed: body.saveOfflineAllowed } });
    return ok({ id: profile.id }, 201);
  } catch (error) { return safeError(error); }
}

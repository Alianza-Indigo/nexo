import { z } from "zod";
import { compare } from "bcryptjs";
import { db } from "@/infrastructure/db/client";
import { getCurrentUser } from "@/infrastructure/auth/session";
import { decryptField } from "@/infrastructure/crypto/fields";
import { problem, readJson, safeError } from "@/lib/api";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser(); if (!user?.passwordHash) return problem(401, "AUTH_REQUIRED", "Inicia sesión."); const { password } = await readJson(request, z.object({ password: z.string().min(1).max(128) }));
    if (!await compare(password, user.passwordHash)) return problem(403, "REAUTH_FAILED", "La contraseña no coincide.");
    const [profiles, sessions, reports, consents] = await Promise.all([
      db.dependentProfile.findMany({ where: { ownerUserId: user.id }, include: { supports: true, plans: true } }),
      db.crisisSession.findMany({ where: { ownerUserId: user.id }, select: { id: true, status: true, currentState: true, riskLevel: true, startedAt: true, stabilizedAt: true, closedAt: true } }),
      db.postcrisisReport.findMany({ where: { ownerUserId: user.id, deletedAt: null } }),
      db.consentReceipt.findMany({ where: { userId: user.id } })
    ]);
    const payload = { exportedAt: new Date().toISOString(), account: { email: user.email, displayName: user.displayName, locale: user.locale, timezone: user.timezone }, profiles: profiles.map((p) => ({ id: p.id, alias: decryptField(p.aliasEncrypted), ageBand: p.ageBand, communicationModes: p.communicationModes, sensitivities: p.sensitivitiesEncrypted ? decryptField(p.sensitivitiesEncrypted) : null, supports: p.supports.map((s) => ({ label: decryptField(s.labelEncrypted), accepted: s.accepted, type: s.supportType, source: s.source })), plans: p.plans.map((plan) => ({ title: decryptField(plan.titleEncrypted), content: decryptField(plan.contentEncrypted), source: plan.source, version: plan.version })) })), sessions, reports: reports.map((r) => ({ id: r.id, type: r.reportType, document: JSON.parse(decryptField(r.contentEncrypted)), createdAt: r.createdAt })), consents };
    return new Response(JSON.stringify(payload, null, 2), { headers: { "Content-Type": "application/json", "Content-Disposition": "attachment; filename=nexo-datos.json", "Cache-Control": "private, no-store" } });
  } catch (error) { return safeError(error); }
}

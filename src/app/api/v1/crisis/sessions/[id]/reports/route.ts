import { z } from "zod";
import { db } from "@/infrastructure/db/client";
import { getCurrentUser } from "@/infrastructure/auth/session";
import { encryptField } from "@/infrastructure/crypto/fields";
import { buildReport } from "@/domain/postcrisis/report";
import { ok, problem, readJson, safeError } from "@/lib/api";

const payloadSchema = z.object({ title: z.string().max(160).default(""), approximateDate: z.string().max(80).optional(), environment: z.string().max(100).optional(), priorContext: z.string().max(2000).optional(), observableSignals: z.string().max(2000).optional(), observableBehavior: z.string().max(2000).optional(), environmentResponse: z.string().max(2000).optional(), strategies: z.string().max(2000).optional(), acceptance: z.string().max(1000).optional(), describedOutcome: z.string().max(2000).optional(), injuries: z.string().max(1000).optional(), possibleFactors: z.string().max(2000).optional(), prevention: z.string().max(2000).optional(), professionalReview: z.string().max(2000).optional() });
const schema = z.object({ type: z.enum(["CRISIS_SHEET", "SOAP_DRAFT"]), consent: z.literal(true), payload: payloadSchema });
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser(); if (!user) return problem(401, "AUTH_REQUIRED", "Inicia sesión para guardar un reporte.");
    const { id } = await params; const session = await db.crisisSession.findFirst({ where: { id, ownerUserId: user.id } });
    if (!session) return problem(404, "NOT_FOUND", "Sesión no encontrada.");
    if (!["STABLE", "CLOSED"].includes(session.status)) return problem(409, "CRISIS_ACTIVE", "No se puede generar un reporte durante una crisis activa.");
    const body = await readJson(request, schema); const document = buildReport(body.type, body.payload);
    const report = await db.$transaction(async (tx) => {
      await tx.consentReceipt.create({ data: { userId: user.id, consentType: "REPORT_GENERATION", noticeVersion: process.env.PRIVACY_NOTICE_VERSION ?? "1.0", granted: true, evidence: { sessionId: id, control: "explicit_checkbox" } } });
      return tx.postcrisisReport.create({ data: { crisisSessionId: id, ownerUserId: user.id, reportType: body.type, contentEncrypted: encryptField(JSON.stringify(document)), disclaimerVersion: "1.0" } });
    });
    return ok({ id: report.id, document }, 201);
  } catch (error) { return safeError(error); }
}

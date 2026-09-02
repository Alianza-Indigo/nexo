import { z } from "zod";
import { db } from "@/infrastructure/db/client";
import { requireAdmin } from "@/application/admin/authorize";
import { secureHash } from "@/infrastructure/crypto/fields";
import { ok, problem, readJson, safeError } from "@/lib/api";
const schema = z.object({ semanticVersion: z.string().regex(/^\d+\.\d+(\.\d+)?$/), sourceHash: z.string().regex(/^[a-f0-9]{64}$/), changelog: z.string().min(20).max(5000) });
export async function POST(request: Request) { try { const admin = await requireAdmin(); if (!admin || admin.role !== "SECURITY_ADMIN") return problem(403, "FORBIDDEN", "Se requiere administración de seguridad."); const body = await readJson(request, schema); const protocol = await db.$transaction(async (tx) => { const created = await tx.protocolVersion.create({ data: { ...body, status: "DRAFT" } }); await tx.auditEvent.create({ data: { actorId: admin.id, action: "protocol.proposed", resourceType: "ProtocolVersion", resourceIdHash: secureHash(created.id), metadataRedacted: { version: body.semanticVersion, sourceHash: body.sourceHash } } }); return created; }); return ok(protocol, 201); } catch (error) { return safeError(error); } }

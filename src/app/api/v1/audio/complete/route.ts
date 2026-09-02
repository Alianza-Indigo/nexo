import { del, get } from "@vercel/blob";
import { z } from "zod";
import { db } from "@/infrastructure/db/client";
import { getGuest } from "@/infrastructure/auth/guest";
import { canAccessGuestSession } from "@/application/crisis/session-access";
import { getSTTProvider } from "@/infrastructure/stt/provider";
import { ok, problem, readJson, safeError } from "@/lib/api";

const schema = z.object({ sessionId: z.string().min(1), pathname: z.string().min(1).max(500), mimeType: z.enum(["audio/webm", "audio/mp4", "audio/ogg", "audio/mpeg"]), size: z.number().int().positive().max(8_000_000) });

export async function POST(request: Request) {
  let pathname: string | undefined;
  let assetId: string | undefined;
  try {
    const body = await readJson(request, schema); pathname = body.pathname;
    if (!body.pathname.startsWith(`crisis/${body.sessionId}/`)) return problem(400, "INVALID_AUDIO", "El audio no corresponde a la sesión.");
    const session = await db.crisisSession.findUnique({ where: { id: body.sessionId } });
    if (!session || !canAccessGuestSession(session, await getGuest())) return problem(403, "FORBIDDEN", "No tienes acceso a este audio.");
    const asset = await db.audioAsset.create({ data: { crisisSessionId: body.sessionId, privateBlobKey: body.pathname, mimeType: body.mimeType, sizeBytes: body.size, status: "PROCESSING", deleteAfter: new Date(Date.now() + 60 * 60_000) } });
    assetId = asset.id;
    const blob = await get(body.pathname, { access: "private", useCache: false });
    if (!blob) throw new Error("AUDIO_NOT_FOUND");
    const buffer = new Uint8Array(await new Response(blob.stream).arrayBuffer());
    if (buffer.byteLength > 8_000_000) throw new Error("AUDIO_TOO_LARGE");
    const transcript = await getSTTProvider().transcribe(buffer, body.mimeType);
    await db.audioAsset.update({ where: { id: asset.id }, data: { status: "TRANSCRIBED" } });
    return ok({ transcript: transcript.text, uncertain: transcript.uncertain || (transcript.confidence !== undefined && transcript.confidence < .75) });
  } catch (error) {
    if (assetId) await db.audioAsset.update({ where: { id: assetId }, data: { status: "FAILED" } }).catch(() => undefined);
    if (error instanceof Error && error.message === "STT_DISABLED") return problem(503, "VOICE_UNAVAILABLE", "La transcripción no está configurada. Puedes continuar escribiendo.");
    return safeError(error);
  } finally {
    if (pathname) {
      await del(pathname).catch(() => undefined);
      if (assetId) await db.audioAsset.update({ where: { id: assetId }, data: { status: "DELETED", deletedAt: new Date() } }).catch(() => undefined);
    }
  }
}

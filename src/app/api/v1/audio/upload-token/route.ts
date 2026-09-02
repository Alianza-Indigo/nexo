import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { db } from "@/infrastructure/db/client";
import { getGuest } from "@/infrastructure/auth/guest";
import { canAccessGuestSession } from "@/application/crisis/session-access";
import { problem, safeError } from "@/lib/api";

export async function POST(request: Request) {
  try {
    if (!process.env.BLOB_READ_WRITE_TOKEN) return problem(503, "VOICE_UNAVAILABLE", "La voz no está disponible. Puedes continuar escribiendo.");
    const body = await request.json() as HandleUploadBody;
    const guest = await getGuest();
    const result = await handleUpload({
      request, body,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const payload = JSON.parse(clientPayload ?? "{}") as { sessionId?: string };
        if (!payload.sessionId || !pathname.startsWith(`crisis/${payload.sessionId}/`)) throw new Error("INVALID_UPLOAD_PATH");
        const session = await db.crisisSession.findUnique({ where: { id: payload.sessionId } });
        if (!session || !canAccessGuestSession(session, guest)) throw new Error("FORBIDDEN");
        return { allowedContentTypes: ["audio/webm", "audio/mp4", "audio/ogg", "audio/mpeg"], maximumSizeInBytes: 8_000_000, validUntil: Date.now() + 5 * 60_000, addRandomSuffix: true, tokenPayload: JSON.stringify({ sessionId: payload.sessionId }) };
      }
    });
    return Response.json(result);
  } catch (error) { return safeError(error); }
}

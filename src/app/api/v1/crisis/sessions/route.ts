import { db } from "@/infrastructure/db/client";
import { encryptField, secureHash } from "@/infrastructure/crypto/fields";
import { getOrCreateGuest } from "@/infrastructure/auth/guest";
import { initialTurn } from "@/domain/crisis-machine/machine";
import { formatTurn } from "@/application/crisis/format-turn";
import { ok, safeError } from "@/lib/api";
import { getCurrentUser } from "@/infrastructure/auth/session";

export async function POST() {
  try {
    const guestId = await getOrCreateGuest();
    const user = await getCurrentUser();
    const turn = initialTurn();
    const session = await db.crisisSession.create({
      data: {
        guestSessionHash: secureHash(guestId), ownerUserId: user?.id, currentState: turn.state, riskLevel: turn.risk.level,
        contextEncrypted: encryptField(JSON.stringify(turn.context)),
        retentionUntil: new Date(Date.now() + 24 * 60 * 60 * 1000),
        messages: { create: { sequence: 1, role: "ASSISTANT", modality: "STATIC", contentEncrypted: encryptField(turn.writtenText), expectedAnswer: turn.expected } },
        events: { create: { sequence: 1, stateFrom: "SESSION_CREATED", stateTo: turn.state, eventType: "session_started", riskFlags: turn.risk.flags, actor: "ENGINE" } }
      }
    });
    return ok(formatTurn(session.id, session.sessionVersion, turn), 201);
  } catch (error) { return safeError(error); }
}

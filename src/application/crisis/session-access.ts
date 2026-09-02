import type { CrisisSession } from "@prisma/client";
import { secureHash } from "@/infrastructure/crypto/fields";

export function canAccessGuestSession(session: CrisisSession, guestId: string | null) {
  return !!guestId && !!session.guestSessionHash && session.guestSessionHash === secureHash(guestId);
}

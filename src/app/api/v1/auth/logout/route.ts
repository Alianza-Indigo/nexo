import { revokeCurrentSession } from "@/infrastructure/auth/session";
import { ok, safeError } from "@/lib/api";
export async function POST() { try { await revokeCurrentSession(); return ok({ loggedOut: true }); } catch (error) { return safeError(error); } }

import { getCurrentUser } from "@/infrastructure/auth/session";
import { ok } from "@/lib/api";
export async function GET() { const user = await getCurrentUser(); return ok({ user: user ? { id: user.id, email: user.email, displayName: user.displayName, role: user.role } : null }); }

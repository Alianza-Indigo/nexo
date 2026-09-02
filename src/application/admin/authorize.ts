import { getCurrentUser } from "@/infrastructure/auth/session";
export async function requireAdmin() { const user = await getCurrentUser(); return user && ["CONTENT_ADMIN", "SECURITY_ADMIN"].includes(user.role) ? user : null; }

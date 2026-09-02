import { getCurrentUser } from "@/infrastructure/auth/session";
export function isAdminRole(role: string) { return ["CONTENT_ADMIN", "SECURITY_ADMIN", "SUPERADMIN"].includes(role); }
export function isSecurityAdminRole(role: string) { return ["SECURITY_ADMIN", "SUPERADMIN"].includes(role); }
export async function requireAdmin() { const user = await getCurrentUser(); return user && isAdminRole(user.role) ? user : null; }

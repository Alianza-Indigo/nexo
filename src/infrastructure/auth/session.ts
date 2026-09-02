import { cookies, headers } from "next/headers";
import { randomBytes } from "node:crypto";
import { db } from "@/infrastructure/db/client";
import { secureHash } from "@/infrastructure/crypto/fields";

const COOKIE = "nexo_session";

export async function createUserSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const requestHeaders = await headers();
  await db.authSession.create({ data: { userId, tokenHash: secureHash(token), userAgent: requestHeaders.get("user-agent")?.slice(0, 250), ipHash: secureHash(requestHeaders.get("x-forwarded-for")?.split(",")[0] ?? "unknown"), expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) } });
  (await cookies()).set(COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 30 * 24 * 60 * 60 });
}

export async function getCurrentUser() {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const session = await db.authSession.findUnique({ where: { tokenHash: secureHash(token) }, include: { user: true } });
  if (!session || session.revokedAt || session.expiresAt < new Date() || session.user.status !== "ACTIVE") return null;
  return session.user;
}

export async function revokeCurrentSession() {
  const store = await cookies(); const token = store.get(COOKIE)?.value;
  if (token) await db.authSession.updateMany({ where: { tokenHash: secureHash(token) }, data: { revokedAt: new Date() } });
  store.delete(COOKIE);
}

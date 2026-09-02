import { db } from "@/infrastructure/db/client";
import { secureHash } from "@/infrastructure/crypto/fields";
import { createUserSession } from "@/infrastructure/auth/session";

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token");
  if (!token) return Response.redirect(new URL("/login?error=invalid", request.url));
  const record = await db.verificationToken.findUnique({ where: { tokenHash: secureHash(token) } });
  if (!record || record.usedAt || record.expiresAt < new Date()) return Response.redirect(new URL("/login?error=expired", request.url));
  await db.$transaction([
    db.verificationToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    db.user.update({ where: { id: record.userId }, data: { status: "ACTIVE", emailVerifiedAt: new Date() } })
  ]);
  await createUserSession(record.userId);
  return Response.redirect(new URL("/profiles", request.url));
}

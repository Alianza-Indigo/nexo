import { compare, hash } from "bcryptjs";
import { timingSafeEqual } from "node:crypto";
import { db } from "@/infrastructure/db/client";

export function credentialsMatch(inputEmail: string, inputPassword: string, configuredEmail?: string, configuredPassword?: string) {
  if (!configuredEmail || !configuredPassword) return false;
  if (inputEmail.trim().toLowerCase() !== configuredEmail.trim().toLowerCase()) return false;
  const input = Buffer.from(inputPassword);
  const expected = Buffer.from(configuredPassword);
  return input.length === expected.length && timingSafeEqual(input, expected);
}

export function isConfiguredSuperadminEmail(email: string) {
  return Boolean(process.env.SUPERADMIN_EMAIL && email.trim().toLowerCase() === process.env.SUPERADMIN_EMAIL.trim().toLowerCase());
}

export async function authenticateConfiguredSuperadmin(email: string, password: string) {
  const configuredEmail = process.env.SUPERADMIN_EMAIL;
  const configuredPassword = process.env.SUPERADMIN_PASSWORD;
  if (!credentialsMatch(email, password, configuredEmail, configuredPassword)) return null;

  const normalizedEmail = configuredEmail!.trim().toLowerCase();
  const existing = await db.user.findUnique({ where: { email: normalizedEmail } });
  const passwordIsCurrent = Boolean(existing?.passwordHash && await compare(configuredPassword!, existing.passwordHash));
  const passwordHash = passwordIsCurrent ? existing!.passwordHash! : await hash(configuredPassword!, 12);
  const user = await db.user.upsert({
    where: { email: normalizedEmail },
    update: { passwordHash, displayName: existing?.displayName ?? "Superadministrador", role: "SUPERADMIN", status: "ACTIVE", deletedAt: null },
    create: { email: normalizedEmail, passwordHash, displayName: "Superadministrador", role: "SUPERADMIN", status: "ACTIVE" }
  });

  if (existing && (existing.role !== "SUPERADMIN" || !passwordIsCurrent)) {
    await db.authSession.updateMany({ where: { userId: user.id, revokedAt: null }, data: { revokedAt: new Date() } });
  }
  return user;
}

import { z } from "zod";
import { hash } from "bcryptjs";
import { randomBytes } from "node:crypto";
import { db } from "@/infrastructure/db/client";
import { secureHash } from "@/infrastructure/crypto/fields";
import { ok, problem, readJson, safeError } from "@/lib/api";

const schema = z.object({ email: z.email().transform((v) => v.trim().toLowerCase()), password: z.string().min(12).max(128), displayName: z.string().trim().max(80).optional() });

export async function POST(request: Request) {
  try {
    const body = await readJson(request, schema); const passwordHash = await hash(body.password, 12);
    let user = await db.user.findUnique({ where: { email: body.email } });
    if (!user) user = await db.user.create({ data: { email: body.email, passwordHash, displayName: body.displayName, caregiverProfile: { create: {} } } });
    const raw = randomBytes(32).toString("base64url");
    await db.verificationToken.create({ data: { userId: user.id, tokenHash: secureHash(raw), expiresAt: new Date(Date.now() + 60 * 60_000) } });
    const verifyUrl = `${process.env.APP_BASE_URL ?? "http://localhost:3000"}/api/v1/auth/verify?token=${raw}`;
    if (process.env.RESEND_API_KEY) {
      await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" }, body: JSON.stringify({ from: process.env.EMAIL_FROM, to: body.email, subject: "Verifica tu cuenta NEXO", html: `<p>Confirma tu correo para guardar perfiles y reportes.</p><p><a href="${verifyUrl}">Verificar mi correo</a></p>` }) });
    }
    return ok({ message: "Si el correo puede registrarse, recibirás un enlace de verificación.", ...(process.env.NODE_ENV === "development" ? { verifyUrl } : {}) }, 202);
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unique constraint")) return problem(202, "CHECK_EMAIL", "Si el correo puede registrarse, recibirás un enlace.");
    return safeError(error);
  }
}

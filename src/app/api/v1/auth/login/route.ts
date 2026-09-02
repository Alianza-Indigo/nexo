import { z } from "zod";
import { compare } from "bcryptjs";
import { db } from "@/infrastructure/db/client";
import { createUserSession } from "@/infrastructure/auth/session";
import { ok, problem, readJson, safeError } from "@/lib/api";

const schema = z.object({ email: z.email().transform((v) => v.trim().toLowerCase()), password: z.string().min(1).max(128) });
export async function POST(request: Request) {
  try {
    const body = await readJson(request, schema); const user = await db.user.findUnique({ where: { email: body.email } });
    if (!user?.passwordHash || !(await compare(body.password, user.passwordHash))) return problem(401, "INVALID_CREDENTIALS", "Correo o contraseña incorrectos.");
    if (user.status !== "ACTIVE" || !user.emailVerifiedAt) return problem(403, "VERIFY_EMAIL", "Verifica tu correo antes de iniciar sesión.");
    await createUserSession(user.id); return ok({ user: { id: user.id, displayName: user.displayName, role: user.role } });
  } catch (error) { return safeError(error); }
}

import { z } from "zod";
import { compare } from "bcryptjs";
import { db } from "@/infrastructure/db/client";
import { getCurrentUser } from "@/infrastructure/auth/session";
import { ok, problem, readJson, safeError } from "@/lib/api";

export async function DELETE(request: Request) {
  try { const user = await getCurrentUser(); if (!user?.passwordHash) return problem(401, "AUTH_REQUIRED", "Inicia sesión."); const body = await readJson(request, z.object({ password: z.string().min(1), confirm: z.literal("ELIMINAR") })); if (!await compare(body.password, user.passwordHash)) return problem(403, "REAUTH_FAILED", "La contraseña no coincide."); await db.user.delete({ where: { id: user.id } }); return ok({ deleted: true }); } catch (error) { return safeError(error); }
}

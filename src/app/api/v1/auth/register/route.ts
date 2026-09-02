import { z } from "zod";
import { hash } from "bcryptjs";
import { db } from "@/infrastructure/db/client";
import { createUserSession } from "@/infrastructure/auth/session";
import { ok, problem, readJson, safeError } from "@/lib/api";

const schema = z.object({ email: z.email().transform((v) => v.trim().toLowerCase()), password: z.string().min(12).max(128), displayName: z.string().trim().max(80).optional() });

export async function POST(request: Request) {
  try {
    const body = await readJson(request, schema);
    const existing = await db.user.findUnique({ where: { email: body.email }, select: { id: true } });
    if (existing) return problem(409, "EMAIL_EXISTS", "Ya existe una cuenta con este correo.");
    const passwordHash = await hash(body.password, 12);
    const user = await db.user.create({ data: { email: body.email, passwordHash, displayName: body.displayName, status: "ACTIVE", caregiverProfile: { create: {} } } });
    await createUserSession(user.id);
    return ok({ user: { id: user.id, displayName: user.displayName, role: user.role } }, 201);
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unique constraint")) return problem(409, "EMAIL_EXISTS", "Ya existe una cuenta con este correo.");
    return safeError(error);
  }
}

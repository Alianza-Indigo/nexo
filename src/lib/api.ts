import { NextResponse } from "next/server";
import { z } from "zod";

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ ok: true, data }, { status });
}

export function problem(status: number, code: string, message: string) {
  return NextResponse.json({ ok: false, error: { code, message } }, { status });
}

export async function readJson<T>(request: Request, schema: z.ZodType<T>): Promise<T> {
  const size = Number(request.headers.get("content-length") ?? 0);
  if (size > 64_000) throw new Error("PAYLOAD_TOO_LARGE");
  return schema.parse(await request.json());
}

export function safeError(error: unknown) {
  if (error instanceof z.ZodError) return problem(400, "INVALID_INPUT", "Revisa los datos enviados.");
  if (error instanceof Error && error.message === "PAYLOAD_TOO_LARGE") return problem(413, "PAYLOAD_TOO_LARGE", "El contenido supera el límite permitido.");
  return problem(500, "INTERNAL_ERROR", "No fue posible completar la operación.");
}

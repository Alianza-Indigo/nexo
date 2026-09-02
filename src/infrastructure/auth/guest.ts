import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { randomUUID } from "node:crypto";

const cookieName = "nexo_guest";
const secret = () => new TextEncoder().encode(process.env.AUTH_SECRET ?? "development-guest-secret-change-this");

export async function getOrCreateGuest() {
  const store = await cookies();
  const existing = store.get(cookieName)?.value;
  if (existing) {
    try {
      const { payload } = await jwtVerify(existing, secret(), { issuer: "nexo", audience: "guest" });
      if (typeof payload.sub === "string") return payload.sub;
    } catch { /* replace invalid token */ }
  }
  const id = randomUUID();
  const token = await new SignJWT({ purpose: "crisis" }).setProtectedHeader({ alg: "HS256" }).setSubject(id).setIssuer("nexo").setAudience("guest").setIssuedAt().setExpirationTime("24h").sign(secret());
  store.set(cookieName, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: 86_400 });
  return id;
}

export async function getGuest() {
  const token = (await cookies()).get(cookieName)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret(), { issuer: "nexo", audience: "guest" });
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch { return null; }
}

"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter(); const [status, setStatus] = useState(""); const [busy, setBusy] = useState(false);
  async function submit(form: FormData) {
    setBusy(true); setStatus("");
    const response = await fetch(`/api/v1/auth/${mode}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(form)) });
    const result = await response.json(); setBusy(false);
    if (!result.ok) return setStatus(result.error.message);
    router.push(["CONTENT_ADMIN", "SECURITY_ADMIN", "SUPERADMIN"].includes(result.data.user.role) ? "/admin" : "/profiles");
    router.refresh();
  }
  return <form className="card" action={submit} aria-busy={busy}><div className="grid">
    {mode === "register" && <div className="field"><label htmlFor="displayName">Nombre para mostrar (opcional)</label><input id="displayName" name="displayName" maxLength={80} autoComplete="name" /></div>}
    <div className="field"><label htmlFor="email">Correo</label><input id="email" name="email" type="email" required autoComplete="email" /></div>
    <div className="field"><label htmlFor="password">Contraseña</label><input id="password" name="password" type="password" minLength={12} required autoComplete={mode === "login" ? "current-password" : "new-password"} /></div>
  </div><div className="actions"><button className="button button-primary" disabled={busy}>{mode === "login" ? "Entrar" : "Crear cuenta"}</button></div><p role="status" className="muted">{status}</p></form>;
}

import Link from "next/link";
import { AuthForm } from "@/components/auth/AuthForm";
export default function LoginPage() { return <section className="page"><div className="page-head"><div className="eyebrow">Cuenta opcional</div><h1>Guarda solo lo que tú decidas.</h1><p>La ayuda durante una crisis nunca requiere iniciar sesión.</p></div><AuthForm mode="login" /><p>¿Aún no tienes cuenta? <Link className="text-link" href="/register">Crear cuenta</Link></p></section>; }

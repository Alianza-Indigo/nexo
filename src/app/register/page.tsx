import Link from "next/link";
import { AuthForm } from "@/components/auth/AuthForm";
export default function RegisterPage() { return <section className="page"><div className="page-head"><div className="eyebrow">Cuenta opcional</div><h1>Crea perfiles mínimos, no expedientes.</h1><p>No pedimos diagnóstico, escuela, domicilio ni fotografía.</p></div><AuthForm mode="register" /><p>¿Ya tienes cuenta? <Link className="text-link" href="/login">Iniciar sesión</Link></p></section>; }

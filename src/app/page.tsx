import Link from "next/link";
import { ArrowRight, BookOpenText, LockKeyhole, ShieldCheck, WifiOff } from "lucide-react";

export default function Home() {
  return (
    <>
      <section className="hero">
        <div>
          <div className="eyebrow"><ShieldCheck size={16} /> Apoyo claro y seguro</div>
          <h1>Un paso a la vez, <span>cuando más importa.</span></h1>
          <p className="lede">NEXO ayuda a personas adultas cuidadoras a priorizar la seguridad, reducir la carga del momento y avanzar con una sola acción por turno.</p>
          <div className="actions">
            <Link className="button button-primary" href="/crisis">Necesito ayuda ahora <ArrowRight size={19} /></Link>
            <Link className="button button-secondary" href="/postcrisis"><BookOpenText size={19} /> Revisar una crisis pasada</Link>
          </div>
          <Link className="text-link" href="/consultation">Hacer una consulta específica</Link>
        </div>
        <div className="hero-card" aria-hidden="true">
          <div className="calm-window">
            <div className="pulse"><i /> Guía paso a paso</div>
            <blockquote>“Estoy contigo. Vamos de uno en uno.”</blockquote>
            <small>Sin diagnósticos. Sin juicios. Con seguridad primero.</small>
          </div>
        </div>
      </section>
      <section className="trust-row" aria-label="Principios de NEXO">
        <div className="trust-item"><ShieldCheck size={21} /><strong>Seguridad antes que contexto</strong><p>El riesgo se revisa antes de pedir edad, diagnóstico o antecedentes.</p></div>
        <div className="trust-item"><LockKeyhole size={21} /><strong>Privacidad desde el diseño</strong><p>No necesitas una cuenta y no se guarda la narrativa sin consentimiento.</p></div>
        <div className="trust-item"><WifiOff size={21} /><strong>Guía honesta sin conexión</strong><p>Conserva 911 y acciones estáticas, sin fingir análisis inteligente.</p></div>
      </section>
    </>
  );
}

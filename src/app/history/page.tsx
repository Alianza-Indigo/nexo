import { HistoryClient } from "@/components/history/HistoryClient";
export default function HistoryPage() { return <section className="page"><div className="page-head"><div className="eyebrow">Solo con consentimiento</div><h1>Historial de sesiones guardadas.</h1><p>Las sesiones efímeras no se incorporan al historial.</p></div><HistoryClient /></section>; }

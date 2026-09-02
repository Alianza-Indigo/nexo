import { redirect } from "next/navigation";
import { requireAdmin } from "@/application/admin/authorize";

export default async function AdminPage() {
  const admin = await requireAdmin();
  if (!admin) redirect("/login");
  return <section className="page"><div className="page-head"><div className="eyebrow">Operación controlada · {admin.role}</div><h1>Seguridad, protocolo y proveedores.</h1><p>La política central no puede editarse desde este panel. Las propuestas requieren una nueva versión, hash, pruebas y aprobación antes del despliegue.</p></div><div className="grid-3"><div className="card"><h2>Protocolo</h2><p className="muted">Versión activa 2.0 · hash íntegro verificado por CI.</p></div><div className="card"><h2>Proveedores</h2><p className="muted">El estado se obtiene sin mostrar claves ni contenido sensible.</p></div><div className="card"><h2>Auditoría</h2><p className="muted">Los eventos usan identificadores hash y metadatos redactados.</p></div></div></section>;
}

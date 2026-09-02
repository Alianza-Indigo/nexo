const resources = [
  { name: "Emergencias", phone: "911", href: "tel:911", note: "Emergencia médica, de seguridad o protección civil" },
  { name: "Línea de la Vida", phone: "800 911 2000", href: "tel:8009112000", note: "Orientación 24 horas en México; no sustituye al 911" },
  { name: "Denuncia anónima", phone: "089", href: "tel:089", note: "Posible delito; no sustituye al 911 ni a protección infantil" }
];
export default function ResourcesPage() { return <section className="page"><div className="page-head"><div className="eyebrow">México</div><h1>Recursos verificados.</h1><p>Última revisión del catálogo nacional: 2 de septiembre de 2026. Para protección infantil no inmediata, contacta a la Procuraduría de Protección de Niñas, Niños y Adolescentes o al DIF de tu estado.</p></div><div className="resource-list">{resources.map((r) => <article className="resource" key={r.phone}><div><strong>{r.name}</strong><span>{r.note}</span></div><a className="button button-secondary" href={r.href}>{r.phone}</a></article>)}</div></section>; }

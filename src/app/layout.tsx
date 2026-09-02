import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { HeartHandshake } from "lucide-react";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "NEXO — Apoyo durante una crisis", template: "%s | NEXO" },
  description: "Apoyo paso a paso para personas adultas cuidadoras durante una crisis emocional neurodivergente.",
  applicationName: "NEXO",
  manifest: "/manifest.webmanifest",
  robots: { index: false, follow: false },
  appleWebApp: { capable: true, title: "NEXO", statusBarStyle: "default" },
  icons: { icon: "/icons/icon.svg", apple: "/icons/apple-touch-icon.png" }
};

export const viewport: Viewport = { themeColor: "#176b5b", width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es-MX">
      <body>
        <a href="#contenido" className="skip-link">Saltar al contenido</a>
        <div className="shell">
          <header className="topbar">
            <Link href="/" className="brand" aria-label="NEXO, inicio"><span className="brand-mark"><HeartHandshake size={21} /></span><span className="brand-name">NEXO</span></Link>
            <nav className="nav-links" aria-label="Navegación principal">
              <Link className="nav-link optional" href="/resources">Recursos</Link>
              <Link className="nav-link optional" href="/profiles">Perfiles</Link>
              <Link className="nav-link optional" href="/history">Historial</Link>
              <Link className="nav-link optional" href="/settings">Ajustes</Link>
              <Link className="help-now-link" href="/crisis"><span className="help-label-full">Necesito ayuda ahora</span><span className="help-label-short">Ayuda ahora</span></Link>
              <a className="emergency-link" href="tel:911" aria-label="Llamar al 911">911</a>
            </nav>
          </header>
          <main id="contenido">{children}</main>
          <footer className="footer">NEXO ofrece orientación general y no sustituye al 911 ni a profesionales de salud. En peligro inmediato, llama al 911.</footer>
        </div>
        <script dangerouslySetInnerHTML={{ __html: `if('serviceWorker' in navigator){addEventListener('load',()=>navigator.serviceWorker.register('/sw.js').catch(()=>{}))}` }} />
      </body>
    </html>
  );
}

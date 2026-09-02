# NEXO

PWA de acompañamiento paso a paso para personas adultas cuidadoras durante una crisis emocional neurodivergente. NEXO prioriza seguridad física, utiliza una máquina de estados determinista y conserva rutas críticas aun cuando la IA no esté disponible.

La capa restringida de interpretación y la transcripción de voz utilizan `gemini-3.1-flash-lite`. Gemini nunca controla directamente las transiciones críticas: el motor determinista conserva la autoridad de seguridad y funciona como respaldo si el proveedor falla.

## Puesta en marcha

1. Copia `.env.example` a `.env.local` y configura Neon, secretos y, si se habilita voz, Vercel Blob.
2. Ejecuta `npm install`.
3. Ejecuta `npx prisma migrate dev` y `npm run db:seed`.
4. Ejecuta `npm run dev`.

La crisis invitada no requiere registro, pero el entorno de servidor sí requiere PostgreSQL para trazabilidad y retención. Sin conexión, el service worker abre una guía estática que declara expresamente que no realiza análisis.

El acceso administrativo inicial se controla con `SUPERADMIN_EMAIL` y `SUPERADMIN_PASSWORD`. La cuenta se aprovisiona automáticamente en su primer inicio de sesión y `/admin` rechaza sesiones no administrativas.

## Verificación

`npm run check` valida integridad del protocolo, lint, tipos, pruebas y compilación. El archivo `src/content/protocols/nexo-v2.0.txt` debe conservar el SHA-256 aprobado.

## Despliegue

La aplicación está preparada para Vercel, Neon y un store privado de Vercel Blob. Consulta `docs/DEPLOYMENT.md`, `docs/THREAT-MODEL.md` y `docs/INCIDENT-RUNBOOK.md` antes de habilitar producción pública.

Vercel toma el comando de despliegue del propio repositorio. El comando estándar `npm run build` ejecuta todas las migraciones pendientes con `prisma migrate deploy` usando `DATABASE_URL_UNPOOLED`, carga el seed idempotente y compila Next.js; GitHub Actions comprueba la cadena completa contra PostgreSQL vacío.

NEXO no sustituye al 911 ni a profesionales de salud. La validación profesional, legal, de accesibilidad y en dispositivos reales continúa siendo una condición externa para autorizar producción pública.

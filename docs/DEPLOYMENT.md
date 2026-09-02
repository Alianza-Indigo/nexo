# Despliegue en Vercel, Neon y Blob

1. Vincula Neon desde Vercel. La integración inyecta `DATABASE_URL` para ejecución y `DATABASE_URL_UNPOOLED` para migraciones; ambas deben habilitarse en Preview y Production.
2. Crea un store privado de Vercel Blob y vincúlalo al proyecto; Vercel inyectará `BLOB_READ_WRITE_TOKEN`.
3. Configura todos los secretos de `.env.example` por entorno. Preview y producción no comparten datos ni claves.
4. Conserva cada cambio de esquema como una migración SQL versionada dentro de `prisma/migrations`. No ejecutes cambios manuales sobre Neon.
5. Cada despliegue usa el `buildCommand` declarado en `vercel.json`: `npm run build` ejecuta `prisma migrate deploy`, el seed idempotente y después compila Next.js. Si una migración falla, Vercel detiene el despliegue.
6. Configura `SUPERADMIN_EMAIL` y `SUPERADMIN_PASSWORD` (mínimo 16 caracteres). Al iniciar sesión por primera vez, NEXO crea o actualiza esa cuenta como `SUPERADMIN`, verifica su correo y la envía a `/admin`. La cuenta sólo puede autenticarse contra esas variables.
7. Configura `CRON_SECRET`; Vercel llamará `/api/v1/jobs/retention` una vez al día, a las 06:00 UTC. El audio se elimina inmediatamente después de procesarse; este cron es un barrido redundante ante fallos.
8. GitHub Actions crea una base PostgreSQL vacía y ejecuta todas las migraciones y el seed antes del build. Después realiza pruebas manuales en Android Chrome, Safari iOS, TalkBack y VoiceOver.

No autorices producción pública hasta contar con revisión profesional, aviso integral aprobado, contratos de tratamiento con proveedores, evaluación de impacto, restauración comprobada y dominio final.

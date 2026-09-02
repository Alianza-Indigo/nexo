# Despliegue en Vercel, Neon y Blob

1. Crea un proyecto PostgreSQL en Neon y conserva una URL pooled para `DATABASE_URL` y una directa para `DIRECT_URL`.
2. Crea un store privado de Vercel Blob y vincúlalo al proyecto; Vercel inyectará `BLOB_READ_WRITE_TOKEN`.
3. Configura todos los secretos de `.env.example` por entorno. Preview y producción no comparten datos ni claves.
4. Genera la migración desde `prisma/schema.prisma`, revísala y ejecuta `prisma migrate deploy` con backup previo.
5. Ejecuta `npm run db:seed` para instalar el protocolo y el catálogo versionado.
6. Configura `CRON_SECRET`; Vercel llamará `/api/v1/jobs/retention` una vez al día, a las 06:00 UTC. El audio se elimina inmediatamente después de procesarse; este cron es un barrido redundante ante fallos.
7. Ejecuta `npm run check`. Después realiza pruebas manuales en Android Chrome, Safari iOS, TalkBack y VoiceOver.

No autorices producción pública hasta contar con revisión profesional, aviso integral aprobado, contratos de tratamiento con proveedores, evaluación de impacto, restauración comprobada y dominio final.

# Arquitectura de NEXO

NEXO usa Next.js App Router en Vercel, PostgreSQL en Neon y Vercel Blob privado para audio efímero. La UI nunca decide un cambio crítico: envía una respuesta, el servidor ejecuta primero el motor de seguridad y después la máquina de estados pura. La IA solo puede extraer observaciones o seleccionar un identificador de una lista permitida; una salida inválida o prohibida se descarta.

El flujo crítico funciona con plantillas estáticas aun sin proveedor de IA. Sin red, el service worker expone únicamente 911, Línea de la Vida y acciones ambientales universales, declarando que no existe análisis.

Los campos narrativos y de perfil se cifran con AES-256-GCM a nivel de aplicación. Neon recibe el texto cifrado. Las claves viven en variables de entorno y admiten una clave anterior para rotación. La propiedad se valida en cada ruta.

## Decisiones

- ADR-001: máquina de estados determinista sobre chat libre.
- ADR-002: Neon/Prisma, sin Supabase.
- ADR-003: Blob privado con carga directa autorizada; nunca Server Actions.
- ADR-004: sesión invitada firmada y retención máxima operativa de 24 horas sin consentimiento.
- ADR-005: salida de emergencia estática; ningún proveedor puede reducir el riesgo.
- ADR-006: PDF generado solo tras autorización explícita y nunca compartido automáticamente.

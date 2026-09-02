# Modelo de amenazas

| Amenaza | Control principal | Riesgo residual |
|---|---|---|
| Inyección de prompt | Usuario tratado como dato, esquema estricto, lista cerrada, validador prohibitivo | Clasificación semántica incorrecta; nunca mueve el estado |
| Acceso horizontal | Propietario o hash de sesión invitada verificado en servidor | Robo del dispositivo durante vigencia de cookie |
| Exposición de narrativa | AES-GCM por campo, logs redactados, retención corta | Compromiso simultáneo de aplicación y secreto |
| Audio persistente | Blob privado, token corto, borrado inmediato y barrido redundante | Fallo temporal del proveedor de Blob |
| Dos respuestas simultáneas | `sessionVersion` y actualización optimista | Cliente debe recargar tras conflicto |
| Abuso de carga | MIME permitido, 8 MB, prefijo por sesión, cookie firmada | Requiere límite distribuido adicional en WAF |
| Falsa capacidad | Plantillas y UI declaran que NEXO no llama ni vigila | Interpretación errónea por usuario |
| Proveedor caído | Circuito temporal y fallback determinista | Pérdida de personalización, no de seguridad |
| Service worker obsoleto | Versión fija y actualización pospuesta durante crisis | Caché antigua hasta salir de la crisis |

Antes de producción se requiere DAST, prueba de restauración, revisión OWASP ASVS y rate limiting distribuido en Vercel Firewall o store acordado.

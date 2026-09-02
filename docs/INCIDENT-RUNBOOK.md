# Runbook de incidentes

1. Clasificar: seguridad física, exposición de datos, integridad del protocolo, proveedor o disponibilidad.
2. Si la IA produce una salida prohibida, cambiar `AI_PRIMARY_PROVIDER=deterministic`, redeploy y conservar el flujo estático.
3. Si existe exposición de Blob, revocar token, bloquear carga, ejecutar borrado verificable y revisar auditoría redactada.
4. Si cambia el hash del protocolo, detener pipeline y producción; no actualizar el hash sin revisión profesional y del propietario.
5. Si Neon falla, mantener PWA offline y recursos; no aceptar que una sesión se guardó.
6. Preservar evidencia técnica sin copiar narrativas, audio, correos o teléfonos a tickets.
7. Evaluar notificación a titulares y autoridades conforme al aviso y la legislación aplicable.
8. Documentar causa, alcance, corrección, validación y decisión de reactivación.

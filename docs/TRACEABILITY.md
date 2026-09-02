# Trazabilidad normativa

| Regla | Implementación | Prueba |
|---|---|---|
| NEXO-RULE-SAFETY | `src/domain/safety/engine.ts` | `tests/unit/safety.test.ts` |
| NEXO-RULE-MEDICAL | `machine.ts` estados `MEDICAL_FILTER` | `tests/unit/machine.test.ts` |
| NEXO-RULE-DRIVING | `DRIVING_CHECK` | `tests/unit/machine.test.ts` |
| NEXO-RULE-RESTRAINT | catálogo cerrado y `containsProhibitedInstruction` | `tests/safety/adversarial.test.ts` |
| NEXO-RULE-SUICIDE | banderas crítica y urgente | `tests/unit/safety.test.ts` |
| NEXO-RULE-ABUSE | banderas inmediata y no inmediata | `tests/unit/safety.test.ts` |
| NEXO-RULE-INTERVENTION | `src/domain/interventions/catalog.ts` | `tests/unit/machine.test.ts` |
| NEXO-RULE-CAREGIVER | `CAREGIVER_CHECK` y `CAREGIVER_ESCALATION` | `tests/unit/machine.test.ts` |
| NEXO-RULE-POSTCRISIS | estados postcrisis | `tests/unit/machine.test.ts` |
| NEXO-RULE-REPORT | `src/domain/postcrisis/report.ts` | `tests/unit/report.test.ts` |
| NEXO-RULE-PRIVACY | cifrado, consentimiento y retención | `tests/unit/crypto.test.ts` |
| NEXO-RULE-VOICE | carga Blob privada y STT efímero | prueba de contrato en staging |
| NEXO-RULE-ERROR | fallback determinista | `tests/unit/machine.test.ts` |
| NEXO-RULE-CAPABILITY | plantillas y UI sin promesas de llamada | `tests/safety/adversarial.test.ts` |

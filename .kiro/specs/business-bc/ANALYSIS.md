# Análisis de Value Objects Existentes - Business BC

## Resumen Ejecutivo

**HALLAZGOS CRÍTICOS:** Existen duplicaciones de Value Objects entre Customer BC y Business BC que deben unificarse en `shared/`.

---

## 1. WhatsAppPhone vs WhatsAppNumber

### Estado Actual

| Aspecto            | Customer BC                                             | Business BC (creado)                                     |
| ------------------ | ------------------------------------------------------- | -------------------------------------------------------- |
| **Nombre**         | `WhatsAppPhone`                                         | `WhatsAppNumber`                                         |
| **Ubicación**      | `apps/backend/src/customer/domain/vo/whatsapp-phone.ts` | `apps/backend/src/business/domain/vo/whatsapp-number.ts` |
| **Formato**        | E.164                                                   | E.164                                                    |
| **Validación**     | Regex: `/^\+[1-9]\d{6,14}$/`                            | Similar                                                  |
| **Factory Method** | `fromString(value: string)`                             | `create(value: string)`                                  |
| **Exception**      | `InvalidWhatsAppPhoneException`                         | `InvalidWhatsAppNumberException`                         |

### Análisis

- **DUPLICACIÓN CONFIRMADA:** Ambos representan el mismo concepto (número de WhatsApp en formato E.164)
- **Diferencias menores:** Solo en nombres de métodos factory (`fromString` vs `create`)
- **Uso:** Customer BC lo usa extensivamente (20+ referencias)

### Recomendación

✅ **UNIFICAR EN SHARED:**

- Mover `WhatsAppPhone` de Customer BC a `apps/backend/src/shared/vo/whatsapp-phone.ts`
- Usar nombre `WhatsAppPhone` (más descriptivo que `WhatsAppNumber`)
- Mantener método `fromString()` (más explícito)
- Actualizar imports en Customer BC
- Business BC debe usar el mismo VO de shared

**Razón:** Es un concepto universal del dominio, usado por múltiples BCs (Customer, Business, potencialmente Conversation).

---

## 2. Timezone

### Estado Actual

| Aspecto        | Detalles                                                      |
| -------------- | ------------------------------------------------------------- |
| **Ubicación**  | `apps/backend/src/business/domain/vo/timezone.ts` (ya creado) |
| **Validación** | IANA timezone usando `Intl.supportedValuesOf('timeZone')`     |
| **Uso**        | Solo Business BC (por ahora)                                  |

### Análisis

- **NO HAY DUPLICACIÓN:** Solo existe en Business BC
- **Uso potencial:** Podría ser usado por otros BCs en el futuro (Availability, Notification)
- **Validación robusta:** Usa API nativa de JavaScript para validar timezones IANA

### Recomendación

⚠️ **MANTENER EN BUSINESS BC POR AHORA, CONSIDERAR SHARED EN FUTURO:**

- Dejar en `apps/backend/src/business/domain/vo/timezone.ts`
- Si otro BC necesita timezone, mover a `shared/vo/`
- Monitorear uso en Availability BC y Notification BC

**Razón:** Principio YAGNI (You Aren't Gonna Need It) - solo mover a shared cuando haya uso confirmado en múltiples BCs.

---

## 3. BusinessAddress

### Estado Actual

| Aspecto       | Detalles                                                                  |
| ------------- | ------------------------------------------------------------------------- |
| **Ubicación** | `apps/backend/src/business/domain/vo/business-address.ts` (ya creado)     |
| **Campos**    | street (required), city (required), state, country, postalCode (optional) |
| **Uso**       | Solo Business BC                                                          |

### Análisis

- **NO HAY DUPLICACIÓN:** Solo existe en Business BC
- **Específico del dominio:** Es específico para negocios (no aplica a Customer, Appointment, etc.)
- **No hay concepto similar:** No existe `CustomerAddress` ni `Address` genérico

### Recomendación

✅ **MANTENER EN BUSINESS BC:**

- Dejar en `apps/backend/src/business/domain/vo/business-address.ts`
- Es específico del contexto de Business
- No hay necesidad de generalización

**Razón:** Es un concepto específico del BC Business, no es reutilizable en otros contextos.

---

## 4. BusinessName

### Estado Actual

| Aspecto       | Detalles                              |
| ------------- | ------------------------------------- |
| **Ubicación** | No existe                             |
| **Uso**       | Business BC usa `string` directamente |

### Análisis

- **NO EXISTE:** No hay Value Object para nombre de negocio
- **Validación necesaria:** Longitud mínima/máxima, caracteres permitidos
- **Comparación:** Customer BC tiene validación de nombre en el aggregate, no en VO separado

### Recomendación

⚠️ **EVALUAR NECESIDAD:**

**Opción A - Sin VO (Recomendado para MVP):**

- Validar en el aggregate `Business.create()`
- Similar a como Customer BC valida el nombre
- Menos archivos, más simple

**Opción B - Con VO:**

- Crear `BusinessName` VO si hay lógica compleja
- Útil si hay normalización, formato especial, etc.

**Decisión:** Empezar sin VO, agregar solo si la lógica de validación se vuelve compleja.

---

## 5. Date/Time Handling

### Estado Actual

| Aspecto        | Detalles                       |
| -------------- | ------------------------------ |
| **Librería**   | No se usa `date-fns` en shared |
| **Uso actual** | `Date` nativo de JavaScript    |
| **Ubicación**  | No hay VOs de fecha en shared  |

### Análisis

- **NO HAY VOs DE FECHA:** No existe `DateTime`, `DateRange`, etc. en shared
- **Uso nativo:** Se usa `Date` de JavaScript directamente
- **Serialización:** WebSocket serializa `Date` como string automáticamente

### Recomendación

✅ **MANTENER ENFOQUE ACTUAL:**

- Usar `Date` nativo de JavaScript
- No crear VOs de fecha por ahora
- Si se necesita `date-fns`, importar directamente en los BCs que lo necesiten

**Razón:** `Date` nativo es suficiente para MVP. VOs de fecha agregan complejidad sin beneficio claro.

---

## Resumen de Acciones

### ✅ ACCIÓN INMEDIATA: Unificar WhatsAppPhone

1. **Mover a shared:**

   ```
   apps/backend/src/shared/vo/whatsapp-phone.ts
   apps/backend/src/shared/vo/__tests__/whatsapp-phone.spec.ts
   ```

2. **Actualizar imports en Customer BC:**
   - Cambiar `@customer/domain/vo/whatsapp-phone` → `@shared/vo/whatsapp-phone`
   - Actualizar ~20+ archivos

3. **Business BC usar shared:**
   - Importar desde `@shared/vo/whatsapp-phone`
   - NO crear `whatsapp-number.ts` en Business BC

4. **Eliminar duplicados:**
   - Borrar `apps/backend/src/customer/domain/vo/whatsapp-phone.ts`
   - Borrar `apps/backend/src/business/domain/vo/whatsapp-number.ts` (si existe)

### ⚠️ MANTENER EN BUSINESS BC

- `Timezone` - Específico de Business por ahora
- `BusinessAddress` - Específico del dominio Business
- No crear `BusinessName` VO (validar en aggregate)

### 📋 ACTUALIZAR TASKS.MD

Modificar Phase 1 del plan de implementación:

```markdown
## Phase 1: Domain Layer - Value Objects

- [ ] 1.1 Move WhatsAppPhone to Shared
  - Move from Customer BC to `apps/backend/src/shared/vo/whatsapp-phone.ts`
  - Update all imports in Customer BC (~20 files)
  - Add to shared barrel export
  - _Requirements: 3.1, 8.1_

- [ ] 1.2 Create Timezone Value Object (keep in Business BC)
  - Already exists at `apps/backend/src/business/domain/vo/timezone.ts`
  - Validate against IANA timezone list
  - _Requirements: 4.1, 4.2, 8.2_

- [ ] 1.3 Create BusinessAddress Value Object (keep in Business BC)
  - Already exists at `apps/backend/src/business/domain/vo/business-address.ts`
  - Validate required fields (street, city)
  - _Requirements: 5.1, 5.2, 8.3_

- [ ] 1.4 Create Domain Exceptions
  - Reuse InvalidWhatsAppPhoneException from shared
  - InvalidTimezoneException (Business BC)
  - InvalidBusinessAddressException (Business BC)
  - InvalidBusinessNameException (Business BC)
  - OnboardingNotCompletedException (Business BC)
  - MaxBusinessesExceededException (Business BC)
  - BusinessNotFoundException (Business BC)
  - _Requirements: 3.5, 4.2, 1.2, 2.3, 2.5_
```

---

## Impacto en Customer BC

### Archivos a Actualizar (después de mover WhatsAppPhone a shared)

```
apps/backend/src/customer/domain/aggregates/customer.ts
apps/backend/src/customer/domain/aggregates/__tests__/customer.spec.ts
apps/backend/src/customer/domain/aggregates/__tests__/customer.pbt.spec.ts
apps/backend/src/customer/app/commands/identify-customer/handler.ts
apps/backend/src/customer/infra/persistence/mappers/customer-write.ts
apps/backend/src/customer/infra/persistence/mappers/customer-read.ts
... (~15 archivos más)
```

### Comando de Búsqueda y Reemplazo

```bash
# Buscar todos los imports de WhatsAppPhone en Customer BC
grep -r "from '@customer/domain/vo/whatsapp-phone'" apps/backend/src/customer/

# Reemplazar con import de shared
# @customer/domain/vo/whatsapp-phone → @shared/vo/whatsapp-phone
```

---

## Conclusión

**DECISIÓN ARQUITECTÓNICA:**

1. ✅ **WhatsAppPhone → SHARED** (acción inmediata)
2. ⚠️ **Timezone → BUSINESS BC** (mover a shared solo si otro BC lo necesita)
3. ✅ **BusinessAddress → BUSINESS BC** (específico del dominio)
4. ✅ **BusinessName → NO CREAR VO** (validar en aggregate)
5. ✅ **Date/Time → Date nativo** (sin VOs por ahora)

**PRÓXIMOS PASOS:**

1. Mover `WhatsAppPhone` a shared
2. Actualizar imports en Customer BC
3. Actualizar `tasks.md` con el plan corregido
4. Proceder con implementación de Business BC usando shared VOs

---

**Fecha:** 2024-12-20  
**Autor:** Kiro AI  
**Estado:** Análisis Completo - Pendiente Aprobación

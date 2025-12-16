# ADR-001: Renombrar Bounded Context `booking` a `appointment`

**Estado:** Propuesto  
**Fecha:** 2024-12-15  
**Decisores:** Equipo de desarrollo  

## Contexto y Problema

El Bounded Context actual se llama `booking` pero su aggregate principal es `Appointment`, creando inconsistencia en el lenguaje ubicuo:

```
apps/backend/src/booking/           ❌ BC llamado "booking"
  domain/
    aggregates/
      appointment.ts                ✅ Aggregate llamado "Appointment"
    events/
      appointment-created.ts        ✅ Eventos con "Appointment"
      appointment-cancelled.ts
```

**Problemas identificados:**

1. **Inconsistencia con Lenguaje Ubicuo**: El aggregate principal es `Appointment`, not `Booking`
2. **Ambigüedad**: "Booking" es genérico, "Appointment" es específico para citas
3. **Confusión con package**: Teníamos `@packages/shared-types` (plural) vs `appointment` BC (singular)
4. **Semántica**: Una "appointment" (cita) es más específica que una "booking" (reserva genérica)

## Decisión

Renombrar el Bounded Context de `booking` a `appointment` para alinearlo con el lenguaje ubicuo del dominio.

### Cambios Propuestos:

```bash
# Backend
apps/backend/src/booking/  →  apps/backend/src/appointment/

# Módulo NestJS
BookingModule  →  AppointmentModule

# Archivos
booking.module.ts  →  appointment.module.ts
```

### Mantener sin cambios:
- ✅ Aggregates: `Appointment` (ya correcto)
- ✅ Events: `AppointmentCreated`, etc. (ya correcto)
- ✅ DTOs: `AppointmentDto` (ya correcto)
- ✅ Endpoints: `/api/appointments` (ya correcto)

## Consecuencias

### Positivas ✅

1. **Consistencia**: BC, aggregate, eventos y endpoints usan el mismo término
2. **Claridad**: "Appointment" es más específico y claro que "Booking"
3. **Lenguaje Ubicuo**: Alineado con el dominio de negocio (citas médicas, peluquería, etc.)
4. **Menos ambigüedad**: Evita confusión con "bookings" (plural) del package

### Negativas ❌

1. **Refactoring**: Requiere renombrar carpetas, imports y referencias
2. **Git History**: Los commits antiguos referenciarán "booking"
3. **Documentación**: Actualizar PRD y documentos existentes

### Neutras ⚖️

1. **Breaking Change**: Solo afecta estructura interna, no APIs públicas
2. **Timing**: Mejor hacerlo ahora en MVP que después con más código

## Alternativas Consideradas

### Alternativa 1: Mantener `booking`
- ❌ Perpetúa la inconsistencia
- ❌ Confunde a nuevos desarrolladores

### Alternativa 2: Renombrar aggregate a `Booking`
- ❌ "Booking" es menos específico que "Appointment"
- ❌ Los endpoints ya usan `/appointments`
- ❌ Los DTOs ya usan `AppointmentDto`

### Alternativa 3: Usar ambos términos
- ❌ Viola el principio de lenguaje ubicuo
- ❌ Crea más confusión

## Plan de Implementación

### Fase 1: Preparación
1. Crear branch `refactor/rename-booking-to-appointment`
2. Verificar que todos los tests pasan
3. Documentar estado actual

### Fase 2: Renombrado
1. Renombrar carpeta: `src/booking/` → `src/appointment/`
2. Renombrar módulo: `BookingModule` → `AppointmentModule`
3. Actualizar imports en todo el proyecto
4. Actualizar tests

### Fase 3: Verificación
1. Ejecutar todos los tests
2. Verificar que la aplicación compila
3. Probar endpoints manualmente

### Fase 4: Documentación
1. Actualizar PRD
2. Actualizar bounded-contexts.md
3. Actualizar README

## Referencias

- [Ubiquitous Language - DDD](https://martinfowler.com/bliki/UbiquitousLanguage.html)
- PRD Section 2.2: Bounded Contexts
- bounded-contexts.md: BC5 definition

## Decisiones Relacionadas

### Package Naming: `@packages/shared-types`

Durante la implementación del frontend, también se decidió renombrar el package de tipos compartidos:

**Evolución:**
1. `@bookings/shared-types` → Ambiguo con BC "appointment"
2. `@shared/types` → Ambiguo con `src/shared/` de cada app
3. `@packages/shared-types` → ✅ **FINAL**: Explícito y sin ambigüedad

**Convención establecida:**
```typescript
// Imports del monorepo (packages/)
import type { AppointmentDto } from '@packages/shared-types';

// Imports internos de la app (src/shared/)
import { formatDate } from '@shared/lib/date';
import { apiClient } from '@shared/api';
```

**Ventajas:**
- ✅ Totalmente explícito sobre el origen del import
- ✅ Evita confusión con `src/shared/` de cada app
- ✅ Escalable para futuros packages (`@packages/shared-utils`, etc.)
- ✅ Consistente con convenciones de monorepos

## Notas

Este ADR está **PROPUESTO** y pendiente de aprobación del equipo. Una vez aprobado, se procederá con la implementación del renombrado del BC.

# Architecture Decision Record: Capacity debe vivir en Availability BC

**Fecha:** 2024-12-14  
**Estado:** ✅ Aprobado  
**Decisión:** Mover `Capacity` del bounded context `Booking` al bounded context `Availability`

---

## Contexto

Actualmente, el aggregate `Capacity` está implementado en el bounded context `Booking` (`src/booking/`). Sin embargo, según el PRD original y los principios de DDD, `Capacity` debería vivir en el bounded context `Availability`.

## Análisis

### Según el PRD (Product Requirements Document)

El PRD define claramente:

> **BC4: `availability`**
>
> - **Responsabilidad**: Gestión de horarios, bloqueos y límites de capacidad
> - **Aggregates**: Schedule, Capacity, Block

### Lenguaje Ubicuo

- **Booking**: Gestión de **citas** (crear, cancelar, modificar appointments)
- **Availability**: Gestión de **disponibilidad** (horarios, capacidad, bloqueos)

Una cita **consume** capacidad, pero no **es** capacidad.

### Principios SOLID y DDD

#### 1. Single Responsibility Principle (SRP)

- `Booking` debe enfocarse en **gestionar citas**
- `Availability` debe enfocarse en **gestionar disponibilidad**

#### 2. Bounded Context Boundaries

- Cada BC debe tener su propio lenguaje ubicuo
- `Capacity` es parte del lenguaje de **disponibilidad**, no de reservaciones

#### 3. Escalabilidad

- Si en el futuro agregamos `Schedule` y `Block`, estarán en el mismo BC
- Facilita queries como "¿qué fechas tienen disponibilidad?" sin cruzar BCs

## Decisión

**✅ Mover `Capacity` de `Booking` a `Availability`**

### Estructura Propuesta

```
src/
├── availability/
│   ├── availability.module.ts
│   ├── domain/
│   │   ├── aggregates/
│   │   │   ├── capacity.ts          ← MOVER AQUÍ
│   │   │   ├── schedule.ts          ← NUEVO
│   │   │   └── block.ts             ← NUEVO
│   │   ├── interfaces/
│   │   │   └── repositories/
│   │   │       ├── capacity-read.ts
│   │   │       ├── capacity-write.ts
│   │   │       ├── schedule-read.ts
│   │   │       ├── schedule-write.ts
│   │   │       ├── block-read.ts
│   │   │       └── block-write.ts
│   │   └── read-models/
│   │       ├── capacity.ts
│   │       ├── schedule.ts
│   │       └── block.ts
│   ├── app/
│   │   ├── commands/
│   │   │   ├── set-capacity/
│   │   │   ├── configure-schedule/
│   │   │   └── block-slot/
│   │   └── queries/
│   │       ├── get-available-slots/
│   │       └── get-schedule/
│   └── infra/
│       └── persistence/
│           ├── models/
│           │   ├── capacity.ts      ← MOVER AQUÍ
│           │   ├── schedule.ts
│           │   └── block.ts
│           ├── mappers/
│           └── repositories/
└── booking/
    ├── booking.module.ts
    └── ... (sin Capacity)
```

### Comunicación entre BCs

**BookingModule** importará **AvailabilityModule** para acceder a `ICapacityReadRepository`:

```typescript
// src/booking/booking.module.ts
@Module({
  imports: [
    CqrsModule,
    AvailabilityModule, // ← Importar para acceder a ICapacityReadRepository
    TypeOrmModule.forFeature([AppointmentModel]),
  ],
  // ...
})
export class BookingModule {}
```

**ConversationModule** también importará **AvailabilityModule**:

```typescript
// src/conversation/conversation.module.ts
@Module({
  imports: [
    CqrsModule,
    AvailabilityModule, // ← Para queries de disponibilidad
  ],
  // ...
})
export class ConversationModule {}
```

### Eventos de Dominio

Los eventos de `Booking` pueden actualizar `Capacity` vía event handlers:

```typescript
// En availability/app/event-handlers/on-appointment-created.ts
@EventsHandler(AppointmentCreated)
export class OnAppointmentCreatedHandler {
  async handle(event: AppointmentCreated) {
    // Decrementar capacity
    await this.commandBus.execute(
      new DecrementCapacityCommand(event.offeringId, event.dateTime),
    );
  }
}
```

## Consecuencias

### Positivas ✅

1. **Separación de responsabilidades clara**: Cada BC tiene su propósito bien definido
2. **Lenguaje ubicuo correcto**: `Capacity` está donde debe estar según el dominio
3. **Escalabilidad**: Fácil agregar `Schedule` y `Block` en el futuro
4. **Queries optimizadas**: "Disponibilidad" se consulta desde un solo BC
5. **Mantenibilidad**: Cambios en disponibilidad no afectan lógica de booking

### Negativas ⚠️

1. **Refactoring inicial**: Requiere mover archivos y actualizar imports
2. **Dependency entre BCs**: `BookingModule` depende de `AvailabilityModule`
3. **Complejidad de eventos**: Sincronización vía eventos requiere event handlers

### Mitigaciones

- ✅ La tarea 14 en el spec cubre todo el refactoring necesario
- ✅ La dependencia es unidireccional y explícita (Booking → Availability)
- ✅ Los event handlers ya están contemplados en el diseño

## Implementación

Ver **Task 14** en `.kiro/specs/proyecto-base-mvp/tasks.md` para el plan detallado de implementación.

### Pasos Principales

1. Crear estructura del BC `Availability`
2. Mover `Capacity` de `Booking` a `Availability`
3. Crear `Schedule` y `Block` aggregates
4. Implementar comandos y queries de disponibilidad
5. Actualizar `BookingModule` y `ConversationModule` para importar `AvailabilityModule`
6. Escribir tests completos

## Referencias

- PRD: `.kiro/specs/proyecto-base-mvp/requirements.md` (Requirement 8)
- Design: `.kiro/specs/proyecto-base-mvp/design.md`
- Bounded Contexts Guide: `.kiro/steering/bounded-contexts.md`
- DDD Patterns: `.kiro/steering/ddd-patterns.md`

---

**Conclusión:** Esta decisión alinea la implementación con el diseño original del PRD, mejora la organización del código y facilita la escalabilidad futura del sistema.

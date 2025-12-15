# Capacity Migration Map

Este documento mapea todos los archivos relacionados con `Capacity` que serán migrados de `booking` y `conversation` a `availability`.

## Archivos a Mover

### 1. TypeORM Entity (Model)
```
ORIGEN: src/booking/infra/persistence/models/capacity.ts
DESTINO: src/availability/infra/persistence/models/capacity.ts
ACCIÓN: MOVER
```

### 2. Read Model
```
ORIGEN: src/booking/domain/read-models/capacity.ts
DESTINO: src/availability/domain/read-models/capacity.ts
ACCIÓN: MOVER

DUPLICADO: src/conversation/domain/read-models/capacity.ts (si existe)
ACCIÓN: ELIMINAR (usar el de availability)
```

### 3. Repository Interfaces

#### Read Repository
```
ORIGEN: src/booking/domain/interfaces/repositories/capacity-read.ts
DESTINO: src/availability/domain/interfaces/repositories/capacity-read.ts
ACCIÓN: MOVER

DUPLICADO: src/conversation/domain/interfaces/repositories/capacity-read.ts
ACCIÓN: ELIMINAR (usar el de availability)
```

#### Write Repository
```
ORIGEN: No existe (está como interface inline en CreateAppointmentHandler)
DESTINO: src/availability/domain/interfaces/repositories/capacity-write.ts
ACCIÓN: CREAR NUEVA
```

### 4. Mappers

#### Read Mapper
```
ORIGEN: src/booking/infra/persistence/mappers/capacity-read.ts
DESTINO: src/availability/infra/persistence/mappers/capacity-read.ts
ACCIÓN: MOVER

DUPLICADO: src/conversation/infra/persistence/mappers/capacity-read.ts
ACCIÓN: ELIMINAR (usar el de availability)
```

#### Write Mapper
```
ORIGEN: No existe
DESTINO: src/availability/infra/persistence/mappers/capacity-write.ts
ACCIÓN: CREAR NUEVA
```

### 5. Repositories

#### Read Repository
```
ORIGEN: src/booking/infra/persistence/repositories/capacity-read.ts
DESTINO: src/availability/infra/persistence/repositories/capacity-read.ts
ACCIÓN: MOVER

DUPLICADO: src/conversation/infra/persistence/repositories/capacity-read.ts
ACCIÓN: ELIMINAR (usar el de availability)
```

#### Write Repository
```
ORIGEN: No existe (MockCapacityWriteRepository en booking.module.ts)
DESTINO: src/availability/infra/persistence/repositories/capacity-write.ts
ACCIÓN: CREAR NUEVA (implementación real con Optimistic Locking)
```

### 6. Aggregate
```
ORIGEN: No existe
DESTINO: src/availability/domain/aggregates/capacity.ts
ACCIÓN: CREAR NUEVA
```

### 7. Domain Events
```
ORIGEN: No existen
DESTINO: src/availability/domain/events/
  - capacity-created.ts
  - slot-booked.ts
  - slot-released.ts
  - capacity-changed.ts
ACCIÓN: CREAR NUEVAS
```

## Archivos que Referencian Capacity (Actualizar Imports)

### BookingModule
```
ARCHIVO: src/booking/booking.module.ts
CAMBIOS:
  - Importar AvailabilityModule
  - Remover CapacityModel de TypeOrmModule.forFeature
  - Remover CapacityReadRepository de providers
  - Remover MockCapacityWriteRepository
  - Remover exports de ICapacityReadRepository e ICapacityWriteRepository
```

### ConversationModule
```
ARCHIVO: src/conversation/conversation.module.ts
CAMBIOS:
  - Reemplazar import de BookingModule por AvailabilityModule
  - Actualizar comentarios
```

### CreateAppointmentHandler
```
ARCHIVO: src/booking/app/commands/create-appointment/handler.ts
CAMBIOS:
  - Actualizar import de ICapacityWriteRepository:
    DE: interface inline
    A: @availability/domain/interfaces/repositories/capacity-write
```

### GetAvailableDatesHandler
```
ARCHIVO: src/conversation/app/queries/get-available-dates/handler.ts
CAMBIOS:
  - Actualizar import de ICapacityReadRepository:
    DE: @booking/domain/interfaces/repositories/capacity-read
    A: @availability/domain/interfaces/repositories/capacity-read
```

### GetAvailableTimeSlotsHandler
```
ARCHIVO: src/conversation/app/queries/get-available-time-slots/handler.ts
CAMBIOS:
  - Actualizar import de ICapacityReadRepository:
    DE: @booking/domain/interfaces/repositories/capacity-read
    A: @availability/domain/interfaces/repositories/capacity-read
  - Actualizar import de TimeSlot:
    DE: @booking/domain/read-models/capacity
    A: @availability/domain/read-models/capacity
```

### Tests de CreateAppointmentHandler
```
ARCHIVOS:
  - src/booking/app/commands/create-appointment/__tests__/handler.integration.spec.ts
  - src/booking/app/commands/create-appointment/__tests__/handler.pbt.spec.ts

CAMBIOS:
  - Actualizar mocks de ICapacityWriteRepository
  - Verificar que tests siguen pasando después de migración
```

### AppModule
```
ARCHIVO: src/app.module.ts
CAMBIOS:
  - Importar AvailabilityModule
  - Agregar AvailabilityModule ANTES de BookingModule en imports array
```

### tsconfig.json
```
ARCHIVO: tsconfig.json
CAMBIOS:
  - Agregar path alias: "@availability/*": ["src/availability/*"]
```

## Estructura Final de Availability BC

```
src/availability/
├── availability.module.ts
├── domain/
│   ├── aggregates/
│   │   └── capacity.ts                    ← NUEVO
│   ├── interfaces/
│   │   └── repositories/
│   │       ├── capacity-read.ts           ← MOVIDO de booking
│   │       └── capacity-write.ts          ← NUEVO
│   ├── read-models/
│   │   └── capacity.ts                    ← MOVIDO de booking
│   ├── events/
│   │   ├── capacity-created.ts            ← NUEVO
│   │   ├── slot-booked.ts                 ← NUEVO
│   │   ├── slot-released.ts               ← NUEVO
│   │   └── capacity-changed.ts            ← NUEVO
│   └── exceptions/
│       └── no-available-slots.ts          ← CONSIDERAR MOVER
├── app/
│   ├── commands/
│   │   └── set-capacity/
│   │       ├── command.ts                 ← NUEVO
│   │       ├── handler.ts                 ← NUEVO
│   │       └── index.ts                   ← NUEVO
│   └── queries/
│       └── get-available-slots/
│           ├── query.ts                   ← NUEVO
│           ├── handler.ts                 ← NUEVO
│           └── index.ts                   ← NUEVO
└── infra/
    └── persistence/
        ├── models/
        │   └── capacity.ts                ← MOVIDO de booking
        ├── mappers/
        │   ├── capacity-read.ts           ← MOVIDO de booking
        │   └── capacity-write.ts          ← NUEVO
        └── repositories/
            ├── capacity-read.ts           ← MOVIDO de booking
            └── capacity-write.ts          ← NUEVO
```

## Archivos a Eliminar (Duplicados)

```
❌ src/conversation/domain/interfaces/repositories/capacity-read.ts
❌ src/conversation/infra/persistence/mappers/capacity-read.ts
❌ src/conversation/infra/persistence/repositories/capacity-read.ts
❌ src/conversation/domain/read-models/capacity.ts (si existe)
```

## Verificación Post-Migración

### Comandos a Ejecutar
```bash
# Verificar tipos
tsc --noEmit

# Verificar linting
npm run lint

# Verificar formato
npm run format

# Ejecutar tests unitarios
npm test

# Ejecutar tests E2E
npm run test:e2e

# Verificar que no quedan referencias a capacity en booking
grep -r "capacity" src/booking/ --exclude-dir=__tests__
```

### Checklist de Verificación
- [ ] Todos los tests pasan (mismo número que baseline)
- [ ] No hay errores de TypeScript (`tsc --noEmit`)
- [ ] No hay errores de linting (`npm run lint`)
- [ ] Código está formateado (`npm run format`)
- [ ] No quedan archivos duplicados
- [ ] BookingModule importa AvailabilityModule
- [ ] ConversationModule importa AvailabilityModule
- [ ] AppModule incluye AvailabilityModule
- [ ] Todos los imports usan `@availability/*`
- [ ] MockCapacityWriteRepository fue eliminado
- [ ] CapacityModel solo existe en availability

## Notas Importantes

1. **Orden de Imports en AppModule**: AvailabilityModule DEBE importarse ANTES de BookingModule para resolver dependencias correctamente.

2. **Tests**: Los tests de CreateAppointmentHandler usan mocks de ICapacityWriteRepository, por lo que seguirán funcionando sin cambios.

3. **Optimistic Locking**: El nuevo CapacityWriteRepository debe implementar Optimistic Locking con campo `version`.

4. **Eventos de Dominio**: Los eventos de Capacity deben ser publicados desde el aggregate, no desde los handlers.

5. **Comunicación entre BCs**: BookingModule → AvailabilityModule (unidireccional).

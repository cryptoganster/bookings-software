# Reglas de Arquitectura - Boundaries

Este documento define las reglas estrictas de dependencias entre capas y bounded contexts.

## Reglas de Dependencia por Capa

### 1. Shared Kernel (`src/shared/kernel/`)
**Puede depender de:** NADA
- Es la base de todo el sistema
- No tiene dependencias internas

### 2. Shared Value Objects (`src/shared/vo/`)
**Puede depender de:**
- `src/shared/kernel/`

### 3. Shared Infrastructure (`src/shared/infra/`)
**Puede depender de:**
- `src/shared/kernel/`
- `src/shared/vo/`

### 4. Domain Layer (`src/{bc}/domain/`)
**Puede depender de:**
- `src/shared/kernel/`
- `src/shared/vo/`
- `src/{mismo-bc}/domain/` (mismo bounded context)

**NO puede depender de:**
- ❌ `src/{bc}/app/`
- ❌ `src/{bc}/infra/`
- ❌ `src/{bc}/presentation/`
- ❌ `src/{otro-bc}/` (otro bounded context)
- ❌ Frameworks externos (@nestjs/common, typeorm, axios)

### 5. Application Layer (`src/{bc}/app/`)
**Puede depender de:**
- `src/shared/kernel/`
- `src/shared/vo/`
- `src/{mismo-bc}/domain/`
- `src/{mismo-bc}/app/` (mismo bounded context)
- ✅ `src/{cualquier-bc}/domain/interfaces/` (interfaces de repositorios/servicios)
- ✅ `src/{cualquier-bc}/domain/events/` (domain events para event handlers)

**Razón:** Esto permite **Dependency Inversion Principle**. Por ejemplo:
```typescript
// src/booking/app/commands/create-appointment/handler.ts
import { ICapacityWriteRepository } from '@availability/domain/interfaces/repositories/capacity-write';
// ✅ OK: Application puede depender de interfaces de Domain de otros BCs
```

**NO puede depender de:**
- ❌ `src/{bc}/infra/`
- ❌ `src/{bc}/presentation/`
- ❌ `src/{otro-bc}/domain/aggregates/` (aggregates de otro BC)
- ❌ `src/{otro-bc}/domain/vo/` (value objects de otro BC)
- ❌ `src/{otro-bc}/app/` (application de otro BC)
- ❌ `src/{otro-bc}/infra/` (infrastructure de otro BC)

### 6. Infrastructure Layer (`src/{bc}/infra/`)
**Puede depender de:**
- `src/shared/kernel/`
- `src/shared/vo/`
- `src/shared/infra/`
- `src/{mismo-bc}/domain/`
- `src/{mismo-bc}/app/`
- `src/{mismo-bc}/infra/` (mismo bounded context)

**NO puede depender de:**
- ❌ `src/{bc}/presentation/`
- ❌ `src/{otro-bc}/` (otro bounded context)

### 7. Presentation Layer (`src/{bc}/presentation/`)
**Puede depender de:**
- `src/shared/kernel/`
- `src/shared/vo/`
- `src/{mismo-bc}/domain/` (solo para DTOs/tipos)
- `src/{mismo-bc}/app/`
- `src/{mismo-bc}/presentation/` (mismo bounded context)

**NO puede depender de:**
- ❌ `src/{bc}/infra/`
- ❌ `src/{otro-bc}/` (otro bounded context)

### 8. NestJS Modules (`src/{bc}/{bc}.module.ts`)
**Puede depender de:**
- `src/shared/kernel/`
- `src/shared/vo/`
- ✅ `src/{cualquier-bc}/{bc}.module.ts` (otros módulos de NestJS)
- `src/{mismo-bc}/domain/`
- `src/{mismo-bc}/app/`
- `src/{mismo-bc}/infra/`
- `src/{mismo-bc}/presentation/`

**Razón:** Los módulos de NestJS son el punto de integración del framework y necesitan importar otros módulos para Dependency Injection.

**Ejemplo:**
```typescript
// src/booking/booking.module.ts
import { AvailabilityModule } from '../availability/availability.module';

@Module({
  imports: [AvailabilityModule], // ✅ OK: Modules pueden importar otros modules
  // ...
})
export class BookingModule {}
```

## Validación Automática

Las reglas se validan automáticamente con **eslint-plugin-boundaries**:

```bash
# Validar arquitectura
npm run lint:boundaries

# Validar y auto-fix
npm run lint:boundaries:fix

# Validar en CI/CD (falla si hay errores)
npm run lint:boundaries -- --max-warnings 0
```

## Instalación

Ya está instalado en el proyecto:

```bash
npm install --save-dev eslint-plugin-boundaries
```

## Configuración

El archivo `eslint.boundaries.config.mjs` contiene todas las reglas:

```javascript
// Elementos definidos
- shared-kernel
- shared-vo
- shared-infra
- bc-module (*.module.ts)
- bc-domain-interfaces (domain/interfaces/**)
- bc-domain-events (domain/events/**)
- bc-domain
- bc-app
- bc-infra
- bc-presentation
```

## Ejemplos de Violaciones

### ❌ Violación 1: Domain importando de App
```typescript
// src/booking/domain/aggregates/appointment.ts
import { CreateAppointmentHandler } from '../../app/commands/create-appointment/handler';
// ERROR: Domain cannot depend on Application layer
```

### ❌ Violación 2: Domain importando framework
```typescript
// src/booking/domain/aggregates/appointment.ts
import { Injectable } from '@nestjs/common';
// ERROR: Domain cannot depend on infrastructure frameworks
```

### ❌ Violación 3: App importando de Infra
```typescript
// src/booking/app/commands/create-appointment/handler.ts
import { AppointmentModel } from '../../infra/persistence/models/appointment';
// ERROR: Application cannot depend on Infrastructure layer
```

### ❌ Violación 4: Cross-BC dependency (Aggregates)
```typescript
// src/booking/domain/aggregates/appointment.ts
import { Customer } from '../../../customer/domain/aggregates/customer';
// ERROR: Domain cannot import aggregates from other BCs
// Use Domain Events instead
```

### ❌ Violación 5: App importing from other BC's App
```typescript
// src/booking/app/commands/create-appointment/handler.ts
import { CreateCustomerHandler } from '../../../customer/app/commands/create-customer/handler';
// ERROR: Application cannot import handlers from other BCs
// Use CommandBus to dispatch commands instead
```

## Ejemplos Correctos

### ✅ Correcto 1: Domain usando Shared Kernel
```typescript
// src/booking/domain/aggregates/appointment.ts
import { VersionedAggregateRoot } from '@shared/kernel/versioned-aggregate-root.base';
import { UUID } from '@shared/vo/uuid.vo';
```

### ✅ Correcto 2: App usando Domain
```typescript
// src/booking/app/commands/create-appointment/handler.ts
import { Appointment } from '../../domain/aggregates/appointment';
import { IAppointmentWriteRepository } from '../../domain/interfaces/repositories/appointment-write.repository.interface';
```

### ✅ Correcto 3: Infra implementando interfaces de Domain
```typescript
// src/booking/infra/persistence/repositories/appointment-write.repository.ts
import { IAppointmentWriteRepository } from '../../../domain/interfaces/repositories/appointment-write.repository.interface';
import { Appointment } from '../../../domain/aggregates/appointment';
```

### ✅ Correcto 4: Comunicación entre BCs via eventos
```typescript
// src/notification/app/event_handlers/on-appointment-created.handler.ts
import { AppointmentCreated } from '@booking/domain/events/appointment-created.event';
// OK: Event handlers can listen to events from other BCs
```

### ✅ Correcto 5: App usando interfaces de otros BCs (Dependency Inversion)
```typescript
// src/booking/app/commands/create-appointment/handler.ts
import { ICapacityWriteRepository } from '@availability/domain/interfaces/repositories/capacity-write';
// OK: Application can depend on domain interfaces from other BCs
// This is Dependency Inversion Principle in action
```

### ✅ Correcto 6: Módulos importando otros módulos
```typescript
// src/booking/booking.module.ts
import { AvailabilityModule } from '../availability/availability.module';

@Module({
  imports: [AvailabilityModule], // OK: Modules can import other modules
  // ...
})
export class BookingModule {}
```

## Excepciones

Los tests están excluidos de estas reglas:
- `**/*.spec.ts`
- `**/*.test.ts`
- `**/*.e2e-spec.ts`

Esto permite que los tests importen lo necesario para probar.

## Beneficios

1. ✅ **Inversión de Dependencias:** Garantizada por ESLint
2. ✅ **Clean Architecture:** Capas respetan jerarquía
3. ✅ **Bounded Contexts:** Aislamiento entre BCs (excepto interfaces/eventos)
4. ✅ **Feedback Inmediato:** Errores en tiempo real en IDE
5. ✅ **CI/CD:** Falla el build si se violan reglas
6. ✅ **Documentación Viva:** Las reglas son código ejecutable
7. ✅ **Dependency Inversion:** App puede usar interfaces de otros BCs
8. ✅ **NestJS Compatible:** Módulos pueden importarse entre sí

## Diagrama de Dependencias Permitidas

```
┌─────────────────────────────────────────────────────────┐
│                    Shared Kernel                        │
│                    (sin dependencias)                   │
└─────────────────────────────────────────────────────────┘
                           ↑
                           │
┌─────────────────────────────────────────────────────────┐
│                    Shared VO                            │
└─────────────────────────────────────────────────────────┘
                           ↑
                           │
┌─────────────────────────────────────────────────────────┐
│                 Shared Infrastructure                   │
└─────────────────────────────────────────────────────────┘

Por cada Bounded Context:

┌─────────────────────────────────────────────────────────┐
│                    Domain Layer                         │
│  - Aggregates, VOs, Events, Interfaces                 │
│  - Puede: shared/kernel, shared/vo                     │
│  - NO puede: frameworks, app, infra, otros BCs         │
└─────────────────────────────────────────────────────────┘
                           ↑
                           │
┌─────────────────────────────────────────────────────────┐
│                 Application Layer                       │
│  - Commands, Queries, Event Handlers                   │
│  - Puede: domain (propio BC)                           │
│  - Puede: domain/interfaces/** (cualquier BC) ✅       │
│  - Puede: domain/events/** (cualquier BC) ✅           │
│  - NO puede: infra, presentation, otros BC app         │
└─────────────────────────────────────────────────────────┘
                           ↑
                           │
┌─────────────────────────────────────────────────────────┐
│              Infrastructure Layer                       │
│  - Repositories, External Clients                      │
│  - Puede: domain, app (propio BC), shared/infra       │
│  - NO puede: presentation, otros BCs                   │
└─────────────────────────────────────────────────────────┘
                           ↑
                           │
┌─────────────────────────────────────────────────────────┐
│              Presentation Layer                         │
│  - Controllers, DTOs                                    │
│  - Puede: app (propio BC), domain (solo tipos)        │
│  - NO puede: infra, otros BCs                          │
└─────────────────────────────────────────────────────────┘

Módulos NestJS (*.module.ts):
  - Pueden importar otros *.module.ts (cualquier BC) ✅
  - Pueden importar todas las capas de su propio BC
```

## Troubleshooting

### Error: "Import from X is not allowed"
Revisa la capa desde donde estás importando. Probablemente estés violando la jerarquía de capas.

### Error: "External module X is not allowed"
El domain layer no puede importar frameworks. Usa interfaces y dependency injection.

### Necesito importar un aggregate de otro BC
No puedes. Usa Domain Events para comunicación entre BCs. Si necesitas datos, usa:
- Interfaces de repositorios (para queries)
- Domain Events (para reaccionar a cambios)
- CommandBus (para disparar acciones)

### Necesito usar un repository de otro BC
✅ Puedes importar la **interfaz** del repository:
```typescript
import { ICapacityWriteRepository } from '@availability/domain/interfaces/repositories/capacity-write';
```

❌ NO puedes importar la implementación:
```typescript
import { CapacityWriteRepository } from '@availability/infra/persistence/repositories/capacity-write';
```

## Integración con CI/CD

Agrega al pipeline:

```yaml
# .github/workflows/ci.yml
- name: Validate Architecture Boundaries
  run: npm run lint:boundaries -- --max-warnings 0
```

Esto garantiza que ningún PR pueda mergear si viola las reglas de arquitectura.

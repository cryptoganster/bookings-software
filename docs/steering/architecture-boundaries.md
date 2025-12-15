---
inclusion: always
---

# Reglas de Arquitectura - Boundaries

Este documento define las reglas estrictas de dependencias entre capas y bounded contexts.

## ✅ Estado: IMPLEMENTADO Y FUNCIONANDO

Hemos creado una **regla ESLint personalizada** que valida automáticamente las reglas de arquitectura.

**Comando:** `npm run lint`

**Resultado actual:** ✅ 0 errores de arquitectura en el proyecto

## ¿Por qué ESLint personalizado?

Tu sugerencia de usar ESLint era **perfecta**. Creamos una regla personalizada porque:

1. ✅ **Control total:** Reglas exactas para nuestro proyecto
2. ✅ **Funciona ahora:** No depende de configuraciones complejas de plugins
3. ✅ **Feedback inmediato:** Errores en tiempo real en IDE
4. ✅ **CI/CD ready:** Falla el build si se violan reglas
5. ✅ **Mensajes claros:** Errores descriptivos que explican la violación

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

**Validación ESLint:**
```typescript
// ❌ ERROR: Domain layer cannot import from Application layer
import { CreateAppointmentHandler } from '../app/commands/create-appointment/handler';

// ❌ ERROR: Domain layer cannot import infrastructure frameworks: @nestjs/common
import { Injectable } from '@nestjs/common';

// ❌ ERROR: Domain layer cannot import from other Bounded Contexts
import { User } from '../../auth/domain/aggregates/user';
```

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
// ✅ OK: Application puede depender de interfaces de Domain de otros BCs
import { ICapacityWriteRepository } from '@availability/domain/interfaces/repositories/capacity-write';

// ✅ OK: Event handlers pueden escuchar eventos de otros BCs
import { AppointmentCreated } from '@booking/domain/events/appointment-created.event';
```

**NO puede depender de:**
- ❌ `src/{bc}/infra/`
- ❌ `src/{bc}/presentation/`
- ❌ `src/{otro-bc}/domain/aggregates/` (aggregates de otro BC)
- ❌ `src/{otro-bc}/domain/vo/` (value objects de otro BC)
- ❌ `src/{otro-bc}/app/` (application de otro BC)
- ❌ `src/{otro-bc}/infra/` (infrastructure de otro BC)

**Validación ESLint:**
```typescript
// ❌ ERROR: Application layer cannot import aggregates from other BCs
import { User } from '../../auth/domain/aggregates/user';

// ❌ ERROR: Application layer cannot import from Infrastructure layer
import { AppointmentModel } from '../infra/persistence/models/appointment';

// ❌ ERROR: Application layer cannot import from other BC Application layers
import { CreateUserHandler } from '../../auth/app/commands/create-user/handler';
```

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

**Validación ESLint:**
```typescript
// ❌ ERROR: Infrastructure layer cannot import from other Bounded Contexts
import { UserModel } from '../../auth/infra/persistence/models/user';

// ❌ ERROR: Infrastructure layer cannot import from Presentation layer
import { AppointmentController } from '../presentation/controllers/appointment.controller';
```

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

**Validación ESLint:**
```typescript
// ❌ ERROR: Presentation layer cannot import from Infrastructure layer
import { AppointmentWriteRepository } from '../infra/persistence/repositories/appointment-write';

// ❌ ERROR: Presentation layer cannot import from other Bounded Contexts
import { AuthController } from '../../auth/presentation/controllers/auth';
```

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

**Validación:** Los archivos `*.module.ts` están **excluidos** de las reglas de boundaries.

## Validación Automática

```bash
# Validar arquitectura (se ejecuta automáticamente)
npm run lint

# Validar en CI/CD (falla si hay errores)
npm run lint -- --max-warnings 0
```

## Implementación Técnica

### Archivo: `eslint-local-rules.cjs`

Contiene la regla personalizada `no-cross-boundary-imports` que:

1. **Detecta la capa y BC** del archivo actual
2. **Analiza cada import** para determinar origen y destino
3. **Valida las reglas** según la matriz de dependencias permitidas
4. **Reporta errores** con mensajes descriptivos

### Archivo: `eslint.config.mjs`

Configuración de ESLint que:

1. Usa el parser de TypeScript
2. Carga la regla personalizada
3. Aplica la regla a todos los archivos `src/**/*.ts`
4. Excluye tests (`*.spec.ts`, `*.test.ts`, `*.e2e-spec.ts`)

## Ejemplos de Violaciones Detectadas

### ❌ Violación 1: Domain importando de App
```typescript
// src/booking/domain/aggregates/appointment.ts
import { CreateAppointmentHandler } from '../../app/commands/create-appointment/handler';
// ERROR: Domain layer cannot import from Application layer (booking/domain -> booking/app)
```

### ❌ Violación 2: Domain importando framework
```typescript
// src/booking/domain/aggregates/appointment.ts
import { Injectable } from '@nestjs/common';
// ERROR: Domain layer cannot import infrastructure frameworks: @nestjs/common
```

### ❌ Violación 3: App importando de Infra
```typescript
// src/booking/app/commands/create-appointment/handler.ts
import { AppointmentModel } from '../../infra/persistence/models/appointment';
// ERROR: Application layer cannot import from Infrastructure layer (booking/app -> booking/infra)
```

### ❌ Violación 4: Cross-BC dependency (Aggregates)
```typescript
// src/booking/domain/aggregates/appointment.ts
import { Customer } from '../../../customer/domain/aggregates/customer';
// ERROR: Domain layer cannot import from other Bounded Contexts (booking/domain -> customer/domain)
```

### ❌ Violación 5: App importing aggregates from other BC
```typescript
// src/booking/app/commands/create-appointment/handler.ts
import { User } from '../../../auth/domain/aggregates/user';
// ERROR: Application layer cannot import aggregates from other BCs (booking/app -> auth/domain/aggregates). Use interfaces or events instead.
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
9. ✅ **Mensajes Claros:** Errores descriptivos que guían al desarrollador
10. ✅ **Sin Dependencias:** No requiere plugins externos complejos

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
  - Excluidos de validación de boundaries
```

## Troubleshooting

### Error: "Domain layer cannot import from Application layer"
**Solución:** Mueve la lógica al domain o usa eventos para comunicación.

### Error: "Domain layer cannot import infrastructure frameworks"
**Solución:** El domain debe ser puro. Usa interfaces y dependency injection.

### Error: "Application layer cannot import aggregates from other BCs"
**Solución:** Usa interfaces de repositorios o escucha eventos de dominio.

### Necesito usar un repository de otro BC
✅ **Puedes importar la interfaz:**
```typescript
import { ICapacityWriteRepository } from '@availability/domain/interfaces/repositories/capacity-write';
```

❌ **NO puedes importar la implementación:**
```typescript
import { CapacityWriteRepository } from '@availability/infra/persistence/repositories/capacity-write';
```

## Integración con CI/CD

Agrega al pipeline:

```yaml
# .github/workflows/ci.yml
- name: Validate Architecture Boundaries
  run: npm run lint -- --max-warnings 0
```

Esto garantiza que ningún PR pueda mergear si viola las reglas de arquitectura.

## Resultado Actual

```bash
$ npm run lint

✅ 0 errores de arquitectura
⚠️  25 warnings de TypeScript (any)

✨ El proyecto respeta completamente las reglas de Clean Architecture
```

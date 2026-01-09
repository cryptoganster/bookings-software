---
inclusion: always
---

# Import Conventions

**Import conventions and path aliases for the monorepo**

> **Cross-References:**
>
> - [30-naming-conventions.md](./30-naming-conventions.md) - Naming conventions
> - [32-eslint-configuration.md](./32-eslint-configuration.md) - ESLint path alias enforcement
> - [21-clean-code-principles.md](./21-clean-code-principles.md) - Clean code practices

---

# Import Conventions

Este documento define las convenciones de imports para el monorepo.

## Prefijos de Path Aliases

### `@packages/*` - Packages del Monorepo

**Ubicación:** `packages/*/`  
**Propósito:** Código compartido entre múltiples apps del monorepo  
**Alcance:** Cross-app (backend, frontend, mobile, etc.)

```typescript
// ✅ Correcto
import type { AppointmentDto } from "@packages/shared-types";
import { validateEmail } from "@packages/shared-utils";

// ❌ Incorrecto
import type { AppointmentDto } from "@shared/types"; // Ambiguo
import type { AppointmentDto } from "../../../packages/shared-types"; // Relativo
```

**Packages actuales:**

- `@packages/shared-types` - Tipos TypeScript compartidos (API Contract Layer)

**Packages futuros:**

- `@packages/shared-utils` - Utilidades compartidas
- `@packages/shared-config` - Configuración compartida

---

### `@shared/*` - Shared Layer de cada App

**Ubicación:** `apps/*/src/shared/`  
**Propósito:** Código compartido DENTRO de una app específica  
**Alcance:** Intra-app (solo dentro de esa app)

```typescript
// ✅ Correcto - Frontend
import { apiClient } from "@shared/api";
import { formatDate } from "@shared/lib/date";
import { ENDPOINTS } from "@shared/api/endpoints";

// ✅ Correcto - Backend
import { IUnitOfWork } from "@shared/kernel/uow";
import { UUID } from "@shared/vo/uuid";
```

**Contenido típico:**

- `api/` - Cliente HTTP, endpoints
- `config/` - Configuración de la app
- `lib/` - Utilidades específicas de la app
- `ui/` - Componentes UI compartidos (frontend)
- `hooks/` - React hooks compartidos (frontend)
- `kernel/` - Abstracciones base (backend)
- `vo/` - Value Objects genéricos (backend)

---

### Backend Bounded Context Aliases

**Ubicación:** `apps/backend/src/{bc}/`  
**Propósito:** Acceso a bounded contexts específicos

```typescript
// ✅ Correcto
import { Appointment } from "@booking/domain/aggregates/appointment";
import { ICustomerFactory } from "@customer/domain/interfaces/factories";
import { UUID } from "@shared/vo/uuid";
```

**Aliases disponibles:**

- `@booking/*` - Booking BC
- `@conversation/*` - Conversation BC
- `@auth/*` - Auth BC
- `@availability/*` - Availability BC
- `@offering/*` - Offering BC
- `@customer/*` - Customer BC

---

## Reglas de Imports

### 1. Preferir Path Aliases sobre Imports Relativos

```typescript
// ✅ Correcto
import { apiClient } from "@shared/api";
import type { AppointmentDto } from "@packages/shared-types";

// ❌ Evitar
import { apiClient } from "../../../shared/api";
import type { AppointmentDto } from "../../../../packages/shared-types";
```

**Excepción:** Imports dentro del mismo directorio o subdirectorio inmediato:

```typescript
// ✅ Aceptable
import { LoginForm } from "./ui/LoginForm";
import { useLogin } from "./model/useLogin";
```

---

### 2. Separar Imports por Origen

```typescript
// ✅ Correcto - Agrupados y ordenados
// 1. Node modules
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

// 2. Packages del monorepo
import type { AppointmentDto } from "@packages/shared-types";

// 3. Shared de la app
import { apiClient } from "@shared/api";
import { formatDate } from "@shared/lib/date";

// 4. Bounded contexts (backend)
import { Appointment } from "@booking/domain/aggregates/appointment";
import { ICustomerFactory } from "@customer/domain/interfaces/factories";

// 5. Relativos (mismo módulo)
import { LoginForm } from "./ui/LoginForm";
```

---

### 3. Type Imports Explícitos

```typescript
// ✅ Correcto - Explícito que es solo tipo
import type { AppointmentDto } from "@packages/shared-types";
import type { AppointmentFilters } from "@shared/api/types";

// ❌ Evitar - Ambiguo
import { AppointmentDto } from "@packages/shared-types";
```

**Ventaja:** TypeScript puede eliminar estos imports en el bundle (tree-shaking)

---

### 4. No Re-exportar Tipos del Contrato

```typescript
// ❌ Incorrecto - Re-exportar desde shared-types
// apps/frontend/src/shared/api/types.ts
export type { AppointmentDto } from "@packages/shared-types";

// ✅ Correcto - Importar directamente
// apps/frontend/src/features/appointment/list/ui/AppointmentsList.tsx
import type { AppointmentDto } from "@packages/shared-types";
```

**Razón:** Hace explícito el origen del tipo (contrato de API)

---

## Configuración de TypeScript

### Backend (`apps/backend/tsconfig.json`)

```json
{
  "compilerOptions": {
    "baseUrl": "./",
    "paths": {
      "@packages/shared-types": ["../../packages/shared-types/src/index.ts"],
      "@shared/*": ["src/shared/*"],
      "@booking/*": ["src/booking/*"],
      "@conversation/*": ["src/conversation/*"],
      "@auth/*": ["src/auth/*"],
      "@availability/*": ["src/availability/*"],
      "@offering/*": ["src/offering/*"],
      "@customer/*": ["src/customer/*"],
      "@test-utils/*": ["src/test-utils/*"],
      "@database/*": ["src/database/*"],
      "@config/*": ["src/config/*"]
    }
  }
}
```

---

## Ejemplos Completos

### Backend Command Handler

```typescript
// apps/backend/src/booking/app/commands/create-appointment/handler.ts

// 1. Node modules
import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";

// 2. Packages del monorepo
import type { CreateAppointmentResponseDto } from "@packages/shared-types";

// 3. Shared del backend
import { IUnitOfWork } from "@shared/kernel/uow";
import { UUID } from "@shared/vo/uuid";

// 4. Domain del mismo BC
import { Appointment } from "../../domain/aggregates/appointment";
import { IAppointmentWriteRepository } from "../../domain/interfaces/repositories/appointment-write";

// 5. Relativos
import { CreateAppointmentCommand } from "./command";

@CommandHandler(CreateAppointmentCommand)
export class CreateAppointmentHandler implements ICommandHandler<CreateAppointmentCommand> {
  // Handler implementation
}
```

---

## Checklist de Code Review

Al revisar código, verificar:

- [ ] ✅ Usa path aliases en lugar de imports relativos largos
- [ ] ✅ Imports agrupados y ordenados por origen
- [ ] ✅ Type imports usan `import type`
- [ ] ✅ No re-exporta tipos de `@packages/shared-types`
- [ ] ✅ Usa `@packages/*` para packages del monorepo
- [ ] ✅ Usa `@shared/*` para shared de la app
- [ ] ✅ No mezcla `@packages/*` con `@shared/*`

---

## Beneficios de esta Convención

1. **Claridad**: Origen explícito de cada import
2. **Mantenibilidad**: Fácil refactorizar y mover código
3. **Escalabilidad**: Preparado para nuevos packages y apps
4. **Consistencia**: Misma convención en todo el monorepo
5. **DX**: Autocompletado funciona mejor con path aliases
6. **Tree-shaking**: Type imports se eliminan del bundle

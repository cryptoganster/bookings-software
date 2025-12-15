# Import Conventions

Este documento define las convenciones de imports para el monorepo.

## Prefijos de Path Aliases

### `@packages/*` - Packages del Monorepo

**Ubicación:** `packages/*/`  
**Propósito:** Código compartido entre múltiples apps del monorepo  
**Alcance:** Cross-app (backend, frontend, mobile, etc.)

```typescript
// ✅ Correcto
import type { AppointmentDto } from '@packages/shared-types';
import { validateEmail } from '@packages/shared-utils';

// ❌ Incorrecto
import type { AppointmentDto } from '@shared/types'; // Ambiguo
import type { AppointmentDto } from '../../../packages/shared-types'; // Relativo
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
import { apiClient } from '@shared/api';
import { formatDate } from '@shared/lib/date';
import { ENDPOINTS } from '@shared/api/endpoints';

// ✅ Correcto - Backend
import { IUnitOfWork } from '@shared/kernel/uow';
import { UUID } from '@shared/vo/uuid';
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

### `@app/*` - App Layer (Frontend FSD)

**Ubicación:** `apps/frontend/src/app/`  
**Propósito:** Inicialización y configuración global del frontend  

```typescript
// ✅ Correcto
import { QueryProvider } from '@app/providers';
import { router } from '@app/router';
import { useAuthStore } from '@app/store/auth';
```

---

### `@pages/*` - Pages Layer (Frontend FSD)

**Ubicación:** `apps/frontend/src/pages/`  
**Propósito:** Páginas completas del frontend

```typescript
// ✅ Correcto
import { DashboardPage } from '@pages/DashboardPage';
import { LoginPage } from '@pages/LoginPage';
```

---

### `@widgets/*` - Widgets Layer (Frontend FSD)

**Ubicación:** `apps/frontend/src/widgets/`  
**Propósito:** Composiciones complejas de UI

```typescript
// ✅ Correcto
import { StatsCards } from '@widgets/StatsCards';
import { UpcomingAppointments } from '@widgets/UpcomingAppointments';
```

---

### `@features/*` - Features Layer (Frontend FSD)

**Ubicación:** `apps/frontend/src/features/`  
**Propósito:** Casos de uso interactivos

```typescript
// ✅ Correcto
import { LoginForm } from '@features/auth/login';
import { CancelAppointmentButton } from '@features/appointment/cancel';
```

---

### `@entities/*` - Entities Layer (Frontend FSD)

**Ubicación:** `apps/frontend/src/entities/`  
**Propósito:** Modelos de dominio del frontend

```typescript
// ✅ Correcto
import { AppointmentCard } from '@entities/appointment';
import { useAppointments } from '@entities/appointment';
```

---

## Reglas de Imports

### 1. Preferir Path Aliases sobre Imports Relativos

```typescript
// ✅ Correcto
import { apiClient } from '@shared/api';
import type { AppointmentDto } from '@packages/shared-types';

// ❌ Evitar
import { apiClient } from '../../../shared/api';
import type { AppointmentDto } from '../../../../packages/shared-types';
```

**Excepción:** Imports dentro del mismo directorio o subdirectorio inmediato:
```typescript
// ✅ Aceptable
import { LoginForm } from './ui/LoginForm';
import { useLogin } from './model/useLogin';
```

---

### 2. Separar Imports por Origen

```typescript
// ✅ Correcto - Agrupados y ordenados
// 1. Node modules
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

// 2. Packages del monorepo
import type { AppointmentDto } from '@packages/shared-types';

// 3. Shared de la app
import { apiClient } from '@shared/api';
import { formatDate } from '@shared/lib/date';

// 4. Capas FSD (app, pages, widgets, features, entities)
import { useAuthStore } from '@app/store/auth';
import { AppointmentCard } from '@entities/appointment';

// 5. Relativos (mismo módulo)
import { LoginForm } from './ui/LoginForm';
```

---

### 3. Type Imports Explícitos

```typescript
// ✅ Correcto - Explícito que es solo tipo
import type { AppointmentDto } from '@packages/shared-types';
import type { AppointmentFilters } from '@shared/api/types';

// ❌ Evitar - Ambiguo
import { AppointmentDto } from '@packages/shared-types';
```

**Ventaja:** TypeScript puede eliminar estos imports en el bundle (tree-shaking)

---

### 4. No Re-exportar Tipos del Contrato

```typescript
// ❌ Incorrecto - Re-exportar desde shared-types
// apps/frontend/src/shared/api/types.ts
export type { AppointmentDto } from '@packages/shared-types';

// ✅ Correcto - Importar directamente
// apps/frontend/src/features/appointment/list/ui/AppointmentsList.tsx
import type { AppointmentDto } from '@packages/shared-types';
```

**Razón:** Hace explícito el origen del tipo (contrato de API)

---

## Configuración de TypeScript

### Frontend (`apps/frontend/tsconfig.json`)

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@packages/*": ["../../packages/*"],
      "@shared/*": ["./src/shared/*"],
      "@app/*": ["./src/app/*"],
      "@pages/*": ["./src/pages/*"],
      "@widgets/*": ["./src/widgets/*"],
      "@features/*": ["./src/features/*"],
      "@entities/*": ["./src/entities/*"]
    }
  }
}
```

### Backend (`apps/backend/tsconfig.json`)

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@packages/*": ["../../packages/*"],
      "@shared/*": ["./src/shared/*"],
      "@appointment/*": ["./src/appointment/*"],
      "@availability/*": ["./src/availability/*"],
      "@auth/*": ["./src/auth/*"]
    }
  }
}
```

---

## Configuración de Vite (Frontend)

```typescript
// apps/frontend/vite.config.ts
import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@packages': path.resolve(__dirname, '../../packages'),
      '@shared': path.resolve(__dirname, './src/shared'),
      '@app': path.resolve(__dirname, './src/app'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@widgets': path.resolve(__dirname, './src/widgets'),
      '@features': path.resolve(__dirname, './src/features'),
      '@entities': path.resolve(__dirname, './src/entities'),
    },
  },
});
```

---

## Ejemplos Completos

### Frontend Component

```typescript
// apps/frontend/src/features/appointment/list/ui/AppointmentsList.tsx

// 1. Node modules
import { useState } from 'react';
import { Table, Badge } from '@mantine/core';

// 2. Packages del monorepo
import type { AppointmentDto, AppointmentStatus } from '@packages/shared-types';

// 3. Shared de la app
import { ENDPOINTS } from '@shared/api/endpoints';
import { formatDate } from '@shared/lib/date';
import { APPOINTMENT_STATUS_COLORS } from '@shared/config/constants';

// 4. Entities
import { useAppointments } from '@entities/appointment';

// 5. Relativos
import { AppointmentFilters } from './AppointmentFilters';

export function AppointmentsList() {
  // Component implementation
}
```

### Backend Command Handler

```typescript
// apps/backend/src/appointment/app/commands/create-appointment/handler.ts

// 1. Node modules
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

// 2. Packages del monorepo
import type { CreateAppointmentResponseDto } from '@packages/shared-types';

// 3. Shared del backend
import { IUnitOfWork } from '@shared/kernel/uow';
import { UUID } from '@shared/vo/uuid';

// 4. Domain del mismo BC
import { Appointment } from '../../domain/aggregates/appointment';
import { IAppointmentWriteRepository } from '../../domain/interfaces/repositories/appointment-write';

// 5. Relativos
import { CreateAppointmentCommand } from './command';

@CommandHandler(CreateAppointmentCommand)
export class CreateAppointmentHandler 
  implements ICommandHandler<CreateAppointmentCommand> {
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

---

## Referencias

- [TypeScript Path Mapping](https://www.typescriptlang.org/docs/handbook/module-resolution.html#path-mapping)
- [Vite Resolve Alias](https://vitejs.dev/config/shared-options.html#resolve-alias)
- [Feature-Sliced Design](https://feature-sliced.design/)

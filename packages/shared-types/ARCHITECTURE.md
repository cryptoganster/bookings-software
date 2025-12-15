# Arquitectura: API Contract Layer

## 🎯 Visión General

```
┌─────────────────────────────────────────────────────────────────┐
│                    @bookings/shared-types                       │
│                    (API Contract Layer)                         │
│                                                                 │
│  ┌───────────────────────────────────────────────────────┐    │
│  │  DTOs (Data Transfer Objects)                         │    │
│  │  - LoginRequestDto, LoginResponseDto                  │    │
│  │  - AppointmentDto, CreateAppointmentRequestDto        │    │
│  │  - UserDto, OfferingDto, etc.                         │    │
│  └───────────────────────────────────────────────────────┘    │
│                                                                 │
│  ┌───────────────────────────────────────────────────────┐    │
│  │  Tipos Públicos                                       │    │
│  │  - AppointmentStatus, PaginatedResponseDto            │    │
│  │  - ApiErrorDto, SuccessResponseDto                    │    │
│  └───────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                    ↑                              ↑
                    │                              │
            depende │                              │ depende
                    │                              │
    ┌───────────────┴──────────────┐   ┌──────────┴─────────────┐
    │   Backend (NestJS)           │   │   Frontend (React)     │
    │                              │   │                        │
    │  ┌────────────────────────┐ │   │  ┌──────────────────┐ │
    │  │  Domain Layer          │ │   │  │  UI Layer        │ │
    │  │  - Aggregates          │ │   │  │  - Components    │ │
    │  │  - Value Objects       │ │   │  │  - Hooks         │ │
    │  │  - Domain Events       │ │   │  │  - State         │ │
    │  └────────────────────────┘ │   │  └──────────────────┘ │
    │            ↑                 │   │          ↑             │
    │  ┌────────┴───────────────┐ │   │  ┌───────┴──────────┐ │
    │  │  Application Layer     │ │   │  │  API Layer       │ │
    │  │  - Commands/Queries    │ │   │  │  - API Client    │ │
    │  │  - Handlers            │ │   │  │  - Queries       │ │
    │  └────────────────────────┘ │   │  └──────────────────┘ │
    │            ↑                 │   │          ↑             │
    │  ┌────────┴───────────────┐ │   │          │             │
    │  │  Presentation Layer    │ │   │          │             │
    │  │  - Controllers         │ │   │          │             │
    │  │  - Mappers (→DTO)      │◄─┼───┼──────────┘             │
    │  └────────────────────────┘ │   │                        │
    └──────────────────────────────┘   └────────────────────────┘
```

## 🔄 Flujo de Datos

### Request Flow (Frontend → Backend)

```
1. Usuario interactúa con UI
   ↓
2. Component llama a Hook
   ↓
3. Hook usa API Client con DTO
   LoginRequestDto { email, password }
   ↓
4. HTTP POST /auth/login
   ↓
5. Backend Controller recibe DTO
   ↓
6. class-validator valida DTO
   ↓
7. Controller ejecuta Command/Query
   ↓
8. Application Layer ejecuta lógica
   ↓
9. Domain Layer procesa negocio
```

### Response Flow (Backend → Frontend)

```
1. Domain retorna resultado
   ↓
2. Application Layer obtiene resultado
   ↓
3. Controller mapea Domain → DTO
   UserMapper.toDto(user) → UserDto
   ↓
4. HTTP Response con DTO
   LoginResponseDto { user: UserDto, token: string }
   ↓
5. API Client recibe DTO tipado
   ↓
6. Hook procesa respuesta
   ↓
7. State se actualiza
   ↓
8. UI se re-renderiza
```

## 🏗️ Capas y Responsabilidades

### Backend

| Capa | Responsabilidad | Conoce |
|------|----------------|--------|
| **Domain** | Lógica de negocio | Solo sí mismo |
| **Application** | Casos de uso | Domain |
| **Presentation** | API HTTP, Mappers | Application + **shared-types** |
| **Infrastructure** | BD, APIs externas | Domain interfaces |

### Frontend

| Capa | Responsabilidad | Conoce |
|------|----------------|--------|
| **UI** | Componentes React | API Layer |
| **API** | HTTP Client | **shared-types** |
| **State** | Zustand, TanStack Query | API Layer |
| **Utils** | Helpers, formatters | Nada específico |

### Shared Types

| Responsabilidad | NO Conoce |
|----------------|-----------|
| Definir contratos | Backend Domain |
| DTOs de API | Frontend UI |
| Tipos públicos | Implementaciones |

## 🎨 Patrones Aplicados

### 1. Dependency Inversion Principle (SOLID)

```
High-level modules (Backend Domain, Frontend UI)
        ↓ dependen de
Abstractions (shared-types)
        ↑ NO dependen de
Low-level modules (Controllers, API Client)
```

### 2. Ports & Adapters (Hexagonal)

```
┌─────────────────────────────────────┐
│         Application Core            │
│      (Backend Domain Logic)         │
└─────────────────────────────────────┘
              ↑ Port (Interface)
┌─────────────┴─────────────┐
│  Adapter (Controller)     │
│  Implementa: shared-types │
└───────────────────────────┘
```

### 3. Anti-Corruption Layer (DDD)

```
Backend Domain ←→ [Mapper] ←→ DTO ←→ [API] ←→ Frontend

Mapper protege el dominio de cambios externos
```

### 4. Published Language (DDD)

```
shared-types = Published Language del sistema
Todos los Bounded Contexts lo entienden
```

## 📊 Comparación: Antes vs Después

### ❌ Antes (Acoplado)

```typescript
// Frontend importa del backend - ACOPLAMIENTO
import { UserReadModel } from '../../../apps/backend/src/auth/domain/read-models/user';

// Problemas:
// - Frontend conoce estructura interna del backend
// - Cambios en backend rompen frontend
// - No se puede tener múltiples frontends
// - Difícil de versionar
```

### ✅ Después (Desacoplado)

```typescript
// Ambos usan el contrato - SIN ACOPLAMIENTO
import { UserDto } from '@bookings/shared-types';

// Ventajas:
// - Frontend solo conoce el contrato
// - Backend puede cambiar internamente
// - Múltiples frontends usan mismo contrato
// - Fácil de versionar (UserDtoV2)
```

## 🚀 Escalabilidad

### Múltiples Frontends

```
┌─────────────────────┐
│  shared-types       │
└─────────────────────┘
    ↑       ↑       ↑
    │       │       │
┌───┴───┐ ┌─┴─────┐ ┌─┴──────┐
│  Web  │ │ Mobile│ │ Desktop│
└───────┘ └───────┘ └────────┘
```

### Versionado de API

```
┌─────────────────────────────┐
│  shared-types               │
│  - v1/                      │
│    - UserDto                │
│  - v2/                      │
│    - UserDtoV2              │
└─────────────────────────────┘
         ↑
         │
┌────────┴────────┐
│  Backend        │
│  - /v1/users    │
│  - /v2/users    │
└─────────────────┘
```

### Microservicios (Futuro)

```
┌─────────────────────┐
│  shared-types       │
└─────────────────────┘
    ↑       ↑       ↑
    │       │       │
┌───┴───┐ ┌─┴─────┐ ┌─┴──────┐
│ Auth  │ │Booking│ │Messaging│
│Service│ │Service│ │ Service │
└───────┘ └───────┘ └─────────┘
```

## 🎓 Principios de Clean Architecture

### 1. Dependency Rule

```
Dependencias apuntan HACIA ADENTRO:

Frameworks/UI → Interface Adapters → Use Cases → Entities

En nuestro caso:
Controllers/API Client → shared-types ← Domain
```

### 2. Stable Abstractions Principle

```
shared-types es ESTABLE (cambia poco)
Backend/Frontend son INESTABLES (cambian frecuentemente)

Inestable depende de Estable ✅
```

### 3. Open/Closed Principle

```
shared-types está CERRADO para modificación
Backend/Frontend están ABIERTOS para extensión

Agregar nuevos endpoints no modifica contratos existentes
```

## 📝 Checklist de Implementación

### Backend
- [ ] Crear Mappers (Domain → DTO)
- [ ] Controllers usan DTOs de shared-types
- [ ] Validación con class-validator en DTOs internos
- [ ] Tests de mappers
- [ ] Tests de controllers con DTOs

### Frontend
- [ ] API Client usa DTOs de shared-types
- [ ] Hooks tipados con DTOs
- [ ] Components usan hooks tipados
- [ ] Tests con mocks de DTOs
- [ ] Error handling con ApiErrorDto

### Shared Types
- [x] DTOs definidos
- [x] Tipos públicos definidos
- [x] Documentación completa
- [x] Ejemplos de uso
- [x] Build configurado

## ✨ Resultado Final

Una arquitectura:
- ✅ **Desacoplada**: Backend y Frontend independientes
- ✅ **Escalable**: Soporta crecimiento sin refactoring
- ✅ **Mantenible**: Cambios localizados
- ✅ **Testeable**: Fácil de mockear
- ✅ **Profesional**: Mejores prácticas de la industria
- ✅ **Type-Safe**: TypeScript end-to-end

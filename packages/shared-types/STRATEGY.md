# Estrategia de Tipos Compartidos - Clean Architecture

## 🎯 Solución Implementada: API Contract Layer

Hemos implementado la **Opción Correcta** siguiendo Clean Architecture, DDD y CQRS:

### Arquitectura de Capas

```
┌─────────────────────────────────────────────────────────┐
│                  @bookings/shared-types                 │
│                  (API Contract Layer)                   │
│              - DTOs de Request/Response                 │
│              - Tipos públicos del dominio               │
│              - Contrato explícito de la API             │
└─────────────────────────────────────────────────────────┘
                    ↑                        ↑
                    │                        │
            depende │                        │ depende
                    │                        │
    ┌───────────────┴──────────┐   ┌────────┴────────────┐
    │   Backend (NestJS)       │   │  Frontend (React)   │
    │                          │   │                     │
    │  Domain Layer:           │   │  UI Layer:          │
    │  - Aggregates            │   │  - Components       │
    │  - Value Objects         │   │  - Hooks            │
    │  - Domain Events         │   │  - State            │
    │                          │   │                     │
    │  Application Layer:      │   │  API Layer:         │
    │  - Commands/Queries      │   │  - API Client       │
    │  - Handlers              │   │  - Queries          │
    │                          │   │                     │
    │  Presentation Layer:     │   │                     │
    │  - Controllers           │   │                     │
    │  - Mappers (Domain→DTO)  │   │  - Mappers (DTO→UI) │
    └──────────────────────────┘   └─────────────────────┘
```

## ✅ Por Qué Esta Solución es Correcta

### 1. Sin Acoplamiento (Dependency Inversion)

**❌ Problema del acoplamiento directo:**

```typescript
// Frontend importando del backend - ACOPLAMIENTO
import { UserReadModel } from "../../../apps/backend/src/auth/domain/read-models/user";
```

**✅ Solución con contrato:**

```typescript
// Ambos dependen del contrato - SIN ACOPLAMIENTO
import { UserDto } from "@bookings/shared-types";
```

### 2. Separación de Responsabilidades

| Capa                     | Responsabilidad    | Ejemplo                                 |
| ------------------------ | ------------------ | --------------------------------------- |
| **Backend Domain**       | Lógica de negocio  | `UserAggregate`, `AppointmentAggregate` |
| **Backend Presentation** | Mapeo Domain → DTO | `UserMapper.toDto(user)`                |
| **Shared Types**         | Contrato de API    | `UserDto`, `AppointmentDto`             |
| **Frontend API**         | Consumo de API     | `apiClient.get<UserDto>()`              |
| **Frontend UI**          | Presentación       | Componentes React                       |

### 3. Independencia de Evolución

**Backend puede cambiar internamente:**

```typescript
// Backend cambia su dominio interno
class User extends VersionedAggregateRoot {
  // Agrega nuevos campos internos
  private internalScore: number;

  // Pero el DTO público no cambia
  toDto(): UserDto {
    return {
      id: this.id,
      email: this.email,
      name: this.name,
      // internalScore NO se expone
    };
  }
}
```

**Frontend puede cambiar su UI:**

```typescript
// Frontend cambia su estado interno
interface UserUIState {
  user: UserDto; // Sigue usando el contrato
  isEditing: boolean; // Estado local de UI
  validationErrors: string[];
}
```

## 🏗️ Implementación en el Backend

### Paso 1: Mappers (Domain → DTO)

```typescript
// apps/backend/src/auth/presentation/mappers/user.mapper.ts
import { UserDto } from "@bookings/shared-types";
import { UserReadModel } from "../../domain/read-models/user";

export class UserMapper {
  static toDto(user: UserReadModel): UserDto {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      businessId: user.businessId,
      createdAt: user.createdAt.toISOString(), // Date → string
    };
  }
}
```

### Paso 2: Controllers usan DTOs

```typescript
// apps/backend/src/auth/presentation/controllers/auth.controller.ts
import { LoginRequestDto, LoginResponseDto } from "@bookings/shared-types";
import { UserMapper } from "../mappers/user.mapper";

@Controller("auth")
export class AuthController {
  @Post("login")
  async login(@Body() dto: LoginRequestDto): Promise<LoginResponseDto> {
    // 1. Validar con class-validator (interno del backend)
    // 2. Ejecutar lógica de dominio
    const user = await this.authService.validateUser(dto.email, dto.password);

    // 3. Mapear Domain → DTO para respuesta
    return {
      user: UserMapper.toDto(user),
      token: this.jwtService.sign({ userId: user.id }),
    };
  }
}
```

## 🎨 Implementación en el Frontend

### Paso 1: API Client usa DTOs

```typescript
// apps/frontend/src/shared/api/auth.api.ts
import { LoginRequestDto, LoginResponseDto } from "@bookings/shared-types";
import { apiClient } from "./client";

export const authApi = {
  login: async (credentials: LoginRequestDto): Promise<LoginResponseDto> => {
    const response = await apiClient.post<LoginResponseDto>(
      "/auth/login",
      credentials,
    );
    return response.data;
  },
};
```

### Paso 2: Hooks consumen DTOs

```typescript
// apps/frontend/src/features/auth/login/model/useLogin.ts
import { useMutation } from "@tanstack/react-query";
import { LoginRequestDto, LoginResponseDto } from "@bookings/shared-types";
import { authApi } from "@shared/api/auth.api";

export function useLogin() {
  return useMutation<LoginResponseDto, Error, LoginRequestDto>({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      // data es tipado como LoginResponseDto
      useAuthStore.getState().login(data.user, data.token);
    },
  });
}
```

## 📊 Comparación de Enfoques

| Aspecto                 | Importar del Backend | API Contract Layer |
| ----------------------- | -------------------- | ------------------ |
| **Acoplamiento**        | ❌ Alto              | ✅ Ninguno         |
| **Independencia**       | ❌ Baja              | ✅ Alta            |
| **Escalabilidad**       | ❌ Difícil           | ✅ Fácil           |
| **Múltiples frontends** | ❌ No                | ✅ Sí              |
| **Versionado API**      | ❌ Difícil           | ✅ Fácil           |
| **Clean Architecture**  | ❌ Viola             | ✅ Cumple          |
| **DDD Boundaries**      | ❌ Viola             | ✅ Respeta         |
| **Testing**             | ❌ Complicado        | ✅ Simple          |

## 🚀 Beneficios a Largo Plazo

### 1. Múltiples Frontends

```typescript
// Web, Mobile, Desktop pueden usar el mismo contrato
import { AppointmentDto } from "@bookings/shared-types";
```

### 2. Versionado de API

```typescript
// v1
export interface UserDto { ... }

// v2 (breaking change)
export interface UserDtoV2 { ... }

// Backend soporta ambas versiones
@Get('v1/users')
async getUsersV1(): Promise<UserDto[]> { ... }

@Get('v2/users')
async getUsersV2(): Promise<UserDtoV2[]> { ... }
```

### 3. Documentación Automática

```typescript
// OpenAPI/Swagger puede generar docs desde los DTOs
@ApiResponse({ type: LoginResponseDto })
async login() { ... }
```

### 4. Testing Simplificado

```typescript
// Mock del contrato, no del backend completo
const mockLoginResponse: LoginResponseDto = {
  user: { id: '1', email: 'test@test.com', ... },
  token: 'mock-token'
};
```

## 📝 Convenciones Establecidas

1. **Sufijo `Dto`**: Claridad de que es un Data Transfer Object
2. **Fechas como strings**: ISO 8601 para serialización JSON
3. **Interfaces puras**: Sin clases, sin métodos, sin lógica
4. **Nullables explícitos**: `string | null` en lugar de `string?`
5. **Sin dependencias**: Package independiente

## 🎓 Principios Aplicados

### Clean Architecture

- ✅ Dependency Rule: Dependencias apuntan hacia adentro
- ✅ Entities/Domain no dependen de nada externo
- ✅ Use Cases/Application dependen solo de Domain
- ✅ Frameworks/UI dependen de abstracciones

### DDD (Domain-Driven Design)

- ✅ Bounded Context boundaries respetados
- ✅ Published Language (el contrato) explícito
- ✅ Anti-Corruption Layer (mappers) en ambos lados

### CQRS

- ✅ Commands y Queries separados en DTOs
- ✅ Read Models y Write Models independientes

### Hexagonal Architecture (Ports & Adapters)

- ✅ Ports: `@bookings/shared-types` (interfaces)
- ✅ Adapters: Backend Controllers, Frontend API Client

## ✨ Conclusión

Esta arquitectura es:

- ✅ **Escalable**: Soporta crecimiento sin refactoring masivo
- ✅ **Mantenible**: Cambios localizados, sin efectos en cascada
- ✅ **Testeable**: Fácil de mockear y testear
- ✅ **Profesional**: Sigue las mejores prácticas de la industria
- ✅ **Sin acoplamiento**: Backend y Frontend completamente independientes
- ✅ **Reutilizable**: Un contrato, múltiples consumidores

# @bookings/shared-types

**API Contract Layer** - Contrato de comunicación entre Backend y Frontend

## 🎯 Propósito

Este package define el **contrato de API** entre backend y frontend, siguiendo los principios de:
- **Clean Architecture** - Dependency Inversion Principle
- **Hexagonal Architecture** - Ports & Adapters
- **DDD** - Bounded Context boundaries
- **CQRS** - Separación de Commands y Queries

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────┐
│      @bookings/shared-types             │
│      (API Contract - Ports)             │
│   - Request/Response DTOs               │
│   - Domain types públicos               │
└─────────────────────────────────────────┘
           ↑                    ↑
           │                    │
   depende │                    │ depende
           │                    │
┌──────────┴──────────┐  ┌─────┴──────────┐
│  Backend (NestJS)   │  │ Frontend (React)│
│  - Implementa DTOs  │  │ - Consume DTOs  │
│  - Mapea a Domain   │  │ - Usa para API  │
└─────────────────────┘  └─────────────────┘
```

## ✅ Ventajas de esta Arquitectura

1. **Sin Acoplamiento**: Backend y Frontend no se conocen entre sí
2. **Independencia**: Cada lado puede evolucionar independientemente
3. **Contrato Explícito**: La API está claramente definida
4. **Versionable**: Fácil de versionar (v1, v2, etc.)
5. **Reutilizable**: Múltiples frontends pueden usar el mismo contrato
6. **Testeable**: Fácil de mockear y testear

## 📦 Qué Contiene

### DTOs de Request/Response
- Tipos que viajan por la API (HTTP)
- Formato JSON serializable
- Fechas como strings ISO 8601

### Tipos de Dominio Públicos
- Enums y tipos compartidos
- Status, roles, etc.

### NO Contiene
- ❌ Lógica de negocio
- ❌ Validaciones (eso va en backend)
- ❌ Clases con métodos
- ❌ Dependencias de frameworks

## 🔧 Uso

### En el Backend

```typescript
// Implementar el contrato
import { LoginRequestDto, LoginResponseDto } from '@bookings/shared-types';

@Post('login')
async login(@Body() dto: LoginRequestDto): Promise<LoginResponseDto> {
  // Backend mapea su dominio interno al DTO del contrato
  const user = await this.authService.validateUser(dto.email, dto.password);
  return {
    user: this.mapToUserDto(user), // Mapper: Domain → DTO
    token: this.generateToken(user)
  };
}
```

### En el Frontend

```typescript
// Consumir el contrato
import { LoginRequestDto, LoginResponseDto } from '@bookings/shared-types';

async function login(credentials: LoginRequestDto): Promise<LoginResponseDto> {
  const response = await apiClient.post<LoginResponseDto>('/auth/login', credentials);
  return response.data;
}
```

## 📋 Tipos Incluidos

### Authentication
- `LoginRequestDto`, `LoginResponseDto`
- `RegisterRequestDto`
- `UserDto`

### Appointments
- `AppointmentDto`
- `CreateAppointmentRequestDto`, `CreateAppointmentResponseDto`
- `AppointmentFiltersDto`
- `AppointmentStatus`

### Offerings
- `OfferingDto`
- `CreateOfferingRequestDto`

### Generic
- `PaginatedResponseDto<T>`
- `ApiErrorDto`
- `SuccessResponseDto<T>`, `ErrorResponseDto`

## 🔨 Building

```bash
pnpm build
```

## 📝 Convenciones

1. **Sufijo `Dto`**: Todos los tipos llevan sufijo `Dto` para claridad
2. **Fechas como strings**: Usar ISO 8601 format
3. **Nullables explícitos**: `string | null` en lugar de `string?`
4. **Interfaces, no clases**: Solo interfaces TypeScript puras
5. **Sin dependencias**: No depender de otros packages

## 🚀 Versionado

Para cambios breaking, crear versiones:

```typescript
// v1
export interface UserDto { ... }

// v2 (breaking change)
export interface UserDtoV2 { ... }
```

## 🎓 Principios Aplicados

### Dependency Inversion Principle (SOLID)
Backend y Frontend dependen de la abstracción (este contrato), no entre sí.

### Ports & Adapters (Hexagonal)
Este package define los "Ports" (interfaces) que ambos lados implementan.

### Bounded Context (DDD)
Define el límite entre contextos, la "Published Language" del sistema.

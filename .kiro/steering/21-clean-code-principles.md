---
inclusion: always
---

# Clean Code & SOLID Principles

**Clean code practices and SOLID principles applied in the project**

> **Cross-References:**
>
> - [20-nestjs-implementation.md](./20-nestjs-implementation.md) - NestJS patterns
> - [30-naming-conventions.md](./30-naming-conventions.md) - Naming conventions
> - [11-ddd-tactical-patterns.md](./11-ddd-tactical-patterns.md) - DDD patterns

---

# Clean Code & SOLID Principles

Prácticas de código limpio y principios SOLID aplicados en el proyecto.

## SOLID Principles

| Principio   | Descripción                             | ✅ Bien                                                      | ❌ Mal                                               |
| ----------- | --------------------------------------- | ------------------------------------------------------------ | ---------------------------------------------------- |
| **S - SRP** | Una clase, una razón para cambiar       | `CreateAppointmentHandler` solo crea                         | `AppointmentHandler` con create/cancel/modify/notify |
| **O - OCP** | Abierto extensión, cerrado modificación | Interface `IWhatsAppClient` + múltiples implementaciones     | Modificar clase base para cada variante              |
| **L - LSP** | Subtipos sustituibles por tipos base    | `AppointmentStatus extends ValueObject` respeta contrato     | Override que rompe comportamiento esperado           |
| **I - ISP** | Interfaces específicas > generales      | `IAppointmentWriteRepository` + `IAppointmentReadRepository` | `IAppointmentRepository` monolítica                  |
| **D - DIP** | Depender de abstracciones               | `@Inject('IRepository') repo: IRepository`                   | `repo: ConcreteRepository`                           |

### DIP Ejemplo

```typescript
// ✅ Handler depende de interfaz
@CommandHandler(CreateAppointmentCommand)
export class CreateAppointmentHandler {
  constructor(@Inject('IAppointmentWriteRepository') private readonly repo: IAppointmentWriteRepository) {}
}

// Module provee implementación
@Module({ providers: [{ provide: 'IAppointmentWriteRepository', useClass: AppointmentWriteRepository }] })
```

## Clean Code Practices

| Práctica          | ✅ Bien                                                 | ❌ Mal                                     |
| ----------------- | ------------------------------------------------------- | ------------------------------------------ |
| **Nombres**       | `CreateAppointmentCommand`, `calculateAvailableSlots()` | `CAC`, `calc()`, `flag`                    |
| **Funciones**     | Pequeñas, una responsabilidad                           | 50+ líneas con múltiples responsabilidades |
| **Comentarios**   | Código auto-explicativo                                 | Comentarios obvios en cada línea           |
| **Errores**       | `AppointmentNotFoundException(id)`                      | `throw new Error('Not found')`             |
| **Constantes**    | `MAX_ACTIVE_APPOINTMENTS = 3`                           | `if (appointments.length >= 3)`            |
| **Inmutabilidad** | `readonly`, factory methods, no setters                 | `setValue(value)` mutables                 |
| **Composición**   | `private status: AppointmentStatus`                     | Herencia profunda de 4+ niveles            |

### Funciones Pequeñas

```typescript
// ✅ Una responsabilidad por función
async function createAppointment(command: CreateAppointmentCommand) {
  await validateAvailability(command);
  const appointment = buildAppointment(command);
  await persistAppointment(appointment);
  return appointment.getId();
}
```

### Manejo de Errores

```typescript
// ✅ Excepciones específicas
export class AppointmentNotFoundException extends DomainException {
  constructor(appointmentId: string) {
    super(`Appointment with id ${appointmentId} not found`);
  }
}
```

## TypeScript Best Practices

| Práctica       | ✅ Bien                            | ❌ Mal                |
| -------------- | ---------------------------------- | --------------------- |
| **Tipado**     | `Promise<CreateAppointmentResult>` | `Promise<any>`        |
| **any**        | `unknown` + type guards            | `any` en todas partes |
| **Interfaces** | Contratos de objetos, extensión    | -                     |
| **Types**      | Union types, tipos complejos       | -                     |

```typescript
// ✅ Tipado fuerte
interface CreateAppointmentResult {
  appointmentId: string;
}
type AppointmentStatusValue = "CONFIRMED" | "CANCELLED" | "COMPLETED";
type Result<T> = { success: true; data: T } | { success: false; error: string };
```

## Testing Best Practices

| Práctica          | ✅ Bien                                                | ❌ Mal                      |
| ----------------- | ------------------------------------------------------ | --------------------------- |
| **Nombres**       | `should create appointment when capacity is available` | `test1`, `works`            |
| **Estructura**    | Arrange-Act-Assert                                     | Todo mezclado               |
| **Independencia** | `beforeEach` con setup fresco                          | Tests que dependen de otros |

```typescript
it('should create appointment', async () => {
  // Arrange
  const command = new CreateAppointmentCommand(...);
  mockCapacityRepo.findByOfferingAndDate.mockResolvedValue(capacity);
  // Act
  const result = await handler.execute(command);
  // Assert
  expect(result.appointmentId).toBeDefined();
});
```

## Naming Conventions

> **📖 Complete Naming Conventions:** See [30-naming-conventions.md](./30-naming-conventions.md)

| Elemento       | Convención     | Ejemplo                    |
| -------------- | -------------- | -------------------------- |
| Classes        | PascalCase     | `CreateAppointmentHandler` |
| Interfaces     | PascalCase + I | `IAppointmentRepository`   |
| Types          | PascalCase     | `AppointmentStatus`        |
| Functions      | camelCase      | `createAppointment()`      |
| Variables      | camelCase      | `appointmentId`            |
| Constants      | UPPER_SNAKE    | `MAX_RETRIES`              |
| Private fields | camelCase + \_ | `_status`                  |

## File Naming

| Tipo          | Patrón                                                           |
| ------------- | ---------------------------------------------------------------- |
| Aggregates    | `appointment.aggregate.ts`                                       |
| Value Objects | `appointment-status.vo.ts`                                       |
| Commands      | `create-appointment.command.ts`, `create-appointment.handler.ts` |
| Events        | `appointment-created.event.ts`                                   |
| Exceptions    | `appointment-not-found.exception.ts`                             |
| Interfaces    | `appointment-write.repository.interface.ts`                      |
| Tests         | `appointment.aggregate.spec.ts`                                  |

## Imports Organization

> **📖 Complete Import Conventions:** See [31-import-conventions.md](./31-import-conventions.md)

```typescript
// 1. Node modules
import { Injectable } from "@nestjs/common";
// 2. Shared
import { IUnitOfWork } from "@shared/kernel/uow.interface";
// 3. Domain
import { Appointment } from "../domain/aggregates/appointment.aggregate";
// 4. Application
import { CreateAppointmentCommand } from "./create-appointment.command";
// 5. Infrastructure
import { IAppointmentWriteRepository } from "../domain/interfaces/repositories/...";
```

## Code Review Checklist

**Antes de Commit:** Compila ✓ Tests pasan ✓ Sin console.log ✓ Sin código comentado ✓ Nombres descriptivos ✓ Funciones pequeñas ✓ SOLID ✓ Tipado fuerte ✓ Manejo errores ✓

**Antes de PR:** Tests pasan ✓ Cobertura adecuada ✓ Docs actualizados ✓ Sin TODOs ✓ Commits descriptivos ✓ Branch actualizado ✓

## Anti-Patterns

| Anti-Pattern            | Descripción                        | Solución                           |
| ----------------------- | ---------------------------------- | ---------------------------------- |
| **God Class**           | Clase que hace todo                | Separar responsabilidades          |
| **Primitive Obsession** | `status: string`                   | Value Objects: `AppointmentStatus` |
| **Feature Envy**        | Método usa más datos de otra clase | Mover lógica al aggregate          |
| **Long Parameter List** | 8+ parámetros                      | Usar objeto/command                |

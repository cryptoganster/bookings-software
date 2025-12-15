# Clean Code & SOLID Principles

Este documento define las prácticas de código limpio y principios SOLID aplicados en el proyecto.

## SOLID Principles

### S - Single Responsibility Principle (SRP)

**Una clase debe tener una sola razón para cambiar**

✅ **Bien:**
```typescript
// Una responsabilidad: Crear appointments
@CommandHandler(CreateAppointmentCommand)
export class CreateAppointmentHandler {
  async execute(command: CreateAppointmentCommand) {
    // Solo lógica de creación
  }
}

// Otra responsabilidad: Cancelar appointments
@CommandHandler(CancelAppointmentCommand)
export class CancelAppointmentHandler {
  async execute(command: CancelAppointmentCommand) {
    // Solo lógica de cancelación
  }
}
```

❌ **Mal:**
```typescript
// Múltiples responsabilidades
export class AppointmentHandler {
  create() { /* ... */ }
  cancel() { /* ... */ }
  modify() { /* ... */ }
  sendNotification() { /* ... */ }
  validateAvailability() { /* ... */ }
}
```

### O - Open/Closed Principle (OCP)

**Abierto para extensión, cerrado para modificación**

✅ **Bien:**
```typescript
// Interfaz estable
interface IWhatsAppClient {
  sendMessage(to: string, message: string): Promise<void>;
}

// Implementaciones diferentes sin modificar interfaz
class WhatsAppBusinessApiClient implements IWhatsAppClient {
  async sendMessage(to: string, message: string) {
    // Implementación real
  }
}

class MockWhatsAppClient implements IWhatsAppClient {
  async sendMessage(to: string, message: string) {
    // Implementación mock para tests
  }
}
```

### L - Liskov Substitution Principle (LSP)

**Los subtipos deben ser sustituibles por sus tipos base**

✅ **Bien:**
```typescript
abstract class ValueObject {
  abstract equals(other: ValueObject): boolean;
  protected abstract getEqualityComponents(): any[];
}

class AppointmentStatus extends ValueObject {
  equals(other: ValueObject): boolean {
    // Implementación correcta que respeta contrato
    return super.equals(other);
  }
  
  protected getEqualityComponents(): any[] {
    return [this.value];
  }
}
```

### I - Interface Segregation Principle (ISP)

**Muchas interfaces específicas mejor que una general**

✅ **Bien:**
```typescript
// Interfaces segregadas
interface IAppointmentWriteRepository {
  save(appointment: Appointment): Promise<void>;
  findById(id: UUID): Promise<Appointment | null>;
}

interface IAppointmentReadRepository {
  findById(id: string): Promise<AppointmentReadModel | null>;
  findByCustomerId(customerId: string): Promise<AppointmentReadModel[]>;
  findByBusinessId(businessId: string): Promise<AppointmentReadModel[]>;
}
```

❌ **Mal:**
```typescript
// Interfaz monolítica
interface IAppointmentRepository {
  save(appointment: Appointment): Promise<void>;
  findById(id: UUID): Promise<Appointment | null>;
  findByCustomerId(customerId: string): Promise<AppointmentReadModel[]>;
  findByBusinessId(businessId: string): Promise<AppointmentReadModel[]>;
  generateReport(): Promise<Report>;
  exportToCsv(): Promise<string>;
}
```

### D - Dependency Inversion Principle (DIP)

**Depender de abstracciones, no de concreciones**

✅ **Bien:**
```typescript
// Handler depende de interfaz
@CommandHandler(CreateAppointmentCommand)
export class CreateAppointmentHandler {
  constructor(
    @Inject('IAppointmentWriteRepository')
    private readonly repo: IAppointmentWriteRepository,  // ← Interfaz
  ) {}
}

// Módulo provee implementación
@Module({
  providers: [
    {
      provide: 'IAppointmentWriteRepository',
      useClass: AppointmentWriteRepository,  // ← Implementación
    },
  ],
})
export class BookingModule {}
```

❌ **Mal:**
```typescript
// Handler depende de implementación concreta
export class CreateAppointmentHandler {
  constructor(
    private readonly repo: AppointmentWriteRepository,  // ← Concreción
  ) {}
}
```

## Clean Code Practices

### Nombres Significativos

✅ **Bien:**
```typescript
// Nombres descriptivos
class CreateAppointmentCommand { }
class AppointmentNotFoundException { }
async function calculateAvailableSlots() { }
const isAppointmentCancellable = appointment.getStatus().canBeCancelled();
```

❌ **Mal:**
```typescript
// Nombres ambiguos
class CAC { }
class NotFoundException { }
async function calc() { }
const flag = appointment.getStatus().canBeCancelled();
```

### Funciones Pequeñas

✅ **Bien:**
```typescript
// Función con una responsabilidad
async function createAppointment(command: CreateAppointmentCommand) {
  await validateAvailability(command);
  const appointment = buildAppointment(command);
  await persistAppointment(appointment);
  return appointment.getId();
}

async function validateAvailability(command: CreateAppointmentCommand) {
  const capacity = await capacityRepo.findByOfferingAndDate(...);
  if (!capacity.hasAvailableSlots()) {
    throw new NoAvailableSlotsException();
  }
}
```

❌ **Mal:**
```typescript
// Función larga con múltiples responsabilidades
async function createAppointment(command: CreateAppointmentCommand) {
  // 50+ líneas de código
  // Validación
  // Construcción
  // Persistencia
  // Notificación
  // Logging
  // etc.
}
```

### Comentarios Mínimos

✅ **Bien:**
```typescript
// Código auto-explicativo
class Appointment {
  cancel(): void {
    if (!this.status.canBeCancelled()) {
      throw new AppointmentCannotBeCancelledException();
    }
    
    this.status = AppointmentStatus.cancelled();
    this.apply(new AppointmentCancelled(this.id));
  }
}
```

❌ **Mal:**
```typescript
// Comentarios innecesarios
class Appointment {
  // Método para cancelar la cita
  cancel(): void {
    // Verificar si se puede cancelar
    if (!this.status.canBeCancelled()) {
      // Lanzar excepción
      throw new AppointmentCannotBeCancelledException();
    }
    
    // Cambiar estado a cancelado
    this.status = AppointmentStatus.cancelled();
    // Aplicar evento
    this.apply(new AppointmentCancelled(this.id));
  }
}
```

### Manejo de Errores

✅ **Bien:**
```typescript
// Excepciones específicas
export class AppointmentNotFoundException extends DomainException {
  constructor(appointmentId: string) {
    super(`Appointment with id ${appointmentId} not found`);
  }
}

// Uso
const appointment = await repo.findById(id);
if (!appointment) {
  throw new AppointmentNotFoundException(id);
}
```

❌ **Mal:**
```typescript
// Excepciones genéricas
throw new Error('Not found');
throw new Error('Something went wrong');
```

### Evitar Números Mágicos

✅ **Bien:**
```typescript
const MAX_ACTIVE_APPOINTMENTS_PER_CUSTOMER = 3;
const MINIMUM_CANCELLATION_NOTICE_HOURS = 2;
const REMINDER_HOURS_BEFORE_APPOINTMENT = 24;

if (activeAppointments.length >= MAX_ACTIVE_APPOINTMENTS_PER_CUSTOMER) {
  throw new MaxActiveAppointmentsExceededException();
}
```

❌ **Mal:**
```typescript
if (activeAppointments.length >= 3) {
  throw new MaxActiveAppointmentsExceededException();
}
```

### Inmutabilidad

✅ **Bien:**
```typescript
// Value Objects inmutables
export class AppointmentStatus {
  private constructor(private readonly value: string) {}
  
  // No setters, solo factory methods
  static confirmed(): AppointmentStatus {
    return new AppointmentStatus('CONFIRMED');
  }
}

// DTOs inmutables
export class CreateAppointmentDto {
  @IsUUID()
  readonly customerId: string;
  
  @IsUUID()
  readonly offeringId: string;
}
```

❌ **Mal:**
```typescript
// Objetos mutables
export class AppointmentStatus {
  value: string;  // ← Mutable
  
  setValue(value: string) {
    this.value = value;
  }
}
```

### Composición sobre Herencia

✅ **Bien:**
```typescript
// Composición
class Appointment {
  private status: AppointmentStatus;  // ← Composición
  private dateTime: DateTime;         // ← Composición
  
  cancel(): void {
    if (!this.status.canBeCancelled()) {
      throw new CannotCancelException();
    }
    this.status = AppointmentStatus.cancelled();
  }
}
```

❌ **Mal:**
```typescript
// Herencia profunda
class Entity { }
class DomainEntity extends Entity { }
class BookingEntity extends DomainEntity { }
class Appointment extends BookingEntity { }
```

## TypeScript Best Practices

### Tipado Fuerte

✅ **Bien:**
```typescript
// Tipos específicos
interface CreateAppointmentResult {
  appointmentId: string;
}

async function createAppointment(
  command: CreateAppointmentCommand
): Promise<CreateAppointmentResult> {
  // ...
}

// Union types
type AppointmentStatusValue = 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';

// Generics
class Repository<T extends AggregateRoot> {
  async save(entity: T): Promise<void> { }
}
```

❌ **Mal:**
```typescript
// any en todas partes
async function createAppointment(command: any): Promise<any> {
  // ...
}

// Tipos ambiguos
type Status = string;
```

### Evitar any

✅ **Bien:**
```typescript
// Tipos específicos
function processEvent(event: AppointmentCreated): void {
  // event es tipado
}

// unknown cuando no se conoce el tipo
function handleError(error: unknown): void {
  if (error instanceof DomainException) {
    // ...
  }
}
```

❌ **Mal:**
```typescript
function processEvent(event: any): void {
  // Sin type safety
}
```

### Interfaces vs Types

✅ **Usar interfaces para:**
```typescript
// Contratos de objetos
interface IAppointmentRepository {
  save(appointment: Appointment): Promise<void>;
}

// Extensión
interface IExtendedRepository extends IAppointmentRepository {
  findAll(): Promise<Appointment[]>;
}
```

✅ **Usar types para:**
```typescript
// Union types
type AppointmentStatus = 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';

// Tipos complejos
type Result<T> = { success: true; data: T } | { success: false; error: string };
```

## Testing Best Practices

### Nombres Descriptivos

✅ **Bien:**
```typescript
describe('CreateAppointmentHandler', () => {
  it('should create appointment when capacity is available', async () => {
    // ...
  });
  
  it('should throw NoAvailableSlotsException when capacity is full', async () => {
    // ...
  });
  
  it('should decrement capacity after creating appointment', async () => {
    // ...
  });
});
```

❌ **Mal:**
```typescript
describe('Handler', () => {
  it('test1', async () => { });
  it('test2', async () => { });
  it('works', async () => { });
});
```

### Arrange-Act-Assert

✅ **Bien:**
```typescript
it('should create appointment', async () => {
  // Arrange
  const command = new CreateAppointmentCommand(...);
  mockCapacityRepo.findByOfferingAndDate.mockResolvedValue(capacity);
  
  // Act
  const result = await handler.execute(command);
  
  // Assert
  expect(result.appointmentId).toBeDefined();
  expect(mockAppointmentRepo.save).toHaveBeenCalled();
});
```

### Tests Independientes

✅ **Bien:**
```typescript
describe('AppointmentAggregate', () => {
  let appointment: Appointment;
  
  beforeEach(() => {
    // Setup fresco para cada test
    appointment = Appointment.create(...);
  });
  
  it('test 1', () => { /* ... */ });
  it('test 2', () => { /* ... */ });
});
```

## Code Review Checklist

### Antes de Commit

- [ ] Código compila sin errores
- [ ] Tests pasan
- [ ] No hay console.log olvidados
- [ ] No hay código comentado
- [ ] Nombres descriptivos
- [ ] Funciones pequeñas
- [ ] SOLID principles aplicados
- [ ] Tipado fuerte (no any)
- [ ] Manejo de errores apropiado

### Antes de PR

- [ ] Todos los tests pasan
- [ ] Cobertura de tests adecuada
- [ ] Documentación actualizada
- [ ] No hay TODOs sin resolver
- [ ] Commits con mensajes descriptivos
- [ ] Branch actualizado con main

## Convenciones de Código

### Naming Conventions

```typescript
// Classes: PascalCase
class CreateAppointmentHandler { }

// Interfaces: PascalCase con I prefix
interface IAppointmentRepository { }

// Types: PascalCase
type AppointmentStatus = ...;

// Functions/Methods: camelCase
async function createAppointment() { }

// Variables: camelCase
const appointmentId = ...;

// Constants: UPPER_SNAKE_CASE
const MAX_RETRIES = 3;

// Private fields: camelCase con _ prefix
class Appointment {
  private _status: AppointmentStatus;
}
```

### File Naming

```
// Aggregates
appointment.aggregate.ts

// Value Objects
appointment-status.vo.ts

// Commands
create-appointment.command.ts
create-appointment.handler.ts

// Queries
get-appointment.query.ts
get-appointment.handler.ts

// Events
appointment-created.event.ts

// Exceptions
appointment-not-found.exception.ts

// Interfaces
appointment-write.repository.interface.ts

// Tests
appointment.aggregate.spec.ts
appointment.aggregate.pbt.spec.ts
```

### Imports Organization

```typescript
// 1. Node modules
import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

// 2. Shared
import { IUnitOfWork } from '@shared/kernel/uow.interface';
import { UUID } from '@shared/vo/uuid.vo';

// 3. Domain
import { Appointment } from '../domain/aggregates/appointment.aggregate';
import { AppointmentStatus } from '../domain/vo/appointment-status.vo';

// 4. Application
import { CreateAppointmentCommand } from './create-appointment.command';

// 5. Infrastructure
import { IAppointmentWriteRepository } from '../domain/interfaces/repositories/appointment-write.repository.interface';
```

## Anti-Patterns a Evitar

❌ **God Class**
```typescript
// Clase que hace todo
class AppointmentManager {
  create() { }
  cancel() { }
  modify() { }
  sendNotification() { }
  validateAvailability() { }
  generateReport() { }
  exportToCsv() { }
}
```

❌ **Primitive Obsession**
```typescript
// Usar primitivos en lugar de Value Objects
function createAppointment(
  id: string,
  status: string,  // ← Debería ser AppointmentStatus
  date: string,    // ← Debería ser DateTime
) { }
```

❌ **Feature Envy**
```typescript
// Método que usa más datos de otra clase
class AppointmentService {
  cancel(appointment: Appointment) {
    if (appointment.getStatus() === 'CONFIRMED' &&
        appointment.getDateTime() > new Date() &&
        !appointment.isCancelled()) {
      // Debería estar en Appointment.cancel()
    }
  }
}
```

❌ **Long Parameter List**
```typescript
// Demasiados parámetros
function createAppointment(
  id: string,
  businessId: string,
  customerId: string,
  offeringId: string,
  date: Date,
  time: string,
  duration: number,
  notes: string,
) { }

// Mejor: usar objeto
function createAppointment(command: CreateAppointmentCommand) { }
```

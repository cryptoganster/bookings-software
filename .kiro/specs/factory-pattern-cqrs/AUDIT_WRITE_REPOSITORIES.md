# Auditoría de Write Repositories - Factory Pattern Migration

**Fecha:** 16 de Diciembre, 2024  
**Propósito:** Documentar todos los write repositories que tienen métodos de lectura y los command handlers que los usan, para migrar al patrón Factory.

---

## Resumen Ejecutivo

**Total de Write Repositories con métodos de lectura:** 4  
**Total de Command Handlers afectados:** 2  
**Bounded Contexts afectados:** 4 (Booking, Offering, Auth, Conversation)

**Estado:**

- ✅ **Availability BC:** Ya migrado (usa CapacityFactory)
- ❌ **Booking BC:** Requiere migración
- ❌ **Offering BC:** Requiere migración
- ❌ **Auth BC:** Requiere migración
- ❌ **Conversation BC:** Requiere migración

---

## 1. Booking BC

### 1.1 Write Repository Interface

**Archivo:** `apps/backend/src/booking/domain/interfaces/repositories/appointment-write.ts`

**Métodos actuales:**

```typescript
export interface IAppointmentWriteRepository {
  save(appointment: Appointment): Promise<void>;
  findById(id: UUID): Promise<Appointment | null>; // ❌ Método de lectura
}
```

**Métodos que deben eliminarse:**

- `findById(id: UUID): Promise<Appointment | null>`

**Métodos que deben permanecer:**

- `save(appointment: Appointment): Promise<void>`

### 1.2 Command Handlers que usan findById

#### CancelAppointmentHandler

**Archivo:** `apps/backend/src/booking/app/commands/cancel-appointment/handler.ts`

**Uso actual:**

```typescript
const appointment = await this.appointmentRepository.findById(
  UUID.fromString(command.appointmentId),
);
```

**Línea:** 37-39

**Acción requerida:**

- Inyectar `IAppointmentFactory`
- Reemplazar `appointmentRepository.findById()` con `factory.loadById()`
- Mantener `appointmentRepository.save()`

#### ModifyAppointmentHandler

**Archivo:** `apps/backend/src/booking/app/commands/modify-appointment/handler.ts`

**Uso actual:**

```typescript
const appointment = await this.appointmentRepository.findById(
  UUID.fromString(command.appointmentId),
);
```

**Línea:** 23-25

**Acción requerida:**

- Inyectar `IAppointmentFactory`
- Reemplazar `appointmentRepository.findById()` con `factory.loadById()`
- Mantener `appointmentRepository.save()`

### 1.3 Archivos a crear

1. **Factory Interface:**
   - `apps/backend/src/booking/domain/interfaces/factories/appointment-factory.ts`
   - Interfaz: `IAppointmentFactory`
   - Método: `loadById(id: string): Promise<Appointment | null>`

2. **Factory Implementation:**
   - `apps/backend/src/booking/infra/persistence/factories/appointment-factory.ts`
   - Clase: `AppointmentFactory implements IAppointmentFactory`
   - Usa: `Repository<AppointmentModel>` de TypeORM
   - Usa: `Appointment.fromPersistence()` para reconstrucción

3. **Factory Tests:**
   - `apps/backend/src/booking/infra/persistence/factories/__tests__/appointment-factory.spec.ts`
   - Tests unitarios de factory

### 1.4 Archivos a modificar

1. **Write Repository Interface:**
   - `apps/backend/src/booking/domain/interfaces/repositories/appointment-write.ts`
   - Eliminar: `findById()` method

2. **Write Repository Implementation:**
   - `apps/backend/src/booking/infra/persistence/repositories/appointment-write.ts`
   - Eliminar: `findById()` implementation

3. **Command Handlers:**
   - `apps/backend/src/booking/app/commands/cancel-appointment/handler.ts`
   - `apps/backend/src/booking/app/commands/modify-appointment/handler.ts`
   - Actualizar: Inyectar factory, usar `factory.loadById()`

4. **Module:**
   - `apps/backend/src/booking/booking.module.ts`
   - Agregar: Provider para `IAppointmentFactory`

5. **Tests:**
   - `apps/backend/src/booking/app/commands/cancel-appointment/__tests__/handler.spec.ts`
   - `apps/backend/src/booking/app/commands/modify-appointment/__tests__/handler.spec.ts`
   - Actualizar: Mockear factory en lugar de write repository

---

## 2. Offering BC

### 2.1 Write Repository Interface

**Archivo:** `apps/backend/src/offering/domain/interfaces/repositories/offering-write.ts`

**Métodos actuales:**

```typescript
export interface IOfferingWriteRepository {
  save(offering: Offering): Promise<void>;
  findById(id: UUID): Promise<Offering | null>; // ❌ Método de lectura
}
```

**Métodos que deben eliminarse:**

- `findById(id: UUID): Promise<Offering | null>`

**Métodos que deben permanecer:**

- `save(offering: Offering): Promise<void>`

### 2.2 Command Handlers que usan findById

**Búsqueda realizada:** No se encontraron command handlers usando `findById()` actualmente.

**Nota:** Es posible que los command handlers aún no estén implementados o que usen otros métodos. Verificar durante la implementación.

### 2.3 Archivos a crear

1. **Factory Interface:**
   - `apps/backend/src/offering/domain/interfaces/factories/offering-factory.ts`
   - Interfaz: `IOfferingFactory`
   - Método: `loadById(id: string): Promise<Offering | null>`

2. **Factory Implementation:**
   - `apps/backend/src/offering/infra/persistence/factories/offering-factory.ts`
   - Clase: `OfferingFactory implements IOfferingFactory`

3. **Factory Tests:**
   - `apps/backend/src/offering/infra/persistence/factories/__tests__/offering-factory.spec.ts`

### 2.4 Archivos a modificar

1. **Write Repository Interface:**
   - `apps/backend/src/offering/domain/interfaces/repositories/offering-write.ts`
   - Eliminar: `findById()` method

2. **Write Repository Implementation:**
   - `apps/backend/src/offering/infra/persistence/repositories/offering-write.ts`
   - Eliminar: `findById()` implementation

3. **Module:**
   - `apps/backend/src/offering/offering.module.ts`
   - Agregar: Provider para `IOfferingFactory`

---

## 3. Auth BC

### 3.1 Write Repository Interface

**Archivo:** `apps/backend/src/auth/domain/interfaces/repositories/user-write.ts`

**Métodos actuales:**

```typescript
export interface IUserWriteRepository {
  save(user: User): Promise<void>;
  findById(id: UUID): Promise<User | null>; // ❌ Método de lectura
}
```

**Métodos que deben eliminarse:**

- `findById(id: UUID): Promise<User | null>`

**Métodos que deben permanecer:**

- `save(user: User): Promise<void>`

### 3.2 Command Handlers que usan findById

**Búsqueda realizada:** No se encontraron command handlers usando `findById()` actualmente.

**Nota:** Verificar durante la implementación si hay command handlers que modifican User.

### 3.3 Archivos a crear

1. **Factory Interface:**
   - `apps/backend/src/auth/domain/interfaces/factories/user-factory.ts`
   - Interfaz: `IUserFactory`
   - Método: `loadById(id: string): Promise<User | null>`
   - Método adicional: `loadByEmail(email: string): Promise<User | null>` (si es necesario)

2. **Factory Implementation:**
   - `apps/backend/src/auth/infra/persistence/factories/user-factory.ts`
   - Clase: `UserFactory implements IUserFactory`

3. **Factory Tests:**
   - `apps/backend/src/auth/infra/persistence/factories/__tests__/user-factory.spec.ts`

### 3.4 Archivos a modificar

1. **Write Repository Interface:**
   - `apps/backend/src/auth/domain/interfaces/repositories/user-write.ts`
   - Eliminar: `findById()` method

2. **Write Repository Implementation:**
   - `apps/backend/src/auth/infra/persistence/repositories/user-write.ts`
   - Eliminar: `findById()` implementation

3. **Module:**
   - `apps/backend/src/auth/auth.module.ts`
   - Agregar: Provider para `IUserFactory`

---

## 4. Conversation BC

### 4.1 Write Repository Interface

**Archivo:** `apps/backend/src/conversation/domain/interfaces/repositories/conversation-write.ts`

**Métodos actuales:**

```typescript
export interface IConversationWriteRepository {
  save(conversation: Conversation): Promise<void>;
  findById(id: UUID): Promise<Conversation | null>; // ❌ Método de lectura
}
```

**Métodos que deben eliminarse:**

- `findById(id: UUID): Promise<Conversation | null>`

**Métodos que deben permanecer:**

- `save(conversation: Conversation): Promise<void>`

### 4.2 Command Handlers que usan findById

**Búsqueda realizada:** No se encontraron command handlers usando `findById()` actualmente.

**Nota:** Verificar durante la implementación si hay command handlers que modifican Conversation.

### 4.3 Archivos a crear

1. **Factory Interface:**
   - `apps/backend/src/conversation/domain/interfaces/factories/conversation-factory.ts`
   - Interfaz: `IConversationFactory`
   - Método: `loadById(id: string): Promise<Conversation | null>`

2. **Factory Implementation:**
   - `apps/backend/src/conversation/infra/persistence/factories/conversation-factory.ts`
   - Clase: `ConversationFactory implements IConversationFactory`

3. **Factory Tests:**
   - `apps/backend/src/conversation/infra/persistence/factories/__tests__/conversation-factory.spec.ts`

### 4.4 Archivos a modificar

1. **Write Repository Interface:**
   - `apps/backend/src/conversation/domain/interfaces/repositories/conversation-write.ts`
   - Eliminar: `findById()` method

2. **Write Repository Implementation:**
   - `apps/backend/src/conversation/infra/persistence/repositories/conversation-write.ts`
   - Eliminar: `findById()` implementation

3. **Module:**
   - `apps/backend/src/conversation/conversation.module.ts`
   - Agregar: Provider para `IConversationFactory`

---

## 5. Availability BC (Referencia - Ya Migrado) ✅

### 5.1 Write Repository Interface

**Archivo:** `apps/backend/src/availability/domain/interfaces/repositories/capacity-write.ts`

**Métodos actuales:**

```typescript
export interface ICapacityWriteRepository {
  save(capacity: Capacity): Promise<void>;
  // ✅ NO tiene métodos de lectura
}
```

**Estado:** ✅ **Correcto** - Solo tiene método de escritura

### 5.2 Factory ya implementada

**Factory Interface:** `apps/backend/src/availability/domain/interfaces/factories/capacity-factory.ts`

**Factory Implementation:** `apps/backend/src/availability/infra/persistence/factories/capacity-factory.ts`

**Uso en Command Handler:** `CreateAppointmentHandler` usa `ICapacityFactory.loadByOfferingAndDate()`

**Nota:** Este BC sirve como referencia para la migración de los demás.

---

## Checklist de Migración

### Por cada Bounded Context:

- [ ] **Booking BC**
  - [ ] Crear `IAppointmentFactory` interface
  - [ ] Crear `AppointmentFactory` implementation
  - [ ] Crear tests de factory
  - [ ] Actualizar `CancelAppointmentHandler`
  - [ ] Actualizar `ModifyAppointmentHandler`
  - [ ] Actualizar tests de handlers
  - [ ] Eliminar `findById()` de `IAppointmentWriteRepository`
  - [ ] Eliminar `findById()` de `AppointmentWriteRepository`
  - [ ] Registrar factory en `BookingModule`

- [ ] **Offering BC**
  - [ ] Crear `IOfferingFactory` interface
  - [ ] Crear `OfferingFactory` implementation
  - [ ] Crear tests de factory
  - [ ] Identificar command handlers que modifican Offering
  - [ ] Actualizar command handlers identificados
  - [ ] Actualizar tests de handlers
  - [ ] Eliminar `findById()` de `IOfferingWriteRepository`
  - [ ] Eliminar `findById()` de `OfferingWriteRepository`
  - [ ] Registrar factory en `OfferingModule`

- [ ] **Auth BC**
  - [ ] Crear `IUserFactory` interface
  - [ ] Crear `UserFactory` implementation
  - [ ] Crear tests de factory
  - [ ] Identificar command handlers que modifican User
  - [ ] Actualizar command handlers identificados
  - [ ] Actualizar tests de handlers
  - [ ] Eliminar `findById()` de `IUserWriteRepository`
  - [ ] Eliminar `findById()` de `UserWriteRepository`
  - [ ] Registrar factory en `AuthModule`

- [ ] **Conversation BC**
  - [ ] Crear `IConversationFactory` interface
  - [ ] Crear `ConversationFactory` implementation
  - [ ] Crear tests de factory
  - [ ] Identificar command handlers que modifican Conversation
  - [ ] Actualizar command handlers identificados
  - [ ] Actualizar tests de handlers
  - [ ] Eliminar `findById()` de `IConversationWriteRepository`
  - [ ] Eliminar `findById()` de `ConversationWriteRepository`
  - [ ] Registrar factory en `ConversationModule`

---

## Estadísticas de Migración

### Archivos a crear (total: ~16)

- 4 Factory interfaces (domain)
- 4 Factory implementations (infrastructure)
- 4 Factory test files
- 4 Factory PBT test files (opcional)

### Archivos a modificar (total: ~24)

- 4 Write repository interfaces (eliminar findById)
- 4 Write repository implementations (eliminar findById)
- 4 Modules (registrar factories)
- 2+ Command handlers (Booking BC confirmados)
- 2+ Command handler tests (Booking BC confirmados)
- 4 Write repository tests (actualizar)
- 4+ Command handlers adicionales (otros BCs, por identificar)

### Commits esperados: ~5

1. `feat(booking): implement AppointmentFactory for CQRS strict compliance`
2. `feat(offering): implement OfferingFactory for CQRS strict compliance`
3. `feat(auth): implement UserFactory for CQRS strict compliance`
4. `feat(conversation): implement ConversationFactory for CQRS strict compliance`
5. `test: verify all validations pass`

---

## Próximos Pasos

1. ✅ **Auditoría completada** - Este documento
2. ⏭️ **Implementar Booking BC** - Task 4 en tasks.md
3. ⏭️ **Implementar Offering BC** - Task 5 en tasks.md
4. ⏭️ **Implementar Auth BC** - Task 6 en tasks.md
5. ⏭️ **Implementar Conversation BC** - Task 7 en tasks.md
6. ⏭️ **Validación completa** - Task 9 en tasks.md

---

**Documento generado:** 16 de Diciembre, 2024  
**Última actualización:** 16 de Diciembre, 2024

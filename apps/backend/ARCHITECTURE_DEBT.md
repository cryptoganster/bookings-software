# Architecture Technical Debt

Este documento registra violaciones de arquitectura que deben corregirse.

## 🔴 Violaciones de CQRS Estricto

### Problema: Command Handlers usando Read Repositories

**Regla violada:** Command handlers NO deben usar read repositories. CQRS estricto separa completamente write (commands) y read (queries).

**Archivos afectados:**

1. **`business/app/commands/create-business/handler.ts`**
   - ❌ Usa `IBusinessReadRepository.findByOwnerId()` para validar límite de negocios
   - ❌ Usa `IBusinessReadRepository.findByWhatsAppPhone()` para validar unicidad
2. **`business/app/commands/configure-whatsapp/handler.ts`**
   - ❌ Usa `IBusinessReadRepository.findByWhatsAppPhone()` para validar unicidad

3. **`auth/app/commands/register/handler.ts`**
   - ❌ Usa `IUserReadRepository.findByEmail()` para validar unicidad

4. **`booking/app/commands/create-appointment/handler.ts`**
   - ❌ Usa `ICustomerReadRepository.findById()` para validar existencia

5. **`customer/app/commands/delete-customer/handler.ts`**
   - ❌ Usa `IAppointmentReadRepository.findByCustomerId()` para validar citas futuras

6. **`conversation/app/commands/send-admin-response/handler.ts`**
   - ❌ Usa `IConversationReadRepository` (verificar si es necesario)

### Soluciones Propuestas

#### Opción 1: Domain Services (Recomendado)

Crear domain services que encapsulen las validaciones:

```typescript
// business/domain/services/business-uniqueness-checker.service.ts
@Injectable()
export class BusinessUniquenessChecker {
  constructor(
    @Inject('IBusinessReadRepository')
    private readonly readRepo: IBusinessReadRepository,
  ) {}

  async isWhatsAppPhoneUnique(phone: string): Promise<boolean> {
    const existing = await this.readRepo.findByWhatsAppPhone(phone);
    return !existing;
  }
}

// Uso en command handler
@CommandHandler(CreateBusinessCommand)
export class CreateBusinessHandler {
  constructor(
    private readonly writeRepo: IBusinessWriteRepository,
    private readonly uniquenessChecker: BusinessUniquenessChecker, // ✅ Domain Service
  ) {}

  async execute(command: CreateBusinessCommand) {
    // Validar unicidad usando domain service
    const isUnique = await this.uniquenessChecker.isWhatsAppPhoneUnique(command.whatsappPhone);
    if (!isUnique) {
      throw new WhatsAppPhoneAlreadyExistsException(command.whatsappPhone);
    }
    // ... resto del código
  }
}
```

**Ventajas:**

- ✅ Mantiene CQRS estricto (domain service puede usar read repo internamente)
- ✅ Encapsula lógica de validación
- ✅ Reutilizable en múltiples command handlers
- ✅ Testeable independientemente

#### Opción 2: Queries en Controller (Alternativa)

Ejecutar queries ANTES del command en el controller:

```typescript
// business/presentation/controllers/business.controller.ts
@Controller('businesses')
export class BusinessController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  async create(@Body() dto: CreateBusinessDto) {
    // 1. Validar unicidad con query
    const existing = await this.queryBus.execute(
      new CheckWhatsAppPhoneExistsQuery(dto.whatsappNumber)
    );

    if (existing) {
      throw new ConflictException('WhatsApp number already exists');
    }

    // 2. Ejecutar command
    return this.commandBus.execute(new CreateBusinessCommand(...));
  }
}
```

**Desventajas:**

- ❌ Lógica de negocio en controller (no ideal)
- ❌ Race condition posible entre query y command
- ❌ Menos encapsulado

#### Opción 3: Unique Constraints en BD + Manejo de Errores

Confiar en constraints de BD y manejar errores:

```typescript
@CommandHandler(CreateBusinessCommand)
export class CreateBusinessHandler {
  async execute(command: CreateBusinessCommand) {
    try {
      // Crear sin validación previa
      const business = Business.create(...);
      await this.writeRepo.save(business);
    } catch (error) {
      // Manejar error de constraint único
      if (error.code === '23505') { // PostgreSQL unique violation
        throw new WhatsAppPhoneAlreadyExistsException(command.whatsappPhone);
      }
      throw error;
    }
  }
}
```

**Ventajas:**

- ✅ CQRS estricto
- ✅ Sin race conditions
- ✅ BD garantiza unicidad

**Desventajas:**

- ❌ Menos user-friendly (error después de intentar guardar)
- ❌ Acoplado a detalles de BD

### Recomendación Final

**Usar Opción 1 (Domain Services)** para:

- Validaciones de unicidad
- Verificaciones de existencia
- Reglas de negocio complejas

**Usar Opción 3 (BD Constraints)** como respaldo para garantizar integridad.

## 📋 Plan de Corrección

### Fase 1: Crear Domain Services

- [ ] `BusinessUniquenessChecker` (business BC)
- [ ] `UserUniquenessChecker` (auth BC)
- [ ] `CustomerExistenceChecker` (customer BC)

### Fase 2: Refactorizar Command Handlers

- [ ] `CreateBusinessHandler`
- [ ] `ConfigureWhatsAppHandler`
- [ ] `RegisterHandler`
- [ ] `CreateAppointmentHandler`
- [ ] `DeleteCustomerHandler`
- [ ] `SendAdminResponseHandler`

### Fase 3: Agregar Tests

- [ ] Unit tests para domain services
- [ ] Integration tests para command handlers refactorizados
- [ ] Verificar que no haya regresiones

### Fase 4: Documentar Patrón

- [ ] Actualizar `.kiro/steering/ddd-patterns.md`
- [ ] Agregar ejemplos de domain services
- [ ] Documentar cuándo usar cada opción

## ✅ Comunicación entre BCs (Correcto)

Los siguientes patrones están **correctamente implementados**:

1. **Event Handlers** ✅
   - `OnUserRegisteredHandler` (Account BC escucha Auth BC)
   - Usa `CommandBus` para ejecutar commands
   - No propaga errores (eventual consistency)

2. **Process Managers** ✅
   - `ProcessIncomingMessageHandler` usa `CommandBus` y `QueryBus`
   - No importa aggregates de otros BCs
   - Maneja `ConcurrencyException` con retry logic

3. **Domain Events** ✅
   - `UserRegistered`, `AppointmentCreated`, etc.
   - Publicados automáticamente por aggregates
   - Manejados asíncronamente

## 📊 Estado Actual

**Violaciones CQRS:** 6 command handlers  
**Comunicación entre BCs:** ✅ Correcta (via events + CommandBus/QueryBus)  
**Acoplamiento:** ✅ Cero acoplamiento directo entre BCs

---

**Última actualización:** 2024-12-25  
**Prioridad:** Media (funciona, pero debe corregirse para mantener arquitectura limpia)  
**Estimación:** 2-3 días de trabajo

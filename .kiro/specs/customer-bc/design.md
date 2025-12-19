# Design Document - Customer BC

## 1. Overview

Este documento define el diseño técnico para implementar el Bounded Context de Customer (BC6) siguiendo Clean Architecture, DDD, CQRS estricto y el Factory Pattern.

### User vs Customer - Arquitectura Unificada

> **📖 Referencia Completa:** Ver `.kiro/steering/user-customer-businessowner-architecture.md`

**User (Auth BC)** - Identidad Universal:

- Autenticación (email/password) con roles múltiples
- Un User puede ser BUSINESS_OWNER y/o CUSTOMER simultáneamente
- Preparado para escenario marketplace

**Customer (Customer BC)** - Perfil de Cliente por Negocio:

- Perfil contextual del cliente en un negocio específico
- `userId` opcional: null = anónimo, UUID = registrado
- Multi-tenant: único por (businessId, whatsappPhone)

**Flujo MVP (Customer Anónimo):**

1. Cliente envía mensaje WhatsApp → `IdentifyCustomerCommand`
2. Customer creado con userId=null
3. Cliente agenda citas vía WhatsApp (sin panel web)

**Flujo Futuro (Customer Registrado - Marketplace):**

1. Cliente envía primer mensaje WhatsApp → Customer anónimo creado
2. En primera agenda, bot solicita nombre y email vía WhatsApp
3. Sistema crea User con role=['CUSTOMER'] → `RegisterUserCommand`
4. Customer se vincula a User → `LinkCustomerToUserCommand`
5. Auth BC agrega role CUSTOMER al User (si no lo tiene)
6. Cliente puede acceder al panel web con historial de citas

### Nota sobre shared-types

El `CustomerDto` ya está implementado en `packages/shared-types/src/index.ts` y coincide con el diseño de este BC. No se requieren cambios en shared-types para el MVP ya que Customer BC no expone endpoints REST (es un BC interno usado por Booking BC y Conversation BC).

### 1.1 Arquitectura General

```
Presentation Layer (Controllers)
         ↓
Application Layer (Commands/Queries/Handlers)
         ↓
Domain Layer (Aggregates/VOs/Events/Interfaces)
         ↓
Infrastructure Layer (Repositories/Factories/Mappers/Models)
```

### 1.2 Principios Arquitectónicos

- **Clean Architecture**: Dependencias apuntan hacia el dominio
- **DDD**: Customer como Aggregate Root con lógica de negocio
- **CQRS Estricto**: Separación total entre escritura y lectura
- **Factory Pattern**: ICustomerFactory para cargar aggregates (no findById en WriteRepository)
- **Optimistic Locking**: Campo version para concurrencia
- **Multi-tenancy**: Customer único por (businessId, whatsappPhone)

## 2. Domain Layer

### 2.1 Aggregate Root: Customer

**Ubicación**: `apps/backend/src/customer/domain/aggregates/customer.ts`

**Responsabilidades**:

- Encapsular lógica de negocio del Customer
- Validar invariantes (businessId, whatsappPhone no nulos)
- Publicar eventos de dominio
- Mantener versión para Optimistic Locking

**Estructura**:

```typescript
import { VersionedAggregateRoot } from "@shared/kernel/versioned-aggregate-root.base";
import { UUID } from "@shared/vo/uuid.vo";
import { WhatsAppPhone } from "../vo/whatsapp-phone.vo";
import { CustomerCreated } from "../events/customer-created.event";
import { CustomerNameUpdated } from "../events/customer-name-updated.event";

export class Customer extends VersionedAggregateRoot {
  private id: UUID;
  private userId: UUID | null; // ← Opcional: null = anónimo, UUID = registrado
  private businessId: UUID;
  private whatsappPhone: WhatsAppPhone;
  private name: string | null;
  private createdAt: Date;
  private updatedAt: Date;

  // Factory method para crear customer anónimo
  static createAnonymous(
    id: UUID,
    businessId: UUID,
    whatsappPhone: WhatsAppPhone,
    name: string | null = null,
  ): Customer {
    // Validaciones
    if (!id || !businessId || !whatsappPhone) {
      throw new InvalidCustomerDataException(
        "id, businessId and whatsappPhone are required",
      );
    }

    const customer = new Customer();
    customer.id = id;
    customer.userId = null; // ← Customer anónimo
    customer.businessId = businessId;
    customer.whatsappPhone = whatsappPhone;
    customer.name = name;
    customer.createdAt = new Date();
    customer.updatedAt = new Date();

    // Publicar evento
    customer.apply(
      new CustomerCreated(
        id.getValue(),
        businessId.getValue(),
        whatsappPhone.getValue(),
        name,
      ),
    );
    customer.incrementVersion();

    return customer;
  }

  // Método de negocio: vincular a User
  linkToUser(userId: UUID): void {
    if (this.userId !== null) {
      throw new CustomerAlreadyLinkedToUserException(this.id.getValue());
    }

    this.userId = userId;
    this.updatedAt = new Date();
    this.incrementVersion();

    // Publicar evento
    this.apply(new CustomerLinkedToUser(this.id.getValue(), userId.getValue()));
  }

  // Método de negocio: desvincular de User
  unlinkFromUser(): void {
    if (this.userId === null) {
      throw new CustomerNotLinkedToUserException(this.id.getValue());
    }

    const previousUserId = this.userId;
    this.userId = null;
    this.updatedAt = new Date();
    this.incrementVersion();

    // Publicar evento
    this.apply(
      new CustomerUnlinkedFromUser(
        this.id.getValue(),
        previousUserId.getValue(),
      ),
    );
  }

  // Métodos de consulta
  isAnonymous(): boolean {
    return this.userId === null;
  }

  isRegistered(): boolean {
    return this.userId !== null;
  }

  // Método de negocio: actualizar nombre
  updateName(name: string): void {
    // Validación
    if (!name || name.trim().length === 0) {
      throw new InvalidCustomerNameException("Name cannot be empty");
    }
    if (name.length > 100) {
      throw new InvalidCustomerNameException(
        "Name cannot exceed 100 characters",
      );
    }

    const previousName = this.name;
    this.name = name.trim();
    this.updatedAt = new Date();
    this.incrementVersion();

    // Publicar evento
    this.apply(new CustomerNameUpdated(this.id.getValue(), name, previousName));
  }

  // Factory method para reconstruir desde persistencia
  static fromPersistence(
    id: UUID,
    userId: UUID | null,
    businessId: UUID,
    whatsappPhone: WhatsAppPhone,
    name: string | null,
    version: number,
    createdAt: Date,
    updatedAt: Date,
  ): Customer {
    const customer = new Customer();
    customer.id = id;
    customer.userId = userId;
    customer.businessId = businessId;
    customer.whatsappPhone = whatsappPhone;
    customer.name = name;
    customer.createdAt = createdAt;
    customer.updatedAt = updatedAt;
    customer.setVersion(version);
    return customer;
  }

  // Getters
  getId(): UUID {
    return this.id;
  }
  getUserId(): UUID | null {
    return this.userId;
  }
  getBusinessId(): UUID {
    return this.businessId;
  }
  getWhatsAppPhone(): WhatsAppPhone {
    return this.whatsappPhone;
  }
  getName(): string | null {
    return this.name;
  }
  getCreatedAt(): Date {
    return this.createdAt;
  }
  getUpdatedAt(): Date {
    return this.updatedAt;
  }
}
```

### 2.2 Value Object: WhatsAppPhone

**Ubicación**: `apps/backend/src/customer/domain/vo/whatsapp-phone.ts`

**Responsabilidades**:

- Validar formato E.164 (+[código país][número])
- Encapsular lógica de validación
- Inmutabilidad
- Comparación por valor

**Estructura**:

```typescript
import { ValueObject } from "@shared/kernel/value-object.base";
import { InvalidWhatsAppPhoneException } from "../exceptions/invalid-whatsapp-phone.exception";

export class WhatsAppPhone extends ValueObject {
  private static readonly E164_REGEX = /^\+[1-9]\d{1,14}$/;

  private constructor(private readonly value: string) {
    super();
    this.validate(value);
  }

  private validate(value: string): void {
    if (!value) {
      throw new InvalidWhatsAppPhoneException("WhatsApp phone cannot be empty");
    }

    if (!WhatsAppPhone.E164_REGEX.test(value)) {
      throw new InvalidWhatsAppPhoneException(
        `Invalid WhatsApp phone format: ${value}. Expected E.164 format (+[country code][number])`,
      );
    }
  }

  static fromString(value: string): WhatsAppPhone {
    return new WhatsAppPhone(value);
  }

  getValue(): string {
    return this.value;
  }

  protected getEqualityComponents(): any[] {
    return [this.value];
  }
}
```

### 2.3 Domain Events

**Ubicación**: `apps/backend/src/customer/domain/events/`

#### CustomerCreated

**Archivo**: `customer-created.ts`

```typescript
export class CustomerCreated {
  constructor(
    public readonly customerId: string,
    public readonly businessId: string,
    public readonly whatsappPhone: string,
    public readonly name: string | null,
    public readonly occurredAt: Date = new Date(),
  ) {}
}
```

#### CustomerNameUpdated

**Archivo**: `customer-name-updated.ts`

```typescript
export class CustomerNameUpdated {
  constructor(
    public readonly customerId: string,
    public readonly newName: string,
    public readonly previousName: string | null,
    public readonly occurredAt: Date = new Date(),
  ) {}
}
```

#### CustomerLinkedToUser

**Archivo**: `customer-linked-to-user.ts`

```typescript
export class CustomerLinkedToUser {
  constructor(
    public readonly customerId: string,
    public readonly userId: string,
    public readonly occurredAt: Date = new Date(),
  ) {}
}
```

#### CustomerUnlinkedFromUser

**Archivo**: `customer-unlinked-from-user.ts`

```typescript
export class CustomerUnlinkedFromUser {
  constructor(
    public readonly customerId: string,
    public readonly previousUserId: string,
    public readonly occurredAt: Date = new Date(),
  ) {}
}
```

### 2.4 Domain Exceptions

**Ubicación**: `apps/backend/src/customer/domain/exceptions/`

#### InvalidCustomerDataException

**Archivo**: `invalid-customer-data.ts`

```typescript
export class InvalidCustomerDataException extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidCustomerDataException";
  }
}
```

#### InvalidCustomerNameException

**Archivo**: `invalid-customer-name.ts`

```typescript
export class InvalidCustomerNameException extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidCustomerNameException";
  }
}
```

#### InvalidWhatsAppPhoneException

**Archivo**: `invalid-whatsapp-phone.ts`

```typescript
export class InvalidWhatsAppPhoneException extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidWhatsAppPhoneException";
  }
}
```

#### CustomerNotFoundException

**Archivo**: `customer-not-found.ts`

```typescript
export class CustomerNotFoundException extends Error {
  constructor(customerId: string) {
    super(`Customer with id ${customerId} not found`);
    this.name = "CustomerNotFoundException";
  }
}
```

#### CustomerAlreadyLinkedToUserException

**Archivo**: `customer-already-linked-to-user.ts`

```typescript
export class CustomerAlreadyLinkedToUserException extends Error {
  constructor(customerId: string) {
    super(`Customer ${customerId} is already linked to a user`);
    this.name = "CustomerAlreadyLinkedToUserException";
  }
}
```

#### CustomerNotLinkedToUserException

**Archivo**: `customer-not-linked-to-user.ts`

```typescript
export class CustomerNotLinkedToUserException extends Error {
  constructor(customerId: string) {
    super(`Customer ${customerId} is not linked to any user`);
    this.name = "CustomerNotLinkedToUserException";
  }
}
```

### 2.5 Repository Interfaces

**Ubicación**: `apps/backend/src/customer/domain/interfaces/repositories/`

#### ICustomerWriteRepository

**Archivo**: `customer-write.ts`

```typescript
import { Customer } from "../../aggregates/customer";

export interface ICustomerWriteRepository {
  /**
   * Persists a customer aggregate
   * Uses optimistic locking with version field
   */
  save(customer: Customer): Promise<void>;
}
```

#### ICustomerReadRepository

**Archivo**: `customer-read.ts`

```typescript
import { CustomerReadModel } from "../../read-models/customer";

export interface ICustomerReadRepository {
  /**
   * Finds a customer by ID
   * Returns read model with denormalized data
   */
  findById(id: string): Promise<CustomerReadModel | null>;

  /**
   * Finds a customer by WhatsApp phone and business
   * Returns read model or null if not found
   */
  findByWhatsAppPhone(
    businessId: string,
    whatsappPhone: string,
  ): Promise<CustomerReadModel | null>;

  /**
   * Finds all customers for a business
   * Returns array of read models
   */
  findByBusinessId(businessId: string): Promise<CustomerReadModel[]>;

  /**
   * Finds all customers linked to a User (registered customers)
   * Returns array of read models
   */
  findByUserId(userId: string): Promise<CustomerReadModel[]>;

  /**
   * Finds all anonymous customers for a business (userId = null)
   * Returns array of read models
   */
  findAnonymousByBusinessId(businessId: string): Promise<CustomerReadModel[]>;
}
```

### 2.6 Factory Interface

**Ubicación**: `apps/backend/src/customer/domain/interfaces/factories/customer.ts`

```typescript
import { Customer } from "../../aggregates/customer";

export interface ICustomerFactory {
  /**
   * Loads a Customer aggregate for modification
   * @returns Domain aggregate with business logic
   */
  loadById(id: string): Promise<Customer | null>;

  /**
   * Loads a Customer aggregate by WhatsApp phone and business
   * @returns Domain aggregate with business logic or null if not found
   */
  loadByWhatsAppPhone(
    businessId: string,
    whatsappPhone: string,
  ): Promise<Customer | null>;
}
```

### 2.7 Read Model

**Ubicación**: `apps/backend/src/customer/domain/read-models/customer.ts`

```typescript
export class CustomerReadModel {
  id: string;
  userId: string | null; // ← Campo para vincular a User (null = anónimo)
  businessId: string;
  whatsappPhone: string;
  name: string | null;
  createdAt: Date;
  updatedAt: Date;
}
```

## 3. Application Layer

### 3.1 Event Handlers and Sagas

**Nota**: El Customer BC es principalmente un BC de soporte que responde a eventos de otros BCs. Si se necesita orquestación compleja (por ejemplo, sincronizar datos del customer con sistemas externos), se pueden implementar:

- **Event Handlers** en `apps/backend/src/customer/app/event-handlers/` para reaccionar a eventos de dominio
- **Sagas** en `apps/backend/src/customer/app/sagas/` para orquestar flujos complejos

**Ejemplo de Event Handler** (si se necesita):

```typescript
// apps/backend/src/customer/app/event-handlers/on-customer-created.ts
import { EventsHandler, IEventHandler } from "@nestjs/cqrs";
import { CustomerCreated } from "../../domain/events/customer-created";

@EventsHandler(CustomerCreated)
export class OnCustomerCreatedHandler implements IEventHandler<CustomerCreated> {
  async handle(event: CustomerCreated) {
    // Ejemplo: Enviar notificación, sincronizar con CRM externo, etc.
    console.log(`Customer created: ${event.customerId}`);
  }
}
```

**Ejemplo de Saga** (si se necesita):

```typescript
// apps/backend/src/customer/app/sagas/customer-sync.saga.ts
import { Injectable } from "@nestjs/common";
import { Saga, ofType } from "@nestjs/cqrs";
import { Observable, map } from "rxjs";
import { CustomerCreated } from "../../domain/events/customer-created";
import { ICommand } from "@nestjs/cqrs";

@Injectable()
export class CustomerSyncSaga {
  @Saga()
  customerCreated = (events$: Observable<any>): Observable<ICommand> => {
    return events$.pipe(
      ofType(CustomerCreated),
      map((event) => {
        // Retornar comando para sincronizar con sistema externo
        // return new SyncCustomerToExternalSystemCommand(event.customerId);
      }),
    );
  };
}
```

Para el MVP, **no se requieren event handlers ni sagas** en Customer BC, ya que es un BC reactivo que solo responde a comandos directos.

### 3.2 Commands

**Ubicación**: `apps/backend/src/customer/app/commands/`

#### IdentifyCustomerCommand

```typescript
import { Command } from "@nestjs/cqrs";

export class IdentifyCustomerCommand extends Command<{ customerId: string }> {
  constructor(
    public readonly businessId: string,
    public readonly whatsappPhone: string,
    public readonly name: string | null = null,
  ) {
    super();
  }
}
```

**Handler**: `identify-customer/handler.ts`

```typescript
import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { Inject } from "@nestjs/common";
import { IdentifyCustomerCommand } from "./command";
import { ICustomerFactory } from "../../../domain/interfaces/factories/customer-factory.interface";
import { ICustomerWriteRepository } from "../../../domain/interfaces/repositories/customer-write.repository.interface";
import { Customer } from "../../../domain/aggregates/customer";
import { UUID } from "@shared/vo/uuid.vo";
import { WhatsAppPhone } from "../../../domain/vo/whatsapp-phone.vo";

@CommandHandler(IdentifyCustomerCommand)
export class IdentifyCustomerHandler implements ICommandHandler<IdentifyCustomerCommand> {
  constructor(
    @Inject("ICustomerFactory")
    private readonly factory: ICustomerFactory,
    @Inject("ICustomerWriteRepository")
    private readonly writeRepo: ICustomerWriteRepository,
  ) {}

  async execute(
    command: IdentifyCustomerCommand,
  ): Promise<{ customerId: string }> {
    const whatsappPhone = WhatsAppPhone.fromString(command.whatsappPhone);

    // Intentar cargar customer existente
    const existingCustomer = await this.factory.loadByWhatsAppPhone(
      command.businessId,
      command.whatsappPhone,
    );

    if (existingCustomer) {
      // Si existe y tiene nombre nuevo, actualizar
      if (command.name && command.name !== existingCustomer.getName()) {
        existingCustomer.updateName(command.name);
        await this.writeRepo.save(existingCustomer);
      }
      return { customerId: existingCustomer.getId().getValue() };
    }

    // Crear nuevo customer
    const newCustomer = Customer.create(
      UUID.generate(),
      UUID.fromString(command.businessId),
      whatsappPhone,
      command.name,
    );

    await this.writeRepo.save(newCustomer);

    return { customerId: newCustomer.getId().getValue() };
  }
}
```

#### UpdateCustomerNameCommand

```typescript
import { Command } from "@nestjs/cqrs";

export class UpdateCustomerNameCommand extends Command<void> {
  constructor(
    public readonly customerId: string,
    public readonly name: string,
  ) {
    super();
  }
}
```

**Handler**: `update-customer-name/handler.ts`

```typescript
import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { Inject } from "@nestjs/common";
import { UpdateCustomerNameCommand } from "./command";
import { ICustomerFactory } from "../../../domain/interfaces/factories/customer-factory.interface";
import { ICustomerWriteRepository } from "../../../domain/interfaces/repositories/customer-write.repository.interface";
import { CustomerNotFoundException } from "../../../domain/exceptions/customer-not-found.exception";

@CommandHandler(UpdateCustomerNameCommand)
export class UpdateCustomerNameHandler implements ICommandHandler<UpdateCustomerNameCommand> {
  constructor(
    @Inject("ICustomerFactory")
    private readonly factory: ICustomerFactory,
    @Inject("ICustomerWriteRepository")
    private readonly writeRepo: ICustomerWriteRepository,
  ) {}

  async execute(command: UpdateCustomerNameCommand): Promise<void> {
    const customer = await this.factory.loadById(command.customerId);

    if (!customer) {
      throw new CustomerNotFoundException(command.customerId);
    }

    customer.updateName(command.name);
    await this.writeRepo.save(customer);
  }
}
```

#### LinkCustomerToUserCommand

```typescript
import { Command } from "@nestjs/cqrs";

export class LinkCustomerToUserCommand extends Command<void> {
  constructor(
    public readonly customerId: string,
    public readonly userId: string,
  ) {
    super();
  }
}
```

**Handler**: `link-customer-to-user/handler.ts`

```typescript
import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { Inject } from "@nestjs/common";
import { LinkCustomerToUserCommand } from "./command";
import { ICustomerFactory } from "../../../domain/interfaces/factories/customer-factory.interface";
import { ICustomerWriteRepository } from "../../../domain/interfaces/repositories/customer-write.repository.interface";
import { CustomerNotFoundException } from "../../../domain/exceptions/customer-not-found.exception";
import { UUID } from "@shared/vo/uuid.vo";

@CommandHandler(LinkCustomerToUserCommand)
export class LinkCustomerToUserHandler implements ICommandHandler<LinkCustomerToUserCommand> {
  constructor(
    @Inject("ICustomerFactory")
    private readonly factory: ICustomerFactory,
    @Inject("ICustomerWriteRepository")
    private readonly writeRepo: ICustomerWriteRepository,
  ) {}

  async execute(command: LinkCustomerToUserCommand): Promise<void> {
    const customer = await this.factory.loadById(command.customerId);

    if (!customer) {
      throw new CustomerNotFoundException(command.customerId);
    }

    customer.linkToUser(UUID.fromString(command.userId));
    await this.writeRepo.save(customer);
  }
}
```

#### UnlinkCustomerFromUserCommand

```typescript
import { Command } from "@nestjs/cqrs";

export class UnlinkCustomerFromUserCommand extends Command<void> {
  constructor(public readonly customerId: string) {
    super();
  }
}
```

**Handler**: `unlink-customer-from-user/handler.ts`

```typescript
import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { Inject } from "@nestjs/common";
import { UnlinkCustomerFromUserCommand } from "./command";
import { ICustomerFactory } from "../../../domain/interfaces/factories/customer-factory.interface";
import { ICustomerWriteRepository } from "../../../domain/interfaces/repositories/customer-write.repository.interface";
import { CustomerNotFoundException } from "../../../domain/exceptions/customer-not-found.exception";

@CommandHandler(UnlinkCustomerFromUserCommand)
export class UnlinkCustomerFromUserHandler implements ICommandHandler<UnlinkCustomerFromUserCommand> {
  constructor(
    @Inject("ICustomerFactory")
    private readonly factory: ICustomerFactory,
    @Inject("ICustomerWriteRepository")
    private readonly writeRepo: ICustomerWriteRepository,
  ) {}

  async execute(command: UnlinkCustomerFromUserCommand): Promise<void> {
    const customer = await this.factory.loadById(command.customerId);

    if (!customer) {
      throw new CustomerNotFoundException(command.customerId);
    }

    customer.unlinkFromUser();
    await this.writeRepo.save(customer);
  }
}
```

#### RegisterCustomerViaWhatsAppCommand (Futuro - Marketplace)

**Nota**: Este comando implementa el flujo de auto-registro vía WhatsApp. Se activa cuando un Customer anónimo intenta agendar su primera cita y el sistema solicita nombre y email.

```typescript
import { Command } from "@nestjs/cqrs";

export class RegisterCustomerViaWhatsAppCommand extends Command<{
  userId: string;
  customerId: string;
}> {
  constructor(
    public readonly customerId: string,
    public readonly name: string,
    public readonly email: string,
  ) {
    super();
  }
}
```

**Handler**: `register-customer-via-whatsapp/handler.ts`

```typescript
import {
  CommandHandler,
  ICommandHandler,
  CommandBus,
  QueryBus,
} from "@nestjs/cqrs";
import { Inject } from "@nestjs/common";
import { RegisterCustomerViaWhatsAppCommand } from "./command";
import { ICustomerFactory } from "../../../domain/interfaces/factories/customer-factory.interface";
import { ICustomerWriteRepository } from "../../../domain/interfaces/repositories/customer-write.repository.interface";
import { CustomerNotFoundException } from "../../../domain/exceptions/customer-not-found.exception";
import { CustomerAlreadyLinkedToUserException } from "../../../domain/exceptions/customer-already-linked-to-user.exception";
import { UUID } from "@shared/vo/uuid.vo";
// Auth BC imports (cross-BC communication via CommandBus/QueryBus)
// import { RegisterUserCommand } from '@auth/app/commands/register-user/command';
// import { GetUserByEmailQuery } from '@auth/app/queries/get-user-by-email/query';
// import { AddUserRoleCommand } from '@auth/app/commands/add-user-role/command';

@CommandHandler(RegisterCustomerViaWhatsAppCommand)
export class RegisterCustomerViaWhatsAppHandler implements ICommandHandler<RegisterCustomerViaWhatsAppCommand> {
  constructor(
    @Inject("ICustomerFactory")
    private readonly factory: ICustomerFactory,
    @Inject("ICustomerWriteRepository")
    private readonly writeRepo: ICustomerWriteRepository,
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  async execute(
    command: RegisterCustomerViaWhatsAppCommand,
  ): Promise<{ userId: string; customerId: string }> {
    // 1. Cargar Customer
    const customer = await this.factory.loadById(command.customerId);

    if (!customer) {
      throw new CustomerNotFoundException(command.customerId);
    }

    // 2. Verificar que Customer es anónimo
    if (customer.isRegistered()) {
      throw new CustomerAlreadyLinkedToUserException(command.customerId);
    }

    // 3. Verificar si email ya existe en Auth BC
    // const existingUser = await this.queryBus.execute(
    //   new GetUserByEmailQuery(command.email)
    // );

    let userId: string;

    // if (existingUser) {
    //   // 4a. User existe - verificar si tiene role CUSTOMER
    //   if (!existingUser.roles.includes('CUSTOMER')) {
    //     // Agregar role CUSTOMER (escenario marketplace: BUSINESS_OWNER + CUSTOMER)
    //     await this.commandBus.execute(
    //       new AddUserRoleCommand(existingUser.id, 'CUSTOMER')
    //     );
    //   }
    //   userId = existingUser.id;
    // } else {
    //   // 4b. User no existe - crear nuevo User con role=['CUSTOMER']
    //   const result = await this.commandBus.execute(
    //     new RegisterUserCommand(command.email, null, command.name, 'CUSTOMER')
    //   );
    //   userId = result.userId;
    // }

    // Placeholder para MVP - se implementará cuando Auth BC esté completo
    userId = UUID.generate().getValue();

    // 5. Vincular Customer a User
    customer.linkToUser(UUID.fromString(userId));
    await this.writeRepo.save(customer);

    return { userId, customerId: command.customerId };
  }
}
```

**Flujo de Auto-Registro vía WhatsApp:**

```
┌─────────────────────────────────────────────────────────────────┐
│                 FLUJO DE AUTO-REGISTRO                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Customer anónimo intenta agendar primera cita               │
│     ↓                                                           │
│  2. Bot detecta que Customer.userId = null                      │
│     ↓                                                           │
│  3. Bot solicita nombre y email vía WhatsApp:                   │
│     "Para completar tu reserva, necesito algunos datos:"        │
│     "¿Cuál es tu nombre completo?"                              │
│     ↓                                                           │
│  4. Cliente responde con nombre                                 │
│     ↓                                                           │
│  5. Bot solicita email:                                         │
│     "¿Cuál es tu correo electrónico?"                           │
│     ↓                                                           │
│  6. Cliente responde con email                                  │
│     ↓                                                           │
│  7. Sistema ejecuta RegisterCustomerViaWhatsAppCommand          │
│     - Verifica si email existe en Auth BC                       │
│     - Si existe: vincula Customer a User existente              │
│     - Si no existe: crea User con role=['CUSTOMER']             │
│     - Vincula Customer a User                                   │
│     ↓                                                           │
│  8. Sistema continúa con la agenda de la cita                   │
│     ↓                                                           │
│  9. Cliente puede acceder al panel web con su email             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 3.3 Queries

**Ubicación**: `apps/backend/src/customer/app/queries/`

#### GetCustomerQuery

```typescript
import { Query } from "@nestjs/cqrs";
import { CustomerReadModel } from "../../domain/read-models/customer.read-model";

export class GetCustomerQuery extends Query<CustomerReadModel> {
  constructor(public readonly customerId: string) {
    super();
  }
}
```

**Handler**: `get-customer/handler.ts`

```typescript
import { QueryHandler, IQueryHandler } from "@nestjs/cqrs";
import { Inject } from "@nestjs/common";
import { GetCustomerQuery } from "./query";
import { ICustomerReadRepository } from "../../../domain/interfaces/repositories/customer-read.repository.interface";
import { CustomerReadModel } from "../../../domain/read-models/customer.read-model";
import { CustomerNotFoundException } from "../../../domain/exceptions/customer-not-found.exception";

@QueryHandler(GetCustomerQuery)
export class GetCustomerHandler implements IQueryHandler<GetCustomerQuery> {
  constructor(
    @Inject("ICustomerReadRepository")
    private readonly readRepo: ICustomerReadRepository,
  ) {}

  async execute(query: GetCustomerQuery): Promise<CustomerReadModel> {
    const customer = await this.readRepo.findById(query.customerId);

    if (!customer) {
      throw new CustomerNotFoundException(query.customerId);
    }

    return customer;
  }
}
```

#### GetCustomerByPhoneQuery

```typescript
import { Query } from "@nestjs/cqrs";
import { CustomerReadModel } from "../../domain/read-models/customer.read-model";

export class GetCustomerByPhoneQuery extends Query<CustomerReadModel | null> {
  constructor(
    public readonly businessId: string,
    public readonly whatsappPhone: string,
  ) {
    super();
  }
}
```

**Handler**: `get-customer-by-phone/handler.ts`

```typescript
import { QueryHandler, IQueryHandler } from "@nestjs/cqrs";
import { Inject } from "@nestjs/common";
import { GetCustomerByPhoneQuery } from "./query";
import { ICustomerReadRepository } from "../../../domain/interfaces/repositories/customer-read.repository.interface";
import { CustomerReadModel } from "../../../domain/read-models/customer.read-model";

@QueryHandler(GetCustomerByPhoneQuery)
export class GetCustomerByPhoneHandler implements IQueryHandler<GetCustomerByPhoneQuery> {
  constructor(
    @Inject("ICustomerReadRepository")
    private readonly readRepo: ICustomerReadRepository,
  ) {}

  async execute(
    query: GetCustomerByPhoneQuery,
  ): Promise<CustomerReadModel | null> {
    return this.readRepo.findByWhatsAppPhone(
      query.businessId,
      query.whatsappPhone,
    );
  }
}
```

#### GetCustomersByUserIdQuery

```typescript
import { Query } from "@nestjs/cqrs";
import { CustomerReadModel } from "../../domain/read-models/customer.read-model";

export class GetCustomersByUserIdQuery extends Query<CustomerReadModel[]> {
  constructor(public readonly userId: string) {
    super();
  }
}
```

**Handler**: `get-customers-by-user-id/handler.ts`

```typescript
import { QueryHandler, IQueryHandler } from "@nestjs/cqrs";
import { Inject } from "@nestjs/common";
import { GetCustomersByUserIdQuery } from "./query";
import { ICustomerReadRepository } from "../../../domain/interfaces/repositories/customer-read.repository.interface";
import { CustomerReadModel } from "../../../domain/read-models/customer.read-model";

@QueryHandler(GetCustomersByUserIdQuery)
export class GetCustomersByUserIdHandler implements IQueryHandler<GetCustomersByUserIdQuery> {
  constructor(
    @Inject("ICustomerReadRepository")
    private readonly readRepo: ICustomerReadRepository,
  ) {}

  async execute(
    query: GetCustomersByUserIdQuery,
  ): Promise<CustomerReadModel[]> {
    return this.readRepo.findByUserId(query.userId);
  }
}
```

## 4. Infrastructure Layer

### 4.1 TypeORM Model

**Ubicación**: `apps/backend/src/customer/infra/persistence/models/customer.ts`

```typescript
import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from "typeorm";

@Entity("customers")
@Index(["businessId", "whatsappPhone"], { unique: true })
export class CustomerModel {
  @PrimaryColumn("uuid")
  id: string;

  @Column("uuid", { name: "user_id", nullable: true })
  userId: string | null;

  @Column("uuid", { name: "business_id" })
  businessId: string;

  @Column("varchar", { length: 20, name: "whatsapp_phone" })
  whatsappPhone: string;

  @Column("varchar", { length: 100, nullable: true })
  name: string | null;

  @Column("int", { default: 0 })
  version: number;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}
```

### 4.2 Factory Implementation

**Ubicación**: `apps/backend/src/customer/infra/persistence/factories/customer.ts`

```typescript
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ICustomerFactory } from "../../../domain/interfaces/factories/customer-factory.interface";
import { Customer } from "../../../domain/aggregates/customer";
import { CustomerModel } from "../models/customer.model";
import { UUID } from "@shared/vo/uuid.vo";
import { WhatsAppPhone } from "../../../domain/vo/whatsapp-phone.vo";

@Injectable()
export class CustomerFactory implements ICustomerFactory {
  constructor(
    @InjectRepository(CustomerModel)
    private readonly repository: Repository<CustomerModel>,
  ) {}

  async loadById(id: string): Promise<Customer | null> {
    const model = await this.repository.findOne({ where: { id } });

    if (!model) {
      return null;
    }

    return Customer.fromPersistence(
      UUID.fromString(model.id),
      UUID.fromString(model.businessId),
      WhatsAppPhone.fromString(model.whatsappPhone),
      model.name,
      model.version,
      model.createdAt,
      model.updatedAt,
    );
  }

  async loadByWhatsAppPhone(
    businessId: string,
    whatsappPhone: string,
  ): Promise<Customer | null> {
    const model = await this.repository.findOne({
      where: {
        businessId,
        whatsappPhone,
      },
    });

    if (!model) {
      return null;
    }

    return Customer.fromPersistence(
      UUID.fromString(model.id),
      UUID.fromString(model.businessId),
      WhatsAppPhone.fromString(model.whatsappPhone),
      model.name,
      model.version,
      model.createdAt,
      model.updatedAt,
    );
  }
}
```

### 4.3 Write Repository Implementation

**Ubicación**: `apps/backend/src/customer/infra/persistence/repositories/customer-write.ts`

```typescript
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ICustomerWriteRepository } from "../../../domain/interfaces/repositories/customer-write.repository.interface";
import { Customer } from "../../../domain/aggregates/customer";
import { CustomerModel } from "../models/customer.model";
import { CustomerWriteMapper } from "../mappers/customer-write.mapper";
import { ConcurrencyException } from "@shared/kernel/exceptions/concurrency.exception";
import { IUnitOfWork } from "@shared/kernel/uow.interface";

@Injectable()
export class CustomerWriteRepository implements ICustomerWriteRepository {
  constructor(
    @InjectRepository(CustomerModel)
    private readonly repository: Repository<CustomerModel>,
    private readonly uow: IUnitOfWork,
  ) {}

  async save(customer: Customer): Promise<void> {
    await this.uow.transaction(async () => {
      const model = CustomerWriteMapper.toModel(customer);

      // Check if customer exists
      const existing = await this.repository.findOne({
        where: { id: model.id },
      });

      if (!existing) {
        // Insert new customer
        await this.repository.insert(model);
        return;
      }

      // Update existing customer with optimistic locking
      const result = await this.repository
        .createQueryBuilder()
        .update(CustomerModel)
        .set({
          name: model.name,
          updatedAt: model.updatedAt,
          version: customer.getVersion().getValue() + 1,
        })
        .where("id = :id", { id: model.id })
        .andWhere("version = :version", {
          version: customer.getVersion().getValue(),
        })
        .execute();

      if (result.affected === 0) {
        throw new ConcurrencyException(
          `Customer ${customer.getId().getValue()} was modified by another transaction`,
        );
      }
    });
  }
}
```

### 4.4 Read Repository Implementation

**Ubicación**: `apps/backend/src/customer/infra/persistence/repositories/customer-read.ts`

```typescript
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ICustomerReadRepository } from "../../../domain/interfaces/repositories/customer-read.repository.interface";
import { CustomerReadModel } from "../../../domain/read-models/customer.read-model";
import { CustomerModel } from "../models/customer.model";
import { CustomerReadMapper } from "../mappers/customer-read.mapper";

@Injectable()
export class CustomerReadRepository implements ICustomerReadRepository {
  constructor(
    @InjectRepository(CustomerModel)
    private readonly repository: Repository<CustomerModel>,
  ) {}

  async findById(id: string): Promise<CustomerReadModel | null> {
    const model = await this.repository.findOne({ where: { id } });

    if (!model) {
      return null;
    }

    return CustomerReadMapper.toReadModel(model);
  }

  async findByWhatsAppPhone(
    businessId: string,
    whatsappPhone: string,
  ): Promise<CustomerReadModel | null> {
    const model = await this.repository.findOne({
      where: {
        businessId,
        whatsappPhone,
      },
    });

    if (!model) {
      return null;
    }

    return CustomerReadMapper.toReadModel(model);
  }

  async findByBusinessId(businessId: string): Promise<CustomerReadModel[]> {
    const models = await this.repository.find({
      where: { businessId },
      order: { createdAt: "DESC" },
    });

    return models.map(CustomerReadMapper.toReadModel);
  }

  async findByUserId(userId: string): Promise<CustomerReadModel[]> {
    const models = await this.repository.find({
      where: { userId },
      order: { createdAt: "DESC" },
    });

    return models.map(CustomerReadMapper.toReadModel);
  }

  async findAnonymousByBusinessId(
    businessId: string,
  ): Promise<CustomerReadModel[]> {
    const models = await this.repository.find({
      where: {
        businessId,
        userId: null, // ← Solo customers anónimos
      },
      order: { createdAt: "DESC" },
    });

    return models.map(CustomerReadMapper.toReadModel);
  }
}
```

### 4.5 Mappers

**Ubicación**: `apps/backend/src/customer/infra/persistence/mappers/`

#### CustomerWriteMapper

**Archivo**: `customer-write.ts`

```typescript
import { Customer } from "../../../domain/aggregates/customer";
import { CustomerModel } from "../models/customer";

export class CustomerWriteMapper {
  static toModel(customer: Customer): CustomerModel {
    const model = new CustomerModel();
    model.id = customer.getId().getValue();
    model.userId = customer.getUserId()?.getValue() ?? null; // ← Mapear userId
    model.businessId = customer.getBusinessId().getValue();
    model.whatsappPhone = customer.getWhatsAppPhone().getValue();
    model.name = customer.getName();
    model.version = customer.getVersion().getValue();
    model.createdAt = customer.getCreatedAt();
    model.updatedAt = customer.getUpdatedAt();
    return model;
  }
}
```

#### CustomerReadMapper

**Archivo**: `customer-read.ts`

```typescript
import { CustomerReadModel } from "../../../domain/read-models/customer";
import { CustomerModel } from "../models/customer";

export class CustomerReadMapper {
  static toReadModel(model: CustomerModel): CustomerReadModel {
    return {
      id: model.id,
      userId: model.userId, // ← Incluir userId en read model
      businessId: model.businessId,
      whatsappPhone: model.whatsappPhone,
      name: model.name,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    };
  }
}
```

## 5. Database Schema

### 5.1 Migration

**Ubicación**: `apps/backend/src/database/migrations/XXXXXX-create-customers-table.ts`

```typescript
import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableIndex,
  TableForeignKey,
} from "typeorm";

export class CreateCustomersTable1234567890123 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "customers",
        columns: [
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
          },
          {
            name: "business_id",
            type: "uuid",
            isNullable: false,
          },
          {
            name: "whatsapp_phone",
            type: "varchar",
            length: "20",
            isNullable: false,
          },
          {
            name: "name",
            type: "varchar",
            length: "100",
            isNullable: true,
          },
          {
            name: "version",
            type: "int",
            default: 0,
            isNullable: false,
          },
          {
            name: "created_at",
            type: "timestamp",
            default: "CURRENT_TIMESTAMP",
            isNullable: false,
          },
          {
            name: "updated_at",
            type: "timestamp",
            default: "CURRENT_TIMESTAMP",
            onUpdate: "CURRENT_TIMESTAMP",
            isNullable: false,
          },
        ],
      }),
      true,
    );

    // Unique index on (business_id, whatsapp_phone)
    await queryRunner.createIndex(
      "customers",
      new TableIndex({
        name: "IDX_customers_business_whatsapp",
        columnNames: ["business_id", "whatsapp_phone"],
        isUnique: true,
      }),
    );

    // Index on business_id for queries
    await queryRunner.createIndex(
      "customers",
      new TableIndex({
        name: "IDX_customers_business_id",
        columnNames: ["business_id"],
      }),
    );

    // Foreign key to businesses table (if exists)
    // Uncomment when Business BC is implemented
    /*
    await queryRunner.createForeignKey(
      'customers',
      new TableForeignKey({
        columnNames: ['business_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'businesses',
        onDelete: 'CASCADE'
      })
    );
    */
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("customers");
  }
}
```

### 5.2 Seed Data

**Ubicación**: `apps/backend/src/database/seeds/customer.seed.ts`

```typescript
import { DataSource } from "typeorm";
import { CustomerModel } from "../../customer/infra/persistence/models/customer.model";

export async function seedCustomers(dataSource: DataSource): Promise<void> {
  const customerRepo = dataSource.getRepository(CustomerModel);

  // Assuming we have a test business with ID
  const testBusinessId = "550e8400-e29b-41d4-a716-446655440000";

  const customers = [
    {
      id: "650e8400-e29b-41d4-a716-446655440001",
      businessId: testBusinessId,
      whatsappPhone: "+18095551234",
      name: "Juan Pérez",
      version: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "650e8400-e29b-41d4-a716-446655440002",
      businessId: testBusinessId,
      whatsappPhone: "+18095555678",
      name: "María García",
      version: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "650e8400-e29b-41d4-a716-446655440003",
      businessId: testBusinessId,
      whatsappPhone: "+18095559012",
      name: null, // Customer without name yet
      version: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  for (const customer of customers) {
    const existing = await customerRepo.findOne({
      where: { id: customer.id },
    });

    if (!existing) {
      await customerRepo.insert(customer);
      console.log(
        `✅ Customer ${customer.name || customer.whatsappPhone} seeded`,
      );
    }
  }
}
```

## 6. Module Configuration

**Ubicación**: `apps/backend/src/customer/customer.module.ts`

```typescript
import { Module } from "@nestjs/common";
import { CqrsModule } from "@nestjs/cqrs";
import { TypeOrmModule } from "@nestjs/typeorm";

// Models
import { CustomerModel } from "./infra/persistence/models/customer.model";

// Command Handlers
import { IdentifyCustomerHandler } from "./app/commands/identify-customer/handler";
import { UpdateCustomerNameHandler } from "./app/commands/update-customer-name/handler";

// Query Handlers
import { GetCustomerHandler } from "./app/queries/get-customer/handler";
import { GetCustomerByPhoneHandler } from "./app/queries/get-customer-by-phone/handler";

// Repositories
import { CustomerWriteRepository } from "./infra/persistence/repositories/customer-write.repository";
import { CustomerReadRepository } from "./infra/persistence/repositories/customer-read.repository";

// Factory
import { CustomerFactory } from "./infra/persistence/factories/customer.factory";

// Shared
import { TypeOrmUnitOfWork } from "@shared/infra/uow";

const commandHandlers = [IdentifyCustomerHandler, UpdateCustomerNameHandler];

const queryHandlers = [GetCustomerHandler, GetCustomerByPhoneHandler];

@Module({
  imports: [CqrsModule, TypeOrmModule.forFeature([CustomerModel])],
  providers: [
    // Command Handlers
    ...commandHandlers,

    // Query Handlers
    ...queryHandlers,

    // Factory
    {
      provide: "ICustomerFactory",
      useClass: CustomerFactory,
    },

    // Repositories
    {
      provide: "ICustomerWriteRepository",
      useClass: CustomerWriteRepository,
    },
    {
      provide: "ICustomerReadRepository",
      useClass: CustomerReadRepository,
    },

    // Unit of Work
    {
      provide: "IUnitOfWork",
      useClass: TypeOrmUnitOfWork,
    },
  ],
  exports: [
    "ICustomerFactory",
    "ICustomerWriteRepository",
    "ICustomerReadRepository",
  ],
})
export class CustomerModule {}
```

## 7. Integration with Booking BC

### 7.1 Update AppointmentReadRepository

**Ubicación**: `apps/backend/src/booking/infra/persistence/repositories/appointment-read.repository.ts`

**Modificación**: Agregar JOIN con tabla customers

```typescript
async findById(id: string): Promise<AppointmentReadModel | null> {
  const result = await this.repository
    .createQueryBuilder('appointment')
    .leftJoin('customers', 'c', 'c.id = appointment.customerId')
    .leftJoin('offerings', 'o', 'o.id = appointment.offeringId')
    .select([
      'appointment.id as id',
      'appointment.businessId as businessId',
      'appointment.customerId as customerId',
      'c.name as customerName',              // ← NEW
      'c.whatsappPhone as customerPhone',    // ← NEW
      'appointment.offeringId as offeringId',
      'o.name as offeringName',
      'appointment.dateTime as dateTime',
      'appointment.status as status',
      'appointment.createdAt as createdAt'
    ])
    .where('appointment.id = :id', { id })
    .getRawOne();

  if (!result) {
    return null;
  }

  return AppointmentReadMapper.toReadModel(result);
}
```

### 7.2 Update Booking Seeds

**Ubicación**: `apps/backend/src/database/seeds/booking.seed.ts`

**Modificación**: Usar customer IDs reales en lugar de UUIDs aleatorios

```typescript
export async function seedAppointments(dataSource: DataSource): Promise<void> {
  const appointmentRepo = dataSource.getRepository(AppointmentModel);
  const customerRepo = dataSource.getRepository(CustomerModel);

  // Get existing customers
  const customers = await customerRepo.find();

  if (customers.length === 0) {
    console.log("⚠️  No customers found. Run customer seed first.");
    return;
  }

  const appointments = [
    {
      id: "750e8400-e29b-41d4-a716-446655440001",
      businessId: "550e8400-e29b-41d4-a716-446655440000",
      customerId: customers[0].id, // ← Use real customer ID
      offeringId: "850e8400-e29b-41d4-a716-446655440001",
      dateTime: new Date("2024-12-20T10:00:00Z"),
      status: "CONFIRMED",
      version: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    // ... more appointments
  ];

  for (const appointment of appointments) {
    const existing = await appointmentRepo.findOne({
      where: { id: appointment.id },
    });

    if (!existing) {
      await appointmentRepo.insert(appointment);
      console.log(`✅ Appointment ${appointment.id} seeded`);
    }
  }
}
```

## 8. Integration with Conversation BC

### 8.1 Update ProcessIncomingMessageHandler

**Ubicación**: `apps/backend/src/conversation/app/commands/process-incoming-message/handler.ts`

**Modificación**: Ejecutar IdentifyCustomerCommand antes de procesar conversación

```typescript
import { CommandBus } from "@nestjs/cqrs";
import { IdentifyCustomerCommand } from "@customer/app/commands/identify-customer/command";

@CommandHandler(ProcessIncomingMessageCommand)
export class ProcessIncomingMessageHandler {
  constructor(
    private readonly commandBus: CommandBus,
    // ... other dependencies
  ) {}

  async execute(command: ProcessIncomingMessageCommand): Promise<void> {
    // 1. Identify or create customer
    const { customerId } = await this.commandBus.execute(
      new IdentifyCustomerCommand(
        command.businessId,
        command.fromPhone,
        command.senderName, // From WhatsApp profile
      ),
    );

    // 2. Process conversation with customerId
    // ... rest of logic
  }
}
```

## 9. Testing Strategy

### 9.1 Unit Tests

#### WhatsAppPhone Value Object

**Ubicación**: `apps/backend/src/customer/domain/vo/__tests__/whatsapp-phone.vo.spec.ts`

```typescript
import { describe, it, expect } from "vitest";
import { WhatsAppPhone } from "../whatsapp-phone.vo";
import { InvalidWhatsAppPhoneException } from "../../exceptions/invalid-whatsapp-phone.exception";

describe("WhatsAppPhone", () => {
  describe("Valid formats", () => {
    it("should accept valid E.164 format", () => {
      const validPhones = [
        "+18095551234",
        "+12025551234",
        "+442071234567",
        "+861234567890",
      ];

      validPhones.forEach((phone) => {
        const whatsappPhone = WhatsAppPhone.fromString(phone);
        expect(whatsappPhone.getValue()).toBe(phone);
      });
    });
  });

  describe("Invalid formats", () => {
    it("should reject phone without plus sign", () => {
      expect(() => WhatsAppPhone.fromString("18095551234")).toThrow(
        InvalidWhatsAppPhoneException,
      );
    });

    it("should reject phone with spaces", () => {
      expect(() => WhatsAppPhone.fromString("+1 809 555 1234")).toThrow(
        InvalidWhatsAppPhoneException,
      );
    });

    it("should reject phone with dashes", () => {
      expect(() => WhatsAppPhone.fromString("+1-809-555-1234")).toThrow(
        InvalidWhatsAppPhoneException,
      );
    });

    it("should reject empty string", () => {
      expect(() => WhatsAppPhone.fromString("")).toThrow(
        InvalidWhatsAppPhoneException,
      );
    });

    it("should reject phone starting with +0", () => {
      expect(() => WhatsAppPhone.fromString("+0123456789")).toThrow(
        InvalidWhatsAppPhoneException,
      );
    });
  });

  describe("Equality", () => {
    it("should be equal when values are the same", () => {
      const phone1 = WhatsAppPhone.fromString("+18095551234");
      const phone2 = WhatsAppPhone.fromString("+18095551234");
      expect(phone1.equals(phone2)).toBe(true);
    });

    it("should not be equal when values differ", () => {
      const phone1 = WhatsAppPhone.fromString("+18095551234");
      const phone2 = WhatsAppPhone.fromString("+18095555678");
      expect(phone1.equals(phone2)).toBe(false);
    });
  });
});
```

#### Customer Aggregate

**Ubicación**: `apps/backend/src/customer/domain/aggregates/__tests__/customer.spec.ts`

```typescript
import { describe, it, expect } from "vitest";
import { Customer } from "../customer";
import { UUID } from "@shared/vo/uuid.vo";
import { WhatsAppPhone } from "../../vo/whatsapp-phone.vo";
import { InvalidCustomerNameException } from "../../exceptions/invalid-customer-name.exception";

describe("Customer Aggregate", () => {
  describe("create", () => {
    it("should create customer with valid data", () => {
      const customer = Customer.create(
        UUID.generate(),
        UUID.generate(),
        WhatsAppPhone.fromString("+18095551234"),
        "Juan Pérez",
      );

      expect(customer.getId()).toBeDefined();
      expect(customer.getName()).toBe("Juan Pérez");
      expect(customer.getVersion().getValue()).toBe(1);
    });

    it("should create customer without name", () => {
      const customer = Customer.create(
        UUID.generate(),
        UUID.generate(),
        WhatsAppPhone.fromString("+18095551234"),
        null,
      );

      expect(customer.getName()).toBeNull();
    });
  });

  describe("updateName", () => {
    it("should update name successfully", () => {
      const customer = Customer.create(
        UUID.generate(),
        UUID.generate(),
        WhatsAppPhone.fromString("+18095551234"),
        null,
      );

      customer.updateName("María García");

      expect(customer.getName()).toBe("María García");
      expect(customer.getVersion().getValue()).toBe(2);
    });

    it("should reject empty name", () => {
      const customer = Customer.create(
        UUID.generate(),
        UUID.generate(),
        WhatsAppPhone.fromString("+18095551234"),
        "Juan",
      );

      expect(() => customer.updateName("")).toThrow(
        InvalidCustomerNameException,
      );
    });

    it("should reject name longer than 100 characters", () => {
      const customer = Customer.create(
        UUID.generate(),
        UUID.generate(),
        WhatsAppPhone.fromString("+18095551234"),
        "Juan",
      );

      const longName = "a".repeat(101);
      expect(() => customer.updateName(longName)).toThrow(
        InvalidCustomerNameException,
      );
    });

    it("should trim whitespace from name", () => {
      const customer = Customer.create(
        UUID.generate(),
        UUID.generate(),
        WhatsAppPhone.fromString("+18095551234"),
        null,
      );

      customer.updateName("  María García  ");

      expect(customer.getName()).toBe("María García");
    });
  });

  describe("fromPersistence", () => {
    it("should reconstruct customer with correct version", () => {
      const customer = Customer.fromPersistence(
        UUID.generate(),
        UUID.generate(),
        WhatsAppPhone.fromString("+18095551234"),
        "Juan Pérez",
        5,
        new Date(),
        new Date(),
      );

      expect(customer.getVersion().getValue()).toBe(5);
      expect(customer.getName()).toBe("Juan Pérez");
    });
  });
});
```

### 9.2 Integration Tests

#### IdentifyCustomerHandler

**Ubicación**: `apps/backend/src/customer/app/commands/identify-customer/__tests__/handler.integration.spec.ts`

```typescript
import { Test, TestingModule } from "@nestjs/testing";
import { IdentifyCustomerHandler } from "../handler";
import { IdentifyCustomerCommand } from "../command";
import { CustomerFactory } from "../../../../infra/persistence/factories/customer.factory";
import { CustomerWriteRepository } from "../../../../infra/persistence/repositories/customer-write.repository";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CustomerModel } from "../../../../infra/persistence/models/customer.model";

describe("IdentifyCustomerHandler (Integration)", () => {
  let handler: IdentifyCustomerHandler;
  let factory: CustomerFactory;
  let writeRepo: CustomerWriteRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: "postgres",
          host: "localhost",
          port: 5432,
          username: "test",
          password: "test",
          database: "test_db",
          entities: [CustomerModel],
          synchronize: true,
        }),
        TypeOrmModule.forFeature([CustomerModel]),
      ],
      providers: [
        IdentifyCustomerHandler,
        {
          provide: "ICustomerFactory",
          useClass: CustomerFactory,
        },
        {
          provide: "ICustomerWriteRepository",
          useClass: CustomerWriteRepository,
        },
      ],
    }).compile();

    handler = module.get<IdentifyCustomerHandler>(IdentifyCustomerHandler);
    factory = module.get<CustomerFactory>("ICustomerFactory");
    writeRepo = module.get<CustomerWriteRepository>("ICustomerWriteRepository");
  });

  it("should create new customer when not exists", async () => {
    const command = new IdentifyCustomerCommand(
      "business-id",
      "+18095551234",
      "Juan Pérez",
    );

    const result = await handler.execute(command);

    expect(result.customerId).toBeDefined();

    const customer = await factory.loadById(result.customerId);
    expect(customer).toBeDefined();
    expect(customer!.getName()).toBe("Juan Pérez");
  });

  it("should return existing customer when already exists", async () => {
    const command = new IdentifyCustomerCommand(
      "business-id",
      "+18095551234",
      "Juan Pérez",
    );

    const result1 = await handler.execute(command);
    const result2 = await handler.execute(command);

    expect(result1.customerId).toBe(result2.customerId);
  });

  it("should update name when customer exists with different name", async () => {
    const command1 = new IdentifyCustomerCommand(
      "business-id",
      "+18095551234",
      null,
    );

    const result1 = await handler.execute(command1);

    const command2 = new IdentifyCustomerCommand(
      "business-id",
      "+18095551234",
      "Juan Pérez",
    );

    const result2 = await handler.execute(command2);

    expect(result1.customerId).toBe(result2.customerId);

    const customer = await factory.loadById(result2.customerId);
    expect(customer!.getName()).toBe("Juan Pérez");
  });
});
```

### 9.3 Property-Based Tests

**Ubicación**: `apps/backend/src/customer/domain/vo/__tests__/whatsapp-phone.pbt.spec.ts`

```typescript
import { fc, test } from "@fast-check/vitest";
import { WhatsAppPhone } from "../whatsapp-phone.vo";

describe("WhatsAppPhone PBT", () => {
  test.prop([
    fc.integer({ min: 1, max: 9 }),
    fc.array(fc.integer({ min: 0, max: 9 }), { minLength: 1, maxLength: 14 }),
  ])(
    "should preserve format in round-trip for valid E.164 numbers",
    (countryCode, digits) => {
      const phone = `+${countryCode}${digits.join("")}`;
      const whatsappPhone = WhatsAppPhone.fromString(phone);
      expect(whatsappPhone.getValue()).toBe(phone);
    },
  );

  test.prop([fc.string().filter((s) => !s.startsWith("+") || s.length < 3)])(
    "should reject invalid formats",
    (invalidPhone) => {
      expect(() => WhatsAppPhone.fromString(invalidPhone)).toThrow();
    },
  );
});
```

## 10. Error Handling

### 10.1 Exception Filter

**Ubicación**: `apps/backend/src/shared/filters/domain-exception.filter.ts`

```typescript
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
} from "@nestjs/common";
import { FastifyReply } from "fastify";
import { InvalidWhatsAppPhoneException } from "@customer/domain/exceptions/invalid-whatsapp-phone.exception";
import { InvalidCustomerNameException } from "@customer/domain/exceptions/invalid-customer-name.exception";
import { CustomerNotFoundException } from "@customer/domain/exceptions/customer-not-found.exception";

@Catch()
export class DomainExceptionFilter implements ExceptionFilter {
  catch(exception: Error, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const reply = ctx.getResponse<FastifyReply>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = exception.message;

    // Map domain exceptions to HTTP status codes
    if (
      exception instanceof InvalidWhatsAppPhoneException ||
      exception instanceof InvalidCustomerNameException
    ) {
      statusCode = HttpStatus.BAD_REQUEST;
    } else if (exception instanceof CustomerNotFoundException) {
      statusCode = HttpStatus.NOT_FOUND;
    }

    reply.status(statusCode).send({
      statusCode,
      message,
      error: exception.name,
      timestamp: new Date().toISOString(),
    });
  }
}
```

## 11. Validation Steps

After implementing each component, run:

```bash
# TypeScript type checking
pnpm --filter backend typecheck

# Linting
pnpm --filter backend lint

# Formatting
pnpm --filter backend format

# Unit tests
pnpm --filter backend test

# Integration tests (with test database)
pnpm --filter backend test:integration

# All validations
pnpm --filter backend typecheck && \
pnpm --filter backend lint && \
pnpm --filter backend format && \
pnpm --filter backend test
```

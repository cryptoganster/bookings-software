# Design Document - Implement Production Persistence and Remove Mocks

## Overview

Este diseño documenta cómo implementar completamente la persistencia de Conversation BC con TypeORM, eliminando todos los mocks y haciendo el sistema production-ready.

**Objetivo:** Eliminar MockConversationWriteRepository e implementar persistencia real con optimistic locking.

## Architecture

### Current State (Con Mock)

```
ProcessIncomingMessageHandler
    ↓
MockConversationWriteRepository (in-memory Map)
    ↓
conversationsStore (global Map) ← ❌ Temporal
```

### Target State (Production)

```
ProcessIncomingMessageHandler
    ↓
IConversationFactory.loadByCustomerIdAndBusinessId()
    ↓
ConversationFactory (TypeORM)
    ↓
Repository<ConversationModel>
    ↓
PostgreSQL Database ← ✅ Persistencia real

ProcessIncomingMessageHandler
    ↓
IConversationWriteRepository.save()
    ↓
ConversationWriteRepository (TypeORM + Optimistic Locking)
    ↓
PostgreSQL Database ← ✅ Persistencia real
```

## Components and Interfaces

### 1. ConversationWriteMapper (Nuevo)

**Ubicación:** `apps/backend/src/conversation/infra/persistence/mappers/conversation-write.mapper.ts`

**Responsabilidad:** Convertir entre Conversation aggregate y ConversationModel

**Implementación:**

```typescript
import { Conversation } from "@conversation/domain/aggregates/conversation";
import { ConversationModel } from "@conversation/infra/persistence/models/conversation.model";
import { UUID } from "@shared/vo/uuid.vo";
import { ConversationStatus } from "@conversation/domain/vo/conversation-status";
import { ConversationState } from "@conversation/domain/vo/conversation-state";

export class ConversationWriteMapper {
  /**
   * Convierte Conversation aggregate a ConversationModel
   */
  static toModel(conversation: Conversation): ConversationModel {
    const model = new ConversationModel();

    model.id = conversation.getId().getValue();
    model.businessId = conversation.getBusinessId().getValue();
    model.customerId = conversation.getCustomerId().getValue();
    model.customerPhone = conversation.getCustomerPhone();
    model.status = conversation.getStatus().getValue();
    model.state = conversation.getState().getValue();
    model.selectedOfferingId = conversation.getSelectedOfferingId()?.getValue();
    model.selectedDate = conversation.getSelectedDate();
    model.selectedTime = conversation.getSelectedTime();
    model.createdAppointmentId = conversation
      .getCreatedAppointmentId()
      ?.getValue();
    model.lastMessageAt = conversation.getLastMessageAt();
    model.version = conversation.getVersion().getValue();

    return model;
  }

  /**
   * Reconstruye Conversation aggregate desde ConversationModel
   * Usado por ConversationFactory
   */
  static toDomain(model: ConversationModel): Conversation {
    return Conversation.fromPersistence(
      UUID.fromString(model.id),
      UUID.fromString(model.businessId),
      UUID.fromString(model.customerId),
      model.customerPhone,
      ConversationStatus.fromString(model.status),
      ConversationState.fromString(model.state),
      model.selectedOfferingId
        ? UUID.fromString(model.selectedOfferingId)
        : undefined,
      model.selectedDate,
      model.selectedTime,
      model.createdAppointmentId
        ? UUID.fromString(model.createdAppointmentId)
        : undefined,
      model.lastMessageAt,
      model.version,
    );
  }
}
```

### 2. ConversationWriteRepository (Nuevo)

**Ubicación:** `apps/backend/src/conversation/infra/persistence/repositories/conversation-write.repository.ts`

**Responsabilidad:** Persistir conversations con optimistic locking

**Implementación:**

```typescript
import { Injectable, Inject } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Conversation } from "@conversation/domain/aggregates/conversation";
import { IConversationWriteRepository } from "@conversation/domain/interfaces/repositories/conversation-write";
import { ConversationModel } from "@conversation/infra/persistence/models/conversation.model";
import { ConversationWriteMapper } from "@conversation/infra/persistence/mappers/conversation-write.mapper";
import { IUnitOfWork } from "@shared/kernel/uow.interface";
import { ConcurrencyException } from "@shared/kernel/exceptions/concurrency.exception";

@Injectable()
export class ConversationWriteRepository implements IConversationWriteRepository {
  constructor(
    @InjectRepository(ConversationModel)
    private readonly repository: Repository<ConversationModel>,
    @Inject("IUnitOfWork")
    private readonly uow: IUnitOfWork,
  ) {}

  async save(conversation: Conversation): Promise<void> {
    await this.uow.transaction(async () => {
      const model = ConversationWriteMapper.toModel(conversation);
      const currentVersion = conversation.getVersion().getValue();

      // Check if conversation exists
      const existing = await this.repository.findOne({
        where: { id: model.id },
      });

      if (!existing) {
        // INSERT: New conversation
        await this.repository.save(model);
      } else {
        // UPDATE: Existing conversation with optimistic locking
        const result = await this.repository
          .createQueryBuilder()
          .update(ConversationModel)
          .set({
            ...model,
            version: currentVersion + 1,
          })
          .where("id = :id", { id: model.id })
          .andWhere("version = :version", { version: currentVersion })
          .execute();

        if (result.affected === 0) {
          throw new ConcurrencyException(
            `Conversation ${model.id} was modified by another transaction`,
          );
        }
      }
    });
  }
}
```

### 3. ConversationFactory (Actualizado)

**Ubicación:** `apps/backend/src/conversation/infra/persistence/factories/conversation-factory.ts`

**Cambios:** Implementar loadById y loadByCustomerIdAndBusinessId con TypeORM

**Implementación:**

```typescript
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Conversation } from "@conversation/domain/aggregates/conversation";
import { IConversationFactory } from "@conversation/domain/interfaces/factories/conversation-factory";
import { UUID } from "@shared/vo/uuid.vo";
import { ConversationModel } from "@conversation/infra/persistence/models/conversation.model";
import { ConversationWriteMapper } from "@conversation/infra/persistence/mappers/conversation-write.mapper";

@Injectable()
export class ConversationFactory implements IConversationFactory {
  constructor(
    @InjectRepository(ConversationModel)
    private readonly repository: Repository<ConversationModel>,
  ) {}

  async loadById(id: UUID): Promise<Conversation | null> {
    const model = await this.repository.findOne({
      where: { id: id.getValue() },
    });

    if (!model) {
      return null;
    }

    return ConversationWriteMapper.toDomain(model);
  }

  async loadByCustomerIdAndBusinessId(
    customerId: UUID,
    businessId: UUID,
  ): Promise<Conversation | null> {
    const model = await this.repository.findOne({
      where: {
        customerId: customerId.getValue(),
        businessId: businessId.getValue(),
      },
    });

    if (!model) {
      return null;
    }

    return ConversationWriteMapper.toDomain(model);
  }
}
```

### 4. ProcessIncomingMessageHandler (Actualizado)

**Ubicación:** `apps/backend/src/conversation/app/commands/process-incoming-message/handler.ts`

**Cambios:**

- Eliminar interface MockConversationRepository
- Inyectar IConversationFactory en lugar de repository
- Usar factory.loadByCustomerIdAndBusinessId()
- Agregar retry logic para ConcurrencyException

**Implementación:**

```typescript
import { CommandHandler, ICommandHandler, EventBus } from "@nestjs/cqrs";
import { Inject } from "@nestjs/common";
import { PinoLogger } from "nestjs-pino";
import { ProcessIncomingMessageCommand } from "@conversation/app/commands/process-incoming-message/command";
import { IConversationFactory } from "@conversation/domain/interfaces/factories/conversation-factory";
import { IConversationWriteRepository } from "@conversation/domain/interfaces/repositories/conversation-write";
import { IWhatsAppClient } from "@conversation/domain/interfaces/external/whatsapp-client.interface";
import { UUID } from "@shared/vo/uuid.vo";
import { Conversation } from "@conversation/domain/aggregates/conversation";
import { ConcurrencyException } from "@shared/kernel/exceptions/concurrency.exception";

@CommandHandler(ProcessIncomingMessageCommand)
export class ProcessIncomingMessageHandler implements ICommandHandler<ProcessIncomingMessageCommand> {
  constructor(
    @Inject("IConversationFactory")
    private readonly conversationFactory: IConversationFactory,
    @Inject("IConversationWriteRepository")
    private readonly conversationRepository: IConversationWriteRepository,
    @Inject("IWhatsAppClient")
    private readonly whatsappClient: IWhatsAppClient,
    private readonly eventBus: EventBus,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(ProcessIncomingMessageHandler.name);
  }

  async execute(command: ProcessIncomingMessageCommand): Promise<void> {
    const maxRetries = 3;
    let attempt = 0;

    while (attempt < maxRetries) {
      try {
        await this.processMessage(command);
        return; // Success
      } catch (error) {
        if (error instanceof ConcurrencyException) {
          attempt++;
          if (attempt >= maxRetries) {
            this.logger.error(
              {
                error: error.message,
                attempts: attempt,
                customerPhone: command.customerPhone,
              },
              "Failed to process message after max retries",
            );
            throw new Error("Unable to process message. Please try again.");
          }
          // Exponential backoff
          await new Promise((resolve) =>
            setTimeout(resolve, 100 * Math.pow(2, attempt)),
          );
        } else {
          throw error;
        }
      }
    }
  }

  private async processMessage(
    command: ProcessIncomingMessageCommand,
  ): Promise<void> {
    // 1. Load or create conversation using factory
    let conversation =
      await this.conversationFactory.loadByCustomerIdAndBusinessId(
        UUID.fromString(command.customerId),
        UUID.fromString(command.businessId),
      );

    if (!conversation) {
      // Create new conversation
      conversation = Conversation.start(
        UUID.generate(),
        UUID.fromString(command.businessId),
        UUID.fromString(command.customerId),
        command.customerPhone,
      );
    }

    // 2. Process message based on current state
    // ... (resto de la lógica igual)

    // 3. Save conversation
    await this.conversationRepository.save(conversation);
  }
}
```

### 5. conversation.module.ts (Actualizado)

**Cambios:**

- Eliminar MockConversationWriteRepository class
- Eliminar conversationsStore Map
- Registrar ConversationWriteRepository real
- Registrar ConversationFactory con TypeORM

**Implementación:**

```typescript
import { Module } from "@nestjs/common";
import { CqrsModule } from "@nestjs/cqrs";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConversationModel } from "@conversation/infra/persistence/models/conversation.model";
import { MessageModel } from "@conversation/infra/persistence/models/message.model";
import { ConversationWriteRepository } from "@conversation/infra/persistence/repositories/conversation-write.repository";
import { ConversationReadRepository } from "@conversation/infra/persistence/repositories/conversation-read.repository";
import { MessageWriteRepository } from "@conversation/infra/persistence/repositories/message-write.repository";
import { MessageReadRepository } from "@conversation/infra/persistence/repositories/message-read.repository";
import { ConversationFactory } from "@conversation/infra/persistence/factories/conversation-factory";
// ... otros imports

@Module({
  imports: [
    CqrsModule,
    TypeOrmModule.forFeature([ConversationModel, MessageModel]),
    // ... otros imports
  ],
  controllers: [WebhookController],
  providers: [
    // Factories
    {
      provide: "IConversationFactory",
      useClass: ConversationFactory,
    },

    // Write Repositories
    {
      provide: "IConversationWriteRepository",
      useClass: ConversationWriteRepository,
    },
    {
      provide: "IMessageWriteRepository",
      useClass: MessageWriteRepository,
    },

    // Read Repositories
    {
      provide: "IConversationReadRepository",
      useClass: ConversationReadRepository,
    },
    {
      provide: "IMessageReadRepository",
      useClass: MessageReadRepository,
    },

    // Command Handlers
    ProcessIncomingMessageHandler,
    SendWhatsAppMessageHandler,
    SendAdminResponseHandler,

    // Query Handlers
    GetConversationHandler,
    GetPendingAdminQueriesHandler,
    GetConversationHistoryHandler,

    // Event Handlers
    OnAppointmentCreatedHandler,
    OnAppointmentCancelledHandler,

    // External Clients
    {
      provide: "IWhatsAppClient",
      useClass: MockWhatsAppClient, // TODO: Replace with real client in production
    },

    // Guards
    WhatsAppSignatureGuard,
  ],
  exports: [
    "IConversationFactory",
    "IConversationWriteRepository",
    "IConversationReadRepository",
  ],
})
export class ConversationModule {}
```

### 6. Conversation Aggregate (Actualizado)

**Ubicación:** `apps/backend/src/conversation/domain/aggregates/conversation.ts`

**Cambios:** Agregar método estático `fromPersistence()`

**Implementación:**

```typescript
export class Conversation extends VersionedAggregateRoot {
  // ... campos existentes

  /**
   * Factory method para reconstruir desde persistencia
   * Usado por ConversationFactory
   */
  static fromPersistence(
    id: UUID,
    businessId: UUID,
    customerId: UUID,
    customerPhone: string,
    status: ConversationStatus,
    state: ConversationState,
    selectedOfferingId?: UUID,
    selectedDate?: Date,
    selectedTime?: Date,
    createdAppointmentId?: UUID,
    lastMessageAt?: Date,
    version?: number,
  ): Conversation {
    const conversation = new Conversation();
    conversation.id = id;
    conversation.businessId = businessId;
    conversation.customerId = customerId;
    conversation.customerPhone = customerPhone;
    conversation.status = status;
    conversation.state = state;
    conversation.selectedOfferingId = selectedOfferingId;
    conversation.selectedDate = selectedDate;
    conversation.selectedTime = selectedTime;
    conversation.createdAppointmentId = createdAppointmentId;
    conversation.lastMessageAt = lastMessageAt;
    if (version !== undefined) {
      conversation.setVersion(version);
    }
    return conversation;
  }
}
```

### 7. Frontend - SchedulesPage Modals (Nuevo)

**Ubicación:** `apps/frontend/src/pages/SchedulesPage/ui/`

**Componentes nuevos:**

- `ScheduleCreateModal.tsx`
- `ScheduleEditModal.tsx`

**Implementación:**

```typescript
// ScheduleCreateModal.tsx
import { Modal, TextInput, Select, Button, Group } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useCreateSchedule } from '@entities/schedule';

interface Props {
  opened: boolean;
  onClose: () => void;
}

export function ScheduleCreateModal({ opened, onClose }: Props) {
  const createSchedule = useCreateSchedule();

  const form = useForm({
    initialValues: {
      dayOfWeek: '',
      startTime: '',
      endTime: '',
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    await createSchedule.mutateAsync(values);
    onClose();
    form.reset();
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Crear Horario">
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Select
          label="Día de la semana"
          data={[
            { value: '0', label: 'Domingo' },
            { value: '1', label: 'Lunes' },
            // ... resto de días
          ]}
          {...form.getInputProps('dayOfWeek')}
        />
        <TextInput
          label="Hora de inicio"
          type="time"
          {...form.getInputProps('startTime')}
        />
        <TextInput
          label="Hora de fin"
          type="time"
          {...form.getInputProps('endTime')}
        />
        <Group justify="flex-end" mt="md">
          <Button variant="subtle" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={createSchedule.isPending}>
            Guardar
          </Button>
        </Group>
      </form>
    </Modal>
  );
}
```

## Data Models

### ConversationModel (Ya existe)

Ya implementado en `apps/backend/src/conversation/infra/persistence/models/conversation.model.ts`

### MessageModel (Ya existe)

Ya implementado en `apps/backend/src/conversation/infra/persistence/models/message.model.ts`

## Error Handling

### Optimistic Locking

**Escenario:** Dos mensajes llegan simultáneamente para la misma conversation

**Flujo:**

1. Handler 1 carga conversation (version=5)
2. Handler 2 carga conversation (version=5)
3. Handler 1 guarda conversation → version=6 ✅
4. Handler 2 intenta guardar → version=5 no coincide → ConcurrencyException ❌
5. Handler 2 reintenta (máximo 3 veces)
6. Handler 2 carga conversation (version=6)
7. Handler 2 guarda conversation → version=7 ✅

## Testing Strategy

### Unit Tests

**Test:** ConversationWriteMapper

```typescript
describe("ConversationWriteMapper", () => {
  it("should convert aggregate to model", () => {
    const conversation = Conversation.start(/* ... */);
    const model = ConversationWriteMapper.toModel(conversation);

    expect(model.id).toBe(conversation.getId().getValue());
    expect(model.version).toBe(conversation.getVersion().getValue());
  });

  it("should reconstruct aggregate from model", () => {
    const model = new ConversationModel();
    // ... set fields

    const conversation = ConversationWriteMapper.toDomain(model);

    expect(conversation.getId().getValue()).toBe(model.id);
    expect(conversation.getVersion().getValue()).toBe(model.version);
  });
});
```

### Integration Tests

**Test:** ConversationWriteRepository con optimistic locking

```typescript
describe("ConversationWriteRepository", () => {
  it("should save new conversation", async () => {
    const conversation = Conversation.start(/* ... */);

    await repository.save(conversation);

    const saved = await dataSource
      .getRepository(ConversationModel)
      .findOne({ where: { id: conversation.getId().getValue() } });

    expect(saved).toBeDefined();
    expect(saved.version).toBe(0);
  });

  it("should throw ConcurrencyException on version mismatch", async () => {
    // ... setup conversation with version=5

    // Simulate concurrent update
    await dataSource.query(
      "UPDATE conversations SET version = 6 WHERE id = $1",
      [conversationId],
    );

    await expect(repository.save(conversation)).rejects.toThrow(
      ConcurrencyException,
    );
  });
});
```

### E2E Tests

**Test:** ProcessIncomingMessageHandler con retry logic

```typescript
describe("ProcessIncomingMessageHandler E2E", () => {
  it("should handle concurrent messages with retry", async () => {
    // Send two messages simultaneously
    const [result1, result2] = await Promise.all([
      commandBus.execute(new ProcessIncomingMessageCommand(/* ... */)),
      commandBus.execute(new ProcessIncomingMessageCommand(/* ... */)),
    ]);

    // Both should succeed (one retries)
    expect(result1).toBeDefined();
    expect(result2).toBeDefined();

    // Conversation should have both messages
    const conversation = await factory.loadById(conversationId);
    expect(conversation.getMessages()).toHaveLength(2);
  });
});
```

## Deployment Considerations

### Database

**Migración:** No requiere nueva migración (tablas ya existen)

**Seed:** Actualizar conversation.seed.ts para usar repository real

### Performance

**Optimistic Locking:**

- Retry logic con exponential backoff
- Máximo 3 intentos
- Tiempo de espera: 100ms, 200ms, 400ms

**Queries:**

- Índice en (customer_id, business_id) ya existe
- Índice en id (primary key) ya existe

## Security Considerations

No hay cambios de seguridad.

## Monitoring and Logging

**Logs adicionales:**

- Log cuando se reintenta por ConcurrencyException
- Log cuando se alcanza máximo de reintentos
- Log cuando se crea nueva conversation vs se carga existente

## Summary

Este diseño implementa completamente la persistencia de Conversation BC con TypeORM, eliminando el mock y haciendo el sistema production-ready.

**Archivos a crear:**

1. `conversation-write.mapper.ts` - Mapper aggregate ↔ model
2. `conversation-write.repository.ts` - Repository real con optimistic locking
3. `ScheduleCreateModal.tsx` - Modal de creación
4. `ScheduleEditModal.tsx` - Modal de edición

**Archivos a modificar:**

1. `conversation-factory.ts` - Implementar loadById y loadByCustomerIdAndBusinessId
2. `process-incoming-message/handler.ts` - Usar factory + retry logic
3. `conversation.module.ts` - Eliminar mock, registrar implementaciones reales
4. `conversation.ts` (aggregate) - Agregar fromPersistence()
5. `SchedulesPage.tsx` - Integrar modals
6. Eliminar `whatsapp-number-already-exists.ts` (deprecated)

Total: 4 archivos nuevos, 6 archivos modificados, 1 archivo eliminado

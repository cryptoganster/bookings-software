# Conversation BC - Real Persistence Implementation

**Priority:** P0 (Critical)  
**Estimated Effort:** 2-3 days

## Overview

Replace temporary mock implementations with real TypeORM persistence for Conversation BC.

## Current State

### Temporary Mock Repository

**File:** `apps/backend/src/conversation/conversation.module.ts`

**Issue:**

```typescript
/**
 * TEMPORARY Mock Write Repository
 *
 * NOTE: This mock still includes read methods (findByCustomerIdAndBusinessId)
 * which violates CQRS strict compliance. This is acceptable temporarily because:
 * 1. No real persistence layer exists yet (no TypeORM models)
 * 2. ConversationFactory needs this method to load aggregates
 * 3. ProcessIncomingMessageHandler still uses the mock directly
 *
 * TODO: When real persistence is implemented:
 * 1. Create ConversationModel and MessageModel (TypeORM entities)
 * 2. Remove findByCustomerIdAndBusinessId from this mock
 * 3. Update ConversationFactory to use real TypeORM repository
 * 4. Update ProcessIncomingMessageHandler to use factory
 */
```

### Temporary Factory

**File:** `apps/backend/src/conversation/infra/persistence/factories/conversation-factory.ts`

**Issue:**

```typescript
/**
 * NOTE: This is a temporary implementation that works with the mock in-memory store.
 * When real persistence is implemented with TypeORM, this factory should be updated to:
 * 1. Inject Repository<ConversationModel>
 * 2. Use ConversationWriteMapper.toDomain() to reconstruct aggregates
 * 3. Preserve version for optimistic locking
 */
```

### Handler Using Mock Directly

**File:** `apps/backend/src/conversation/app/commands/process-incoming-message/handler.ts`

**Issue:**

```typescript
/**
 * TODO: When real persistence is implemented:
 * 1. Inject IConversationFactory instead of IConversationWriteRepository
 * 2. Use factory.loadByCustomerIdAndBusinessId() to load conversations
 * 3. Remove direct repository usage for loading
 */
```

## Implementation Plan

### Phase 1: Database Schema

#### 1.1 Create Conversations Table Migration

**File:** `apps/backend/src/database/migrations/YYYYMMDDHHMMSS-CreateConversationsTable.ts`

```typescript
export class CreateConversationsTable1234567890000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "conversations",
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
            name: "customer_id",
            type: "uuid",
            isNullable: false,
          },
          {
            name: "state",
            type: "varchar",
            length: "50",
            isNullable: false,
          },
          {
            name: "context",
            type: "jsonb",
            isNullable: true,
          },
          {
            name: "last_message_at",
            type: "timestamp",
            isNullable: true,
          },
          {
            name: "created_at",
            type: "timestamp",
            default: "CURRENT_TIMESTAMP",
          },
          {
            name: "version",
            type: "integer",
            default: 0,
          },
        ],
      }),
      true,
    );

    // Indexes
    await queryRunner.createIndex(
      "conversations",
      new TableIndex({
        name: "IDX_conversations_business_customer",
        columnNames: ["business_id", "customer_id"],
      }),
    );

    await queryRunner.createIndex(
      "conversations",
      new TableIndex({
        name: "IDX_conversations_business_id",
        columnNames: ["business_id"],
      }),
    );

    // Foreign keys
    await queryRunner.createForeignKey(
      "conversations",
      new TableForeignKey({
        columnNames: ["business_id"],
        referencedTableName: "businesses",
        referencedColumnNames: ["id"],
        onDelete: "CASCADE",
      }),
    );

    await queryRunner.createForeignKey(
      "conversations",
      new TableForeignKey({
        columnNames: ["customer_id"],
        referencedTableName: "customers",
        referencedColumnNames: ["id"],
        onDelete: "CASCADE",
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("conversations");
  }
}
```

#### 1.2 Create Messages Table Migration

**File:** `apps/backend/src/database/migrations/YYYYMMDDHHMMSS-CreateMessagesTable.ts`

```typescript
export class CreateMessagesTable1234567890001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "messages",
        columns: [
          {
            name: "id",
            type: "uuid",
            isPrimary: true,
          },
          {
            name: "conversation_id",
            type: "uuid",
            isNullable: false,
          },
          {
            name: "direction",
            type: "varchar",
            length: "20",
            isNullable: false,
          },
          {
            name: "content",
            type: "text",
            isNullable: false,
          },
          {
            name: "message_type",
            type: "varchar",
            length: "50",
            isNullable: false,
          },
          {
            name: "sent_at",
            type: "timestamp",
            default: "CURRENT_TIMESTAMP",
          },
          {
            name: "is_from_admin",
            type: "boolean",
            default: false,
          },
        ],
      }),
      true,
    );

    // Indexes
    await queryRunner.createIndex(
      "messages",
      new TableIndex({
        name: "IDX_messages_conversation_id",
        columnNames: ["conversation_id"],
      }),
    );

    await queryRunner.createIndex(
      "messages",
      new TableIndex({
        name: "IDX_messages_sent_at",
        columnNames: ["sent_at"],
      }),
    );

    // Foreign key
    await queryRunner.createForeignKey(
      "messages",
      new TableForeignKey({
        columnNames: ["conversation_id"],
        referencedTableName: "conversations",
        referencedColumnNames: ["id"],
        onDelete: "CASCADE",
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("messages");
  }
}
```

### Phase 2: TypeORM Models

#### 2.1 ConversationModel

**File:** `apps/backend/src/conversation/infra/persistence/models/conversation.model.ts`

```typescript
import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  Index,
  OneToMany,
} from "typeorm";
import { MessageModel } from "./message.model";

@Entity("conversations")
@Index(["business_id", "customer_id"])
export class ConversationModel {
  @PrimaryColumn("uuid")
  id!: string;

  @Column("uuid")
  @Index()
  business_id!: string;

  @Column("uuid")
  customer_id!: string;

  @Column("varchar", { length: 50 })
  state!: string;

  @Column("jsonb", { nullable: true })
  context!: Record<string, any> | null;

  @Column("timestamp", { nullable: true })
  last_message_at!: Date | null;

  @CreateDateColumn()
  created_at!: Date;

  @Column("integer", { default: 0 })
  version!: number;

  @OneToMany(() => MessageModel, (message) => message.conversation)
  messages!: MessageModel[];
}
```

#### 2.2 MessageModel

**File:** `apps/backend/src/conversation/infra/persistence/models/message.model.ts`

```typescript
import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { ConversationModel } from "./conversation.model";

@Entity("messages")
export class MessageModel {
  @PrimaryColumn("uuid")
  id!: string;

  @Column("uuid")
  @Index()
  conversation_id!: string;

  @Column("varchar", { length: 20 })
  direction!: string;

  @Column("text")
  content!: string;

  @Column("varchar", { length: 50 })
  message_type!: string;

  @CreateDateColumn()
  @Index()
  sent_at!: Date;

  @Column("boolean", { default: false })
  is_from_admin!: boolean;

  @ManyToOne(() => ConversationModel, (conversation) => conversation.messages)
  @JoinColumn({ name: "conversation_id" })
  conversation!: ConversationModel;
}
```

### Phase 3: Mappers

#### 3.1 ConversationWriteMapper

**File:** `apps/backend/src/conversation/infra/persistence/mappers/conversation-write.mapper.ts`

```typescript
import { Conversation } from "@conversation/domain/aggregates/conversation";
import { ConversationModel } from "../models/conversation.model";
import { UUID } from "@shared/vo/uuid";
import { ConversationState } from "@conversation/domain/vo/conversation-state";

export class ConversationWriteMapper {
  static toModel(aggregate: Conversation): ConversationModel {
    const model = new ConversationModel();
    model.id = aggregate.getId().getValue();
    model.business_id = aggregate.getBusinessId().getValue();
    model.customer_id = aggregate.getCustomerId().getValue();
    model.state = aggregate.getState().getValue();
    model.context = aggregate.getContext();
    model.last_message_at = aggregate.getLastMessageAt();
    model.version = aggregate.getVersion().getValue();
    return model;
  }

  static toDomain(model: ConversationModel): Conversation {
    return Conversation.fromPersistence(
      UUID.fromString(model.id),
      UUID.fromString(model.business_id),
      UUID.fromString(model.customer_id),
      ConversationState.fromString(model.state),
      model.context || {},
      model.last_message_at,
      model.version,
    );
  }
}
```

### Phase 4: Real Repository Implementation

#### 4.1 ConversationWriteRepository

**File:** `apps/backend/src/conversation/infra/persistence/repositories/conversation-write.repository.ts`

```typescript
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { IConversationWriteRepository } from "@conversation/domain/interfaces/repositories/conversation-write";
import { Conversation } from "@conversation/domain/aggregates/conversation";
import { ConversationModel } from "../models/conversation.model";
import { ConversationWriteMapper } from "../mappers/conversation-write.mapper";
import { IUnitOfWork } from "@shared/kernel/uow";
import { ConcurrencyException } from "@shared/kernel/exceptions/concurrency.exception";

@Injectable()
export class ConversationWriteRepository implements IConversationWriteRepository {
  constructor(
    @InjectRepository(ConversationModel)
    private readonly repository: Repository<ConversationModel>,
    private readonly uow: IUnitOfWork,
  ) {}

  async save(conversation: Conversation): Promise<void> {
    await this.uow.transaction(async () => {
      const model = ConversationWriteMapper.toModel(conversation);
      const currentVersion = conversation.getVersion().getValue();

      const result = await this.repository
        .createQueryBuilder()
        .insert()
        .into(ConversationModel)
        .values({
          ...model,
          version: currentVersion + 1,
        })
        .orUpdate(["state", "context", "last_message_at", "version"], ["id"], {
          skipUpdateIfNoValuesChanged: false,
        })
        .where("version = :version", { version: currentVersion })
        .execute();

      if (result.affected === 0) {
        throw new ConcurrencyException(
          `Conversation ${conversation.getId().getValue()} was modified by another transaction`,
        );
      }
    });
  }
}
```

#### 4.2 Update ConversationFactory

**File:** `apps/backend/src/conversation/infra/persistence/factories/conversation-factory.ts`

```typescript
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { IConversationFactory } from "@conversation/domain/interfaces/factories/conversation-factory";
import { Conversation } from "@conversation/domain/aggregates/conversation";
import { UUID } from "@shared/vo/uuid";
import { ConversationModel } from "../models/conversation.model";
import { ConversationWriteMapper } from "../mappers/conversation-write.mapper";

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
        customer_id: customerId.getValue(),
        business_id: businessId.getValue(),
      },
    });

    if (!model) {
      return null;
    }

    return ConversationWriteMapper.toDomain(model);
  }
}
```

### Phase 5: Update Handler

#### 5.1 ProcessIncomingMessageHandler

**File:** `apps/backend/src/conversation/app/commands/process-incoming-message/handler.ts`

Update to use factory instead of repository:

```typescript
@CommandHandler(ProcessIncomingMessageCommand)
export class ProcessIncomingMessageHandler implements ICommandHandler<ProcessIncomingMessageCommand> {
  constructor(
    @Inject("IConversationFactory")
    private readonly conversationFactory: IConversationFactory, // ← Changed from repository
    @Inject("IConversationWriteRepository")
    private readonly conversationWriteRepo: IConversationWriteRepository,
    // ... other dependencies
  ) {}

  async execute(command: ProcessIncomingMessageCommand): Promise<void> {
    // Load existing conversation using factory
    let conversation =
      await this.conversationFactory.loadByCustomerIdAndBusinessId(
        customerId,
        businessId,
      );

    if (!conversation) {
      // Create new conversation
      conversation = Conversation.start(/* ... */);
    }

    // ... rest of the logic
  }
}
```

### Phase 6: Update Module

**File:** `apps/backend/src/conversation/conversation.module.ts`

Remove mock, register real implementations:

```typescript
@Module({
  imports: [
    CqrsModule,
    TypeOrmModule.forFeature([ConversationModel, MessageModel]),
  ],
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
    // ... rest
  ],
})
export class ConversationModule {}
```

## Testing

### Unit Tests

Update factory tests:

- `apps/backend/src/conversation/infra/persistence/factories/__tests__/conversation-factory.spec.ts`

### Integration Tests

Add repository integration tests:

- `apps/backend/src/conversation/infra/persistence/repositories/__tests__/conversation-write.repository.integration.spec.ts`

### E2E Tests

Verify conversation flow still works:

- `apps/backend/src/conversation/presentation/controllers/__tests__/conversation-flow.e2e.spec.ts`

## Acceptance Criteria

- [ ] Migrations created and run successfully
- [ ] TypeORM models created
- [ ] Mappers implemented
- [ ] Real repository replaces mock
- [ ] Factory uses real TypeORM repository
- [ ] Handler uses factory instead of repository
- [ ] All tests pass
- [ ] No CQRS violations (write repo has no read methods)
- [ ] Optimistic locking works correctly

## Rollout Plan

1. Create migrations (can run immediately, tables will be empty)
2. Create models and mappers
3. Implement real repository
4. Update factory
5. Update handler
6. Update module
7. Run tests
8. Deploy

## Risks

- **Data Migration:** None (no existing data in mock)
- **Breaking Changes:** None (interface stays the same)
- **Performance:** Should improve (real DB vs in-memory)

## Notes

- This is a critical P0 task because the mock violates CQRS
- The mock is only acceptable for MVP/development
- Real persistence is required for production

# Design Document - Conversation BC Completion

## Overview

This design completes the Conversation Bounded Context by implementing the Message aggregate, missing commands/queries, persistence layer, and frontend integration. The implementation follows Clean Architecture, DDD, and CQRS patterns established in the codebase.

## Architecture

### Bounded Context Structure

```
src/conversation/
├── domain/
│   ├── aggregates/
│   │   ├── conversation.ts (✅ exists)
│   │   └── message.ts (❌ NEW)
│   ├── events/
│   │   ├── conversation-*.ts (✅ exists)
│   │   └── message-sent.ts (❌ NEW)
│   ├── vo/
│   │   ├── conversation-state.ts (✅ exists)
│   │   ├── message-direction.ts (❌ NEW)
│   │   └── message-type.ts (❌ NEW)
│   ├── read-models/
│   │   ├── conversation.ts (✅ exists, needs completion)
│   │   └── message.ts (❌ NEW)
│   └── interfaces/
│       ├── repositories/
│       │   ├── message-write.repository.interface.ts (❌ NEW)
│       │   └── message-read.repository.interface.ts (❌ NEW)
│       └── external/
│           └── whatsapp-client.interface.ts (✅ exists)
├── app/
│   ├── commands/
│   │   ├── process-incoming-message/ (✅ exists)
│   │   ├── send-admin-response/ (✅ exists)
│   │   └── send-whatsapp-message/ (❌ NEW)
│   ├── queries/
│   │   ├── get-conversation/ (✅ exists)
│   │   ├── get-pending-admin-queries/ (✅ exists)
│   │   └── get-conversation-history/ (❌ NEW)
│   └── event-handlers/
│       ├── on-appointment-created.handler.ts (❌ NEW)
│       └── on-appointment-cancelled.handler.ts (❌ NEW)
├── infra/
│   ├── persistence/
│   │   ├── models/
│   │   │   ├── conversation.model.ts (✅ exists)
│   │   │   └── message.model.ts (❌ NEW)
│   │   ├── repositories/
│   │   │   ├── message-write.repository.ts (❌ NEW)
│   │   │   └── message-read.repository.ts (❌ NEW)
│   │   └── mappers/
│   │       ├── message-write.mapper.ts (❌ NEW)
│   │       └── message-read.mapper.ts (❌ NEW)
│   └── external/
│       └── whatsapp-business-api.client.ts (✅ exists)
└── presentation/
    ├── controllers/
    │   └── conversation.controller.ts (✅ exists, needs enhancement)
    └── dtos/
        ├── send-admin-response.dto.ts (✅ exists)
        └── get-conversation-history.dto.ts (❌ NEW)
```

## Components and Interfaces

### 1. Message Aggregate

```typescript
export class Message {
  private id: UUID;
  private conversationId: UUID;
  private direction: MessageDirection;
  private content: string;
  private messageType: MessageType;
  private sentAt: Date;
  private isFromAdmin: boolean;

  static create(
    id: UUID,
    conversationId: UUID,
    direction: MessageDirection,
    content: string,
    messageType: MessageType,
    isFromAdmin: boolean,
  ): Message {
    // Validation
    if (!content || content.trim().length === 0) {
      throw new EmptyMessageContentException();
    }

    const message = new Message();
    message.id = id;
    message.conversationId = conversationId;
    message.direction = direction;
    message.content = content;
    message.messageType = messageType;
    message.sentAt = new Date();
    message.isFromAdmin = isFromAdmin;

    return message;
  }

  static fromPersistence(
    id: UUID,
    conversationId: UUID,
    direction: MessageDirection,
    content: string,
    messageType: MessageType,
    sentAt: Date,
    isFromAdmin: boolean,
  ): Message {
    const message = new Message();
    message.id = id;
    message.conversationId = conversationId;
    message.direction = direction;
    message.content = content;
    message.messageType = messageType;
    message.sentAt = sentAt;
    message.isFromAdmin = isFromAdmin;
    return message;
  }

  // Getters
  getId(): UUID {
    return this.id;
  }
  getConversationId(): UUID {
    return this.conversationId;
  }
  getDirection(): MessageDirection {
    return this.direction;
  }
  getContent(): string {
    return this.content;
  }
  getMessageType(): MessageType {
    return this.messageType;
  }
  getSentAt(): Date {
    return this.sentAt;
  }
  isFromAdminUser(): boolean {
    return this.isFromAdmin;
  }
}
```

### 2. Value Objects

```typescript
export class MessageDirection extends ValueObject {
  private constructor(private readonly value: string) {
    super();
    if (!["INBOUND", "OUTBOUND"].includes(value)) {
      throw new InvalidMessageDirectionException(value);
    }
  }

  static inbound(): MessageDirection {
    return new MessageDirection("INBOUND");
  }

  static outbound(): MessageDirection {
    return new MessageDirection("OUTBOUND");
  }

  static fromString(value: string): MessageDirection {
    return new MessageDirection(value);
  }

  getValue(): string {
    return this.value;
  }

  isInbound(): boolean {
    return this.value === "INBOUND";
  }

  isOutbound(): boolean {
    return this.value === "OUTBOUND";
  }

  protected getEqualityComponents(): any[] {
    return [this.value];
  }
}

export class MessageType extends ValueObject {
  private constructor(private readonly value: string) {
    super();
    if (!["TEXT", "BUTTON", "LOCATION"].includes(value)) {
      throw new InvalidMessageTypeException(value);
    }
  }

  static text(): MessageType {
    return new MessageType("TEXT");
  }

  static button(): MessageType {
    return new MessageType("BUTTON");
  }

  static location(): MessageType {
    return new MessageType("LOCATION");
  }

  static fromString(value: string): MessageType {
    return new MessageType(value);
  }

  getValue(): string {
    return this.value;
  }

  protected getEqualityComponents(): any[] {
    return [this.value];
  }
}
```

### 3. SendWhatsAppMessageCommand

```typescript
export class SendWhatsAppMessageCommand extends Command<{ messageId: string }> {
  constructor(
    public readonly conversationId: string,
    public readonly content: string,
    public readonly messageType: "TEXT" | "BUTTON" | "LOCATION",
    public readonly recipientPhone: string,
  ) {
    super();
  }
}

@CommandHandler(SendWhatsAppMessageCommand)
export class SendWhatsAppMessageHandler implements ICommandHandler<SendWhatsAppMessageCommand> {
  constructor(
    @Inject("IMessageWriteRepository")
    private readonly messageRepo: IMessageWriteRepository,
    @Inject("IWhatsAppClient")
    private readonly whatsappClient: IWhatsAppClient,
    private readonly uow: IUnitOfWork,
  ) {}

  async execute(
    command: SendWhatsAppMessageCommand,
  ): Promise<{ messageId: string }> {
    const maxRetries = 3;
    let attempt = 0;
    let lastError: Error | null = null;

    while (attempt < maxRetries) {
      try {
        return await this.uow.transaction(async () => {
          // 1. Create Message aggregate
          const messageId = UUID.generate();
          const message = Message.create(
            messageId,
            UUID.fromString(command.conversationId),
            MessageDirection.outbound(),
            command.content,
            MessageType.fromString(command.messageType),
            true, // isFromAdmin
          );

          // 2. Send via WhatsApp API
          await this.whatsappClient.sendMessage(
            command.recipientPhone,
            command.content,
          );

          // 3. Persist message
          await this.messageRepo.save(message);

          // 4. Publish event
          // Event will be published via EventBus

          return { messageId: messageId.getValue() };
        });
      } catch (error) {
        lastError = error as Error;
        attempt++;

        if (attempt >= maxRetries) {
          throw new WhatsAppMessageFailedException(
            `Failed to send message after ${maxRetries} attempts: ${lastError.message}`,
          );
        }

        // Exponential backoff
        await new Promise((resolve) =>
          setTimeout(resolve, 100 * Math.pow(2, attempt)),
        );
      }
    }

    throw lastError!;
  }
}
```

### 4. GetConversationHistoryQuery

```typescript
export class GetConversationHistoryQuery extends Query<MessageReadModel[]> {
  constructor(public readonly conversationId: string) {
    super();
  }
}

@QueryHandler(GetConversationHistoryQuery)
export class GetConversationHistoryHandler implements IQueryHandler<GetConversationHistoryQuery> {
  constructor(
    @Inject("IMessageReadRepository")
    private readonly messageReadRepo: IMessageReadRepository,
  ) {}

  async execute(
    query: GetConversationHistoryQuery,
  ): Promise<MessageReadModel[]> {
    return this.messageReadRepo.findByConversationId(query.conversationId);
  }
}
```

## Data Models

### Database Schema

```sql
-- messages table
CREATE TABLE messages (
  id UUID PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  direction VARCHAR(10) NOT NULL CHECK (direction IN ('INBOUND', 'OUTBOUND')),
  content TEXT NOT NULL,
  message_type VARCHAR(20) NOT NULL CHECK (message_type IN ('TEXT', 'BUTTON', 'LOCATION')),
  sent_at TIMESTAMP NOT NULL DEFAULT NOW(),
  is_from_admin BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),

  INDEX idx_messages_conversation_id (conversation_id),
  INDEX idx_messages_sent_at (sent_at)
);

-- Update conversations table to track last message
ALTER TABLE conversations ADD COLUMN last_message_at TIMESTAMP;
```

### TypeORM Models

```typescript
@Entity("messages")
export class MessageModel {
  @PrimaryColumn("uuid")
  id: string;

  @Column("uuid")
  conversationId: string;

  @Column("varchar", { length: 10 })
  direction: string;

  @Column("text")
  content: string;

  @Column("varchar", { length: 20 })
  messageType: string;

  @Column("timestamp")
  sentAt: Date;

  @Column("boolean")
  isFromAdmin: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
```

## Read Models

### ConversationReadModel (Enhanced)

```typescript
export class ConversationReadModel {
  constructor(
    public readonly id: string,
    public readonly businessId: string,
    public readonly customerId: string,
    public readonly customerName: string | null,
    public readonly customerPhone: string,
    public readonly status: string,
    public readonly lastMessageAt: Date,
    public readonly createdAt: Date,
  ) {}
}
```

### MessageReadModel

```typescript
export class MessageReadModel {
  constructor(
    public readonly id: string,
    public readonly conversationId: string,
    public readonly direction: "INBOUND" | "OUTBOUND",
    public readonly content: string,
    public readonly messageType: "TEXT" | "BUTTON" | "LOCATION",
    public readonly sentAt: Date,
    public readonly isFromAdmin: boolean,
  ) {}
}
```

## Shared Types Integration

Add to `packages/shared-types/src/index.ts`:

```typescript
// ============================================================================
// CONVERSATIONS & MESSAGES
// ============================================================================

/**
 * Conversation Read Model - Conversación con cliente
 *
 * @remarks
 * - customerName denormalized from Customer BC
 * - status: ACTIVE, AWAITING_ADMIN, RESOLVED
 * - lastMessageAt: timestamp of most recent message
 */
export interface ConversationReadModel {
  id: string;
  businessId: string;
  customerId: string;
  customerName: string | null;
  customerPhone: string;
  status: "ACTIVE" | "AWAITING_ADMIN" | "RESOLVED";
  lastMessageAt: string; // ISO 8601 string
  createdAt: string; // ISO 8601 string
}

/**
 * Message Read Model - Mensaje individual en conversación
 *
 * @remarks
 * - direction: INBOUND (from customer), OUTBOUND (to customer)
 * - messageType: TEXT, BUTTON, LOCATION
 * - isFromAdmin: true if sent by admin, false if automated
 */
export interface MessageReadModel {
  id: string;
  conversationId: string;
  direction: "INBOUND" | "OUTBOUND";
  content: string;
  messageType: "TEXT" | "BUTTON" | "LOCATION";
  sentAt: string; // ISO 8601 string
  isFromAdmin: boolean;
}

/**
 * DTO para enviar respuesta de admin
 */
export interface SendAdminResponseDto {
  content: string;
}
```

## Error Handling

### Domain Exceptions

```typescript
export class EmptyMessageContentException extends DomainException {
  constructor() {
    super("Message content cannot be empty");
  }
}

export class InvalidMessageDirectionException extends DomainException {
  constructor(value: string) {
    super(`Invalid message direction: ${value}`);
  }
}

export class InvalidMessageTypeException extends DomainException {
  constructor(value: string) {
    super(`Invalid message type: ${value}`);
  }
}

export class WhatsAppMessageFailedException extends DomainException {
  constructor(message: string) {
    super(message);
  }
}
```

## Testing Strategy

### Unit Tests

1. **Message Aggregate Tests**
   - Test factory method validation
   - Test getters
   - Test fromPersistence reconstruction

2. **Value Object Tests**
   - Test MessageDirection validation
   - Test MessageType validation
   - Test equality

3. **Command Handler Tests**
   - Test SendWhatsAppMessageHandler success path
   - Test retry logic on failure
   - Test transaction rollback on error

4. **Query Handler Tests**
   - Test GetConversationHistoryHandler
   - Test empty result handling

### Integration Tests

1. **Repository Tests**
   - Test MessageWriteRepository.save()
   - Test MessageReadRepository.findByConversationId()
   - Test ordering by sentAt

2. **Event Handler Tests**
   - Test OnAppointmentCreatedHandler triggers SendWhatsAppMessageCommand
   - Test OnAppointmentCancelledHandler triggers SendWhatsAppMessageCommand

### E2E Tests

1. **Conversation Flow**
   - Test GET /conversations returns pending conversations
   - Test GET /conversations/:id/messages returns history
   - Test POST /conversations/:id/respond sends message

## Frontend Integration

### API Services

```typescript
// apps/frontend/src/shared/api/services/conversation.service.ts
export const conversationService = {
  getPendingConversations: async (): Promise<ConversationReadModel[]> => {
    const { data } = await apiClient.get("/conversations");
    return data;
  },

  getConversationHistory: async (
    conversationId: string,
  ): Promise<MessageReadModel[]> => {
    const { data } = await apiClient.get(
      `/conversations/${conversationId}/messages`,
    );
    return data;
  },

  sendAdminResponse: async (
    conversationId: string,
    content: string,
  ): Promise<void> => {
    await apiClient.post(`/conversations/${conversationId}/respond`, {
      content,
    });
  },
};
```

### React Hooks

```typescript
// apps/frontend/src/entities/conversation/model/useConversations.ts
export function useConversations() {
  return useQuery({
    queryKey: ["conversations", "pending"],
    queryFn: conversationService.getPendingConversations,
  });
}

export function useConversationHistory(conversationId: string) {
  return useQuery({
    queryKey: ["conversations", conversationId, "messages"],
    queryFn: () => conversationService.getConversationHistory(conversationId),
    enabled: !!conversationId,
  });
}

export function useSendAdminResponse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      conversationId,
      content,
    }: {
      conversationId: string;
      content: string;
    }) => conversationService.sendAdminResponse(conversationId, content),
    onSuccess: (_, { conversationId }) => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      queryClient.invalidateQueries({
        queryKey: ["conversations", conversationId, "messages"],
      });
    },
  });
}
```

## API Endpoints

```typescript
@Controller("conversations")
@UseGuards(JwtAuthGuard)
export class ConversationController {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
  ) {}

  @Get()
  async getPendingConversations(@CurrentUser() user: UserPayload) {
    return this.queryBus.execute(
      new GetPendingAdminQueriesQuery(user.businessId),
    );
  }

  @Get(":id/messages")
  async getConversationHistory(@Param("id") id: string) {
    return this.queryBus.execute(new GetConversationHistoryQuery(id));
  }

  @Post(":id/respond")
  async sendAdminResponse(
    @Param("id") id: string,
    @Body() dto: SendAdminResponseDto,
  ) {
    await this.commandBus.execute(
      new SendAdminResponseCommand(id, dto.content),
    );
    return { message: "Response sent successfully" };
  }
}
```

## Event Integration

### Event Handlers

```typescript
@EventsHandler(AppointmentCreated)
export class OnAppointmentCreatedHandler implements IEventHandler<AppointmentCreated> {
  constructor(private readonly commandBus: CommandBus) {}

  async handle(event: AppointmentCreated) {
    try {
      // Send confirmation message to customer
      await this.commandBus.execute(
        new SendWhatsAppMessageCommand(
          event.conversationId,
          `✅ Cita confirmada para ${event.dateTime}`,
          "TEXT",
          event.customerPhone,
        ),
      );
    } catch (error) {
      // Log but don't propagate
      console.error("Failed to send appointment confirmation:", error);
    }
  }
}
```

## Performance Considerations

1. **Indexing:** Index on `conversation_id` and `sent_at` for fast message retrieval
2. **Pagination:** Implement pagination for conversation history (future enhancement)
3. **Caching:** Consider caching pending conversations count
4. **Async Processing:** WhatsApp API calls are async with retry logic

## Security

1. **Authentication:** All endpoints require JWT authentication
2. **Authorization:** Verify user has access to businessId
3. **Input Validation:** Validate message content length and format
4. **Rate Limiting:** Implement rate limiting on message sending (future)

## Migration Strategy

1. Create `messages` table migration
2. Add `last_message_at` column to `conversations` table
3. Run migrations in development
4. Test with sample data
5. Deploy to production with zero downtime

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system._

### Property 1: Message persistence consistency

_For any_ Message created, when saved and retrieved, all fields should match the original values
**Validates: Requirements 3.1, 3.3**

### Property 2: Message ordering

_For any_ conversation, when messages are retrieved, they should be ordered chronologically by sentAt
**Validates: Requirements 4.2**

### Property 3: WhatsApp retry idempotency

_For any_ SendWhatsAppMessageCommand, retrying should not create duplicate messages
**Validates: Requirements 2.3**

### Property 4: Message direction validation

_For any_ Message, direction must be either INBOUND or OUTBOUND
**Validates: Requirements 1.3**

### Property 5: Empty content rejection

_For any_ Message creation attempt with empty content, the system should throw EmptyMessageContentException
**Validates: Requirements 1.1**

### Property 6: Conversation history completeness

_For any_ conversation, GetConversationHistoryQuery should return all messages associated with that conversationId
**Validates: Requirements 4.1, 4.5**

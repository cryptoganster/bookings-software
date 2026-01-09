# Design: Conversation Backend-Frontend Implementation

## 1. Overview

### Architecture Summary

This implementation follows **Clean Architecture** principles with **Domain-Driven Design (DDD)** tactical patterns and **CQRS** (Command Query Responsibility Segregation) for strict separation of read and write operations.

**Key Architectural Decisions:**

1. **Backend:** NestJS with CQRS module (`@nestjs/cqrs`)
2. **Frontend:** React with TanStack Query for server state management
3. **Communication:** REST API with JSON payloads
4. **Concurrency:** Optimistic locking with version field
5. **State Management:** React Query for server state, local useState for UI state

### High-Level Flow

```
User Action (Frontend)
    ↓
React Query Hook
    ↓
API Service Layer
    ↓
HTTP Request (REST)
    ↓
NestJS Controller
    ↓
CommandBus / QueryBus
    ↓
Command/Query Handler
    ↓
Domain Aggregate / Read Repository
    ↓
Database (PostgreSQL)
```

---

## 2. Backend Architecture

### 2.1 Layer Structure

The backend follows Clean Architecture with four distinct layers:

#### Domain Layer (`src/conversation/domain/`)

**Responsibility:** Core business logic and domain model

**Components:**

- `aggregates/conversation.ts` - Conversation aggregate root
- `vo/conversation-state.ts` - Conversation state value object
- `events/` - Domain events (AdminQueryResolved, etc.)
- `read-models/` - DTOs for queries (ConversationReadModel, MessageReadModel)
- `interfaces/repositories/` - Repository contracts
- `exceptions/` - Domain-specific exceptions

**Key Rules:**

- No dependencies on outer layers
- Pure TypeScript (no framework dependencies)
- Business logic encapsulated in aggregates

#### Application Layer (`src/conversation/app/`)

**Responsibility:** Use cases and orchestration

**Components:**

- `commands/` - Write operations (SendAdminResponseCommand)
- `queries/` - Read operations (GetPendingAdminQueriesQuery, GetConversationHistoryQuery)
- `event_handlers/` - React to domain events

**Key Rules:**

- Orchestrates domain objects
- Uses CommandBus/QueryBus from @nestjs/cqrs
- Handles transactions via repositories
- No business logic (delegates to domain)

#### Infrastructure Layer (`src/conversation/infra/`)

**Responsibility:** Technical implementations

**Components:**

- `persistence/models/` - TypeORM entities
- `persistence/repositories/` - Repository implementations
- `persistence/mappers/` - Domain ↔ Model mappers
- `factories/` - Aggregate reconstruction from persistence

**Key Rules:**

- Implements domain interfaces
- Uses TypeORM for database access
- Handles optimistic locking in save operations

#### Presentation Layer (`src/conversation/presentation/`)

**Responsibility:** HTTP interface

**Components:**

- `controllers/admin-query.controller.ts` - REST endpoints
- `dtos/` - Request/response validation DTOs

**Key Rules:**

- Validates input with class-validator
- Delegates to CommandBus/QueryBus
- Returns JSON responses
- Handles HTTP concerns (status codes, headers)

### 2.2 CQRS Pattern

**Command Side (Write):**

```
SendAdminResponseCommand
    ↓
SendAdminResponseHandler
    ↓
IConversationFactory.loadById() → Conversation aggregate
    ↓
conversation.resolveAdminQuery() → Business logic + version increment
    ↓
IConversationWriteRepository.save() → Optimistic locking check
    ↓
Database UPDATE with version check
```

**Query Side (Read):**

```
GetPendingAdminQueriesQuery
    ↓
GetPendingAdminQueriesHandler
    ↓
IConversationReadRepository.findPendingByBusinessId()
    ↓
Database SELECT with JOIN (denormalized data)
    ↓
ConversationReadModel[]
```

**Key Separation:**

- Commands use Factory + Write Repository
- Queries use Read Repository only
- No read operations in command handlers
- No write operations in query handlers

---

## 3. Frontend Architecture

### 3.1 Layer Structure (Feature-Sliced Design)

The frontend follows Feature-Sliced Design (FSD) architecture:

#### Pages Layer (`src/pages/ConversationsPage/`)

**Responsibility:** Complete page composition

**Components:**

- `ConversationsPage.tsx` - Main page component

**Key Rules:**

- Composes widgets and features
- Manages page-level state
- Handles routing

#### Entities Layer (`src/entities/conversation/`)

**Responsibility:** Business entities and their logic

**Components:**

- `model/useConversations.ts` - React Query hooks
- `model/useConversationHistory.ts` - Message history hook
- `model/useSendAdminResponse.ts` - Send response mutation

**Key Rules:**

- Encapsulates server state management
- Defines query keys for cache management
- Handles optimistic updates
- Invalidates cache on mutations

#### Shared Layer (`src/shared/`)

**Responsibility:** Reusable utilities and services

**Components:**

- `api/client.ts` - Axios instance with interceptors
- `api/services/conversation.service.ts` - API service layer
- `ui/` - Reusable UI components

**Key Rules:**

- No business logic
- Framework-agnostic where possible
- Shared across all features

### 3.2 State Management Strategy

**Server State (TanStack Query):**

- Pending conversations list
- Conversation message history
- Automatic caching and refetching
- Optimistic updates for mutations

**UI State (React useState):**

- Selected conversation ID
- Modal open/closed state
- Response textarea content
- Form validation errors

**No Global State:**

- No Zustand/Redux needed for this feature
- React Query handles all server state
- Local state sufficient for UI concerns

---

## 4. Components

### 4.1 Backend Components

#### Conversation Aggregate

**File:** `src/conversation/domain/aggregates/conversation.ts`

**Responsibilities:**

- Encapsulate conversation business logic
- Manage conversation state transitions
- Enforce invariants (e.g., cannot resolve twice)
- Publish domain events

**Key Methods:**

```typescript
resolveAdminQuery(): void
  - Validates status is 'AWAITING_ADMIN'
  - Changes status to 'RESOLVED'
  - Increments version (optimistic locking)
  - Applies AdminQueryResolved event

static fromPersistence(...): Conversation
  - Reconstructs aggregate from database
  - Preserves version for optimistic locking
```

**State:**

- id: UUID
- businessId: UUID
- customerId: UUID
- status: 'ACTIVE' | 'AWAITING_ADMIN' | 'RESOLVED'
- state: ConversationState (state machine)
- version: number (for optimistic locking)

#### SendAdminResponseHandler

**File:** `src/conversation/app/commands/send-admin-response/handler.ts`

**Responsibilities:**

- Load conversation aggregate via factory
- Execute business logic (resolveAdminQuery)
- Save with optimistic locking
- Handle concurrency exceptions with retry
- Dispatch WhatsApp message command

**Flow:**

1. Load conversation using IConversationFactory
2. Validate conversation exists and user has access
3. Call conversation.resolveAdminQuery()
4. Save with IConversationWriteRepository (optimistic locking)
5. On ConcurrencyException: retry up to 3 times with exponential backoff
6. Dispatch SendWhatsAppMessageCommand

#### GetPendingAdminQueriesHandler

**File:** `src/conversation/app/queries/get-pending-admin-queries/handler.ts`

**Responsibilities:**

- Query pending conversations for a business
- Return denormalized read models

**Flow:**

1. Receive businessId from query
2. Call conversationReadRepo.findPendingByBusinessId()
3. Return ConversationReadModel[] with denormalized customer data

**SQL Query (conceptual):**

```sql
SELECT
  c.id, c.business_id, c.customer_id, c.status, c.last_message_at,
  cust.name as customer_name,
  cust.whatsapp_phone as customer_phone
FROM conversations c
LEFT JOIN customers cust ON cust.id = c.customer_id
WHERE c.business_id = :businessId
  AND c.status = 'AWAITING_ADMIN'
ORDER BY c.last_message_at DESC
```

#### AdminQueryController

**File:** `src/conversation/presentation/controllers/admin-query.controller.ts`

**Responsibilities:**

- Handle HTTP requests
- Validate DTOs
- Dispatch commands/queries
- Return HTTP responses

**Endpoints:**

- `GET /api/admin-queries/pending` → GetPendingAdminQueriesQuery
- `GET /api/admin-queries/:id/messages` → GetConversationHistoryQuery
- `POST /api/admin-queries/:id/respond` → SendAdminResponseCommand

**Guards:**

- JwtAuthGuard (authentication required)
- RolesGuard (BUSINESS_OWNER role required)

### 4.2 Frontend Components

#### ConversationsPage

**File:** `src/pages/ConversationsPage/ui/ConversationsPage.tsx`

**Responsibilities:**

- Display list of pending conversations
- Handle conversation selection
- Manage modal state
- Coordinate between hooks

**State:**

- selectedConversationId: string | null
- responseText: string

**Hooks Used:**

- useConversations() - Fetch pending list
- useConversationHistory(id) - Fetch messages
- useSendAdminResponse() - Send response mutation

**UI States:**

- Loading: Show skeleton loaders
- Error: Show alert with retry button
- Empty: Show empty state message
- Success: Show conversation cards

#### useConversations Hook

**File:** `src/entities/conversation/model/useConversations.ts`

**Responsibilities:**

- Fetch pending conversations
- Cache results
- Auto-refetch every 30 seconds
- Provide loading/error states

**Configuration:**

```typescript
useQuery({
  queryKey: ["conversations", "pending"],
  queryFn: conversationService.getPendingConversations,
  refetchInterval: 30000, // 30 seconds
});
```

#### useConversationHistory Hook

**File:** `src/entities/conversation/model/useConversations.ts`

**Responsibilities:**

- Fetch message history for a conversation
- Cache results per conversation
- Only fetch when conversationId is provided

**Configuration:**

```typescript
useQuery({
  queryKey: ["conversation-history", conversationId],
  queryFn: () => conversationService.getConversationHistory(conversationId),
  enabled: !!conversationId,
});
```

#### useSendAdminResponse Hook

**File:** `src/entities/conversation/model/useConversations.ts`

**Responsibilities:**

- Send admin response
- Optimistic update (add message immediately)
- Invalidate cache on success
- Revert on error

**Configuration:**

```typescript
useMutation({
  mutationFn: ({ conversationId, content }) =>
    conversationService.sendAdminResponse(conversationId, content),
  onSuccess: (_, { conversationId }) => {
    queryClient.invalidateQueries(["conversations", "pending"]);
    queryClient.invalidateQueries(["conversation-history", conversationId]);
  },
});
```

#### conversationService

**File:** `src/shared/api/services/conversation.service.ts`

**Responsibilities:**

- Encapsulate API calls
- Handle HTTP requests/responses
- Type-safe API layer

**Methods:**

```typescript
getPendingConversations(): Promise<ConversationReadModel[]>
getConversationHistory(id: string): Promise<MessageReadModel[]>
sendAdminResponse(id: string, content: string): Promise<void>
```

---

## 5. Data Models

### 5.1 Domain Models (Backend)

#### Conversation Aggregate

```typescript
class Conversation extends VersionedAggregateRoot {
  private id: UUID;
  private businessId: UUID;
  private customerId: UUID;
  private customerPhone: string;
  private status: 'ACTIVE' | 'AWAITING_ADMIN' | 'RESOLVED';
  private state: ConversationState;
  private version: number; // Optimistic locking

  resolveAdminQuery(): void;
  static fromPersistence(...): Conversation;
}
```

### 5.2 Read Models (Backend)

#### ConversationReadModel

```typescript
class ConversationReadModel {
  id: string;
  businessId: string;
  customerId: string;
  customerName: string | null; // Denormalized from Customer
  customerPhone: string; // Denormalized from Customer
  status: string;
  lastMessageAt: Date;
  createdAt: Date;
}
```

**Denormalization Strategy:**

- customerName and customerPhone are fetched via JOIN with customers table
- Avoids N+1 queries in frontend
- Read-optimized for display

#### MessageReadModel

```typescript
class MessageReadModel {
  id: string;
  conversationId: string;
  direction: "INBOUND" | "OUTBOUND";
  content: string;
  messageType: "TEXT" | "BUTTON" | "LOCATION";
  sentAt: string; // ISO 8601 string
  isFromAdmin: boolean;
}
```

### 5.3 DTOs (API Layer)

#### SendAdminResponseDto

```typescript
class SendAdminResponseDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  content: string;
}
```

**Validation:**

- content is required
- content cannot be empty
- content max 1000 characters (WhatsApp limit)

#### GetPendingQueriesDto

```typescript
class GetPendingQueriesDto {
  @IsUUID()
  businessId: string;
}
```

---

## 6. API Endpoints

### 6.1 GET /api/admin-queries/pending

**Purpose:** Fetch all pending conversations for a business

**Request:**

```http
GET /api/admin-queries/pending?businessId=<uuid>
Authorization: Bearer <jwt-token>
```

**Response (200 OK):**

```json
[
  {
    "id": "conv-uuid",
    "businessId": "business-uuid",
    "customerId": "customer-uuid",
    "customerName": "Juan Pérez",
    "customerPhone": "+18095551234",
    "status": "AWAITING_ADMIN",
    "lastMessageAt": "2024-12-18T10:30:00Z",
    "createdAt": "2024-12-18T09:00:00Z"
  }
]
```

**Error Responses:**

- 401 Unauthorized: Missing or invalid JWT
- 403 Forbidden: User does not have BUSINESS_OWNER role

### 6.2 GET /api/admin-queries/:id/messages

**Purpose:** Fetch message history for a conversation

**Request:**

```http
GET /api/admin-queries/conv-uuid/messages
Authorization: Bearer <jwt-token>
```

**Response (200 OK):**

```json
[
  {
    "id": "msg-uuid-1",
    "conversationId": "conv-uuid",
    "direction": "INBOUND",
    "content": "Hola, quisiera agendar una cita",
    "messageType": "TEXT",
    "sentAt": "2024-12-18T09:00:00Z",
    "isFromAdmin": false
  },
  {
    "id": "msg-uuid-2",
    "conversationId": "conv-uuid",
    "direction": "OUTBOUND",
    "content": "Claro, ¿qué día prefieres?",
    "messageType": "TEXT",
    "sentAt": "2024-12-18T10:30:00Z",
    "isFromAdmin": true
  }
]
```

**Error Responses:**

- 401 Unauthorized: Missing or invalid JWT
- 403 Forbidden: User does not own conversation's business
- 404 Not Found: Conversation does not exist

### 6.3 POST /api/admin-queries/:id/respond

**Purpose:** Send admin response to a conversation

**Request:**

```http
POST /api/admin-queries/conv-uuid/respond
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "content": "Claro, ¿qué día prefieres?"
}
```

**Response (200 OK):**

```json
{
  "message": "Response sent successfully"
}
```

**Error Responses:**

- 400 Bad Request: Validation error (empty content, too long)
- 401 Unauthorized: Missing or invalid JWT
- 403 Forbidden: User does not own conversation's business
- 404 Not Found: Conversation does not exist
- 409 Conflict: ConcurrencyException after retries

---

## 7. Data Flow

### 7.1 View Pending Conversations Flow

```
User navigates to /conversations
    ↓
ConversationsPage renders
    ↓
useConversations() hook executes
    ↓
conversationService.getPendingConversations()
    ↓
GET /api/admin-queries/pending
    ↓
AdminQueryController.getPending()
    ↓
QueryBus.execute(GetPendingAdminQueriesQuery)
    ↓
GetPendingAdminQueriesHandler.execute()
    ↓
conversationReadRepo.findPendingByBusinessId()
    ↓
SQL: SELECT with JOIN on customers
    ↓
Return ConversationReadModel[]
    ↓
React Query caches result
    ↓
ConversationsPage displays cards
```

### 7.2 View Conversation History Flow

```
User clicks conversation card
    ↓
setSelectedConversationId(id)
    ↓
Modal opens
    ↓
useConversationHistory(id) hook executes
    ↓
conversationService.getConversationHistory(id)
    ↓
GET /api/admin-queries/:id/messages
    ↓
AdminQueryController.getMessages()
    ↓
QueryBus.execute(GetConversationHistoryQuery)
    ↓
GetConversationHistoryHandler.execute()
    ↓
messageReadRepo.findByConversationId()
    ↓
SQL: SELECT messages ORDER BY sentAt ASC
    ↓
Return MessageReadModel[]
    ↓
React Query caches result
    ↓
Modal displays message thread
```

### 7.3 Send Admin Response Flow

```
User types response and clicks "Enviar"
    ↓
useSendAdminResponse().mutate()
    ↓
Optimistic update: Add message to UI immediately
    ↓
conversationService.sendAdminResponse(id, content)
    ↓
POST /api/admin-queries/:id/respond
    ↓
AdminQueryController.respond()
    ↓
Validate SendAdminResponseDto
    ↓
CommandBus.execute(SendAdminResponseCommand)
    ↓
SendAdminResponseHandler.execute()
    ↓
  1. conversationFactory.loadById(id)
  2. conversation.resolveAdminQuery()
  3. conversationWriteRepo.save(conversation)
     - Optimistic locking: UPDATE WHERE version = N
     - If affected = 0: throw ConcurrencyException
     - Retry up to 3 times
  4. commandBus.execute(SendWhatsAppMessageCommand)
    ↓
Return 200 OK
    ↓
React Query onSuccess:
  - Invalidate ['conversations', 'pending']
  - Invalidate ['conversation-history', id]
    ↓
Modal closes
    ↓
Conversation removed from pending list
```

### 7.4 Concurrent Update Flow

```
Admin A loads conversation (version=5)
Admin B loads conversation (version=5)
    ↓
Admin A sends response
  - conversation.resolveAdminQuery() → version=6
  - UPDATE WHERE version=5 → SUCCESS
    ↓
Admin B sends response
  - conversation.resolveAdminQuery() → version=6
  - UPDATE WHERE version=5 → FAIL (affected=0)
  - ConcurrencyException thrown
    ↓
Retry logic (attempt 1):
  - Load conversation again (version=6, status=RESOLVED)
  - conversation.resolveAdminQuery() → throws "already resolved"
  - Error propagated to frontend
    ↓
Frontend shows error toast
User sees: "Esta conversación ya fue respondida"
```

---

## 8. Correctness Properties

These properties are derived from the requirements and ensure system correctness:

### Property 1: Pending Queries Filter

**Statement:** The system SHALL only return conversations with status='AWAITING_ADMIN' when querying pending conversations.

**Formal:** `∀ conv ∈ GetPendingAdminQueriesResult ⇒ conv.status = 'AWAITING_ADMIN'`

**Test Strategy:** Property-based test with random conversation statuses

**Implementation:**

- SQL: `WHERE status = 'AWAITING_ADMIN'`
- Handler: GetPendingAdminQueriesHandler filters by status

### Property 2: Required Fields in Conversation Display

**Statement:** Every conversation in the pending list SHALL display customerName, customerPhone, and lastMessageAt.

**Formal:** `∀ conv ∈ PendingConversations ⇒ conv.customerName ≠ null ∧ conv.customerPhone ≠ null ∧ conv.lastMessageAt ≠ null`

**Test Strategy:** Example-based test verifying all fields present

**Implementation:**

- Read model includes denormalized fields
- SQL JOIN with customers table

### Property 3: Multi-Tenant Isolation

**Statement:** Users SHALL only see conversations for their own businessId.

**Formal:** `∀ conv ∈ GetPendingAdminQueriesResult ⇒ conv.businessId = authenticatedUser.businessId`

**Test Strategy:** Property-based test with multiple businesses

**Implementation:**

- SQL: `WHERE business_id = :businessId`
- Controller extracts businessId from JWT token

### Property 4: Message Chronological Ordering

**Statement:** Messages in conversation history SHALL be ordered chronologically (oldest first).

**Formal:** `∀ i, j ∈ Messages where i < j ⇒ Messages[i].sentAt ≤ Messages[j].sentAt`

**Test Strategy:** Property-based test with random timestamps

**Implementation:**

- SQL: `ORDER BY sent_at ASC`
- Handler: GetConversationHistoryHandler orders by sentAt

### Property 5: Response Validation - Empty Rejected

**Statement:** Empty responses SHALL always be rejected.

**Formal:** `content = '' ∨ content = null ⇒ ValidationError`

**Test Strategy:** Example-based test with empty strings

**Implementation:**

- DTO: `@IsNotEmpty()` decorator
- class-validator rejects empty content

### Property 6: Response Validation - Too Long Rejected

**Statement:** Responses exceeding 1000 characters SHALL always be rejected.

**Formal:** `length(content) > 1000 ⇒ ValidationError`

**Test Strategy:** Property-based test with random long strings

**Implementation:**

- DTO: `@MaxLength(1000)` decorator
- class-validator rejects long content

### Property 7: Response Validation - Valid Accepted

**Statement:** Responses with 1 ≤ length ≤ 1000 SHALL always be accepted.

**Formal:** `1 ≤ length(content) ≤ 1000 ⇒ ValidationSuccess`

**Test Strategy:** Property-based test with random valid strings

**Implementation:**

- DTO: `@IsNotEmpty()` + `@MaxLength(1000)`
- class-validator accepts valid content

### Property 8: Optimistic Update Behavior

**Statement:** When sending a response, the message SHALL appear immediately in the UI before server confirmation.

**Formal:** `sendResponse() ⇒ UI.messages.includes(newMessage) before HTTP.response`

**Test Strategy:** Example-based test with mock API delay

**Implementation:**

- React Query: onMutate adds message to cache
- onError reverts if request fails

### Property 9: Backend Actions on Success

**Statement:** When a response is sent successfully, the backend SHALL update status to 'RESOLVED', create message record, and send WhatsApp message.

**Formal:** `SendAdminResponseSuccess ⇒ (status = 'RESOLVED' ∧ MessageCreated ∧ WhatsAppSent)`

**Test Strategy:** Integration test verifying all side effects

**Implementation:**

- conversation.resolveAdminQuery() updates status
- Event handler creates message
- Command dispatches SendWhatsAppMessageCommand

### Property 10: Duplicate Submission Prevention

**Statement:** While a response is being sent, the submit button SHALL be disabled to prevent duplicate submissions.

**Formal:** `sendResponse.isPending = true ⇒ submitButton.disabled = true`

**Test Strategy:** Example-based test with UI state

**Implementation:**

- Button: `disabled={!responseText.trim() || sendResponse.isPending}`
- React Query: isPending flag

### Property 11: resolveAdminQuery Behavior

**Statement:** Calling resolveAdminQuery() SHALL change status from 'AWAITING_ADMIN' to 'RESOLVED' and increment version.

**Formal:** `conversation.resolveAdminQuery() ⇒ (status = 'RESOLVED' ∧ version = version + 1)`

**Test Strategy:** Unit test on aggregate

**Implementation:**

- Aggregate method updates status and calls incrementVersion()

### Property 12: resolveAdminQuery Idempotency

**Statement:** Calling resolveAdminQuery() on an already resolved conversation SHALL throw an exception.

**Formal:** `status = 'RESOLVED' ⇒ resolveAdminQuery() throws Error`

**Test Strategy:** Unit test with already resolved conversation

**Implementation:**

- Aggregate: `if (this.status === 'RESOLVED') throw new Error(...)`

### Property 13: Version Increment on State Change

**Statement:** Every state change in the aggregate SHALL increment the version.

**Formal:** `∀ stateChange ⇒ version_after = version_before + 1`

**Test Strategy:** Property-based test on aggregate methods

**Implementation:**

- All state-changing methods call incrementVersion()

### Property 14: Concurrent Update Detection

**Statement:** When two handlers try to save the same conversation with the same version, only one SHALL succeed.

**Formal:** `save(conv, version=N) ∧ save(conv, version=N) ⇒ OneSuccess ∧ OneConcurrencyException`

**Test Strategy:** Concurrency test with parallel requests

**Implementation:**

- SQL: `UPDATE WHERE id = :id AND version = :version`
- If affected = 0, throw ConcurrencyException

### Property 15: Retry Logic Eventual Success/Failure

**Statement:** When a ConcurrencyException occurs, the system SHALL retry up to 3 times and either succeed or throw a final error.

**Formal:** `ConcurrencyException ⇒ (retry ≤ 3 ∧ (Success ∨ FinalError))`

**Test Strategy:** Integration test with mock concurrency

**Implementation:**

- Handler: while loop with maxRetries = 3
- Exponential backoff between retries
- Throw error if all retries fail

---

## 9. Error Handling

### 9.1 Backend Error Strategy

#### Domain Exceptions

**ConversationNotFoundException:**

- Thrown when conversation does not exist
- HTTP 404 Not Found
- Message: "Conversation with id {id} not found"

**ConversationAlreadyResolvedException:**

- Thrown when trying to resolve already resolved conversation
- HTTP 409 Conflict
- Message: "Conversation is already resolved"

**ConcurrencyException:**

- Thrown when optimistic locking fails
- Triggers retry logic (up to 3 attempts)
- If retries exhausted: HTTP 409 Conflict
- Message: "Unable to update conversation after multiple attempts"

#### Validation Exceptions

**ValidationException:**

- Thrown by class-validator
- HTTP 400 Bad Request
- Message: Array of validation errors

#### Authorization Exceptions

**UnauthorizedException:**

- Thrown when JWT is missing or invalid
- HTTP 401 Unauthorized
- Message: "Authentication required"

**ForbiddenException:**

- Thrown when user does not own conversation's business
- HTTP 403 Forbidden
- Message: "Access denied to this conversation"

### 9.2 Frontend Error Strategy

#### Network Errors

**Handling:**

- React Query automatically retries failed requests (3 times)
- Show error alert with retry button
- Error message from API response or generic fallback

**UI:**

```tsx
{
  isError && (
    <Alert color="red" title="Error al cargar consultas">
      {error instanceof Error ? error.message : "Ocurrió un error inesperado"}
      <Button onClick={() => refetch()}>Reintentar</Button>
    </Alert>
  );
}
```

#### Validation Errors

**Handling:**

- Display inline validation errors from backend
- Show field-specific error messages
- Prevent form submission until valid

**UI:**

```tsx
<Textarea
  error={validationError?.content}
  value={responseText}
  onChange={(e) => setResponseText(e.target.value)}
/>
```

#### Optimistic Update Errors

**Handling:**

- React Query automatically reverts optimistic update on error
- Show error toast notification
- Keep modal open for retry

**Implementation:**

```typescript
useMutation({
  onMutate: async (variables) => {
    // Optimistic update
    queryClient.setQueryData(queryKey, (old) => [...old, newMessage]);
  },
  onError: (error, variables, context) => {
    // Revert optimistic update
    queryClient.setQueryData(queryKey, context.previousData);
    // Show error toast
    notifications.show({
      title: "Error",
      message: error.message,
      color: "red",
    });
  },
});
```

#### Concurrent Update Errors

**Handling:**

- Backend retries automatically (up to 3 times)
- If all retries fail, show specific error message
- Suggest user to refresh and try again

**UI:**

```tsx
{
  error?.response?.status === 409 && (
    <Alert color="orange" title="Conversación modificada">
      Esta conversación fue modificada recientemente. Por favor recarga la
      página e intenta nuevamente.
      <Button onClick={() => window.location.reload()}>Recargar</Button>
    </Alert>
  );
}
```

---

## 10. Testing Strategy

### 10.1 Backend Testing

#### Unit Tests (Aggregates)

**Target:** Conversation aggregate

**Tests:**

- resolveAdminQuery() changes status to RESOLVED
- resolveAdminQuery() increments version
- resolveAdminQuery() throws error if already resolved
- resolveAdminQuery() publishes AdminQueryResolved event

**Tools:** Jest, @nestjs/testing

**Example:**

```typescript
describe('Conversation.resolveAdminQuery', () => {
  it('should change status to RESOLVED', () => {
    const conversation = Conversation.fromPersistence(..., 'AWAITING_ADMIN', ...);
    conversation.resolveAdminQuery();
    expect(conversation.getStatus()).toBe('RESOLVED');
  });
});
```

#### Integration Tests (Handlers)

**Target:** Command and Query handlers

**Tests:**

- SendAdminResponseHandler successfully sends response
- SendAdminResponseHandler handles ConcurrencyException with retry
- GetPendingAdminQueriesHandler returns only AWAITING_ADMIN conversations
- GetConversationHistoryHandler returns messages in chronological order

**Tools:** Jest, @nestjs/testing, Test database

**Example:**

```typescript
describe("SendAdminResponseHandler", () => {
  it("should send response and update status", async () => {
    const command = new SendAdminResponseCommand("conv-id", "Response text");
    await handler.execute(command);

    const conversation = await factory.loadById("conv-id");
    expect(conversation.getStatus()).toBe("RESOLVED");
  });
});
```

#### Property-Based Tests

**Target:** Validation, filtering, ordering

**Tests:**

- Empty content always rejected (Property 5)
- Content >1000 chars always rejected (Property 6)
- Valid content always accepted (Property 7)
- Pending queries only include AWAITING_ADMIN (Property 1)
- Messages always chronologically ordered (Property 4)

**Tools:** fast-check

**Example:**

```typescript
import fc from "fast-check";

describe("Response validation PBT", () => {
  it("should reject content >1000 chars", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1001, maxLength: 2000 }),
        (content) => {
          const dto = new SendAdminResponseDto();
          dto.content = content;
          const errors = validateSync(dto);
          expect(errors.length).toBeGreaterThan(0);
        },
      ),
    );
  });
});
```

#### Concurrency Tests

**Target:** Optimistic locking

**Tests:**

- Concurrent updates detected (Property 14)
- Retry logic succeeds or fails definitively (Property 15)

**Tools:** Jest with parallel execution

**Example:**

```typescript
describe("Concurrent updates", () => {
  it("should detect concurrent updates", async () => {
    const conv1 = await factory.loadById("conv-id");
    const conv2 = await factory.loadById("conv-id");

    conv1.resolveAdminQuery();
    await writeRepo.save(conv1); // Success

    conv2.resolveAdminQuery();
    await expect(writeRepo.save(conv2)).rejects.toThrow(ConcurrencyException);
  });
});
```

### 10.2 Frontend Testing

#### Component Tests

**Target:** ConversationsPage

**Tests:**

- Displays loading state while fetching
- Displays error alert on fetch error
- Displays empty state when no conversations
- Displays conversation cards when data available
- Opens modal when card clicked
- Closes modal on X button or outside click

**Tools:** Vitest, React Testing Library

**Example:**

```typescript
describe('ConversationsPage', () => {
  it('should display conversation cards', async () => {
    render(<ConversationsPage />);

    await waitFor(() => {
      expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
    });
  });
});
```

#### Hook Tests

**Target:** React Query hooks

**Tests:**

- useConversations fetches pending conversations
- useConversationHistory fetches messages
- useSendAdminResponse sends response and invalidates cache
- Optimistic update adds message immediately
- Error reverts optimistic update

**Tools:** Vitest, React Testing Library, MSW

**Example:**

```typescript
describe("useSendAdminResponse", () => {
  it("should send response and invalidate cache", async () => {
    const { result } = renderHook(() => useSendAdminResponse(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({
        conversationId: "conv-id",
        content: "Response text",
      });
    });

    expect(mockInvalidateQueries).toHaveBeenCalledWith([
      "conversations",
      "pending",
    ]);
  });
});
```

#### Integration Tests (E2E)

**Target:** Complete user flows

**Tests:**

- User can view pending conversations
- User can open conversation and see history
- User can send response successfully
- User sees error when response fails

**Tools:** Vitest, React Testing Library, MSW

**Example:**

```typescript
describe('Conversation flow E2E', () => {
  it('should complete full response flow', async () => {
    render(<ConversationsPage />);

    // Wait for conversations to load
    await waitFor(() => {
      expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
    });

    // Click conversation card
    fireEvent.click(screen.getByText('Juan Pérez'));

    // Wait for modal to open
    await waitFor(() => {
      expect(screen.getByText('Conversación con Cliente')).toBeInTheDocument();
    });

    // Type response
    const textarea = screen.getByPlaceholderText('Escribe tu respuesta...');
    fireEvent.change(textarea, { target: { value: 'Respuesta de prueba' } });

    // Click send button
    fireEvent.click(screen.getByText('Enviar Respuesta'));

    // Wait for success
    await waitFor(() => {
      expect(screen.queryByText('Conversación con Cliente')).not.toBeInTheDocument();
    });
  });
});
```

---

## 11. Performance Considerations

### 11.1 Backend Optimizations

**Database Indexes:**

```sql
CREATE INDEX idx_conversations_business_status
  ON conversations(business_id, status);

CREATE INDEX idx_conversations_last_message
  ON conversations(last_message_at DESC);

CREATE INDEX idx_messages_conversation_sent
  ON messages(conversation_id, sent_at ASC);
```

**Query Optimization:**

- Use JOIN for denormalization (avoid N+1 queries)
- Use SELECT specific columns (avoid SELECT \*)
- Use LIMIT for pagination (future enhancement)

**Caching Strategy (Future):**

- Redis cache for pending conversations (TTL: 30 seconds)
- Invalidate on SendAdminResponseCommand success

### 11.2 Frontend Optimizations

**React Query Caching:**

- Cache pending conversations for 30 seconds
- Cache message history indefinitely (invalidate on mutation)
- Stale time: 30 seconds for conversations, 5 minutes for messages

**Optimistic Updates:**

- Add message to UI immediately on send
- Revert if request fails
- Provides instant feedback

**Code Splitting:**

- Lazy load ConversationsPage
- Lazy load Modal component

**Memoization:**

- Memoize formatDate function
- Memoize conversation card rendering

---

## 12. Security Considerations

### 12.1 Authentication & Authorization

**JWT Authentication:**

- All endpoints require valid JWT token
- Token includes userId and businessId
- Token validated by JwtAuthGuard

**Role-Based Access Control:**

- Only BUSINESS_OWNER role can access endpoints
- Validated by RolesGuard

**Multi-Tenant Isolation:**

- All queries filter by authenticated user's businessId
- Prevents cross-tenant data access

### 12.2 Input Validation

**Backend Validation:**

- class-validator decorators on DTOs
- Whitelist unknown properties
- Transform and sanitize input

**Frontend Validation:**

- Client-side validation for UX
- Server-side validation for security
- Never trust client input

### 12.3 SQL Injection Prevention

**Parameterized Queries:**

- TypeORM uses parameterized queries
- Never concatenate user input into SQL

**Example:**

```typescript
// ✅ Safe (parameterized)
.where('business_id = :businessId', { businessId })

// ❌ Unsafe (concatenation)
.where(`business_id = '${businessId}'`)
```

---

## 13. Deployment Considerations

### 13.1 Environment Variables

**Backend:**

```env
DATABASE_URL=postgresql://user:pass@host:5432/db
JWT_SECRET=<secret>
WHATSAPP_API_URL=https://graph.facebook.com/v18.0
WHATSAPP_ACCESS_TOKEN=<token>
```

**Frontend:**

```env
VITE_API_URL=https://api.example.com
```

### 13.2 Database Migrations

**Migration for Conversation Status:**

```sql
ALTER TABLE conversations
ADD COLUMN status VARCHAR(20) DEFAULT 'ACTIVE';

UPDATE conversations
SET status = 'AWAITING_ADMIN'
WHERE state = 'AWAITING_ADMIN_RESPONSE';

CREATE INDEX idx_conversations_status
ON conversations(status);
```

### 13.3 Monitoring

**Metrics to Track:**

- API response times (p50, p95, p99)
- Error rates by endpoint
- ConcurrencyException frequency
- React Query cache hit rate

**Logging:**

- Log all ConcurrencyExceptions with context
- Log all failed WhatsApp API calls
- Log all authorization failures

---

## 14. Future Enhancements

### 14.1 Real-Time Updates

**WebSocket Integration:**

- Replace polling with WebSocket connection
- Push new conversations to frontend
- Push new messages to open modals

### 14.2 Rich Media Support

**Image/File Attachments:**

- Support image messages from WhatsApp
- Display images in message thread
- Support file downloads

### 14.3 Message Templates

**Quick Responses:**

- Predefined response templates
- Insert template into textarea
- Customize templates per business

### 14.4 Conversation Assignment

**Team Collaboration:**

- Assign conversations to team members
- Track who responded
- Conversation ownership

---

**Version:** 1.0  
**Status:** Complete  
**Last Updated:** December 2024

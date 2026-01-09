# Requirements: Conversation Backend-Frontend Implementation

## 1. Overview

### Purpose

Implement a complete conversation management system that allows business owners to view and respond to customer inquiries via WhatsApp. The system integrates backend CQRS/DDD architecture with a React frontend using TanStack Query and Mantine UI.

### Scope

- Backend: Conversation aggregate, read models, queries, commands, controllers
- Frontend: Conversations page, React Query hooks, API service layer
- Integration: Full end-to-end flow from WhatsApp webhook to admin response

### Out of Scope (Future Enhancements)

- Real-time WebSocket updates
- Rich media support (images, files, voice)
- Conversation assignment to team members
- Message templates and quick responses

---

## 2. User Stories

### US-1: View Pending Customer Queries

**As a** business owner  
**I want to** see a list of all customer inquiries awaiting my response  
**So that** I can prioritize and respond to customer needs

**Acceptance Criteria:**

1. WHEN the business owner navigates to `/conversations`  
   THE system SHALL display all conversations with status='AWAITING_ADMIN'

2. WHEN displaying each conversation  
   THE system SHALL show:
   - Customer name (denormalized from Customer aggregate)
   - Customer phone number (denormalized)
   - Last message timestamp (formatted as relative time)
   - Status badge ("Pendiente")

3. WHEN there are no pending conversations  
   THE system SHALL display an empty state message: "No hay consultas pendientes"

4. WHEN the conversations fail to load  
   THE system SHALL display an error alert with a retry button

5. WHILE the conversations are loading  
   THE system SHALL display skeleton loaders

6. THE system SHALL poll for new conversations every 30 seconds

7. THE system SHALL filter conversations by the authenticated user's businessId

### US-2: View Conversation History

**As a** business owner  
**I want to** see the complete message history with a customer  
**So that** I can understand the context before responding

**Acceptance Criteria:**

1. WHEN the business owner clicks on a conversation card  
   THE system SHALL open a modal with the conversation details

2. WHEN the modal opens  
   THE system SHALL fetch all messages for that conversation

3. WHEN displaying messages  
   THE system SHALL:
   - Show messages in chronological order (oldest first)
   - Align customer messages (INBOUND) to the left with gray background
   - Align admin messages (OUTBOUND) to the right with blue background
   - Display message content and timestamp for each message
   - Show sender indicator ("Juan" for customer, "Tú" for admin)

4. WHEN there are no messages (edge case)  
   THE system SHALL display an empty state message

5. WHEN messages fail to load  
   THE system SHALL display an error alert with a retry button

6. WHILE messages are loading  
   THE system SHALL display skeleton loaders

7. WHEN the business owner closes the modal  
   THE system SHALL return focus to the conversation card that was clicked

### US-3: Respond to Customer Inquiry

**As a** business owner  
**I want to** send a response to a customer inquiry  
**So that** I can help the customer via WhatsApp

**Acceptance Criteria:**

1. WHEN the conversation modal is open  
   THE system SHALL display a response form with:
   - Textarea for message content
   - Character count indicator (e.g., "250/1000")
   - "Enviar Respuesta" button

2. WHEN the business owner types a response  
   THE system SHALL validate:
   - Response is not empty (min 1 character)
   - Response does not exceed 1000 characters (WhatsApp limit)

3. WHEN the business owner submits an invalid response  
   THE system SHALL display inline validation errors

4. WHEN the business owner submits a valid response  
   THE system SHALL:
   - Show loading state on submit button
   - Optimistically add the message to the thread
   - Send POST request to `/api/admin-queries/:id/respond`
   - On success:
     - Show success toast: "Respuesta enviada"
     - Close the modal
     - Remove conversation from pending list
     - Invalidate React Query cache
   - On error:
     - Show error toast with error message
     - Revert optimistic update
     - Keep modal open for retry

5. WHEN the response is sent successfully  
   THE backend SHALL:
   - Update conversation status to 'RESOLVED'
   - Create outbound message record
   - Send message to customer via WhatsApp Business API
   - Publish AdminResponseSent domain event

6. THE system SHALL prevent duplicate submissions while request is in flight

---

## 3. Functional Requirements

### FR-1: Backend - Conversation Aggregate

**FR-1.1:** The Conversation aggregate SHALL extend VersionedAggregateRoot for optimistic locking

**FR-1.2:** The Conversation aggregate SHALL have the following fields:

- id: UUID
- businessId: UUID
- customerId: UUID
- status: 'ACTIVE' | 'AWAITING_ADMIN' | 'RESOLVED'
- state: ConversationState (state machine)
- lastMessageAt: Date
- version: number

**FR-1.3:** The Conversation aggregate SHALL implement resolveAdminQuery() method that:

- Validates status is 'AWAITING_ADMIN'
- Changes status to 'RESOLVED'
- Increments version
- Applies AdminQueryResolved domain event

**FR-1.4:** The Conversation aggregate SHALL throw ConversationAlreadyResolvedException if resolveAdminQuery() is called when status is already 'RESOLVED'

### FR-2: Backend - Read Models

**FR-2.1:** ConversationReadModel SHALL include denormalized fields:

- customerName: string (from Customer aggregate)
- customerPhone: string (from Customer aggregate)

**FR-2.2:** MessageReadModel SHALL include:

- id, conversationId, direction, content, messageType, sentAt, isFromAdmin

**FR-2.3:** Read models SHALL be optimized for query performance with appropriate database indexes

### FR-3: Backend - Queries

**FR-3.1:** GetPendingAdminQueriesQuery SHALL:

- Filter by businessId from authenticated user
- Filter by status='AWAITING_ADMIN'
- Order by lastMessageAt DESC (most recent first)
- Return ConversationReadModel[]

**FR-3.2:** GetConversationHistoryQuery SHALL:

- Filter by conversationId
- Validate user has access to conversation's business
- Order by sentAt ASC (oldest first)
- Return MessageReadModel[]

### FR-4: Backend - Commands

**FR-4.1:** SendAdminResponseCommand SHALL:

- Accept conversationId and content
- Validate content is not empty and ≤1000 characters
- Load Conversation aggregate using IConversationFactory
- Call conversation.resolveAdminQuery()
- Save conversation using IConversationWriteRepository with optimistic locking
- Dispatch SendWhatsAppMessageCommand to send message
- Handle ConcurrencyException with retry logic (max 3 attempts)

**FR-4.2:** SendAdminResponseCommand SHALL throw ConversationNotFoundException if conversation does not exist

**FR-4.3:** SendAdminResponseCommand SHALL throw UnauthorizedException if user does not own the conversation's business

### FR-5: Backend - API Endpoints

**FR-5.1:** GET /api/admin-queries/pending SHALL:

- Require JWT authentication
- Require BUSINESS_OWNER role
- Execute GetPendingAdminQueriesQuery
- Return 200 with ConversationReadModel[]

**FR-5.2:** GET /api/admin-queries/:id/messages SHALL:

- Require JWT authentication
- Require BUSINESS_OWNER role
- Execute GetConversationHistoryQuery
- Return 200 with MessageReadModel[]
- Return 404 if conversation not found
- Return 403 if user does not own conversation's business

**FR-5.3:** POST /api/admin-queries/:id/respond SHALL:

- Require JWT authentication
- Require BUSINESS_OWNER role
- Validate SendAdminResponseDto (content required, max 1000 chars)
- Execute SendAdminResponseCommand
- Return 200 on success
- Return 400 for validation errors
- Return 404 if conversation not found
- Return 403 if user does not own conversation's business
- Return 409 if ConcurrencyException after retries

### FR-6: Frontend - React Query Hooks

**FR-6.1:** useConversations() hook SHALL:

- Query key: ['conversations', 'pending']
- Endpoint: GET /api/admin-queries/pending
- Refetch interval: 30 seconds
- Enabled: Only when user is authenticated
- Return: { data: ConversationReadModel[], isLoading, isError, error, refetch }

**FR-6.2:** useConversationHistory(conversationId) hook SHALL:

- Query key: ['conversation-history', conversationId]
- Endpoint: GET /api/admin-queries/:id/messages
- Enabled: Only when conversationId is not null
- Return: { data: MessageReadModel[], isLoading, isError, error, refetch }

**FR-6.3:** useSendAdminResponse() hook SHALL:

- Mutation function: POST /api/admin-queries/:id/respond
- Optimistic update: Add message to conversation history immediately
- On success: Invalidate ['conversations', 'pending'] and ['conversation-history', conversationId]
- On error: Revert optimistic update
- Return: { mutate, isLoading, isError, error }

### FR-7: Frontend - UI Components

**FR-7.1:** ConversationsPage SHALL:

- Display list of pending conversations using useConversations()
- Show loading skeletons while loading
- Show empty state when no conversations
- Show error alert with retry button on error
- Open modal when conversation card is clicked

**FR-7.2:** ConversationModal SHALL:

- Display customer name in title
- Load and display message history using useConversationHistory()
- Display response form
- Close on X button, outside click, or Esc key
- Return focus to trigger card when closed

**FR-7.3:** MessageThread SHALL:

- Display messages in chronological order
- Style customer messages (left, gray) differently from admin messages (right, blue)
- Format timestamps with date-fns (formatDistanceToNow)
- Show sender indicator for each message

**FR-7.4:** ResponseForm SHALL:

- Validate response is not empty
- Validate response ≤1000 characters
- Show character count indicator
- Disable submit button while sending
- Show loading state on button
- Clear textarea after successful send

### FR-8: Frontend - API Service Layer

**FR-8.1:** conversationService.getPendingConversations() SHALL:

- Make GET request to /api/admin-queries/pending
- Return Promise<ConversationReadModel[]>
- Include JWT token in Authorization header

**FR-8.2:** conversationService.getConversationHistory(conversationId) SHALL:

- Make GET request to /api/admin-queries/:id/messages
- Return Promise<MessageReadModel[]>
- Include JWT token in Authorization header

**FR-8.3:** conversationService.sendAdminResponse(conversationId, content) SHALL:

- Make POST request to /api/admin-queries/:id/respond
- Send SendAdminResponseDto in body
- Return Promise<void>
- Include JWT token in Authorization header

---

## 4. Non-Functional Requirements

### NFR-1: Performance

**NFR-1.1:** GET /api/admin-queries/pending SHALL respond in <200ms (p95)

**NFR-1.2:** GET /api/admin-queries/:id/messages SHALL respond in <300ms (p95)

**NFR-1.3:** POST /api/admin-queries/:id/respond SHALL respond in <500ms (p95)

**NFR-1.4:** Frontend SHALL use React Query caching to minimize API calls

**NFR-1.5:** Frontend SHALL use optimistic updates for instant UI feedback

### NFR-2: Scalability

**NFR-2.1:** System SHALL support 100 concurrent business owners

**NFR-2.2:** System SHALL support 1000 pending conversations per business

**NFR-2.3:** System SHALL support 100 messages per conversation

**NFR-2.4:** Database queries SHALL use indexes on businessId, status, lastMessageAt

### NFR-3: Security

**NFR-3.1:** All API endpoints SHALL require JWT authentication

**NFR-3.2:** All API endpoints SHALL validate user has BUSINESS_OWNER role

**NFR-3.3:** All API endpoints SHALL filter data by authenticated user's businessId

**NFR-3.4:** System SHALL prevent SQL injection via parameterized queries

**NFR-3.5:** System SHALL validate and sanitize all user input

**NFR-3.6:** System SHALL use HTTPS for all API communication

### NFR-4: Reliability

**NFR-4.1:** System SHALL handle ConcurrencyException with automatic retry (max 3 attempts)

**NFR-4.2:** System SHALL use optimistic locking to prevent race conditions

**NFR-4.3:** System SHALL use database transactions for atomic operations

**NFR-4.4:** System SHALL log all errors with context for debugging

**NFR-4.5:** System SHALL provide meaningful error messages to users

### NFR-5: Usability

**NFR-5.1:** UI SHALL be responsive (desktop, tablet, mobile)

**NFR-5.2:** UI SHALL follow WCAG 2.1 Level AA accessibility guidelines

**NFR-5.3:** UI SHALL provide keyboard navigation support

**NFR-5.4:** UI SHALL provide screen reader support with ARIA labels

**NFR-5.5:** UI SHALL show loading states for all async operations

**NFR-5.6:** UI SHALL show clear error messages with recovery actions

### NFR-6: Maintainability

**NFR-6.1:** Code SHALL follow Clean Architecture principles

**NFR-6.2:** Code SHALL follow DDD tactical patterns

**NFR-6.3:** Code SHALL follow CQRS pattern (strict separation)

**NFR-6.4:** Code SHALL have >70% test coverage

**NFR-6.5:** Code SHALL use TypeScript with strict mode

**NFR-6.6:** Code SHALL follow project naming conventions

---

## 5. Property-Based Testing Requirements

### PBT-1: Conversation Aggregate Properties

**PBT-1.1:** PROPERTY: resolveAdminQuery() SHALL be idempotent

```typescript
// Given a conversation in AWAITING_ADMIN status
// When resolveAdminQuery() is called multiple times
// Then only the first call succeeds, subsequent calls throw exception
```

**PBT-1.2:** PROPERTY: Version SHALL always increment on state change

```typescript
// Given a conversation with version N
// When resolveAdminQuery() is called
// Then version becomes N+1
```

**PBT-1.3:** PROPERTY: Status transitions SHALL be valid

```typescript
// Given any conversation status
// When resolveAdminQuery() is called
// Then status can only transition from AWAITING_ADMIN to RESOLVED
```

### PBT-2: Optimistic Locking Properties

**PBT-2.1:** PROPERTY: Concurrent updates SHALL be detected

```typescript
// Given two handlers load same conversation (version N)
// When both try to save with version N
// Then only one succeeds, other gets ConcurrencyException
```

**PBT-2.2:** PROPERTY: Retry logic SHALL eventually succeed or fail definitively

```typescript
// Given a ConcurrencyException occurs
// When retry logic executes
// Then either succeeds within 3 attempts or throws final error
```

### PBT-3: Query Properties

**PBT-3.3:** PROPERTY: Pending queries SHALL only include AWAITING_ADMIN status

```typescript
// Given conversations with various statuses
// When GetPendingAdminQueriesQuery executes
// Then result only contains conversations with status='AWAITING_ADMIN'
```

**PBT-3.4:** PROPERTY: Conversation history SHALL be chronologically ordered

```typescript
// Given messages with random timestamps
// When GetConversationHistoryQuery executes
// Then messages are ordered by sentAt ASC
```

### PBT-4: Validation Properties

**PBT-4.1:** PROPERTY: Empty content SHALL always be rejected

```typescript
// Given content = '' or null or undefined
// When SendAdminResponseCommand validates
// Then validation fails
```

**PBT-4.2:** PROPERTY: Content >1000 chars SHALL always be rejected

```typescript
// Given content with length > 1000
// When SendAdminResponseCommand validates
// Then validation fails
```

**PBT-4.3:** PROPERTY: Valid content SHALL always be accepted

```typescript
// Given content with 1 ≤ length ≤ 1000
// When SendAdminResponseCommand validates
// Then validation succeeds
```

### PBT-5: Multi-Tenancy Properties

**PBT-5.1:** PROPERTY: Users SHALL only see their own business conversations

```typescript
// Given conversations for multiple businesses
// When user queries pending conversations
// Then result only contains conversations for user's businessId
```

**PBT-5.2:** PROPERTY: Users SHALL NOT access other business conversations

```typescript
// Given a conversation for businessId A
// When user from businessId B tries to access it
// Then request is rejected with 403 Forbidden
```

---

## 6. Acceptance Tests

### AT-1: View Pending Conversations

**Given** I am logged in as a business owner  
**And** there are 3 pending conversations for my business  
**When** I navigate to /conversations  
**Then** I should see 3 conversation cards  
**And** each card should show customer name, phone, and last activity  
**And** conversations should be ordered by most recent first

### AT-2: View Conversation History

**Given** I am on the conversations page  
**And** there is a conversation with 5 messages  
**When** I click on the conversation card  
**Then** a modal should open  
**And** I should see all 5 messages in chronological order  
**And** customer messages should be left-aligned with gray background  
**And** admin messages should be right-aligned with blue background

### AT-3: Send Response Successfully

**Given** I have opened a conversation modal  
**And** I type "Claro, ¿qué día prefieres?" in the response textarea  
**When** I click "Enviar Respuesta"  
**Then** the message should appear immediately in the thread  
**And** I should see a success toast "Respuesta enviada"  
**And** the modal should close  
**And** the conversation should be removed from the pending list

### AT-4: Handle Send Response Error

**Given** I have opened a conversation modal  
**And** the API will return an error  
**When** I submit a response  
**Then** I should see an error toast with the error message  
**And** the optimistic message should be removed from the thread  
**And** the modal should remain open  
**And** I should be able to retry

### AT-5: Handle Concurrent Updates

**Given** two admins open the same conversation simultaneously  
**When** both try to send a response at the same time  
**Then** only one response should succeed  
**And** the other should retry automatically  
**And** both responses should eventually be sent (in sequence)

### AT-6: Validate Response Content

**Given** I have opened a conversation modal  
**When** I try to submit an empty response  
**Then** I should see validation error "La respuesta no puede estar vacía"  
**And** the form should not submit

**Given** I have opened a conversation modal  
**When** I type 1001 characters and try to submit  
**Then** I should see validation error "La respuesta no puede exceder 1000 caracteres"  
**And** the form should not submit

### AT-7: Multi-Tenant Isolation

**Given** I am logged in as business owner A  
**And** there are conversations for business B  
**When** I navigate to /conversations  
**Then** I should only see conversations for my business (A)  
**And** I should not see any conversations for business B

**Given** I am logged in as business owner A  
**When** I try to access a conversation from business B directly  
**Then** I should receive a 403 Forbidden error

---

## 7. Dependencies

### Backend Dependencies

- @nestjs/core ^10.x
- @nestjs/common ^10.x
- @nestjs/cqrs ^10.x
- typeorm ^0.3.x
- class-validator ^0.14.x
- class-transformer ^0.5.x

### Frontend Dependencies

- react ^18.x
- @tanstack/react-query ^5.x
- @mantine/core ^7.x
- @mantine/hooks ^7.x
- @mantine/notifications ^7.x
- date-fns ^2.x
- axios ^1.x

### Shared Dependencies

- @packages/shared-types (monorepo package)

---

## 8. Constraints

### Technical Constraints

- Backend must use NestJS with CQRS pattern
- Frontend must use React with TanStack Query
- Database must be PostgreSQL
- All communication must use REST API (no WebSockets in MVP)
- WhatsApp messages limited to 1000 characters

### Business Constraints

- Only business owners can access conversations
- Conversations are scoped to a single business (multi-tenant)
- Responses are sent via WhatsApp Business API (external dependency)
- Polling interval for new conversations: 30 seconds (to avoid rate limits)

### Design Constraints

- Must follow Clean Architecture principles
- Must follow DDD tactical patterns
- Must use optimistic locking for concurrency control
- Must use CQRS strict separation (no read repositories in command handlers)
- Must follow project naming conventions and file structure

---

## 9. Assumptions

1. WhatsApp Business API is already configured and working
2. Customer aggregate exists and has name and phone fields
3. JWT authentication is already implemented
4. User has BUSINESS_OWNER role assigned
5. Database indexes are created for performance
6. Error handling middleware is configured
7. Logging infrastructure is in place
8. Test infrastructure (Jest, Testing Library, MSW) is configured

---

## 10. Risks

### Risk 1: WhatsApp API Rate Limits

**Impact:** High  
**Probability:** Medium  
**Mitigation:** Implement retry logic with exponential backoff, queue messages if needed

### Risk 2: Concurrent Updates

**Impact:** High  
**Probability:** Medium  
**Mitigation:** Use optimistic locking with version field, implement retry logic

### Risk 3: Large Message History

**Impact:** Medium  
**Probability:** Low  
**Mitigation:** Implement pagination if conversation exceeds 100 messages

### Risk 4: Polling Performance

**Impact:** Medium  
**Probability:** Low  
**Mitigation:** Use React Query's smart refetching (only when tab is visible)

---

## 11. Success Criteria

### Functional Success

- ✅ Business owner can view all pending conversations
- ✅ Business owner can view complete message history
- ✅ Business owner can send responses via WhatsApp
- ✅ Responses are delivered to customers successfully
- ✅ Conversations are removed from pending list after response
- ✅ Multi-tenant isolation is enforced

### Technical Success

- ✅ All API endpoints respond within performance targets
- ✅ Optimistic locking prevents race conditions
- ✅ Test coverage >70%
- ✅ All property-based tests pass
- ✅ All acceptance tests pass
- ✅ Code follows architecture guidelines

### User Experience Success

- ✅ UI is responsive on all devices
- ✅ Loading states provide clear feedback
- ✅ Error messages are clear and actionable
- ✅ Optimistic updates provide instant feedback
- ✅ Keyboard navigation works correctly
- ✅ Screen readers can navigate the interface

---

**Version:** 1.0  
**Status:** Draft  
**Last Updated:** December 2024

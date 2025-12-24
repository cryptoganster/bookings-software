# Implementation Plan - Conversation BC Completion

## Phase 1: Domain Layer - Message Aggregate ✅ COMPLETE

- [x] 1.1 Create Message aggregate
  - Implement factory method `create()` with validation
  - Implement `fromPersistence()` for reconstruction
  - Add getters for all fields
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 1.2 Create MessageDirection value object
  - Implement `inbound()`, `outbound()` factory methods
  - Add validation in constructor
  - Implement `isInbound()`, `isOutbound()` methods
  - _Requirements: 1.3_

- [x] 1.3 Create MessageType value object
  - Implement `text()`, `button()`, `location()` factory methods
  - Add validation in constructor
  - _Requirements: 1.4_

- [x] 1.4 Create domain exceptions
  - `EmptyMessageContentException`
  - `InvalidMessageDirectionException`
  - `InvalidMessageTypeException`
  - `WhatsAppMessageFailedException`
  - _Requirements: 1.1, 2.3_

- [x] 1.5 Create MessageSent domain event
  - Include messageId, conversationId, content, sentAt
  - _Requirements: 2.5_

- [x]\* 1.6 Write unit tests for Message aggregate
  - Test factory method validation
  - Test empty content rejection
  - Test fromPersistence reconstruction
  - _Requirements: 8.1_
  - **Completed:** 41 tests passing

- [x]\* 1.7 Write unit tests for value objects
  - Test MessageDirection validation
  - Test MessageType validation
  - Test equality methods
  - _Requirements: 8.1_
  - **Completed:** All tests passing

- [x]\* 1.8 Write unit tests for Conversation aggregate
  - Test factory method validation
  - Test message addition
  - Test status transitions
  - Test fromPersistence reconstruction
  - _Requirements: 8.1_
  - **Completed:** 38 tests passing

## Phase 2: Domain Layer - Interfaces & Read Models ✅ COMPLETE

- [x] 2.1 Create IMessageWriteRepository interface
  - `save(message: Message): Promise<void>`
  - _Requirements: 3.1, 3.4_

- [x] 2.2 Create IMessageReadRepository interface
  - `findByConversationId(conversationId: string): Promise<MessageReadModel[]>`
  - _Requirements: 3.2, 4.1_

- [x] 2.3 Complete ConversationReadModel
  - Add customerName field with documentation
  - Add lastMessageAt field
  - Update constructor
  - _Requirements: 5.1, 5.2, 5.3_

- [x] 2.4 Create MessageReadModel
  - All fields from design document
  - Constructor with all parameters
  - _Requirements: 3.3, 3.5_

## Phase 3: Application Layer - Commands ✅ COMPLETE

- [x] 3.1 Create SendWhatsAppMessageCommand
  - Extend `Command<{ messageId: string }>`
  - Add conversationId, content, messageType, recipientPhone fields
  - _Requirements: 2.1, 2.4_

- [x] 3.2 Implement SendWhatsAppMessageHandler
  - Create Message aggregate
  - Call WhatsApp API with retry logic (3 attempts, exponential backoff)
  - Persist message via repository
  - Use UnitOfWork for transaction
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x]\* 3.3 Write unit tests for SendWhatsAppMessageHandler
  - Test success path
  - Test retry logic on WhatsApp API failure
  - Test transaction rollback on error
  - Test exponential backoff timing
  - _Requirements: 8.2_
  - **Completed:** 13 tests passing

## Phase 4: Application Layer - Queries ✅ COMPLETE

- [x] 4.1 Create GetConversationHistoryQuery
  - Extend `Query<MessageReadModel[]>`
  - Add conversationId field
  - _Requirements: 4.1_

- [x] 4.2 Implement GetConversationHistoryHandler
  - Use MessageReadRepository
  - Return messages ordered by sentAt ASC
  - Handle empty results
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x]\* 4.3 Write unit tests for GetConversationHistoryHandler
  - Test message retrieval
  - Test ordering
  - Test empty conversation
  - _Requirements: 8.4_
  - **Completed:** 9 tests passing

## Phase 5: Infrastructure Layer - Persistence ✅ COMPLETE

- [x] 5.1 Create database migration for messages table
  - All fields from design document
  - Foreign key to conversations table with CASCADE
  - Indexes on conversation_id and sent_at
  - _Requirements: 3.1, 3.2_

- [x] 5.2 Add last_message_at column to conversations table
  - Migration to add column
  - _Requirements: 5.2_

- [x] 5.3 Create MessageModel (TypeORM entity)
  - Map all fields to database columns
  - Add decorators (@Entity, @Column, etc.)
  - _Requirements: 3.1_

- [x] 5.4 Create MessageWriteMapper
  - `toModel(message: Message): MessageModel`
  - Map all aggregate fields to model
  - _Requirements: 3.1_

- [x] 5.5 Create MessageReadMapper
  - `toReadModel(model: any): MessageReadModel`
  - Map database result to read model
  - _Requirements: 3.3, 3.5_

- [x] 5.6 Implement MessageWriteRepository
  - Inject TypeORM repository and UnitOfWork
  - Implement `save()` with transaction
  - Use MessageWriteMapper
  - _Requirements: 3.1, 3.4_

- [x] 5.7 Implement MessageReadRepository
  - Inject TypeORM repository
  - Implement `findByConversationId()` with ORDER BY sent_at ASC
  - Use MessageReadMapper
  - _Requirements: 3.2, 4.1, 4.2_

- [x] 5.8 Update ConversationReadRepository
  - Add JOIN with customers table for customerName
  - Add lastMessageAt field to query
  - Update mapper to include new fields
  - _Requirements: 5.1, 5.2, 5.4, 5.5_

- [x]\* 5.9 Write integration tests for repositories
  - Test MessageWriteRepository.save()
  - Test MessageReadRepository.findByConversationId()
  - Test message ordering
  - Test ConversationReadRepository with customerName
  - _Requirements: 8.3_

## Phase 6: Application Layer - Event Handlers ✅ COMPLETE ✅ COMPLETE

- [x] 6.1 Create OnAppointmentCreatedHandler
  - Listen to AppointmentCreated event
  - Dispatch SendWhatsAppMessageCommand with confirmation message
  - Handle errors without propagating
  - _Requirements: 10.1_

- [x] 6.2 Create OnAppointmentCancelledHandler
  - Listen to AppointmentCancelled event
  - Dispatch SendWhatsAppMessageCommand with cancellation message
  - Handle errors without propagating
  - _Requirements: 10.2_

- [x]\* 6.3 Write integration tests for event handlers
  - Test OnAppointmentCreatedHandler dispatches command
  - Test OnAppointmentCancelledHandler dispatches command
  - Test error handling doesn't propagate
  - _Requirements: 8.5, 10.4, 10.5_
  - **Completed:** 13 tests passing (6 for OnAppointmentCreatedHandler, 7 for OnAppointmentCancelledHandler)

## Phase 7: Presentation Layer - API Endpoints ✅ COMPLETE

- [x] 7.1 Update ConversationController
  - Add GET /conversations/:id/messages endpoint
  - Use GetConversationHistoryQuery
  - Add authentication guard
  - _Requirements: 9.2, 9.4_

- [x] 7.2 Create GetConversationHistoryDto (if needed)
  - Query parameters for pagination (future)
  - _Requirements: 9.2_
  - **Note:** Not needed for MVP - pagination is future enhancement

- [x] 7.3 Update SendAdminResponseDto validation
  - Ensure content is not empty
  - Add max length validation
  - _Requirements: 9.5_
  - **Note:** Already has IsString and IsNotEmpty validation

- [x]\* 7.4 Write E2E tests for conversation endpoints
  - Test GET /conversations returns pending conversations
  - Test GET /conversations/:id/messages returns history
  - Test POST /conversations/:id/respond sends message
  - Test authentication required (401)
  - Test validation errors (400)
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_
  - **Completed:** All 22 tests passing

## Phase 8: Module Registration ✅ COMPLETE

- [x] 8.1 Register Message repositories in ConversationModule
  - Provide IMessageWriteRepository → MessageWriteRepository
  - Provide IMessageReadRepository → MessageReadRepository
  - Add TypeORM.forFeature([MessageModel])
  - _Requirements: 3.1, 3.2_
  - **Completed:** Already registered in conversation.module.ts

- [x] 8.2 Register command handlers in ConversationModule
  - Add SendWhatsAppMessageHandler to providers
  - _Requirements: 2.1_
  - **Completed:** Already in CommandHandlers array

- [x] 8.3 Register query handlers in ConversationModule
  - Add GetConversationHistoryHandler to providers
  - _Requirements: 4.1_
  - **Completed:** Already in QueryHandlers array

- [x] 8.4 Register event handlers in ConversationModule
  - Add OnAppointmentCreatedHandler to providers
  - Add OnAppointmentCancelledHandler to providers
  - _Requirements: 10.1, 10.2_
  - **Completed:** Already in EventHandlers array

## Phase 9: Shared Types Integration

- [x] 9.1 Add ConversationReadModel to shared-types
  - Copy from design document
  - Add JSDoc comments
  - Export from index.ts
  - _Requirements: 6.1, 6.4_

- [x] 9.2 Add MessageReadModel to shared-types
  - Copy from design document
  - Add JSDoc comments
  - Export from index.ts
  - _Requirements: 6.2, 6.4_

- [x] 9.3 Add SendAdminResponseDto to shared-types
  - Copy from design document
  - Export from index.ts
  - _Requirements: 6.4_

- [x] 9.4 Build shared-types package
  - Run `pnpm --filter shared-types build`
  - Verify no compilation errors
  - _Requirements: 6.3_

- [x] 9.5 Remove temporary types from frontend
  - Delete ConversationReadModel from `apps/frontend/src/shared/api/types.ts`
  - Delete MessageReadModel from `apps/frontend/src/shared/api/types.ts`
  - _Requirements: 6.5_

## Phase 10: Frontend Integration

- [x] 10.1 Create conversation API service
  - `getPendingConversations()`
  - `getConversationHistory(conversationId)`
  - `sendAdminResponse(conversationId, content)`
  - _Requirements: 7.1, 7.2, 7.3_

- [x] 10.2 Update useConversations hook
  - Import ConversationReadModel from shared-types
  - Use TanStack Query
  - _Requirements: 7.1_

- [x] 10.3 Create useConversationHistory hook
  - Import MessageReadModel from shared-types
  - Use TanStack Query with conversationId
  - Enable only when conversationId is provided
  - _Requirements: 7.2_

- [x] 10.4 Create useSendAdminResponse mutation hook
  - Use TanStack Query mutation
  - Invalidate conversations and messages queries on success
  - Show error notification on failure
  - _Requirements: 7.3, 7.4, 7.5_

- [x] 10.5 Update ConversationsPage component
  - Display pending conversations
  - Show conversation history when selected
  - Add response form
  - Handle loading and error states
  - _Requirements: 7.1, 7.2, 7.3_

- [ ]\* 10.6 Write frontend tests
  - Test conversation service API calls
  - Test hooks with MSW
  - Test ConversationsPage component
  - _Requirements: 8.1_

## Phase 11: Testing & Validation

- [ ] 11.1 Run all unit tests
  - Ensure all tests pass
  - Verify coverage > 70%
  - _Requirements: 8.1_

- [ ] 11.2 Run all integration tests
  - Ensure all tests pass
  - Verify database operations work
  - _Requirements: 8.3, 8.5_

- [ ] 11.3 Run all E2E tests
  - Ensure all tests pass
  - Verify API endpoints work end-to-end
  - _Requirements: 8.5_

- [ ] 11.4 Manual testing
  - Test conversation flow in development
  - Test admin response functionality
  - Test error scenarios
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

## Phase 12: Documentation & Cleanup

- [ ] 12.1 Update API documentation
  - Document new endpoints
  - Add request/response examples
  - _Requirements: 9.1, 9.2, 9.3_

- [ ] 12.2 Update README
  - Add Conversation BC completion notes
  - Update architecture diagrams if needed
  - _Requirements: All_

- [ ] 12.3 Remove TODO comments
  - Remove TODO from ConversationReadModel
  - Clean up any temporary code
  - _Requirements: 5.1_

- [ ] 12.4 Final commit and PR
  - Commit all changes with descriptive message
  - Create PR with summary of changes
  - Link to spec document
  - _Requirements: All_

---

## Notes

- **Optional tasks (marked with \*)** can be skipped for MVP but are recommended
- **Property-based tests** are not included but can be added for critical logic
- **WebSocket integration** is out of scope for this spec (future enhancement)
- **Pagination** for message history is out of scope (future enhancement)
- **Rate limiting** for message sending is out of scope (future enhancement)

## Estimated Effort

- **Phase 1-2 (Domain):** 4-6 hours
- **Phase 3-4 (Application):** 4-6 hours
- **Phase 5 (Infrastructure):** 6-8 hours
- **Phase 6 (Event Handlers):** 2-3 hours
- **Phase 7 (Presentation):** 2-3 hours
- **Phase 8 (Module):** 1-2 hours
- **Phase 9 (Shared Types):** 1-2 hours
- **Phase 10 (Frontend):** 4-6 hours
- **Phase 11 (Testing):** 3-4 hours
- **Phase 12 (Documentation):** 1-2 hours

**Total:** 28-42 hours (3.5-5 days)

## Dependencies

- ✅ Conversation aggregate already exists
- ✅ WhatsApp client interface already exists
- ✅ ProcessIncomingMessageCommand already exists
- ✅ SendAdminResponseCommand already exists
- ✅ ConversationController already exists
- ✅ Customer BC complete (for customerName denormalization)
- ✅ Booking BC complete (for AppointmentCreated/Cancelled events)

# Conversation BC Completion - Spec

**Status:** Ready for Review  
**Created:** December 23, 2024  
**Estimated Effort:** 28-42 hours (3.5-5 days)

## Overview

This spec completes the Conversation Bounded Context implementation by adding the Message aggregate, missing commands/queries, persistence layer, and full frontend integration. This enables WhatsApp messaging functionality, admin responses, and conversation history tracking.

## What's Missing

Currently, the Conversation BC has:

- ✅ Conversation aggregate with state machine
- ✅ ProcessIncomingMessageCommand
- ✅ SendAdminResponseCommand
- ✅ Basic queries (GetConversation, GetPendingAdminQueries)
- ✅ WhatsApp client interface

What's missing:

- ❌ Message aggregate/entity
- ❌ SendWhatsAppMessageCommand (required by PRD and Sagas)
- ❌ GetConversationHistoryQuery
- ❌ Message persistence (repositories, models, mappers)
- ❌ ConversationReadModel and MessageReadModel in shared-types
- ❌ Event handlers for appointment notifications
- ❌ Frontend integration for conversation history

## Goals

1. **Complete Message Implementation:** Create Message aggregate with full persistence
2. **Enable WhatsApp Messaging:** Implement SendWhatsAppMessageCommand with retry logic
3. **Conversation History:** Allow admins to view full message history
4. **Event Integration:** Connect appointment events to WhatsApp notifications
5. **Frontend Integration:** Build conversation UI with message history and admin responses
6. **Type Safety:** Add ConversationReadModel and MessageReadModel to shared-types
7. **Testing:** Comprehensive unit, integration, and E2E tests

## Architecture

### Message Aggregate

```typescript
Message {
  - id: UUID
  - conversationId: UUID
  - direction: MessageDirection (INBOUND/OUTBOUND)
  - content: string
  - messageType: MessageType (TEXT/BUTTON/LOCATION)
  - sentAt: Date
  - isFromAdmin: boolean
}
```

### Key Commands

1. **SendWhatsAppMessageCommand** - Send message via WhatsApp API with retry logic
2. **ProcessIncomingMessageCommand** - Already exists ✅
3. **SendAdminResponseCommand** - Already exists ✅

### Key Queries

1. **GetConversationHistoryQuery** - Retrieve all messages for a conversation
2. **GetPendingAdminQueriesQuery** - Already exists ✅
3. **GetConversationQuery** - Already exists ✅

### Event Handlers

1. **OnAppointmentCreatedHandler** - Send confirmation message
2. **OnAppointmentCancelledHandler** - Send cancellation message

## Database Schema

```sql
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

ALTER TABLE conversations ADD COLUMN last_message_at TIMESTAMP;
```

## Shared Types

Add to `@packages/shared-types`:

```typescript
export interface ConversationReadModel {
  id: string;
  businessId: string;
  customerId: string;
  customerName: string | null; // Denormalized from Customer BC
  customerPhone: string;
  status: "ACTIVE" | "AWAITING_ADMIN" | "RESOLVED";
  lastMessageAt: string; // ISO 8601
  createdAt: string; // ISO 8601
}

export interface MessageReadModel {
  id: string;
  conversationId: string;
  direction: "INBOUND" | "OUTBOUND";
  content: string;
  messageType: "TEXT" | "BUTTON" | "LOCATION";
  sentAt: string; // ISO 8601
  isFromAdmin: boolean;
}
```

## API Endpoints

```
GET    /conversations                    - Get pending conversations
GET    /conversations/:id/messages       - Get conversation history
POST   /conversations/:id/respond        - Send admin response
```

## Frontend Integration

### New Hooks

```typescript
useConversations(); // Get pending conversations
useConversationHistory(conversationId); // Get message history
useSendAdminResponse(); // Send admin response
```

### Updated Components

- **ConversationsPage** - Display conversations and message history
- **ConversationList** - List of pending conversations
- **MessageHistory** - Display messages chronologically
- **AdminResponseForm** - Form to send responses

## Implementation Phases

1. **Phase 1-2:** Domain Layer (Message aggregate, VOs, interfaces)
2. **Phase 3-4:** Application Layer (Commands, Queries, Handlers)
3. **Phase 5:** Infrastructure Layer (Persistence, repositories, mappers)
4. **Phase 6:** Event Handlers (Appointment notifications)
5. **Phase 7:** Presentation Layer (API endpoints)
6. **Phase 8:** Module Registration
7. **Phase 9:** Shared Types Integration
8. **Phase 10:** Frontend Integration
9. **Phase 11:** Testing & Validation
10. **Phase 12:** Documentation & Cleanup

## Testing Strategy

### Unit Tests

- Message aggregate validation
- Value object validation
- Command handler logic
- Query handler logic

### Integration Tests

- Repository operations
- Event handler dispatching
- Cross-BC communication

### E2E Tests

- Conversation API endpoints
- Message history retrieval
- Admin response flow

## Success Criteria

- ✅ All unit tests pass with >70% coverage
- ✅ All integration tests pass
- ✅ All E2E tests pass
- ✅ Message persistence works correctly
- ✅ WhatsApp message sending works with retry logic
- ✅ Conversation history displays in frontend
- ✅ Admin can respond to conversations
- ✅ Appointment events trigger WhatsApp notifications
- ✅ Types are shared between backend and frontend
- ✅ No compilation errors in backend or frontend

## Out of Scope

The following are explicitly out of scope for this spec:

- ❌ WebSocket real-time updates (future enhancement)
- ❌ Message pagination (future enhancement)
- ❌ Rate limiting for message sending (future enhancement)
- ❌ Message read receipts (future enhancement)
- ❌ Rich media messages (images, videos) (future enhancement)
- ❌ Message templates (future enhancement)

## Dependencies

### Backend Dependencies

- ✅ Customer BC complete (for customerName denormalization)
- ✅ Booking BC complete (for AppointmentCreated/Cancelled events)
- ✅ WhatsApp Business API client interface exists
- ✅ Conversation aggregate exists
- ✅ ConversationState value object exists

### Frontend Dependencies

- ✅ TanStack Query setup
- ✅ API client configured
- ✅ Authentication working
- ✅ ConversationsPage component exists (needs enhancement)

## Related Documents

- [requirements.md](./requirements.md) - Detailed requirements with acceptance criteria
- [design.md](./design.md) - Technical design and architecture
- [tasks.md](./tasks.md) - Implementation task list
- [PRD.md](../../.kiro/steering/PRD.md) - Product requirements document

## Next Steps

1. **Review this spec** - Ensure all requirements are covered
2. **Approve the plan** - Confirm tasks are actionable and complete
3. **Begin implementation** - Open tasks.md and start with Phase 1
4. **Track progress** - Update task status as you complete each item
5. **Test thoroughly** - Run tests after each phase
6. **Document changes** - Update README and API docs

## Questions?

If you have questions about:

- **Requirements:** See requirements.md
- **Architecture:** See design.md
- **Implementation:** See tasks.md
- **Testing:** See design.md "Testing Strategy" section

---

**Ready to start?** Open `tasks.md` and begin with Phase 1!

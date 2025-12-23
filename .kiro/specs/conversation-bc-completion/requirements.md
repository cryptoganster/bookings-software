# Requirements Document - Conversation BC Completion

## Introduction

Complete the Conversation Bounded Context implementation to enable WhatsApp messaging functionality, admin responses, and conversation history tracking. This includes implementing the Message aggregate, missing commands/queries, persistence layer, and frontend integration.

## Glossary

- **Conversation BC:** Bounded Context responsible for WhatsApp messaging and conversation management
- **Message:** Individual message entity within a conversation (inbound/outbound)
- **ConversationReadModel:** DTO for displaying conversation data in UI
- **MessageReadModel:** DTO for displaying message data in UI
- **WhatsApp Business API:** External service for sending/receiving WhatsApp messages

## Requirements

### Requirement 1: Message Aggregate Implementation

**User Story:** As a developer, I want a Message aggregate to represent individual messages within conversations, so that the system can track message history and enable admin responses.

#### Acceptance Criteria

1. WHEN a Message is created THEN the System SHALL validate that conversationId exists
2. WHEN a Message is created THEN the System SHALL set sentAt to current timestamp
3. WHEN a Message is persisted THEN the System SHALL store direction (INBOUND/OUTBOUND)
4. WHEN a Message is persisted THEN the System SHALL store messageType (TEXT/BUTTON/LOCATION)
5. WHEN a Message is retrieved THEN the System SHALL include isFromAdmin flag

### Requirement 2: SendWhatsAppMessage Command

**User Story:** As a system, I want to send WhatsApp messages programmatically, so that I can notify customers about appointments and respond to queries.

#### Acceptance Criteria

1. WHEN SendWhatsAppMessageCommand is executed THEN the System SHALL create a Message with direction=OUTBOUND
2. WHEN SendWhatsAppMessageCommand is executed THEN the System SHALL call WhatsApp Business API
3. WHEN WhatsApp API call fails THEN the System SHALL retry up to 3 times with exponential backoff
4. WHEN SendWhatsAppMessageCommand succeeds THEN the System SHALL return messageId
5. WHEN SendWhatsAppMessageCommand is executed THEN the System SHALL publish MessageSent event

### Requirement 3: Message Persistence

**User Story:** As a developer, I want Message persistence implemented, so that conversation history is stored and retrievable.

#### Acceptance Criteria

1. WHEN a Message is saved THEN the System SHALL persist to messages table
2. WHEN messages are queried by conversationId THEN the System SHALL return ordered by sentAt ASC
3. WHEN MessageReadModel is retrieved THEN the System SHALL include all required fields
4. WHEN Message repository saves THEN the System SHALL use transactions via UnitOfWork
5. WHEN Message is mapped to ReadModel THEN the System SHALL denormalize customer data

### Requirement 4: GetConversationHistory Query

**User Story:** As an admin, I want to view conversation history, so that I can understand customer context before responding.

#### Acceptance Criteria

1. WHEN GetConversationHistoryQuery is executed THEN the System SHALL return all messages for conversationId
2. WHEN conversation history is retrieved THEN messages SHALL be ordered chronologically
3. WHEN conversation history is retrieved THEN the System SHALL include message direction
4. WHEN conversation history is retrieved THEN the System SHALL include isFromAdmin flag
5. WHEN conversationId does not exist THEN the System SHALL return empty array

### Requirement 5: ConversationReadModel Enhancement

**User Story:** As a frontend developer, I want ConversationReadModel with customerName, so that I can display conversations with customer context.

#### Acceptance Criteria

1. WHEN ConversationReadModel is retrieved THEN the System SHALL include customerName from Customer BC
2. WHEN ConversationReadModel is retrieved THEN the System SHALL include lastMessageAt timestamp
3. WHEN ConversationReadModel is retrieved THEN the System SHALL include conversation status
4. WHEN ConversationReadModel query executes THEN the System SHALL JOIN with customers table
5. WHEN customer has no name THEN customerName SHALL be null

### Requirement 6: Shared Types Integration

**User Story:** As a frontend developer, I want ConversationReadModel and MessageReadModel in shared-types, so that I have type safety across backend and frontend.

#### Acceptance Criteria

1. WHEN shared-types is built THEN ConversationReadModel SHALL be exported
2. WHEN shared-types is built THEN MessageReadModel SHALL be exported
3. WHEN frontend imports types THEN no compilation errors SHALL occur
4. WHEN backend uses DTOs THEN types SHALL match shared-types exactly
5. WHEN types are updated THEN both backend and frontend SHALL reflect changes

### Requirement 7: Frontend Conversation Integration

**User Story:** As an admin, I want to view and respond to customer conversations in the web panel, so that I can provide support.

#### Acceptance Criteria

1. WHEN admin opens Conversations page THEN pending conversations SHALL be displayed
2. WHEN admin clicks a conversation THEN message history SHALL load
3. WHEN admin types a response THEN SendAdminResponseCommand SHALL be triggered
4. WHEN response is sent THEN conversation list SHALL update optimistically
5. WHEN API call fails THEN error notification SHALL be shown

### Requirement 8: Testing Coverage

**User Story:** As a developer, I want comprehensive tests for Conversation BC, so that message functionality is reliable.

#### Acceptance Criteria

1. WHEN Message aggregate tests run THEN all business logic SHALL be covered
2. WHEN SendWhatsAppMessageCommand handler tests run THEN retry logic SHALL be verified
3. WHEN repository tests run THEN persistence operations SHALL be validated
4. WHEN query handler tests run THEN data retrieval SHALL be verified
5. WHEN integration tests run THEN cross-BC communication SHALL be tested

### Requirement 9: API Endpoints

**User Story:** As a frontend developer, I want REST endpoints for conversations, so that I can integrate messaging features.

#### Acceptance Criteria

1. WHEN GET /conversations is called THEN pending conversations SHALL be returned
2. WHEN GET /conversations/:id/messages is called THEN message history SHALL be returned
3. WHEN POST /conversations/:id/respond is called THEN admin response SHALL be sent
4. WHEN endpoints are called without auth THEN 401 SHALL be returned
5. WHEN endpoints are called with invalid data THEN 400 SHALL be returned

### Requirement 10: Event Integration

**User Story:** As a system, I want Conversation BC to integrate with other BCs via events, so that appointments trigger notifications.

#### Acceptance Criteria

1. WHEN AppointmentCreated event occurs THEN SendWhatsAppMessageCommand SHALL be triggered
2. WHEN AppointmentCancelled event occurs THEN SendWhatsAppMessageCommand SHALL be triggered
3. WHEN MessageReceived event occurs THEN ProcessIncomingMessageCommand SHALL be triggered
4. WHEN events are published THEN EventBus SHALL deliver to handlers
5. WHEN event handlers fail THEN errors SHALL be logged but not propagate

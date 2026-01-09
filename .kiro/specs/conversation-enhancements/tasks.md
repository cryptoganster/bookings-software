# Conversation Enhancements - Implementation Tasks

**Status:** Ready for Implementation  
**Created:** 2025-01-02  
**Epic:** Conversation System Improvements  
**Priority:** High

---

## Overview

This document breaks down the implementation of conversation enhancements into discrete, manageable tasks. Tasks are organized by feature and prioritized for incremental delivery.

**Implementation Order:** 0. WhatsApp Business API Setup & Configuration (Prerequisites)

1. WebSocket Infrastructure (Foundation)
2. Rich Media Support
3. Team Collaboration
4. Templates & Quick Responses

---

## Phase 0: WhatsApp Business API Setup & Configuration

### Prerequisites

Before implementing conversation enhancements, you need to configure WhatsApp Business API integration. This phase covers account setup, configuration, and testing strategies.

### 0. WhatsApp Business API Account Setup

- [x] 0.1 Create Meta Developer Account
  - Visit https://developers.facebook.com
  - Sign up or log in with Facebook account
  - Complete developer account verification
  - Accept Meta Platform Terms and Developer Policies
  - _Requirements: NFR-3.1 (Security)_
  - ✅ **Completed:** 2026-01-02

- [x] 0.2 Create WhatsApp Business App
  - Go to Meta for Developers Dashboard
  - Click "Create App" → Select "Business" type
  - Enter app name (e.g., "Bookings System - Dev")
  - Add WhatsApp product to your app
  - Complete Business Verification (required for production)
  - _Requirements: FR-2.7, FR-2.8_
  - ✅ **Completed:** 2026-01-02 (Using "Appointments App" - ID: 2103302830406522)

- [x] 0.3 Configure WhatsApp Business Account
  - Navigate to WhatsApp → Getting Started
  - Create or link WhatsApp Business Account
  - Add phone number for testing (can use test number provided by Meta)
  - Verify phone number via SMS/call
  - Note: Test numbers are free and don't require real phone
  - _Requirements: FR-2.7_
  - ✅ **Completed:** 2026-01-02 (Test Number: +1 555 164 6083)

- [x] 0.4 Generate Access Tokens
  - Go to WhatsApp → API Setup
  - Generate temporary access token (valid 24 hours) for testing
  - For production: Create System User and generate permanent token
  - Copy Phone Number ID from API Setup page
  - Copy WhatsApp Business Account ID
  - _Requirements: NFR-3.1_
  - ✅ **Completed:** 2026-01-02 (Permanent token generated and stored in .env)

- [x] 0.5 Configure Webhook
  - Go to WhatsApp → Configuration
  - Click "Edit" on Webhook section
  - Enter Callback URL: `https://your-domain.com/api/webhooks/whatsapp`
  - Enter Verify Token: Generate random string (save for .env)
  - Subscribe to webhook fields: `messages`, `message_status`
  - For local development: Use ngrok or similar tunnel service
  - _Requirements: FR-1.2, FR-2.8_
  - ✅ **Completed:** 2026-01-02 (Webhook URL: https://200a37b5255b.ngrok-free.app/api/webhooks/whatsapp, verified successfully)

- [x] 1. Checkpoint - Verify WhatsApp Business API setup complete
  - Ensure all credentials obtained, ask the user if questions arise.
  - ✅ **Completed:** 2026-01-02 (All credentials documented in whatsapp-credentials.md)

### 1. Environment Configuration

- [x] 1.1 Update backend .env file with WhatsApp credentials
  - Add all required WhatsApp environment variables
  - Use temporary token for development
  - Generate secure webhook verify token
  - _Requirements: NFR-3.1_

- [x] 1.2 Document environment variables in README
  - Create section explaining each WhatsApp variable
  - Include instructions for obtaining credentials
  - Add troubleshooting tips
  - _Requirements: Documentation_

- [x] 1.3 Create .env.example template
  - Add all WhatsApp variables with placeholder values
  - Include comments explaining each variable
  - Document which variables are required vs optional
  - _Requirements: Documentation_

- [x] 1.4 Validate environment configuration on startup
  - Create validation service to check required variables
  - Throw clear error messages if variables missing
  - Log configuration status on application start
  - _Requirements: NFR-4.4_

- [x] 2. Checkpoint - Ensure environment configuration complete
  - Verify all variables set correctly, ask the user if questions arise.

### 2. Testing Strategies (Without Real Phone Numbers)

- [ ] 2.1 Use Meta's Test Phone Numbers
  - Meta provides test phone numbers in API Setup
  - Test numbers can send/receive messages without cost
  - Test numbers work in development mode only
  - Document test number limitations
  - _Requirements: Testing_

- [x] 2.2 Implement Mock WhatsApp Client for Unit Tests
  - Create `MockWhatsAppClient` implementing `IWhatsAppClient`
  - Mock all WhatsApp API methods (sendMessage, sendMedia, etc.)
  - Return predictable responses for testing
  - Place in `src/conversation/infra/external/__mocks__/`
  - _Requirements: Testing_

- [x] 2.3 Create WhatsApp API Simulator for Integration Tests
  - Build simple HTTP server simulating WhatsApp API
  - Implement webhook callback simulation
  - Support message sending and receiving
  - Use in integration tests instead of real API
  - _Requirements: Testing_

- [x] 2.4 Document testing workflow
  - Create guide for testing without real phones
  - Explain how to use test numbers
  - Document mock client usage
  - Include example test cases
  - _Requirements: Documentation_
  - ✅ **Completed:** 2026-01-09 (Comprehensive testing guide created at TESTING-GUIDE.md)

- [x] 3. Checkpoint - Ensure testing strategy documented
  - Verify testing approaches clear, ask the user if questions arise.

### 3. WhatsApp Business API Integration Verification

- [x] 3.1 Test webhook verification endpoint
  - Implement GET /api/webhooks/whatsapp for verification
  - Verify Meta's challenge-response handshake works
  - Test with Meta's webhook verification tool
  - _Requirements: FR-2.8_
  - ✅ **Completed:** 2026-01-03 17:19 (Nueva app - Webhook verificado exitosamente)

- [x] 3.2 Test sending text message
  - Send test message using Test Number credentials
  - Verify message received on test phone number (18093192896)
  - Check message status updates via webhook
  - _Requirements: FR-2.7_
  - ✅ **Completed:** 2026-01-03 18:57 (Message sent successfully with Test Number)

- [x] 3.3 Test receiving text message
  - Send message from test phone to business number
  - Verify webhook receives message payload
  - Verify message stored in database
  - _Requirements: FR-2.8_
  - ✅ **Completed:** 2026-01-02 (Webhook subscribed to 'messages' field at 23:13:29)

- [x] 3.4 Test webhook signature validation
  - Implement signature validation using app secret
  - Test with valid and invalid signatures
  - Ensure unauthorized webhooks rejected
  - _Requirements: NFR-3.1_

- [x] 3.5 Write integration tests for WhatsApp client
  - Test sendMessage with mock client
  - Test webhook processing
  - Test error handling (rate limits, invalid tokens)
  - _Requirements: Testing_

- [x] 4. Checkpoint - Ensure WhatsApp integration verified
  - Verify all basic operations work, ask the user if questions arise.

### 4. Production Preparation

- [ ] 4.1 Complete Business Verification
  - Submit business verification documents to Meta
  - Wait for approval (can take 1-2 weeks)
  - Required for production use and higher rate limits
  - _Requirements: NFR-3.1_

- [ ] 4.2 Generate Permanent Access Token
  - Create System User in Business Settings
  - Assign System User to WhatsApp app
  - Generate permanent token (doesn't expire)
  - Store securely (use secrets manager in production)
  - _Requirements: NFR-3.1, NFR-3.6_

- [ ] 4.3 Configure Production Webhook
  - Set up production domain with SSL certificate
  - Update webhook URL in Meta dashboard
  - Test webhook with production environment
  - _Requirements: NFR-3.1_

- [ ] 4.4 Set up monitoring and alerts
  - Monitor webhook delivery failures
  - Alert on API rate limit approaching
  - Track message delivery success rate
  - _Requirements: NFR-4.4_

- [ ] 5. Checkpoint - Production setup complete
  - Verify production-ready configuration, ask the user if questions arise.

---

## Phase 1: WebSocket Infrastructure

### 1. Setup WebSocket Gateway

- [ ] 1.1 Install WebSocket dependencies
  - Install `@nestjs/websockets`, `@nestjs/platform-socket.io`, `socket.io`
  - Configure WebSocket module in conversation module
  - _Requirements: FR-1.1_

- [ ] 1.2 Create WebSocket gateway with authentication
  - Create `ConversationGateway` class with `@WebSocketGateway` decorator
  - Implement `handleConnection` with JWT verification
  - Implement `handleDisconnect` for cleanup
  - Store user info in socket data (userId, businessId)
  - _Requirements: FR-1.1, NFR-3.1_

- [ ] 1.3 Implement room-based isolation
  - Join clients to business-specific rooms on connection
  - Format: `business:{businessId}`
  - Verify room isolation (no cross-business events)
  - _Requirements: FR-1.2, FR-1.3_

- [ ] 1.4 Write unit tests for WebSocket authentication
  - Test valid JWT connection
  - Test invalid JWT rejection
  - Test room joining logic
  - _Requirements: FR-1.1, NFR-3.1_

- [ ] 2. Checkpoint - Ensure WebSocket gateway tests pass
  - Ensure all tests pass, ask the user if questions arise.

### 2. Implement WebSocket Event Broadcasting

- [ ] 2.1 Create event handler for MessageSent
  - Create `OnMessageSentHandler` listening to `MessageSent` event
  - Broadcast `message:new` event to business room
  - Include conversationId, messageId, content, sentAt
  - _Requirements: FR-1.2_

- [ ] 2.2 Create event handler for ConversationAssigned
  - Create `OnConversationAssignedHandler` listening to `ConversationAssigned` event
  - Broadcast `conversation:assigned` event to business room
  - Include conversationId, assignedToTeamMemberId
  - _Requirements: FR-1.3, FR-3.11_

- [ ] 2.3 Implement typing indicators
  - Handle `typing:start` and `typing:stop` client events
  - Broadcast `typing:indicator` to business room (exclude sender)
  - Include conversationId, userId, isTyping
  - _Requirements: FR-1.7_

- [ ] 2.4 Write integration tests for event broadcasting
  - Test MessageSent broadcasts to correct room
  - Test ConversationAssigned broadcasts
  - Test typing indicators
  - Verify room isolation
  - _Requirements: FR-1.2, FR-1.3, FR-1.7_

- [ ] 3. Checkpoint - Ensure event broadcasting tests pass
  - Ensure all tests pass, ask the user if questions arise.

### 3. Implement Reconnection & Fallback

- [ ] 3.1 Configure automatic reconnection
  - Set Socket.IO reconnection options (max 5 attempts, exponential backoff)
  - Implement connection status tracking on client
  - _Requirements: FR-1.4, NFR-4.1_

- [ ] 3.2 Implement missed message sync
  - On reconnection, query messages since last connection
  - Send missed messages to reconnected client
  - _Requirements: FR-1.4_

- [ ] 3.3 Implement polling fallback
  - Create REST endpoint for polling new messages
  - Frontend switches to polling after 3 failed WebSocket attempts
  - Poll interval: 5 seconds
  - _Requirements: FR-1.6, NFR-4.3_

- [ ] 3.4 Write E2E tests for reconnection
  - Test automatic reconnection after disconnect
  - Test missed message sync
  - Test fallback to polling
  - _Requirements: FR-1.4, FR-1.6_

- [ ] 4. Checkpoint - Ensure reconnection tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Phase 2: Rich Media Support

### 4. Setup Media Storage Infrastructure

- [ ] 4.1 Create IMediaStorage interface
  - Define methods: store, retrieve, delete, generateThumbnail, getSignedUrl
  - Place in `conversation/domain/interfaces/services/`
  - _Requirements: FR-2.4_

- [ ] 4.2 Implement LocalMediaStorage
  - Implement IMediaStorage with local filesystem
  - Create directory structure: `uploads/{businessId}/{images|files|voice}/`
  - Generate unique filenames with timestamp and random suffix
  - _Requirements: FR-2.4_

- [ ] 4.3 Install and configure media processing libraries
  - Install `multer`, `sharp`, `file-type`
  - Configure multer with file size limits and MIME type validation
  - _Requirements: FR-2.1, FR-2.2, FR-2.3, FR-2.6_

- [ ] 4.4 Write unit tests for LocalMediaStorage
  - Test file storage with unique filenames
  - Test file retrieval
  - Test file deletion
  - _Requirements: FR-2.4_

- [ ] 5. Checkpoint - Ensure media storage tests pass
  - Ensure all tests pass, ask the user if questions arise.

### 5. Implement Media Upload Endpoint

- [ ] 5.1 Create MediaType value object
  - Support IMAGE, FILE, VOICE types
  - Validate type on creation
  - Place in `conversation/domain/vo/`
  - _Requirements: FR-2.1_

- [ ] 5.2 Create MediaMetadata value object
  - Fields: filename, sizeBytes, mimeType, url, thumbnailUrl
  - Immutable value object
  - Place in `conversation/domain/vo/`
  - _Requirements: FR-2.1_

- [ ] 5.3 Create UploadMediaCommand and handler
  - Command: businessId, file, mediaType
  - Handler validates file type and size
  - Handler stores file via IMediaStorage
  - Handler creates MediaFile entity
  - Returns mediaId and url
  - _Requirements: FR-2.1, FR-2.2, FR-2.3_

- [ ] 5.4 Create POST /api/media/upload endpoint
  - Use `@UseInterceptors(FileInterceptor('file'))`
  - Apply JWT auth guard
  - Apply rate limiting (10 uploads/minute)
  - Execute UploadMediaCommand
  - _Requirements: FR-2.1, NFR-3.2_

- [ ] 5.5 Write integration tests for media upload
  - Test successful image upload
  - Test file size limit enforcement
  - Test MIME type validation
  - Test unauthorized access rejection
  - _Requirements: FR-2.1, FR-2.2, FR-2.3, NFR-3.1_

- [ ] 6. Checkpoint - Ensure media upload tests pass
  - Ensure all tests pass, ask the user if questions arise.

### 6. Implement Thumbnail Generation

- [ ] 6.1 Implement thumbnail generation in LocalMediaStorage
  - Use Sharp library to resize images
  - Max dimensions: 200x200, preserve aspect ratio
  - Save to `thumbnails/` subdirectory
  - _Requirements: FR-2.5_

- [ ] 6.2 Update UploadMediaCommand handler
  - Generate thumbnail for IMAGE type
  - Store thumbnailUrl in MediaMetadata
  - Skip thumbnail for FILE and VOICE types
  - _Requirements: FR-2.5_

- [ ] 6.3 Write unit tests for thumbnail generation
  - Test thumbnail dimensions
  - Test aspect ratio preservation
  - Test thumbnail path generation
  - _Requirements: FR-2.5_

- [ ] 7. Checkpoint - Ensure thumbnail tests pass
  - Ensure all tests pass, ask the user if questions arise.

### 7. Modify Message Aggregate for Media

- [ ] 7.1 Add media fields to Message aggregate
  - Add `mediaType: MediaType | null`
  - Add `mediaMetadata: MediaMetadata | null`
  - Update constructor and factory methods
  - _Requirements: FR-2.7_

- [ ] 7.2 Create Message.createWithMedia factory method
  - Accept mediaType and mediaMetadata parameters
  - Emit MediaMessageSent domain event
  - _Requirements: FR-2.7_

- [ ] 7.3 Update SendMessageCommand to support media
  - Add optional mediaId parameter
  - Handler loads media and attaches to message
  - _Requirements: FR-2.7_

- [ ]\* 7.4 Write unit tests for media messages
  - Test Message.createWithMedia
  - Test hasMedia() method
  - Test MediaMessageSent event emission
  - _Requirements: FR-2.7_

- [ ] 8. Checkpoint - Ensure media message tests pass
  - Ensure all tests pass, ask the user if questions arise.

### 8. Implement Media Retrieval

- [ ] 8.1 Create GET /api/media/:id endpoint
  - Apply JWT auth guard
  - Verify user has access to media's business
  - Stream file with correct Content-Type
  - Set Content-Disposition header
  - _Requirements: FR-2.8, NFR-3.1_

- [ ] 8.2 Create GetMediaQuery and handler
  - Query: mediaId, businessId
  - Handler verifies access control
  - Returns media metadata and storage path
  - _Requirements: FR-2.8, NFR-3.1_

- [ ]\* 8.3 Write integration tests for media retrieval
  - Test successful media retrieval
  - Test access control (cross-business rejection)
  - Test 404 for non-existent media
  - _Requirements: FR-2.8, NFR-3.1_

- [ ] 9. Checkpoint - Ensure media retrieval tests pass
  - Ensure all tests pass, ask the user if questions arise.

### 9. Database Schema for Media

- [ ] 9.1 Create media_files table migration
  - Columns: id, business_id, message_id, filename, mime_type, size_bytes, storage_path, thumbnail_path, created_at
  - Foreign keys to businesses and messages
  - Indexes on business_id and message_id
  - _Requirements: FR-2.4_

- [ ] 9.2 Alter messages table for media support
  - Add media_type column (nullable)
  - Add media_metadata JSONB column (nullable)
  - Add index on media_type
  - _Requirements: FR-2.7_

- [ ] 9.3 Run migrations and verify schema
  - Apply migrations to development database
  - Verify foreign key constraints
  - Verify indexes created
  - _Requirements: FR-2.4, FR-2.7_

- [ ] 10. Checkpoint - Ensure database migrations applied successfully
  - Verify schema changes, ask the user if questions arise.

---

## Phase 3: Team Collaboration

### 10. Create Team Member Entity (Business BC)

- [ ] 10.1 Create TeamMemberPermission value object
  - Support VIEWER, RESPONDER, MANAGER levels
  - Methods: isViewer(), isResponder(), isManager()
  - Place in `business/domain/vo/`
  - _Requirements: FR-3.1, FR-3.2_

- [ ] 10.2 Create TeamMember entity
  - Fields: id, businessId, userId, email, permission, invitationToken, invitedAt, acceptedAt, status
  - Factory method: TeamMember.invite()
  - Methods: acceptInvitation(), remove(), updatePermission()
  - Methods: canRespond(), canAssign(), canManageTeam()
  - Place in `business/domain/entities/`
  - _Requirements: FR-3.1, FR-3.2, FR-3.3_

- [ ]\* 10.3 Write unit tests for TeamMember entity
  - Test invite() factory method
  - Test acceptInvitation() state transition
  - Test permission checks (canRespond, canAssign, etc.)
  - Test remove() method
  - _Requirements: FR-3.1, FR-3.2, FR-3.3_

- [ ] 11. Checkpoint - Ensure TeamMember tests pass
  - Ensure all tests pass, ask the user if questions arise.

### 11. Implement Team Member Invitation

- [ ] 11.1 Create InviteTeamMemberCommand and handler
  - Command: businessId, email, permission, invitedBy
  - Handler validates business owner permission
  - Handler checks team member limit (max 10)
  - Handler generates invitation token
  - Handler creates TeamMember entity
  - Handler sends invitation email
  - Emits TeamMemberInvited event
  - _Requirements: FR-3.3, FR-3.4, FR-3.5_

- [ ] 11.2 Create POST /api/businesses/:id/team-members/invite endpoint
  - Apply JWT auth guard
  - Apply BusinessOwnerGuard (only owner can invite)
  - Execute InviteTeamMemberCommand
  - Return teamMemberId and invitationToken
  - _Requirements: FR-3.3, NFR-3.1_

- [ ] 11.3 Implement email service for invitations
  - Create email template for team member invitation
  - Include invitation link with token
  - Send via configured email provider
  - _Requirements: FR-3.5_

- [ ]\* 11.4 Write integration tests for invitation
  - Test successful invitation
  - Test team member limit enforcement
  - Test duplicate email rejection
  - Test unauthorized invitation attempt
  - _Requirements: FR-3.3, FR-3.4, FR-3.5, NFR-3.1_

- [ ] 12. Checkpoint - Ensure invitation tests pass
  - Ensure all tests pass, ask the user if questions arise.

### 12. Implement Invitation Acceptance

- [ ] 12.1 Create AcceptTeamMemberInvitationCommand and handler
  - Command: invitationToken, userId
  - Handler finds TeamMember by token
  - Handler validates invitation not expired (7 days)
  - Handler calls teamMember.acceptInvitation(userId)
  - Emits TeamMemberAccepted event
  - _Requirements: FR-3.6_

- [ ] 12.2 Create POST /api/team-members/accept-invitation endpoint
  - Apply JWT auth guard
  - Execute AcceptTeamMemberInvitationCommand
  - Return success message
  - _Requirements: FR-3.6_

- [ ]\* 12.3 Write integration tests for acceptance
  - Test successful acceptance
  - Test expired invitation rejection
  - Test invalid token rejection
  - Test duplicate acceptance rejection
  - _Requirements: FR-3.6_

- [ ] 13. Checkpoint - Ensure acceptance tests pass
  - Ensure all tests pass, ask the user if questions arise.

### 13. Implement Conversation Assignment

- [ ] 13.1 Add assignedToTeamMemberId to Conversation aggregate
  - Add field: `assignedToTeamMemberId: string | null`
  - Add method: `assignTo(teamMemberId: string)`
  - Add method: `unassign()`
  - Emit ConversationAssigned event
  - _Requirements: FR-3.7_

- [ ] 13.2 Create AssignConversationCommand and handler
  - Command: conversationId, teamMemberId, assignedBy
  - Handler validates team member has RESPONDER or MANAGER permission
  - Handler calls conversation.assignTo()
  - _Requirements: FR-3.7, FR-3.8_

- [ ] 13.3 Create POST /api/conversations/:id/assign endpoint
  - Apply JWT auth guard
  - Apply TeamMemberGuard (RESPONDER or MANAGER)
  - Execute AssignConversationCommand
  - _Requirements: FR-3.7, NFR-3.1_

- [ ]\* 13.4 Write integration tests for assignment
  - Test successful assignment
  - Test permission validation (VIEWER cannot assign)
  - Test assignment to non-existent team member rejection
  - _Requirements: FR-3.7, FR-3.8, NFR-3.1_

- [ ] 14. Checkpoint - Ensure assignment tests pass
  - Ensure all tests pass, ask the user if questions arise.

### 14. Implement Team Member Queries

- [ ] 14.1 Create GetTeamMembersQuery and handler
  - Query: businessId
  - Handler returns list of team members with permissions
  - _Requirements: FR-3.9_

- [ ] 14.2 Create GET /api/businesses/:id/team-members endpoint
  - Apply JWT auth guard
  - Execute GetTeamMembersQuery
  - Return team members list
  - _Requirements: FR-3.9_

- [ ] 14.3 Create GetMyAssignedConversationsQuery and handler
  - Query: teamMemberId
  - Handler returns conversations assigned to team member
  - _Requirements: FR-3.10_

- [ ] 14.4 Create GET /api/team-members/me/conversations endpoint
  - Apply JWT auth guard
  - Execute GetMyAssignedConversationsQuery
  - Return assigned conversations
  - _Requirements: FR-3.10_

- [ ]\* 14.5 Write integration tests for team member queries
  - Test GetTeamMembersQuery
  - Test GetMyAssignedConversationsQuery
  - Test access control
  - _Requirements: FR-3.9, FR-3.10, NFR-3.1_

- [ ] 15. Checkpoint - Ensure team member query tests pass
  - Ensure all tests pass, ask the user if questions arise.

### 15. Database Schema for Team Members

- [ ] 15.1 Create team_members table migration
  - Columns: id, business_id, user_id, email, permission, invitation_token, invited_at, accepted_at, status, created_at
  - Foreign keys to businesses and users
  - Indexes on business_id, user_id, invitation_token
  - Unique constraint on (business_id, email)
  - _Requirements: FR-3.1_

- [ ] 15.2 Alter conversations table for assignment
  - Add assigned_to_team_member_id column (nullable)
  - Add foreign key to team_members
  - Add index on assigned_to_team_member_id
  - _Requirements: FR-3.7_

- [ ] 15.3 Run migrations and verify schema
  - Apply migrations to development database
  - Verify foreign key constraints
  - Verify indexes created
  - _Requirements: FR-3.1, FR-3.7_

- [ ] 16. Checkpoint - Ensure team member migrations applied successfully
  - Verify schema changes, ask the user if questions arise.

---

## Phase 4: Templates & Quick Responses

### 16. Create MessageTemplate Entity

- [ ] 16.1 Create TemplateCategory value object
  - Support GREETING, APPOINTMENT, CANCELLATION, CUSTOM categories
  - Validate category on creation
  - Place in `conversation/domain/vo/`
  - _Requirements: FR-4.1_

- [ ] 16.2 Create MessageTemplate entity
  - Fields: id, businessId, name, content, category, variables, isActive, usageCount
  - Factory method: MessageTemplate.create()
  - Methods: use(), deactivate(), updateContent()
  - Place in `conversation/domain/entities/`
  - _Requirements: FR-4.1, FR-4.2_

- [ ]\* 16.3 Write unit tests for MessageTemplate entity
  - Test create() factory method
  - Test use() increments usage count
  - Test variable extraction from content
  - Test deactivate() method
  - _Requirements: FR-4.1, FR-4.2_

- [ ] 17. Checkpoint - Ensure MessageTemplate tests pass
  - Ensure all tests pass, ask the user if questions arise.

### 17. Implement Template Management

- [ ] 17.1 Create CreateMessageTemplateCommand and handler
  - Command: businessId, name, content, category
  - Handler validates template limit (max 50 per business)
  - Handler extracts variables from content ({{variable}} syntax)
  - Handler creates MessageTemplate entity
  - _Requirements: FR-4.1, FR-4.3_

- [ ] 17.2 Create POST /api/templates endpoint
  - Apply JWT auth guard
  - Apply BusinessOwnerGuard or TeamMemberGuard (MANAGER)
  - Execute CreateMessageTemplateCommand
  - Return templateId
  - _Requirements: FR-4.1, NFR-3.1_

- [ ] 17.3 Create UpdateMessageTemplateCommand and handler
  - Command: templateId, name, content, category
  - Handler updates template
  - Handler re-extracts variables
  - _Requirements: FR-4.1_

- [ ] 17.4 Create PUT /api/templates/:id endpoint
  - Apply JWT auth guard
  - Apply BusinessOwnerGuard or TeamMemberGuard (MANAGER)
  - Execute UpdateMessageTemplateCommand
  - _Requirements: FR-4.1, NFR-3.1_

- [ ]\* 17.5 Write integration tests for template management
  - Test successful template creation
  - Test template limit enforcement
  - Test variable extraction
  - Test template update
  - Test unauthorized access rejection
  - _Requirements: FR-4.1, FR-4.3, NFR-3.1_

- [ ] 18. Checkpoint - Ensure template management tests pass
  - Ensure all tests pass, ask the user if questions arise.

### 18. Implement Template Usage

- [ ] 18.1 Create UseMessageTemplateCommand and handler
  - Command: templateId, conversationId, variables (key-value pairs)
  - Handler loads template
  - Handler replaces variables in content
  - Handler creates message with replaced content
  - Handler increments template usage count
  - _Requirements: FR-4.2, FR-4.4_

- [ ] 18.2 Create POST /api/templates/:id/use endpoint
  - Apply JWT auth guard
  - Execute UseMessageTemplateCommand
  - Return messageId
  - _Requirements: FR-4.2_

- [ ] 18.3 Create GetTemplatesQuery and handler
  - Query: businessId, category (optional)
  - Handler returns templates filtered by category
  - Sort by usage count descending
  - _Requirements: FR-4.5_

- [ ] 18.4 Create GET /api/templates endpoint
  - Apply JWT auth guard
  - Execute GetTemplatesQuery
  - Return templates list
  - _Requirements: FR-4.5_

- [ ]\* 18.5 Write integration tests for template usage
  - Test successful template usage with variables
  - Test variable replacement
  - Test usage count increment
  - Test GetTemplatesQuery with category filter
  - _Requirements: FR-4.2, FR-4.4, FR-4.5_

- [ ] 19. Checkpoint - Ensure template usage tests pass
  - Ensure all tests pass, ask the user if questions arise.

### 19. Database Schema for Templates

- [ ] 19.1 Create message_templates table migration
  - Columns: id, business_id, name, content, category, variables (JSONB), is_active, usage_count, created_at, updated_at
  - Foreign key to businesses
  - Indexes on business_id, category, usage_count
  - _Requirements: FR-4.1_

- [ ] 19.2 Run migrations and verify schema
  - Apply migrations to development database
  - Verify foreign key constraints
  - Verify indexes created
  - _Requirements: FR-4.1_

- [ ] 20. Checkpoint - Ensure template migrations applied successfully
  - Verify schema changes, ask the user if questions arise.

---

## Phase 5: Integration & Testing

### 20. End-to-End Testing

- [ ] 20.1 Write E2E test for real-time conversation flow
  - Connect two WebSocket clients
  - Send message from client A
  - Verify client B receives message in real-time
  - Test typing indicators
  - _Requirements: FR-1.2, FR-1.7_

- [ ] 20.2 Write E2E test for media upload and retrieval
  - Upload image via REST API
  - Verify thumbnail generation
  - Retrieve media via GET endpoint
  - Verify access control
  - _Requirements: FR-2.1, FR-2.5, FR-2.8_

- [ ] 20.3 Write E2E test for team collaboration
  - Invite team member
  - Accept invitation
  - Assign conversation
  - Verify assignment notification
  - _Requirements: FR-3.3, FR-3.6, FR-3.7, FR-3.11_

- [ ] 20.4 Write E2E test for template usage
  - Create template with variables
  - Use template in conversation
  - Verify variable replacement
  - Verify usage count increment
  - _Requirements: FR-4.1, FR-4.2, FR-4.4_

- [ ] 21. Checkpoint - Ensure all E2E tests pass
  - Ensure all tests pass, ask the user if questions arise.

### 21. Performance Testing

- [ ] 21.1 Load test WebSocket connections
  - Simulate 100 concurrent connections
  - Verify message delivery < 100ms
  - Verify no memory leaks
  - _Requirements: NFR-4.1_

- [ ] 21.2 Load test media upload
  - Upload 50 images concurrently
  - Verify thumbnail generation completes
  - Verify no file corruption
  - _Requirements: NFR-4.2_

- [ ] 21.3 Stress test conversation assignment
  - Assign 100 conversations concurrently
  - Verify no race conditions
  - Verify all assignments succeed
  - _Requirements: NFR-4.1_

- [ ] 22. Checkpoint - Ensure performance tests pass
  - Review performance metrics, ask the user if questions arise.

### 22. Documentation

- [ ] 22.1 Update API documentation
  - Document all new REST endpoints
  - Document WebSocket events
  - Include request/response examples
  - _Requirements: All FR_

- [ ] 22.2 Create WebSocket integration guide
  - Document connection flow
  - Document authentication
  - Document event handling
  - Include code examples
  - _Requirements: FR-1.1, FR-1.2_

- [ ] 22.3 Create media upload guide
  - Document file size limits
  - Document supported MIME types
  - Document thumbnail generation
  - Include code examples
  - _Requirements: FR-2.1, FR-2.2, FR-2.3, FR-2.5_

- [ ] 22.4 Create team collaboration guide
  - Document permission levels
  - Document invitation flow
  - Document conversation assignment
  - Include code examples
  - _Requirements: FR-3.1, FR-3.2, FR-3.3, FR-3.7_

- [ ] 22.5 Create template usage guide
  - Document template creation
  - Document variable syntax
  - Document template usage
  - Include code examples
  - _Requirements: FR-4.1, FR-4.2, FR-4.4_

- [ ] 23. Final Checkpoint - Documentation complete
  - Review documentation, ask the user if ready for deployment.

---

## Summary

**Total Tasks:** 170+  
**Estimated Duration:** 9-11 weeks  
**Critical Path:** WhatsApp Setup → WebSocket Infrastructure → Rich Media → Team Collaboration → Templates

**Testing Strategy:**

- Unit tests for all domain entities and value objects
- Integration tests for all command/query handlers
- E2E tests for complete user flows
- Performance tests for scalability validation

**Deployment Strategy:**

- Phase 0: Complete WhatsApp Business API setup (week 1)
- Phase 1: Deploy WebSocket infrastructure (week 3)
- Phase 2: Deploy rich media support (week 5)
- Phase 3: Deploy team collaboration (week 7)
- Phase 4: Deploy templates (week 9)
- Phase 5: Final integration and performance testing (week 11)

**Risk Mitigation:**

- Checkpoints after each major feature
- Incremental deployment with feature flags
- Rollback plan for each phase
- Performance monitoring from day 1

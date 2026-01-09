# Conversation Enhancements - Requirements

**Status:** Draft  
**Created:** 2025-01-02  
**Epic:** Conversation System Improvements  
**Priority:** High

---

## 1. Overview

### 1.1 Purpose

Enhance the conversation system with real-time updates, rich media support, team collaboration features, and improved admin efficiency through templates and quick responses.

### 1.2 Context

The current conversation system (Conversation BC) provides basic functionality:

- Text-based WhatsApp integration
- Admin query management (view pending, respond)
- Message history viewing
- Basic conversation state machine

**Current Limitations:**

- No real-time updates (requires manual refresh)
- Text-only messages (no images, files, voice)
- Single admin per business (no team collaboration)
- Manual typing for common responses
- No message templates for consistency

### 1.3 Goals

1. **Real-time Communication:** Enable instant updates without page refresh
2. **Rich Media Support:** Allow images, files, and voice messages
3. **Team Collaboration:** Support multiple team members handling conversations
4. **Admin Efficiency:** Provide templates and quick responses for common scenarios
5. **Better UX:** Improve conversation management interface

### 1.4 Non-Goals (Out of Scope)

- Video messages or calls
- AI-powered auto-responses (future consideration)
- Multi-language translation
- Conversation analytics dashboard
- Customer-facing web chat widget

---

## 2. User Stories

### 2.1 Real-Time Updates

**US-1: Admin receives instant notification of new messages**

- **As a** business admin
- **I want to** receive instant notifications when customers send messages
- **So that** I can respond quickly without refreshing the page

**US-2: Admin sees typing indicators**

- **As a** business admin
- **I want to** see when a customer is typing
- **So that** I know they're actively engaged and can wait for their message

**US-3: Admin sees message delivery status**

- **As a** business admin
- **I want to** see if my messages were delivered and read
- **So that** I know the customer received my response

### 2.2 Rich Media Support

**US-4: Admin receives images from customers**

- **As a** business admin
- **I want to** receive and view images sent by customers
- **So that** I can better understand their needs (e.g., photos of issues)

**US-5: Admin sends images to customers**

- **As a** business admin
- **I want to** send images to customers
- **So that** I can share visual information (e.g., location maps, product photos)

**US-6: Admin receives files from customers**

- **As a** business admin
- **I want to** receive and download files sent by customers
- **So that** I can review documents they share

**US-7: Admin sends files to customers**

- **As a** business admin
- **I want to** send files to customers
- **So that** I can share documents (e.g., price lists, forms)

**US-8: Admin receives voice messages**

- **As a** business admin
- **I want to** receive and play voice messages from customers
- **So that** I can hear their questions directly

### 2.3 Team Collaboration

**US-9: Business owner invites team members**

- **As a** business owner
- **I want to** invite team members to help manage conversations
- **So that** I can distribute workload and provide better customer service

**US-10: Team member accepts invitation**

- **As a** team member
- **I want to** accept an invitation to join a business
- **So that** I can help manage customer conversations

**US-11: Admin assigns conversation to team member**

- **As a** business admin
- **I want to** assign conversations to specific team members
- **So that** customers get consistent support from the same person

**US-12: Team member sees assigned conversations**

- **As a** team member
- **I want to** see conversations assigned to me
- **So that** I can focus on my responsibilities

**US-13: Admin sees who is handling each conversation**

- **As a** business admin
- **I want to** see which team member is assigned to each conversation
- **So that** I can track workload distribution

**US-14: Business owner manages team member permissions**

- **As a** business owner
- **I want to** set permissions for team members (view-only, respond, assign)
- **So that** I can control what each team member can do

### 2.4 Message Templates & Quick Responses

**US-15: Admin creates message templates**

- **As a** business admin
- **I want to** create reusable message templates
- **So that** I can respond quickly to common questions

**US-16: Admin uses template in conversation**

- **As a** business admin
- **I want to** select and insert a template when responding
- **So that** I can save time typing repetitive messages

**US-17: Admin creates quick responses**

- **As a** business admin
- **I want to** create short quick responses with shortcuts
- **So that** I can respond instantly to common scenarios

**US-18: Admin uses quick response with shortcut**

- **As a** business admin
- **I want to** type a shortcut (e.g., "/hours") to insert a quick response
- **So that** I can respond without leaving the keyboard

**US-19: Admin edits template before sending**

- **As a** business admin
- **I want to** edit a template after inserting it
- **So that** I can personalize the message for the specific customer

---

## 3. Functional Requirements

### 3.1 Real-Time Updates (WebSocket)

**FR-1.1:** System SHALL establish WebSocket connection when admin opens conversations page  
**FR-1.2:** System SHALL send new message events to connected admins in real-time  
**FR-1.3:** System SHALL send conversation status updates (assigned, resolved) in real-time  
**FR-1.4:** System SHALL reconnect WebSocket automatically if connection drops  
**FR-1.5:** System SHALL show connection status indicator to admin  
**FR-1.6:** System SHALL fall back to polling if WebSocket is unavailable  
**FR-1.7:** System SHALL send typing indicators when customer is typing  
**FR-1.8:** System SHALL send message delivery status updates (sent, delivered, read)

### 3.2 Rich Media Support

**FR-2.1:** System SHALL accept image uploads (JPEG, PNG, GIF) up to 5MB  
**FR-2.2:** System SHALL accept file uploads (PDF, DOC, XLS) up to 10MB  
**FR-2.3:** System SHALL accept voice messages (OGG, MP3) up to 2MB  
**FR-2.4:** System SHALL store media files securely with access control  
**FR-2.5:** System SHALL generate thumbnails for images  
**FR-2.6:** System SHALL validate file types and sizes before upload  
**FR-2.7:** System SHALL send media to WhatsApp Business API with correct format  
**FR-2.8:** System SHALL receive media from WhatsApp Business API webhooks  
**FR-2.9:** System SHALL display media inline in conversation history  
**FR-2.10:** System SHALL provide download links for files  
**FR-2.11:** System SHALL provide audio player for voice messages

### 3.3 Team Collaboration

**FR-3.1:** System SHALL allow business owner to invite team members by email  
**FR-3.2:** System SHALL send invitation email with acceptance link  
**FR-3.3:** System SHALL create team member account upon invitation acceptance  
**FR-3.4:** System SHALL support three permission levels: VIEWER, RESPONDER, MANAGER  
**FR-3.5:** System SHALL allow admins to assign conversations to team members  
**FR-3.6:** System SHALL show assigned team member in conversation list  
**FR-3.7:** System SHALL filter conversations by assignment (all, assigned to me, unassigned)  
**FR-3.8:** System SHALL track who responded to each message  
**FR-3.9:** System SHALL allow business owner to remove team members  
**FR-3.10:** System SHALL revoke access immediately when team member is removed  
**FR-3.11:** System SHALL notify team member when conversation is assigned to them

### 3.4 Message Templates

**FR-4.1:** System SHALL allow admins to create message templates with name and content  
**FR-4.2:** System SHALL support template variables (e.g., {{customerName}}, {{businessName}})  
**FR-4.3:** System SHALL allow admins to organize templates by category  
**FR-4.4:** System SHALL show template picker in conversation response UI  
**FR-4.5:** System SHALL insert template content into message input  
**FR-4.6:** System SHALL replace template variables with actual values  
**FR-4.7:** System SHALL allow admins to edit, delete templates  
**FR-4.8:** System SHALL limit templates to 500 characters  
**FR-4.9:** System SHALL support up to 50 templates per business

### 3.5 Quick Responses

**FR-5.1:** System SHALL allow admins to create quick responses with shortcut and content  
**FR-5.2:** System SHALL trigger quick response when admin types shortcut (e.g., "/hours")  
**FR-5.3:** System SHALL show autocomplete suggestions as admin types shortcut  
**FR-5.4:** System SHALL insert quick response content when shortcut is selected  
**FR-5.5:** System SHALL support up to 20 quick responses per business  
**FR-5.6:** System SHALL limit quick responses to 200 characters  
**FR-5.7:** System SHALL allow admins to edit, delete quick responses

---

## 4. Non-Functional Requirements

### 4.1 Performance

**NFR-1.1:** WebSocket message delivery SHALL have latency < 500ms  
**NFR-1.2:** Media upload SHALL complete within 10 seconds for max file size  
**NFR-1.3:** Template insertion SHALL be instant (< 100ms)  
**NFR-1.4:** Conversation list SHALL load within 2 seconds  
**NFR-1.5:** Message history SHALL load within 1 second

### 4.2 Scalability

**NFR-2.1:** System SHALL support up to 100 concurrent WebSocket connections per business  
**NFR-2.2:** System SHALL support up to 1000 media files per business  
**NFR-2.3:** System SHALL support up to 10 team members per business

### 4.3 Security

**NFR-3.1:** WebSocket connections SHALL be authenticated with JWT  
**NFR-3.2:** Media files SHALL be stored with access control (business isolation)  
**NFR-3.3:** Media URLs SHALL expire after 24 hours  
**NFR-3.4:** Team member invitations SHALL expire after 7 days  
**NFR-3.5:** File uploads SHALL be scanned for malware  
**NFR-3.6:** Sensitive data in templates SHALL be encrypted at rest

### 4.4 Reliability

**NFR-4.1:** WebSocket SHALL reconnect automatically within 5 seconds  
**NFR-4.2:** Media upload SHALL retry up to 3 times on failure  
**NFR-4.3:** System SHALL fall back to polling if WebSocket fails  
**NFR-4.4:** Message delivery SHALL be guaranteed (at-least-once delivery)

### 4.5 Usability

**NFR-5.1:** Template picker SHALL be accessible with keyboard shortcut (Ctrl+T)  
**NFR-5.2:** Quick response autocomplete SHALL appear within 200ms of typing  
**NFR-5.3:** Media preview SHALL load progressively (show thumbnail first)  
**NFR-5.4:** Connection status SHALL be clearly visible to admin  
**NFR-5.5:** Team member assignment SHALL be visible at a glance

---

## 5. Acceptance Criteria (EARS Patterns)

### 5.1 Real-Time Updates

**AC-1.1:** WHEN admin opens conversations page, THEN WebSocket connection SHALL be established within 2 seconds  
**AC-1.2:** WHEN customer sends message, THEN admin SHALL see message appear within 500ms without refresh  
**AC-1.3:** WHEN WebSocket connection drops, THEN system SHALL show "Reconnecting..." indicator  
**AC-1.4:** WHEN WebSocket reconnects, THEN system SHALL sync missed messages automatically  
**AC-1.5:** IF WebSocket fails after 3 reconnection attempts, THEN system SHALL fall back to polling every 5 seconds

### 5.2 Rich Media Support

**AC-2.1:** WHEN admin uploads image, THEN system SHALL validate size ≤ 5MB and type (JPEG/PNG/GIF)  
**AC-2.2:** WHEN image upload succeeds, THEN system SHALL show thumbnail in message input  
**AC-2.3:** WHEN admin sends message with image, THEN customer SHALL receive image via WhatsApp  
**AC-2.4:** WHEN customer sends image, THEN admin SHALL see image inline in conversation history  
**AC-2.5:** WHEN admin clicks image, THEN system SHALL open full-size preview in modal  
**AC-2.6:** WHEN admin uploads file > 10MB, THEN system SHALL show error "File too large (max 10MB)"  
**AC-2.7:** WHEN customer sends voice message, THEN admin SHALL see audio player with play/pause controls

### 5.3 Team Collaboration

**AC-3.1:** WHEN business owner invites team member, THEN system SHALL send invitation email with acceptance link  
**AC-3.2:** WHEN team member clicks acceptance link, THEN system SHALL create account and grant access  
**AC-3.3:** WHEN admin assigns conversation to team member, THEN team member SHALL see notification  
**AC-3.4:** WHEN team member opens conversations page, THEN system SHALL show assigned conversations first  
**AC-3.5:** WHEN admin filters by "Assigned to me", THEN system SHALL show only conversations assigned to that admin  
**AC-3.6:** WHEN business owner removes team member, THEN system SHALL revoke access immediately  
**AC-3.7:** IF team member has VIEWER permission, THEN system SHALL hide "Respond" button

### 5.4 Message Templates

**AC-4.1:** WHEN admin creates template, THEN system SHALL validate name is unique and content ≤ 500 chars  
**AC-4.2:** WHEN admin opens template picker, THEN system SHALL show all templates grouped by category  
**AC-4.3:** WHEN admin selects template, THEN system SHALL insert content into message input  
**AC-4.4:** WHEN template contains {{customerName}}, THEN system SHALL replace with actual customer name  
**AC-4.5:** WHEN admin edits inserted template, THEN system SHALL allow modifications before sending  
**AC-4.6:** WHEN business has 50 templates, THEN system SHALL prevent creating more with error message

### 5.5 Quick Responses

**AC-5.1:** WHEN admin types "/", THEN system SHALL show autocomplete with available quick responses  
**AC-5.2:** WHEN admin types "/hours", THEN system SHALL show "Business Hours" quick response in autocomplete  
**AC-5.3:** WHEN admin selects quick response, THEN system SHALL replace shortcut with content  
**AC-5.4:** WHEN admin creates quick response with duplicate shortcut, THEN system SHALL show error "Shortcut already exists"  
**AC-5.5:** WHEN quick response content > 200 chars, THEN system SHALL show error "Quick response too long (max 200 chars)"

---

## 6. Technical Considerations

### 6.1 Architecture Decisions

**Decision 1: Team Members - New BC or Existing BC?**

**Analysis:**

- Team members are NOT a separate bounded context
- They are part of the **Business BC** (team members belong to a business)
- Team member is an **Entity** within Business aggregate, not a separate aggregate
- Permissions and roles are managed within Business BC

**Rationale:**

- Team members don't have independent lifecycle (created/deleted by business owner)
- Team members don't have complex business rules requiring separate aggregate
- Team members are tightly coupled to business (can't exist without business)
- Follows DDD principle: keep related concepts in same BC

**Implementation:**

- Add `TeamMember` entity to Business BC
- Add `TeamMemberPermission` value object
- Add commands: `InviteTeamMember`, `AcceptInvitation`, `RemoveTeamMember`
- Add queries: `GetTeamMembers`, `GetTeamMemberPermissions`

**Decision 2: WebSocket vs Server-Sent Events (SSE)**

**Recommendation:** WebSocket (Socket.IO)

**Rationale:**

- Bidirectional communication (needed for typing indicators)
- Better browser support
- Easier to implement with NestJS (@nestjs/websockets)
- Industry standard for real-time chat

**Decision 3: Media Storage**

**Recommendation:** Local filesystem with future migration to S3

**Rationale:**

- MVP: Local storage is simpler and faster to implement
- Future: Migrate to S3 for scalability and CDN support
- Use abstraction layer (IMediaStorage interface) for easy migration

**Decision 4: Message Templates Storage**

**Recommendation:** Database (PostgreSQL)

**Rationale:**

- Templates are business data (need CRUD operations)
- Need to query by business, category
- Need to support template variables
- No need for separate storage service

### 6.2 Domain Model Changes

**New Aggregates:** None (team members are entities, not aggregates)

**New Entities:**

- `TeamMember` (Business BC)
  - id, businessId, userId, email, permission, invitedAt, acceptedAt, status

**New Value Objects:**

- `TeamMemberPermission` (Business BC) - VIEWER, RESPONDER, MANAGER
- `MediaType` (Conversation BC) - IMAGE, FILE, VOICE
- `MediaMetadata` (Conversation BC) - filename, size, mimeType, url

**Modified Aggregates:**

- `Message` (Conversation BC)
  - Add: mediaType, mediaMetadata, assignedToTeamMemberId
- `Conversation` (Conversation BC)
  - Add: assignedToTeamMemberId, lastAssignedAt

**New Domain Events:**

- `TeamMemberInvited` (Business BC)
- `TeamMemberAccepted` (Business BC)
- `TeamMemberRemoved` (Business BC)
- `ConversationAssigned` (Conversation BC)
- `MediaMessageReceived` (Conversation BC)
- `MediaMessageSent` (Conversation BC)

### 6.3 API Changes

**New Endpoints:**

```
# Team Members (Business BC)
POST   /api/businesses/:id/team-members/invite
POST   /api/team-members/accept-invitation
GET    /api/businesses/:id/team-members
DELETE /api/businesses/:id/team-members/:memberId
PUT    /api/businesses/:id/team-members/:memberId/permissions

# Conversation Assignment
PUT    /api/admin-queries/:id/assign
GET    /api/admin-queries?assignedTo=me|all|unassigned

# Media Upload
POST   /api/media/upload
GET    /api/media/:id

# Templates
GET    /api/templates
POST   /api/templates
PUT    /api/templates/:id
DELETE /api/templates/:id

# Quick Responses
GET    /api/quick-responses
POST   /api/quick-responses
PUT    /api/quick-responses/:id
DELETE /api/quick-responses/:id

# WebSocket
WS     /ws/conversations
```

### 6.4 Database Schema Changes

**New Tables:**

```sql
-- Team Members (Business BC)
CREATE TABLE team_members (
  id UUID PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES businesses(id),
  user_id UUID REFERENCES users(id), -- NULL until invitation accepted
  email VARCHAR(255) NOT NULL,
  permission VARCHAR(50) NOT NULL, -- VIEWER, RESPONDER, MANAGER
  invitation_token VARCHAR(255),
  invited_at TIMESTAMP NOT NULL,
  accepted_at TIMESTAMP,
  status VARCHAR(50) NOT NULL, -- PENDING, ACTIVE, REMOVED
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(business_id, email)
);

-- Media Files (Conversation BC)
CREATE TABLE media_files (
  id UUID PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES businesses(id),
  message_id UUID REFERENCES messages(id),
  filename VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  size_bytes INTEGER NOT NULL,
  storage_path VARCHAR(500) NOT NULL,
  thumbnail_path VARCHAR(500),
  url_expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Message Templates (Conversation BC)
CREATE TABLE message_templates (
  id UUID PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES businesses(id),
  name VARCHAR(100) NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(50),
  variables JSONB, -- Array of variable names
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(business_id, name)
);

-- Quick Responses (Conversation BC)
CREATE TABLE quick_responses (
  id UUID PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES businesses(id),
  shortcut VARCHAR(50) NOT NULL,
  content VARCHAR(200) NOT NULL,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(business_id, shortcut)
);
```

**Modified Tables:**

```sql
-- Messages: Add media support and assignment
ALTER TABLE messages
  ADD COLUMN media_type VARCHAR(50), -- IMAGE, FILE, VOICE, NULL for text
  ADD COLUMN media_metadata JSONB,
  ADD COLUMN assigned_to_team_member_id UUID REFERENCES team_members(id);

-- Conversations: Add assignment tracking
ALTER TABLE conversations
  ADD COLUMN assigned_to_team_member_id UUID REFERENCES team_members(id),
  ADD COLUMN last_assigned_at TIMESTAMP;
```

### 6.5 Frontend Changes

**New Components:**

- `WebSocketProvider` - WebSocket connection management
- `ConnectionStatus` - Connection indicator
- `MediaUploader` - File/image upload UI
- `MediaPreview` - Image/file preview
- `AudioPlayer` - Voice message player
- `TemplatePicker` - Template selection modal
- `QuickResponseAutocomplete` - Quick response suggestions
- `TeamMemberList` - Team member management
- `ConversationAssignment` - Assign conversation UI

**Modified Components:**

- `ConversationsPage` - Add WebSocket, filters, assignment
- `MessageList` - Add media message rendering
- `MessageInput` - Add media upload, template picker, quick responses

### 6.6 Dependencies

**Backend:**

- `@nestjs/websockets` - WebSocket support
- `@nestjs/platform-socket.io` - Socket.IO adapter
- `socket.io` - WebSocket library
- `multer` - File upload handling
- `sharp` - Image processing (thumbnails)
- `file-type` - File type detection

**Frontend:**

- `socket.io-client` - WebSocket client
- `react-dropzone` - File upload UI
- `react-audio-player` - Audio playback
- `@mantine/dropzone` - Mantine file upload component

---

## 7. Risks and Mitigations

| Risk                                | Impact | Probability | Mitigation                                                                  |
| ----------------------------------- | ------ | ----------- | --------------------------------------------------------------------------- |
| WebSocket scalability issues        | High   | Medium      | Implement connection pooling, use Redis adapter for horizontal scaling      |
| Media storage costs                 | Medium | High        | Start with local storage, implement S3 migration path, set file size limits |
| Team member permission complexity   | Medium | Low         | Keep permissions simple (3 levels), document clearly                        |
| WhatsApp API media limits           | High   | Medium      | Validate file sizes before upload, show clear error messages                |
| Template variable injection attacks | High   | Low         | Sanitize template variables, use whitelist of allowed variables             |

---

## 8. Success Metrics

**Adoption:**

- 80% of businesses enable team members within 30 days
- 60% of businesses create at least 5 templates within 14 days
- 40% of businesses use quick responses daily

**Performance:**

- WebSocket message latency < 500ms (p95)
- Media upload success rate > 95%
- Template insertion time < 100ms

**Efficiency:**

- Average response time reduced by 30%
- Template usage in 50% of admin responses
- Quick response usage in 20% of admin responses

---

## 9. Dependencies

**Blocked By:**

- None (all features are independent enhancements)

**Blocks:**

- Conversation analytics (needs team member tracking)
- AI-powered responses (needs template system)

---

## 10. Open Questions

1. Should team members have separate login or use existing user accounts?
   - **Decision:** Use existing user accounts (userId reference)
2. Should we support video messages?
   - **Decision:** No, out of scope for this phase

3. Should templates support rich formatting (bold, italic)?
   - **Decision:** No, plain text only for MVP

4. Should we implement read receipts for admin messages?
   - **Decision:** Yes, as part of message delivery status

5. Should team members see all conversations or only assigned ones by default?
   - **Decision:** Show all, with filter for "Assigned to me"

---

## 11. Next Steps

1. Review and approve requirements
2. Create design document with detailed technical specifications
3. Break down into implementation tasks
4. Prioritize features (Phase 1: WebSocket + Media, Phase 2: Team Members, Phase 3: Templates)
5. Begin implementation

---

**Document Status:** Ready for Review  
**Last Updated:** 2025-01-02  
**Next Review:** After stakeholder approval

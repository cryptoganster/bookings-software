# Conversation Enhancements - Design Document

**Status:** Draft  
**Created:** 2025-01-02  
**Epic:** Conversation System Improvements  
**Priority:** High

---

## 1. Overview

### 1.1 Purpose

This document provides the technical design for enhancing the conversation system with:

- Real-time WebSocket updates
- Rich media support (images, files, voice messages)
- Team collaboration features
- Message templates and quick responses

### 1.2 Design Goals

1. **Maintain Clean Architecture:** Follow existing layering (Domain → Application → Infrastructure → Presentation)
2. **Preserve CQRS:** Strict separation between write and read operations
3. **Event-Driven:** Use domain events for cross-BC communication
4. **Scalability:** Design for horizontal scaling with WebSocket clustering
5. **Security:** Implement proper authentication, authorization, and data isolation

### 1.3 Scope

**In Scope:**

- WebSocket gateway for real-time updates
- Media storage and retrieval system
- Team member management (as entities in Business BC)
- Template and quick response management
- Modified Conversation and Message aggregates

**Out of Scope:**

- Video messages or calls
- AI-powered responses
- Multi-language translation
- Analytics dashboard
- Customer-facing web chat widget

---

## 2. Architecture Overview

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ WebSocket    │  │ Media Upload │  │ Template     │     │
│  │ Client       │  │ Component    │  │ Picker       │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                           ↓ ↑
┌─────────────────────────────────────────────────────────────┐
│                     Backend (NestJS)                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           WebSocket Gateway (Socket.IO)              │  │
│  │  - Authentication (JWT)                              │  │
│  │  - Room management (per business)                    │  │
│  │  - Event broadcasting                                │  │
│  └──────────────────────────────────────────────────────┘  │
│                           ↓ ↑                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Application Layer (CQRS)                │  │
│  │  Commands: SendMessage, AssignConversation, etc.    │  │
│  │  Queries: GetConversations, GetMessages, etc.       │  │
│  │  Event Handlers: OnMessageReceived, etc.            │  │
│  └──────────────────────────────────────────────────────┘  │
│                           ↓ ↑                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                  Domain Layer                        │  │
│  │  Aggregates: Conversation, Message, TeamMember      │  │
│  │  Events: MessageSent, ConversationAssigned, etc.    │  │
│  └──────────────────────────────────────────────────────┘  │
│                           ↓ ↑                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │            Infrastructure Layer                      │  │
│  │  - PostgreSQL (conversations, messages, media)      │  │
│  │  - File System (media storage)                      │  │
│  │  - WhatsApp Business API                            │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Bounded Context Decisions

#### Team Members: Business BC (Not a Separate BC)

**Decision:** Team members are **entities** within the **Business BC**, not a separate bounded context.

**Rationale:**

1. **Lifecycle Dependency:** Team members cannot exist without a business
2. **No Complex Business Rules:** Team members don't have independent business logic requiring separate aggregate
3. **Tight Coupling:** Team member permissions and roles are business-specific
4. **DDD Principle:** Keep related concepts in the same BC

**Implementation:**

- `TeamMember` entity in Business BC
- `TeamMemberPermission` value object (VIEWER, RESPONDER, MANAGER)
- Business aggregate manages team member lifecycle
- Commands: `InviteTeamMember`, `AcceptInvitation`, `RemoveTeamMember`

#### Media Storage: Conversation BC

**Decision:** Media files are managed within the **Conversation BC**.

**Rationale:**

1. **Context:** Media is part of messages (conversation context)
2. **Access Control:** Media access tied to conversation permissions
3. **Lifecycle:** Media lifecycle follows message lifecycle
4. **Simplicity:** Avoid creating separate Media BC for MVP

---

## 3. WebSocket Architecture

### 3.1 Technology Choice

**Selected:** Socket.IO with NestJS (@nestjs/websockets)

**Rationale:**

- Bidirectional communication (needed for typing indicators)
- Automatic reconnection and fallback to polling
- Room-based broadcasting (per business isolation)
- Native NestJS integration
- Industry standard for real-time chat

### 3.2 WebSocket Gateway Design

```typescript
// apps/backend/src/conversation/presentation/gateways/conversation.gateway.ts

@WebSocketGateway({
  namespace: "/conversations",
  cors: {
    origin: process.env.FRONTEND_URL,
    credentials: true,
  },
})
export class ConversationGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  constructor(
    private readonly jwtService: JwtService,
    private readonly eventBus: EventBus,
  ) {}

  // Authenticate connection
  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token;
      const payload = await this.jwtService.verifyAsync(token);

      // Store user info in socket
      client.data.userId = payload.sub;
      client.data.businessId = payload.businessId;

      // Join business room
      client.join(`business:${payload.businessId}`);

      // Emit connection success
      client.emit("connected", { userId: payload.sub });
    } catch (error) {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    // Cleanup
  }

  // Broadcast new message to business room
  @OnEvent("message.sent")
  handleMessageSent(event: MessageSent) {
    this.server.to(`business:${event.businessId}`).emit("message:new", {
      conversationId: event.conversationId,
      messageId: event.messageId,
      content: event.content,
      sentAt: event.sentAt,
    });
  }

  // Broadcast conversation assignment
  @OnEvent("conversation.assigned")
  handleConversationAssigned(event: ConversationAssigned) {
    this.server
      .to(`business:${event.businessId}`)
      .emit("conversation:assigned", {
        conversationId: event.conversationId,
        assignedToTeamMemberId: event.assignedToTeamMemberId,
      });
  }

  // Handle typing indicator
  @SubscribeMessage("typing:start")
  handleTypingStart(client: Socket, data: { conversationId: string }) {
    client.to(`business:${client.data.businessId}`).emit("typing:indicator", {
      conversationId: data.conversationId,
      userId: client.data.userId,
      isTyping: true,
    });
  }
}
```

### 3.3 WebSocket Events

**Client → Server:**

- `typing:start` - User started typing
- `typing:stop` - User stopped typing
- `message:read` - User read a message

**Server → Client:**

- `connected` - Connection established
- `message:new` - New message received
- `message:delivered` - Message delivered to WhatsApp
- `message:read` - Message read by customer
- `conversation:assigned` - Conversation assigned to team member
- `conversation:resolved` - Conversation marked as resolved
- `typing:indicator` - Someone is typing

### 3.4 Connection Management

**Authentication:**

```typescript
// Frontend
const socket = io("ws://localhost:3000/conversations", {
  auth: {
    token: localStorage.getItem("accessToken"),
  },
});
```

**Reconnection Strategy:**

- Automatic reconnection with exponential backoff
- Max 5 reconnection attempts
- Fall back to polling if WebSocket fails
- Sync missed messages on reconnection

**Room Isolation:**

- Each business has its own room: `business:{businessId}`
- Team members only receive events for their business
- No cross-business event leakage

---

## 4. Rich Media Support

### 4.1 Media Storage Architecture

**Storage Strategy:**

- **MVP:** Local filesystem with organized directory structure
- **Future:** Migrate to S3 with CDN support
- **Abstraction:** `IMediaStorage` interface for easy migration

**Directory Structure:**

```
uploads/
├── {businessId}/
│   ├── images/
│   │   ├── {messageId}_{timestamp}.jpg
│   │   └── thumbnails/
│   │       └── {messageId}_{timestamp}_thumb.jpg
│   ├── files/
│   │   └── {messageId}_{timestamp}_{filename}
│   └── voice/
│       └── {messageId}_{timestamp}.ogg
```

### 4.2 Media Storage Interface

```typescript
// apps/backend/src/conversation/domain/interfaces/services/media-storage.interface.ts

export interface IMediaStorage {
  /**
   * Stores a media file
   * @returns Storage path and public URL
   */
  store(
    businessId: string,
    messageId: string,
    file: Express.Multer.File,
    mediaType: MediaType,
  ): Promise<{ path: string; url: string }>;

  /**
   * Generates thumbnail for image
   */
  generateThumbnail(
    imagePath: string,
    width: number,
    height: number,
  ): Promise<string>;

  /**
   * Retrieves media file
   */
  retrieve(path: string): Promise<Buffer>;

  /**
   * Deletes media file
   */
  delete(path: string): Promise<void>;

  /**
   * Generates signed URL with expiration
   */
  getSignedUrl(path: string, expiresIn: number): Promise<string>;
}
```

### 4.3 Media Upload Flow

```
1. Admin uploads file via frontend
   ↓
2. POST /api/media/upload (with multipart/form-data)
   ↓
3. Validate file type, size
   ↓
4. Store file via IMediaStorage
   ↓
5. Generate thumbnail (if image)
   ↓
6. Create MediaFile entity
   ↓
7. Return media URL to frontend
   ↓
8. Admin sends message with media
   ↓
9. SendMessageCommand with mediaId
   ↓
10. Message aggregate includes media metadata
    ↓
11. WhatsApp API receives media URL
    ↓
12. Customer receives media via WhatsApp
```

### 4.4 Media Validation

**File Type Validation:**

```typescript
const ALLOWED_MIME_TYPES = {
  IMAGE: ["image/jpeg", "image/png", "image/gif"],
  FILE: ["application/pdf", "application/msword", "application/vnd.ms-excel"],
  VOICE: ["audio/ogg", "audio/mpeg"],
};

const MAX_FILE_SIZES = {
  IMAGE: 5 * 1024 * 1024, // 5MB
  FILE: 10 * 1024 * 1024, // 10MB
  VOICE: 2 * 1024 * 1024, // 2MB
};
```

**Security Measures:**

- Validate MIME type using `file-type` library (not just extension)
- Scan files for malware (future: integrate ClamAV)
- Generate unique filenames to prevent overwriting
- Sanitize original filenames
- Set proper Content-Type headers
- Implement rate limiting on uploads

---

## 5. Team Collaboration

### 5.1 Team Member Entity (Business BC)

```typescript
// apps/backend/src/business/domain/entities/team-member.entity.ts

export class TeamMember {
  private id: UUID;
  private businessId: UUID;
  private userId: UUID | null; // null until invitation accepted
  private email: string;
  private permission: TeamMemberPermission;
  private invitationToken: string | null;
  private invitedAt: Date;
  private acceptedAt: Date | null;
  private status: TeamMemberStatus; // PENDING, ACTIVE, REMOVED

  static invite(
    id: UUID,
    businessId: UUID,
    email: string,
    permission: TeamMemberPermission,
    invitationToken: string,
  ): TeamMember {
    const member = new TeamMember();
    member.id = id;
    member.businessId = businessId;
    member.userId = null; // Not yet accepted
    member.email = email;
    member.permission = permission;
    member.invitationToken = invitationToken;
    member.invitedAt = new Date();
    member.acceptedAt = null;
    member.status = TeamMemberStatus.PENDING;
    return member;
  }

  acceptInvitation(userId: UUID): void {
    if (this.status !== TeamMemberStatus.PENDING) {
      throw new InvitationAlreadyAcceptedException();
    }

    this.userId = userId;
    this.acceptedAt = new Date();
    this.status = TeamMemberStatus.ACTIVE;
    this.invitationToken = null;
  }

  remove(): void {
    if (this.status === TeamMemberStatus.REMOVED) {
      throw new TeamMemberAlreadyRemovedException();
    }

    this.status = TeamMemberStatus.REMOVED;
  }

  updatePermission(permission: TeamMemberPermission): void {
    if (this.status !== TeamMemberStatus.ACTIVE) {
      throw new CannotUpdateInactiveTeamMemberException();
    }

    this.permission = permission;
  }

  canRespond(): boolean {
    return this.permission.isResponder() || this.permission.isManager();
  }

  canAssign(): boolean {
    return this.permission.isManager();
  }

  canManageTeam(): boolean {
    return this.permission.isManager();
  }
}
```

### 5.2 Team Member Permission Value Object

```typescript
// apps/backend/src/business/domain/vo/team-member-permission.vo.ts

export class TeamMemberPermission extends ValueObject {
  private constructor(private readonly value: string) {
    super();
    if (!["VIEWER", "RESPONDER", "MANAGER"].includes(value)) {
      throw new InvalidTeamMemberPermissionException(value);
    }
  }

  static viewer(): TeamMemberPermission {
    return new TeamMemberPermission("VIEWER");
  }

  static responder(): TeamMemberPermission {
    return new TeamMemberPermission("RESPONDER");
  }

  static manager(): TeamMemberPermission {
    return new TeamMemberPermission("MANAGER");
  }

  static fromString(value: string): TeamMemberPermission {
    return new TeamMemberPermission(value);
  }

  isViewer(): boolean {
    return this.value === "VIEWER";
  }

  isResponder(): boolean {
    return this.value === "RESPONDER";
  }

  isManager(): boolean {
    return this.value === "MANAGER";
  }

  getValue(): string {
    return this.value;
  }

  protected getEqualityComponents(): any[] {
    return [this.value];
  }
}
```

### 5.3 Team Member Commands

```typescript
// InviteTeamMemberCommand
export class InviteTeamMemberCommand extends Command<{ teamMemberId: string }> {
  constructor(
    public readonly businessId: string,
    public readonly email: string,
    public readonly permission: string, // 'VIEWER' | 'RESPONDER' | 'MANAGER'
    public readonly invitedBy: string, // userId
  ) {
    super();
  }
}

// InviteTeamMemberHandler
@CommandHandler(InviteTeamMemberCommand)
export class InviteTeamMemberHandler implements ICommandHandler<InviteTeamMemberCommand> {
  constructor(
    @Inject("IBusinessFactory")
    private readonly businessFactory: IBusinessFactory,
    @Inject("IBusinessWriteRepository")
    private readonly businessRepo: IBusinessWriteRepository,
    private readonly emailService: IEmailService,
  ) {}

  async execute(
    command: InviteTeamMemberCommand,
  ): Promise<{ teamMemberId: string }> {
    // 1. Load business aggregate
    const business = await this.businessFactory.loadById(command.businessId);
    if (!business) {
      throw new BusinessNotFoundException(command.businessId);
    }

    // 2. Validate business owner permission
    if (business.getOwnerId() !== command.invitedBy) {
      throw new UnauthorizedException(
        "Only business owner can invite team members",
      );
    }

    // 3. Check team member limit (max 10)
    if (business.getTeamMembers().length >= 10) {
      throw new TeamMemberLimitExceededException();
    }

    // 4. Generate invitation token
    const invitationToken = crypto.randomBytes(32).toString("hex");

    // 5. Create team member entity
    const teamMemberId = UUID.generate();
    const permission = TeamMemberPermission.fromString(command.permission);
    const teamMember = TeamMember.invite(
      teamMemberId,
      UUID.fromString(command.businessId),
      command.email,
      permission,
      invitationToken,
    );

    // 6. Add to business
    business.addTeamMember(teamMember);

    // 7. Persist
    await this.businessRepo.save(business);

    // 8. Send invitation email
    await this.emailService.sendTeamMemberInvitation(
      command.email,
      business.getName(),
      invitationToken,
    );

    return { teamMemberId: teamMemberId.getValue() };
  }
}
```

### 5.4 Conversation Assignment

```typescript
// Modified Conversation Aggregate
export class Conversation extends VersionedAggregateRoot {
  // ... existing fields
  private assignedToTeamMemberId: UUID | null;
  private lastAssignedAt: Date | null;

  assignToTeamMember(teamMemberId: UUID): void {
    this.assignedToTeamMemberId = teamMemberId;
    this.lastAssignedAt = new Date();
    this.incrementVersion();

    this.apply(
      new ConversationAssigned(
        this.id.getValue(),
        this.businessId.getValue(),
        teamMemberId.getValue(),
      ),
    );
  }

  unassign(): void {
    if (!this.assignedToTeamMemberId) {
      throw new ConversationNotAssignedException();
    }

    this.assignedToTeamMemberId = null;
    this.lastAssignedAt = null;
    this.incrementVersion();

    this.apply(
      new ConversationUnassigned(
        this.id.getValue(),
        this.businessId.getValue(),
      ),
    );
  }

  isAssignedTo(teamMemberId: UUID): boolean {
    return this.assignedToTeamMemberId?.equals(teamMemberId) ?? false;
  }
}
```

---

## 6. Message Templates & Quick Responses

### 6.1 Template Aggregate

```typescript
// apps/backend/src/conversation/domain/aggregates/message-template.aggregate.ts

export class MessageTemplate extends AggregateRoot {
  private id: UUID;
  private businessId: UUID;
  private name: string;
  private content: string;
  private category: string | null;
  private variables: string[]; // ['customerName', 'businessName', etc.]
  private createdBy: UUID;
  private createdAt: Date;
  private updatedAt: Date;

  static create(
    id: UUID,
    businessId: UUID,
    name: string,
    content: string,
    category: string | null,
    createdBy: UUID,
  ): MessageTemplate {
    // Validate
    if (content.length > 500) {
      throw new TemplateTooLongException();
    }

    const template = new MessageTemplate();
    template.id = id;
    template.businessId = businessId;
    template.name = name;
    template.content = content;
    template.category = category;
    template.variables = this.extractVariables(content);
    template.createdBy = createdBy;
    template.createdAt = new Date();
    template.updatedAt = new Date();

    template.apply(
      new TemplateCreated(id.getValue(), businessId.getValue(), name, content),
    );

    return template;
  }

  private static extractVariables(content: string): string[] {
    const regex = /\{\{(\w+)\}\}/g;
    const matches = content.matchAll(regex);
    return Array.from(matches, (m) => m[1]);
  }

  update(name: string, content: string, category: string | null): void {
    if (content.length > 500) {
      throw new TemplateTooLongException();
    }

    this.name = name;
    this.content = content;
    this.category = category;
    this.variables = MessageTemplate.extractVariables(content);
    this.updatedAt = new Date();

    this.apply(new TemplateUpdated(this.id.getValue(), name, content));
  }

  renderWithVariables(variables: Record<string, string>): string {
    let rendered = this.content;
    for (const [key, value] of Object.entries(variables)) {
      rendered = rendered.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value);
    }
    return rendered;
  }
}
```

### 6.2 Quick Response Value Object

```typescript
// apps/backend/src/conversation/domain/vo/quick-response.vo.ts

export class QuickResponse extends ValueObject {
  private constructor(
    private readonly shortcut: string,
    private readonly content: string,
  ) {
    super();

    // Validate
    if (!shortcut.startsWith("/")) {
      throw new InvalidQuickResponseShortcutException(
        "Shortcut must start with /",
      );
    }
    if (content.length > 200) {
      throw new QuickResponseTooLongException();
    }
  }

  static create(shortcut: string, content: string): QuickResponse {
    return new QuickResponse(shortcut, content);
  }

  getShortcut(): string {
    return this.shortcut;
  }

  getContent(): string {
    return this.content;
  }

  protected getEqualityComponents(): any[] {
    return [this.shortcut, this.content];
  }
}
```

### 6.3 Template Usage Flow

```
1. Admin opens template picker (Ctrl+T)
   ↓
2. GET /api/templates?businessId={id}
   ↓
3. Frontend displays templates grouped by category
   ↓
4. Admin selects template
   ↓
5. Frontend calls template.renderWithVariables({
      customerName: conversation.customerName,
      businessName: business.name,
    })
   ↓
6. Rendered content inserted into message input
   ↓
7. Admin can edit before sending
   ↓
8. Admin sends message (normal flow)
```

---

## 7. Modified Domain Models

### 7.1 Modified Message Aggregate

```typescript
// apps/backend/src/conversation/domain/aggregates/message.ts

export class Message extends AggregateRoot {
  // ... existing fields
  private mediaType: MediaType | null; // IMAGE, FILE, VOICE, null for text
  private mediaMetadata: MediaMetadata | null;

  static createWithMedia(
    id: UUID,
    conversationId: UUID,
    direction: MessageDirection,
    content: string,
    mediaType: MediaType,
    mediaMetadata: MediaMetadata,
    isFromAdmin: boolean = false,
  ): Message {
    const message = new Message();
    message.id = id;
    message.conversationId = conversationId;
    message.direction = direction;
    message.content = content;
    message.messageType = MessageType.text(); // Media messages are still TEXT type
    message.mediaType = mediaType;
    message.mediaMetadata = mediaMetadata;
    message.sentAt = new Date();
    message.isFromAdmin = isFromAdmin;

    message.apply(
      new MediaMessageSent(
        id.getValue(),
        conversationId.getValue(),
        mediaType.getValue(),
        mediaMetadata.getUrl(),
      ),
    );

    return message;
  }

  hasMedia(): boolean {
    return this.mediaType !== null;
  }

  getMediaType(): MediaType | null {
    return this.mediaType;
  }

  getMediaMetadata(): MediaMetadata | null {
    return this.mediaMetadata;
  }
}
```

### 7.2 Media Value Objects

```typescript
// MediaType Value Object
export class MediaType extends ValueObject {
  private constructor(private readonly value: string) {
    super();
    if (!["IMAGE", "FILE", "VOICE"].includes(value)) {
      throw new InvalidMediaTypeException(value);
    }
  }

  static image(): MediaType {
    return new MediaType("IMAGE");
  }

  static file(): MediaType {
    return new MediaType("FILE");
  }

  static voice(): MediaType {
    return new MediaType("VOICE");
  }

  static fromString(value: string): MediaType {
    return new MediaType(value);
  }

  getValue(): string {
    return this.value;
  }

  protected getEqualityComponents(): any[] {
    return [this.value];
  }
}

// MediaMetadata Value Object
export class MediaMetadata extends ValueObject {
  private constructor(
    private readonly filename: string,
    private readonly sizeBytes: number,
    private readonly mimeType: string,
    private readonly url: string,
    private readonly thumbnailUrl: string | null,
  ) {
    super();
  }

  static create(
    filename: string,
    sizeBytes: number,
    mimeType: string,
    url: string,
    thumbnailUrl: string | null = null,
  ): MediaMetadata {
    return new MediaMetadata(filename, sizeBytes, mimeType, url, thumbnailUrl);
  }

  getFilename(): string {
    return this.filename;
  }

  getSizeBytes(): number {
    return this.sizeBytes;
  }

  getMimeType(): string {
    return this.mimeType;
  }

  getUrl(): string {
    return this.url;
  }

  getThumbnailUrl(): string | null {
    return this.thumbnailUrl;
  }

  protected getEqualityComponents(): any[] {
    return [this.filename, this.sizeBytes, this.mimeType, this.url];
  }
}
```

---

## 8. Domain Events

### 8.1 New Domain Events

```typescript
// Business BC Events
export class TeamMemberInvited {
  constructor(
    public readonly teamMemberId: string,
    public readonly businessId: string,
    public readonly email: string,
    public readonly permission: string,
    public readonly occurredAt: Date = new Date(),
  ) {}
}

export class TeamMemberAccepted {
  constructor(
    public readonly teamMemberId: string,
    public readonly businessId: string,
    public readonly userId: string,
    public readonly occurredAt: Date = new Date(),
  ) {}
}

export class TeamMemberRemoved {
  constructor(
    public readonly teamMemberId: string,
    public readonly businessId: string,
    public readonly occurredAt: Date = new Date(),
  ) {}
}

// Conversation BC Events
export class ConversationAssigned {
  constructor(
    public readonly conversationId: string,
    public readonly businessId: string,
    public readonly assignedToTeamMemberId: string,
    public readonly occurredAt: Date = new Date(),
  ) {}
}

export class ConversationUnassigned {
  constructor(
    public readonly conversationId: string,
    public readonly businessId: string,
    public readonly occurredAt: Date = new Date(),
  ) {}
}

export class MediaMessageSent {
  constructor(
    public readonly messageId: string,
    public readonly conversationId: string,
    public readonly mediaType: string,
    public readonly mediaUrl: string,
    public readonly occurredAt: Date = new Date(),
  ) {}
}

export class MediaMessageReceived {
  constructor(
    public readonly messageId: string,
    public readonly conversationId: string,
    public readonly mediaType: string,
    public readonly mediaUrl: string,
    public readonly occurredAt: Date = new Date(),
  ) {}
}

export class TemplateCreated {
  constructor(
    public readonly templateId: string,
    public readonly businessId: string,
    public readonly name: string,
    public readonly content: string,
    public readonly occurredAt: Date = new Date(),
  ) {}
}
```

### 8.2 Event Handlers for WebSocket Broadcasting

```typescript
// apps/backend/src/conversation/app/event_handlers/on-message-sent.handler.ts

@EventsHandler(MessageSent)
export class OnMessageSentHandler implements IEventHandler<MessageSent> {
  constructor(private readonly conversationGateway: ConversationGateway) {}

  async handle(event: MessageSent) {
    // Broadcast to WebSocket clients
    this.conversationGateway.broadcastMessageSent(event);
  }
}

@EventsHandler(ConversationAssigned)
export class OnConversationAssignedHandler implements IEventHandler<ConversationAssigned> {
  constructor(
    private readonly conversationGateway: ConversationGateway,
    private readonly emailService: IEmailService,
  ) {}

  async handle(event: ConversationAssigned) {
    // 1. Broadcast to WebSocket
    this.conversationGateway.broadcastConversationAssigned(event);

    // 2. Send email notification to assigned team member
    await this.emailService.sendConversationAssignedNotification(
      event.assignedToTeamMemberId,
      event.conversationId,
    );
  }
}
```

---

## 9. API Endpoints

### 9.1 Team Member Endpoints (Business BC)

```typescript
// POST /api/businesses/:id/team-members/invite
@Post(':id/team-members/invite')
@UseGuards(JwtAuthGuard, BusinessOwnerGuard)
async inviteTeamMember(
  @Param('id') businessId: string,
  @Body() dto: InviteTeamMemberDto,
  @CurrentUser() user: UserPayload,
) {
  return this.commandBus.execute(
    new InviteTeamMemberCommand(
      businessId,
      dto.email,
      dto.permission,
      user.userId,
    ),
  );
}

// POST /api/team-members/accept-invitation
@Post('accept-invitation')
@UseGuards(JwtAuthGuard)
async acceptInvitation(
  @Body() dto: AcceptInvitationDto,
  @CurrentUser() user: UserPayload,
) {
  return this.commandBus.execute(
    new AcceptTeamMemberInvitationCommand(
      dto.invitationToken,
      user.userId,
    ),
  );
}

// GET /api/businesses/:id/team-members
@Get(':id/team-members')
@UseGuards(JwtAuthGuard, BusinessMemberGuard)
async getTeamMembers(@Param('id') businessId: string) {
  return this.queryBus.execute(
    new GetTeamMembersQuery(businessId),
  );
}

// DELETE /api/businesses/:id/team-members/:memberId
@Delete(':id/team-members/:memberId')
@UseGuards(JwtAuthGuard, BusinessOwnerGuard)
async removeTeamMember(
  @Param('id') businessId: string,
  @Param('memberId') memberId: string,
) {
  return this.commandBus.execute(
    new RemoveTeamMemberCommand(businessId, memberId),
  );
}

// PUT /api/businesses/:id/team-members/:memberId/permissions
@Put(':id/team-members/:memberId/permissions')
@UseGuards(JwtAuthGuard, BusinessOwnerGuard)
async updatePermissions(
  @Param('id') businessId: string,
  @Param('memberId') memberId: string,
  @Body() dto: UpdatePermissionsDto,
) {
  return this.commandBus.execute(
    new UpdateTeamMemberPermissionsCommand(
      businessId,
      memberId,
      dto.permission,
    ),
  );
}
```

### 9.2 Media Endpoints (Conversation BC)

```typescript
// POST /api/media/upload
@Post('upload')
@UseGuards(JwtAuthGuard)
@UseInterceptors(FileInterceptor('file'))
async uploadMedia(
  @UploadedFile() file: Express.Multer.File,
  @Body() dto: UploadMediaDto,
  @CurrentUser() user: UserPayload,
) {
  return this.commandBus.execute(
    new UploadMediaCommand(
      user.businessId,
      file,
      dto.mediaType,
    ),
  );
}

// GET /api/media/:id
@Get(':id')
@UseGuards(JwtAuthGuard)
async getMedia(
  @Param('id') mediaId: string,
  @CurrentUser() user: UserPayload,
  @Res() res: Response,
) {
  const media = await this.queryBus.execute(
    new GetMediaQuery(mediaId, user.businessId),
  );

  // Stream file
  const fileStream = await this.mediaStorage.retrieve(media.storagePath);
  res.setHeader('Content-Type', media.mimeType);
  res.setHeader('Content-Disposition', `inline; filename="${media.filename}"`);
  res.send(fileStream);
}
```

### 9.3 Conversation Assignment Endpoints

```typescript
// PUT /api/admin-queries/:id/assign
@Put(':id/assign')
@UseGuards(JwtAuthGuard, TeamMemberGuard)
async assignConversation(
  @Param('id') conversationId: string,
  @Body() dto: AssignConversationDto,
  @CurrentUser() user: UserPayload,
) {
  return this.commandBus.execute(
    new AssignConversationCommand(
      conversationId,
      dto.teamMemberId,
      user.userId,
    ),
  );
}

// GET /api/admin-queries?assignedTo=me|all|unassigned
@Get()
@UseGuards(JwtAuthGuard, TeamMemberGuard)
async getConversations(
  @Query('assignedTo') assignedTo: string,
  @CurrentUser() user: UserPayload,
) {
  if (assignedTo === 'me') {
    return this.queryBus.execute(
      new GetAssignedConversationsQuery(user.businessId, user.userId),
    );
  } else if (assignedTo === 'unassigned') {
    return this.queryBus.execute(
      new GetUnassignedConversationsQuery(user.businessId),
    );
  } else {
    return this.queryBus.execute(
      new GetAllConversationsQuery(user.businessId),
    );
  }
}
```

### 9.4 Template Endpoints

```typescript
// GET /api/templates
@Get()
@UseGuards(JwtAuthGuard)
async getTemplates(
  @Query('businessId') businessId: string,
  @Query('category') category: string | undefined,
) {
  return this.queryBus.execute(
    new GetTemplatesQuery(businessId, category),
  );
}

// POST /api/templates
@Post()
@UseGuards(JwtAuthGuard)
async createTemplate(
  @Body() dto: CreateTemplateDto,
  @CurrentUser() user: UserPayload,
) {
  return this.commandBus.execute(
    new CreateTemplateCommand(
      user.businessId,
      dto.name,
      dto.content,
      dto.category,
      user.userId,
    ),
  );
}

// PUT /api/templates/:id
@Put(':id')
@UseGuards(JwtAuthGuard)
async updateTemplate(
  @Param('id') templateId: string,
  @Body() dto: UpdateTemplateDto,
) {
  return this.commandBus.execute(
    new UpdateTemplateCommand(
      templateId,
      dto.name,
      dto.content,
      dto.category,
    ),
  );
}

// DELETE /api/templates/:id
@Delete(':id')
@UseGuards(JwtAuthGuard)
async deleteTemplate(@Param('id') templateId: string) {
  return this.commandBus.execute(
    new DeleteTemplateCommand(templateId),
  );
}
```

### 9.5 Quick Response Endpoints

```typescript
// GET /api/quick-responses
@Get()
@UseGuards(JwtAuthGuard)
async getQuickResponses(@Query('businessId') businessId: string) {
  return this.queryBus.execute(
    new GetQuickResponsesQuery(businessId),
  );
}

// POST /api/quick-responses
@Post()
@UseGuards(JwtAuthGuard)
async createQuickResponse(
  @Body() dto: CreateQuickResponseDto,
  @CurrentUser() user: UserPayload,
) {
  return this.commandBus.execute(
    new CreateQuickResponseCommand(
      user.businessId,
      dto.shortcut,
      dto.content,
      user.userId,
    ),
  );
}
```

---

## 10. Database Schema

### 10.1 New Tables

```sql
-- Team Members (Business BC)
CREATE TABLE team_members (
  id UUID PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  email VARCHAR(255) NOT NULL,
  permission VARCHAR(50) NOT NULL CHECK (permission IN ('VIEWER', 'RESPONDER', 'MANAGER')),
  invitation_token VARCHAR(255),
  invited_at TIMESTAMP NOT NULL,
  accepted_at TIMESTAMP,
  status VARCHAR(50) NOT NULL CHECK (status IN ('PENDING', 'ACTIVE', 'REMOVED')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(business_id, email),
  INDEX idx_team_members_business_id (business_id),
  INDEX idx_team_members_user_id (user_id),
  INDEX idx_team_members_status (status)
);

-- Media Files (Conversation BC)
CREATE TABLE media_files (
  id UUID PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  filename VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  size_bytes INTEGER NOT NULL,
  storage_path VARCHAR(500) NOT NULL,
  thumbnail_path VARCHAR(500),
  url_expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_media_files_business_id (business_id),
  INDEX idx_media_files_message_id (message_id)
);

-- Message Templates (Conversation BC)
CREATE TABLE message_templates (
  id UUID PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  content TEXT NOT NULL CHECK (LENGTH(content) <= 500),
  category VARCHAR(50),
  variables JSONB,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(business_id, name),
  INDEX idx_templates_business_id (business_id),
  INDEX idx_templates_category (category)
);

-- Quick Responses (Conversation BC)
CREATE TABLE quick_responses (
  id UUID PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  shortcut VARCHAR(50) NOT NULL,
  content VARCHAR(200) NOT NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(business_id, shortcut),
  INDEX idx_quick_responses_business_id (business_id)
);
```

### 10.2 Modified Tables

```sql
-- Messages: Add media support
ALTER TABLE messages
  ADD COLUMN media_type VARCHAR(50) CHECK (media_type IN ('IMAGE', 'FILE', 'VOICE') OR media_type IS NULL),
  ADD COLUMN media_metadata JSONB;

-- Conversations: Add assignment tracking
ALTER TABLE conversations
  ADD COLUMN assigned_to_team_member_id UUID REFERENCES team_members(id) ON DELETE SET NULL,
  ADD COLUMN last_assigned_at TIMESTAMP;

-- Add indexes for performance
CREATE INDEX idx_messages_media_type ON messages(media_type) WHERE media_type IS NOT NULL;
CREATE INDEX idx_conversations_assigned_to ON conversations(assigned_to_team_member_id) WHERE assigned_to_team_member_id IS NOT NULL;
```

---

## 11. Correctness Properties

### 11.1 WebSocket Properties

**Property 1: Connection Authentication**

```
WHEN client connects to WebSocket
THEN system SHALL verify JWT token before accepting connection
AND invalid tokens SHALL result in immediate disconnection
```

**Property 2: Room Isolation**

```
GIVEN team member belongs to business A
WHEN message is sent in business B
THEN team member SHALL NOT receive the message
```

**Property 3: Reconnection Idempotency**

```
WHEN client reconnects after disconnection
THEN system SHALL NOT duplicate messages
AND system SHALL sync only missed messages since last connection
```

**Property 4: Event Ordering**

```
GIVEN messages M1, M2, M3 sent in sequence
WHEN broadcast to WebSocket clients
THEN clients SHALL receive messages in same order (M1 → M2 → M3)
```

### 11.2 Media Properties

**Property 5: File Type Validation**

```
GIVEN file with extension .jpg but MIME type application/pdf
WHEN admin uploads file
THEN system SHALL reject upload based on MIME type validation
```

**Property 6: File Size Enforcement**

```
GIVEN image file of 6MB
WHEN admin uploads as IMAGE type
THEN system SHALL reject with error "File too large (max 5MB)"
```

**Property 7: Media Access Control**

```
GIVEN media file belongs to business A
WHEN team member from business B requests media
THEN system SHALL return 403 Forbidden
```

**Property 8: Thumbnail Generation**

```
WHEN admin uploads image
THEN system SHALL generate thumbnail with max dimensions 200x200
AND preserve aspect ratio
```

### 11.3 Team Member Properties

**Property 9: Permission Enforcement**

```
GIVEN team member with VIEWER permission
WHEN team member attempts to send message
THEN system SHALL reject with UnauthorizedException
```

**Property 10: Invitation Uniqueness**

```
GIVEN email already invited to business
WHEN business owner invites same email again
THEN system SHALL reject with TeamMemberAlreadyInvitedException
```

**Property 11: Invitation Expiration**

```
GIVEN invitation created 8 days ago
WHEN user attempts to accept invitation
THEN system SHALL reject with InvitationExpiredException
```

**Property 12: Team Member Limit**

```
GIVEN business has 10 active team members
WHEN business owner invites 11th member
THEN system SHALL reject with TeamMemberLimitExceededException
```

### 11.4 Assignment Properties

**Property 13: Assignment Authorization**

```
GIVEN team member with RESPONDER permission
WHEN team member attempts to assign conversation
THEN system SHALL reject (only MANAGER can assign)
```

**Property 14: Assignment to Active Member Only**

```
GIVEN team member with status REMOVED
WHEN admin attempts to assign conversation to that member
THEN system SHALL reject with TeamMemberInactiveException
```

**Property 15: Assignment Notification**

```
WHEN conversation is assigned to team member
THEN system SHALL send email notification to team member
AND broadcast WebSocket event to all business members
```

### 11.5 Template Properties

**Property 16: Template Name Uniqueness**

```
GIVEN template "Welcome Message" exists for business
WHEN admin creates another template with same name
THEN system SHALL reject with TemplateNameAlreadyExistsException
```

**Property 17: Template Variable Extraction**

```
GIVEN template content "Hello {{customerName}}, welcome to {{businessName}}"
WHEN template is created
THEN system SHALL extract variables ['customerName', 'businessName']
```

**Property 18: Template Rendering**

```
GIVEN template "Hello {{customerName}}"
WHEN rendered with {customerName: "John"}
THEN result SHALL be "Hello John"
```

**Property 19: Template Limit**

```
GIVEN business has 50 templates
WHEN admin creates 51st template
THEN system SHALL reject with TemplateLimitExceededException
```

### 11.6 Quick Response Properties

**Property 20: Shortcut Format**

```
GIVEN shortcut "hours" (without /)
WHEN admin creates quick response
THEN system SHALL reject with InvalidShortcutFormatException
```

**Property 21: Shortcut Uniqueness**

```
GIVEN quick response with shortcut "/hours" exists
WHEN admin creates another with same shortcut
THEN system SHALL reject with ShortcutAlreadyExistsException
```

**Property 22: Quick Response Limit**

```
GIVEN business has 20 quick responses
WHEN admin creates 21st quick response
THEN system SHALL reject with QuickResponseLimitExceededException
```

---

## 12. Error Handling

### 12.1 Domain Exceptions

```typescript
// Team Member Exceptions
export class TeamMemberAlreadyInvitedException extends DomainException {
  constructor(email: string) {
    super(`Team member with email ${email} is already invited`);
  }
}

export class TeamMemberLimitExceededException extends DomainException {
  constructor() {
    super("Maximum team member limit (10) exceeded");
  }
}

export class InvitationExpiredException extends DomainException {
  constructor() {
    super("Invitation has expired (valid for 7 days)");
  }
}

export class TeamMemberInactiveException extends DomainException {
  constructor(teamMemberId: string) {
    super(`Team member ${teamMemberId} is inactive`);
  }
}

// Media Exceptions
export class FileTooLargeException extends DomainException {
  constructor(mediaType: string, maxSize: number) {
    super(`File too large for ${mediaType} (max ${maxSize}MB)`);
  }
}

export class InvalidFileTypeException extends DomainException {
  constructor(mimeType: string, allowedTypes: string[]) {
    super(`Invalid file type ${mimeType}. Allowed: ${allowedTypes.join(", ")}`);
  }
}

export class MediaNotFoundException extends DomainException {
  constructor(mediaId: string) {
    super(`Media file ${mediaId} not found`);
  }
}

// Template Exceptions
export class TemplateTooLongException extends DomainException {
  constructor() {
    super("Template content exceeds maximum length (500 characters)");
  }
}

export class TemplateNameAlreadyExistsException extends DomainException {
  constructor(name: string) {
    super(`Template with name "${name}" already exists`);
  }
}

export class TemplateLimitExceededException extends DomainException {
  constructor() {
    super("Maximum template limit (50) exceeded");
  }
}

// Quick Response Exceptions
export class InvalidShortcutFormatException extends DomainException {
  constructor(message: string) {
    super(message);
  }
}

export class ShortcutAlreadyExistsException extends DomainException {
  constructor(shortcut: string) {
    super(`Quick response with shortcut "${shortcut}" already exists`);
  }
}

export class QuickResponseLimitExceededException extends DomainException {
  constructor() {
    super("Maximum quick response limit (20) exceeded");
  }
}

// Assignment Exceptions
export class ConversationNotAssignedException extends DomainException {
  constructor() {
    super("Conversation is not assigned to any team member");
  }
}

export class UnauthorizedAssignmentException extends DomainException {
  constructor() {
    super("Only team members with MANAGER permission can assign conversations");
  }
}
```

### 12.2 HTTP Error Mapping

```typescript
// apps/backend/src/shared/filters/domain-exception.filter.ts

@Catch(DomainException)
export class DomainExceptionFilter implements ExceptionFilter {
  catch(exception: DomainException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const statusCode = this.mapToHttpStatus(exception);

    response.status(statusCode).json({
      statusCode,
      message: exception.message,
      error: exception.constructor.name,
      timestamp: new Date().toISOString(),
    });
  }

  private mapToHttpStatus(exception: DomainException): number {
    // 400 Bad Request
    if (
      exception instanceof FileTooLargeException ||
      exception instanceof InvalidFileTypeException ||
      exception instanceof TemplateTooLongException ||
      exception instanceof InvalidShortcutFormatException
    ) {
      return 400;
    }

    // 403 Forbidden
    if (
      exception instanceof UnauthorizedAssignmentException ||
      exception instanceof TeamMemberInactiveException
    ) {
      return 403;
    }

    // 404 Not Found
    if (
      exception instanceof MediaNotFoundException ||
      exception instanceof ConversationNotFoundException
    ) {
      return 404;
    }

    // 409 Conflict
    if (
      exception instanceof TeamMemberAlreadyInvitedException ||
      exception instanceof TemplateNameAlreadyExistsException ||
      exception instanceof ShortcutAlreadyExistsException
    ) {
      return 409;
    }

    // 422 Unprocessable Entity
    if (
      exception instanceof TeamMemberLimitExceededException ||
      exception instanceof TemplateLimitExceededException ||
      exception instanceof QuickResponseLimitExceededException
    ) {
      return 422;
    }

    // Default: 500 Internal Server Error
    return 500;
  }
}
```

### 12.3 WebSocket Error Handling

```typescript
// apps/backend/src/conversation/presentation/gateways/conversation.gateway.ts

@WebSocketGateway()
export class ConversationGateway {
  @SubscribeMessage("message:send")
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: SendMessageDto,
  ) {
    try {
      const result = await this.commandBus.execute(
        new SendMessageCommand(data.conversationId, data.content),
      );

      // Emit success
      client.emit("message:sent", result);
    } catch (error) {
      // Emit error to client
      client.emit("error", {
        event: "message:send",
        message: error.message,
        code: error.constructor.name,
      });
    }
  }
}
```

---

## 13. Testing Strategy

### 13.1 Unit Tests

**Aggregates:**

- `Conversation.assignToTeamMember()` - Verify version increment, event emission
- `Message.createWithMedia()` - Verify media metadata validation
- `MessageTemplate.renderWithVariables()` - Verify variable replacement
- `TeamMember.acceptInvitation()` - Verify status transition

**Value Objects:**

- `TeamMemberPermission` - Verify permission levels
- `MediaType` - Verify valid types
- `MediaMetadata` - Verify immutability
- `QuickResponse` - Verify shortcut format validation

**Domain Services:**

- Media validation logic
- Template variable extraction
- File type detection

### 13.2 Integration Tests

**Command Handlers:**

- `InviteTeamMemberHandler` - Verify email sent, team member created
- `AssignConversationHandler` - Verify assignment, notification sent
- `UploadMediaHandler` - Verify file stored, thumbnail generated
- `CreateTemplateHandler` - Verify template created, variables extracted

**Query Handlers:**

- `GetAssignedConversationsQuery` - Verify filtering by assignment
- `GetTemplatesQuery` - Verify filtering by category
- `GetMediaQuery` - Verify access control

**Event Handlers:**

- `OnConversationAssignedHandler` - Verify WebSocket broadcast, email sent
- `OnMediaMessageSentHandler` - Verify WhatsApp API called with media URL

### 13.3 WebSocket Tests

```typescript
describe("ConversationGateway", () => {
  let gateway: ConversationGateway;
  let client: Socket;

  beforeEach(async () => {
    // Setup test client
    client = io("http://localhost:3000/conversations", {
      auth: { token: validJwtToken },
    });
  });

  it("should authenticate connection with valid JWT", (done) => {
    client.on("connected", (data) => {
      expect(data.userId).toBeDefined();
      done();
    });
  });

  it("should broadcast message to business room", (done) => {
    client.on("message:new", (data) => {
      expect(data.conversationId).toBe("test-conversation-id");
      expect(data.content).toBe("Test message");
      done();
    });

    // Trigger message sent event
    eventBus.publish(new MessageSent("msg-id", "conv-id", "Test message"));
  });

  it("should reject connection with invalid JWT", (done) => {
    const invalidClient = io("http://localhost:3000/conversations", {
      auth: { token: "invalid-token" },
    });

    invalidClient.on("disconnect", () => {
      done();
    });
  });
});
```

### 13.4 Media Upload Tests

```typescript
describe("Media Upload", () => {
  it("should upload image and generate thumbnail", async () => {
    const file = createMockFile("test.jpg", "image/jpeg", 1024 * 1024); // 1MB

    const result = await request(app.getHttpServer())
      .post("/api/media/upload")
      .set("Authorization", `Bearer ${validToken}`)
      .attach("file", file.buffer, file.originalname)
      .field("mediaType", "IMAGE")
      .expect(201);

    expect(result.body.mediaId).toBeDefined();
    expect(result.body.url).toContain("/api/media/");
    expect(result.body.thumbnailUrl).toBeDefined();
  });

  it("should reject file exceeding size limit", async () => {
    const file = createMockFile("large.jpg", "image/jpeg", 6 * 1024 * 1024); // 6MB

    await request(app.getHttpServer())
      .post("/api/media/upload")
      .set("Authorization", `Bearer ${validToken}`)
      .attach("file", file.buffer, file.originalname)
      .field("mediaType", "IMAGE")
      .expect(400)
      .expect((res) => {
        expect(res.body.message).toContain("File too large");
      });
  });

  it("should reject invalid MIME type", async () => {
    const file = createMockFile("test.exe", "application/x-msdownload", 1024);

    await request(app.getHttpServer())
      .post("/api/media/upload")
      .set("Authorization", `Bearer ${validToken}`)
      .attach("file", file.buffer, file.originalname)
      .field("mediaType", "IMAGE")
      .expect(400)
      .expect((res) => {
        expect(res.body.message).toContain("Invalid file type");
      });
  });
});
```

### 13.5 Property-Based Tests

```typescript
import { fc, test } from "@fast-check/vitest";

describe("Template Variable Extraction PBT", () => {
  test.prop([
    fc.array(
      fc.stringOf(fc.constantFrom("a", "b", "c", "d"), {
        minLength: 3,
        maxLength: 10,
      }),
      { maxLength: 5 },
    ),
  ])("should extract all variables from template", (variables) => {
    // Generate template with variables
    const template = variables.map((v) => `{{${v}}}`).join(" ");

    // Extract variables
    const extracted = MessageTemplate.extractVariables(template);

    // Property: All variables should be extracted
    expect(extracted).toHaveLength(variables.length);
    expect(extracted).toEqual(expect.arrayContaining(variables));
  });

  test.prop([fc.string({ minLength: 1, maxLength: 500 })])(
    "should handle templates without variables",
    (content) => {
      // Ensure no {{ }} patterns
      const cleanContent = content.replace(/\{\{|\}\}/g, "");

      const extracted = MessageTemplate.extractVariables(cleanContent);

      // Property: No variables should be extracted
      expect(extracted).toHaveLength(0);
    },
  );
});

describe("Team Member Permission PBT", () => {
  test.prop([fc.constantFrom("VIEWER", "RESPONDER", "MANAGER")])(
    "should create valid permission from any valid string",
    (permissionStr) => {
      const permission = TeamMemberPermission.fromString(permissionStr);

      // Property: Permission should be created successfully
      expect(permission).toBeDefined();
      expect(permission.getValue()).toBe(permissionStr);
    },
  );

  test.prop([
    fc.string().filter((s) => !["VIEWER", "RESPONDER", "MANAGER"].includes(s)),
  ])("should reject invalid permission strings", (invalidPermission) => {
    // Property: Invalid permissions should throw exception
    expect(() => TeamMemberPermission.fromString(invalidPermission)).toThrow(
      InvalidTeamMemberPermissionException,
    );
  });
});
```

### 13.6 E2E Tests

```typescript
describe("Conversation Assignment Flow (E2E)", () => {
  it("should complete full assignment workflow", async () => {
    // 1. Business owner invites team member
    const inviteResult = await request(app.getHttpServer())
      .post(`/api/businesses/${businessId}/team-members/invite`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({
        email: "teammember@example.com",
        permission: "RESPONDER",
      })
      .expect(201);

    const teamMemberId = inviteResult.body.teamMemberId;

    // 2. Team member accepts invitation
    await request(app.getHttpServer())
      .post("/api/team-members/accept-invitation")
      .set("Authorization", `Bearer ${memberToken}`)
      .send({
        invitationToken: inviteResult.body.invitationToken,
      })
      .expect(200);

    // 3. Manager assigns conversation to team member
    await request(app.getHttpServer())
      .put(`/api/admin-queries/${conversationId}/assign`)
      .set("Authorization", `Bearer ${managerToken}`)
      .send({
        teamMemberId,
      })
      .expect(200);

    // 4. Team member sees assigned conversation
    const conversations = await request(app.getHttpServer())
      .get("/api/admin-queries?assignedTo=me")
      .set("Authorization", `Bearer ${memberToken}`)
      .expect(200);

    expect(conversations.body).toHaveLength(1);
    expect(conversations.body[0].id).toBe(conversationId);
    expect(conversations.body[0].assignedToTeamMemberId).toBe(teamMemberId);
  });
});
```

---

## 14. Performance Considerations

### 14.1 WebSocket Scaling

**Challenge:** WebSocket connections are stateful and sticky to server instances.

**Solution:**

- Use Redis adapter for Socket.IO to enable horizontal scaling
- Implement connection pooling
- Monitor concurrent connections per instance

```typescript
// apps/backend/src/conversation/conversation.module.ts

@Module({
  imports: [
    // Redis adapter for WebSocket clustering
    RedisModule.forRoot({
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT),
    }),
  ],
  providers: [
    {
      provide: "SOCKET_IO_ADAPTER",
      useFactory: (redisClient: Redis) => {
        return createAdapter(redisClient);
      },
      inject: ["REDIS_CLIENT"],
    },
  ],
})
export class ConversationModule {}
```

### 14.2 Media Storage Optimization

**Strategies:**

- Generate thumbnails asynchronously (background job)
- Implement lazy loading for media in conversation history
- Use CDN for media delivery (future: S3 + CloudFront)
- Implement media cleanup job (delete old media after 90 days)

### 14.3 Database Indexing

```sql
-- Optimize conversation assignment queries
CREATE INDEX idx_conversations_assigned_to_active
  ON conversations(assigned_to_team_member_id, status)
  WHERE assigned_to_team_member_id IS NOT NULL AND status = 'ACTIVE';

-- Optimize media queries
CREATE INDEX idx_media_files_business_created
  ON media_files(business_id, created_at DESC);

-- Optimize template queries
CREATE INDEX idx_templates_business_category
  ON message_templates(business_id, category)
  WHERE category IS NOT NULL;
```

### 14.4 Caching Strategy

**Redis Caching:**

- Cache team member permissions (TTL: 5 minutes)
- Cache templates (TTL: 10 minutes, invalidate on update)
- Cache quick responses (TTL: 10 minutes)

```typescript
@Injectable()
export class CachedTemplateRepository {
  constructor(
    private readonly templateRepo: ITemplateRepository,
    private readonly cacheManager: Cache,
  ) {}

  async getTemplates(businessId: string): Promise<MessageTemplate[]> {
    const cacheKey = `templates:${businessId}`;

    // Try cache first
    const cached = await this.cacheManager.get<MessageTemplate[]>(cacheKey);
    if (cached) {
      return cached;
    }

    // Fetch from database
    const templates = await this.templateRepo.findByBusinessId(businessId);

    // Cache for 10 minutes
    await this.cacheManager.set(cacheKey, templates, 600);

    return templates;
  }
}
```

---

## 15. Security Considerations

### 15.1 WebSocket Authentication

```typescript
// Verify JWT on every connection
async handleConnection(client: Socket) {
  try {
    const token = client.handshake.auth.token;
    const payload = await this.jwtService.verifyAsync(token);

    // Store authenticated user info
    client.data.userId = payload.sub;
    client.data.businessId = payload.businessId;

    // Join business-specific room
    client.join(`business:${payload.businessId}`);
  } catch (error) {
    client.disconnect();
  }
}
```

### 15.2 Media Access Control

```typescript
@Get(':id')
@UseGuards(JwtAuthGuard)
async getMedia(
  @Param('id') mediaId: string,
  @CurrentUser() user: UserPayload,
) {
  const media = await this.queryBus.execute(
    new GetMediaQuery(mediaId),
  );

  // Verify user has access to this media's business
  if (media.businessId !== user.businessId) {
    throw new ForbiddenException('Access denied');
  }

  return media;
}
```

### 15.3 File Upload Security

```typescript
// Multer configuration with security measures
const multerOptions: MulterOptions = {
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
    files: 1, // Only one file per request
  },
  fileFilter: (req, file, callback) => {
    // Validate MIME type
    const allowedMimeTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "application/pdf",
      "audio/ogg",
      "audio/mpeg",
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      return callback(
        new InvalidFileTypeException(file.mimetype, allowedMimeTypes),
        false,
      );
    }

    callback(null, true);
  },
  storage: diskStorage({
    destination: (req, file, callback) => {
      // Organize by business ID
      const businessId = req.user.businessId;
      const uploadPath = `uploads/${businessId}`;

      // Create directory if not exists
      fs.mkdirSync(uploadPath, { recursive: true });

      callback(null, uploadPath);
    },
    filename: (req, file, callback) => {
      // Generate unique filename
      const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}`;
      const sanitizedFilename = file.originalname.replace(
        /[^a-zA-Z0-9.-]/g,
        "_",
      );
      callback(null, `${uniqueSuffix}-${sanitizedFilename}`);
    },
  }),
};
```

### 15.4 Rate Limiting

```typescript
// Rate limit media uploads
@UseGuards(JwtAuthGuard, ThrottlerGuard)
@Throttle(10, 60) // 10 uploads per minute
@Post('upload')
async uploadMedia(...) {
  // Upload logic
}

// Rate limit WebSocket connections
@WebSocketGateway({
  namespace: '/conversations',
  maxHttpBufferSize: 1e6, // 1MB max message size
  pingTimeout: 60000,
  pingInterval: 25000,
})
export class ConversationGateway {
  // Gateway logic
}
```

### 15.5 Input Sanitization

```typescript
// Sanitize template content
export class CreateTemplateDto {
  @IsString()
  @MaxLength(100)
  @Matches(/^[a-zA-Z0-9\s-_]+$/, {
    message:
      "Template name can only contain letters, numbers, spaces, hyphens, and underscores",
  })
  name: string;

  @IsString()
  @MaxLength(500)
  @Transform(({ value }) =>
    sanitizeHtml(value, {
      allowedTags: [], // No HTML tags allowed
      allowedAttributes: {},
    }),
  )
  content: string;
}
```

---

## 16. Migration Strategy

### 16.1 Database Migrations

**Phase 1: Add new tables**

```sql
-- Migration: 001_add_team_members_table.sql
CREATE TABLE team_members (...);

-- Migration: 002_add_media_files_table.sql
CREATE TABLE media_files (...);

-- Migration: 003_add_message_templates_table.sql
CREATE TABLE message_templates (...);

-- Migration: 004_add_quick_responses_table.sql
CREATE TABLE quick_responses (...);
```

**Phase 2: Modify existing tables**

```sql
-- Migration: 005_add_media_to_messages.sql
ALTER TABLE messages
  ADD COLUMN media_type VARCHAR(50),
  ADD COLUMN media_metadata JSONB;

-- Migration: 006_add_assignment_to_conversations.sql
ALTER TABLE conversations
  ADD COLUMN assigned_to_team_member_id UUID,
  ADD COLUMN last_assigned_at TIMESTAMP;
```

**Phase 3: Add indexes**

```sql
-- Migration: 007_add_indexes.sql
CREATE INDEX idx_team_members_business_id ON team_members(business_id);
CREATE INDEX idx_media_files_message_id ON media_files(message_id);
-- ... other indexes
```

### 16.2 Feature Flags

```typescript
// apps/backend/src/shared/config/feature-flags.ts

export const FEATURE_FLAGS = {
  WEBSOCKET_ENABLED: process.env.FEATURE_WEBSOCKET === 'true',
  MEDIA_UPLOAD_ENABLED: process.env.FEATURE_MEDIA_UPLOAD === 'true',
  TEAM_MEMBERS_ENABLED: process.env.FEATURE_TEAM_MEMBERS === 'true',
  TEMPLATES_ENABLED: process.env.FEATURE_TEMPLATES === 'true',
};

// Usage in controller
@Post('upload')
async uploadMedia(...) {
  if (!FEATURE_FLAGS.MEDIA_UPLOAD_ENABLED) {
    throw new FeatureNotEnabledException('Media upload');
  }
  // Upload logic
}
```

### 16.3 Rollout Plan

**Week 1: WebSocket Infrastructure**

- Deploy WebSocket gateway
- Test with small subset of businesses
- Monitor connection stability

**Week 2: Media Upload**

- Enable media upload for pilot businesses
- Monitor storage usage
- Test thumbnail generation

**Week 3: Team Members**

- Enable team member invitations
- Test permission enforcement
- Monitor invitation acceptance rate

**Week 4: Templates & Quick Responses**

- Enable template creation
- Enable quick responses
- Monitor usage metrics

**Week 5: Full Rollout**

- Enable all features for all businesses
- Monitor performance and errors
- Gather user feedback

---

## 17. Monitoring & Observability

### 17.1 Metrics to Track

**WebSocket Metrics:**

- Active connections per business
- Connection duration
- Reconnection rate
- Message delivery latency
- Failed connections

**Media Metrics:**

- Upload success rate
- Upload duration
- Storage usage per business
- Thumbnail generation time
- Failed uploads by type

**Team Member Metrics:**

- Invitation acceptance rate
- Average team size per business
- Permission distribution
- Assignment distribution

**Template Metrics:**

- Template usage rate
- Most used templates
- Template creation rate
- Variable usage frequency

### 17.2 Logging

```typescript
// Structured logging with context
this.logger.log({
  event: "media_uploaded",
  businessId: user.businessId,
  mediaType: file.mimetype,
  sizeBytes: file.size,
  duration: uploadDuration,
});

this.logger.log({
  event: "conversation_assigned",
  conversationId: conversation.getId(),
  assignedTo: teamMemberId,
  assignedBy: user.userId,
});

this.logger.error({
  event: "websocket_connection_failed",
  error: error.message,
  userId: client.data.userId,
  businessId: client.data.businessId,
});
```

### 17.3 Alerts

**Critical Alerts:**

- WebSocket connection failure rate > 5%
- Media upload failure rate > 10%
- Storage usage > 80% capacity
- Database connection pool exhausted

**Warning Alerts:**

- Average WebSocket latency > 1s
- Media upload duration > 15s
- Team member invitation acceptance rate < 50%

---

## 18. Documentation Requirements

### 18.1 API Documentation

Update OpenAPI/Swagger documentation with:

- New endpoints (team members, media, templates, quick responses)
- WebSocket events and payloads
- Error responses
- Authentication requirements

### 18.2 User Documentation

Create user guides for:

- Inviting and managing team members
- Uploading and sending media files
- Creating and using templates
- Setting up quick responses
- Understanding real-time updates

### 18.3 Developer Documentation

Document:

- WebSocket connection flow
- Media storage architecture
- Team member permission model
- Template variable system
- Testing strategies

---

## 19. Future Enhancements

### 19.1 Phase 2 Features

- **Video Messages:** Support video uploads and playback
- **Voice Recording:** In-browser voice recording
- **Rich Text Templates:** Support for bold, italic, links
- **Template Categories:** Organize templates by category
- **Team Member Analytics:** Track response times, message counts
- **Conversation Tags:** Tag conversations for organization
- **Advanced Permissions:** Custom permission sets

### 19.2 Technical Improvements

- **S3 Migration:** Move media storage to S3 with CDN
- **Redis Clustering:** Scale Redis for WebSocket adapter
- **Message Queue:** Use RabbitMQ/SQS for async processing
- **Elasticsearch:** Full-text search for conversations
- **GraphQL Subscriptions:** Alternative to WebSocket for real-time updates

---

## 20. Acceptance Criteria Summary

This design satisfies all acceptance criteria from requirements.md:

✅ **Real-Time Updates (AC-1.1 to AC-1.5):** WebSocket gateway with authentication, reconnection, and fallback  
✅ **Rich Media (AC-2.1 to AC-2.7):** File upload, validation, storage, thumbnail generation  
✅ **Team Collaboration (AC-3.1 to AC-3.7):** Invitation flow, permissions, assignment, notifications  
✅ **Templates (AC-4.1 to AC-4.6):** CRUD operations, variable extraction, rendering, limits  
✅ **Quick Responses (AC-5.1 to AC-5.5):** Shortcut validation, autocomplete, uniqueness, limits

---

## 21. Conclusion

This design document provides a comprehensive technical specification for enhancing the conversation system with:

1. **Real-time communication** via WebSocket with proper authentication and room isolation
2. **Rich media support** with secure storage, validation, and thumbnail generation
3. **Team collaboration** with permission-based access control and assignment workflow
4. **Admin efficiency** through templates and quick responses with variable support

The design follows Clean Architecture, maintains CQRS separation, uses domain events for communication, and includes comprehensive error handling, testing strategies, and security measures.

**Next Steps:**

1. Review and approve this design document
2. Create tasks.md with detailed implementation breakdown
3. Begin implementation in phases (WebSocket → Media → Team Members → Templates)

---

**Document Status:** Ready for Review  
**Last Updated:** 2025-01-02  
**Next Review:** After stakeholder approval

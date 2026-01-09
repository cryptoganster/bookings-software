# Design Document - WhatsApp Multi-Tenant Implementation

## Executive Summary

This document consolidates the design for implementing multi-tenant WhatsApp Business API configuration using **Meta Embedded Signup (OAuth)** - the industry standard for SaaS applications. This approach allows each business to connect their own WhatsApp number without manually handling credentials.

**Current State:** Single-tenant with hardcoded `DEFAULT_BUSINESS_ID` and global `.env` credentials  
**Target State:** Multi-tenant SaaS with OAuth-based WhatsApp connection per business

## Architecture Overview

### High-Level Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    Business Owner                            │
│  1. Clicks "Connect WhatsApp" button                         │
│  2. OAuth popup opens (Meta Embedded Signup)                 │
│  3. Selects/creates WhatsApp Business                        │
│  4. Verifies phone number                                    │
│  5. Grants permissions                                       │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    OAuth Callback                            │
│  1. Meta redirects to /api/oauth/whatsapp/callback          │
│  2. System exchanges code for access_token                   │
│  3. System retrieves waba_id, phone_number_id                │
│  4. System encrypts and stores credentials                   │
│  5. System generates webhook_token                           │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    Webhook Routing                           │
│  WhatsApp → POST /webhooks/whatsapp                          │
│  Payload contains: phone_number_id                           │
│  System: phone_number_id → businessId → credentials          │
│  System: Validates signature, processes message              │
└─────────────────────────────────────────────────────────────┘
```

### Key Differences: Embedded Signup vs Manual Configuration

| Aspect              | Manual (Current)                         | Embedded Signup (Target)        |
| ------------------- | ---------------------------------------- | ------------------------------- |
| **User Experience** | Copy/paste credentials from Meta Console | Click button, OAuth popup, done |
| **Credentials**     | User sees tokens                         | User never sees tokens          |
| **Webhook URL**     | Per-business URLs                        | Single URL for all businesses   |
| **Routing**         | By URL path                              | By `phone_number_id` in payload |
| **Security**        | User handles secrets                     | System handles secrets          |
| **Scalability**     | Manual per business                      | Automatic per business          |

## Database Schema

### New Table: whatsapp_configurations

```sql
CREATE TABLE whatsapp_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL UNIQUE REFERENCES businesses(id) ON DELETE CASCADE,

  -- OAuth Data (from Meta Embedded Signup)
  waba_id VARCHAR(255) NOT NULL, -- WhatsApp Business Account ID
  phone_number_id VARCHAR(255) NOT NULL UNIQUE, -- Phone Number ID (routing key)
  display_phone VARCHAR(50) NOT NULL, -- E.164 format: +1234567890

  -- Encrypted Credentials
  encrypted_access_token TEXT NOT NULL, -- AES-256-CBC encrypted
  encryption_iv VARCHAR(32) NOT NULL, -- Initialization Vector for decryption

  -- Webhook Security
  webhook_token VARCHAR(64) NOT NULL UNIQUE, -- HMAC-SHA256 secret

  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, active, suspended, error
  connected_at TIMESTAMP,
  last_webhook_at TIMESTAMP,

  -- Metadata
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  version INT NOT NULL DEFAULT 0, -- Optimistic locking

  -- Indexes
  CONSTRAINT chk_status CHECK (status IN ('pending', 'active', 'suspended', 'error'))
);

CREATE INDEX idx_whatsapp_config_phone_number_id ON whatsapp_configurations(phone_number_id);
CREATE INDEX idx_whatsapp_config_business_id ON whatsapp_configurations(business_id);
CREATE INDEX idx_whatsapp_config_status ON whatsapp_configurations(status);
```

### Extended Table: businesses

```sql
-- No schema changes needed!
-- Relationship via whatsapp_configurations.business_id foreign key
```

## Domain Model

### Aggregates

#### WhatsAppConfiguration (New Aggregate Root)

**Location:** `src/business/domain/aggregates/whatsapp-configuration.ts`

```typescript
export class WhatsAppConfiguration extends VersionedAggregateRoot {
  private id: UUID;
  private businessId: UUID;
  private wabaId: string;
  private phoneNumberId: PhoneNumberId;
  private displayPhone: string;
  private encryptedAccessToken: EncryptedAccessToken;
  private webhookToken: WebhookToken;
  private status: WhatsAppStatus;
  private connectedAt: Date | null;
  private lastWebhookAt: Date | null;

  // Factory method: Create from OAuth callback
  static createFromOAuth(
    id: UUID,
    businessId: UUID,
    wabaId: string,
    phoneNumberId: PhoneNumberId,
    displayPhone: string,
    accessToken: string,
  ): WhatsAppConfiguration {
    const config = new WhatsAppConfiguration();
    config.id = id;
    config.businessId = businessId;
    config.wabaId = wabaId;
    config.phoneNumberId = phoneNumberId;
    config.displayPhone = displayPhone;
    config.encryptedAccessToken = EncryptedAccessToken.encrypt(accessToken);
    config.webhookToken = WebhookToken.generate();
    config.status = WhatsAppStatus.pending();
    config.connectedAt = new Date();
    config.lastWebhookAt = null;

    config.apply(
      new WhatsAppConnected(
        businessId.getValue(),
        phoneNumberId.getValue(),
        displayPhone,
      ),
    );
    config.incrementVersion();

    return config;
  }

  // Business logic
  activate(): void {
    if (this.status.isActive()) {
      throw new WhatsAppAlreadyActiveException(this.businessId.getValue());
    }

    this.status = WhatsAppStatus.active();
    this.incrementVersion();
    this.apply(new WhatsAppActivated(this.businessId.getValue()));
  }

  suspend(): void {
    if (!this.status.isActive()) {
      throw new WhatsAppNotActiveException(this.businessId.getValue());
    }

    this.status = WhatsAppStatus.suspended();
    this.incrementVersion();
    this.apply(new WhatsAppSuspended(this.businessId.getValue()));
  }

  regenerateWebhookToken(): WebhookToken {
    const newToken = WebhookToken.generate();
    this.webhookToken = newToken;
    this.incrementVersion();
    this.apply(
      new WebhookTokenRegenerated(
        this.businessId.getValue(),
        newToken.getValue(),
      ),
    );
    return newToken;
  }

  validateWebhookSignature(signature: string, payload: string): boolean {
    return this.webhookToken.validateSignature(signature, payload);
  }

  recordWebhookReceived(): void {
    this.lastWebhookAt = new Date();
  }

  getDecryptedAccessToken(): string {
    return this.encryptedAccessToken.decrypt();
  }

  getPhoneNumberId(): PhoneNumberId {
    return this.phoneNumberId;
  }

  getWebhookToken(): WebhookToken {
    return this.webhookToken;
  }

  isActive(): boolean {
    return this.status.isActive();
  }

  // Persistence reconstruction
  static fromPersistence(
    id: UUID,
    businessId: UUID,
    wabaId: string,
    phoneNumberId: PhoneNumberId,
    displayPhone: string,
    encryptedAccessToken: EncryptedAccessToken,
    webhookToken: WebhookToken,
    status: WhatsAppStatus,
    connectedAt: Date | null,
    lastWebhookAt: Date | null,
    version: number,
  ): WhatsAppConfiguration {
    const config = new WhatsAppConfiguration();
    config.id = id;
    config.businessId = businessId;
    config.wabaId = wabaId;
    config.phoneNumberId = phoneNumberId;
    config.displayPhone = displayPhone;
    config.encryptedAccessToken = encryptedAccessToken;
    config.webhookToken = webhookToken;
    config.status = status;
    config.connectedAt = connectedAt;
    config.lastWebhookAt = lastWebhookAt;
    config.setVersion(version);
    return config;
  }
}
```

### Value Objects

#### EncryptedAccessToken

```typescript
export class EncryptedAccessToken extends ValueObject {
  private constructor(
    private readonly encryptedData: string,
    private readonly iv: string,
  ) {
    super();
  }

  static encrypt(plainToken: string): EncryptedAccessToken {
    const algorithm = "aes-256-cbc";
    const key = Buffer.from(process.env.ENCRYPTION_KEY!, "hex");
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(plainToken, "utf8", "hex");
    encrypted += cipher.final("hex");

    return new EncryptedAccessToken(encrypted, iv.toString("hex"));
  }

  decrypt(): string {
    const algorithm = "aes-256-cbc";
    const key = Buffer.from(process.env.ENCRYPTION_KEY!, "hex");
    const iv = Buffer.from(this.iv, "hex");

    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(this.encryptedData, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  }

  protected getEqualityComponents(): any[] {
    return [this.encryptedData, this.iv];
  }
}
```

#### WebhookToken

```typescript
export class WebhookToken extends ValueObject {
  private constructor(private readonly value: string) {
    super();
  }

  static generate(): WebhookToken {
    const token = crypto.randomBytes(32).toString("hex");
    return new WebhookToken(token);
  }

  static fromString(value: string): WebhookToken {
    if (!value || value.length < 32) {
      throw new InvalidWebhookTokenException();
    }
    return new WebhookToken(value);
  }

  validateSignature(signature: string, payload: string): boolean {
    const expectedSignature = crypto
      .createHmac("sha256", this.value)
      .update(payload)
      .digest("hex");

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature),
    );
  }

  getValue(): string {
    return this.value;
  }

  protected getEqualityComponents(): any[] {
    return [this.value];
  }
}
```

#### PhoneNumberId

```typescript
export class PhoneNumberId extends ValueObject {
  private constructor(private readonly value: string) {
    super();
    this.validate();
  }

  static fromString(value: string): PhoneNumberId {
    return new PhoneNumberId(value);
  }

  private validate(): void {
    if (!this.value || !this.value.match(/^\d+$/)) {
      throw new InvalidPhoneNumberIdException(this.value);
    }
  }

  getValue(): string {
    return this.value;
  }

  protected getEqualityComponents(): any[] {
    return [this.value];
  }
}
```

#### WhatsAppStatus

```typescript
export class WhatsAppStatus extends ValueObject {
  private constructor(private readonly value: string) {
    super();
  }

  static pending(): WhatsAppStatus {
    return new WhatsAppStatus("pending");
  }

  static active(): WhatsAppStatus {
    return new WhatsAppStatus("active");
  }

  static suspended(): WhatsAppStatus {
    return new WhatsAppStatus("suspended");
  }

  static error(): WhatsAppStatus {
    return new WhatsAppStatus("error");
  }

  static fromString(value: string): WhatsAppStatus {
    if (!["pending", "active", "suspended", "error"].includes(value)) {
      throw new InvalidWhatsAppStatusException(value);
    }
    return new WhatsAppStatus(value);
  }

  isActive(): boolean {
    return this.value === "active";
  }

  isPending(): boolean {
    return this.value === "pending";
  }

  getValue(): string {
    return this.value;
  }

  protected getEqualityComponents(): any[] {
    return [this.value];
  }
}
```

## OAuth Flow Design

### Step 1: Initiate OAuth (Frontend)

**Frontend Button:**

```typescript
// React component
function ConnectWhatsAppButton() {
  const handleConnect = () => {
    const oauthUrl = `https://www.facebook.com/v18.0/dialog/oauth?` +
      `client_id=${META_APP_ID}&` +
      `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
      `config_id=${META_CONFIG_ID}&` +
      `response_type=code&` +
      `scope=whatsapp_business_management,whatsapp_business_messaging&` +
      `state=${businessId}`; // Pass businessId as state

    // Open OAuth popup
    window.open(oauthUrl, 'whatsapp-oauth', 'width=600,height=800');
  };

  return <button onClick={handleConnect}>Connect WhatsApp</button>;
}
```

### Step 2: OAuth Callback (Backend)

**Endpoint:** `GET /api/oauth/whatsapp/callback`

```typescript
@Controller("oauth/whatsapp")
export class WhatsAppOAuthController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly configService: ConfigService,
  ) {}

  @Get("callback")
  async handleCallback(
    @Query("code") code: string,
    @Query("state") businessId: string,
    @Res() res: FastifyReply,
  ) {
    try {
      // 1. Exchange code for access_token
      const tokenResponse = await axios.post(
        "https://graph.facebook.com/v18.0/oauth/access_token",
        {
          client_id: this.configService.get("META_APP_ID"),
          client_secret: this.configService.get("META_APP_SECRET"),
          code,
          redirect_uri: this.configService.get("OAUTH_REDIRECT_URI"),
        },
      );

      const accessToken = tokenResponse.data.access_token;

      // 2. Get WhatsApp Business Account details
      const wabaResponse = await axios.get(
        `https://graph.facebook.com/v18.0/debug_token?input_token=${accessToken}`,
        {
          headers: {
            Authorization: `Bearer ${this.configService.get("SYSTEM_USER_ACCESS_TOKEN")}`,
          },
        },
      );

      const wabaId = wabaResponse.data.data.granular_scopes[0].target_ids[0];

      // 3. Get phone number details
      const phoneResponse = await axios.get(
        `https://graph.facebook.com/v18.0/${wabaId}/phone_numbers`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      const phoneData = phoneResponse.data.data[0];
      const phoneNumberId = phoneData.id;
      const displayPhone = phoneData.display_phone_number;

      // 4. Store configuration
      await this.commandBus.execute(
        new ConnectWhatsAppCommand(
          businessId,
          wabaId,
          phoneNumberId,
          displayPhone,
          accessToken,
        ),
      );

      // 5. Redirect to success page
      return res.redirect(`/settings/whatsapp?status=success`);
    } catch (error) {
      console.error("OAuth callback error:", error);
      return res.redirect(`/settings/whatsapp?status=error`);
    }
  }
}
```

## Webhook Routing Design

### Current (Single-Tenant)

```typescript
// ❌ Hardcoded businessId
const businessId = process.env.DEFAULT_BUSINESS_ID;
```

### Target (Multi-Tenant)

```typescript
// ✅ Dynamic routing by phone_number_id
@Post()
async handleIncomingMessage(@Body() payload: WhatsAppWebhookPayload) {
  // 1. Extract phone_number_id from payload
  const phoneNumberId = payload.entry[0].changes[0].value.metadata.phone_number_id;

  // 2. Find business by phone_number_id
  const config = await this.configRepo.findByPhoneNumberId(phoneNumberId);

  if (!config) {
    throw new NotFoundException('WhatsApp configuration not found');
  }

  if (!config.isActive()) {
    throw new ForbiddenException('WhatsApp not active');
  }

  // 3. Validate signature
  const signature = req.headers['x-hub-signature-256'];
  const isValid = config.validateWebhookSignature(signature, JSON.stringify(payload));

  if (!isValid) {
    throw new UnauthorizedException('Invalid signature');
  }

  // 4. Record webhook received
  config.recordWebhookReceived();
  await this.configRepo.save(config);

  // 5. Process message
  await this.commandBus.execute(
    new ProcessIncomingMessageCommand(
      config.getBusinessId().getValue(),
      customerPhone,
      messageText,
      buttonId
    )
  );
}
```

## WhatsApp Client Factory Design

### Current (Global Client)

```typescript
// ❌ Single global client
@Injectable()
export class WhatsAppBusinessApiClient implements IWhatsAppClient {
  constructor(private readonly configService: ConfigService) {
    this.apiUrl = configService.get<string>("WHATSAPP_API_URL");
    this.accessToken = configService.get<string>("WHATSAPP_ACCESS_TOKEN");
  }
}
```

### Target (Factory Pattern)

```typescript
// ✅ Factory creates client per business
export interface IWhatsAppClientFactory {
  createClient(businessId: string): Promise<IWhatsAppClient>;
}

@Injectable()
export class WhatsAppClientFactory implements IWhatsAppClientFactory {
  constructor(
    @Inject("IWhatsAppConfigurationReadRepository")
    private readonly configRepo: IWhatsAppConfigurationReadRepository,
  ) {}

  async createClient(businessId: string): Promise<IWhatsAppClient> {
    const config = await this.configRepo.findByBusinessId(businessId);

    if (!config || !config.isActive) {
      throw new WhatsAppNotConfiguredException(businessId);
    }

    // Decrypt access token
    const accessToken = this.decryptAccessToken(
      config.encryptedAccessToken,
      config.encryptionIv,
    );

    // Create client with business-specific credentials
    return new WhatsAppBusinessApiClient(config.phoneNumberId, accessToken);
  }

  private decryptAccessToken(encrypted: string, iv: string): string {
    const algorithm = "aes-256-cbc";
    const key = Buffer.from(process.env.ENCRYPTION_KEY!, "hex");
    const ivBuffer = Buffer.from(iv, "hex");

    const decipher = crypto.createDecipheriv(algorithm, key, ivBuffer);
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  }
}
```

## Commands and Queries

### Commands

#### ConnectWhatsAppCommand

```typescript
export class ConnectWhatsAppCommand extends Command<{ configId: string }> {
  constructor(
    public readonly businessId: string,
    public readonly wabaId: string,
    public readonly phoneNumberId: string,
    public readonly displayPhone: string,
    public readonly accessToken: string,
  ) {
    super();
  }
}
```

#### ActivateWhatsAppCommand

```typescript
export class ActivateWhatsAppCommand extends Command<void> {
  constructor(public readonly businessId: string) {
    super();
  }
}
```

#### RegenerateWebhookTokenCommand

```typescript
export class RegenerateWebhookTokenCommand extends Command<{ token: string }> {
  constructor(public readonly businessId: string) {
    super();
  }
}
```

### Queries

#### GetWhatsAppConfigurationQuery

```typescript
export class GetWhatsAppConfigurationQuery extends Query<WhatsAppConfigurationReadModel> {
  constructor(public readonly businessId: string) {
    super();
  }
}
```

**Read Model:**

```typescript
export interface WhatsAppConfigurationReadModel {
  businessId: string;
  phoneNumberId: string;
  displayPhone: string;
  status: string;
  connectedAt: Date | null;
  lastWebhookAt: Date | null;
  webhookUrl: string; // /webhooks/whatsapp
  // Note: access_token is NEVER exposed in read models
}
```

## Domain Events

```typescript
export class WhatsAppConnected {
  constructor(
    public readonly businessId: string,
    public readonly phoneNumberId: string,
    public readonly displayPhone: string,
    public readonly occurredAt: Date = new Date(),
  ) {}
}

export class WhatsAppActivated {
  constructor(
    public readonly businessId: string,
    public readonly occurredAt: Date = new Date(),
  ) {}
}

export class WhatsAppSuspended {
  constructor(
    public readonly businessId: string,
    public readonly occurredAt: Date = new Date(),
  ) {}
}

export class WebhookTokenRegenerated {
  constructor(
    public readonly businessId: string,
    public readonly newToken: string,
    public readonly occurredAt: Date = new Date(),
  ) {}
}
```

## Security Considerations

### Encryption

**Algorithm:** AES-256-CBC  
**Key Management:**

- Encryption key stored in environment variable `ENCRYPTION_KEY`
- Key must be 32 bytes (64 hex characters)
- Generate with: `openssl rand -hex 32`
- Never commit key to repository
- Rotate key periodically (requires re-encryption)

### Webhook Security

**Signature Validation:**

- HMAC-SHA256 with webhook token as secret
- Timing-safe comparison to prevent timing attacks
- Signature format: `sha256=<hex_digest>`

### OAuth Security

**State Parameter:**

- Pass `businessId` as state to prevent CSRF
- Validate state matches on callback

**Token Storage:**

- Access tokens encrypted at rest
- Never logged or exposed in responses
- Decrypted only when needed for API calls

## Migration Strategy

### Phase 1: Create New Infrastructure

1. Create `whatsapp_configurations` table
2. Create WhatsAppConfiguration aggregate
3. Create Value Objects
4. Create Command/Query handlers
5. Create OAuth controller
6. Create WhatsAppClientFactory

### Phase 2: Migrate Existing Data

```typescript
@Injectable()
export class MigrateToMultiTenantService {
  async migrate(): Promise<void> {
    const businesses = await this.businessRepo.findAll();

    for (const business of businesses) {
      // Create configuration from global env vars
      await this.commandBus.execute(
        new ConnectWhatsAppCommand(
          business.getId().getValue(),
          process.env.GLOBAL_WABA_ID!,
          process.env.GLOBAL_PHONE_NUMBER_ID!,
          process.env.GLOBAL_DISPLAY_PHONE!,
          process.env.GLOBAL_ACCESS_TOKEN!,
        ),
      );

      // Activate immediately
      await this.commandBus.execute(
        new ActivateWhatsAppCommand(business.getId().getValue()),
      );
    }
  }
}
```

### Phase 3: Update Webhook Controller

1. Remove hardcoded `DEFAULT_BUSINESS_ID`
2. Add dynamic routing by `phone_number_id`
3. Add signature validation per business

### Phase 4: Update Message Handlers

1. Inject `IWhatsAppClientFactory` instead of `IWhatsAppClient`
2. Call `factory.createClient(businessId)` to get business-specific client
3. Use client for sending messages

### Phase 5: Deprecate Global Configuration

1. Remove global env vars:
   - `WHATSAPP_API_URL`
   - `WHATSAPP_ACCESS_TOKEN`
   - `WHATSAPP_PHONE_NUMBER_ID`
   - `WHATSAPP_BUSINESS_ACCOUNT_ID`
   - `WHATSAPP_WEBHOOK_VERIFY_TOKEN`
   - `WHATSAPP_WEBHOOK_SECRET`

2. Keep only:
   - `ENCRYPTION_KEY` (for encrypting access tokens)
   - `META_APP_ID` (for OAuth)
   - `META_APP_SECRET` (for OAuth)
   - `SYSTEM_USER_ACCESS_TOKEN` (for OAuth)
   - `OAUTH_REDIRECT_URI` (for OAuth)

## API Endpoints

### OAuth

```
GET  /api/oauth/whatsapp/callback?code=...&state=businessId
```

### Configuration Management

```
GET    /api/business/:id/whatsapp/configuration
POST   /api/business/:id/whatsapp/activate
POST   /api/business/:id/whatsapp/suspend
POST   /api/business/:id/whatsapp/regenerate-token
DELETE /api/business/:id/whatsapp/disconnect
```

### Webhooks (Public)

```
POST /webhooks/whatsapp
GET  /webhooks/whatsapp (verification)
```

## Testing Strategy

### Unit Tests

- WhatsAppConfiguration aggregate methods
- Value Objects (EncryptedAccessToken, WebhookToken, PhoneNumberId, WhatsAppStatus)
- Encryption/decryption round-trip
- Signature validation

### Integration Tests

- Command handlers with database
- Query handlers with database
- OAuth callback flow
- Webhook routing by phone_number_id

### E2E Tests

- Complete OAuth flow (mocked Meta API)
- Webhook processing with signature validation
- Multi-tenant isolation (two businesses, different configs)
- Message sending with business-specific credentials

## Implementation Checklist

- [ ] Create `whatsapp_configurations` table migration
- [ ] Create WhatsAppConfiguration aggregate
- [ ] Create Value Objects (EncryptedAccessToken, WebhookToken, PhoneNumberId, WhatsAppStatus)
- [ ] Create domain exceptions
- [ ] Create domain events
- [ ] Create Command handlers (Connect, Activate, Suspend, RegenerateToken)
- [ ] Create Query handlers (GetConfiguration)
- [ ] Create OAuth controller
- [ ] Create WhatsAppClientFactory
- [ ] Update webhook controller (dynamic routing)
- [ ] Update ProcessIncomingMessageHandler (use factory)
- [ ] Update SendWhatsAppMessageHandler (use factory)
- [ ] Write unit tests
- [ ] Write integration tests
- [ ] Write E2E tests
- [ ] Create migration script
- [ ] Update frontend (Connect WhatsApp button)
- [ ] Document OAuth setup
- [ ] Add monitoring/alerting

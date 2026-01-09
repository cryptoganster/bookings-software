# Design Document - WhatsApp Multi-Tenant Configuration

## Overview

Sistema de configuración multi-tenant para WhatsApp Business API que permite a cada negocio gestionar sus propias credenciales, webhooks y personalización del bot de manera independiente y segura.

**Bounded Context:** Business BC  
**Aggregates Principales:** Business (extendido), WhatsAppConfiguration  
**Patrón:** Aggregate Root con Value Objects encriptados

## Architecture

### High-Level Design

```
┌─────────────────────────────────────────────────────────────┐
│                    Business Aggregate                        │
│  - businessId                                                │
│  - ownerId                                                   │
│  - whatsappConfig: WhatsAppConfiguration (VO)               │
│  - botConfig: BotConfiguration (VO)                          │
└─────────────────────────────────────────────────────────────┘
                            ↓
        ┌───────────────────────────────────────────┐
        │   WhatsAppConfiguration (Value Object)    │
        │   - credentials: EncryptedCredentials     │
        │   - webhookToken: WebhookToken            │
        │   - phoneNumberId: PhoneNumberId          │
        │   - isActive: boolean                     │
        └───────────────────────────────────────────┘
                            ↓
        ┌───────────────────────────────────────────┐
        │      BotConfiguration (Value Object)      │
        │   - welcomeMessage: string                │
        │   - language: Language                    │
        │   - buttonLabels: ButtonLabels            │
        │   - autoReplySchedule: Schedule           │
        └───────────────────────────────────────────┘
```

### Multi-Tenant Webhook Flow

```
WhatsApp API
    ↓
POST /webhooks/whatsapp/{businessId}
    ↓
WebhookController
    ↓
1. Extract businessId from URL
2. Load Business aggregate
3. Validate webhook signature using Business.webhookToken
4. If valid → ProcessIncomingMessageCommand
5. If invalid → HTTP 401
```

## Components and Interfaces

### 1. Business Aggregate (Extended)

**Location:** `src/business/domain/aggregates/business.ts`

```typescript
export class Business extends VersionedAggregateRoot {
  private id: UUID;
  private ownerId: UUID;
  private name: string;
  private whatsappConfig: WhatsAppConfiguration | null;
  private botConfig: BotConfiguration | null;

  // New methods for WhatsApp configuration
  configureWhatsApp(
    credentials: WhatsAppCredentials,
    phoneNumberId: PhoneNumberId,
  ): void {
    // Validate credentials format
    if (!credentials.isValid()) {
      throw new InvalidWhatsAppCredentialsException();
    }

    // Generate webhook token if first time
    const webhookToken =
      this.whatsappConfig?.webhookToken ?? WebhookToken.generate();

    this.whatsappConfig = WhatsAppConfiguration.create(
      credentials,
      phoneNumberId,
      webhookToken,
      false, // Not active until tested
    );

    this.incrementVersion();
    this.apply(
      new WhatsAppConfigured(
        this.id.getValue(),
        phoneNumberId.getValue(),
        webhookToken.getValue(),
      ),
    );
  }

  activateWhatsApp(): void {
    if (!this.whatsappConfig) {
      throw new WhatsAppNotConfiguredException(this.id.getValue());
    }

    this.whatsappConfig = this.whatsappConfig.activate();
    this.incrementVersion();
    this.apply(new WhatsAppActivated(this.id.getValue()));
  }

  regenerateWebhookToken(): WebhookToken {
    if (!this.whatsappConfig) {
      throw new WhatsAppNotConfiguredException(this.id.getValue());
    }

    const newToken = WebhookToken.generate();
    this.whatsappConfig = this.whatsappConfig.withWebhookToken(newToken);

    this.incrementVersion();
    this.apply(
      new WebhookTokenRegenerated(this.id.getValue(), newToken.getValue()),
    );

    return newToken;
  }

  configureBotSettings(
    welcomeMessage: string,
    language: Language,
    buttonLabels: ButtonLabels,
    autoReplySchedule: Schedule | null,
  ): void {
    this.botConfig = BotConfiguration.create(
      welcomeMessage,
      language,
      buttonLabels,
      autoReplySchedule,
    );

    this.incrementVersion();
    this.apply(new BotConfigured(this.id.getValue(), language.getValue()));
  }

  validateWebhookSignature(signature: string, payload: string): boolean {
    if (!this.whatsappConfig) {
      return false;
    }

    return this.whatsappConfig.validateSignature(signature, payload);
  }

  getWhatsAppCredentials(): WhatsAppCredentials {
    if (!this.whatsappConfig) {
      throw new WhatsAppNotConfiguredException(this.id.getValue());
    }

    return this.whatsappConfig.getCredentials();
  }

  getWebhookUrl(): string {
    return `/webhooks/whatsapp/${this.id.getValue()}`;
  }

  isWhatsAppActive(): boolean {
    return this.whatsappConfig?.isActive ?? false;
  }
}
```

### 2. Value Objects

#### WhatsAppConfiguration

**Location:** `src/business/domain/vo/whatsapp-configuration.vo.ts`

```typescript
export class WhatsAppConfiguration extends ValueObject {
  private constructor(
    private readonly credentials: EncryptedCredentials,
    private readonly phoneNumberId: PhoneNumberId,
    private readonly webhookToken: WebhookToken,
    private readonly isActive: boolean,
  ) {
    super();
  }

  static create(
    credentials: WhatsAppCredentials,
    phoneNumberId: PhoneNumberId,
    webhookToken: WebhookToken,
    isActive: boolean = false,
  ): WhatsAppConfiguration {
    const encrypted = EncryptedCredentials.encrypt(credentials);
    return new WhatsAppConfiguration(
      encrypted,
      phoneNumberId,
      webhookToken,
      isActive,
    );
  }

  activate(): WhatsAppConfiguration {
    return new WhatsAppConfiguration(
      this.credentials,
      this.phoneNumberId,
      this.webhookToken,
      true,
    );
  }

  withWebhookToken(newToken: WebhookToken): WhatsAppConfiguration {
    return new WhatsAppConfiguration(
      this.credentials,
      this.phoneNumberId,
      newToken,
      this.isActive,
    );
  }

  validateSignature(signature: string, payload: string): boolean {
    return this.webhookToken.validateSignature(signature, payload);
  }

  getCredentials(): WhatsAppCredentials {
    return this.credentials.decrypt();
  }

  getPhoneNumberId(): PhoneNumberId {
    return this.phoneNumberId;
  }

  getWebhookToken(): WebhookToken {
    return this.webhookToken;
  }

  protected getEqualityComponents(): any[] {
    return [
      this.credentials,
      this.phoneNumberId,
      this.webhookToken,
      this.isActive,
    ];
  }
}
```

#### WhatsAppCredentials

```typescript
export class WhatsAppCredentials extends ValueObject {
  private constructor(
    private readonly apiKey: string,
    private readonly phoneNumberId: string,
    private readonly businessAccountId: string,
  ) {
    super();
    this.validate();
  }

  static create(
    apiKey: string,
    phoneNumberId: string,
    businessAccountId: string,
  ): WhatsAppCredentials {
    return new WhatsAppCredentials(apiKey, phoneNumberId, businessAccountId);
  }

  private validate(): void {
    if (!this.apiKey || this.apiKey.length < 20) {
      throw new InvalidApiKeyException();
    }
    if (!this.phoneNumberId || !this.phoneNumberId.match(/^\d+$/)) {
      throw new InvalidPhoneNumberIdException();
    }
    if (!this.businessAccountId || !this.businessAccountId.match(/^\d+$/)) {
      throw new InvalidBusinessAccountIdException();
    }
  }

  isValid(): boolean {
    try {
      this.validate();
      return true;
    } catch {
      return false;
    }
  }

  getMaskedApiKey(): string {
    return `****${this.apiKey.slice(-4)}`;
  }

  getApiKey(): string {
    return this.apiKey;
  }

  getPhoneNumberId(): string {
    return this.phoneNumberId;
  }

  getBusinessAccountId(): string {
    return this.businessAccountId;
  }

  protected getEqualityComponents(): any[] {
    return [this.apiKey, this.phoneNumberId, this.businessAccountId];
  }
}
```

#### EncryptedCredentials

```typescript
export class EncryptedCredentials extends ValueObject {
  private constructor(
    private readonly encryptedData: string,
    private readonly iv: string,
  ) {
    super();
  }

  static encrypt(credentials: WhatsAppCredentials): EncryptedCredentials {
    const algorithm = "aes-256-cbc";
    const key = Buffer.from(process.env.ENCRYPTION_KEY!, "hex");
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv(algorithm, key, iv);
    const data = JSON.stringify({
      apiKey: credentials.getApiKey(),
      phoneNumberId: credentials.getPhoneNumberId(),
      businessAccountId: credentials.getBusinessAccountId(),
    });

    let encrypted = cipher.update(data, "utf8", "hex");
    encrypted += cipher.final("hex");

    return new EncryptedCredentials(encrypted, iv.toString("hex"));
  }

  decrypt(): WhatsAppCredentials {
    const algorithm = "aes-256-cbc";
    const key = Buffer.from(process.env.ENCRYPTION_KEY!, "hex");
    const iv = Buffer.from(this.iv, "hex");

    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(this.encryptedData, "hex", "utf8");
    decrypted += decipher.final("utf8");

    const data = JSON.parse(decrypted);
    return WhatsAppCredentials.create(
      data.apiKey,
      data.phoneNumberId,
      data.businessAccountId,
    );
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

#### BotConfiguration

```typescript
export class BotConfiguration extends ValueObject {
  private constructor(
    private readonly welcomeMessage: string,
    private readonly language: Language,
    private readonly buttonLabels: ButtonLabels,
    private readonly autoReplySchedule: Schedule | null,
  ) {
    super();
    this.validate();
  }

  static create(
    welcomeMessage: string,
    language: Language,
    buttonLabels: ButtonLabels,
    autoReplySchedule: Schedule | null,
  ): BotConfiguration {
    return new BotConfiguration(
      welcomeMessage,
      language,
      buttonLabels,
      autoReplySchedule,
    );
  }

  static default(): BotConfiguration {
    return new BotConfiguration(
      "¡Hola! 👋 Bienvenido a nuestro servicio",
      Language.spanish(),
      ButtonLabels.default(),
      null,
    );
  }

  private validate(): void {
    if (!this.welcomeMessage || this.welcomeMessage.length < 10) {
      throw new InvalidWelcomeMessageException();
    }
    if (this.welcomeMessage.length > 500) {
      throw new WelcomeMessageTooLongException();
    }
  }

  getWelcomeMessage(): string {
    return this.welcomeMessage;
  }

  getLanguage(): Language {
    return this.language;
  }

  getButtonLabels(): ButtonLabels {
    return this.buttonLabels;
  }

  shouldAutoReply(currentTime: Date): boolean {
    if (!this.autoReplySchedule) {
      return true; // Always auto-reply if no schedule
    }
    return this.autoReplySchedule.includes(currentTime);
  }

  protected getEqualityComponents(): any[] {
    return [
      this.welcomeMessage,
      this.language,
      this.buttonLabels,
      this.autoReplySchedule,
    ];
  }
}
```

## Data Models

### Database Schema Changes

#### businesses table (extended)

```sql
ALTER TABLE businesses ADD COLUMN whatsapp_config JSONB;
ALTER TABLE businesses ADD COLUMN bot_config JSONB;

-- Structure of whatsapp_config JSONB:
{
  "encryptedCredentials": {
    "encryptedData": "hex_string",
    "iv": "hex_string"
  },
  "phoneNumberId": "1234567890",
  "webhookToken": "hex_token",
  "isActive": false
}

-- Structure of bot_config JSONB:
{
  "welcomeMessage": "¡Hola! 👋",
  "language": "es",
  "buttonLabels": {
    "newAppointment": "Nueva Cita",
    "modifyAppointment": "Modificar",
    "cancelAppointment": "Cancelar",
    "contactAdmin": "Hablar con Admin"
  },
  "autoReplySchedule": {
    "monday": {"start": "09:00", "end": "18:00"},
    "tuesday": {"start": "09:00", "end": "18:00"}
    // ... other days
  }
}

-- Indexes
CREATE INDEX idx_businesses_whatsapp_active
  ON businesses ((whatsapp_config->>'isActive'));
```

### TypeORM Model

```typescript
@Entity("businesses")
export class BusinessModel {
  @PrimaryColumn("uuid")
  id: string;

  @Column("uuid")
  ownerId: string;

  @Column()
  name: string;

  @Column({ type: "jsonb", nullable: true })
  whatsappConfig: {
    encryptedCredentials: {
      encryptedData: string;
      iv: string;
    };
    phoneNumberId: string;
    webhookToken: string;
    isActive: boolean;
  } | null;

  @Column({ type: "jsonb", nullable: true })
  botConfig: {
    welcomeMessage: string;
    language: string;
    buttonLabels: {
      newAppointment: string;
      modifyAppointment: string;
      cancelAppointment: string;
      contactAdmin: string;
    };
    autoReplySchedule: Record<string, { start: string; end: string }> | null;
  } | null;

  @Column({ type: "int", default: 0 })
  version: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Property Reflection

After analyzing all acceptance criteria, the following properties were identified as testable. Some properties were combined to eliminate redundancy:

**Redundancies eliminated:**

- 1.3 and 1.6 both test encryption round-trip → Combined into Property 1
- 2.1 and 2.2 both test webhook URL generation → Combined into Property 3
- 4.2, 4.3, 4.4 all test bot configuration storage → Combined into Property 8

### Core Properties

**Property 1: Credentials Encryption Round-Trip**

_For any_ valid WhatsApp credentials, encrypting then decrypting should return credentials with identical values

**Validates: Requirements 1.3, 1.6**

**Property 2: Invalid Credentials Rejection**

_For any_ credentials with invalid format (short API key, non-numeric phone ID, or non-numeric business account ID), creating WhatsAppCredentials should throw a specific exception

**Validates: Requirements 1.2, 1.4**

**Property 3: Webhook URL Uniqueness**

_For any_ two different businesses, their webhook URLs should be different and should include their respective businessIds

**Validates: Requirements 2.1, 2.2**

**Property 4: Webhook Token Generation Uniqueness**

_For any_ business configuring WhatsApp for the first time, a webhook token should be generated, and regenerating it should produce a different token

**Validates: Requirements 2.4, 2.6**

**Property 5: Token Invalidation After Regeneration**

_For any_ business with a webhook token, after regenerating the token, signatures validated with the old token should fail while signatures with the new token should succeed

**Validates: Requirements 2.7**

**Property 6: Webhook Signature Validation**

_For any_ valid webhook payload and token, the signature validation should succeed if and only if the signature was generated using that token

**Validates: Requirements 3.2**

**Property 7: API Key Masking**

_For any_ WhatsApp credentials, the masked API key should only show the last 4 characters and hide the rest

**Validates: Requirements 1.7**

**Property 8: Bot Configuration Persistence**

_For any_ valid bot configuration (welcome message, language, button labels, schedule), after configuring the bot, retrieving the configuration should return the same values

**Validates: Requirements 4.2, 4.3, 4.4, 4.7**

**Property 9: Auto-Reply Schedule Respect**

_For any_ bot configuration with an auto-reply schedule, shouldAutoReply() should return true only for times within the configured schedule

**Validates: Requirements 4.5**

**Property 10: Bot Configuration Validation**

_For any_ bot configuration with invalid data (welcome message too short, too long, or missing required fields), creating BotConfiguration should throw a specific exception

**Validates: Requirements 4.6**

**Property 11: WhatsApp Activation State Transition**

_For any_ business with WhatsApp configured but not active, calling activateWhatsApp() should change isActive to true

**Validates: Requirements 6.7**

**Property 12: Configuration Update Idempotence**

_For any_ business with existing WhatsApp configuration, updating the configuration multiple times with the same credentials should result in the same final state

**Validates: Requirements 1.5**

**Property 13: Phone Number ID Retrieval**

_For any_ business with active WhatsApp configuration, getPhoneNumberId() should return the phone number ID that was configured

**Validates: Requirements 5.2**

## Error Handling

### Domain Exceptions

```typescript
// Credentials
export class InvalidWhatsAppCredentialsException extends DomainException {
  constructor() {
    super("WhatsApp credentials are invalid");
  }
}

export class InvalidApiKeyException extends DomainException {
  constructor() {
    super("API key must be at least 20 characters");
  }
}

export class InvalidPhoneNumberIdException extends DomainException {
  constructor() {
    super("Phone Number ID must be numeric");
  }
}

export class InvalidBusinessAccountIdException extends DomainException {
  constructor() {
    super("Business Account ID must be numeric");
  }
}

// Configuration
export class WhatsAppNotConfiguredException extends DomainException {
  constructor(businessId: string) {
    super(`WhatsApp is not configured for business ${businessId}`);
  }
}

export class WhatsAppAlreadyActiveException extends DomainException {
  constructor(businessId: string) {
    super(`WhatsApp is already active for business ${businessId}`);
  }
}

// Webhook
export class InvalidWebhookTokenException extends DomainException {
  constructor() {
    super("Webhook token must be at least 32 characters");
  }
}

export class InvalidWebhookSignatureException extends DomainException {
  constructor() {
    super("Webhook signature validation failed");
  }
}

// Bot Configuration
export class InvalidWelcomeMessageException extends DomainException {
  constructor() {
    super("Welcome message must be at least 10 characters");
  }
}

export class WelcomeMessageTooLongException extends DomainException {
  constructor() {
    super("Welcome message cannot exceed 500 characters");
  }
}
```

### Error Handling Strategy

1. **Validation Errors:** Throw domain exceptions immediately
2. **External API Errors:** Retry with exponential backoff (handled in Conversation BC)
3. **Encryption Errors:** Log and throw, never expose raw credentials
4. **Webhook Validation Errors:** Return HTTP 401/403/404 without exposing details

## Testing Strategy

### Unit Tests

**Aggregates:**

- `Business.configureWhatsApp()` - validates credentials, generates token
- `Business.activateWhatsApp()` - changes state to active
- `Business.regenerateWebhookToken()` - generates new token, invalidates old
- `Business.validateWebhookSignature()` - validates HMAC signatures
- `Business.configureBotSettings()` - stores bot configuration

**Value Objects:**

- `WhatsAppCredentials` - validation, masking, equality
- `EncryptedCredentials` - encryption/decryption round-trip
- `WebhookToken` - generation, signature validation
- `BotConfiguration` - validation, default values, schedule checking
- `WhatsAppConfiguration` - immutability, state transitions

### Property-Based Tests

**Property 1: Encryption Round-Trip**

```typescript
test.prop([
  fc.string({ minLength: 20 }),
  fc.string({ minLength: 10 }),
  fc.string({ minLength: 10 }),
])(
  "encrypting then decrypting credentials returns same values",
  (apiKey, phoneId, accountId) => {
    const credentials = WhatsAppCredentials.create(apiKey, phoneId, accountId);
    const encrypted = EncryptedCredentials.encrypt(credentials);
    const decrypted = encrypted.decrypt();

    expect(decrypted.getApiKey()).toBe(credentials.getApiKey());
    expect(decrypted.getPhoneNumberId()).toBe(credentials.getPhoneNumberId());
    expect(decrypted.getBusinessAccountId()).toBe(
      credentials.getBusinessAccountId(),
    );
  },
);
```

**Property 2: Invalid Credentials Rejection**

```typescript
test.prop([fc.string({ maxLength: 19 })])(
  "short API keys should be rejected",
  (shortApiKey) => {
    expect(() => WhatsAppCredentials.create(shortApiKey, "123", "456")).toThrow(
      InvalidApiKeyException,
    );
  },
);
```

**Property 6: Signature Validation**

```typescript
test.prop([fc.string(), fc.string()])(
  "valid signature should pass validation",
  (payload, tokenValue) => {
    const token = WebhookToken.fromString(tokenValue.padEnd(32, "0"));
    const signature = crypto
      .createHmac("sha256", tokenValue.padEnd(32, "0"))
      .update(payload)
      .digest("hex");

    expect(token.validateSignature(signature, payload)).toBe(true);
  },
);
```

### Integration Tests

**Command Handlers:**

- `ConfigureWhatsAppHandler` - end-to-end configuration flow
- `ActivateWhatsAppHandler` - activation with validation
- `RegenerateWebhookTokenHandler` - token regeneration
- `ConfigureBotSettingsHandler` - bot configuration

**Webhook Controller:**

- Signature validation with valid/invalid signatures
- Business ID extraction from URL
- Error responses (401, 403, 404)

### E2E Tests

**Complete Flow:**

1. Business owner configures WhatsApp credentials
2. System generates webhook URL and token
3. Webhook is received and validated
4. Message is processed using business-specific credentials
5. Bot responds using business-specific configuration

**Multi-Tenant Isolation:**

1. Create two businesses with different configurations
2. Send webhooks to each
3. Verify each uses its own credentials and configuration
4. Verify one business cannot access other's data

## Commands and Queries

### Commands

#### ConfigureWhatsAppCommand

```typescript
export class ConfigureWhatsAppCommand extends Command<void> {
  constructor(
    public readonly businessId: string,
    public readonly apiKey: string,
    public readonly phoneNumberId: string,
    public readonly businessAccountId: string,
  ) {
    super();
  }
}
```

**Handler:**

```typescript
@CommandHandler(ConfigureWhatsAppCommand)
export class ConfigureWhatsAppHandler implements ICommandHandler<ConfigureWhatsAppCommand> {
  constructor(
    @Inject("IBusinessFactory")
    private readonly factory: IBusinessFactory,
    @Inject("IBusinessWriteRepository")
    private readonly writeRepo: IBusinessWriteRepository,
  ) {}

  async execute(command: ConfigureWhatsAppCommand): Promise<void> {
    const business = await this.factory.loadById(command.businessId);

    if (!business) {
      throw new BusinessNotFoundException(command.businessId);
    }

    const credentials = WhatsAppCredentials.create(
      command.apiKey,
      command.phoneNumberId,
      command.businessAccountId,
    );

    const phoneNumberId = PhoneNumberId.fromString(command.phoneNumberId);

    business.configureWhatsApp(credentials, phoneNumberId);

    await this.writeRepo.save(business);
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

#### ConfigureBotSettingsCommand

```typescript
export class ConfigureBotSettingsCommand extends Command<void> {
  constructor(
    public readonly businessId: string,
    public readonly welcomeMessage: string,
    public readonly language: string,
    public readonly buttonLabels: {
      newAppointment: string;
      modifyAppointment: string;
      cancelAppointment: string;
      contactAdmin: string;
    },
    public readonly autoReplySchedule: Record<
      string,
      { start: string; end: string }
    > | null,
  ) {
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
  maskedApiKey: string; // Only last 4 characters
  webhookUrl: string;
  webhookToken: string; // Only shown once after configuration
  isActive: boolean;
  configuredAt: Date;
}
```

#### GetBotConfigurationQuery

```typescript
export class GetBotConfigurationQuery extends Query<BotConfigurationReadModel> {
  constructor(public readonly businessId: string) {
    super();
  }
}
```

**Read Model:**

```typescript
export interface BotConfigurationReadModel {
  businessId: string;
  welcomeMessage: string;
  language: string;
  buttonLabels: {
    newAppointment: string;
    modifyAppointment: string;
    cancelAppointment: string;
    contactAdmin: string;
  };
  autoReplySchedule: Record<string, { start: string; end: string }> | null;
}
```

## Domain Events

```typescript
export class WhatsAppConfigured {
  constructor(
    public readonly businessId: string,
    public readonly phoneNumberId: string,
    public readonly webhookToken: string,
    public readonly occurredAt: Date = new Date(),
  ) {}
}

export class WhatsAppActivated {
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

export class BotConfigured {
  constructor(
    public readonly businessId: string,
    public readonly language: string,
    public readonly occurredAt: Date = new Date(),
  ) {}
}
```

## Integration with Conversation BC

### WhatsApp Client Factory

The Conversation BC needs to use business-specific credentials when sending messages. This is achieved through a factory pattern:

```typescript
// In Conversation BC
export interface IWhatsAppClientFactory {
  createClient(businessId: string): Promise<IWhatsAppClient>;
}

@Injectable()
export class WhatsAppClientFactory implements IWhatsAppClientFactory {
  constructor(
    @Inject("IBusinessReadRepository")
    private readonly businessRepo: IBusinessReadRepository,
  ) {}

  async createClient(businessId: string): Promise<IWhatsAppClient> {
    const business = await this.businessRepo.findById(businessId);

    if (!business || !business.whatsappConfig) {
      throw new WhatsAppNotConfiguredException(businessId);
    }

    const credentials = business.whatsappConfig.credentials.decrypt();

    return new WhatsAppBusinessApiClient(
      credentials.getApiKey(),
      credentials.getPhoneNumberId(),
    );
  }
}
```

### Webhook Controller

```typescript
@Controller("webhooks/whatsapp")
export class WhatsAppWebhookController {
  constructor(
    private readonly commandBus: CommandBus,
    @Inject("IBusinessFactory")
    private readonly businessFactory: IBusinessFactory,
  ) {}

  @Post(":businessId")
  async handleWebhook(
    @Param("businessId") businessId: string,
    @Headers("x-hub-signature-256") signature: string,
    @Body() payload: any,
  ): Promise<void> {
    // 1. Load business
    const business = await this.businessFactory.loadById(businessId);

    if (!business) {
      throw new NotFoundException("Business not found");
    }

    if (!business.isWhatsAppActive()) {
      throw new ForbiddenException("WhatsApp not configured");
    }

    // 2. Validate signature
    const payloadString = JSON.stringify(payload);
    const isValid = business.validateWebhookSignature(signature, payloadString);

    if (!isValid) {
      throw new UnauthorizedException("Invalid webhook signature");
    }

    // 3. Process message
    await this.commandBus.execute(
      new ProcessIncomingMessageCommand(businessId, payload),
    );
  }

  @Get(":businessId")
  async verifyWebhook(
    @Param("businessId") businessId: string,
    @Query("hub.mode") mode: string,
    @Query("hub.verify_token") verifyToken: string,
    @Query("hub.challenge") challenge: string,
  ): Promise<string> {
    // WhatsApp webhook verification
    const business = await this.businessFactory.loadById(businessId);

    if (!business) {
      throw new NotFoundException("Business not found");
    }

    const webhookToken = business.getWhatsAppCredentials().getWebhookToken();

    if (mode === "subscribe" && verifyToken === webhookToken.getValue()) {
      return challenge;
    }

    throw new UnauthorizedException("Invalid verify token");
  }
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
- Rotate key periodically (requires re-encryption of all credentials)

**IV (Initialization Vector):**

- Random 16 bytes generated per encryption
- Stored alongside encrypted data
- Ensures same plaintext produces different ciphertext

### Webhook Security

**Signature Validation:**

- HMAC-SHA256 with webhook token as secret
- Timing-safe comparison to prevent timing attacks
- Signature format: `sha256=<hex_digest>`

**Token Requirements:**

- Minimum 32 characters (256 bits)
- Cryptographically random
- Unique per business
- Regenerable without affecting other businesses

### API Key Masking

**Display Rules:**

- Never show full API key in responses
- Only show last 4 characters: `****abcd`
- Log masked version only
- Never log full credentials

### Rate Limiting

**Per Business:**

- Webhook endpoint: 100 requests/minute
- Configuration endpoint: 10 requests/minute
- Test configuration: 5 requests/hour

## Migration Strategy

### Phase 1: Schema Changes

```sql
-- Add new columns
ALTER TABLE businesses ADD COLUMN whatsapp_config JSONB;
ALTER TABLE businesses ADD COLUMN bot_config JSONB;

-- Create indexes
CREATE INDEX idx_businesses_whatsapp_active
  ON businesses ((whatsapp_config->>'isActive'));
```

### Phase 2: Data Migration

```typescript
@Injectable()
export class MigrateWhatsAppConfigurationService {
  async migrate(): Promise<MigrationReport> {
    const businesses = await this.businessRepo.findAll();
    const report = new MigrationReport();

    for (const business of businesses) {
      try {
        // Get global credentials from env
        const globalCredentials = WhatsAppCredentials.create(
          process.env.GLOBAL_WHATSAPP_API_KEY!,
          process.env.GLOBAL_WHATSAPP_PHONE_ID!,
          process.env.GLOBAL_WHATSAPP_ACCOUNT_ID!,
        );

        // Configure for each business
        business.configureWhatsApp(
          globalCredentials,
          PhoneNumberId.fromString(process.env.GLOBAL_WHATSAPP_PHONE_ID!),
        );

        // Activate immediately
        business.activateWhatsApp();

        // Set default bot config
        business.configureBotSettings(
          "¡Hola! 👋 Bienvenido a nuestro servicio",
          Language.spanish(),
          ButtonLabels.default(),
          null,
        );

        await this.businessRepo.save(business);
        report.addSuccess(business.getId().getValue());
      } catch (error) {
        report.addFailure(business.getId().getValue(), error.message);
      }
    }

    return report;
  }
}
```

### Phase 3: Webhook URL Update

**Manual Steps for Each Business:**

1. Get new webhook URL from system: `/webhooks/whatsapp/{businessId}`
2. Update webhook URL in Meta Developer Console
3. Update verify token in Meta Developer Console
4. Test webhook with "Test" button in Meta Console
5. System marks configuration as active

### Phase 4: Deprecate Global Configuration

```typescript
// Remove global env vars after all businesses migrated
// GLOBAL_WHATSAPP_API_KEY (deprecated)
// GLOBAL_WHATSAPP_PHONE_ID (deprecated)
// GLOBAL_WHATSAPP_ACCOUNT_ID (deprecated)

// Keep only encryption key
// ENCRYPTION_KEY (required)
```

## Frontend Integration

### Configuration Page

**URL:** `/settings/whatsapp`

**Sections:**

1. **Credentials Configuration**
   - API Key input (password field)
   - Phone Number ID input
   - Business Account ID input
   - "Save & Test" button

2. **Webhook Information**
   - Display webhook URL (read-only, copyable)
   - Display webhook token (show once, then masked)
   - "Regenerate Token" button
   - Instructions link to Meta Developer Console

3. **Bot Configuration**
   - Welcome message textarea (10-500 chars)
   - Language selector (Spanish/English)
   - Button labels customization
   - Auto-reply schedule (optional)
   - Preview panel

4. **Status & Testing**
   - Connection status indicator
   - "Test Configuration" button
   - Recent webhook activity log
   - Error messages if any

### API Endpoints

```typescript
// Configuration
POST   /api/business/:id/whatsapp/configure
POST   /api/business/:id/whatsapp/activate
POST   /api/business/:id/whatsapp/test
POST   /api/business/:id/whatsapp/regenerate-token
GET    /api/business/:id/whatsapp/configuration

// Bot Settings
POST   /api/business/:id/bot/configure
GET    /api/business/:id/bot/configuration

// Webhooks (public, no auth)
POST   /webhooks/whatsapp/:businessId
GET    /webhooks/whatsapp/:businessId (verification)
```

## Implementation Checklist

- [ ] Create Value Objects (WhatsAppCredentials, EncryptedCredentials, WebhookToken, BotConfiguration)
- [ ] Extend Business aggregate with WhatsApp methods
- [ ] Create domain exceptions
- [ ] Create domain events
- [ ] Implement encryption/decryption utilities
- [ ] Create Command Handlers
- [ ] Create Query Handlers
- [ ] Update Business repository with JSONB mapping
- [ ] Create webhook controller with signature validation
- [ ] Create WhatsAppClientFactory in Conversation BC
- [ ] Update ProcessIncomingMessageHandler to use factory
- [ ] Write unit tests for all Value Objects
- [ ] Write property-based tests
- [ ] Write integration tests for commands
- [ ] Write E2E tests for webhook flow
- [ ] Create migration script
- [ ] Update frontend configuration page
- [ ] Document Meta Developer Console setup
- [ ] Add rate limiting
- [ ] Add monitoring/alerting for webhook failures

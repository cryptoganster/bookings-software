# Requirements - WhatsApp Multi-Tenant SaaS Implementation

## 1. Executive Summary

### 1.1 Current State

- **Architecture**: Single-tenant with hardcoded WhatsApp configuration
- **Limitation**: One WhatsApp number for entire application
- **Configuration**: Environment variables in `.env` file
- **Webhook**: Fixed routing to `DEFAULT_BUSINESS_ID`

### 1.2 Target State

- **Architecture**: Multi-tenant SaaS with Embedded Signup (OAuth)
- **Capability**: Unlimited businesses, each with own WhatsApp number
- **Configuration**: Per-business credentials in encrypted database
- **Webhook**: Dynamic routing by `phone_number_id`

### 1.3 Business Value

- **Scalability**: Support unlimited businesses
- **Revenue**: N businesses × $X/month = $N×X/month
- **UX**: Automated onboarding (no manual token management)
- **Security**: Encrypted credentials, GDPR/PCI-DSS compliant
- **Competitive**: Match industry leaders (Calendly, HubSpot)

---

## 2. Functional Requirements

### FR-1: Meta Embedded Signup (OAuth Flow)

**Priority**: 🔴 Critical  
**Effort**: 2 weeks

#### FR-1.1: OAuth Configuration

**As a** system administrator  
**I want** to configure Meta Embedded Signup in Facebook Developer Console  
**So that** users can connect their WhatsApp Business accounts via OAuth

**Acceptance Criteria**:

- [ ] Meta App has "Login for Business" configured
- [ ] Redirect URI points to backend callback endpoint
- [ ] Required permissions: `whatsapp_business_messaging`, `whatsapp_business_management`
- [ ] System User Access Token generated and stored securely

#### FR-1.2: OAuth Callback Endpoint

**As a** business owner  
**I want** to authorize my WhatsApp Business account  
**So that** my customers can book via WhatsApp

**Acceptance Criteria**:

- [ ] `POST /api/auth/whatsapp/callback` endpoint exists
- [ ] Exchanges OAuth code for access_token
- [ ] Retrieves `waba_id` (WhatsApp Business Account ID)
- [ ] Retrieves `phone_number_id` and `display_phone`
- [ ] Stores credentials encrypted in database
- [ ] Returns success with phone number to frontend

#### FR-1.3: Frontend OAuth Button

**As a** business owner  
**I want** to click "Connect WhatsApp" button  
**So that** I can easily authorize my account

**Acceptance Criteria**:

- [ ] Button opens OAuth popup (600x800px)
- [ ] Popup URL includes correct `client_id`, `redirect_uri`, `config_id`
- [ ] Frontend listens for postMessage from popup
- [ ] On success, refreshes configuration UI
- [ ] On error, shows user-friendly message

---

### FR-2: WhatsApp Configuration Storage

**Priority**: 🔴 Critical  
**Effort**: 1 week

#### FR-2.1: Database Schema

**As a** system  
**I want** to store WhatsApp configurations per business  
**So that** each business has isolated credentials

**Acceptance Criteria**:

- [ ] Table `whatsapp_configurations` created with:
  - `id` (UUID, PK)
  - `business_id` (UUID, FK to businesses, UNIQUE)
  - `waba_id` (VARCHAR, WhatsApp Business Account ID)
  - `phone_number_id` (VARCHAR, UNIQUE index)
  - `display_phone` (VARCHAR, E.164 format)
  - `access_token` (TEXT, encrypted)
  - `status` (ENUM: 'connected', 'disconnected', 'pending')
  - `webhook_secret` (VARCHAR, encrypted, unique per business)
  - `created_at`, `updated_at` (TIMESTAMP)
- [ ] Index on `phone_number_id` for fast webhook routing
- [ ] Index on `business_id` for business queries

#### FR-2.2: Encryption

**As a** system  
**I want** to encrypt sensitive credentials  
**So that** tokens are never stored in plain text

**Acceptance Criteria**:

- [ ] AES-256-CBC encryption implemented
- [ ] `ENCRYPTION_KEY` (32 bytes) required in environment
- [ ] Each encryption uses random IV (16 bytes)
- [ ] IV stored alongside encrypted data
- [ ] Decryption only happens when needed (sending messages)
- [ ] Encryption utilities have 100% test coverage

---

### FR-3: Dynamic Webhook Routing

**Priority**: 🔴 Critical  
**Effort**: 1 week

#### FR-3.1: Webhook Endpoint

**As a** system  
**I want** to receive webhooks from Meta  
**So that** I can route messages to correct business

**Acceptance Criteria**:

- [ ] `POST /api/webhooks/whatsapp` endpoint exists (single endpoint for all businesses)
- [ ] Extracts `phone_number_id` from webhook payload
- [ ] Queries `whatsapp_configurations` by `phone_number_id`
- [ ] If not found, returns HTTP 404
- [ ] If found, validates signature with business-specific `webhook_secret`
- [ ] If signature invalid, returns HTTP 401
- [ ] If valid, dispatches `ProcessIncomingMessageCommand` with correct `business_id`

#### FR-3.2: Signature Validation

**As a** system  
**I want** to validate webhook signatures per business  
**So that** only authentic Meta webhooks are processed

**Acceptance Criteria**:

- [ ] Signature extracted from `x-hub-signature-256` header
- [ ] Signature format: `sha256=<hex_digest>`
- [ ] HMAC-SHA256 computed with business-specific `webhook_secret`
- [ ] Timing-safe comparison prevents timing attacks
- [ ] Invalid signatures logged for security audit
- [ ] Valid signatures allow message processing

---

### FR-4: WhatsApp Client Factory

**Priority**: 🔴 Critical  
**Effort**: 3 days

#### FR-4.1: Per-Business Client

**As a** system  
**I want** to create WhatsApp clients with business-specific credentials  
**So that** messages are sent from correct phone number

**Acceptance Criteria**:

- [ ] `IWhatsAppClientFactory` interface created
- [ ] `createClient(businessId)` method implemented
- [ ] Loads `whatsapp_configurations` by `business_id`
- [ ] Decrypts `access_token`
- [ ] Creates `WhatsAppBusinessApiClient` with decrypted token
- [ ] Throws `WhatsAppNotConfiguredException` if not configured
- [ ] Used in `ProcessIncomingMessageHandler`
- [ ] Used in `SendWhatsAppMessageHandler`

---

### FR-5: Configuration UI

**Priority**: 🟡 High  
**Effort**: 1 week

#### FR-5.1: Settings Page

**As a** business owner  
**I want** to see my WhatsApp configuration status  
**So that** I know if my bot is working

**Acceptance Criteria**:

- [ ] Page at `/settings/whatsapp` exists
- [ ] Shows connection status (connected/disconnected/pending)
- [ ] Shows connected phone number (if connected)
- [ ] Shows "Connect WhatsApp" button (if not connected)
- [ ] Shows "Disconnect WhatsApp" button (if connected)
- [ ] Shows webhook URL (read-only, copyable)
- [ ] Shows last connection date

#### FR-5.2: Connection Flow

**As a** business owner  
**I want** to connect my WhatsApp in 3 clicks  
**So that** onboarding is fast and easy

**Acceptance Criteria**:

- [ ] Click "Connect WhatsApp" → OAuth popup opens
- [ ] Authorize in Facebook → Popup closes automatically
- [ ] UI refreshes → Shows "Connected" status
- [ ] Total time: < 2 minutes
- [ ] No manual token copying required

---

### FR-6: Migration from Single-Tenant

**Priority**: 🟡 High  
**Effort**: 3 days

#### FR-6.1: Migration Script

**As a** system administrator  
**I want** to migrate existing configuration to new schema  
**So that** current setup continues working

**Acceptance Criteria**:

- [ ] Migration script reads current `.env` variables
- [ ] Creates `whatsapp_configurations` entry for existing business
- [ ] Encrypts current `WHATSAPP_ACCESS_TOKEN`
- [ ] Sets `status` to 'connected'
- [ ] Generates unique `webhook_secret`
- [ ] Dry-run mode available for testing
- [ ] Rollback capability if migration fails
- [ ] Migration report generated (success/failures)

---

## 3. Non-Functional Requirements

### NFR-1: Security

#### NFR-1.1: Encryption

- [ ] All `access_token` values encrypted with AES-256-CBC
- [ ] All `webhook_secret` values encrypted
- [ ] `ENCRYPTION_KEY` never committed to repository
- [ ] Key rotation documented (requires re-encryption)

#### NFR-1.2: Webhook Security

- [ ] HMAC-SHA256 signature validation
- [ ] Timing-safe comparison
- [ ] Rate limiting: 100 requests/minute per business
- [ ] Failed attempts logged for audit

#### NFR-1.3: OAuth Security

- [ ] HTTPS required for redirect URI
- [ ] State parameter prevents CSRF
- [ ] Tokens never exposed in frontend
- [ ] System User Access Token stored securely

### NFR-2: Performance

#### NFR-2.1: Webhook Processing

- [ ] Webhook routing: < 100ms (p95)
- [ ] Database lookup by `phone_number_id`: < 50ms
- [ ] Signature validation: < 10ms
- [ ] Total webhook processing: < 500ms (p95)

#### NFR-2.2: OAuth Flow

- [ ] Token exchange: < 2 seconds
- [ ] WABA retrieval: < 1 second
- [ ] Database save: < 500ms
- [ ] Total OAuth flow: < 5 seconds

### NFR-3: Scalability

#### NFR-3.1: Database

- [ ] Index on `phone_number_id` for O(log n) lookup
- [ ] Index on `business_id` for business queries
- [ ] JSONB columns for flexible configuration
- [ ] Supports 10,000+ businesses

#### NFR-3.2: Webhook

- [ ] Single webhook endpoint scales horizontally
- [ ] No per-business webhook URLs in Meta
- [ ] Connection pooling for database queries
- [ ] Async message processing

### NFR-4: Reliability

#### NFR-4.1: Error Handling

- [ ] OAuth failures: User-friendly error messages
- [ ] Webhook failures: Retry with exponential backoff
- [ ] Encryption failures: Logged, never exposed
- [ ] Database failures: Circuit breaker pattern

#### NFR-4.2: Monitoring

- [ ] Webhook success/failure rate per business
- [ ] OAuth connection success rate
- [ ] Encryption/decryption errors
- [ ] Database query performance

---

## 4. Technical Constraints

### TC-1: Meta Platform

- [ ] Must use Meta Embedded Signup (official OAuth)
- [ ] Must use WhatsApp Business API v22.0+
- [ ] Must validate webhooks with HMAC-SHA256
- [ ] Must handle rate limits (80 messages/second/phone)

### TC-2: Database

- [ ] PostgreSQL 14+
- [ ] JSONB support for flexible configuration
- [ ] Encryption at rest (database level)
- [ ] Backup strategy for encrypted data

### TC-3: Backend

- [ ] NestJS 10+
- [ ] TypeScript 5+
- [ ] CQRS pattern maintained
- [ ] DDD principles maintained

---

## 5. Out of Scope (Future Phases)

### Phase 2 (Post-MVP)

- [ ] Automatic webhook configuration via API
- [ ] Multi-phone support per business
- [ ] WhatsApp Business Profile management
- [ ] Message template management
- [ ] Analytics dashboard per business

### Phase 3 (Advanced)

- [ ] Webhook retry queue
- [ ] Message delivery status tracking
- [ ] A/B testing for bot messages
- [ ] Multi-language bot configuration
- [ ] Advanced scheduling (business hours, holidays)

---

## 6. Success Criteria

### Technical

- [ ] 100% of webhooks routed to correct business
- [ ] 0 signature validation errors (false positives)
- [ ] < 500ms webhook processing latency (p95)
- [ ] 100% test coverage on encryption utilities
- [ ] 0 plain-text credentials in database

### Business

- [ ] 10+ businesses connected in first month
- [ ] < 5% OAuth connection failure rate
- [ ] > 90% user satisfaction (onboarding ease)
- [ ] 0 security incidents
- [ ] < 2 minutes average onboarding time

---

## 7. Dependencies

### External

- [ ] Meta Developer Account with app created
- [ ] Facebook Business Manager account
- [ ] System User Access Token generated
- [ ] Webhook verify token configured

### Internal

- [ ] `ENCRYPTION_KEY` generated and stored securely
- [ ] Database migration executed
- [ ] Frontend deployed with OAuth button
- [ ] Backend deployed with callback endpoint

---

## 8. Risks & Mitigations

| Risk                   | Impact   | Probability | Mitigation                         |
| ---------------------- | -------- | ----------- | ---------------------------------- |
| OAuth flow complexity  | High     | Medium      | Use Meta SDK, extensive testing    |
| Encryption key loss    | Critical | Low         | Backup strategy, key rotation docs |
| Webhook routing errors | High     | Medium      | Comprehensive integration tests    |
| Migration data loss    | Critical | Low         | Dry-run, rollback capability       |
| Rate limiting by Meta  | Medium   | Medium      | Implement queue, retry logic       |

---

## 9. Acceptance Criteria Summary

### Must Have (MVP)

- [x] Meta Embedded Signup configured
- [x] OAuth callback endpoint working
- [x] Database schema created
- [x] Encryption implemented
- [x] Webhook routing by `phone_number_id`
- [x] Signature validation per business
- [x] WhatsApp Client Factory
- [x] Frontend "Connect WhatsApp" button
- [x] Migration script tested

### Should Have (Post-MVP)

- [ ] Automatic webhook configuration
- [ ] Connection status monitoring
- [ ] Webhook retry queue
- [ ] Advanced bot configuration UI

### Could Have (Future)

- [ ] Multi-phone support
- [ ] Message templates
- [ ] Analytics dashboard
- [ ] A/B testing

---

**Document Version**: 1.0  
**Last Updated**: December 18, 2024  
**Status**: Ready for Implementation

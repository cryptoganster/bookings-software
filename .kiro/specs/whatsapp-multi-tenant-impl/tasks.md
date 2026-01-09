# Implementation Tasks - WhatsApp Multi-Tenant with OAuth

## Overview

Implementation plan for WhatsApp multi-tenant configuration using **Meta Embedded Signup (OAuth)**. This replaces manual credential configuration with industry-standard OAuth flow.

**Estimated Effort:** 5 weeks (1 developer)  
**Approach:** Incremental implementation with testing at each phase

---

## Phase 1: Database & Domain Foundation (Week 1)

### Task 1.1: Create Database Schema

**Files:**

- `apps/backend/src/database/migrations/YYYYMMDDHHMMSS-create-whatsapp-configurations.ts`

**Acceptance Criteria:**

- [ ] Create `whatsapp_configurations` table with all fields
- [ ] Add foreign key to `businesses(id)` with CASCADE delete
- [ ] Create indexes on `phone_number_id`, `business_id`, `status`
- [ ] Add check constraint for status enum
- [ ] Migration runs successfully up and down

**SQL:**

```sql
CREATE TABLE whatsapp_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL UNIQUE REFERENCES businesses(id) ON DELETE CASCADE,
  waba_id VARCHAR(255) NOT NULL,
  phone_number_id VARCHAR(255) NOT NULL UNIQUE,
  display_phone VARCHAR(50) NOT NULL,
  encrypted_access_token TEXT NOT NULL,
  encryption_iv VARCHAR(32) NOT NULL,
  webhook_token VARCHAR(64) NOT NULL UNIQUE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  connected_at TIMESTAMP,
  last_webhook_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  version INT NOT NULL DEFAULT 0,
  CONSTRAINT chk_status CHECK (status IN ('pending', 'active', 'suspended', 'error'))
);

CREATE INDEX idx_whatsapp_config_phone_number_id ON whatsapp_configurations(phone_number_id);
CREATE INDEX idx_whatsapp_config_business_id ON whatsapp_configurations(business_id);
CREATE INDEX idx_whatsapp_config_status ON whatsapp_configurations(status);
```

---

### Task 1.2: Create Value Objects

**Files:**

- `apps/backend/src/business/domain/vo/encrypted-access-token.vo.ts`
- `apps/backend/src/business/domain/vo/webhook-token.vo.ts`
- `apps/backend/src/business/domain/vo/phone-number-id.vo.ts`
- `apps/backend/src/business/domain/vo/whatsapp-status.vo.ts`

**Acceptance Criteria:**

- [ ] EncryptedAccessToken: encrypt() and decrypt() methods with AES-256-CBC
- [ ] WebhookToken: generate() and validateSignature() methods with HMAC-SHA256
- [ ] PhoneNumberId: validation for numeric-only format
- [ ] WhatsAppStatus: pending(), active(), suspended(), error() factory methods
- [ ] All VOs extend ValueObject base class
- [ ] All VOs implement getEqualityComponents()

---

### Task 1.3: Create Domain Exceptions

**Files:**

- `apps/backend/src/business/domain/exceptions/whatsapp-not-configured.exception.ts`
- `apps/backend/src/business/domain/exceptions/whatsapp-already-active.exception.ts`
- `apps/backend/src/business/domain/exceptions/whatsapp-not-active.exception.ts`
- `apps/backend/src/business/domain/exceptions/invalid-webhook-token.exception.ts`
- `apps/backend/src/business/domain/exceptions/invalid-phone-number-id.exception.ts`
- `apps/backend/src/business/domain/exceptions/invalid-whatsapp-status.exception.ts`

**Acceptance Criteria:**

- [ ] All exceptions extend DomainException
- [ ] Descriptive error messages with context (businessId, etc.)

---

### Task 1.4: Create WhatsAppConfiguration Aggregate

**Files:**

- `apps/backend/src/business/domain/aggregates/whatsapp-configuration.ts`

**Acceptance Criteria:**

- [ ] Extends VersionedAggregateRoot
- [ ] Factory method: createFromOAuth()
- [ ] Business methods: activate(), suspend(), regenerateWebhookToken()
- [ ] Validation methods: validateWebhookSignature(), isActive()
- [ ] Utility methods: recordWebhookReceived(), getDecryptedAccessToken()
- [ ] Persistence method: fromPersistence()
- [ ] Applies domain events on state changes
- [ ] Increments version on mutations

---

### Task 1.5: Create Domain Events

**Files:**

- `apps/backend/src/business/domain/events/whatsapp-connected.event.ts`
- `apps/backend/src/business/domain/events/whatsapp-activated.event.ts`
- `apps/backend/src/business/domain/events/whatsapp-suspended.event.ts`
- `apps/backend/src/business/domain/events/webhook-token-regenerated.event.ts`

**Acceptance Criteria:**

- [ ] All events are POJOs with readonly properties
- [ ] Include businessId, timestamp, and relevant data
- [ ] No business logic in events

---

### Task 1.6: Write Unit Tests for Value Objects

**Files:**

- `apps/backend/src/business/domain/vo/__tests__/encrypted-access-token.vo.spec.ts`
- `apps/backend/src/business/domain/vo/__tests__/webhook-token.vo.spec.ts`
- `apps/backend/src/business/domain/vo/__tests__/phone-number-id.vo.spec.ts`
- `apps/backend/src/business/domain/vo/__tests__/whatsapp-status.vo.spec.ts`

**Acceptance Criteria:**

- [ ] Test encryption/decryption round-trip
- [ ] Test signature validation (valid and invalid)
- [ ] Test phone number ID validation (valid and invalid)
- [ ] Test status transitions
- [ ] Test equality comparison
- [ ] All tests pass

---

### Task 1.7: Write Unit Tests for WhatsAppConfiguration Aggregate

**Files:**

- `apps/backend/src/business/domain/aggregates/__tests__/whatsapp-configuration.spec.ts`

**Acceptance Criteria:**

- [ ] Test createFromOAuth() creates valid configuration
- [ ] Test activate() changes status to active
- [ ] Test suspend() changes status to suspended
- [ ] Test regenerateWebhookToken() creates new token
- [ ] Test validateWebhookSignature() with valid/invalid signatures
- [ ] Test exceptions thrown for invalid state transitions
- [ ] Test domain events are applied
- [ ] Test version increments on mutations
- [ ] All tests pass

---

## Phase 2: Persistence & Repositories (Week 2)

### Task 2.1: Create TypeORM Model

**Files:**

- `apps/backend/src/business/infra/persistence/models/whatsapp-configuration.model.ts`

**Acceptance Criteria:**

- [ ] Entity decorator with table name
- [ ] All columns mapped with correct types
- [ ] Foreign key to BusinessModel
- [ ] Indexes defined
- [ ] Version column for optimistic locking

---

### Task 2.2: Create Mappers

**Files:**

- `apps/backend/src/business/infra/persistence/mappers/whatsapp-configuration-write.mapper.ts`
- `apps/backend/src/business/infra/persistence/mappers/whatsapp-configuration-read.mapper.ts`

**Acceptance Criteria:**

- [ ] WriteMapper: toModel() converts aggregate to TypeORM model
- [ ] ReadMapper: toReadModel() converts model to DTO
- [ ] Handles Value Objects correctly
- [ ] Handles null values
- [ ] No business logic in mappers

---

### Task 2.3: Create Factory

**Files:**

- `apps/backend/src/business/domain/interfaces/factories/whatsapp-configuration-factory.ts` (interface)
- `apps/backend/src/business/infra/persistence/factories/whatsapp-configuration.factory.ts` (implementation)

**Acceptance Criteria:**

- [ ] Interface: loadById(id), loadByBusinessId(businessId), loadByPhoneNumberId(phoneNumberId)
- [ ] Implementation uses TypeORM repository
- [ ] Returns aggregate with business logic
- [ ] Preserves version for optimistic locking
- [ ] Returns null if not found

---

### Task 2.4: Create Repositories

**Files:**

- `apps/backend/src/business/domain/interfaces/repositories/whatsapp-configuration-write.repository.interface.ts`
- `apps/backend/src/business/domain/interfaces/repositories/whatsapp-configuration-read.repository.interface.ts`
- `apps/backend/src/business/infra/persistence/repositories/whatsapp-configuration-write.repository.ts`
- `apps/backend/src/business/infra/persistence/repositories/whatsapp-configuration-read.repository.ts`

**Acceptance Criteria:**

- [ ] Write repository: save() with optimistic locking
- [ ] Write repository: delete()
- [ ] Read repository: findById(), findByBusinessId(), findByPhoneNumberId()
- [ ] Read repository returns DTOs, not aggregates
- [ ] Optimistic locking throws ConcurrencyException on version mismatch

---

### Task 2.5: Write Integration Tests for Repositories

**Files:**

- `apps/backend/src/business/infra/persistence/repositories/__tests__/whatsapp-configuration-write.repository.integration.spec.ts`
- `apps/backend/src/business/infra/persistence/repositories/__tests__/whatsapp-configuration-read.repository.integration.spec.ts`

**Acceptance Criteria:**

- [ ] Test save() persists aggregate correctly
- [ ] Test save() with version conflict throws ConcurrencyException
- [ ] Test delete() removes configuration
- [ ] Test findByPhoneNumberId() returns correct configuration
- [ ] Test findByBusinessId() returns correct configuration
- [ ] Test queries return null when not found
- [ ] All tests pass with real database (test container)

---

## Phase 3: OAuth Flow (Week 3)

### Task 3.1: Create OAuth Controller

**Files:**

- `apps/backend/src/business/presentation/controllers/whatsapp-oauth.controller.ts`

**Acceptance Criteria:**

- [ ] GET /api/oauth/whatsapp/callback endpoint
- [ ] Extracts code and state (businessId) from query params
- [ ] Exchanges code for access_token with Meta API
- [ ] Retrieves waba_id and phone_number_id from Meta API
- [ ] Dispatches ConnectWhatsAppCommand
- [ ] Redirects to success/error page
- [ ] Handles errors gracefully

---

### Task 3.2: Create ConnectWhatsAppCommand and Handler

**Files:**

- `apps/backend/src/business/app/commands/connect-whatsapp/command.ts`
- `apps/backend/src/business/app/commands/connect-whatsapp/handler.ts`

**Acceptance Criteria:**

- [ ] Command: businessId, wabaId, phoneNumberId, displayPhone, accessToken
- [ ] Handler creates WhatsAppConfiguration aggregate
- [ ] Handler saves aggregate via write repository
- [ ] Handler returns configId
- [ ] Handler validates business exists
- [ ] Handler throws exception if already configured

---

### Task 3.3: Create ActivateWhatsAppCommand and Handler

**Files:**

- `apps/backend/src/business/app/commands/activate-whatsapp/command.ts`
- `apps/backend/src/business/app/commands/activate-whatsapp/handler.ts`

**Acceptance Criteria:**

- [ ] Command: businessId
- [ ] Handler loads configuration via factory
- [ ] Handler calls activate() on aggregate
- [ ] Handler saves aggregate
- [ ] Handler throws exception if not configured

---

### Task 3.4: Create RegenerateWebhookTokenCommand and Handler

**Files:**

- `apps/backend/src/business/app/commands/regenerate-webhook-token/command.ts`
- `apps/backend/src/business/app/commands/regenerate-webhook-token/handler.ts`

**Acceptance Criteria:**

- [ ] Command: businessId
- [ ] Handler loads configuration via factory
- [ ] Handler calls regenerateWebhookToken() on aggregate
- [ ] Handler saves aggregate
- [ ] Handler returns new token
- [ ] Handler throws exception if not configured

---

### Task 3.5: Write Integration Tests for Command Handlers

**Files:**

- `apps/backend/src/business/app/commands/connect-whatsapp/__tests__/handler.integration.spec.ts`
- `apps/backend/src/business/app/commands/activate-whatsapp/__tests__/handler.integration.spec.ts`
- `apps/backend/src/business/app/commands/regenerate-webhook-token/__tests__/handler.integration.spec.ts`

**Acceptance Criteria:**

- [ ] Test ConnectWhatsAppHandler creates configuration
- [ ] Test ActivateWhatsAppHandler activates configuration
- [ ] Test RegenerateWebhookTokenHandler generates new token
- [ ] Test handlers throw exceptions for invalid states
- [ ] All tests pass with real database

---

### Task 3.6: Create Query Handlers

**Files:**

- `apps/backend/src/business/app/queries/get-whatsapp-configuration/query.ts`
- `apps/backend/src/business/app/queries/get-whatsapp-configuration/handler.ts`
- `apps/backend/src/business/app/queries/get-whatsapp-configuration/read-model.ts`

**Acceptance Criteria:**

- [ ] Query: businessId
- [ ] Handler uses read repository
- [ ] Read model includes: businessId, phoneNumberId, displayPhone, status, connectedAt, lastWebhookAt, webhookUrl
- [ ] Read model NEVER includes access_token
- [ ] Handler throws exception if not found

---

### Task 3.7: Write Integration Tests for Query Handlers

**Files:**

- `apps/backend/src/business/app/queries/get-whatsapp-configuration/__tests__/handler.integration.spec.ts`

**Acceptance Criteria:**

- [ ] Test handler returns correct read model
- [ ] Test handler throws exception if not found
- [ ] Test read model does not expose access_token
- [ ] All tests pass

---

## Phase 4: Webhook Routing (Week 4)

### Task 4.1: Update Webhook Controller

**Files:**

- `apps/backend/src/conversation/presentation/controllers/webhook.ts`

**Changes:**

- [ ] Remove hardcoded `DEFAULT_BUSINESS_ID`
- [ ] Extract `phone_number_id` from webhook payload
- [ ] Load WhatsAppConfiguration by phone_number_id
- [ ] Validate webhook signature using configuration
- [ ] Record webhook received
- [ ] Dispatch ProcessIncomingMessageCommand with correct businessId

**Acceptance Criteria:**

- [ ] Webhook routes dynamically by phone_number_id
- [ ] Returns 404 if configuration not found
- [ ] Returns 403 if configuration not active
- [ ] Returns 401 if signature invalid
- [ ] Returns 200 if valid and processes message

---

### Task 4.2: Create WhatsAppClientFactory

**Files:**

- `apps/backend/src/conversation/domain/interfaces/external/whatsapp-client-factory.ts` (interface)
- `apps/backend/src/conversation/infra/external/whatsapp-client.factory.ts` (implementation)

**Acceptance Criteria:**

- [ ] Interface: createClient(businessId): Promise<IWhatsAppClient>
- [ ] Implementation loads WhatsAppConfiguration by businessId
- [ ] Implementation decrypts access_token
- [ ] Implementation creates WhatsAppBusinessApiClient with business-specific credentials
- [ ] Throws exception if configuration not found or not active

---

### Task 4.3: Update Message Handlers to Use Factory

**Files:**

- `apps/backend/src/conversation/app/commands/process-incoming-message/handler.ts`
- `apps/backend/src/conversation/app/commands/send-whatsapp-message/handler.ts`

**Changes:**

- [ ] Inject IWhatsAppClientFactory instead of IWhatsAppClient
- [ ] Call factory.createClient(businessId) to get client
- [ ] Use client for sending messages

**Acceptance Criteria:**

- [ ] Handlers use business-specific credentials
- [ ] Handlers throw exception if WhatsApp not configured
- [ ] Messages sent successfully with correct credentials

---

### Task 4.4: Write Integration Tests for Webhook Routing

**Files:**

- `apps/backend/src/conversation/presentation/controllers/__tests__/webhook-multi-tenant.integration.spec.ts`

**Acceptance Criteria:**

- [ ] Test webhook routes to correct business by phone_number_id
- [ ] Test webhook returns 404 for unknown phone_number_id
- [ ] Test webhook returns 403 for inactive configuration
- [ ] Test webhook returns 401 for invalid signature
- [ ] Test webhook processes message with correct businessId
- [ ] Test multi-tenant isolation (two businesses, different configs)
- [ ] All tests pass

---

### Task 4.5: Write Integration Tests for WhatsAppClientFactory

**Files:**

- `apps/backend/src/conversation/infra/external/__tests__/whatsapp-client.factory.integration.spec.ts`

**Acceptance Criteria:**

- [ ] Test factory creates client with correct credentials
- [ ] Test factory throws exception for unconfigured business
- [ ] Test factory throws exception for inactive configuration
- [ ] Test multiple businesses use different credentials
- [ ] All tests pass

---

## Phase 5: Frontend & Migration (Week 5)

### Task 5.1: Create REST API Endpoints

**Files:**

- `apps/backend/src/business/presentation/controllers/whatsapp-configuration.controller.ts`

**Endpoints:**

- [ ] GET /api/business/:id/whatsapp/configuration
- [ ] POST /api/business/:id/whatsapp/activate
- [ ] POST /api/business/:id/whatsapp/suspend
- [ ] POST /api/business/:id/whatsapp/regenerate-token
- [ ] DELETE /api/business/:id/whatsapp/disconnect

**Acceptance Criteria:**

- [ ] All endpoints use CommandBus/QueryBus
- [ ] All endpoints have authentication guards
- [ ] All endpoints have authorization (only business owner)
- [ ] All endpoints return appropriate HTTP status codes
- [ ] All endpoints handle errors gracefully

---

### Task 5.2: Create Frontend Component

**Files:**

- `apps/frontend/src/features/business/whatsapp/ui/ConnectWhatsAppButton.tsx`
- `apps/frontend/src/features/business/whatsapp/ui/WhatsAppConfigurationPanel.tsx`

**Acceptance Criteria:**

- [ ] Button opens OAuth popup with correct URL
- [ ] Popup includes businessId as state parameter
- [ ] Panel shows connection status
- [ ] Panel shows webhook URL (read-only, copyable)
- [ ] Panel shows webhook token (masked after first view)
- [ ] Panel has "Regenerate Token" button
- [ ] Panel has "Disconnect" button
- [ ] Panel handles OAuth callback success/error

---

### Task 5.3: Create Migration Script

**Files:**

- `apps/backend/src/database/scripts/migrate-to-multi-tenant.ts`

**Acceptance Criteria:**

- [ ] Script loads all businesses
- [ ] Script creates WhatsAppConfiguration for each business using global env vars
- [ ] Script activates each configuration
- [ ] Script generates migration report (success/failure per business)
- [ ] Script has dry-run option
- [ ] Script has rollback option

---

### Task 5.4: Write E2E Tests

**Files:**

- `apps/backend/test/whatsapp-multi-tenant.e2e-spec.ts`

**Acceptance Criteria:**

- [ ] Test complete OAuth flow (mocked Meta API)
- [ ] Test webhook processing with signature validation
- [ ] Test multi-tenant isolation (two businesses, different configs)
- [ ] Test message sending with business-specific credentials
- [ ] Test configuration activation/suspension
- [ ] Test token regeneration
- [ ] All tests pass

---

### Task 5.5: Update Documentation

**Files:**

- `docs/WHATSAPP-OAUTH-SETUP.md`
- `docs/WHATSAPP-MULTI-TENANT-MIGRATION.md`

**Acceptance Criteria:**

- [ ] Document Meta Developer Console setup for OAuth
- [ ] Document OAuth flow step-by-step
- [ ] Document webhook configuration
- [ ] Document migration process
- [ ] Document rollback process
- [ ] Include screenshots
- [ ] Include troubleshooting section

---

### Task 5.6: Update Environment Variables

**Files:**

- `apps/backend/.env.example`
- `apps/backend/src/config/configuration.ts`

**Changes:**

- [ ] Remove deprecated global WhatsApp variables
- [ ] Add OAuth variables: META_APP_ID, META_APP_SECRET, SYSTEM_USER_ACCESS_TOKEN, OAUTH_REDIRECT_URI
- [ ] Add ENCRYPTION_KEY
- [ ] Document all variables

---

### Task 5.7: Final Testing & Validation

**Acceptance Criteria:**

- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] All E2E tests pass
- [ ] Migration script tested with real data
- [ ] OAuth flow tested with real Meta API (test app)
- [ ] Webhook routing tested with real WhatsApp messages
- [ ] Multi-tenant isolation verified
- [ ] Performance tested (100+ businesses)
- [ ] Security audit completed (encryption, signatures, OAuth)

---

## Rollout Plan

### Step 1: Deploy Infrastructure (Day 1)

- [ ] Deploy database migration
- [ ] Deploy new code (feature flag OFF)
- [ ] Verify deployment successful

### Step 2: Run Migration (Day 2)

- [ ] Run migration script in dry-run mode
- [ ] Review migration report
- [ ] Run migration script for real
- [ ] Verify all businesses migrated successfully

### Step 3: Enable Feature (Day 3)

- [ ] Enable feature flag
- [ ] Monitor webhook processing
- [ ] Monitor message sending
- [ ] Monitor errors/exceptions

### Step 4: Deprecate Global Config (Day 7)

- [ ] Remove global env vars from production
- [ ] Update documentation
- [ ] Announce to users

---

## Success Criteria

- [ ] All businesses can connect WhatsApp via OAuth
- [ ] Webhooks route correctly by phone_number_id
- [ ] Messages sent with business-specific credentials
- [ ] Multi-tenant isolation verified
- [ ] No hardcoded businessId in code
- [ ] All tests pass (unit, integration, E2E)
- [ ] Migration completed successfully
- [ ] Documentation complete
- [ ] Zero downtime during rollout

---

## Risks & Mitigations

| Risk                        | Mitigation                                     |
| --------------------------- | ---------------------------------------------- |
| **OAuth flow fails**        | Test with Meta test app before production      |
| **Migration fails**         | Dry-run mode, rollback script, backup database |
| **Webhook routing breaks**  | Feature flag, gradual rollout, monitoring      |
| **Encryption key lost**     | Document key backup process, test key rotation |
| **Performance degradation** | Load testing, database indexes, caching        |

---

## Notes

- All tasks must be completed in order (dependencies)
- Each phase ends with testing checkpoint
- Migration script must be tested thoroughly before production
- OAuth flow must be tested with real Meta API (test app)
- Multi-tenant isolation is critical - test extensively
- Security is paramount - encryption, signatures, OAuth

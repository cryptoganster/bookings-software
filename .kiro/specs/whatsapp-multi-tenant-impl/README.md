# WhatsApp Multi-Tenant Implementation - Consolidated Specs

## Overview

This directory contains the consolidated specifications for implementing multi-tenant WhatsApp Business API configuration using **Meta Embedded Signup (OAuth)** - the industry standard for SaaS applications.

## Documents

### 1. [requirements.md](./requirements.md)

**Purpose:** Defines what needs to be built

**Contents:**

- Executive summary (current vs target state)
- 6 functional requirements (FR-1 to FR-6)
- 4 non-functional requirements (NFR-1 to NFR-4)
- Technical constraints
- Success criteria
- Risks and mitigations

**Key Points:**

- OAuth-based WhatsApp connection (no manual credentials)
- Single webhook endpoint for all businesses
- Dynamic routing by `phone_number_id`
- AES-256-CBC encryption for access tokens
- Multi-tenant isolation

---

### 2. [design.md](./design.md)

**Purpose:** Defines how it will be built

**Contents:**

- Architecture overview (OAuth flow, webhook routing, client factory)
- Database schema (`whatsapp_configurations` table)
- Domain model (WhatsAppConfiguration aggregate, Value Objects)
- OAuth flow design (step-by-step)
- Webhook routing design (current vs target)
- WhatsApp Client Factory design (factory pattern)
- Commands and Queries (CQRS)
- Domain Events
- Security considerations (encryption, signatures, OAuth)
- Migration strategy (5 phases)
- API endpoints
- Testing strategy

**Key Components:**

- **WhatsAppConfiguration Aggregate:** Manages OAuth credentials per business
- **EncryptedAccessToken VO:** AES-256-CBC encryption
- **WebhookToken VO:** HMAC-SHA256 signature validation
- **WhatsAppClientFactory:** Creates business-specific WhatsApp clients
- **OAuth Controller:** Handles Meta callback and token exchange

---

### 3. [tasks.md](./tasks.md)

**Purpose:** Defines the implementation plan

**Contents:**

- 5 phases (weeks) with detailed tasks
- Phase 1: Database & Domain Foundation
- Phase 2: Persistence & Repositories
- Phase 3: OAuth Flow
- Phase 4: Webhook Routing
- Phase 5: Frontend & Migration
- Rollout plan (4 steps)
- Success criteria
- Risks and mitigations

**Total Tasks:** 30+ tasks with clear acceptance criteria

**Estimated Effort:** 5 weeks (1 developer)

---

## Quick Start

### For Developers

1. **Read requirements.md first** - Understand what we're building
2. **Read design.md** - Understand how we're building it
3. **Follow tasks.md** - Implement phase by phase

### For Product Owners

1. **Read requirements.md** - Understand scope and success criteria
2. **Review design.md** - Understand technical approach
3. **Track tasks.md** - Monitor progress

### For QA

1. **Read requirements.md** - Understand acceptance criteria
2. **Read design.md** - Understand testing strategy
3. **Use tasks.md** - Test each phase incrementally

---

## Key Decisions

### Why OAuth (Embedded Signup)?

**Industry Standard:**

- Used by Calendly, Twilio, SendGrid, Mailchimp
- User never sees credentials
- Automatic permission management
- Better security

**vs Manual Configuration:**

- Manual: User copies tokens from Meta Console (error-prone)
- OAuth: User clicks button, popup, done (seamless)

### Why Single Webhook URL?

**Scalability:**

- Single URL: `/webhooks/whatsapp`
- Route by `phone_number_id` in payload
- No need to update Meta Console per business

**vs Per-Business URLs:**

- Per-business: `/webhooks/whatsapp/:businessId` (requires Meta Console update per business)
- Single: Dynamic routing (no Meta Console updates)

### Why AES-256-CBC Encryption?

**Security:**

- Access tokens are sensitive
- Encrypted at rest in database
- Decrypted only when needed for API calls

**Key Management:**

- Single `ENCRYPTION_KEY` environment variable
- 32 bytes (64 hex characters)
- Rotate periodically

---

## Migration Path

### Current State (Single-Tenant)

```typescript
// ❌ Hardcoded businessId
const businessId = process.env.DEFAULT_BUSINESS_ID;

// ❌ Global credentials
const apiUrl = process.env.WHATSAPP_API_URL;
const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
```

### Target State (Multi-Tenant)

```typescript
// ✅ Dynamic routing
const phoneNumberId =
  payload.entry[0].changes[0].value.metadata.phone_number_id;
const config = await configRepo.findByPhoneNumberId(phoneNumberId);

// ✅ Business-specific credentials
const client = await clientFactory.createClient(config.businessId);
```

### Migration Steps

1. **Create infrastructure** (database, aggregates, repositories)
2. **Migrate existing data** (global credentials → per-business configurations)
3. **Update webhook controller** (dynamic routing)
4. **Update message handlers** (use factory)
5. **Deprecate global config** (remove env vars)

---

## Testing Strategy

### Unit Tests

- Value Objects (encryption, signatures, validation)
- Aggregates (state transitions, business logic)
- Domain Services

### Integration Tests

- Command/Query handlers with database
- Repositories with optimistic locking
- OAuth callback flow

### E2E Tests

- Complete OAuth flow (mocked Meta API)
- Webhook processing with signature validation
- Multi-tenant isolation (two businesses, different configs)
- Message sending with business-specific credentials

---

## Security Considerations

### Encryption

- **Algorithm:** AES-256-CBC
- **Key:** 32 bytes (64 hex characters)
- **IV:** Random 16 bytes per encryption
- **Storage:** Encrypted data + IV in database

### Webhook Signatures

- **Algorithm:** HMAC-SHA256
- **Secret:** Webhook token (32+ characters)
- **Validation:** Timing-safe comparison

### OAuth Security

- **State Parameter:** Pass businessId to prevent CSRF
- **Token Storage:** Encrypted at rest, never logged
- **Scope:** Minimal permissions (messaging only)

---

## Success Metrics

### Technical

- [ ] All tests pass (unit, integration, E2E)
- [ ] Zero hardcoded businessId in code
- [ ] Webhook routing < 100ms (p95)
- [ ] OAuth flow < 5 seconds
- [ ] Multi-tenant isolation verified

### Business

- [ ] 100% businesses migrated successfully
- [ ] Zero downtime during rollout
- [ ] < 1% error rate on webhooks
- [ ] User satisfaction > 90%

---

## Timeline

| Phase       | Duration | Deliverables                               |
| ----------- | -------- | ------------------------------------------ |
| **Phase 1** | Week 1   | Database, Domain Model, Unit Tests         |
| **Phase 2** | Week 2   | Repositories, Factories, Integration Tests |
| **Phase 3** | Week 3   | OAuth Flow, Command Handlers               |
| **Phase 4** | Week 4   | Webhook Routing, Client Factory            |
| **Phase 5** | Week 5   | Frontend, Migration, E2E Tests             |

**Total:** 5 weeks (1 developer)

---

## Next Steps

1. **Review specs with team** - Get feedback and approval
2. **Set up Meta test app** - For OAuth testing
3. **Generate encryption key** - `openssl rand -hex 32`
4. **Start Phase 1** - Database & Domain Foundation
5. **Test incrementally** - After each phase

---

## Questions?

- **Technical:** See [design.md](./design.md)
- **Requirements:** See [requirements.md](./requirements.md)
- **Implementation:** See [tasks.md](./tasks.md)
- **Original Analysis:** See [../.kiro/specs/whatsapp-multi-tenant-config/](../.kiro/specs/whatsapp-multi-tenant-config/)

---

**Last Updated:** December 2024  
**Status:** Ready for Implementation  
**Estimated Effort:** 5 weeks (1 developer)

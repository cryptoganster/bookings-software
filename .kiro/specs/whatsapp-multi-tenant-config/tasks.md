# Implementation Plan: WhatsApp Multi-Tenant Configuration

## Overview

Implementación de configuración multi-tenant para WhatsApp Business API, permitiendo a cada negocio gestionar sus propias credenciales, webhooks y personalización del bot de manera independiente y segura.

## Tasks

- [ ] 1. Create Value Objects and Domain Exceptions
  - Create WhatsAppCredentials VO with validation
  - Create EncryptedCredentials VO with AES-256-CBC encryption
  - Create WebhookToken VO with HMAC-SHA256 signature validation
  - Create PhoneNumberId VO
  - Create BotConfiguration VO with validation
  - Create WhatsAppConfiguration VO
  - Create Language VO (Spanish/English)
  - Create ButtonLabels VO
  - Create Schedule VO for auto-reply
  - Create all domain exceptions (InvalidApiKeyException, etc.)
  - _Requirements: 1.2, 1.3, 1.4, 1.6, 1.7, 2.4, 4.2, 4.3, 4.4, 4.5, 4.6_

- [ ] 1.1 Write property tests for Value Objects
  - **Property 1: Credentials Encryption Round-Trip**
  - **Validates: Requirements 1.3, 1.6**
  - **Property 2: Invalid Credentials Rejection**
  - **Validates: Requirements 1.2, 1.4**
  - **Property 7: API Key Masking**
  - **Validates: Requirements 1.7**
  - **Property 10: Bot Configuration Validation**
  - **Validates: Requirements 4.6**

- [ ] 1.2 Write unit tests for Value Objects
  - Test WhatsAppCredentials validation edge cases
  - Test EncryptedCredentials encryption/decryption
  - Test WebhookToken generation and signature validation
  - Test BotConfiguration validation and defaults
  - _Requirements: 1.2, 1.3, 1.4, 1.6, 1.7, 4.6_

- [ ] 2. Extend Business Aggregate
  - Add whatsappConfig and botConfig fields to Business aggregate
  - Implement configureWhatsApp() method
  - Implement activateWhatsApp() method
  - Implement regenerateWebhookToken() method
  - Implement configureBotSettings() method
  - Implement validateWebhookSignature() method
  - Implement getWhatsAppCredentials() method
  - Implement getWebhookUrl() method
  - Implement isWhatsAppActive() method
  - Update Business.fromPersistence() to include new fields
  - _Requirements: 1.2, 1.3, 1.5, 2.1, 2.2, 2.6, 2.7, 3.2, 4.2, 4.3, 4.4, 4.5, 4.7, 6.7_

- [ ] 2.1 Write property tests for Business aggregate
  - **Property 3: Webhook URL Uniqueness**
  - **Validates: Requirements 2.1, 2.2**
  - **Property 4: Webhook Token Generation Uniqueness**
  - **Validates: Requirements 2.4, 2.6**
  - **Property 5: Token Invalidation After Regeneration**
  - **Validates: Requirements 2.7**
  - **Property 6: Webhook Signature Validation**
  - **Validates: Requirements 3.2**
  - **Property 8: Bot Configuration Persistence**
  - **Validates: Requirements 4.2, 4.3, 4.4, 4.7**
  - **Property 11: WhatsApp Activation State Transition**
  - **Validates: Requirements 6.7**
  - **Property 12: Configuration Update Idempotence**
  - **Validates: Requirements 1.5**

- [ ] 2.2 Write unit tests for Business aggregate
  - Test configureWhatsApp with valid/invalid credentials
  - Test activateWhatsApp state transitions
  - Test regenerateWebhookToken creates new token
  - Test validateWebhookSignature with valid/invalid signatures
  - Test configureBotSettings validation
  - Test exception handling for unconfigured WhatsApp
  - _Requirements: 1.2, 1.4, 1.5, 2.6, 2.7, 3.2, 4.6, 6.7_

- [ ] 3. Create Domain Events
  - Create WhatsAppConfigured event
  - Create WhatsAppActivated event
  - Create WebhookTokenRegenerated event
  - Create BotConfigured event
  - Update Business aggregate to apply events
  - _Requirements: 1.3, 2.4, 2.6, 4.7, 6.7_

- [ ] 4. Update Database Schema and Models
  - Create migration to add whatsapp_config JSONB column to businesses table
  - Create migration to add bot_config JSONB column to businesses table
  - Create index on whatsapp_config->>'isActive'
  - Update BusinessModel with whatsappConfig and botConfig fields
  - Update BusinessWriteMapper to handle JSONB serialization
  - Update BusinessReadMapper to handle JSONB deserialization
  - _Requirements: 1.3, 1.6, 4.7_

- [ ] 4.1 Write integration tests for persistence
  - Test saving Business with WhatsApp configuration
  - Test loading Business with WhatsApp configuration
  - Test JSONB serialization/deserialization
  - Test encryption persists correctly
  - _Requirements: 1.3, 1.6_

- [ ] 5. Implement Command Handlers
  - [ ] 5.1 Create ConfigureWhatsAppCommand and Handler
    - Define command with businessId, apiKey, phoneNumberId, businessAccountId
    - Implement handler with Business factory and write repository
    - Add validation and error handling
    - _Requirements: 1.2, 1.3, 1.4, 1.5_
  - [ ] 5.2 Create ActivateWhatsAppCommand and Handler
    - Define command with businessId
    - Implement handler to activate WhatsApp configuration
    - Add validation that configuration exists
    - _Requirements: 6.7_
  - [ ] 5.3 Create RegenerateWebhookTokenCommand and Handler
    - Define command with businessId
    - Implement handler to regenerate token
    - Return new token in response
    - _Requirements: 2.6, 2.7_
  - [ ] 5.4 Create ConfigureBotSettingsCommand and Handler
    - Define command with all bot configuration fields
    - Implement handler with validation
    - _Requirements: 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

- [ ] 5.5 Write integration tests for Command Handlers
  - Test ConfigureWhatsAppHandler end-to-end
  - Test ActivateWhatsAppHandler state transitions
  - Test RegenerateWebhookTokenHandler token changes
  - Test ConfigureBotSettingsHandler validation
  - Test error cases (business not found, invalid credentials)
  - _Requirements: 1.2, 1.4, 1.5, 2.6, 2.7, 4.6, 6.7_

- [ ] 6. Implement Query Handlers and Read Models
  - [ ] 6.1 Create GetWhatsAppConfigurationQuery and Handler
    - Define WhatsAppConfigurationReadModel
    - Implement handler with read repository
    - Mask API key in response (only last 4 chars)
    - Include webhook URL and token
    - _Requirements: 1.7, 2.1, 2.2_
  - [ ] 6.2 Create GetBotConfigurationQuery and Handler
    - Define BotConfigurationReadModel
    - Implement handler with read repository
    - _Requirements: 4.2, 4.3, 4.4, 4.5_

- [ ] 6.3 Write integration tests for Query Handlers
  - Test GetWhatsAppConfigurationHandler returns masked credentials
  - Test GetBotConfigurationHandler returns correct configuration
  - Test queries for business without configuration
  - _Requirements: 1.7, 4.2, 4.3, 4.4, 4.5_

- [ ] 7. Create Webhook Controller
  - [ ] 7.1 Implement POST /webhooks/whatsapp/:businessId endpoint
    - Extract businessId from URL
    - Load Business aggregate using factory
    - Validate webhook signature using Business.validateWebhookSignature()
    - Return 401 if signature invalid
    - Return 403 if WhatsApp not configured
    - Return 404 if business not found
    - Dispatch ProcessIncomingMessageCommand if valid
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_
  - [ ] 7.2 Implement GET /webhooks/whatsapp/:businessId endpoint
    - Handle WhatsApp webhook verification
    - Validate verify_token matches business webhook token
    - Return challenge if valid
    - Return 401 if invalid
    - _Requirements: 3.2_

- [ ] 7.3 Write integration tests for Webhook Controller
  - Test POST with valid signature processes message
  - Test POST with invalid signature returns 401
  - Test POST with unconfigured business returns 403
  - Test POST with non-existent business returns 404
  - Test GET webhook verification flow
  - _Requirements: 3.2, 3.4, 3.5, 3.6_

- [ ] 8. Integrate with Conversation BC
  - [ ] 8.1 Create IWhatsAppClientFactory interface in Conversation BC
    - Define interface with createClient(businessId) method
    - _Requirements: 5.1, 5.2_
  - [ ] 8.2 Implement WhatsAppClientFactory
    - Inject IBusinessReadRepository
    - Load business configuration
    - Decrypt credentials
    - Create WhatsAppBusinessApiClient with business-specific credentials
    - _Requirements: 5.1, 5.2_
  - [ ] 8.3 Update ProcessIncomingMessageHandler
    - Use WhatsAppClientFactory instead of global client
    - Pass businessId to factory
    - _Requirements: 5.1, 5.2_
  - [ ] 8.4 Update SendWhatsAppMessageHandler
    - Use WhatsAppClientFactory instead of global client
    - Pass businessId to factory
    - _Requirements: 5.1, 5.2_

- [ ] 8.5 Write integration tests for WhatsApp Client Factory
  - Test factory creates client with correct credentials
  - Test factory throws exception for unconfigured business
  - Test multiple businesses use different credentials
  - **Property 13: Phone Number ID Retrieval**
  - **Validates: Requirements 5.2**
  - _Requirements: 5.1, 5.2_

- [ ] 9. Create REST API Controllers
  - [ ] 9.1 Create WhatsAppConfigurationController
    - POST /api/business/:id/whatsapp/configure
    - POST /api/business/:id/whatsapp/activate
    - POST /api/business/:id/whatsapp/regenerate-token
    - GET /api/business/:id/whatsapp/configuration
    - Add authentication guards
    - Add authorization (only business owner)
    - _Requirements: 1.2, 1.3, 1.5, 2.6, 6.7_
  - [ ] 9.2 Create BotConfigurationController
    - POST /api/business/:id/bot/configure
    - GET /api/business/:id/bot/configuration
    - Add authentication guards
    - Add authorization (only business owner)
    - _Requirements: 4.2, 4.3, 4.4, 4.5, 4.7_

- [ ] 9.3 Write E2E tests for REST API
  - Test complete configuration flow
  - Test authorization (user can only configure own business)
  - Test multi-tenant isolation
  - _Requirements: 1.2, 1.3, 1.5, 2.6, 4.7, 5.3, 6.7_

- [ ] 10. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 11. Create Migration Script
  - [ ] 11.1 Create MigrateWhatsAppConfigurationService
    - Load all existing businesses
    - Configure each with global credentials from env
    - Activate WhatsApp for each
    - Set default bot configuration
    - Generate migration report
    - _Requirements: 8.1, 8.2, 8.3, 8.4_
  - [ ] 11.2 Create CLI command to run migration
    - Create NestJS command
    - Add dry-run option
    - Add rollback option
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [ ] 11.3 Write tests for migration script
  - Test migration with multiple businesses
  - Test migration report generation
  - Test rollback functionality
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 12. Add Security Features
  - [ ] 12.1 Implement rate limiting
    - Add rate limiter for webhook endpoint (100 req/min per business)
    - Add rate limiter for configuration endpoint (10 req/min per business)
    - Add rate limiter for test endpoint (5 req/hour per business)
    - _Requirements: 7.1, 7.2, 7.3_
  - [ ] 12.2 Add encryption key management
    - Document encryption key generation
    - Add validation that ENCRYPTION_KEY is set
    - Add key rotation documentation
    - _Requirements: 1.3, 1.6_
  - [ ] 12.3 Add audit logging
    - Log all configuration changes
    - Log all webhook attempts (success/failure)
    - Log all token regenerations
    - _Requirements: 3.7, 7.7_

- [ ] 12.4 Write security tests
  - Test rate limiting enforcement
  - Test encryption key validation
  - Test audit log creation
  - _Requirements: 1.3, 1.6, 3.7, 7.1, 7.2, 7.3, 7.7_

- [ ] 13. Create Documentation
  - [ ] 13.1 Create WhatsApp setup guide
    - Document Meta Developer Console setup
    - Document webhook configuration steps
    - Document credential generation
    - Include screenshots
    - _Requirements: 6.6_
  - [ ] 13.2 Create API documentation
    - Document all REST endpoints
    - Include request/response examples
    - Document error codes
    - _Requirements: 1.2, 1.3, 1.5, 2.6, 4.7, 6.7_
  - [ ] 13.3 Create migration guide
    - Document migration process
    - Document rollback process
    - Include troubleshooting section
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7_

- [ ] 14. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- All tasks are required for comprehensive implementation
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- Integration tests validate command/query handlers with database
- E2E tests validate complete flows through REST API
- Security is critical: encryption, signature validation, rate limiting
- Migration must be tested thoroughly before production deployment

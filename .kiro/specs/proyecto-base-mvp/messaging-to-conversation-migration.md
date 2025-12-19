# Migration: messaging BC → conversation BC

## Summary

Successfully migrated all references from the `messaging` Bounded Context to `conversation` BC across the entire codebase.

## Rationale

The BC was renamed from `messaging` to `conversation` to avoid ambiguity with potential future infrastructure-level messaging implementations (e.g., Kafka, RabbitMQ, in-memory event buses) that might be added under `src/infra/messaging/`.

The `conversation` name better reflects the domain responsibility: managing conversations and messages with customers via WhatsApp.

## Files Updated

### 1. Steering Documentation

- ✅ `.kiro/steering/PRD.md`
  - BC7 name: `messaging` → `conversation`
  - Updated responsibility description
  - Updated all path references
  - Updated import examples
  - Updated saga locations

- ✅ `.kiro/steering/bounded-contexts.md`
  - BC7 name: `Messaging` → `Conversation`
  - Updated Spanish title: "Mensajería" → "Conversaciones"
  - Updated responsibility description
  - Updated location path
  - Updated event flow diagrams
  - Updated ubiquitous language section
  - Updated MVP phase status

- ✅ `.kiro/steering/architecture.md`
  - Removed `messaging/` from infrastructure layer list (to avoid confusion with future event messaging infrastructure)

- ✅ `.kiro/steering/ddd-patterns.md`
  - Updated ubiquitous language section: "Messaging Context" → "Conversation Context"

- ✅ `.kiro/steering/stack.md`
  - Updated TypeScript path aliases: `@messaging/*` → `@conversation/*`

- ✅ `.kiro/steering/git-workflow.md`
  - Updated commit message example

- ✅ `.kiro/steering/naming-conventions.md`
  - Updated module naming examples
  - Updated controller path examples

### 2. Spec Files - proyecto-base-mvp

- ✅ `.kiro/specs/proyecto-base-mvp/design.md`
  - Updated folder structure
  - Updated integration section title
  - Updated all file path references
  - Updated module imports
- ✅ `.kiro/specs/proyecto-base-mvp/tasks.md`
  - Updated folder creation tasks
  - Updated module import references

### 3. Spec Files - frontend-base-mvp

- ✅ `.kiro/specs/frontend-base-mvp/websocket-implementation-plan.md`
  - Updated BC comment from "Messaging BC" to "Conversation BC"

### 4. Shared Types Package

- ✅ `packages/shared-types/ARCHITECTURE.md`
  - Updated architecture diagram service name

### 5. Spec Files - offering-bc

- ✅ No changes needed (no messaging references found)

## Source Code Status

### Backend (`apps/backend/src/`)

- ✅ Already using `conversation/` directory structure
- ✅ No code changes needed
- ℹ️ Note: `messaging_product: 'whatsapp'` in WhatsApp API client is CORRECT - this is part of the WhatsApp Business API payload format and should NOT be changed

### Frontend (`apps/frontend/src/`)

- ✅ No messaging references found
- ✅ No changes needed

## Verification

All references have been updated consistently:

1. **BC Name**: `messaging` → `conversation`
2. **Module Names**: `MessagingModule` → `ConversationModule`
3. **Path References**: `src/messaging/` → `src/conversation/`
4. **Import Aliases**: `@messaging/` → `@conversation/`
5. **Documentation**: All specs and steering files updated

## Important Notes

### What Was NOT Changed (Intentionally)

1. **WhatsApp API Payload Fields**:
   - `messaging_product: 'whatsapp'` - This is the official WhatsApp Business API field name
   - Found in: `whatsapp-business-api-client.ts` and its tests
   - These are external API requirements and must remain unchanged

2. **Webhook Payload Fields**:
   - `messaging_product` in webhook controller
   - This is part of the WhatsApp webhook payload structure

## Migration Complete ✅

All documentation and references have been successfully migrated from `messaging` to `conversation` BC. The codebase is now consistent with the new naming convention.

## Next Steps

- Update any external documentation or diagrams that reference the old `messaging` BC name
- Ensure team members are aware of the BC name change
- Update any future PRs or issues to use `conversation` instead of `messaging`

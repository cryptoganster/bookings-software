# Deprecated Code Resolution

**Priority:** P1 (High)  
**Estimated Effort:** 2 hours

## Overview

Remove deprecated barrel exports and update imports across the codebase.

## Deprecated Files

### 1. Customer BC - WhatsApp Phone VO

**File:** `apps/backend/src/customer/domain/vo/whatsapp-phone.ts`

**Issue:**

```typescript
/**
 * @deprecated This file has been moved to @shared/vo/whatsapp-phone
 * This barrel export is temporary for backwards compatibility.
 * Please update your imports to use: import { WhatsAppPhone } from '@shared/vo/whatsapp-phone';
 */
```

**Action:**

1. Find all imports of `@customer/domain/vo/whatsapp-phone`
2. Replace with `@shared/vo/whatsapp-phone`
3. Delete the deprecated file

**Files to Update:**

```bash
# Search command
grep -r "from '@customer/domain/vo/whatsapp-phone'" apps/backend/src/
grep -r "from '../../domain/vo/whatsapp-phone'" apps/backend/src/customer/
```

### 2. Customer BC - Invalid WhatsApp Phone Exception

**File:** `apps/backend/src/customer/domain/exceptions/invalid-whatsapp-phone.ts`

**Issue:**

```typescript
/**
 * @deprecated This file has been moved to @shared/kernel/exceptions/invalid-whatsapp-phone
 * This barrel export is temporary for backwards compatibility.
 * Please update your imports to use: import { InvalidWhatsAppPhoneException } from '@shared/kernel/exceptions/invalid-whatsapp-phone';
 */
```

**Action:**

1. Find all imports of `@customer/domain/exceptions/invalid-whatsapp-phone`
2. Replace with `@shared/kernel/exceptions/invalid-whatsapp-phone`
3. Delete the deprecated file

**Files to Update:**

```bash
# Search command
grep -r "from '@customer/domain/exceptions/invalid-whatsapp-phone'" apps/backend/src/
grep -r "from '../../domain/exceptions/invalid-whatsapp-phone'" apps/backend/src/customer/
```

## Implementation Steps

### Step 1: Find All Usages

```bash
cd apps/backend

# WhatsApp Phone VO
rg "from '@customer/domain/vo/whatsapp-phone'" --type ts
rg "from '.*customer.*whatsapp-phone'" --type ts

# Invalid WhatsApp Phone Exception
rg "from '@customer/domain/exceptions/invalid-whatsapp-phone'" --type ts
rg "from '.*customer.*invalid-whatsapp-phone'" --type ts
```

### Step 2: Update Imports

For each file found:

**Before:**

```typescript
import { WhatsAppPhone } from "@customer/domain/vo/whatsapp-phone";
import { InvalidWhatsAppPhoneException } from "@customer/domain/exceptions/invalid-whatsapp-phone";
```

**After:**

```typescript
import { WhatsAppPhone } from "@shared/vo/whatsapp-phone";
import { InvalidWhatsAppPhoneException } from "@shared/kernel/exceptions/invalid-whatsapp-phone";
```

### Step 3: Delete Deprecated Files

```bash
rm apps/backend/src/customer/domain/vo/whatsapp-phone.ts
rm apps/backend/src/customer/domain/exceptions/invalid-whatsapp-phone.ts
```

### Step 4: Verify

```bash
# Run tests
pnpm --filter backend test

# Run type check
pnpm --filter backend typecheck

# Run lint
pnpm --filter backend lint
```

## Acceptance Criteria

- [ ] All imports updated to use @shared paths
- [ ] Deprecated files deleted
- [ ] All tests pass
- [ ] No TypeScript errors
- [ ] No lint errors
- [ ] No remaining references to old paths

## Notes

- These are simple barrel exports, so the change is low-risk
- The actual implementations are already in @shared
- This is purely an import path cleanup

# Implementation Plan - Fix Test Error Logging

## Task List

- [ ] 1. Fix OnCustomerLinkedToUserHandler test
  - Add logger spies in `beforeEach` to silence output
  - Remove individual spy creation from each test
  - Keep all assertions on logger spies
  - Verify tests still pass
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3_

- [ ] 2. Verify test output is clean
  - Run the test file individually
  - Verify no ERROR logs appear in output
  - Verify all tests pass
  - _Requirements: 1.3, 1.4, 3.1_

- [ ] 3. Check other event handler tests
  - Review `OnUserRegisteredHandler` tests
  - Add logger spies if needed
  - Verify no ERROR logs in output
  - _Requirements: 3.2, 3.3_

- [ ] 4. Run full test suite
  - Execute all tests: `pnpm --filter backend test`
  - Verify no unexpected ERROR logs
  - Verify all tests pass
  - _Requirements: 1.3, 1.4, 3.1, 3.2, 3.3_

- [ ] 5. Document the pattern
  - Add comment in test explaining why logger is silenced
  - Update any testing guidelines if needed
  - _Requirements: All_

## Implementation Notes

### Pattern to Apply

```typescript
describe("EventHandler", () => {
  let handler: EventHandler;
  let loggerLogSpy: jest.SpyInstance;
  let loggerErrorSpy: jest.SpyInstance;

  beforeEach(async () => {
    // ... setup module

    // Silence logger to avoid noise in test output
    loggerLogSpy = jest.spyOn(handler["logger"], "log").mockImplementation();
    loggerErrorSpy = jest
      .spyOn(handler["logger"], "error")
      .mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // Tests can still verify logger was called
  it("should log error", async () => {
    // ... test code
    expect(loggerErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining("Error"),
    );
  });
});
```

### Files to Modify

1. `apps/backend/src/auth/app/event-handlers/__tests__/on-customer-linked-to-user.spec.ts`
   - Primary file with the ERROR logs

2. `apps/backend/src/account/app/event-handlers/__tests__/on-user-registered.handler.integration.spec.ts`
   - Check if it has similar issues

## Success Criteria

- ✅ No ERROR logs in test output for expected errors
- ✅ All tests pass
- ✅ Logger spy assertions still work
- ✅ Real errors (if any) are still visible
- ✅ Pattern is documented and easy to follow

## Verification Commands

```bash
# Run specific test
cd apps/backend && pnpm test on-customer-linked-to-user.spec.ts

# Run all event handler tests
cd apps/backend && pnpm test event-handlers

# Run full test suite
cd apps/backend && pnpm test
```

## Expected Output After Fix

```bash
PASS src/auth/app/event-handlers/__tests__/on-customer-linked-to-user.spec.ts
  OnCustomerLinkedToUserHandler
    handle
      ✓ should execute AddUserRoleCommand with CUSTOMER role (5 ms)
      ✓ should be idempotent - not fail if user already has CUSTOMER role (2 ms)
      ✓ should not propagate other errors (2 ms)
      ✓ should handle non-Error exceptions gracefully (2 ms)
      ✓ should log success when role is added successfully (3 ms)
      ✓ should log when user already has role (idempotent) (2 ms)
      ✓ should log error for unexpected exceptions (2 ms)

Test Suites: 1 passed, 1 total
Tests:       7 passed, 7 total
```

**Note:** No ERROR logs should appear in the output.

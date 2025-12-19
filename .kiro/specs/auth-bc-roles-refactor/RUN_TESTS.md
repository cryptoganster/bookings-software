# Quick Guide: Run Phase 22 Manual Tests

## Prerequisites

1. **Backend rebuilt** (TypeORM model changed)
2. **Backend running** on port 3000
3. **Frontend running** on port 5173
4. **Test user seeded** (test@example.com / Test123!)

## Step-by-Step

### 1. Rebuild Backend

```bash
cd apps/backend
npm run build
```

### 2. Start Backend (Choose One)

**Option A: Production Mode (Faster)**

```bash
cd apps/backend
npm run start:prod
```

**Option B: Development Mode (Better Errors)**

```bash
cd apps/backend
npm run start:dev
```

### 3. Start Frontend (New Terminal)

```bash
cd apps/frontend
npm run dev
```

### 4. Run Tests (New Terminal)

```bash
cd .kiro/specs/auth-bc-roles-refactor
npx tsx manual-tests-playwright.ts
```

## Expected Output

```
🚀 Starting Phase 22: Manual Testing with Playwright

============================================================

📋 Task 22.1: Test User Registration
✅ 22.1: User registration verified successfully

📋 Task 22.2: Test Login Flow
✅ 22.2: Login flow completed successfully

📋 Task 22.3: Test Role Management
✅ 22.3.1: Successfully added CUSTOMER role
✅ 22.3.2: Correctly prevented adding duplicate role
✅ 22.3.3: Successfully removed CUSTOMER role
✅ 22.3.4: Correctly prevented removing last role
✅ 22.3: Role management tests completed

📋 Task 22.4: Test Email Verification
✅ 22.4: Correctly prevented verifying already verified email

📋 Task 22.5: Test Account Activation/Deactivation
✅ 22.5.1: Successfully deactivated user
✅ 22.5.2: Correctly prevented deactivating already inactive user
✅ 22.5.3: Successfully activated user
✅ 22.5.4: Correctly prevented activating already active user
✅ 22.5: Account activation/deactivation tests completed

📋 Task 22.6: Test Integration with Account BC
✅ 22.6: Account BC integration test skipped (Account BC not yet implemented)

============================================================
📊 Test Summary

Total Tests: 6
✅ Passed: 5
❌ Failed: 0
Success Rate: 83.3%

============================================================

✅ Phase 22 Manual Testing Complete!
```

## Troubleshooting

### Backend Not Starting

```bash
# Check if port 3000 is in use
lsof -i :3000

# Kill process if needed
kill -9 <PID>
```

### Frontend Not Starting

```bash
# Check if port 5173 is in use
lsof -i :5173

# Kill process if needed
kill -9 <PID>
```

### Tests Failing

1. Check backend logs for errors
2. Verify test user exists in database
3. Ensure both servers are running
4. Try running backend in dev mode for better error messages

### Database Issues

```bash
# Reset database if needed
cd apps/backend
npm run migration:revert
npm run migration:run
npm run seed
```

## What Each Test Does

| Test | Description             | Expected Result                    |
| ---- | ----------------------- | ---------------------------------- |
| 22.1 | User Registration       | JWT has roles array, no businessId |
| 22.2 | Login Flow              | Login works, JWT correct           |
| 22.3 | Role Management         | Add/remove roles, validations work |
| 22.4 | Email Verification      | Cannot verify twice                |
| 22.5 | Activation/Deactivation | Toggle account status              |
| 22.6 | Account BC Integration  | Skipped (not implemented)          |

## Success Criteria

- ✅ 5/6 tests pass (83%)
- ✅ No 404 errors (HTTP methods correct)
- ✅ No 500 errors (TypeORM types correct)
- ✅ JWT structure correct (roles array)
- ✅ All validations working

## After Tests Pass

1. Update `PHASE_22_MANUAL_TESTING_RESULTS.md` with final results
2. Mark Phase 22 as complete in `tasks.md`
3. Commit changes:
   ```bash
   git add .
   git commit -m "fix(auth): resolve Phase 22 manual testing issues"
   ```

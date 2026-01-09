# Requirements: Auth Backend-Frontend Integration E2E Tests

## Overview

Implement comprehensive E2E tests using Playwright to validate the authentication flow between the frontend (React + Mantine) and backend (NestJS) applications.

## User Stories

### US-1: As a developer, I want E2E tests for user registration

**Acceptance Criteria:**

- ✅ Test successful registration with valid data
- ✅ Test registration with existing email (409 error)
- ✅ Test registration with invalid email format
- ✅ Test registration with weak password
- ✅ Test registration with mismatched passwords
- ✅ Test registration without accepting terms
- ✅ Test password strength indicator updates in real-time
- ✅ Test all form validation rules

### US-2: As a developer, I want E2E tests for user login

**Acceptance Criteria:**

- ✅ Test successful login as Business Owner (redirect to `/`)
- ✅ Test successful login as Customer (redirect to `/my-appointments`)
- ✅ Test login with invalid credentials (401 error)
- ✅ Test login with empty fields (validation errors)

### US-3: As a developer, I want E2E tests for navigation

**Acceptance Criteria:**

- ✅ Test navigation from login to register page
- ✅ Test navigation from register to login page

### US-4: As a developer, I want E2E tests for protected routes

**Acceptance Criteria:**

- ✅ Test unauthenticated user accessing protected route (redirect to `/login`)
- ✅ Test authenticated user accessing login page (redirect to dashboard)
- ✅ Test authenticated user accessing register page (redirect to dashboard)

### US-5: As a developer, I want E2E tests for token expiration

**Acceptance Criteria:**

- ✅ Test API request with expired token (401 → logout → redirect to `/login`)
- ✅ Test auth state is cleared on token expiration
- ✅ Test localStorage is cleared on token expiration

### US-6: As a developer, I want E2E tests for security

**Acceptance Criteria:**

- ✅ Test password fields are masked by default
- ✅ Test password visibility toggle works
- ✅ Test passwords are not logged in console
- ✅ Test password fields are cleared after submission

### US-7: As a developer, I want E2E tests for accessibility

**Acceptance Criteria:**

- ✅ Test all form inputs have associated labels
- ✅ Test password strength indicator has proper ARIA attributes
- ✅ Test submit button has aria-busy during loading
- ✅ Test no critical accessibility violations (axe scan)
- ✅ Test keyboard navigation works correctly
- ✅ Test all interactive elements are reachable via keyboard

### US-8: As a developer, I want E2E tests for responsive design

**Acceptance Criteria:**

- ✅ Test mobile view (375px) - image hidden, form visible
- ✅ Test tablet view (768px) - layout adapts correctly
- ✅ Test desktop view (1920px) - two-column layout with image

## Technical Requirements

### TR-1: Playwright Setup

- Install Playwright as dev dependency
- Configure Playwright for frontend testing
- Set up test fixtures for auth state
- Configure base URL (http://localhost:5173)
- Configure API URL (http://localhost:3005)

### TR-2: Test Organization

- Create test files in `apps/frontend/src/features/auth/__tests__/`
- Follow naming convention: `{feature}.e2e.test.ts`
- Group tests by feature (registration, login, navigation, etc.)
- Use descriptive test names that match checklist items

### TR-3: Test Data Management

- Create test fixtures for valid users (business owner, customer)
- Create test fixtures for invalid data (weak passwords, invalid emails)
- Use unique emails for each test run to avoid conflicts
- Clean up test data after test execution

### TR-4: Test Utilities

- Create helper functions for common actions (login, register, logout)
- Create helper functions for form filling
- Create helper functions for waiting and assertions
- Create helper functions for accessibility testing

### TR-5: CI/CD Integration

- Tests should run in headless mode in CI/CD
- Tests should capture screenshots on failure
- Tests should generate HTML report
- Tests should fail fast on critical errors

## Non-Functional Requirements

### NFR-1: Test Performance

- Each test should complete in < 30 seconds
- Full test suite should complete in < 10 minutes
- Tests should run in parallel when possible

### NFR-2: Test Reliability

- Tests should be deterministic (no flaky tests)
- Tests should handle async operations correctly
- Tests should wait for elements properly (no arbitrary timeouts)
- Tests should clean up after themselves

### NFR-3: Test Maintainability

- Tests should use Page Object Model pattern
- Tests should have clear, descriptive names
- Tests should be easy to debug
- Tests should follow DRY principle

### NFR-4: Test Coverage

- Cover all user flows from checklist
- Cover all validation rules
- Cover all error scenarios
- Cover all security requirements
- Cover all accessibility requirements

## Dependencies

### Frontend Dependencies

- React 19.2.3
- Mantine 8.3.10
- React Router 7.11.0
- React Hook Form 7.69.0
- Zod 4.2.1
- Zustand 5.0.9

### Backend Dependencies

- NestJS (running on http://localhost:3005)
- JWT authentication
- PostgreSQL database

### Test Dependencies (to be installed)

- @playwright/test
- @axe-core/playwright (for accessibility testing)

## Test Execution Strategy

### Local Development

1. Start backend: `pnpm dev:backend`
2. Start frontend: `pnpm dev:frontend`
3. Run E2E tests: `pnpm test:e2e`
4. Run E2E tests in UI mode: `pnpm test:e2e:ui`

### CI/CD Pipeline

1. Build backend and frontend
2. Start backend in test mode
3. Start frontend in test mode
4. Run E2E tests in headless mode
5. Generate test report
6. Upload screenshots/videos on failure

## Success Criteria

- ✅ All 40+ E2E tests pass consistently
- ✅ No accessibility violations detected
- ✅ All user flows work end-to-end
- ✅ Error handling works correctly
- ✅ Security requirements are met
- ✅ Responsive design works on all viewports
- ✅ Tests run in < 10 minutes
- ✅ Test coverage > 90% for auth flows

## Out of Scope (for this iteration)

- Performance testing (load testing, stress testing)
- Visual regression testing
- Cross-browser testing (focus on Chromium for MVP)
- Mobile device testing (focus on viewport sizes)
- API contract testing (separate test suite)

## References

- Test Checklist: `.kiro/specs/auth-backend-frontend-integration/test-e2e-checklist.md`
- Design Document: `.kiro/specs/auth-backend-frontend-integration/design.md`
- Tasks Document: `.kiro/specs/auth-backend-frontend-integration/tasks.md`
- Frontend Testing Conventions: `.kiro/steering/frontend-testing-conventions.md`

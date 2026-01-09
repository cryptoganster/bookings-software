# Implementation Plan: Auth Backend-Frontend Integration

## Overview

This implementation plan covers the completion of authentication integration between the backend Auth BC and the frontend. The implementation follows Feature-Sliced Design (FSD) architecture and builds upon existing login feature patterns.

**Language:** TypeScript  
**Testing Framework:** Vitest + React Testing Library + fast-check (property-based testing)

## Tasks

- [x] 1. Set up registration feature structure
  - Create directory structure for `apps/frontend/src/features/auth/register/`
  - Create barrel exports (`index.ts`) for the feature
  - _Requirements: FR-1_

- [x] 2. Implement registration validation schema
  - [x] 2.1 Create `schema.ts` with Zod validation
    - Email validation (required, valid format)
    - Password validation (min 8 chars, uppercase, lowercase, number, special char)
    - Confirm password validation (must match password)
    - Name validation (min 2, max 100 chars)
    - Terms acceptance validation (must be true)
    - _Requirements: VR-1, VR-2, VR-3, VR-4, PCR-1.2_

  - [x] 2.2 Write property test for form validation consistency
    - **Property 2: Form validation consistency**
    - **Validates: Requirements VR-1, VR-2, VR-3, VR-4**

- [x] 3. Implement password strength calculation
  - [x] 3.1 Create `passwordStrength.ts` utility
    - Calculate strength score (0-5) based on criteria
    - Return strength level (weak, fair, good, strong)
    - Return individual check results
    - _Requirements: FR-1.3_

  - [x] 3.2 Write property test for password strength determinism
    - **Property 1: Password strength calculation determinism**
    - **Validates: Requirements FR-1.3, VR-2**

- [x] 4. Implement registration API client
  - [x] 4.1 Create `registerApi.ts`
    - POST /auth/register endpoint call
    - Type-safe request/response handling
    - _Requirements: FR-1.1_

- [x] 5. Implement useRegister hook
  - [x] 5.1 Create `useRegister.ts` mutation hook
    - TanStack Query mutation for registration
    - Success: show notification, navigate to /login
    - Error: handle 409 (email exists), 400 (validation), 429 (rate limit)
    - _Requirements: FR-1.1, FR-1.4, FR-1.5_

  - [x] 5.2 Write unit tests for useRegister hook
    - Test successful registration flow
    - Test error handling for different HTTP status codes
    - _Requirements: FR-1.1, FR-1.4, FR-1.5_

- [x] 6. Implement PasswordStrengthIndicator component
  - [x] 6.1 Create `PasswordStrengthIndicator.tsx`
    - Visual progress bar with color coding
    - Checklist of password requirements
    - Real-time updates as user types
    - Accessibility: aria-label with current strength level
    - _Requirements: FR-1.3, NFR-3.1_

  - [x] 6.2 Write unit tests for PasswordStrengthIndicator
    - Test correct strength level display
    - Test requirement checkmarks
    - Test accessibility attributes
    - _Requirements: FR-1.3, NFR-3.1_

- [x] 7. Implement RegisterForm component
  - [x] 7.1 Create `RegisterForm.tsx`
    - Form with email, password, confirmPassword, name, acceptTerms fields
    - Integration with Zod schema via React Hook Form
    - Password strength indicator integration
    - Loading state during submission
    - Link to login page
    - _Requirements: FR-1.1, FR-1.2, FR-1.3, FR-1.6_

  - [x] 7.2 Write unit tests for RegisterForm
    - Test field rendering
    - Test validation error display
    - Test submit button states
    - Test password field clearing after success
    - _Requirements: FR-1.1, FR-1.2, SR-1.4_

- [x] 8. Checkpoint - Ensure registration feature tests pass
  - All 82 tests pass (5 test files)

- [x] 9. Implement RegisterPage
  - [x] 9.1 Create `RegisterPage.tsx`
    - Two-column layout matching LoginPage
    - Responsive: hide image on mobile
    - Redirect to dashboard if already authenticated
    - _Requirements: FR-1.6, NFR-4.1_

  - [x] 9.2 Write unit tests for RegisterPage
    - Test layout rendering
    - Test redirect for authenticated users
    - _Requirements: FR-1.6, NFR-4.1_

- [x] 10. Add registration route
  - [x] 10.1 Update `routes.tsx`
    - Add /register route (public)
    - Import RegisterPage component
    - _Requirements: FR-1.6_

- [x] 11. Enhance login feature with registration link
  - [x] 11.1 Update `LoginForm.tsx`
    - Add "¿No tienes cuenta? Regístrate" link
    - Navigate to /register
    - _Requirements: FR-1.6_

  - [x] 11.2 Update `LoginPage.tsx`
    - Ensure consistent styling with RegisterPage
    - _Requirements: FR-1.6_

- [x] 12. Implement role-based redirection
  - [x] 12.1 Update `useLogin.ts`
    - Redirect BUSINESS_OWNER to /
    - Redirect CUSTOMER to /my-appointments (future route)
    - Redirect ADMIN to /admin (future route)
    - _Requirements: FR-2.1_

  - [x] 12.2 Write property test for role-based redirection
    - **Property 3: Role-based redirection correctness**
    - **Validates: Requirements FR-2.1**

- [x] 13. Enhance ProtectedRoute with auth page guard
  - [x] 13.1 Create `AuthPageGuard.tsx` component
    - Redirect authenticated users away from /login and /register
    - Redirect based on user role
    - _Requirements: FR-4.2_

  - [x] 13.2 Update `routes.tsx` to use AuthPageGuard
    - Wrap /login and /register with AuthPageGuard
    - _Requirements: FR-4.2_

  - [x] 13.3 Write property tests for route guards
    - **Property 4: Protected route guard**
    - **Property 5: Auth page guard for authenticated users**
    - **Validates: Requirements FR-4.1, FR-4.2**

- [x] 14. Checkpoint - Ensure all route tests pass
  - All 111 auth tests pass (9 test files)
  - TypeScript passes with no errors

- [x] 15. Implement token expiration handling
  - [x] 15.1 Enhance API client interceptor
    - Handle 401 responses globally
    - Clear auth store on 401
    - Redirect to /login
    - _Requirements: SR-3.5_

  - [x] 15.2 Write property test for token expiration handling
    - **Property 6: Token expiration handling**
    - **Validates: Requirements SR-3.5**

- [x] 16. Implement password field memory clearing
  - [x] 16.1 Update RegisterForm to clear password fields
    - Clear password and confirmPassword after successful submission
    - _Requirements: SR-1.4_

  - [x] 16.2 Update LoginForm to clear password field
    - Clear password after successful submission
    - _Requirements: SR-1.4_

  - [x] 16.3 Write property test for password field clearing
    - **Property 7: Password field memory clearing**
    - **Validates: Requirements SR-1.4**

- [x] 17. Implement terms acceptance validation
  - [x] 17.1 Ensure terms checkbox blocks submission when unchecked
    - Disable submit button or show validation error
    - _Requirements: PCR-1.2_

  - [x] 17.2 Write property test for terms acceptance
    - **Property 8: Terms acceptance requirement**
    - **Validates: Requirements PCR-1.2**

- [x] 18. Final checkpoint - Ensure all tests pass
  - All 135 auth-related tests pass (13 test files)
  - TypeScript passes with no errors
  - Lint passes with no errors (only warnings)
  - Run full test suite: `pnpm test:frontend`
  - Verify no TypeScript errors: `pnpm typecheck:frontend`
  - Verify no lint errors: `pnpm lint:frontend`

## Notes

- All tasks are required for comprehensive implementation
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties (minimum 100 iterations)
- Unit tests validate specific examples and edge cases
- Follow existing patterns from login feature for consistency
- Use Mantine components with existing styling conventions

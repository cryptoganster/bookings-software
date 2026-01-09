# E2E Test Checklist - Auth Backend-Frontend Integration

## Test Environment

- **Frontend URL:** http://localhost:5173
- **Backend URL:** http://localhost:3005
- **Test Framework:** Playwright
- **Test Location:** `apps/frontend/src/features/auth/__tests__/`

## Page Selectors Reference

### Login Page (`/login`)

| Element        | Selector                                               | Type               |
| -------------- | ------------------------------------------------------ | ------------------ |
| Email Input    | `page.getByRole('textbox', { name: 'Email' })`         | textbox            |
| Password Input | `page.getByRole('textbox', { name: 'Contraseña' })`    | textbox (password) |
| Submit Button  | `page.getByRole('button', { name: 'Iniciar Sesión' })` | button             |
| Register Link  | `page.getByRole('link', { name: 'Regístrate' })`       | link               |

### Register Page (`/register`)

| Element                    | Selector                                                                    | Type               |
| -------------------------- | --------------------------------------------------------------------------- | ------------------ |
| Name Input                 | `page.getByRole('textbox', { name: 'Nombre' })`                             | textbox            |
| Email Input                | `page.getByRole('textbox', { name: 'Email' })`                              | textbox            |
| Password Input             | `page.getByRole('textbox', { name: 'Contraseña', exact: true })`            | textbox (password) |
| Confirm Password Input     | `page.getByRole('textbox', { name: 'Confirmar Contraseña' })`               | textbox (password) |
| Terms Checkbox             | `page.getByRole('checkbox', { name: 'Acepto los términos y condiciones' })` | checkbox           |
| Submit Button              | `page.getByRole('button', { name: 'Crear Cuenta' })`                        | button             |
| Login Link                 | `page.getByRole('link', { name: 'Inicia sesión' })`                         | link               |
| Password Strength Status   | `page.getByRole('status', { name: /Fortaleza de contraseña/ })`             | status             |
| Password Strength Progress | `page.getByRole('progressbar', { name: /Fortaleza/ })`                      | progressbar        |

## Test Suites

### 1. Registration Flow Tests (`register.e2e.test.ts`)

#### ✅ Test 1.1: Successful Registration

**Validates:** FR-1.1, FR-1.4, FR-1.5

- [ ] Navigate to `/register`
- [ ] Fill name: "Juan Pérez"
- [ ] Fill email: "juan.perez@example.com"
- [ ] Fill password: "Test123!@#"
- [ ] Fill confirm password: "Test123!@#"
- [ ] Check terms checkbox
- [ ] Click "Crear Cuenta" button
- [ ] Verify success notification appears
- [ ] Verify redirect to `/login`
- [ ] Verify password fields are cleared

#### ✅ Test 1.2: Registration with Existing Email

**Validates:** FR-1.5 (409 error handling)

- [ ] Navigate to `/register`
- [ ] Fill form with email that already exists
- [ ] Submit form
- [ ] Verify error notification: "Este email ya está registrado"
- [ ] Verify user stays on `/register`

#### ✅ Test 1.3: Registration with Invalid Email

**Validates:** VR-1

- [ ] Navigate to `/register`
- [ ] Fill email: "invalid-email"
- [ ] Blur email field
- [ ] Verify error message: "Debe ser un email válido"
- [ ] Verify submit button is disabled

#### ✅ Test 1.4: Registration with Weak Password

**Validates:** VR-2, FR-1.3

- [ ] Navigate to `/register`
- [ ] Fill password: "weak"
- [ ] Verify password strength indicator shows "Débil" (weak)
- [ ] Verify progress bar is red
- [ ] Verify unchecked requirements in checklist
- [ ] Verify validation error on submit

#### ✅ Test 1.5: Registration with Mismatched Passwords

**Validates:** VR-3

- [ ] Navigate to `/register`
- [ ] Fill password: "Test123!@#"
- [ ] Fill confirm password: "Different123!@#"
- [ ] Blur confirm password field
- [ ] Verify error message: "Las contraseñas no coinciden"
- [ ] Verify submit button is disabled

#### ✅ Test 1.6: Registration without Accepting Terms

**Validates:** PCR-1.2

- [ ] Navigate to `/register`
- [ ] Fill all fields correctly
- [ ] Leave terms checkbox unchecked
- [ ] Attempt to submit
- [ ] Verify submit button is disabled OR validation error appears
- [ ] Verify form does not submit

#### ✅ Test 1.7: Password Strength Indicator Updates

**Validates:** FR-1.3

- [ ] Navigate to `/register`
- [ ] Type password: "a" → Verify "Débil" (weak), red
- [ ] Type password: "aA" → Verify "Débil" (weak), red
- [ ] Type password: "aA1" → Verify "Regular" (fair), orange
- [ ] Type password: "aA1!" → Verify "Buena" (good), yellow
- [ ] Type password: "aA1!bB2@" → Verify "Fuerte" (strong), green
- [ ] Verify all checkmarks are green for strong password

#### ✅ Test 1.8: Registration Form Validation (All Fields)

**Validates:** VR-1, VR-2, VR-3, VR-4

- [ ] Navigate to `/register`
- [ ] Submit empty form
- [ ] Verify all required field errors appear
- [ ] Fill name with 1 character → Verify error: "El nombre debe tener al menos 2 caracteres"
- [ ] Fill name with 101 characters → Verify error: "El nombre debe tener máximo 100 caracteres"
- [ ] Fill valid name → Verify error clears

### 2. Login Flow Tests (`login.e2e.test.ts`)

#### ✅ Test 2.1: Successful Login as Business Owner

**Validates:** FR-2.1

- [ ] Navigate to `/login`
- [ ] Fill email: "owner@example.com"
- [ ] Fill password: "Test123!@#"
- [ ] Click "Iniciar Sesión"
- [ ] Verify redirect to `/` (dashboard)
- [ ] Verify user is authenticated (check auth store)
- [ ] Verify password field is cleared

#### ✅ Test 2.2: Successful Login as Customer

**Validates:** FR-2.1

- [ ] Navigate to `/login`
- [ ] Fill email: "customer@example.com"
- [ ] Fill password: "Test123!@#"
- [ ] Click "Iniciar Sesión"
- [ ] Verify redirect to `/my-appointments`
- [ ] Verify user is authenticated

#### ✅ Test 2.3: Login with Invalid Credentials

**Validates:** FR-2.2

- [ ] Navigate to `/login`
- [ ] Fill email: "wrong@example.com"
- [ ] Fill password: "WrongPassword123!"
- [ ] Click "Iniciar Sesión"
- [ ] Verify error notification: "Email o contraseña incorrectos"
- [ ] Verify user stays on `/login`
- [ ] Verify not authenticated

#### ✅ Test 2.4: Login with Empty Fields

**Validates:** VR-1, VR-2

- [ ] Navigate to `/login`
- [ ] Click "Iniciar Sesión" without filling fields
- [ ] Verify validation errors appear
- [ ] Verify form does not submit

### 3. Navigation Tests (`navigation.e2e.test.ts`)

#### ✅ Test 3.1: Navigate from Login to Register

**Validates:** FR-1.6

- [ ] Navigate to `/login`
- [ ] Click "Regístrate" link
- [ ] Verify redirect to `/register`
- [ ] Verify register form is displayed

#### ✅ Test 3.2: Navigate from Register to Login

**Validates:** FR-1.6

- [ ] Navigate to `/register`
- [ ] Click "Inicia sesión" link
- [ ] Verify redirect to `/login`
- [ ] Verify login form is displayed

### 4. Protected Route Tests (`protected-routes.e2e.test.ts`)

#### ✅ Test 4.1: Unauthenticated User Accessing Protected Route

**Validates:** FR-4.1

- [ ] Clear auth state (logout)
- [ ] Navigate to `/` (dashboard)
- [ ] Verify redirect to `/login`
- [ ] Verify not authenticated

#### ✅ Test 4.2: Authenticated User Accessing Login Page

**Validates:** FR-4.2

- [ ] Login as business owner
- [ ] Navigate to `/login`
- [ ] Verify redirect to `/` (dashboard)

#### ✅ Test 4.3: Authenticated User Accessing Register Page

**Validates:** FR-4.2

- [ ] Login as business owner
- [ ] Navigate to `/register`
- [ ] Verify redirect to `/` (dashboard)

### 5. Token Expiration Tests (`token-expiration.e2e.test.ts`)

#### ✅ Test 5.1: API Request with Expired Token

**Validates:** SR-3.5

- [ ] Login successfully
- [ ] Mock API to return 401 for next request
- [ ] Trigger an API call
- [ ] Verify redirect to `/login`
- [ ] Verify auth state is cleared
- [ ] Verify localStorage is cleared

### 6. Security Tests (`security.e2e.test.ts`)

#### ✅ Test 6.1: Password Fields are Masked

**Validates:** SR-1.1

- [ ] Navigate to `/register`
- [ ] Type in password field
- [ ] Verify input type is "password" (masked)
- [ ] Click show/hide button
- [ ] Verify input type changes to "text" (visible)

#### ✅ Test 6.2: Password Not Logged in Console

**Validates:** SR-1.2

- [ ] Navigate to `/register`
- [ ] Fill password field
- [ ] Submit form
- [ ] Check browser console logs
- [ ] Verify password value is not present in logs

#### ✅ Test 6.3: Password Cleared After Submission

**Validates:** SR-1.4

- [ ] Navigate to `/register`
- [ ] Fill form and submit successfully
- [ ] Verify password fields are empty
- [ ] Check form state
- [ ] Verify password values are not retained

### 7. Accessibility Tests (`accessibility.e2e.test.ts`)

#### ✅ Test 7.1: Form Labels and ARIA Attributes

**Validates:** NFR-3.1

- [ ] Navigate to `/register`
- [ ] Verify all inputs have associated labels
- [ ] Verify password strength indicator has aria-label
- [ ] Verify submit button has aria-busy during loading
- [ ] Run axe accessibility scan
- [ ] Verify no critical accessibility violations

#### ✅ Test 7.2: Keyboard Navigation

**Validates:** NFR-3.1

- [ ] Navigate to `/register`
- [ ] Tab through all form fields
- [ ] Verify focus order is logical
- [ ] Verify all interactive elements are reachable
- [ ] Submit form using Enter key
- [ ] Verify form submits correctly

### 8. Responsive Design Tests (`responsive.e2e.test.ts`)

#### ✅ Test 8.1: Mobile View (375px width)

**Validates:** NFR-4.1

- [ ] Set viewport to 375px width
- [ ] Navigate to `/register`
- [ ] Verify image column is hidden
- [ ] Verify form is fully visible
- [ ] Verify all fields are accessible
- [ ] Submit form successfully

#### ✅ Test 8.2: Tablet View (768px width)

**Validates:** NFR-4.1

- [ ] Set viewport to 768px width
- [ ] Navigate to `/register`
- [ ] Verify layout adapts correctly
- [ ] Verify form is usable

#### ✅ Test 8.3: Desktop View (1920px width)

**Validates:** NFR-4.1

- [ ] Set viewport to 1920px width
- [ ] Navigate to `/register`
- [ ] Verify two-column layout is displayed
- [ ] Verify image is visible
- [ ] Verify form is properly sized

## Test Data

### Valid Test Users

```typescript
const validUsers = {
  businessOwner: {
    email: "owner@example.com",
    password: "Test123!@#",
    name: "Business Owner",
    role: "BUSINESS_OWNER",
  },
  customer: {
    email: "customer@example.com",
    password: "Test123!@#",
    name: "Customer User",
    role: "CUSTOMER",
  },
};
```

### Invalid Test Data

```typescript
const invalidData = {
  weakPasswords: ["weak", "12345678", "password", "UPPERCASE", "lowercase123"],
  invalidEmails: ["invalid", "test@", "@example.com", "test @example.com"],
  shortName: "A",
  longName: "A".repeat(101),
  existingEmail: "existing@example.com",
};
```

## Test Execution Order

1. Run registration tests first (creates test users)
2. Run login tests (uses created users)
3. Run navigation tests
4. Run protected route tests
5. Run token expiration tests
6. Run security tests
7. Run accessibility tests
8. Run responsive tests

## Notes

- All tests should clean up after themselves (delete test users if possible)
- Use unique emails for each test run to avoid conflicts
- Mock backend responses when testing error scenarios
- Use Playwright's `page.waitForURL()` for navigation assertions
- Use Playwright's `page.waitForSelector()` for element visibility
- Capture screenshots on test failures for debugging
- Run tests in headless mode for CI/CD
- Run tests in headed mode for local development/debugging

## Success Criteria

- ✅ All 40+ E2E tests pass
- ✅ No accessibility violations (axe scan)
- ✅ All user flows work end-to-end
- ✅ Error handling works correctly
- ✅ Security requirements are met
- ✅ Responsive design works on all viewports

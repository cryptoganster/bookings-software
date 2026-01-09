# Auth Backend-Frontend Integration - Design Document

## Overview

This design document describes the architecture and implementation approach for completing the authentication integration between the backend Auth BC and the frontend. The implementation follows Feature-Sliced Design (FSD) architecture and leverages existing patterns from the login feature.

## Architecture

### High-Level Component Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              Frontend                                    │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────────────┐  │
│  │  LoginPage  │    │ RegisterPage│    │      ProtectedRoute         │  │
│  │  (exists)   │    │  (new)      │    │      (exists - enhance)     │  │
│  └──────┬──────┘    └──────┬──────┘    └─────────────────────────────┘  │
│         │                  │                                             │
│  ┌──────▼──────┐    ┌──────▼──────┐                                     │
│  │  LoginForm  │    │RegisterForm │                                     │
│  │  (exists)   │    │   (new)     │                                     │
│  └──────┬──────┘    └──────┬──────┘                                     │
│         │                  │                                             │
│         │           ┌──────▼──────────────┐                             │
│         │           │PasswordStrength     │                             │
│         │           │ Indicator (new)     │                             │
│         │           └─────────────────────┘                             │
│         │                  │                                             │
│  ┌──────▼──────┐    ┌──────▼──────┐                                     │
│  │  useLogin   │    │ useRegister │                                     │
│  │  (exists)   │    │   (new)     │                                     │
│  └──────┬──────┘    └──────┬──────┘                                     │
│         │                  │                                             │
│  ┌──────▼──────┐    ┌──────▼──────┐                                     │
│  │  loginApi   │    │ registerApi │                                     │
│  │  (exists)   │    │   (new)     │                                     │
│  └──────┬──────┘    └──────┬──────┘                                     │
│         │                  │                                             │
│         └────────┬─────────┘                                             │
│                  │                                                       │
│           ┌──────▼──────┐                                               │
│           │  apiClient  │ ◄─── JWT Interceptor (exists)                 │
│           │  (exists)   │                                               │
│           └──────┬──────┘                                               │
│                  │                                                       │
├──────────────────┼───────────────────────────────────────────────────────┤
│                  │              Backend (Auth BC)                        │
│           ┌──────▼──────┐                                               │
│           │AuthController│                                               │
│           │  (exists)   │                                               │
│           └─────────────┘                                               │
│           POST /auth/register                                           │
│           POST /auth/login                                              │
└─────────────────────────────────────────────────────────────────────────┘
```

### Data Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        Registration Flow                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  User Input ──► Zod Validation ──► useRegister ──► registerApi          │
│       │              │                   │              │                │
│       │              │                   │              ▼                │
│       │              │                   │      POST /auth/register      │
│       │              │                   │              │                │
│       │              │                   │              ▼                │
│       │              │                   │      Success: { userId }      │
│       │              │                   │              │                │
│       │              │                   ▼              │                │
│       │              │           Show notification      │                │
│       │              │           Navigate to /login ◄───┘                │
│       │              │                                                   │
│       ▼              ▼                                                   │
│  PasswordStrength   Error messages                                       │
│  Indicator          displayed                                            │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                          Login Flow                                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  User Input ──► Zod Validation ──► useLogin ──► loginApi                │
│                                        │            │                    │
│                                        │            ▼                    │
│                                        │    POST /auth/login             │
│                                        │            │                    │
│                                        │            ▼                    │
│                                        │    { user, token }              │
│                                        │            │                    │
│                                        ▼            │                    │
│                                 authStore.login() ◄─┘                    │
│                                        │                                 │
│                                        ▼                                 │
│                              Role-based redirect                         │
│                              ┌─────────┴─────────┐                       │
│                              │                   │                       │
│                              ▼                   ▼                       │
│                    BUSINESS_OWNER: /      CUSTOMER: /my-appointments     │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. RegisterPage Component

**Location:** `apps/frontend/src/pages/RegisterPage/ui/RegisterPage.tsx`

**Purpose:** Page component for user registration with two-column layout matching LoginPage.

**Props:** None (page component)

**Behavior:**

- Renders two-column layout (form left, image right)
- Redirects to dashboard if user is already authenticated
- Responsive: hides image on mobile

```typescript
interface RegisterPageProps {
  // No props - page component
}

// Internal state managed by child components
```

### 2. RegisterForm Component

**Location:** `apps/frontend/src/features/auth/register/ui/RegisterForm.tsx`

**Purpose:** Registration form with validation and password strength indicator.

**Props:** None (self-contained form)

**Internal State:**

- Form state via React Hook Form
- Password strength calculation
- Loading state from useRegister mutation
- Terms acceptance checkbox state

```typescript
interface RegisterFormState {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
  acceptTerms: boolean;
}
```

### 3. PasswordStrengthIndicator Component

**Location:** `apps/frontend/src/features/auth/register/ui/PasswordStrengthIndicator.tsx`

**Purpose:** Visual feedback for password strength with checklist.

**Props:**

```typescript
interface PasswordStrengthIndicatorProps {
  password: string;
}
```

**Strength Levels:**

```typescript
type StrengthLevel = "weak" | "fair" | "good" | "strong";

interface StrengthResult {
  level: StrengthLevel;
  score: number; // 0-5
  checks: {
    minLength: boolean; // >= 8 chars
    hasUppercase: boolean; // [A-Z]
    hasLowercase: boolean; // [a-z]
    hasNumber: boolean; // [0-9]
    hasSpecial: boolean; // [!@#$%^&*(),.?":{}|<>]
  };
}
```

**Color Mapping:**

- weak (0-1): red
- fair (2): orange
- good (3-4): yellow
- strong (5): green

### 4. useRegister Hook

**Location:** `apps/frontend/src/features/auth/register/model/useRegister.ts`

**Purpose:** TanStack Query mutation for registration API call.

```typescript
interface UseRegisterReturn {
  mutate: (data: RegisterFormData) => void;
  mutateAsync: (data: RegisterFormData) => Promise<RegisterResponse>;
  isPending: boolean;
  isError: boolean;
  error: AxiosError<ApiErrorDto> | null;
}
```

**Behavior:**

- Calls POST /auth/register
- On success: shows notification, navigates to /login
- On error: shows appropriate error notification

### 5. registerApi

**Location:** `apps/frontend/src/features/auth/register/api/registerApi.ts`

**Purpose:** API client function for registration endpoint.

```typescript
interface RegisterDto {
  email: string;
  password: string;
  name: string;
}

interface RegisterResponse {
  userId: string;
}

const registerApi = {
  register: (data: RegisterDto) => Promise<RegisterResponse>;
};
```

### 6. registerSchema (Zod)

**Location:** `apps/frontend/src/features/auth/register/model/schema.ts`

**Purpose:** Form validation schema with all rules.

```typescript
const registerSchema = z
  .object({
    email: z
      .string()
      .min(1, "El email es requerido")
      .email("Debe ser un email válido"),

    password: z
      .string()
      .min(8, "La contraseña debe tener al menos 8 caracteres")
      .regex(/[A-Z]/, "La contraseña debe contener al menos una mayúscula")
      .regex(/[a-z]/, "La contraseña debe contener al menos una minúscula")
      .regex(/[0-9]/, "La contraseña debe contener al menos un número")
      .regex(
        /[!@#$%^&*(),.?":{}|<>]/,
        "La contraseña debe contener al menos un carácter especial",
      ),

    confirmPassword: z.string().min(1, "Confirma tu contraseña"),

    name: z
      .string()
      .min(2, "El nombre debe tener al menos 2 caracteres")
      .max(100, "El nombre debe tener máximo 100 caracteres"),

    acceptTerms: z
      .boolean()
      .refine(
        (val) => val === true,
        "Debes aceptar los términos y condiciones",
      ),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;
```

## Data Models

### Frontend Types (from @packages/shared-types)

```typescript
// Already exists
interface UserDto {
  id: string;
  email: string;
  name: string;
  roles: UserRole[];
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
}

interface LoginRequestDto {
  email: string;
  password: string;
}

interface LoginResponseDto {
  user: UserDto;
  token: string;
}

interface RegisterRequestDto {
  email: string;
  password: string;
  name: string;
}

interface RegisterResponseDto {
  userId: string;
}

type UserRole = "BUSINESS_OWNER" | "CUSTOMER" | "ADMIN";
```

### Auth Store State (exists)

```typescript
interface AuthState {
  user: UserDto | null;
  token: string | null;
  businessId: string | null;
  isAuthenticated: boolean;

  login: (user: UserDto, token: string, businessId?: string | null) => void;
  updateBusinessId: (businessId: string) => void;
  logout: () => void;
}
```

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Property 1: Password Strength Calculation Determinism

_For any_ password string, calling the `calculatePasswordStrength` function multiple times with the same input SHALL always return the same `StrengthResult` object with identical `level`, `score`, and `checks` values.

**Validates: Requirements FR-1.3, VR-2**

### Property 2: Form Validation Consistency

_For any_ form input values (email, password, confirmPassword, name), the Zod schema validation SHALL produce consistent results across multiple validations of the same input, and the validation result SHALL correctly identify all violations of the validation rules.

**Validates: Requirements VR-1, VR-2, VR-3, VR-4**

### Property 3: Role-Based Redirection Correctness

_For any_ authenticated user with a valid role array, after successful login the system SHALL redirect to:

- `/` (dashboard) if roles include `BUSINESS_OWNER`
- `/my-appointments` if roles include only `CUSTOMER`
- `/admin` if roles include only `ADMIN`

**Validates: Requirements FR-2.1**

### Property 4: Protected Route Guard

_For any_ protected route path and _for any_ unauthenticated state (isAuthenticated = false), attempting to access the route SHALL result in a redirect to `/login`.

**Validates: Requirements FR-4.1**

### Property 5: Auth Page Guard for Authenticated Users

_For any_ authenticated user (isAuthenticated = true) with _any_ valid role, accessing `/login` or `/register` SHALL result in a redirect to the appropriate dashboard based on their role.

**Validates: Requirements FR-4.2**

### Property 6: Token Expiration Handling

_For any_ API request that returns HTTP 401 (Unauthorized), the system SHALL:

1. Clear the auth store state (user, token, businessId, isAuthenticated)
2. Remove auth data from localStorage
3. Redirect to `/login`

**Validates: Requirements SR-3.5**

### Property 7: Password Field Memory Clearing

_For any_ successful form submission (login or register), the password input fields SHALL be cleared from the DOM and the form state SHALL not retain password values.

**Validates: Requirements SR-1.4**

### Property 8: Terms Acceptance Requirement

_For any_ registration form state where `acceptTerms` is false, the form SHALL NOT submit and the submit button SHALL be disabled or the form validation SHALL fail.

**Validates: Requirements PCR-1.2**

## Error Handling

### API Error Mapping

| HTTP Status | Error Type          | User Message (Spanish)                                   |
| ----------- | ------------------- | -------------------------------------------------------- |
| 400         | Validation Error    | Display field-specific errors from response              |
| 401         | Invalid Credentials | "Email o contraseña incorrectos"                         |
| 403         | Account Inactive    | "Tu cuenta está desactivada. Contacta al administrador." |
| 409         | Email Exists        | "Este email ya está registrado"                          |
| 429         | Rate Limited        | "Demasiados intentos. Intenta más tarde."                |
| 500+        | Server Error        | "Error del servidor. Intenta más tarde."                 |

### Error Handling Strategy

```typescript
// In useRegister hook
onError: (error: AxiosError<ApiErrorDto>) => {
  let errorMessage = "Error al registrarse. Intenta nuevamente.";

  if (error.response?.status === 409) {
    errorMessage = "Este email ya está registrado";
  } else if (error.response?.status === 400) {
    const serverMessage = error.response.data?.message;
    errorMessage = Array.isArray(serverMessage)
      ? serverMessage.join(", ")
      : serverMessage || errorMessage;
  } else if (error.response?.status === 429) {
    errorMessage = "Demasiados intentos. Intenta más tarde.";
  }

  notifications.show({
    title: "Error de registro",
    message: errorMessage,
    color: "red",
  });
};
```

### Form Validation Error Display

- Field-level errors displayed below each input using Mantine's `error` prop
- Real-time validation feedback as user types (debounced)
- Password strength indicator updates on every keystroke
- Confirm password validation triggers when either password field changes

## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests for comprehensive coverage:

- **Unit tests**: Verify specific examples, edge cases, and error conditions
- **Property tests**: Verify universal properties across all inputs using fast-check

### Unit Tests

#### Component Tests (Vitest + React Testing Library)

1. **RegisterForm.test.tsx**
   - Renders all required fields (email, password, confirmPassword, name, acceptTerms)
   - Displays validation errors for invalid inputs
   - Disables submit button when form is invalid or loading
   - Clears password fields after successful submission
   - Shows loading state during submission

2. **PasswordStrengthIndicator.test.tsx**
   - Displays correct strength level for various passwords
   - Shows all requirement checkmarks correctly
   - Updates in real-time as password changes
   - Has correct aria-label for accessibility

3. **RegisterPage.test.tsx**
   - Renders two-column layout on desktop
   - Hides image column on mobile
   - Redirects to dashboard if already authenticated
   - Contains link to login page

#### Hook Tests

4. **useRegister.test.ts**
   - Calls registerApi with correct data
   - Shows success notification on success
   - Navigates to /login on success
   - Shows error notification on failure
   - Handles 409 (email exists) error correctly

#### Integration Tests (MSW)

5. **Registration Flow Integration**
   - Complete registration flow with valid data
   - Registration with existing email shows error
   - Registration with invalid data shows validation errors

### Property-Based Tests (fast-check)

**Configuration:** Minimum 100 iterations per property test

6. **Password Strength Properties (schema.pbt.test.ts)**
   - **Property 1**: Password strength calculation is deterministic
   - Tag: `Feature: auth-backend-frontend-integration, Property 1: Password strength determinism`

7. **Form Validation Properties (schema.pbt.test.ts)**
   - **Property 2**: Form validation is consistent
   - Tag: `Feature: auth-backend-frontend-integration, Property 2: Form validation consistency`

8. **Route Guard Properties (ProtectedRoute.pbt.test.ts)**
   - **Property 4**: Protected routes redirect unauthenticated users
   - **Property 5**: Auth pages redirect authenticated users
   - Tags: `Feature: auth-backend-frontend-integration, Property 4/5`

### Test File Structure

```
apps/frontend/src/
├── features/
│   └── auth/
│       └── register/
│           ├── __tests__/
│           │   ├── RegisterForm.test.tsx
│           │   ├── PasswordStrengthIndicator.test.tsx
│           │   ├── useRegister.test.ts
│           │   └── schema.pbt.test.ts          # Property-based tests
│           └── ...
├── pages/
│   └── RegisterPage/
│       └── __tests__/
│           └── RegisterPage.test.tsx
└── app/
    └── router/
        └── __tests__/
            └── ProtectedRoute.pbt.test.ts      # Property-based tests
```

### Testing Libraries

- **Vitest**: Test runner (configured in project)
- **React Testing Library**: Component testing
- **MSW (Mock Service Worker)**: API mocking
- **fast-check**: Property-based testing library

## File Structure (Implementation)

```
apps/frontend/src/
├── features/
│   └── auth/
│       ├── login/                    # ✅ Exists
│       │   ├── api/
│       │   │   └── loginApi.ts
│       │   ├── model/
│       │   │   ├── schema.ts
│       │   │   └── useLogin.ts       # Enhance: role-based redirect
│       │   ├── ui/
│       │   │   └── LoginForm.tsx     # Enhance: add register link
│       │   └── index.ts
│       ├── register/                 # ❌ NEW
│       │   ├── api/
│       │   │   └── registerApi.ts
│       │   ├── model/
│       │   │   ├── schema.ts
│       │   │   ├── useRegister.ts
│       │   │   └── passwordStrength.ts
│       │   ├── ui/
│       │   │   ├── RegisterForm.tsx
│       │   │   └── PasswordStrengthIndicator.tsx
│       │   ├── __tests__/
│       │   │   ├── RegisterForm.test.tsx
│       │   │   ├── PasswordStrengthIndicator.test.tsx
│       │   │   ├── useRegister.test.ts
│       │   │   └── schema.pbt.test.ts
│       │   └── index.ts
│       └── logout/                   # ✅ Exists
├── pages/
│   ├── LoginPage/                    # ✅ Exists
│   │   └── ui/
│   │       └── LoginPage.tsx         # Enhance: add register link
│   └── RegisterPage/                 # ❌ NEW
│       ├── ui/
│       │   └── RegisterPage.tsx
│       ├── __tests__/
│       │   └── RegisterPage.test.tsx
│       └── index.ts
└── app/
    └── router/
        ├── routes.tsx                # Enhance: add /register route
        └── ProtectedRoute.tsx        # Enhance: role-based redirect
```

## Implementation Notes

### Mantine Components Used

- `Paper` - Form container with shadow and border
- `TextInput` - Email and name fields
- `PasswordInput` - Password and confirm password fields
- `Checkbox` - Terms acceptance
- `Button` - Submit button with loading state
- `Progress` - Password strength bar
- `List` - Password requirements checklist
- `Text` - Labels and messages
- `Anchor` - Navigation links
- `Stack` - Vertical layout
- `Grid` - Two-column layout

### Styling Conventions (from existing LoginForm)

- `Paper`: `withBorder`, `shadow="xl"`, `p={30}`, `radius="xl"`, `maxWidth: 420`
- `TextInput/PasswordInput`: `size="md"`, `radius="xl"`
- `Button`: `color="brandGreen"`, `radius="xl"`, `fullWidth`

### Accessibility Requirements

- All inputs have associated labels via `label` prop
- Error messages use `aria-live="polite"` (handled by Mantine)
- Password strength indicator has `aria-label` with current level
- Submit button has `aria-busy="true"` during loading
- Focus management after form submission

### Security Considerations

- Password fields use `PasswordInput` (masked by default)
- Passwords never logged (logger excludes password fields)
- Form state cleared after successful submission
- HTTPS enforced for all API calls (via apiClient baseURL)

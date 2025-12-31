# UI Documentation - Authentication

**Versión:** 1.0  
**Fecha:** December 30, 2025  
**Rutas:** `/login`, `/register`  
**Roles Permitidos:** `PUBLIC` (no authentication required)

---

## 1. Visión General

**Propósito:** Proporcionar interfaces de usuario para registro de nuevos usuarios y autenticación de usuarios existentes en la plataforma.

**Casos de Uso Principales:**

- Registro de nuevos business owners con plan FREE
- Login de usuarios existentes (business owners, customers, admins)
- Gestión de sesión con JWT tokens
- Redirección post-autenticación según rol del usuario

**Navegación:**

- Desde: Landing page, cualquier ruta protegida (redirect)
- Hacia:
  - `/dashboard` (BUSINESS_OWNER)
  - `/my-appointments` (CUSTOMER)
  - `/admin` (ADMIN)

---

## 2. Estructura de las Vistas

### 2.1 Login Page Layout

```
┌─────────────────────────────────────────────────────────┐
│  Logo / Brand                                           │
├─────────────────────────────────────────────────────────┤
│                                                         │
│              Iniciar Sesión                             │
│                                                         │
│  ┌───────────────────────────────────────────────┐     │
│  │ Email                                         │     │
│  │ [user@example.com                    ]        │     │
│  └───────────────────────────────────────────────┘     │
│                                                         │
│  ┌───────────────────────────────────────────────┐     │
│  │ Contraseña                                    │     │
│  │ [••••••••••••                        ] [👁]   │     │
│  └───────────────────────────────────────────────┘     │
│                                                         │
│  [ ] Recordarme                                         │
│                                                         │
│  [        Iniciar Sesión        ]                       │
│                                                         │
│  ¿Olvidaste tu contraseña?                              │
│                                                         │
│  ¿No tienes cuenta? Regístrate                          │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 2.2 Register Page Layout

```
┌─────────────────────────────────────────────────────────┐
│  Logo / Brand                                           │
├─────────────────────────────────────────────────────────┤
│                                                         │
│              Crear Cuenta                               │
│                                                         │
│  ┌───────────────────────────────────────────────┐     │
│  │ Nombre Completo                               │     │
│  │ [Juan Pérez                          ]        │     │
│  └───────────────────────────────────────────────┘     │
│                                                         │
│  ┌───────────────────────────────────────────────┐     │
│  │ Email                                         │     │
│  │ [juan@example.com                    ]        │     │
│  └───────────────────────────────────────────────┘     │
│                                                         │
│  ┌───────────────────────────────────────────────┐     │
│  │ Contraseña                                    │     │
│  │ [••••••••••••                        ] [👁]   │     │
│  └───────────────────────────────────────────────┘     │
│                                                         │
│  Fortaleza: ████████░░ Fuerte                           │
│                                                         │
│  [ ] Acepto términos y condiciones                      │
│                                                         │
│  [        Crear Cuenta        ]                         │
│                                                         │
│  ¿Ya tienes cuenta? Inicia sesión                       │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 2.3 Responsive Behavior

**Desktop (> 1024px):**

- Layout centrado con max-width 450px
- Formulario con espaciado amplio
- Logo grande en la parte superior
- Ilustración decorativa opcional en el lado

**Tablet (768px - 1024px):**

- Layout centrado con max-width 400px
- Formulario con espaciado medio
- Logo mediano

**Mobile (< 768px):**

- Layout full-width con padding lateral
- Formulario compacto
- Logo pequeño
- Botones full-width

---

## 3. Componentes y Widgets

### 3.1 LoginForm Component

**Elementos:**

- Título: `Iniciar Sesión`
- Email input con validación
- Password input con toggle visibility
- Checkbox "Recordarme" (opcional)
- Botón submit
- Link a "Olvidaste tu contraseña" (futuro)
- Link a página de registro

**Ubicación:** `apps/frontend/src/features/auth/login/ui/LoginForm.tsx`

### 3.2 RegisterForm Component

**Elementos:**

- Título: `Crear Cuenta`
- Name input
- Email input con validación
- Password input con:
  - Toggle visibility
  - Indicador de fortaleza
  - Requisitos visibles
- Checkbox términos y condiciones
- Botón submit
- Link a página de login

**Ubicación:** `apps/frontend/src/features/auth/register/ui/RegisterForm.tsx`

### 3.3 Password Strength Indicator

**Niveles:**

| Nivel      | Color  | Barras | Criterios                                       |
| ---------- | ------ | ------ | ----------------------------------------------- |
| Muy Débil  | red    | ██░░░░ | < 6 caracteres                                  |
| Débil      | orange | ███░░░ | 6-7 caracteres                                  |
| Aceptable  | yellow | ████░░ | 8+ caracteres                                   |
| Fuerte     | green  | █████░ | 8+ caracteres + mayúsculas + números            |
| Muy Fuerte | green  | ██████ | 8+ caracteres + mayúsculas + números + símbolos |

**Requisitos Mínimos:**

- ✅ Mínimo 8 caracteres
- ✅ Al menos una mayúscula (recomendado)
- ✅ Al menos un número (recomendado)
- ✅ Al menos un símbolo (opcional)

### 3.4 Auth Layout Component

**Elementos:**

- Logo/Brand centrado
- Contenedor del formulario
- Footer con links legales
- Ilustración decorativa (opcional)

**Ubicación:** `apps/frontend/src/app/layouts/AuthLayout.tsx`

---

## 4. Acciones y Botones

### 4.1 Login Action

**Botón: Iniciar Sesión**

- **Ubicación:** `LoginForm`
- **Tipo:** `primary`
- **Icono:** `IconLogin` (opcional)
- **Acción:** Autenticar usuario y obtener JWT token
- **Endpoint:** `POST /api/auth/login`
- **Payload:**
  ```json
  {
    "email": "user@example.com",
    "password": "SecurePassword123"
  }
  ```
- **Confirmación:** No
- **Success:**
  - Guardar token en localStorage/cookie
  - Actualizar auth store (Zustand)
  - Redireccionar según rol:
    - BUSINESS_OWNER → `/dashboard`
    - CUSTOMER → `/my-appointments`
    - ADMIN → `/admin`
- **Error:**
  - 401: "Email o contraseña incorrectos"
  - 403: "Tu cuenta está desactivada. Contacta soporte."
  - 500: "Error del servidor. Intenta nuevamente."

### 4.2 Register Action

**Botón: Crear Cuenta**

- **Ubicación:** `RegisterForm`
- **Tipo:** `primary`
- **Icono:** `IconUserPlus` (opcional)
- **Acción:** Registrar nuevo usuario con rol BUSINESS_OWNER
- **Endpoint:** `POST /api/auth/register`
- **Payload:**
  ```json
  {
    "email": "user@example.com",
    "password": "SecurePassword123",
    "name": "Juan Pérez",
    "initialRole": "BUSINESS_OWNER"
  }
  ```
- **Confirmación:** No
- **Success:**
  - Guardar token en localStorage/cookie
  - Actualizar auth store
  - Mostrar mensaje: "¡Cuenta creada exitosamente!"
  - Redireccionar a `/onboarding` (Account BC)
- **Error:**
  - 400: Mostrar errores de validación específicos
  - 409: "Este email ya está registrado"
  - 500: "Error del servidor. Intenta nuevamente."

### 4.3 Toggle Password Visibility

**Botón: Mostrar/Ocultar Contraseña**

- **Ubicación:** `Password input`
- **Tipo:** `icon button`
- **Icono:** `IconEye` / `IconEyeOff`
- **Acción:** Toggle input type entre "password" y "text"
- **Endpoint:** N/A (solo UI)

### 4.4 Logout Action (en otras vistas)

**Botón: Cerrar Sesión**

- **Ubicación:** `Header / User Menu`
- **Tipo:** `secondary`
- **Icono:** `IconLogout`
- **Acción:** Cerrar sesión del usuario
- **Endpoint:** N/A (client-side)
- **Confirmación:** Opcional: "¿Estás seguro que deseas cerrar sesión?"
- **Success:**
  - Eliminar token de localStorage/cookie
  - Limpiar auth store
  - Redireccionar a `/login`

---

## 5. Integraciones con API

### 5.1 Endpoints Utilizados

**Referencia:** Ver `docs/api/auth.md`

| Endpoint             | Método | Propósito               | Usado en     |
| -------------------- | ------ | ----------------------- | ------------ |
| `/api/auth/login`    | POST   | Autenticar usuario      | LoginForm    |
| `/api/auth/register` | POST   | Registrar nuevo usuario | RegisterForm |

### 5.2 Queries (TanStack Query)

No se usan queries en las vistas de autenticación (solo mutations).

### 5.3 Mutations (TanStack Query)

**Mutation: Login**

```typescript
// Hook: useLogin
// Ubicación: apps/frontend/src/features/auth/login/model/useLogin.ts

import { useMutation } from "@tanstack/react-query";
import { useAuthStore } from "@app/store/auth";
import { apiClient } from "@shared/api/client";
import type { LoginDto, LoginResponseDto } from "@packages/shared-types";

export function useLogin() {
  const { login } = useAuthStore();

  return useMutation({
    mutationFn: async (data: LoginDto) => {
      const response = await apiClient.post<LoginResponseDto>(
        "/auth/login",
        data,
      );
      return response.data;
    },
    onSuccess: (data) => {
      // Guardar token y user en store
      login(data.user, data.token);

      // Redireccionar según rol
      const primaryRole = data.user.roles[0];
      if (primaryRole === "BUSINESS_OWNER") {
        window.location.href = "/dashboard";
      } else if (primaryRole === "CUSTOMER") {
        window.location.href = "/my-appointments";
      } else if (primaryRole === "ADMIN") {
        window.location.href = "/admin";
      }
    },
    onError: (error: any) => {
      // Manejar errores específicos
      if (error.response?.status === 401) {
        // Mostrar toast: "Email o contraseña incorrectos"
      } else if (error.response?.status === 403) {
        // Mostrar toast: "Tu cuenta está desactivada"
      } else {
        // Mostrar toast: "Error del servidor"
      }
    },
  });
}
```

**Mutation: Register**

```typescript
// Hook: useRegister
// Ubicación: apps/frontend/src/features/auth/register/model/useRegister.ts

import { useMutation } from "@tanstack/react-query";
import { useAuthStore } from "@app/store/auth";
import { apiClient } from "@shared/api/client";
import type { RegisterDto, RegisterResponseDto } from "@packages/shared-types";

export function useRegister() {
  const { login } = useAuthStore();

  return useMutation({
    mutationFn: async (data: RegisterDto) => {
      const response = await apiClient.post<RegisterResponseDto>(
        "/auth/register",
        data,
      );
      return response.data;
    },
    onSuccess: (data) => {
      // Guardar token en store (user se obtiene del token)
      // Por ahora solo guardamos el token
      // TODO: Decodificar JWT para obtener user info

      // Mostrar notificación de éxito
      // Redireccionar a onboarding
      window.location.href = "/onboarding";
    },
    onError: (error: any) => {
      // Manejar errores específicos
      if (error.response?.status === 409) {
        // Mostrar toast: "Este email ya está registrado"
      } else if (error.response?.status === 400) {
        // Mostrar errores de validación
        const messages = error.response?.data?.message;
        if (Array.isArray(messages)) {
          // Mostrar cada error de validación
        }
      } else {
        // Mostrar toast: "Error del servidor"
      }
    },
  });
}
```

### 5.4 Optimistic Updates

No se usan optimistic updates en autenticación (operaciones críticas que requieren confirmación del servidor).

---

## 6. Estado y Formularios

### 6.1 Estado Local (useState)

**Estado: showPassword**

- **Propósito:** Controlar visibilidad de la contraseña
- **Tipo:** `boolean`
- **Valor inicial:** `false`
- **Usado en:** `LoginForm`, `RegisterForm`

**Estado: passwordStrength**

- **Propósito:** Calcular fortaleza de la contraseña
- **Tipo:** `{ score: number; label: string; color: string }`
- **Valor inicial:** `{ score: 0, label: 'Muy Débil', color: 'red' }`
- **Usado en:** `RegisterForm`

### 6.2 Estado Global (Zustand)

**Store: AuthStore**

- **Propósito:** Gestionar estado de autenticación global
- **Ubicación:** `apps/frontend/src/app/store/auth.ts`
- **Estado:**
  ```typescript
  {
    user: UserDto | null;
    token: string | null;
    isAuthenticated: boolean;
  }
  ```
- **Acciones:**
  - `login(user: UserDto, token: string)`: Guardar usuario y token
  - `logout()`: Limpiar estado y eliminar token
  - `updateUser(user: UserDto)`: Actualizar información del usuario

**Implementación:**

```typescript
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { UserDto } from "@packages/shared-types";

interface AuthState {
  user: UserDto | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: UserDto, token: string) => void;
  logout: () => void;
  updateUser: (user: UserDto) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: (user, token) => {
        set({ user, token, isAuthenticated: true });
        // Guardar token en localStorage para axios interceptor
        localStorage.setItem("auth-token", token);
      },

      logout: () => {
        set({ user: null, token: null, isAuthenticated: false });
        localStorage.removeItem("auth-token");
      },

      updateUser: (user) => {
        set({ user });
      },
    }),
    {
      name: "auth-storage",
      // Solo persistir user e isAuthenticated, no el token
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
```

### 6.3 Formularios (React Hook Form + Zod)

**Formulario: LoginForm**

**Schema de Validación:**

```typescript
import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().min(1, "El email es requerido").email("Email inválido"),
  password: z.string().min(1, "La contraseña es requerida"),
  rememberMe: z.boolean().optional(),
});

export type LoginFormData = z.infer<typeof loginSchema>;
```

**Campos:**

| Campo      | Tipo     | Validación           | Placeholder      | Default |
| ---------- | -------- | -------------------- | ---------------- | ------- |
| email      | text     | Required, email      | user@example.com | ''      |
| password   | password | Required, min 1 char | ••••••••         | ''      |
| rememberMe | checkbox | Optional             | Recordarme       | false   |

**Submit:**

- Endpoint: `POST /api/auth/login`
- Success: Redireccionar según rol
- Error: Mostrar mensaje de error específico

**Formulario: RegisterForm**

**Schema de Validación:**

```typescript
import { z } from "zod";

export const registerSchema = z.object({
  name: z
    .string()
    .min(1, "El nombre es requerido")
    .min(3, "El nombre debe tener al menos 3 caracteres")
    .max(100, "El nombre no puede exceder 100 caracteres"),
  email: z.string().min(1, "El email es requerido").email("Email inválido"),
  password: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .regex(/[A-Z]/, "Debe contener al menos una mayúscula")
    .regex(/[0-9]/, "Debe contener al menos un número"),
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: "Debes aceptar los términos y condiciones",
  }),
});

export type RegisterFormData = z.infer<typeof registerSchema>;
```

**Campos:**

| Campo       | Tipo     | Validación                         | Placeholder      | Default |
| ----------- | -------- | ---------------------------------- | ---------------- | ------- |
| name        | text     | Required, min 3, max 100           | Juan Pérez       | ''      |
| email       | text     | Required, email                    | juan@example.com | ''      |
| password    | password | Required, min 8, uppercase, number | ••••••••         | ''      |
| acceptTerms | checkbox | Required (must be true)            | Acepto términos  | false   |

**Submit:**

- Endpoint: `POST /api/auth/register`
- Success: Redireccionar a `/onboarding`
- Error: Mostrar errores de validación

---

## 7. Notificaciones y Feedback

### 7.1 Notificaciones Toast

**Tipo: Success (Login)**

- Mensaje: `¡Bienvenido de vuelta, {nombre}!`
- Duración: `3000ms`
- Posición: `top-right`
- Icono: `IconCheck`
- Color: `green`

**Tipo: Success (Register)**

- Mensaje: `¡Cuenta creada exitosamente! Completa tu perfil.`
- Duración: `4000ms`
- Posición: `top-right`
- Icono: `IconCheck`
- Color: `green`

**Tipo: Error (Invalid Credentials)**

- Mensaje: `Email o contraseña incorrectos`
- Duración: `5000ms`
- Posición: `top-right`
- Icono: `IconX`
- Color: `red`

**Tipo: Error (Account Deactivated)**

- Mensaje: `Tu cuenta está desactivada. Contacta a soporte.`
- Duración: `6000ms`
- Posición: `top-right`
- Icono: `IconAlertTriangle`
- Color: `orange`

**Tipo: Error (Email Already Exists)**

- Mensaje: `Este email ya está registrado. ¿Olvidaste tu contraseña?`
- Duración: `5000ms`
- Posición: `top-right`
- Icono: `IconAlertCircle`
- Color: `orange`

**Tipo: Error (Validation)**

- Mensaje: Errores específicos del campo
- Duración: `5000ms`
- Posición: `top-right`
- Icono: `IconAlertCircle`
- Color: `red`

### 7.2 Estados de Carga

**Loading States:**

- Spinner en botón submit: `LoginForm`, `RegisterForm`
- Texto del botón cambia a "Iniciando sesión..." / "Creando cuenta..."
- Botón deshabilitado durante la carga
- Inputs deshabilitados durante la carga

**Implementación:**

```typescript
<Button
  type="submit"
  loading={isLoading}
  disabled={isLoading}
  fullWidth
>
  {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
</Button>
```

### 7.3 Estados Vacíos

No aplica para vistas de autenticación.

### 7.4 Validación en Tiempo Real

**Email Field:**

- Validación on blur
- Mostrar error si formato inválido
- Icono de check verde si válido

**Password Field:**

- Validación on change (RegisterForm)
- Mostrar indicador de fortaleza
- Mostrar requisitos con checks:
  - ✅ Mínimo 8 caracteres
  - ✅ Al menos una mayúscula
  - ✅ Al menos un número

**Implementación:**

```typescript
<TextInput
  label="Email"
  placeholder="user@example.com"
  error={errors.email?.message}
  rightSection={
    !errors.email && watch('email') ? (
      <IconCheck size={16} color="green" />
    ) : null
  }
  {...register('email')}
/>
```

---

## 8. Permisos y Roles

### 8.1 Visibilidad por Rol

Las vistas de autenticación son públicas (no requieren autenticación).

| Elemento     | PUBLIC | BUSINESS_OWNER | ADMIN | CUSTOMER |
| ------------ | ------ | -------------- | ----- | -------- |
| LoginForm    | ✅     | ❌ (redirect)  | ❌    | ❌       |
| RegisterForm | ✅     | ❌ (redirect)  | ❌    | ❌       |

### 8.2 Validaciones de Permisos

**Redirección Automática:**

Si un usuario autenticado intenta acceder a `/login` o `/register`, se redirige automáticamente a su dashboard correspondiente.

```typescript
// ProtectedRoute component
const { isAuthenticated, user } = useAuthStore();

if (isAuthenticated && (pathname === '/login' || pathname === '/register')) {
  const primaryRole = user?.roles[0];
  if (primaryRole === 'BUSINESS_OWNER') {
    return <Navigate to="/dashboard" replace />;
  } else if (primaryRole === 'CUSTOMER') {
    return <Navigate to="/my-appointments" replace />;
  } else if (primaryRole === 'ADMIN') {
    return <Navigate to="/admin" replace />;
  }
}
```

---

## 9. Navegación y Rutas

### 9.1 Rutas

**Ruta Principal Login:** `/login`

**Ruta Principal Register:** `/register`

**Rutas Relacionadas:**

- `/forgot-password` - Recuperar contraseña (futuro)
- `/reset-password/:token` - Restablecer contraseña (futuro)
- `/verify-email/:token` - Verificar email (futuro)

### 9.2 Breadcrumbs

No aplica para vistas de autenticación (no hay breadcrumbs).

### 9.3 Navegación Contextual

**Links en LoginForm:**

- `¿Olvidaste tu contraseña?` → `/forgot-password` (futuro)
- `¿No tienes cuenta? Regístrate` → `/register`

**Links en RegisterForm:**

- `¿Ya tienes cuenta? Inicia sesión` → `/login`
- `Términos y condiciones` → `/terms` (modal o página)
- `Política de privacidad` → `/privacy` (modal o página)

---

## 10. Accesibilidad (a11y)

### 10.1 ARIA Labels

**LoginForm:**

```html
<form aria-label="Formulario de inicio de sesión">
  <input
    type="email"
    aria-label="Email"
    aria-required="true"
    aria-invalid="{!!errors.email}"
    aria-describedby="email-error"
  />
  <span id="email-error" role="alert"> {errors.email?.message} </span>

  <input
    type="password"
    aria-label="Contraseña"
    aria-required="true"
    aria-invalid="{!!errors.password}"
    aria-describedby="password-error"
  />
  <span id="password-error" role="alert"> {errors.password?.message} </span>

  <button type="submit" aria-label="Iniciar sesión" aria-busy="{isLoading}">
    Iniciar Sesión
  </button>
</form>
```

**RegisterForm:**

```html
<form aria-label="Formulario de registro">
  <input
    type="text"
    aria-label="Nombre completo"
    aria-required="true"
    aria-invalid="{!!errors.name}"
    aria-describedby="name-error"
  />

  <input
    type="password"
    aria-label="Contraseña"
    aria-required="true"
    aria-invalid="{!!errors.password}"
    aria-describedby="password-error password-requirements"
  />
  <div id="password-requirements" role="status">
    Requisitos de contraseña: mínimo 8 caracteres, una mayúscula, un número
  </div>

  <button
    type="button"
    aria-label="Mostrar contraseña"
    aria-pressed="{showPassword}"
  >
    <IconEye />
  </button>
</form>
```

### 10.2 Navegación por Teclado

**Tab Order:**

1. Email input
2. Password input
3. Remember me checkbox (LoginForm) / Accept terms checkbox (RegisterForm)
4. Submit button
5. Links (forgot password, register/login)

**Keyboard Shortcuts:**

- `Tab`: Navegar entre campos
- `Shift + Tab`: Navegar hacia atrás
- `Enter`: Submit formulario (cuando está en un input)
- `Space`: Toggle checkbox
- `Escape`: Cerrar modal de términos (si está abierto)

### 10.3 Screen Readers

**Anuncios Importantes:**

- Error de validación: Anunciado automáticamente con `role="alert"`
- Loading state: "Iniciando sesión, por favor espera"
- Success: "Inicio de sesión exitoso, redirigiendo"
- Error: "Error al iniciar sesión: [mensaje]"

**Live Regions:**

```html
<div role="status" aria-live="polite" aria-atomic="true">
  {isLoading && 'Procesando...'} {isSuccess && 'Operación exitosa'} {isError &&
  `Error: ${error.message}`}
</div>
```

---

## 11. Performance

### 11.1 Optimizaciones

**Code Splitting:**

- LoginForm y RegisterForm en rutas separadas
- Lazy loading de componentes pesados (ilustraciones)

**Memoización:**

- `useMemo` para cálculo de password strength
- `useCallback` para handlers de formulario

**Validación:**

- Debounce en validación de email (300ms)
- Validación on blur para reducir re-renders

**Bundle Size:**

- Importar solo iconos necesarios de Tabler Icons
- Usar tree-shaking para Mantine components

### 11.2 Métricas Objetivo

- First Contentful Paint: `< 1s`
- Time to Interactive: `< 2s`
- Largest Contentful Paint: `< 1.5s`
- Form submission: `< 500ms` (network time excluded)

---

## 12. Testing

### 12.1 Tests Unitarios

**Componente: LoginForm**

```typescript
// apps/frontend/src/features/auth/login/__tests__/LoginForm.test.tsx

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LoginForm } from '../ui/LoginForm';

describe('LoginForm', () => {
  it('should render email and password fields', () => {
    render(<LoginForm />);

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument();
  });

  it('should show validation errors for empty fields', async () => {
    render(<LoginForm />);

    const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/el email es requerido/i)).toBeInTheDocument();
      expect(screen.getByText(/la contraseña es requerida/i)).toBeInTheDocument();
    });
  });

  it('should show error for invalid email format', async () => {
    render(<LoginForm />);

    const emailInput = screen.getByLabelText(/email/i);
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.blur(emailInput);

    await waitFor(() => {
      expect(screen.getByText(/email inválido/i)).toBeInTheDocument();
    });
  });

  it('should toggle password visibility', () => {
    render(<LoginForm />);

    const passwordInput = screen.getByLabelText(/contraseña/i);
    const toggleButton = screen.getByRole('button', { name: /mostrar contraseña/i });

    expect(passwordInput).toHaveAttribute('type', 'password');

    fireEvent.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'text');

    fireEvent.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'password');
  });
});
```

**Componente: RegisterForm**

```typescript
// apps/frontend/src/features/auth/register/__tests__/RegisterForm.test.tsx

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RegisterForm } from '../ui/RegisterForm';

describe('RegisterForm', () => {
  it('should render all required fields', () => {
    render(<RegisterForm />);

    expect(screen.getByLabelText(/nombre/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/acepto términos/i)).toBeInTheDocument();
  });

  it('should show password strength indicator', async () => {
    render(<RegisterForm />);

    const passwordInput = screen.getByLabelText(/contraseña/i);

    // Weak password
    fireEvent.change(passwordInput, { target: { value: 'weak' } });
    await waitFor(() => {
      expect(screen.getByText(/débil/i)).toBeInTheDocument();
    });

    // Strong password
    fireEvent.change(passwordInput, { target: { value: 'StrongPass123!' } });
    await waitFor(() => {
      expect(screen.getByText(/fuerte/i)).toBeInTheDocument();
    });
  });

  it('should require terms acceptance', async () => {
    render(<RegisterForm />);

    const submitButton = screen.getByRole('button', { name: /crear cuenta/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/debes aceptar los términos/i)).toBeInTheDocument();
    });
  });

  it('should validate password requirements', async () => {
    render(<RegisterForm />);

    const passwordInput = screen.getByLabelText(/contraseña/i);

    // Too short
    fireEvent.change(passwordInput, { target: { value: 'short' } });
    fireEvent.blur(passwordInput);

    await waitFor(() => {
      expect(screen.getByText(/al menos 8 caracteres/i)).toBeInTheDocument();
    });

    // No uppercase
    fireEvent.change(passwordInput, { target: { value: 'lowercase123' } });
    fireEvent.blur(passwordInput);

    await waitFor(() => {
      expect(screen.getByText(/al menos una mayúscula/i)).toBeInTheDocument();
    });

    // No number
    fireEvent.change(passwordInput, { target: { value: 'NoNumbers' } });
    fireEvent.blur(passwordInput);

    await waitFor(() => {
      expect(screen.getByText(/al menos un número/i)).toBeInTheDocument();
    });
  });
});
```

**Hook: useLogin**

```typescript
// apps/frontend/src/features/auth/login/__tests__/useLogin.test.ts

import { renderHook, waitFor } from "@testing-library/react";
import { useLogin } from "../model/useLogin";
import { server } from "@/mocks/server";
import { rest } from "msw";

describe("useLogin", () => {
  it("should login successfully", async () => {
    const { result } = renderHook(() => useLogin());

    result.current.mutate({
      email: "test@example.com",
      password: "Password123",
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toHaveProperty("token");
    expect(result.current.data).toHaveProperty("user");
  });

  it("should handle invalid credentials", async () => {
    server.use(
      rest.post("/api/auth/login", (req, res, ctx) => {
        return res(
          ctx.status(401),
          ctx.json({ message: "Invalid credentials" }),
        );
      }),
    );

    const { result } = renderHook(() => useLogin());

    result.current.mutate({
      email: "wrong@example.com",
      password: "wrongpass",
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBeDefined();
  });
});
```

### 12.2 Tests de Integración

**Flujo: Login Completo**

```typescript
// apps/frontend/src/features/auth/__tests__/login-flow.integration.test.tsx

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LoginPage } from '@pages/LoginPage';
import { server } from '@/mocks/server';
import { rest } from 'msw';

describe('Login Flow', () => {
  it('should complete login flow successfully', async () => {
    server.use(
      rest.post('/api/auth/login', (req, res, ctx) => {
        return res(
          ctx.status(200),
          ctx.json({
            user: {
              id: '123',
              email: 'test@example.com',
              name: 'Test User',
              roles: ['BUSINESS_OWNER'],
              isActive: true,
              emailVerified: true,
            },
            token: 'mock-jwt-token',
          })
        );
      })
    );

    render(<LoginPage />);

    // Fill form
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/contraseña/i);
    const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'Password123' } });
    fireEvent.click(submitButton);

    // Wait for success
    await waitFor(() => {
      expect(screen.getByText(/bienvenido/i)).toBeInTheDocument();
    });

    // Verify redirect (mock window.location.href)
    expect(window.location.href).toContain('/dashboard');
  });

  it('should show error for invalid credentials', async () => {
    server.use(
      rest.post('/api/auth/login', (req, res, ctx) => {
        return res(
          ctx.status(401),
          ctx.json({ message: 'Invalid credentials' })
        );
      })
    );

    render(<LoginPage />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/contraseña/i);
    const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });

    fireEvent.change(emailInput, { target: { value: 'wrong@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpass' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/email o contraseña incorrectos/i)).toBeInTheDocument();
    });
  });
});
```

**Flujo: Register Completo**

```typescript
// apps/frontend/src/features/auth/__tests__/register-flow.integration.test.tsx

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RegisterPage } from '@pages/RegisterPage';
import { server } from '@/mocks/server';
import { rest } from 'msw';

describe('Register Flow', () => {
  it('should complete registration flow successfully', async () => {
    server.use(
      rest.post('/api/auth/register', (req, res, ctx) => {
        return res(
          ctx.status(201),
          ctx.json({
            userId: '123',
            token: 'mock-jwt-token',
          })
        );
      })
    );

    render(<RegisterPage />);

    // Fill form
    const nameInput = screen.getByLabelText(/nombre/i);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/contraseña/i);
    const termsCheckbox = screen.getByLabelText(/acepto términos/i);
    const submitButton = screen.getByRole('button', { name: /crear cuenta/i });

    fireEvent.change(nameInput, { target: { value: 'Juan Pérez' } });
    fireEvent.change(emailInput, { target: { value: 'juan@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'StrongPass123' } });
    fireEvent.click(termsCheckbox);
    fireEvent.click(submitButton);

    // Wait for success
    await waitFor(() => {
      expect(screen.getByText(/cuenta creada exitosamente/i)).toBeInTheDocument();
    });

    // Verify redirect
    expect(window.location.href).toContain('/onboarding');
  });

  it('should show error for existing email', async () => {
    server.use(
      rest.post('/api/auth/register', (req, res, ctx) => {
        return res(
          ctx.status(409),
          ctx.json({ message: 'Email already exists' })
        );
      })
    );

    render(<RegisterPage />);

    // Fill form with existing email
    const nameInput = screen.getByLabelText(/nombre/i);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/contraseña/i);
    const termsCheckbox = screen.getByLabelText(/acepto términos/i);
    const submitButton = screen.getByRole('button', { name: /crear cuenta/i });

    fireEvent.change(nameInput, { target: { value: 'Juan Pérez' } });
    fireEvent.change(emailInput, { target: { value: 'existing@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'StrongPass123' } });
    fireEvent.click(termsCheckbox);
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/email ya está registrado/i)).toBeInTheDocument();
    });
  });
});
```

---

## 13. Dependencias de Features

**Referencia:** Ver `docs/features/auth.md`

**Features Utilizadas:**

- **User Registration** - Crear cuenta de business owner con plan FREE
- **User Authentication** - Login con email y password, obtener JWT token
- **Multi-Role Management** - Soporte para múltiples roles (futuro marketplace)
- **Email Verification** - Verificar email después del registro (futuro)
- **Account Activation/Deactivation** - Prevenir login de cuentas desactivadas

**Integración con Otros BCs:**

- **Account BC:** Registro automático crea BusinessOwner profile
- **Customer BC:** Login de customers registrados (vinculados a User)
- **Business BC:** Autenticación requerida para gestión de negocios

---

## 14. Wireframes y Mockups

**Figma/Diseño:** `[Pendiente - URL de Figma]`

**Screenshots:**

- Desktop Login: `[Pendiente]`
- Desktop Register: `[Pendiente]`
- Mobile Login: `[Pendiente]`
- Mobile Register: `[Pendiente]`

**Inspiración de Diseño:**

- Clean, minimal design
- Focus en el formulario
- Ilustración decorativa opcional
- Colores del brand
- Tipografía legible

---

## 15. Notas de Implementación

### 15.1 Consideraciones Técnicas

**JWT Token Storage:**

- **Opción 1 (Actual):** localStorage
  - ✅ Simple de implementar
  - ❌ Vulnerable a XSS
  - ✅ Funciona con SPA
- **Opción 2 (Recomendada):** httpOnly cookies
  - ✅ Más seguro (no accesible desde JS)
  - ✅ Protección contra XSS
  - ❌ Requiere configuración CORS
  - ❌ Requiere backend para refresh

**Password Hashing:**

- Backend usa bcrypt con 10 salt rounds
- Frontend NUNCA debe hashear passwords (enviar plain text via HTTPS)
- HTTPS obligatorio en producción

**Token Refresh:**

- Actualmente no implementado
- Tokens expiran en 1 día
- Usuario debe re-autenticarse después de expiración
- **Futuro:** Implementar refresh tokens

**CORS Configuration:**

```typescript
// Backend: apps/backend/src/main.ts
app.enableCors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true, // Para cookies
});
```

**Axios Interceptor:**

```typescript
// Frontend: apps/frontend/src/shared/api/client.ts
import axios from "axios";

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api",
  timeout: 10000,
});

// Request interceptor - agregar token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth-token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - manejar errores
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado o inválido
      localStorage.removeItem("auth-token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);
```

### 15.2 Limitaciones Conocidas

1. **No hay recuperación de contraseña** - Implementar en futuro
2. **No hay verificación de email** - Implementar en futuro
3. **No hay refresh tokens** - Tokens expiran en 1 día
4. **No hay rate limiting** - Vulnerable a brute force (implementar en backend)
5. **No hay 2FA** - Implementar en futuro para mayor seguridad
6. **No hay OAuth** - Solo email/password por ahora

### 15.3 Mejoras Futuras

**Fase 1 (Corto Plazo):**

1. **Forgot Password Flow**
   - Endpoint: `POST /api/auth/forgot-password`
   - Enviar email con token de reset
   - Página de reset password

2. **Email Verification**
   - Enviar email después de registro
   - Endpoint: `GET /api/auth/verify-email/:token`
   - Página de confirmación

3. **Remember Me**
   - Tokens de larga duración (30 días)
   - Refresh tokens

**Fase 2 (Mediano Plazo):**

4. **OAuth Integration**
   - Google Sign-In
   - Facebook Login
   - Apple Sign-In

5. **Two-Factor Authentication (2FA)**
   - SMS verification
   - Authenticator app (TOTP)
   - Backup codes

6. **Session Management**
   - Ver sesiones activas
   - Revocar sesiones
   - Notificación de login desde nuevo dispositivo

**Fase 3 (Largo Plazo):**

7. **Biometric Authentication**
   - Face ID / Touch ID
   - WebAuthn / FIDO2

8. **Passwordless Login**
   - Magic links por email
   - SMS OTP

9. **Social Login**
   - LinkedIn
   - Twitter/X
   - GitHub

---

## 16. Security Best Practices

### 16.1 Frontend Security

**Input Sanitization:**

- Usar React (auto-escapes XSS)
- Validar con Zod antes de enviar
- No usar `dangerouslySetInnerHTML`

**Token Storage:**

- Considerar httpOnly cookies en lugar de localStorage
- Nunca exponer tokens en URLs
- Limpiar tokens al logout

**HTTPS Only:**

- Forzar HTTPS en producción
- Usar HSTS headers
- Secure cookies

**Content Security Policy (CSP):**

```html
<meta
  http-equiv="Content-Security-Policy"
  content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';"
/>
```

### 16.2 Password Security

**Client-Side:**

- Mostrar requisitos claramente
- Indicador de fortaleza
- Sugerir password manager
- No almacenar passwords en localStorage

**Server-Side (Backend):**

- Bcrypt con 10+ salt rounds
- Nunca almacenar plain text
- Nunca retornar passwords en API
- Rate limiting en login endpoint

### 16.3 Rate Limiting (Backend)

**Recomendaciones:**

```typescript
// Login endpoint
@Throttle(5, 60) // 5 intentos por minuto
@Post('login')
async login(@Body() dto: LoginDto) {
  // ...
}

// Register endpoint
@Throttle(3, 3600) // 3 intentos por hora
@Post('register')
async register(@Body() dto: RegisterDto) {
  // ...
}
```

### 16.4 Monitoring y Alertas

**Eventos a Monitorear:**

- Múltiples intentos de login fallidos
- Login desde nueva ubicación/dispositivo
- Cambio de password
- Cambio de email
- Activación/desactivación de cuenta

**Alertas:**

- Email al usuario en eventos críticos
- Notificación push (futuro)
- Dashboard de seguridad (admin)

---

## 17. Changelog

| Versión | Fecha        | Cambios                                  |
| ------- | ------------ | ---------------------------------------- |
| 1.0     | Dec 30, 2025 | Versión inicial - Login y Register forms |
| 0.9     | Dec 26, 2025 | Draft - Estructura básica y componentes  |

---

## 18. Referencias

### 18.1 Documentación Relacionada

- **Features:** `docs/features/auth.md`
- **API:** `docs/api/auth.md`
- **Backend Implementation:** `apps/backend/src/auth/`
- **Steering:** `.kiro/steering/user-customer-businessowner-architecture.md`

### 18.2 Librerías Utilizadas

**UI Components:**

- `@mantine/core` - UI component library
- `@mantine/form` - Form management (alternativa a React Hook Form)
- `@mantine/notifications` - Toast notifications
- `@tabler/icons-react` - Icon library

**Form Management:**

- `react-hook-form` - Form state management
- `zod` - Schema validation
- `@hookform/resolvers` - Zod resolver for RHF

**State Management:**

- `zustand` - Global state (auth store)
- `zustand/middleware` - Persist middleware

**API Client:**

- `@tanstack/react-query` - Server state management
- `axios` - HTTP client

**Routing:**

- `react-router-dom` - Client-side routing

### 18.3 Recursos Externos

**Design Inspiration:**

- [Dribbble - Login Forms](https://dribbble.com/search/login-form)
- [Behance - Authentication UI](https://www.behance.net/search/projects?search=authentication)

**Security Resources:**

- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)

**Accessibility:**

- [WAI-ARIA Authoring Practices - Forms](https://www.w3.org/WAI/ARIA/apg/patterns/form/)
- [WebAIM - Accessible Forms](https://webaim.org/techniques/forms/)

---

**Última actualización:** December 30, 2025  
**Mantenido por:** Development Team  
**Contacto:** dev@example.com

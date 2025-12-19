# Design Document - Frontend Base MVP

## Overview

El frontend del Sistema de Reservas Multi-Tenant será una aplicación React moderna construida con Vite, siguiendo la arquitectura Feature-Sliced Design (FSD). Se integrará con el backend NestJS existente mediante APIs REST y compartirá tipos TypeScript a través de un package común.

**Objetivos del diseño:**

- Arquitectura escalable y mantenible con FSD
- Separación clara entre lógica de UI y lógica de negocio
- Gestión eficiente de estado del servidor con TanStack Query
- Experiencia de usuario fluida con optimistic updates
- Type safety end-to-end con TypeScript

## Template Adaptation

### Template dashvista → DashboardLayout

El layout principal está basado en el template `templates-mantine-ui/dashvista` con las siguientes adaptaciones:

**Cambios de estructura:**

- ❌ Remix Router → ✅ React Router DOM (`useLocation` en lugar de Remix)
- ❌ `iconsax-react` → ✅ `@tabler/icons-react` (IconHome2, IconCalendar)
- ❌ Componentes del template (UsersChat, ThemeSwitch, MantineLogoRounded) → ✅ Componentes propios del proyecto

**Cambios de estilo:**

- ❌ Colores del template (negro para activo) → ✅ Paleta brandGreen
- ❌ `color: black` para navlink activo → ✅ `background-color: var(--mantine-color-brandGreen-6)`
- ❌ Hover genérico → ✅ `background-color: var(--mantine-color-brandGreen-1)`
- ✅ Mantener: `radius="xl"` en todos los elementos interactivos
- ✅ Mantener: Transiciones suaves `cubic-bezier(0.075, 0.82, 0.165, 1)`
- ✅ Mantener: Estructura responsive con Burger menu

**Archivos del template a adaptar:**

```
templates-mantine-ui/dashvista/
├── App.tsx → apps/frontend/src/app/layouts/DashboardLayout.tsx
├── Header.tsx → apps/frontend/src/app/layouts/components/Header.tsx
├── Navbar.tsx → apps/frontend/src/app/layouts/components/Navbar.tsx
├── App.module.css → apps/frontend/src/app/layouts/DashboardLayout.module.css
├── Header.module.css → apps/frontend/src/app/layouts/components/Header.module.css
└── Navbar.module.css → apps/frontend/src/app/layouts/components/Navbar.module.css
```

**Configuración de AppShell:**

```typescript
<AppShell
  header={{ height: 60 }}
  navbar={{
    width: 280,
    breakpoint: "md",
    collapsed: { mobile: !opened }
  }}
  padding="md"
>
```

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────┐
│              Browser (React App)                │
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │  App Layer (Providers, Router, Store)    │ │
│  └───────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────┐ │
│  │  Pages (Dashboard, Appointments, Login)  │ │
│  └───────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────┐ │
│  │  Widgets (StatsCards, AppointmentsList)  │ │
│  └───────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────┐ │
│  │  Features (Login, CancelAppointment)     │ │
│  └───────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────┐ │
│  │  Entities (Appointment, User)            │ │
│  └───────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────┐ │
│  │  Shared (API Client, Utils, UI)         │ │
│  └───────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
                      ↓ HTTP/REST
┌─────────────────────────────────────────────────┐
│           Backend NestJS (Port 3000)            │
│  /api/auth/login, /api/appointments, etc.      │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│              PostgreSQL Database                │
└─────────────────────────────────────────────────┘
```

### Feature-Sliced Design Layers

**Regla fundamental:** Las capas superiores pueden importar de las inferiores, NUNCA al revés.

1. **shared/** - Código reutilizable sin lógica de negocio
   - API client, utilidades, componentes UI genéricos
2. **entities/** - Modelos de dominio
   - Tipos, queries, componentes de presentación
3. **features/** - Casos de uso interactivos
   - Login, CancelAppointment, FilterAppointments
4. **widgets/** - Composiciones complejas
   - StatsCards, UpcomingAppointments
5. **pages/** - Pantallas completas
   - DashboardPage, AppointmentsPage, LoginPage
6. **app/** - Inicialización
   - Providers, Router, Store global

## Components and Interfaces

### Core Components

#### 0. Layout Components (basado en template dashvista)

**DashboardLayout**

```typescript
// Estructura principal del layout
- AppShell con Header y Navbar
- Header height: 60px
- Navbar width: 280px, breakpoint: "md"
- Padding: "md"
- Responsive: Navbar colapsable en mobile
```

**Header Component**

```typescript
// apps/frontend/src/app/layouts/components/Header.tsx
- Logo/nombre del negocio (izquierda)
- Burger menu para mobile (hiddenFrom="md")
- Avatar con Popover para user menu (derecha)
- LogoutButton integrado en Popover
- ActionIcons con radius="xl"
- Color brandGreen para elementos interactivos
```

**Navbar Component**

```typescript
// apps/frontend/src/app/layouts/components/Navbar.tsx
- Título de bienvenida en la parte superior
- ScrollArea para navegación
- NavLinks: Dashboard (IconHome2), Appointments (IconCalendar)
- Highlight con data-active usando useLocation
- Color brandGreen.6 para item activo
- Hover con brandGreen.1
- Radius="xl" en todos los navlinks
```

**Estilos CSS adaptados del template:**

```css
/* DashboardLayout.module.css */
.navbar {
  border: 0;
  padding: var(--mantine-spacing-lg) calc(var(--mantine-spacing-sm) * 2);
}

.header {
  border: 0;
  padding-left: calc(var(--mantine-spacing-sm) * 2);
  padding-right: calc(var(--mantine-spacing-sm) * 2);
}

.main {
  background-color: light-dark(
    var(--mantine-color-gray-0),
    var(--mantine-color-dark-8)
  );
}

/* Navbar.module.css */
.navlink {
  border-radius: var(--mantine-radius-xl);
  padding: 8px var(--mantine-spacing-xs);
  transition: all 0.2s cubic-bezier(0.075, 0.82, 0.165, 1);
}

.navlink[data-active="true"] {
  color: white;
  background-color: var(--mantine-color-brandGreen-6);
}

.navlink:hover {
  background-color: var(--mantine-color-brandGreen-1);
}
```

#### 1. App Layer

**QueryProvider**

```typescript
// Configura TanStack Query con defaults
- staleTime: 5 minutos
- retry: 1 intento
- refetchOnWindowFocus: false
```

**MantineProvider**

```typescript
// Configura tema y notificaciones
- Theme personalizado
- Notifications system
```

**Router**

```typescript
// Define rutas de la aplicación
- /login (público)
- / (protegido) → Dashboard
- /appointments (protegido)
```

**AuthStore (Zustand)**

```typescript
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user, token) => void;
  logout: () => void;
}
```

#### 2. Pages

**LoginPage**

- Layout de dos columnas: formulario a la izquierda (50%), imagen a la derecha (50%)
- Formulario de login con validación
- Manejo de errores de autenticación
- Redirección al dashboard después de login exitoso
- Diseño profesional con Paper (withBorder, shadow="xl", padding={30}, radius="xl")
- Inputs con size="md" y radius="xl" (TextInput y PasswordInput)
- Botón full-width con loading state, radius="xl" y color="brandGreen" (paleta verde personalizada)
- Imagen de fondo a la derecha: `src/assets/login-background.png` (importada desde assets)
- Responsive: en mobile, solo mostrar formulario (ocultar imagen)

**Paleta de Colores Personalizada:**

El sistema usa una paleta verde personalizada `brandGreen` extraída de la imagen de fondo, definida en el tema de Mantine:

```typescript
// app/providers/MantineProvider.tsx
import { createTheme, MantineProvider } from "@mantine/core";

const theme = createTheme({
  colors: {
    brandGreen: [
      "#e6f4ed", // 0 - Más claro (tinte muy suave para backgrounds)
      "#c2e6d3", // 1 - Claro (para hovers y estados sutiles)
      "#9dd8b9", // 2 - Claro medio
      "#78ca9f", // 3 - Medio claro
      "#53bc85", // 4 - Medio
      "#19874e", // 5 - Base (tu color #4 - HSL: hsl(149, 69, 31))
      "#138147", // 6 - Medio oscuro (tu color #3 - HSL: hsl(148, 74, 29))
      "#107c42", // 7 - Oscuro (tu color #2 - HSL: hsl(148, 77, 27))
      "#086b38", // 8 - Más oscuro (tu color #1 - HSL: hsl(149, 86, 23))
      "#065529", // 9 - Muy oscuro (para textos en fondos claros)
    ],
  },
  primaryColor: "brandGreen",
  primaryShade: { light: 6, dark: 7 },
});
```

**Uso de la paleta:**

- Color primario: `brandGreen` (definido en `primaryColor`)
- Botones de acción: `color="brandGreen"` (usa automáticamente shade 6 en light mode, 7 en dark mode)
- Estados de éxito: `color="brandGreen"`
- Shades específicos: `brandGreen.5`, `brandGreen.8`, etc.
- El sistema selecciona automáticamente el shade apropiado según el tema (light/dark) y el variant del componente

**Mapeo de colores originales:**

- Shade 5: `#19874e` (tu color más claro - HSL: hsl(149, 69, 31))
- Shade 6: `#138147` (tu tercer color - HSL: hsl(148, 74, 29)) ← **Primary en light mode**
- Shade 7: `#107c42` (tu segundo color - HSL: hsl(148, 77, 27)) ← **Primary en dark mode**
- Shade 8: `#086b38` (tu color más oscuro - HSL: hsl(149, 86, 23))

**Shades generados:**

- Shades 0-4: Tonos más claros generados para backgrounds, hovers y estados sutiles
- Shade 9: Tono más oscuro generado para textos en fondos claros

**DashboardLayout**

- Layout principal basado en template dashvista adaptado
- AppShell de Mantine con Header (height: 60) y Navbar (width: 280, breakpoint: "md")
- Header con logo, Burger menu (mobile), y user menu con Avatar + Popover
- Navbar con título de bienvenida y links de navegación (Dashboard, Appointments)
- Todos los elementos interactivos usan radius="xl"
- Elementos activos usan color brandGreen.6
- Hover states usan brandGreen.1
- Responsive: Navbar colapsable en mobile con Burger menu

**DashboardPage**

- Composición de widgets (StatsCards, UpcomingAppointments)
- Layout en grid responsive
- Renderizada dentro de DashboardLayout

**AppointmentsPage**

- Tabla de citas con paginación
- Filtros de estado y fecha
- Acciones: Ver detalles, Cancelar
- Renderizada dentro de DashboardLayout

#### 3. Widgets

**StatsCards**

- 4 cards con métricas: Citas hoy, Citas semana, Consultas pendientes, Ocupación
- Usa TanStack Query para obtener datos
- Loading y error states

**UpcomingAppointments**

- Lista de próximas 5 citas
- Botón "Ver todas" que navega a /appointments
- Empty state cuando no hay citas

#### 4. Features

**auth/login**

```typescript
// UI: LoginForm
// Model: useLogin (mutation hook)
// API: loginApi.login()
```

**appointment/cancel**

```typescript
// UI: CancelAppointmentButton
// Model: useCancelAppointment (mutation con optimistic update)
// API: appointmentsApi.cancel()
```

**appointment/filter**

```typescript
// UI: AppointmentFilters
// Model: useAppointmentFilters (Zustand store)
```

#### 5. Entities

**appointment**

```typescript
// Types: AppointmentReadModel
// Queries: appointmentKeys, useAppointments, useAppointment
// UI: AppointmentCard, AppointmentBadge
// Lib: formatAppointment, getStatusColor
```

**user**

```typescript
// Types: User, LoginDto
// Queries: userKeys
```

#### 6. Shared

**api/client.ts**

```typescript
// Axios instance con:
// - baseURL: http://localhost:3000/api
// - Request interceptor: agregar token
// - Response interceptor: manejar 401
```

**api/endpoints.ts**

```typescript
export const ENDPOINTS = {
  AUTH: {
    LOGIN: "/auth/login",
  },
  APPOINTMENTS: {
    LIST: "/appointments",
    DETAIL: (id) => `/appointments/${id}`,
    CANCEL: (id) => `/appointments/${id}/cancel`,
  },
};
```

## Data Models

### Frontend Types (from @packages/shared-types)

```typescript
interface AppointmentReadModel {
  id: string;
  businessId: string;
  customerId: string;
  customerName: string | null;
  customerPhone: string;
  offeringId: string;
  offeringName: string;
  dateTime: Date;
  status: "CONFIRMED" | "CANCELLED" | "COMPLETED";
  createdAt: Date;
  cancelledAt: Date | null;
}

interface User {
  id: string;
  email: string;
  name: string;
  businessId: string;
}

interface LoginDto {
  email: string;
  password: string;
}

interface LoginResponse {
  user: User;
  token: string;
}
```

### Query Keys Pattern

```typescript
// entities/appointment/model/queries.ts
export const appointmentKeys = {
  all: ["appointments"] as const,
  lists: () => [...appointmentKeys.all, "list"] as const,
  list: (filters: AppointmentFilters) =>
    [...appointmentKeys.lists(), filters] as const,
  details: () => [...appointmentKeys.all, "detail"] as const,
  detail: (id: string) => [...appointmentKeys.details(), id] as const,
  upcoming: () => [...appointmentKeys.all, "upcoming"] as const,
};
```

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Property 1: Authentication token persistence

_For any_ authenticated user, when they refresh the page, the authentication state should be restored from localStorage
**Validates: Requirements 2.2, 2.3**

### Property 2: Protected route redirection

_For any_ unauthenticated user attempting to access a protected route, they should be redirected to /login
**Validates: Requirements 2.1**

### Property 3: Optimistic update rollback

_For any_ failed mutation with optimistic update, the UI state should revert to the exact previous state
**Validates: Requirements 9.2, 9.4**

### Property 4: Query invalidation after mutation

_For any_ successful mutation, all related queries should be invalidated and refetched
**Validates: Requirements 9.3**

### Property 5: Filter state persistence

_For any_ applied filters, when navigating away and back, the filters should remain applied
**Validates: Requirements 5.4**

### Property 6: API error handling

_For any_ API error response, an appropriate user-friendly message should be displayed
**Validates: Requirements 7.1, 7.3, 7.4**

### Property 7: Token injection in requests

_For any_ authenticated API request, the JWT token should be included in the Authorization header
**Validates: Requirements 2.3**

### Property 8: Automatic logout on 401

_For any_ API response with status 401, the user should be logged out and redirected to login
**Validates: Requirements 2.4, 7.2**

## Error Handling

### Error Boundary

- Captura errores de React no manejados
- Muestra UI de fallback con opción de recargar
- Logs de errores para debugging

### API Error Handling

```typescript
// Response interceptor en axios client
if (error.response?.status === 401) {
  useAuthStore.getState().logout();
  window.location.href = "/login";
}

if (error.response?.status === 404) {
  notifications.show({
    title: "Error",
    message: "Recurso no encontrado",
    color: "red",
  });
}

if (error.response?.status >= 500) {
  notifications.show({
    title: "Error del servidor",
    message: "Intenta más tarde",
    color: "red",
  });
}
```

### Mutation Error Handling

```typescript
useMutation({
  mutationFn: appointmentsApi.cancel,
  onError: (error) => {
    notifications.show({
      title: "Error",
      message: error.message || "No se pudo cancelar la cita",
      color: "red",
    });
  },
});
```

## Testing Strategy

### Unit Tests (Vitest + React Testing Library)

**Componentes a testear:**

- LoginForm: validación, submit, errores
- AppointmentCard: renderizado, acciones
- AppointmentFilters: cambio de filtros, reset
- CancelAppointmentButton: confirmación, loading

**Hooks a testear:**

- useLogin: success, error cases
- useCancelAppointment: optimistic update, rollback
- useAppointmentFilters: set, reset

**Utilities a testear:**

- formatAppointment
- getStatusColor
- date formatters

### Integration Tests

**Flujos a testear:**

- Login flow: form → API → redirect
- Cancel appointment: click → confirm → optimistic update → API → invalidate
- Filter appointments: select filter → update query → refetch

### MSW (Mock Service Worker)

**Endpoints a mockear:**

- POST /api/auth/login
- GET /api/appointments
- PUT /api/appointments/:id/cancel

```typescript
// mocks/handlers.ts
export const handlers = [
  rest.post("/api/auth/login", (req, res, ctx) => {
    return res(ctx.json({ user: mockUser, token: "mock-token" }));
  }),
  rest.get("/api/appointments", (req, res, ctx) => {
    return res(ctx.json(mockAppointments));
  }),
];
```

## Performance Considerations

### Code Splitting

- Lazy load pages con React.lazy()
- Suspense boundaries para loading states

### Query Optimization

- staleTime: 5 minutos para reducir refetches
- Prefetch de datos en hover (opcional)
- Pagination para listas grandes

### Bundle Size

- Tree-shaking automático con Vite
- Mantine components importados individualmente
- Análisis de bundle con `vite-bundle-visualizer`

## Security Considerations

### Token Storage

- JWT almacenado en localStorage (con persist de Zustand)
- Token incluido en header Authorization
- Limpieza de token en logout

### XSS Prevention

- React escapa contenido por defecto
- Validación de inputs con Zod
- Sanitización de datos del servidor

### CSRF Protection

- No necesario (API stateless con JWT)
- CORS configurado en backend

## Deployment Considerations

### Environment Variables

```bash
VITE_API_URL=http://localhost:3000/api  # Development
VITE_API_URL=https://api.example.com    # Production
```

### Build Process

```bash
pnpm build:frontend  # Genera dist/ con assets optimizados
```

### Hosting

- Static hosting (Vercel, Netlify, S3 + CloudFront)
- Proxy de /api al backend en producción

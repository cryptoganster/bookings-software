# Design Document - Frontend Base MVP

## Overview

El frontend del Sistema de Reservas Multi-Tenant será una aplicación React moderna construida con Vite, siguiendo la arquitectura Feature-Sliced Design (FSD). Se integrará con el backend NestJS existente mediante APIs REST y compartirá tipos TypeScript a través de un package común.

**Objetivos del diseño:**
- Arquitectura escalable y mantenible con FSD
- Separación clara entre lógica de UI y lógica de negocio
- Gestión eficiente de estado del servidor con TanStack Query
- Experiencia de usuario fluida con optimistic updates
- Type safety end-to-end con TypeScript

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
  user: User | null
  token: string | null
  isAuthenticated: boolean
  login: (user, token) => void
  logout: () => void
}
```


#### 2. Pages

**LoginPage**
- Formulario de login con validación
- Manejo de errores de autenticación
- Redirección al dashboard después de login exitoso
- Diseño profesional con Paper, sombras y espaciado apropiado
- Layout centrado vertical y horizontalmente
- Tamaños de input consistentes (md)
- Botón full-width con loading state

**DashboardPage**
- Composición de widgets (StatsCards, UpcomingAppointments)
- Layout en grid responsive

**AppointmentsPage**
- Tabla de citas con paginación
- Filtros de estado y fecha
- Acciones: Ver detalles, Cancelar

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
    LOGIN: '/auth/login',
  },
  APPOINTMENTS: {
    LIST: '/appointments',
    DETAIL: (id) => `/appointments/${id}`,
    CANCEL: (id) => `/appointments/${id}/cancel`,
  },
}
```

## Data Models

### Frontend Types (from @packages/shared-types)

```typescript
interface AppointmentReadModel {
  id: string
  businessId: string
  customerId: string
  customerName: string | null
  customerPhone: string
  offeringId: string
  offeringName: string
  dateTime: Date
  status: 'CONFIRMED' | 'CANCELLED' | 'COMPLETED'
  createdAt: Date
  cancelledAt: Date | null
}

interface User {
  id: string
  email: string
  name: string
  businessId: string
}

interface LoginDto {
  email: string
  password: string
}

interface LoginResponse {
  user: User
  token: string
}
```

### Query Keys Pattern

```typescript
// entities/appointment/model/queries.ts
export const appointmentKeys = {
  all: ['appointments'] as const,
  lists: () => [...appointmentKeys.all, 'list'] as const,
  list: (filters: AppointmentFilters) => 
    [...appointmentKeys.lists(), filters] as const,
  details: () => [...appointmentKeys.all, 'detail'] as const,
  detail: (id: string) => [...appointmentKeys.details(), id] as const,
  upcoming: () => [...appointmentKeys.all, 'upcoming'] as const,
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Authentication token persistence
*For any* authenticated user, when they refresh the page, the authentication state should be restored from localStorage
**Validates: Requirements 2.2, 2.3**

### Property 2: Protected route redirection
*For any* unauthenticated user attempting to access a protected route, they should be redirected to /login
**Validates: Requirements 2.1**

### Property 3: Optimistic update rollback
*For any* failed mutation with optimistic update, the UI state should revert to the exact previous state
**Validates: Requirements 9.2, 9.4**

### Property 4: Query invalidation after mutation
*For any* successful mutation, all related queries should be invalidated and refetched
**Validates: Requirements 9.3**

### Property 5: Filter state persistence
*For any* applied filters, when navigating away and back, the filters should remain applied
**Validates: Requirements 5.4**

### Property 6: API error handling
*For any* API error response, an appropriate user-friendly message should be displayed
**Validates: Requirements 7.1, 7.3, 7.4**

### Property 7: Token injection in requests
*For any* authenticated API request, the JWT token should be included in the Authorization header
**Validates: Requirements 2.3**

### Property 8: Automatic logout on 401
*For any* API response with status 401, the user should be logged out and redirected to login
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
  useAuthStore.getState().logout()
  window.location.href = '/login'
}

if (error.response?.status === 404) {
  notifications.show({
    title: 'Error',
    message: 'Recurso no encontrado',
    color: 'red',
  })
}

if (error.response?.status >= 500) {
  notifications.show({
    title: 'Error del servidor',
    message: 'Intenta más tarde',
    color: 'red',
  })
}
```

### Mutation Error Handling
```typescript
useMutation({
  mutationFn: appointmentsApi.cancel,
  onError: (error) => {
    notifications.show({
      title: 'Error',
      message: error.message || 'No se pudo cancelar la cita',
      color: 'red',
    })
  },
})
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
  rest.post('/api/auth/login', (req, res, ctx) => {
    return res(ctx.json({ user: mockUser, token: 'mock-token' }))
  }),
  rest.get('/api/appointments', (req, res, ctx) => {
    return res(ctx.json(mockAppointments))
  }),
]
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

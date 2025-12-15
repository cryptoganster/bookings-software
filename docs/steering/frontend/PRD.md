---
inclusion: always
---

# Product Requirements Document (PRD)
## Panel de Administración Web - Sistema de Reservas Multi-Tenant

**Versión:** 1.0  
**Fecha:** Diciembre 2024  
**Tipo:** MVP Frontend  
**Stack:** React + Vite + TypeScript + Feature-Sliced Architecture

---

## 1. Visión General

### 1.1 Propósito
Desarrollar un panel de administración web moderno y responsivo que permita a los dueños de negocios gestionar sus reservaciones automatizadas de WhatsApp de manera intuitiva y eficiente.

### 1.2 Objetivos del MVP Frontend
- Proporcionar interfaz amigable para configuración inicial del negocio
- Dashboard en tiempo real de citas y métricas
- Gestión completa de servicios (offerings) y horarios
- Vista de calendario interactiva de reservaciones
- Sistema de respuesta a consultas de clientes
- Experiencia responsive (desktop-first, mobile-friendly)

### 1.3 Usuarios Objetivo
- **Primario:** Dueños de negocios (peluquerías, consultorios médicos, abogados, etc.)
- **Secundario:** Staff administrativo con permisos limitados (post-MVP)

---

## 2. Stack Tecnológico

### 2.1 Core Framework
```json
{
  "react": "^18.3.0",
  "vite": "^5.0.0",
  "typescript": "^5.3.0"
}
```

**Justificación:**
- **Vite:** Build ultra-rápido (~200ms HMR), zero-config para TypeScript
- **React 18:** Concurrent features, Suspense para data fetching
- **TypeScript:** Type safety end-to-end con backend NestJS

### 2.2 Arquitectura & State Management
```json
{
  "@tanstack/react-query": "^5.0.0",
  "zustand": "^4.4.0",
  "react-router-dom": "^6.20.0"
}
```

**Razones:**
- **TanStack Query:** 
  - Elimina 90% de boilerplate de fetching/caching
  - Optimistic updates para mejor UX
  - Invalidación automática de queries
  - DevTools integradas
  
- **Zustand:** 
  - Minimal API (menos código que Redux)
  - No requiere providers/context
  - TypeScript-first
  - Perfecto para UI state (modals, filters)

- **React Router v6:** 
  - Data loading con loaders
  - Code splitting automático
  - Nested routes para layouts

### 2.3 UI Framework & Styling
```json
{
  "@mantine/core": "^7.3.0",
  "@mantine/hooks": "^7.3.0",
  "@mantine/dates": "^7.3.0",
  "@mantine/notifications": "^7.3.0",
  "@mantine/modals": "^7.3.0",
  "@tabler/icons-react": "^2.44.0"
}
```

**Ventajas de Mantine:**
- 120+ componentes listos para admin dashboards
- Theming system robusto (light/dark mode out-of-the-box)
- Form context integrado (pero usaremos React Hook Form)
- Accesibilidad (ARIA) por defecto
- Excelente TypeScript support
- No requiere configuración de CSS (CSS-in-JS con emotion)

### 2.4 Forms & Validation
```json
{
  "react-hook-form": "^7.49.0",
  "zod": "^3.22.0",
  "@hookform/resolvers": "^3.3.0"
}
```

**Pattern:**
```typescript
const schema = z.object({
  name: z.string().min(3, 'Mínimo 3 caracteres'),
  duration: z.number().min(15, 'Mínimo 15 minutos')
});

const { register, handleSubmit } = useForm({
  resolver: zodResolver(schema)
});
```

**Beneficios:**
- Schema validation reutilizable (mismo schema para frontend/backend)
- Mensajes de error automáticos
- TypeScript inference de tipos desde schema
- Menos código de validación manual

### 2.5 Data Fetching & API Client
```json
{
  "axios": "^1.6.0",
  "openapi-typescript-codegen": "^0.27.0"
}
```

**Setup:**
```bash
# Generar cliente desde OpenAPI de NestJS
npx openapi-typescript-codegen --input http://localhost:3000/api-json --output ./src/shared/api/generated
```

**Ventaja:** Zero DTO manual, tipos sincronizados automáticamente con backend

### 2.6 Date/Time Handling
```json
{
  "date-fns": "^3.0.0",
  "date-fns-tz": "^2.0.0"
}
```

**Justificación:** Consistencia con backend, manejo robusto de zonas horarias

### 2.7 Calendar & Scheduling
```json
{
  "@mantine/dates": "^7.3.0",
  "dayjs": "^1.11.0"
}
```

### 2.8 Development & Testing
```json
{
  "vitest": "^1.0.0",
  "@testing-library/react": "^14.1.0",
  "@testing-library/user-event": "^14.5.0",
  "msw": "^2.0.0"
}
```

---

## 3. Arquitectura: Feature-Sliced Design (FSD)

### 3.1 Capas de FSD (Bottom-Up)

```
1. shared/     — Código reutilizable sin lógica de negocio
2. entities/   — Modelos de dominio (Appointment, Offering)
3. features/   — Casos de uso interactivos (CreateOffering, CancelAppointment)
4. widgets/    — Composiciones complejas (AppointmentsCalendar, StatsCards)
5. pages/      — Pantallas completas (DashboardPage, SettingsPage)
6. app/        — Inicialización (providers, router, theme)
```

**Regla de oro:** Las capas superiores pueden importar de las inferiores, NUNCA al revés.

### 3.2 Estructura de Carpetas Completa

```
src/
├── app/
│   ├── providers/
│   │   ├── QueryProvider.tsx          # TanStack Query config
│   │   ├── MantineProvider.tsx        # Theme + notifications
│   │   └── index.tsx
│   ├── router/
│   │   ├── routes.tsx                 # Definición de rutas
│   │   ├── ProtectedRoute.tsx         # Auth guard
│   │   └── index.tsx
│   ├── store/
│   │   └── auth.store.ts              # Zustand: auth state
│   ├── layouts/
│   │   ├── DashboardLayout.tsx        # Shell con navbar/sidebar
│   │   └── AuthLayout.tsx
│   └── index.tsx                      # Entry point
│
├── pages/
│   ├── DashboardPage/
│   │   ├── ui/
│   │   │   └── DashboardPage.tsx
│   │   └── index.ts
│   ├── AppointmentsPage/
│   │   ├── ui/
│   │   │   ├── AppointmentsPage.tsx
│   │   │   ├── AppointmentsList.tsx
│   │   │   └── AppointmentsCalendar.tsx
│   │   └── index.ts
│   ├── OfferingsPage/
│   │   ├── ui/
│   │   │   ├── OfferingsPage.tsx
│   │   │   └── OfferingsTable.tsx
│   │   └── index.ts
│   ├── SchedulesPage/
│   ├── ConversationsPage/
│   ├── SettingsPage/
│   └── LoginPage/
│
├── widgets/
│   ├── StatsCards/
│   │   ├── ui/
│   │   │   ├── StatsCards.tsx         # 4 cards con métricas
│   │   │   └── StatCard.tsx
│   │   ├── model/
│   │   │   └── useStats.ts            # TanStack Query hook
│   │   └── index.ts
│   ├── UpcomingAppointments/
│   │   ├── ui/
│   │   │   └── UpcomingAppointments.tsx
│   │   ├── model/
│   │   │   └── useUpcomingAppointments.ts
│   │   └── index.ts
│   ├── PendingQueries/
│   │   ├── ui/
│   │   │   ├── PendingQueries.tsx
│   │   │   └── QueryCard.tsx
│   │   └── index.ts
│   └── WeekCalendar/
│       ├── ui/
│       │   └── WeekCalendar.tsx       # Vista semanal de citas
│       └── index.ts
│
├── features/
│   ├── auth/
│   │   ├── login/
│   │   │   ├── ui/
│   │   │   │   └── LoginForm.tsx
│   │   │   ├── model/
│   │   │   │   └── useLogin.ts        # Mutation hook
│   │   │   ├── api/
│   │   │   │   └── loginApi.ts
│   │   │   └── index.ts
│   │   └── logout/
│   │       └── ui/
│   │           └── LogoutButton.tsx
│   │
│   ├── offering/
│   │   ├── create/
│   │   │   ├── ui/
│   │   │   │   ├── CreateOfferingModal.tsx
│   │   │   │   └── OfferingForm.tsx   # Shared form component
│   │   │   ├── model/
│   │   │   │   ├── useCreateOffering.ts
│   │   │   │   └── schema.ts          # Zod schema
│   │   │   └── index.ts
│   │   ├── edit/
│   │   │   ├── ui/
│   │   │   │   └── EditOfferingModal.tsx
│   │   │   ├── model/
│   │   │   │   └── useUpdateOffering.ts
│   │   │   └── index.ts
│   │   ├── delete/
│   │   │   ├── ui/
│   │   │   │   └── DeleteOfferingButton.tsx
│   │   │   ├── model/
│   │   │   │   └── useDeleteOffering.ts
│   │   │   └── index.ts
│   │   └── toggle-active/
│   │       └── ui/
│   │           └── ToggleOfferingSwitch.tsx
│   │
│   ├── appointment/
│   │   ├── cancel/
│   │   │   ├── ui/
│   │   │   │   └── CancelAppointmentButton.tsx
│   │   │   ├── model/
│   │   │   │   └── useCancelAppointment.ts
│   │   │   └── index.ts
│   │   ├── view-details/
│   │   │   ├── ui/
│   │   │   │   └── AppointmentDetailsModal.tsx
│   │   │   └── index.ts
│   │   └── filter/
│   │       ├── ui/
│   │       │   └── AppointmentFilters.tsx
│   │       ├── model/
│   │       │   └── useAppointmentFilters.ts  # Zustand store
│   │       └── index.ts
│   │
│   ├── schedule/
│   │   ├── create/
│   │   │   ├── ui/
│   │   │   │   └── CreateScheduleModal.tsx
│   │   │   ├── model/
│   │   │   │   ├── useCreateSchedule.ts
│   │   │   │   └── schema.ts
│   │   │   └── index.ts
│   │   ├── edit/
│   │   └── delete/
│   │
│   ├── blockout/
│   │   ├── create/
│   │   └── delete/
│   │
│   ├── conversation/
│   │   ├── respond/
│   │   │   ├── ui/
│   │   │   │   └── RespondToQueryModal.tsx
│   │   │   ├── model/
│   │   │   │   └── useSendResponse.ts
│   │   │   └── index.ts
│   │   └── view-history/
│   │       ├── ui/
│   │       │   └── ConversationHistory.tsx
│   │       └── index.ts
│   │
│   └── business/
│       ├── update-info/
│       │   ├── ui/
│       │   │   └── BusinessInfoForm.tsx
│       │   ├── model/
│       │   │   └── useUpdateBusiness.ts
│       │   └── index.ts
│       └── configure-whatsapp/
│           └── ui/
│               └── WhatsAppConfigForm.tsx
│
├── entities/
│   ├── appointment/
│   │   ├── ui/
│   │   │   ├── AppointmentCard.tsx    # Presentational
│   │   │   └── AppointmentBadge.tsx   # Status badge
│   │   ├── model/
│   │   │   ├── types.ts               # AppointmentDTO
│   │   │   └── queries.ts             # TanStack Query keys/fetchers
│   │   └── lib/
│   │       ├── formatAppointment.ts
│   │       └── getStatusColor.ts
│   │
│   ├── offering/
│   │   ├── ui/
│   │   │   └── OfferingCard.tsx
│   │   ├── model/
│   │   │   ├── types.ts
│   │   │   └── queries.ts
│   │   └── lib/
│   │       └── formatDuration.ts
│   │
│   ├── schedule/
│   │   ├── model/
│   │   │   ├── types.ts
│   │   │   └── queries.ts
│   │   └── lib/
│   │       └── formatSchedule.ts
│   │
│   ├── blockout/
│   │   ├── model/
│   │   │   └── types.ts
│   │   └── lib/
│   │
│   ├── customer/
│   │   ├── ui/
│   │   │   └── CustomerAvatar.tsx
│   │   ├── model/
│   │   │   └── types.ts
│   │   └── lib/
│   │
│   ├── conversation/
│   │   ├── ui/
│   │   │   └── MessageBubble.tsx
│   │   ├── model/
│   │   │   └── types.ts
│   │   └── lib/
│   │
│   └── business/
│       ├── model/
│       │   ├── types.ts
│       │   └── queries.ts
│       └── lib/
│
└── shared/
    ├── api/
    │   ├── client.ts                  # Axios instance configurado
    │   ├── generated/                 # OpenAPI codegen output
    │   │   ├── models/
    │   │   └── services/
    │   ├── endpoints.ts               # Constantes de URLs
    │   └── types.ts                   # Tipos compartidos
    │
    ├── config/
    │   ├── env.ts                     # Environment variables
    │   ├── query.ts                   # TanStack Query defaults
    │   └── constants.ts               # App constants
    │
    ├── lib/
    │   ├── date/
    │   │   ├── formatters.ts          # formatDate, formatTime, etc.
    │   │   └── timezone.ts            # Timezone utilities
    │   ├── validation/
    │   │   └── schemas.ts             # Zod schemas compartidos
    │   ├── storage/
    │   │   └── localStorage.ts        # Wrapper de localStorage
    │   └── utils/
    │       ├── cn.ts                  # classnames utility
    │       └── debounce.ts
    │
    ├── ui/
    │   ├── Button/
    │   │   └── Button.tsx             # Si necesitas custom buttons
    │   ├── EmptyState/
    │   │   └── EmptyState.tsx
    │   ├── ErrorBoundary/
    │   │   └── ErrorBoundary.tsx
    │   ├── LoadingOverlay/
    │   │   └── LoadingOverlay.tsx
    │   └── PageHeader/
    │       └── PageHeader.tsx         # Título + breadcrumbs
    │
    └── hooks/
        ├── useDebounce.ts
        ├── useMediaQuery.ts
        └── useDisclosure.ts           # Modal/drawer state
```

### 3.3 Convenciones de Importación

**Path Aliases (tsconfig.json + vite.config.ts):**
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@app/*": ["./src/app/*"],
      "@pages/*": ["./src/pages/*"],
      "@widgets/*": ["./src/widgets/*"],
      "@features/*": ["./src/features/*"],
      "@entities/*": ["./src/entities/*"],
      "@shared/*": ["./src/shared/*"]
    }
  }
}
```

**Ejemplo de imports:**
```typescript
// ✅ CORRECTO
import { useLogin } from '@features/auth/login';
import { AppointmentCard } from '@entities/appointment';
import { Button } from '@mantine/core';
import { apiClient } from '@shared/api/client';

// ❌ INCORRECTO (viola regla de capas)
import { DashboardPage } from '@pages/DashboardPage'; // desde feature/
```

### 3.4 Public API Pattern

Cada slice (feature, entity, widget) expone solo lo necesario vía `index.ts`:

```typescript
// features/offering/create/index.ts
export { CreateOfferingModal } from './ui/CreateOfferingModal';
export { useCreateOffering } from './model/useCreateOffering';
// NO exportar: OfferingForm (interno), schema (interno)
```

**Beneficios:**
- Encapsulación
- Refactoring fácil (cambiar internals sin romper imports)
- Tree-shaking mejorado

---

## 4. Gestión de Estado

### 4.1 TanStack Query (Server State)

**Configuración Global:**
```typescript
// app/providers/QueryProvider.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutos
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

export function QueryProvider({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

**Query Keys Pattern:**
```typescript
// entities/appointment/model/queries.ts
export const appointmentKeys = {
  all: ['appointments'] as const,
  lists: () => [...appointmentKeys.all, 'list'] as const,
  list: (filters: AppointmentFilters) => [...appointmentKeys.lists(), filters] as const,
  details: () => [...appointmentKeys.all, 'detail'] as const,
  detail: (id: string) => [...appointmentKeys.details(), id] as const,
  upcoming: () => [...appointmentKeys.all, 'upcoming'] as const,
};

// Uso en hook
export function useAppointment(id: string) {
  return useQuery({
    queryKey: appointmentKeys.detail(id),
    queryFn: () => appointmentsApi.getById(id),
  });
}
```

**Mutation con Optimistic Update:**
```typescript
// features/appointment/cancel/model/useCancelAppointment.ts
export function useCancelAppointment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (appointmentId: string) => 
      appointmentsApi.cancel(appointmentId),
    
    onMutate: async (appointmentId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: appointmentKeys.detail(appointmentId)
      });
      
      // Snapshot previous value
      const previous = queryClient.getQueryData(
        appointmentKeys.detail(appointmentId)
      );
      
      // Optimistically update
      queryClient.setQueryData(
        appointmentKeys.detail(appointmentId),
        (old: Appointment) => ({ ...old, status: 'CANCELLED' })
      );
      
      return { previous };
    },
    
    onError: (err, appointmentId, context) => {
      // Rollback on error
      queryClient.setQueryData(
        appointmentKeys.detail(appointmentId),
        context?.previous
      );
    },
    
    onSettled: (data, error, appointmentId) => {
      // Invalidate to refetch
      queryClient.invalidateQueries({
        queryKey: appointmentKeys.detail(appointmentId)
      });
      queryClient.invalidateQueries({
        queryKey: appointmentKeys.upcoming()
      });
    },
  });
}
```

### 4.2 Zustand (UI State)

**Auth Store:**
```typescript
// app/store/auth.store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      
      login: (user, token) => set({ 
        user, 
        token, 
        isAuthenticated: true 
      }),
      
      logout: () => set({ 
        user: null, 
        token: null, 
        isAuthenticated: false 
      }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        token: state.token, 
        user: state.user 
      }),
    }
  )
);
```

**Filters Store:**
```typescript
// features/appointment/filter/model/useAppointmentFilters.ts
interface FiltersState {
  status: AppointmentStatus | null;
  dateRange: [Date, Date] | null;
  offeringId: string | null;
  setStatus: (status: AppointmentStatus | null) => void;
  setDateRange: (range: [Date, Date] | null) => void;
  setOfferingId: (id: string | null) => void;
  reset: () => void;
}

export const useAppointmentFilters = create<FiltersState>((set) => ({
  status: null,
  dateRange: null,
  offeringId: null,
  setStatus: (status) => set({ status }),
  setDateRange: (dateRange) => set({ dateRange }),
  setOfferingId: (offeringId) => set({ offeringId }),
  reset: () => set({ status: null, dateRange: null, offeringId: null }),
}));
```

### 4.3 Cuándo usar qué

| Estado | Herramienta | Ejemplo |
|--------|-------------|---------|
| Server data (GET) | TanStack Query | Appointments, Offerings |
| Server mutations (POST/PUT) | TanStack Query | Create/Update Offering |
| Auth | Zustand + persist | User, token |
| UI State (global) | Zustand | Filters, sidebar collapsed |
| UI State (local) | useState | Modal open/closed |
| Form State | React Hook Form | Form inputs |

---

## 5. API Integration

### 5.1 Axios Client Setup

```typescript
// shared/api/client.ts
import axios from 'axios';
import { useAuthStore } from '@app/store/auth.store';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - agregar token
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
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
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

### 5.2 API Services por Entidad

```typescript
// entities/offering/model/api.ts
import { apiClient } from '@shared/api/client';
import type { Offering, CreateOfferingDTO, UpdateOfferingDTO } from './types';

export const offeringsApi = {
  getAll: async (businessId: string): Promise<Offering[]> => {
    const { data } = await apiClient.get(`/offerings`, {
      params: { businessId }
    });
    return data;
  },
  
  getById: async (id: string): Promise<Offering> => {
    const { data } = await apiClient.get(`/offerings/${id}`);
    return data;
  },
  
  create: async (dto: CreateOfferingDTO): Promise<Offering> => {
    const { data } = await apiClient.post('/offerings', dto);
    return data;
  },
  
  update: async (id: string, dto: UpdateOfferingDTO): Promise<Offering> => {
    const { data } = await apiClient.put(`/offerings/${id}`, dto);
    return data;
  },
  
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/offerings/${id}`);
  },
  
  toggleActive: async (id: string, isActive: boolean): Promise<Offering> => {
    const { data } = await apiClient.patch(`/offerings/${id}/active`, { isActive });
    return data;
  },
};
```

### 5.3 Type Safety con OpenAPI Codegen

**Comando para generar:**
```bash
npx openapi-typescript-codegen \
  --input http://localhost:3000/api-json \
  --output ./src/shared/api/generated \
  --client axios
```

**Uso:**
```typescript
// shared/api/generated/services/OfferingsService.ts (auto-generado)
export class OfferingsService {
  public static async getOfferings(businessId: string): Promise<Offering[]> {
    // implementación auto-generada
  }
}

// entities/offering/model/api.ts
import { OfferingsService } from '@shared/api/generated/services/OfferingsService';

export const offeringsApi = {
  getAll: OfferingsService.getOfferings, // Tipos ya sincronizados
};
```

### 5.4 Mapeo Backend ↔ Frontend

| Backend Endpoint | Frontend Service | Query Key |
|------------------|------------------|-----------|
| `GET /api/appointments` | `appointmentsApi.getAll()` | `['appointments', 'list', filters]` |
| `GET /api/appointments/:id` | `appointmentsApi.getById()` | `['appointments', 'detail', id]` |
| `POST /api/appointments` | `appointmentsApi.create()` | mutation |
| `PUT /api/appointments/:id/cancel` | `appointmentsApi.cancel()` | mutation |
| `GET /api/offerings` | `offeringsApi.getAll()` | `['offerings', 'list']` |
| `POST /api/offerings` | `offeringsApi.create()` | mutation |
| `GET /api/schedules` | `schedulesApi.getAll()` | `['schedules', 'list']` |
| `GET /api/admin-queries/pending` | `conversationsApi.getPending()` | `['conversations', 'pending']` |

---

## 6. Páginas y Componentes Principales

### 6.1 Dashboard Page

**Componentes:**
1. **StatsCards Widget** (4 cards)
   - Citas hoy
   - Citas esta semana
   - Consultas pendientes
   - Tasa de ocupación

2. **UpcomingAppointments Widget**
   - Lista de próximas 5 citas
   - Botón "Ver todas"

3. **PendingQueries Widget**
   - Badge con número
   - Lista de últimas consultas
   - Botón rápido "Responder"

4. **WeekCalendar Widget**
   - Vista semanal compacta
   - Citas por día

**Layout:**
```
┌─────────────────────────────────────────────────┐
│  [📊 Hoy: 12]  [📅 Semana: 45]  [💬 Pend: 3]   │
│  [📈 Ocupación: 78%]                            │
├─────────────────────────┬───────────────────────┤
│                         │                       │
│  Próximas Citas         │   Consultas Pend.     │
│  ─────────────          │   ─────────────       │
│  • 10:00 Juan Pérez     │   • Cliente #123      │
│  • 11:30 María García   │     "Necesito..."     │
│  • 14:00 Carlos López   │   [Responder]         │
│  ...                    │                       │
│                         │                       │
├─────────────────────────┴───────────────────────┤
│                                                  │
│         Calendario Semanal                       │
│  ─────────────────────────────────────          │
│  Lun  Mar  Mié  Jue  Vie  Sáb  Dom              │
│  [5]  [7]  [6]  [8]  [4]  [2]  [0]              │
│                                                  │
└─────────────────────────────────────────────────┘
```

**Código ejemplo:**
```typescript
// pages/DashboardPage/ui/DashboardPage.tsx
import { Grid } from '@mantine/core';
import { StatsCards } from '@widgets/StatsCards';
import { UpcomingAppointments } from '@widgets/UpcomingAppointments';
import { PendingQueries } from '@widgets/PendingQueries';
import { WeekCalendar } from '@widgets/WeekCalendar';

export function DashboardPage() {
  return (
    <div>
      <StatsCards />
      
      <Grid mt="xl">
        <Grid.Col span={8}>
          <UpcomingAppointments />
        </Grid.Col>
        <Grid.Col span={4}>
          <PendingQueries />
        </Grid.Col>
      </Grid>
      
      <WeekCalendar mt="xl" />
    </div>
  );
}
```

### 6.2 Appointments Page

**Features:**
- Tabla con paginación + búsqueda
- Filtros: estado, rango de fechas, servicio
- Vista de calendario alternativa (botón toggle)
- Acciones: Ver detalles, Cancelar

**Tabla Columns:**
| Cliente | Servicio | Fecha/Hora | Estado | Acciones |
|---------|----------|------------|--------|----------|
| Juan Pérez | Corte | Lun 18/12 10:30 | ✅ Confirmada | [👁️] [❌] |

**Filtros:**
```typescript
// features/appointment/filter/ui/AppointmentFilters.tsx
<Group>
  <Select
    label="Estado"
    data={[
      { value: 'CONFIRMED', label: 'Confirmada' },
      { value: 'CANCELLED', label: 'Cancelada' },
      { value: 'COMPLETED', label: 'Completada' },
    ]}
    value={filters.status}
    onChange={setStatus}
  />
  
  <DateRangePicker
    label="Rango de fechas"
    value={filters.dateRange}
    onChange={setDateRange}
  />
  
  <Select
    label="Servicio"
    data={offerings}
    value={filters.offeringId}
    onChange={setOfferingId}
  />
  
  <Button onClick={reset} variant="subtle">
    Limpiar filtros
  </Button>
</Group>
```

### 6.3 Offerings Page

**Features:**
- Tabla con servicios
- Botón "Crear Servicio" (abre modal)
- Acciones por fila: Editar, Desactivar/Activar, Eliminar

**Tabla:**
| Nombre | Duración | Capacidad/Slot | Límite Diario | Estado | Acciones |
|--------|----------|----------------|---------------|--------|----------|
| Corte de Pelo | 30 min | 4 | 20 | ✅ Activo | [✏️] [🔄] [🗑️] |

**Modal de Creación/Edición:**
```typescript
// features/offering/create/ui/CreateOfferingModal.tsx
<Modal opened={opened} onClose={close} title="Crear Servicio">
  <form onSubmit={handleSubmit(onSubmit)}>
    <TextInput
      label="Nombre del servicio"
      {...register('name')}
      error={errors.name?.message}
    />
    
    <NumberInput
      label="Duración (minutos)"
      {...register('duration')}
      min={15}
      step={15}
    />
    
    <NumberInput
      label="Capacidad máxima por slot"
      {...register('maxCapacityPerSlot')}
      min={1}
    />
    
    <NumberInput
      label="Límite diario (opcional)"
      {...register('maxDailyCapacity')}
    />
    
    <Group mt="md">
      <Button type="submit" loading={isLoading}>
        Crear
      </Button>
      <Button variant="subtle" onClick={close}>
        Cancelar
      </Button>
    </Group>
  </form>
</Modal>
```

### 6.4 Schedules Page

**Features:**
- Tabla por día de semana
- Crear horario (modal)
- Editar/Eliminar horarios existentes

**Ejemplo Visual:**
```
Lunes:     09:00 - 13:00  |  14:00 - 18:00   [✏️] [🗑️]
Martes:    09:00 - 13:00  |  14:00 - 18:00   [✏️] [🗑️]
Miércoles: 09:00 - 13:00  |  14:00 - 18:00   [✏️] [🗑️]
...
Domingo:   Cerrado                            [+ Agregar]
```

**Blockouts Section:**
```
Próximos Bloqueos:
─────────────────
• 24-25 Dic: Navidad
• 31 Dic - 1 Ene: Año Nuevo
[+ Agregar bloqueo]
```

### 6.5 Conversations Page

**Features:**
- Lista de conversaciones pendientes
- Click en conversación → Modal con historial + responder

**Layout:**
```
┌─────────────────────────────────────────┐
│  Consultas Pendientes (3)               │
├─────────────────────────────────────────┤
│  ┌─────────────────────────────────┐   │
│  │ 👤 +1 809-555-1234              │   │
│  │ "Necesito cambiar mi cita..."   │   │
│  │ Hace 2 horas                    │   │
│  │ [Responder]                     │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ 👤 +1 809-555-5678              │   │
│  │ "¿Tienen disponibilidad el..."  │   │
│  │ Hace 5 horas                    │   │
│  │ [Responder]                     │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

**Modal de Respuesta:**
```typescript
// features/conversation/respond/ui/RespondToQueryModal.tsx
<Modal opened={opened} onClose={close} size="lg">
  <Stack>
    <Text size="sm" c="dimmed">
      Conversación con +1 809-555-1234
    </Text>
    
    {/* Historial */}
    <ScrollArea h={300}>
      {messages.map(msg => (
        <MessageBubble key={msg.id} message={msg} />
      ))}
    </ScrollArea>
    
    {/* Form de respuesta */}
    <Textarea
      placeholder="Escribe tu respuesta..."
      {...register('response')}
      minRows={3}
    />
    
    <Button onClick={handleSend} loading={isSending}>
      Enviar Respuesta
    </Button>
  </Stack>
</Modal>
```

### 6.6 Settings Page

**Tabs:**
1. **Información del Negocio**
   - Nombre comercial
   - Dirección
   - Zona horaria

2. **Configuración de WhatsApp**
   - Número de WhatsApp Business
   - Webhook URL (read-only)
   - Botón "Probar Conexión"

3. **Preferencias**
   - Tiempo de recordatorio (24h, 12h, 2h)
   - Notificaciones por email
   - Idioma (post-MVP)

---

## 7. Forms & Validation

### 7.1 Patrón de Formularios

**Schema Zod compartido:**
```typescript
// features/offering/create/model/schema.ts
import { z } from 'zod';

export const offeringSchema = z.object({
  name: z.string()
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(50, 'El nombre no puede exceder 50 caracteres'),
  
  duration: z.number()
    .min(15, 'La duración mínima es 15 minutos')
    .max(480, 'La duración máxima es 8 horas')
    .multipleOf(15, 'Debe ser múltiplo de 15 minutos'),
  
  maxCapacityPerSlot: z.number()
    .min(1, 'Debe permitir al menos 1 cliente')
    .max(20, 'Máximo 20 clientes por slot'),
  
  maxDailyCapacity: z.number()
    .min(1)
    .optional()
    .nullable(),
});

export type OfferingFormData = z.infer<typeof offeringSchema>;
```

**Hook del formulario:**
```typescript
// features/offering/create/ui/OfferingForm.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { offeringSchema, type OfferingFormData } from '../model/schema';

export function OfferingForm({ 
  onSubmit, 
  defaultValues 
}: OfferingFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<OfferingFormData>({
    resolver: zodResolver(offeringSchema),
    defaultValues,
  });
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <TextInput
        label="Nombre del servicio"
        placeholder="Ej: Corte de Pelo"
        {...register('name')}
        error={errors.name?.message}
      />
      
      <NumberInput
        label="Duración (minutos)"
        {...register('duration', { valueAsNumber: true })}
        error={errors.duration?.message}
        min={15}
        step={15}
      />
      
      {/* ... más campos */}
      
      <Button type="submit" loading={isSubmitting}>
        Guardar
      </Button>
    </form>
  );
}
```

### 7.2 Validaciones Comunes

```typescript
// shared/lib/validation/schemas.ts
import { z } from 'zod';

export const emailSchema = z.string()
  .email('Email inválido');

export const phoneSchema = z.string()
  .regex(/^\+1\d{10}$/, 'Formato: +18095551234');

export const timeSchema = z.string()
  .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Formato: HH:MM');

export const dateRangeSchema = z.object({
  start: z.date(),
  end: z.date(),
}).refine(
  (data) => data.end > data.start,
  { message: 'La fecha final debe ser posterior a la inicial' }
);
```

---

## 8. Routing & Navigation

### 8.1 Definición de Rutas

```typescript
// app/router/routes.tsx
import { createBrowserRouter } from 'react-router-dom';
import { DashboardLayout } from '@app/layouts/DashboardLayout';
import { ProtectedRoute } from './ProtectedRoute';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: <ProtectedRoute />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          {
            index: true,
            element: <DashboardPage />,
          },
          {
            path: 'appointments',
            element: <AppointmentsPage />,
          },
          {
            path: 'offerings',
            element: <OfferingsPage />,
          },
          {
            path: 'schedules',
            element: <SchedulesPage />,
          },
          {
            path: 'conversations',
            element: <ConversationsPage />,
          },
          {
            path: 'settings',
            element: <SettingsPage />,
          },
        ],
      },
    ],
  },
]);
```

### 8.2 Protected Route

```typescript
// app/router/ProtectedRoute.tsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@app/store/auth.store';

export function ProtectedRoute() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <Outlet />;
}
```

### 8.3 Dashboard Layout

```typescript
// app/layouts/DashboardLayout.tsx
import { AppShell, Navbar, Header } from '@mantine/core';
import { Outlet } from 'react-router-dom';

export function DashboardLayout() {
  return (
    <AppShell
      padding="md"
      navbar={<Navbar width={{ base: 250 }} p="xs">
        {/* Navigation links */}
        <NavLink to="/" label="Dashboard" icon={<IconDashboard />} />
        <NavLink to="/appointments" label="Citas" icon={<IconCalendar />} />
        <NavLink to="/offerings" label="Servicios" icon={<IconClipboard />} />
        <NavLink to="/schedules" label="Horarios" icon={<IconClock />} />
        <NavLink to="/conversations" label="Consultas" icon={<IconMessage />} />
        <NavLink to="/settings" label="Configuración" icon={<IconSettings />} />
      </Navbar>}
      header={<Header height={60} p="xs">
        {/* Logo + User menu */}
      </Header>}
    >
      <Outlet />
    </AppShell>
  );
}
```

---

## 9. Manejo de Errores y Loading States

### 9.1 Error Boundary

```typescript
// shared/ui/ErrorBoundary/ErrorBoundary.tsx
import { Component, ReactNode } from 'react';
import { Container, Title, Text, Button } from '@mantine/core';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Error Boundary caught:', error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <Container>
          <Title order={1}>Algo salió mal</Title>
          <Text c="dimmed" mt="md">
            {this.state.error?.message}
          </Text>
          <Button 
            mt="xl" 
            onClick={() => window.location.reload()}
          >
            Recargar página
          </Button>
        </Container>
      );
    }
    
    return this.props.children;
  }
}
```

### 9.2 Query Loading & Error States

**Pattern con TanStack Query:**
```typescript
// pages/AppointmentsPage/ui/AppointmentsPage.tsx
export function AppointmentsPage() {
  const { 
    data: appointments, 
    isLoading, 
    isError, 
    error 
  } = useAppointments();
  
  if (isLoading) {
    return <LoadingOverlay visible />;
  }
  
  if (isError) {
    return (
      <Alert color="red" title="Error al cargar citas">
        {error.message}
      </Alert>
    );
  }
  
  if (appointments.length === 0) {
    return <EmptyState message="No hay citas programadas" />;
  }
  
  return <AppointmentsTable appointments={appointments} />;
}
```

### 9.3 Mutation Error Handling

```typescript
// features/offering/create/model/useCreateOffering.ts
export function useCreateOffering() {
  return useMutation({
    mutationFn: offeringsApi.create,
    onError: (error: AxiosError) => {
      if (error.response?.status === 409) {
        notifications.show({
          title: 'Error',
          message: 'Ya existe un servicio con ese nombre',
          color: 'red',
        });
      } else {
        notifications.show({
          title: 'Error',
          message: 'No se pudo crear el servicio',
          color: 'red',
        });
      }
    },
    onSuccess: () => {
      notifications.show({
        title: 'Éxito',
        message: 'Servicio creado correctamente',
        color: 'green',
      });
    },
  });
}
```

---

## 10. Testing Strategy

### 10.1 Unit Tests (Vitest)

```typescript
// entities/offering/lib/formatDuration.test.ts
import { describe, it, expect } from 'vitest';
import { formatDuration } from './formatDuration';

describe('formatDuration', () => {
  it('formatea minutos correctamente', () => {
    expect(formatDuration(30)).


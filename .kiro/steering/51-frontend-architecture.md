---
inclusion: fileMatch
fileMatchPattern: "apps/frontend/**/*.{ts,tsx}"
---

# Frontend Architecture & Stack

**Frontend architecture, technologies, and libraries**

> **Cross-References:**
>
> - [41-frontend-testing.md](./41-frontend-testing.md) - Frontend testing patterns
> - [04-system-architecture.md](./04-system-architecture.md) - Overall architecture
> - [62-development-workflow.md](./62-development-workflow.md) - Development workflow

---

# Frontend Architecture & Stack

Este documento define la arquitectura y stack tecnológico del frontend (React + Vite).

## Core Framework

### React (v18.x)

**Propósito:** UI library principal  
**Características:**

- Component-based architecture
- Virtual DOM
- Hooks API
- Concurrent features
- Server Components (future)

**Instalación:**

```bash
pnpm add react react-dom
pnpm add -D @types/react @types/react-dom
```

### Vite (v5.x)

**Propósito:** Build tool y dev server  
**Características:**

- Fast HMR (Hot Module Replacement)
- ESM-based
- Optimized builds
- Plugin ecosystem
- TypeScript support

**Instalación:**

```bash
pnpm add -D vite @vitejs/plugin-react
```

**Configuración (vite.config.ts):**

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
});
```

---

## State Management

### TanStack Query (React Query v5.x)

**Propósito:** Server state management  
**Características:**

- Automatic caching
- Background refetching
- Optimistic updates
- Pagination support
- Infinite queries

**Instalación:**

```bash
pnpm add @tanstack/react-query
pnpm add -D @tanstack/react-query-devtools
```

**Setup:**

```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <YourApp />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

**Uso:**

```typescript
import { useQuery, useMutation } from "@tanstack/react-query";

// Query
function useAppointments() {
  return useQuery({
    queryKey: ["appointments"],
    queryFn: () => apiClient.getAppointments(),
  });
}

// Mutation
function useCancelAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiClient.cancelAppointment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
  });
}
```

---

## Routing

### React Router (v6.x)

**Propósito:** Client-side routing  
**Características:**

- Nested routes
- Lazy loading
- Route guards
- URL parameters
- Navigation hooks

**Instalación:**

```bash
pnpm add react-router-dom
```

**Uso:**

```typescript
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/appointments" element={<AppointmentsPage />} />
        <Route path="/appointments/:id" element={<AppointmentDetailPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
```

---

## UI Components

### Mantine (v7.x)

**Propósito:** Component library  
**Características:**

- 100+ components
- Dark mode support
- Customizable theme
- Accessibility (ARIA)
- TypeScript support

**Instalación:**

```bash
pnpm add @mantine/core @mantine/hooks @mantine/dates
pnpm add @mantine/notifications @mantine/modals
pnpm add dayjs
```

**Setup:**

```typescript
import { MantineProvider } from '@mantine/core';
import '@mantine/core/styles.css';

function App() {
  return (
    <MantineProvider>
      <YourApp />
    </MantineProvider>
  );
}
```

**Uso:**

```typescript
import { Button, Card, Text, Group } from '@mantine/core';

function AppointmentCard({ appointment }) {
  return (
    <Card shadow="sm" padding="lg">
      <Text size="lg" weight={500}>{appointment.offeringName}</Text>
      <Text size="sm" color="dimmed">{appointment.dateTime}</Text>
      <Group mt="md">
        <Button variant="light">Ver Detalles</Button>
        <Button color="red">Cancelar</Button>
      </Group>
    </Card>
  );
}
```

---

## Forms

### React Hook Form (v7.x)

**Propósito:** Form management  
**Características:**

- Performance optimized
- Minimal re-renders
- Built-in validation
- TypeScript support
- Easy integration with UI libraries

**Instalación:**

```bash
pnpm add react-hook-form
pnpm add @hookform/resolvers zod
```

**Uso:**

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  offeringId: z.string().uuid(),
  date: z.string(),
  time: z.string(),
});

type FormData = z.infer<typeof schema>;

function AppointmentForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = (data: FormData) => {
    console.log(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <select {...register('offeringId')}>
        <option value="">Selecciona un servicio</option>
      </select>
      {errors.offeringId && <span>{errors.offeringId.message}</span>}

      <input type="date" {...register('date')} />
      {errors.date && <span>{errors.date.message}</span>}

      <button type="submit">Confirmar</button>
    </form>
  );
}
```

---

## Validation

### Zod (v3.x)

**Propósito:** Schema validation  
**Características:**

- TypeScript-first
- Type inference
- Composable schemas
- Custom validators
- Error messages

**Instalación:**

```bash
pnpm add zod
```

**Uso:**

```typescript
import { z } from "zod";

const appointmentSchema = z.object({
  offeringId: z.string().uuid("ID de servicio inválido"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida"),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Hora inválida"),
});

// Type inference
type Appointment = z.infer<typeof appointmentSchema>;

// Validation
const result = appointmentSchema.safeParse(data);
if (!result.success) {
  console.error(result.error.errors);
}
```

---

## Date & Time

### date-fns (v2.x)

**Propósito:** Date manipulation  
**Características:**

- Immutable
- Tree-shakeable
- Locale support
- Timezone support

**Instalación:**

```bash
pnpm add date-fns
```

**Uso:**

```typescript
import { format, addDays, isBefore } from "date-fns";
import { es } from "date-fns/locale";

// Format date
const formatted = format(new Date(), "dd MMMM yyyy", { locale: es });
// "20 Diciembre 2024"

// Add days
const nextWeek = addDays(new Date(), 7);

// Compare dates
const isPast = isBefore(date, new Date());
```

---

## HTTP Client

### Axios (v1.x)

**Propósito:** HTTP client  
**Características:**

- Promise-based
- Interceptors
- Request/response transformation
- Automatic JSON parsing

**Instalación:**

```bash
pnpm add axios
```

**API Client:**

```typescript
import axios from "axios";

const apiClient = axios.create({
  baseURL: "/api",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor (add auth token)
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor (handle errors)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

export default apiClient;
```

---

## Testing

### Vitest (v1.x)

**Propósito:** Test runner  
**Características:**

- Vite-native
- Fast execution
- Jest-compatible API
- ESM support
- Coverage reports

**Instalación:**

```bash
pnpm add -D vitest @vitest/ui
```

### Testing Library (v14.x)

**Propósito:** Component testing  
**Características:**

- User-centric queries
- Accessibility testing
- Async utilities
- User event simulation

**Instalación:**

```bash
pnpm add -D @testing-library/react @testing-library/jest-dom
pnpm add -D @testing-library/user-event
```

---

## Development Tools

### TypeScript (v5.x)

**Propósito:** Type safety  
**Características:**

- Static typing
- IntelliSense
- Refactoring support
- Compile-time errors

**Configuración (tsconfig.json):**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### ESLint (v8.x)

**Propósito:** Code linting  
**Características:**

- Code quality rules
- Best practices enforcement
- Auto-fix support
- Plugin ecosystem

**Instalación:**

```bash
pnpm add -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
pnpm add -D eslint-plugin-react eslint-plugin-react-hooks
```

### Prettier (v3.x)

**Propósito:** Code formatting  
**Características:**

- Consistent formatting
- Auto-format on save
- Integration with editors

**Instalación:**

```bash
pnpm add -D prettier eslint-config-prettier
```

---

## Architecture Patterns

### Feature-Sliced Design

**Estructura:**

```
src/
├── app/                    # App initialization
│   ├── providers/          # Global providers
│   ├── router/             # Routing configuration
│   └── styles/             # Global styles
├── pages/                  # Route pages
│   ├── home/
│   ├── appointments/
│   └── login/
├── features/               # Business features
│   ├── appointment/
│   │   ├── create/
│   │   ├── cancel/
│   │   └── list/
│   └── auth/
│       ├── login/
│       └── logout/
├── entities/               # Business entities
│   ├── appointment/
│   ├── offering/
│   └── customer/
├── shared/                 # Shared code
│   ├── api/                # API client
│   ├── ui/                 # UI components
│   ├── lib/                # Utilities
│   └── config/             # Configuration
└── main.tsx                # Entry point
```

### Feature Structure

```
features/appointment/create/
├── ui/
│   ├── CreateAppointmentForm.tsx
│   └── CreateAppointmentModal.tsx
├── model/
│   ├── useCreateAppointment.ts
│   └── validation.ts
├── api/
│   └── createAppointment.ts
└── index.ts
```

---

## Environment Variables

```bash
# .env.example
VITE_API_URL=http://localhost:3000/api
VITE_APP_NAME=Bookings Bot
VITE_APP_VERSION=1.0.0
```

**Uso:**

```typescript
const apiUrl = import.meta.env.VITE_API_URL;
const appName = import.meta.env.VITE_APP_NAME;
```

---

## Build & Deployment

### Build Commands

```bash
# Development
pnpm --filter frontend dev

# Build for production
pnpm --filter frontend build

# Preview production build
pnpm --filter frontend preview

# Type check
pnpm --filter frontend typecheck

# Lint
pnpm --filter frontend lint

# Test
pnpm --filter frontend test
```

### Build Output

```
dist/
├── assets/
│   ├── index-[hash].js
│   ├── index-[hash].css
│   └── [images]
└── index.html
```

---

## Performance Optimization

### Code Splitting

```typescript
import { lazy, Suspense } from 'react';

const AppointmentsPage = lazy(() => import('./pages/appointments'));

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <AppointmentsPage />
    </Suspense>
  );
}
```

### Memoization

```typescript
import { memo, useMemo, useCallback } from 'react';

const AppointmentCard = memo(({ appointment }) => {
  return <Card>{appointment.offeringName}</Card>;
});

function AppointmentList({ appointments }) {
  const sortedAppointments = useMemo(
    () => appointments.sort((a, b) => a.dateTime - b.dateTime),
    [appointments]
  );

  const handleCancel = useCallback((id: string) => {
    // Cancel logic
  }, []);

  return (
    <>
      {sortedAppointments.map(apt => (
        <AppointmentCard key={apt.id} appointment={apt} />
      ))}
    </>
  );
}
```

---

## Troubleshooting

### Vite HMR Not Working

**Problema:** Changes not reflected

**Solución:**

```bash
# Clear Vite cache
rm -rf node_modules/.vite

# Restart dev server
pnpm --filter frontend dev
```

### Module Resolution Issues

**Problema:** Cannot find module '@/...'

**Solución:**

```typescript
// vite.config.ts
resolve: {
  alias: {
    '@': path.resolve(__dirname, './src'),
  },
}

// tsconfig.json
"paths": {
  "@/*": ["./src/*"]
}
```

### Build Errors

**Problema:** Build fails with type errors

**Solución:**

```bash
# Type check first
pnpm --filter frontend typecheck

# Fix type errors, then build
pnpm --filter frontend build
```

---

**Last Updated:** January 9, 2026  
**Status:** Active

---
inclusion: always
---

# Frontend PRD - Panel de Administración Web

**Stack:** React + Vite + TypeScript + Feature-Sliced Design (FSD)  
**Target:** Dueños de negocios gestionando reservaciones vía WhatsApp

---

## 1. Objetivos MVP

- Dashboard en tiempo real (citas, métricas)
- Gestión de servicios (offerings) y horarios
- Calendario interactivo de reservaciones
- Sistema de respuesta a consultas de clientes
- Responsive (desktop-first, mobile-friendly)

---

## 2. Stack Tecnológico

### Core

- **React 18** + **Vite 5** + **TypeScript 5**
- **TanStack Query 5** - Server state, caching, optimistic updates
- **Zustand 4** - UI state (modals, filters)
- **React Router 6** - Routing, code splitting

### UI & Forms

- **Mantine 7** - 120+ componentes, theming, accesibilidad
- **React Hook Form 7** + **Zod 3** - Validación con schema reutilizable
- **Tabler Icons** - Iconografía

### Data & Utils

- **Axios** + **OpenAPI Codegen** - Cliente API con tipos sincronizados
- **date-fns** + **date-fns-tz** - Manejo de fechas/zonas horarias
- **Vitest** + **Testing Library** + **MSW** - Testing

---

## 3. Arquitectura: Feature-Sliced Design (FSD)

### Capas (Bottom-Up)

```
1. shared/     → Código reutilizable sin lógica de negocio
2. entities/   → Modelos de dominio (Appointment, Offering)
3. features/   → Casos de uso (CreateOffering, CancelAppointment)
4. widgets/    → Composiciones complejas (StatsCards, Calendar)
5. pages/      → Pantallas completas (DashboardPage, SettingsPage)
6. app/        → Inicialización (providers, router, theme)
```

**Regla:** Capas superiores importan de inferiores, NUNCA al revés.

### Estructura Resumida

```
src/
├── app/
│   ├── providers/      # QueryProvider, MantineProvider
│   ├── router/         # routes.tsx, ProtectedRoute
│   ├── store/          # auth.store.ts (Zustand)
│   └── layouts/        # DashboardLayout, AuthLayout
├── pages/
│   ├── DashboardPage/
│   ├── AppointmentsPage/
│   ├── OfferingsPage/
│   ├── SchedulesPage/
│   ├── ConversationsPage/
│   └── SettingsPage/
├── widgets/
│   ├── StatsCards/
│   ├── UpcomingAppointments/
│   ├── PendingQueries/
│   └── WeekCalendar/
├── features/
│   ├── auth/login/
│   ├── offering/create/
│   ├── appointment/cancel/
│   └── conversation/respond/
├── entities/
│   ├── appointment/
│   ├── offering/
│   └── customer/
└── shared/
    ├── api/            # client.ts, endpoints.ts
    ├── config/         # env.ts, constants.ts
    ├── lib/            # date/, validation/
    ├── ui/             # EmptyState, LoadingOverlay
    └── hooks/          # useDebounce, useMediaQuery
```

---

## 4. State Management

### TanStack Query (Server State)

```typescript
// Query Keys Pattern
export const appointmentKeys = {
  all: ["appointments"] as const,
  lists: () => [...appointmentKeys.all, "list"] as const,
  list: (filters) => [...appointmentKeys.lists(), filters] as const,
  detail: (id) => [...appointmentKeys.all, "detail", id] as const,
};

// Hook
export function useAppointment(id: string) {
  return useQuery({
    queryKey: appointmentKeys.detail(id),
    queryFn: () => appointmentsApi.getById(id),
  });
}

// Mutation con Optimistic Update
export function useCancelAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => appointmentsApi.cancel(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: appointmentKeys.detail(id) });
      const previous = queryClient.getQueryData(appointmentKeys.detail(id));
      queryClient.setQueryData(appointmentKeys.detail(id), (old) => ({
        ...old,
        status: "CANCELLED",
      }));
      return { previous };
    },
    onError: (err, id, context) => {
      queryClient.setQueryData(appointmentKeys.detail(id), context?.previous);
    },
    onSettled: (data, error, id) => {
      queryClient.invalidateQueries({ queryKey: appointmentKeys.detail(id) });
    },
  });
}
```

### Zustand (UI State)

```typescript
// Auth Store
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      login: (user, token) => set({ user, token, isAuthenticated: true }),
      logout: () => set({ user: null, token: null, isAuthenticated: false }),
    }),
    { name: "auth-storage" },
  ),
);

// Filters Store
export const useAppointmentFilters = create<FiltersState>((set) => ({
  status: null,
  dateRange: null,
  setStatus: (status) => set({ status }),
  setDateRange: (dateRange) => set({ dateRange }),
  reset: () => set({ status: null, dateRange: null }),
}));
```

**Cuándo usar qué:**

- **TanStack Query:** Server data (GET), mutations (POST/PUT)
- **Zustand:** Auth, UI state global (filters, sidebar)
- **useState:** UI state local (modal open/closed)
- **React Hook Form:** Form state

---

## 5. API Integration

### Axios Client

```typescript
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api",
  timeout: 10000,
});

// Request interceptor - agregar token
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor - manejar errores
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);
```

### API Services

```typescript
export const offeringsApi = {
  getAll: async (businessId: string) => {
    const { data } = await apiClient.get("/offerings", {
      params: { businessId },
    });
    return data;
  },
  create: async (dto: CreateOfferingDTO) => {
    const { data } = await apiClient.post("/offerings", dto);
    return data;
  },
  update: async (id: string, dto: UpdateOfferingDTO) => {
    const { data } = await apiClient.put(`/offerings/${id}`, dto);
    return data;
  },
};
```

---

## 6. Páginas Principales

### Dashboard

- **StatsCards:** Citas hoy, semana, consultas pendientes, ocupación
- **UpcomingAppointments:** Próximas 5 citas
- **PendingQueries:** Consultas de clientes
- **WeekCalendar:** Vista semanal compacta

### Appointments

- Tabla con paginación + búsqueda
- Filtros: estado, rango de fechas, servicio
- Vista calendario alternativa (toggle)
- Acciones: Ver detalles, Cancelar

### Offerings

- Tabla de servicios
- Crear/Editar/Desactivar servicio
- Configurar duración y capacidad

### Schedules

- Horarios por día de semana
- Crear/Editar/Eliminar horarios
- Sección de bloqueos (vacaciones, festivos)

### Conversations

- Lista de consultas pendientes
- Modal con historial + responder
- Ver conversación completa

### Settings

- Información del negocio
- Configuración de WhatsApp
- Zona horaria
- Preferencias

---

## 7. Forms & Validation

### Pattern con Zod + React Hook Form

```typescript
// Schema
export const offeringSchema = z.object({
  name: z.string().min(3).max(50),
  duration: z.number().min(15).max(480).multipleOf(15),
  maxCapacityPerSlot: z.number().min(1).max(20),
});

export type OfferingFormData = z.infer<typeof offeringSchema>;

// Form Component
export function OfferingForm({ onSubmit, defaultValues }: Props) {
  const { register, handleSubmit, formState: { errors } } = useForm<OfferingFormData>({
    resolver: zodResolver(offeringSchema),
    defaultValues,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <TextInput
        label="Nombre del servicio"
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
      <Button type="submit">Guardar</Button>
    </form>
  );
}
```

---

## 8. Routing

```typescript
export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    path: '/',
    element: <ProtectedRoute />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: 'appointments', element: <AppointmentsPage /> },
          { path: 'offerings', element: <OfferingsPage /> },
          { path: 'schedules', element: <SchedulesPage /> },
          { path: 'conversations', element: <ConversationsPage /> },
          { path: 'settings', element: <SettingsPage /> },
        ],
      },
    ],
  },
]);
```

---

## 9. Error Handling

### Error Boundary

```typescript
export class ErrorBoundary extends Component<Props, State> {
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <Container>
          <Title>Algo salió mal</Title>
          <Text>{this.state.error?.message}</Text>
          <Button onClick={() => window.location.reload()}>Recargar</Button>
        </Container>
      );
    }
    return this.props.children;
  }
}
```

### Query Error Handling

```typescript
export function AppointmentsPage() {
  const { data, isLoading, isError, error } = useAppointments();

  if (isLoading) return <LoadingOverlay visible />;
  if (isError) return <Alert color="red">{error.message}</Alert>;
  if (data.length === 0) return <EmptyState message="No hay citas" />;

  return <AppointmentsTable appointments={data} />;
}
```

---

## 10. Testing Strategy

### Unit Tests (Vitest)

```typescript
describe("formatDuration", () => {
  it("formatea minutos correctamente", () => {
    expect(formatDuration(30)).toBe("30 min");
    expect(formatDuration(90)).toBe("1h 30min");
  });
});
```

### Component Tests (Testing Library)

```typescript
describe('LoginForm', () => {
  it('should render email and password fields', () => {
    render(<LoginForm />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });
});
```

### Integration Tests (MSW)

```typescript
describe('Cancel Appointment Flow', () => {
  it('should cancel and show success', async () => {
    server.use(
      rest.put('/api/appointments/:id/cancel', (req, res, ctx) =>
        res(ctx.status(200))
      )
    );

    render(<AppointmentCard appointmentId="123" />);
    fireEvent.click(screen.getByText(/cancel/i));

    await waitFor(() => {
      expect(screen.getByText(/cancelled successfully/i)).toBeInTheDocument();
    });
  });
});
```

**Cobertura:** 70% general, 90%+ en lógica crítica

---

## 11. Performance

- Code splitting por ruta (React Router)
- Lazy loading de componentes pesados
- Memoización con `useMemo`/`useCallback`
- Virtualización de listas largas (react-window)
- Optimistic updates para mejor UX

---

## 12. Deployment

```bash
# Build
npm run build

# Preview
npm run preview

# Env vars
VITE_API_URL=https://api.example.com
```

---

**Fin del documento**

# UI Documentation - Offerings Management

**Versión:** 1.0  
**Fecha:** January 9, 2026  
**Ruta:** `/offerings`  
**Roles Permitidos:** `BUSINESS_OWNER`, `ADMIN`

---

## 1. Visión General

**Propósito:** Página de gestión de servicios (offerings) que permite a los dueños de negocio crear, editar, activar/desactivar y eliminar los servicios que ofrecen a sus clientes.

**Casos de Uso Principales:**

- Visualizar todos los servicios del negocio (activos e inactivos)
- Crear nuevos servicios con configuración de duración y capacidad
- Editar servicios existentes
- Activar/desactivar servicios temporalmente
- Eliminar servicios permanentemente

**Navegación:**

- Desde: Dashboard, Menú lateral
- Hacia: Modal de creación/edición de servicio

---

## 2. Estructura de la Vista

### 2.1 Layout

```
┌─────────────────────────────────────────────────────────┐
│  Header: "Servicios" + [Nuevo Servicio] Button         │
├─────────────────────────────────────────────────────────┤
│  Grid de Tarjetas de Servicios                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │ Servicio │ │ Servicio │ │ Servicio │ │ Servicio │  │
│  │    1     │ │    2     │ │    3     │ │    4     │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
│  ┌──────────┐ ┌──────────┐                             │
│  │ Servicio │ │ Servicio │                             │
│  │    5     │ │    6     │                             │
│  └──────────┘ └──────────┘                             │
└─────────────────────────────────────────────────────────┘
```

### 2.2 Responsive Behavior

**Desktop (> 1024px):**

- Grid de 4 columnas
- Tarjetas con padding amplio
- Menú de acciones visible en hover

**Tablet (768px - 1024px):**

- Grid de 3 columnas
- Tarjetas con padding medio
- Menú de acciones en botón de tres puntos

**Mobile (< 768px):**

- Grid de 1 columna (tarjetas apiladas)
- Tarjetas con padding reducido
- Botón "Nuevo Servicio" full-width

---

## 3. Componentes y Widgets

### 3.1 Header

**Elementos:**

- Título: `Servicios`
- Breadcrumbs: `Home > Servicios`
- Acción principal: Botón `Nuevo Servicio` con icono `IconPlus`

**Implementación:**

```typescript
<Group justify="space-between">
  <PageHeader title="Servicios" />
  <Button
    leftSection={<IconPlus size={16} />}
    radius="xl"
    onClick={handleOpenCreateModal}
  >
    Nuevo Servicio
  </Button>
</Group>
```

### 3.2 Tarjeta de Servicio

**Elementos:**

- Nombre del servicio (título)
- Duración en minutos
- Capacidad por slot
- Capacidad diaria máxima (opcional)
- Badge de estado (Activo/Inactivo)
- Menú de acciones (tres puntos)

**Estructura:**

```typescript
<Card withBorder shadow="sm" radius="xl" p="lg">
  <Stack gap="md">
    <Group justify="space-between">
      <Text fw={600} size="lg">{offering.name}</Text>
      <Menu>...</Menu>
    </Group>
    <Stack gap="xs">
      <Group gap="xs">
        <Text size="sm" c="dimmed">Duración:</Text>
        <Text size="sm" fw={500}>{offering.duration} min</Text>
      </Group>
      {/* More details */}
    </Stack>
  </Stack>
</Card>
```

### 3.3 Menú de Acciones

**Acciones Disponibles:**

| Acción     | Icono       | Comportamiento                      |
| ---------- | ----------- | ----------------------------------- |
| Editar     | `IconEdit`  | Abre modal de edición               |
| Activar    | `IconCheck` | Activa servicio (si está inactivo)  |
| Desactivar | `IconX`     | Desactiva servicio (si está activo) |
| Eliminar   | `IconTrash` | Elimina servicio con confirmación   |

**Implementación:**

```typescript
<Menu shadow="md" width={200}>
  <Menu.Target>
    <ActionIcon variant="subtle" color="gray">
      <IconDots size={16} />
    </ActionIcon>
  </Menu.Target>
  <Menu.Dropdown>
    <Menu.Item leftSection={<IconEdit size={14} />} onClick={handleEdit}>
      Editar
    </Menu.Item>
    <Menu.Item
      leftSection={offering.isActive ? <IconX size={14} /> : <IconCheck size={14} />}
      onClick={handleToggleActive}
    >
      {offering.isActive ? "Desactivar" : "Activar"}
    </Menu.Item>
    <Menu.Divider />
    <Menu.Item color="red" leftSection={<IconTrash size={14} />} onClick={handleDelete}>
      Eliminar
    </Menu.Item>
  </Menu.Dropdown>
</Menu>
```

### 3.4 Estados de la Vista

**Loading State:**

```typescript
{isLoading && (
  <Center py="xl">
    <Loader size="lg" />
  </Center>
)}
```

**Error State:**

```typescript
{isError && (
  <Alert
    icon={<IconAlertCircle size={16} />}
    title="Error al cargar servicios"
    color="red"
    variant="light"
  >
    {error instanceof Error ? error.message : "Ocurrió un error inesperado"}
  </Alert>
)}
```

**Empty State:**

```typescript
{!isLoading && !isError && offerings?.length === 0 && (
  <Center py="xl">
    <Stack align="center" gap="xs">
      <Text size="lg" c="dimmed">No hay servicios configurados</Text>
      <Text size="sm" c="dimmed">Crea tu primer servicio para comenzar</Text>
    </Stack>
  </Center>
)}
```

---

## 4. Acciones y Botones

### 4.1 Crear Servicio

**Botón:** `Nuevo Servicio`

- **Ubicación:** Header (esquina superior derecha)
- **Tipo:** `primary`
- **Icono:** `IconPlus`
- **Acción:** Abre modal de creación
- **Endpoint:** `POST /api/offerings`
- **Payload:**
  ```json
  {
    "name": "Corte de Pelo",
    "durationMinutes": 30,
    "maxCapacityPerSlot": 2,
    "maxDailyCapacity": 20
  }
  ```
- **Success:** Notificación toast + Actualización de lista
- **Error:** Notificación toast con mensaje de error

### 4.2 Editar Servicio

**Botón:** `Editar` (en menú de acciones)

- **Ubicación:** Menú dropdown de tarjeta
- **Tipo:** `menu item`
- **Icono:** `IconEdit`
- **Acción:** Abre modal de edición con datos precargados
- **Endpoint:** `PUT /api/offerings/:id`
- **Payload:**
  ```json
  {
    "name": "Corte de Pelo Premium",
    "durationMinutes": 45,
    "maxCapacityPerSlot": 1,
    "maxDailyCapacity": 15
  }
  ```
- **Success:** Notificación toast + Actualización de tarjeta
- **Error:** Notificación toast con mensaje de error

### 4.3 Activar/Desactivar Servicio

**Botón:** `Activar` / `Desactivar` (en menú de acciones)

- **Ubicación:** Menú dropdown de tarjeta
- **Tipo:** `menu item`
- **Icono:** `IconCheck` (activar) / `IconX` (desactivar)
- **Acción:** Toggle del estado activo
- **Endpoint:** `PATCH /api/offerings/:id/active`
- **Payload:**
  ```json
  {
    "isActive": true
  }
  ```
- **Success:** Notificación toast + Actualización de badge
- **Error:** Notificación toast con mensaje de error

### 4.4 Eliminar Servicio

**Botón:** `Eliminar` (en menú de acciones)

- **Ubicación:** Menú dropdown de tarjeta
- **Tipo:** `menu item` (color rojo)
- **Icono:** `IconTrash`
- **Acción:** Elimina servicio (soft delete)
- **Confirmación:** `window.confirm("¿Estás seguro de eliminar este servicio?")`
- **Endpoint:** `DELETE /api/offerings/:id`
- **Success:** Notificación toast + Eliminación de tarjeta
- **Error:** Notificación toast con mensaje de error

---

## 5. Integraciones con API

### 5.1 Endpoints Utilizados

**Referencia:** Ver `docs/api/offering.md`

| Endpoint                    | Método | Propósito                | Usado en                  |
| --------------------------- | ------ | ------------------------ | ------------------------- |
| `/api/offerings`            | GET    | Listar todos servicios   | Vista principal           |
| `/api/offerings/active`     | GET    | Listar servicios activos | Filtro (futuro)           |
| `/api/offerings/:id`        | GET    | Obtener servicio por ID  | Modal de edición          |
| `/api/offerings`            | POST   | Crear servicio           | Modal de creación         |
| `/api/offerings/:id`        | PUT    | Actualizar servicio      | Modal de edición          |
| `/api/offerings/:id`        | DELETE | Eliminar servicio        | Acción de eliminar        |
| `/api/offerings/:id/active` | PATCH  | Toggle estado activo     | Acción activar/desactivar |

### 5.2 Queries (TanStack Query)

**Query: Listar Offerings**

```typescript
// Query Key
const queryKey = offeringKeys.list();

// Hook
export function useOfferings() {
  return useQuery({
    queryKey: offeringKeys.list(),
    queryFn: () => offeringsService.getAll(),
  });
}

// Uso en componente
const { data: offerings, isLoading, isError, error } = useOfferings();
```

**Query: Listar Offerings Activos**

```typescript
export function useActiveOfferings() {
  return useQuery({
    queryKey: offeringKeys.list({ activeOnly: true }),
    queryFn: () => offeringsService.getActive(),
  });
}
```

**Query: Obtener Offering por ID**

```typescript
export function useOffering(id: string) {
  return useQuery({
    queryKey: offeringKeys.detail(id),
    queryFn: () => offeringsService.getById(id),
    enabled: !!id,
  });
}
```

### 5.3 Mutations (TanStack Query)

**Mutation: Crear Offering**

```typescript
export function useCreateOffering() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateOfferingRequestDto) => offeringsService.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: offeringKeys.lists() });
    },
  });
}

// Uso en componente
const createOffering = useCreateOffering();
await createOffering.mutateAsync(formData);
```

**Mutation: Actualizar Offering**

```typescript
export function useUpdateOffering() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateOfferingRequestDto }) =>
      offeringsService.update(id, dto),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: offeringKeys.lists() });
      queryClient.setQueryData<OfferingDto>(
        offeringKeys.detail(variables.id),
        data,
      );
    },
  });
}

// Uso en componente
const updateOffering = useUpdateOffering();
await updateOffering.mutateAsync({ id: offering.id, dto: formData });
```

**Mutation: Eliminar Offering**

```typescript
export function useDeleteOffering() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => offeringsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: offeringKeys.all });
    },
  });
}

// Uso en componente
const deleteOffering = useDeleteOffering();
await deleteOffering.mutateAsync(offeringId);
```

**Mutation: Toggle Active Status**

```typescript
export function useToggleOfferingActive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      offeringsService.toggleActive(id, isActive),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: offeringKeys.lists() });
      queryClient.setQueryData<OfferingDto>(
        offeringKeys.detail(variables.id),
        data,
      );
    },
  });
}
```

### 5.4 Query Keys Structure

```typescript
export const offeringKeys = {
  all: ["offerings"] as const,
  lists: () => [...offeringKeys.all, "list"] as const,
  list: (filters?: { activeOnly?: boolean }) =>
    [...offeringKeys.lists(), filters] as const,
  details: () => [...offeringKeys.all, "detail"] as const,
  detail: (id: string) => [...offeringKeys.details(), id] as const,
};
```

**Ejemplos de Query Keys:**

- `["offerings"]` - Todas las queries de offerings
- `["offerings", "list"]` - Todas las listas
- `["offerings", "list", { activeOnly: true }]` - Lista de activos
- `["offerings", "detail", "uuid"]` - Detalle de un offering

---

## 6. Estado y Formularios

### 6.1 Estado Local (useState)

**Estado: Modal Abierto**

- **Propósito:** Controlar visibilidad del modal de creación/edición
- **Tipo:** `boolean`
- **Valor inicial:** `false`
- **Usado en:** Modal de creación/edición

```typescript
const [isModalOpen, setIsModalOpen] = useState(false);
const [editingOffering, setEditingOffering] = useState<OfferingDto | null>(
  null,
);
```

### 6.2 Formularios (React Hook Form + Zod)

**Formulario: Crear/Editar Offering**

**Schema de Validación:**

```typescript
import { z } from "zod";

const offeringSchema = z.object({
  name: z
    .string()
    .min(3, "El nombre debe tener al menos 3 caracteres")
    .max(100, "El nombre no puede exceder 100 caracteres"),
  durationMinutes: z
    .number()
    .int("La duración debe ser un número entero")
    .min(15, "La duración mínima es 15 minutos")
    .max(480, "La duración máxima es 480 minutos (8 horas)"),
  maxCapacityPerSlot: z
    .number()
    .int("La capacidad debe ser un número entero")
    .min(1, "La capacidad mínima es 1")
    .max(100, "La capacidad máxima es 100"),
  maxDailyCapacity: z
    .number()
    .int("La capacidad diaria debe ser un número entero")
    .min(1, "La capacidad diaria mínima es 1")
    .nullable()
    .optional(),
});

type OfferingFormData = z.infer<typeof offeringSchema>;
```

**Campos del Formulario:**

| Campo              | Tipo   | Validación           | Placeholder         | Default |
| ------------------ | ------ | -------------------- | ------------------- | ------- |
| name               | text   | 3-100 caracteres     | "Ej: Corte de Pelo" | ""      |
| durationMinutes    | number | 15-480, entero       | "30"                | 30      |
| maxCapacityPerSlot | number | 1-100, entero        | "2"                 | 1       |
| maxDailyCapacity   | number | ≥1, entero, opcional | "20 (opcional)"     | null    |

**Implementación del Formulario:**

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

function OfferingForm({ offering, onSubmit, onCancel }) {
  const { register, handleSubmit, formState: { errors } } = useForm<OfferingFormData>({
    resolver: zodResolver(offeringSchema),
    defaultValues: offering || {
      name: '',
      durationMinutes: 30,
      maxCapacityPerSlot: 1,
      maxDailyCapacity: null,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <TextInput
        label="Nombre del Servicio"
        placeholder="Ej: Corte de Pelo"
        {...register('name')}
        error={errors.name?.message}
      />

      <NumberInput
        label="Duración (minutos)"
        placeholder="30"
        {...register('durationMinutes', { valueAsNumber: true })}
        error={errors.durationMinutes?.message}
      />

      <NumberInput
        label="Capacidad por Slot"
        placeholder="2"
        {...register('maxCapacityPerSlot', { valueAsNumber: true })}
        error={errors.maxCapacityPerSlot?.message}
      />

      <NumberInput
        label="Capacidad Diaria Máxima (opcional)"
        placeholder="20"
        {...register('maxDailyCapacity', { valueAsNumber: true })}
        error={errors.maxDailyCapacity?.message}
      />

      <Group mt="md">
        <Button type="submit">Guardar</Button>
        <Button variant="subtle" onClick={onCancel}>Cancelar</Button>
      </Group>
    </form>
  );
}
```

---

## 7. Notificaciones y Feedback

### 7.1 Notificaciones Toast

**Tipo: Success - Crear Servicio**

- Mensaje: `"Servicio creado exitosamente"`
- Duración: `3000ms`
- Posición: `top-right`
- Icono: `check-circle`
- Color: `green`

**Tipo: Success - Actualizar Servicio**

- Mensaje: `"Servicio actualizado exitosamente"`
- Duración: `3000ms`
- Posición: `top-right`
- Icono: `check-circle`
- Color: `green`

**Tipo: Success - Eliminar Servicio**

- Mensaje: `"Servicio eliminado exitosamente"`
- Duración: `3000ms`
- Posición: `top-right`
- Icono: `check-circle`
- Color: `green`

**Tipo: Success - Toggle Estado**

- Mensaje: `"Servicio activado/desactivado exitosamente"`
- Duración: `3000ms`
- Posición: `top-right`
- Icono: `check-circle`
- Color: `green`

**Tipo: Error**

- Mensaje: `{error.message}` o `"Ocurrió un error inesperado"`
- Duración: `5000ms`
- Posición: `top-right`
- Icono: `x-circle`
- Color: `red`

**Implementación:**

```typescript
import { notifications } from '@mantine/notifications';

// Success
notifications.show({
  title: 'Éxito',
  message: 'Servicio creado exitosamente',
  color: 'green',
  icon: <IconCheck size={16} />,
});

// Error
notifications.show({
  title: 'Error',
  message: error.message || 'Ocurrió un error inesperado',
  color: 'red',
  icon: <IconX size={16} />,
});
```

### 7.2 Estados de Carga

**Loading States:**

- Skeleton: No usado (se usa Loader centralizado)
- Spinner: `<Loader size="lg" />` en Center
- Progress Bar: No usado en esta vista

**Implementación:**

```typescript
{isLoading && (
  <Center py="xl">
    <Loader size="lg" />
  </Center>
)}
```

### 7.3 Estados Vacíos

**Empty State: Sin Servicios**

- Ilustración: No (solo texto)
- Título: `"No hay servicios configurados"`
- Descripción: `"Crea tu primer servicio para comenzar"`
- CTA: Botón `Nuevo Servicio` en header

**Implementación:**

```typescript
{!isLoading && !isError && offerings?.length === 0 && (
  <Center py="xl">
    <Stack align="center" gap="xs">
      <Text size="lg" c="dimmed">No hay servicios configurados</Text>
      <Text size="sm" c="dimmed">Crea tu primer servicio para comenzar</Text>
    </Stack>
  </Center>
)}
```

---

## 8. Permisos y Roles

### 8.1 Visibilidad por Rol

| Elemento           | BUSINESS_OWNER | ADMIN | CUSTOMER |
| ------------------ | -------------- | ----- | -------- |
| Vista completa     | ✅             | ✅    | ❌       |
| Crear servicio     | ✅             | ✅    | ❌       |
| Editar servicio    | ✅             | ✅    | ❌       |
| Eliminar servicio  | ✅             | ✅    | ❌       |
| Activar/Desactivar | ✅             | ✅    | ❌       |

### 8.2 Validaciones de Permisos

**Componente: OfferingsPage**

```typescript
// Protección de ruta en router
<Route
  path="/offerings"
  element={
    <ProtectedRoute roles={['BUSINESS_OWNER', 'ADMIN']}>
      <OfferingsPage />
    </ProtectedRoute>
  }
/>
```

**Validación en Backend:**

- JWT token debe incluir `businessId`
- Usuario debe tener rol `BUSINESS_OWNER` o `ADMIN`
- Offerings solo visibles para el business del usuario autenticado

---

## 9. Navegación y Rutas

### 9.1 Rutas

**Ruta Principal:** `/offerings`

**Rutas Relacionadas:**

- `/dashboard` - Dashboard principal
- `/appointments` - Gestión de citas (usa offerings)
- `/schedules` - Horarios de atención
- `/blockouts` - Bloqueos de fechas

### 9.2 Breadcrumbs

```
Home > Servicios
```

**Implementación:**

```typescript
<Breadcrumbs>
  <Anchor href="/">Home</Anchor>
  <Text>Servicios</Text>
</Breadcrumbs>
```

### 9.3 Navegación Contextual

**Links Rápidos:**

- `Dashboard` → `/dashboard`
- `Citas` → `/appointments`
- `Horarios` → `/schedules`

---

## 10. Accesibilidad (a11y)

### 10.1 ARIA Labels

**Botones:**

```typescript
<Button aria-label="Crear nuevo servicio">
  Nuevo Servicio
</Button>

<ActionIcon aria-label="Abrir menú de acciones">
  <IconDots />
</ActionIcon>
```

**Inputs:**

```typescript
<TextInput
  label="Nombre del Servicio"
  aria-describedby="name-description"
  aria-required="true"
/>
```

**Modales:**

```typescript
<Modal
  opened={isOpen}
  onClose={onClose}
  title="Crear Servicio"
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
>
  {/* Content */}
</Modal>
```

### 10.2 Navegación por Teclado

- **Tab:** Navega entre tarjetas y botones
- **Enter:** Activa botón seleccionado
- **Escape:** Cierra modal/menú abierto
- **Arrow keys:** Navega en menú dropdown

### 10.3 Screen Readers

**Anuncios:**

- "Servicio creado exitosamente" (al crear)
- "Servicio actualizado exitosamente" (al editar)
- "Servicio eliminado exitosamente" (al eliminar)
- "Cargando servicios..." (durante carga)
- "Error al cargar servicios" (en error)

**Live Regions:**

```typescript
<div role="status" aria-live="polite" aria-atomic="true">
  {isLoading && "Cargando servicios..."}
  {isError && "Error al cargar servicios"}
</div>
```

---

## 11. Performance

### 11.1 Optimizaciones

**Lazy loading:** No aplicado (página principal)

**Code splitting:** Componente cargado con React.lazy

```typescript
const OfferingsPage = lazy(() => import("./pages/OfferingsPage"));
```

**Memoización:** Tarjetas de servicio memoizadas

```typescript
const OfferingCard = memo(({ offering, onEdit, onDelete, onToggle }) => {
  return <Card>{/* Content */}</Card>;
});
```

**Virtualización:** No necesaria (cantidad limitada de servicios por negocio)

**React Query Caching:**

```typescript
{
  staleTime: 1000 * 60 * 5, // 5 minutos
  cacheTime: 1000 * 60 * 10, // 10 minutos
  refetchOnWindowFocus: true,
}
```

### 11.2 Métricas Objetivo

- **First Contentful Paint:** < 1.5s
- **Time to Interactive:** < 2.5s
- **Largest Contentful Paint:** < 2.0s
- **API Response Time:** < 200ms (p95)

---

## 12. Testing

### 12.1 Tests Unitarios

**Componente: OfferingsPage**

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { OfferingsPage } from './OfferingsPage';

describe('OfferingsPage', () => {
  const queryClient = new QueryClient();

  it('should render loading state', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <OfferingsPage />
      </QueryClientProvider>
    );

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('should render offerings list', async () => {
    // Mock API response
    const offerings = [
      { id: '1', name: 'Corte de Pelo', duration: 30, isActive: true },
    ];

    render(
      <QueryClientProvider client={queryClient}>
        <OfferingsPage />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Corte de Pelo')).toBeInTheDocument();
    });
  });

  it('should render empty state when no offerings', async () => {
    // Mock empty response

    render(
      <QueryClientProvider client={queryClient}>
        <OfferingsPage />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('No hay servicios configurados')).toBeInTheDocument();
    });
  });
});
```

### 12.2 Tests de Integración

**Flujo: Crear Servicio**

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rest } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer(
  rest.post('/api/offerings', (req, res, ctx) => {
    return res(ctx.json({ offeringId: 'new-id' }));
  }),
  rest.get('/api/offerings', (req, res, ctx) => {
    return res(ctx.json([
      { id: 'new-id', name: 'Nuevo Servicio', duration: 30, isActive: true }
    ]));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('Create Offering Flow', () => {
  it('should create offering successfully', async () => {
    const user = userEvent.setup();

    render(<OfferingsPage />);

    // Click "Nuevo Servicio" button
    const createButton = screen.getByText('Nuevo Servicio');
    await user.click(createButton);

    // Fill form
    const nameInput = screen.getByLabelText('Nombre del Servicio');
    await user.type(nameInput, 'Nuevo Servicio');

    const durationInput = screen.getByLabelText('Duración (minutos)');
    await user.clear(durationInput);
    await user.type(durationInput, '30');

    // Submit form
    const submitButton = screen.getByText('Guardar');
    await user.click(submitButton);

    // Verify success notification
    await waitFor(() => {
      expect(screen.getByText('Servicio creado exitosamente')).toBeInTheDocument();
    });

    // Verify new offering appears in list
    await waitFor(() => {
      expect(screen.getByText('Nuevo Servicio')).toBeInTheDocument();
    });
  });
});
```

**Flujo: Eliminar Servicio**

```typescript
describe('Delete Offering Flow', () => {
  it('should delete offering with confirmation', async () => {
    const user = userEvent.setup();

    // Mock window.confirm
    window.confirm = jest.fn(() => true);

    render(<OfferingsPage />);

    // Wait for offerings to load
    await waitFor(() => {
      expect(screen.getByText('Corte de Pelo')).toBeInTheDocument();
    });

    // Open actions menu
    const menuButton = screen.getAllByLabelText('Abrir menú de acciones')[0];
    await user.click(menuButton);

    // Click delete
    const deleteButton = screen.getByText('Eliminar');
    await user.click(deleteButton);

    // Verify confirmation was called
    expect(window.confirm).toHaveBeenCalledWith('¿Estás seguro de eliminar este servicio?');

    // Verify success notification
    await waitFor(() => {
      expect(screen.getByText('Servicio eliminado exitosamente')).toBeInTheDocument();
    });

    // Verify offering removed from list
    await waitFor(() => {
      expect(screen.queryByText('Corte de Pelo')).not.toBeInTheDocument();
    });
  });
});
```

---

## 13. Dependencias de Features

**Referencia:** Ver `docs/features/offering.md`

**Features Utilizadas:**

- **Service Management** - CRUD completo de servicios
- **Service Configuration** - Configuración de duración y capacidad
- **Service Activation/Deactivation** - Toggle de estado activo
- **Service Catalog** - Visualización de servicios disponibles

**Integración con otros BCs:**

- **Business BC:** Servicios pertenecen a un business específico
- **Availability BC:** Duración y capacidad usados para calcular disponibilidad
- **Booking BC:** Servicios seleccionables al crear citas
- **Conversation BC:** Servicios mostrados en WhatsApp

---

## 14. Modales y Drawers

### 14.1 Modal: Crear Servicio

**Trigger:** Botón `Nuevo Servicio` en header

**Contenido:**

- Título: `"Crear Servicio"`
- Formulario con campos:
  - Nombre del Servicio (text)
  - Duración en minutos (number)
  - Capacidad por slot (number)
  - Capacidad diaria máxima (number, opcional)
- Acciones:
  - Primaria: `Guardar` → `POST /api/offerings`
  - Secundaria: `Cancelar` → Cierra modal

**Validaciones:**

- Nombre: 3-100 caracteres, requerido
- Duración: 15-480 minutos, entero, requerido
- Capacidad por slot: 1-100, entero, requerido
- Capacidad diaria: ≥1, entero, opcional

**Estados:**

- Loading: Botón deshabilitado con spinner
- Success: Notificación toast + Cierra modal + Actualiza lista
- Error: Notificación toast + Modal permanece abierto

**Implementación:**

```typescript
<Modal
  opened={isCreateModalOpen}
  onClose={() => setIsCreateModalOpen(false)}
  title="Crear Servicio"
  size="md"
>
  <OfferingForm
    onSubmit={handleCreate}
    onCancel={() => setIsCreateModalOpen(false)}
  />
</Modal>
```

### 14.2 Modal: Editar Servicio

**Trigger:** Opción `Editar` en menú de acciones

**Contenido:**

- Título: `"Editar Servicio"`
- Formulario con campos precargados:
  - Nombre del Servicio (text)
  - Duración en minutos (number)
  - Capacidad por slot (number)
  - Capacidad diaria máxima (number, opcional)
- Acciones:
  - Primaria: `Guardar` → `PUT /api/offerings/:id`
  - Secundaria: `Cancelar` → Cierra modal

**Validaciones:** Mismas que crear servicio

**Estados:**

- Loading: Botón deshabilitado con spinner
- Success: Notificación toast + Cierra modal + Actualiza tarjeta
- Error: Notificación toast + Modal permanece abierto

**Implementación:**

```typescript
<Modal
  opened={isEditModalOpen}
  onClose={() => setIsEditModalOpen(false)}
  title="Editar Servicio"
  size="md"
>
  <OfferingForm
    offering={editingOffering}
    onSubmit={handleUpdate}
    onCancel={() => setIsEditModalOpen(false)}
  />
</Modal>
```

---

## 15. Wireframes y Mockups

**Figma/Diseño:** No disponible (implementación basada en Mantine UI)

**Layout Visual:**

```
┌─────────────────────────────────────────────────────────┐
│  Servicios                          [+ Nuevo Servicio]  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ Corte Pelo ⋮ │  │ Tinte     ⋮  │  │ Manicure  ⋮  │ │
│  │              │  │              │  │              │ │
│  │ 30 min       │  │ 120 min      │  │ 45 min       │ │
│  │ Cap: 2       │  │ Cap: 1       │  │ Cap: 3       │ │
│  │ Max: 20      │  │ Max: -       │  │ Max: 15      │ │
│  │ [Activo]     │  │ [Activo]     │  │ [Inactivo]   │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│                                                         │
│  ┌──────────────┐  ┌──────────────┐                   │
│  │ Pedicure  ⋮  │  │ Lavado    ⋮  │                   │
│  │              │  │              │                   │
│  │ 60 min       │  │ 15 min       │                   │
│  │ Cap: 2       │  │ Cap: 4       │                   │
│  │ Max: 10      │  │ Max: -       │                   │
│  │ [Activo]     │  │ [Activo]     │                   │
│  └──────────────┘  └──────────────┘                   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 16. Notas de Implementación

### 16.1 Consideraciones Técnicas

**TanStack Query:**

- Usar query keys estructurados para invalidación granular
- Implementar optimistic updates para mejor UX
- Configurar staleTime apropiado (5 minutos)
- Usar enabled flag para queries condicionales

**Mantine UI:**

- Usar componentes nativos de Mantine para consistencia
- Aplicar theme tokens para colores y espaciado
- Usar Grid responsive con breakpoints
- Implementar dark mode support (futuro)

**Formularios:**

- Validación con Zod para type safety
- React Hook Form para performance
- Mensajes de error en español
- Validación en tiempo real (onBlur)

**Estado:**

- Estado de UI (modales) en useState local
- Estado de servidor en TanStack Query
- No usar estado global (Zustand) para esta vista

### 16.2 Limitaciones Conocidas

**Paginación:**

- No implementada en MVP (cantidad limitada de servicios)
- Considerar para Post-MVP si negocios tienen >50 servicios

**Búsqueda/Filtros:**

- No implementados en MVP
- Considerar agregar filtro por estado (activo/inactivo)
- Considerar búsqueda por nombre

**Ordenamiento:**

- Actualmente ordenado por fecha de creación (más reciente primero)
- Considerar agregar ordenamiento por nombre, duración, capacidad

**Drag & Drop:**

- No implementado para reordenar servicios
- Considerar para Post-MVP si se requiere orden personalizado

### 16.3 Mejoras Futuras

**Funcionalidad:**

- Duplicar servicio existente
- Importar/exportar servicios
- Categorías de servicios
- Imágenes de servicios
- Descripciones largas con rich text
- Precios por servicio
- Duración variable (mín-máx)
- Recursos asignados (empleados, salas)

**UX:**

- Vista de tabla alternativa
- Búsqueda y filtros avanzados
- Ordenamiento personalizado
- Acciones en lote (activar/desactivar múltiples)
- Historial de cambios
- Preview de disponibilidad por servicio

**Performance:**

- Virtualización para listas largas (>100 items)
- Lazy loading de imágenes (cuando se agreguen)
- Debounce en búsqueda (cuando se agregue)
- Infinite scroll (alternativa a paginación)

**Accesibilidad:**

- Mejorar anuncios de screen reader
- Agregar skip links
- Mejorar contraste de colores
- Agregar tooltips descriptivos

---

## 17. Tipos TypeScript

### 17.1 DTOs

```typescript
// From @packages/shared-types

export interface OfferingDto {
  id: string;
  businessId: string;
  name: string;
  duration: number;
  maxCapacityPerSlot: number;
  maxDailyCapacity: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOfferingRequestDto {
  name: string;
  durationMinutes: number;
  maxCapacityPerSlot: number;
  maxDailyCapacity?: number | null;
}

export interface UpdateOfferingRequestDto {
  name: string;
  durationMinutes: number;
  maxCapacityPerSlot: number;
  maxDailyCapacity?: number | null;
}

export interface ToggleActiveDto {
  isActive: boolean;
}
```

### 17.2 Component Props

```typescript
interface OfferingCardProps {
  offering: OfferingDto;
  onEdit: (offering: OfferingDto) => void;
  onDelete: (id: string) => void;
  onToggleActive: (id: string, currentStatus: boolean) => void;
}

interface OfferingFormProps {
  offering?: OfferingDto;
  onSubmit: (data: OfferingFormData) => void;
  onCancel: () => void;
}

interface OfferingModalProps {
  opened: boolean;
  onClose: () => void;
  offering?: OfferingDto;
  mode: "create" | "edit";
}
```

---

## 18. Manejo de Errores

### 18.1 Errores de API

**400 Bad Request - Validación:**

```typescript
{
  statusCode: 400,
  message: [
    "name must be longer than or equal to 3 characters",
    "durationMinutes must not be less than 15"
  ],
  error: "Bad Request"
}
```

**Manejo:**

- Mostrar mensajes de error en campos del formulario
- Notificación toast con resumen de errores
- Mantener modal abierto para corrección

**401 Unauthorized:**

```typescript
{
  statusCode: 401,
  message: "Unauthorized"
}
```

**Manejo:**

- Redirigir a página de login
- Limpiar token de localStorage
- Mostrar mensaje "Sesión expirada"

**403 Forbidden:**

```typescript
{
  statusCode: 403,
  message: "You do not have permission to access this offering",
  error: "Forbidden"
}
```

**Manejo:**

- Notificación toast con mensaje de error
- Redirigir a dashboard
- Log del error para debugging

**404 Not Found:**

```typescript
{
  statusCode: 404,
  message: "Offering with id xxx not found",
  error: "Not Found"
}
```

**Manejo:**

- Notificación toast con mensaje
- Actualizar lista de offerings
- Cerrar modal si estaba abierto

**409 Conflict:**

```typescript
{
  statusCode: 409,
  message: "Offering with name 'Corte de Pelo' already exists for this business",
  error: "Conflict"
}
```

**Manejo:**

- Mostrar error en campo "name"
- Notificación toast con mensaje
- Sugerir nombre alternativo

**500 Internal Server Error:**

```typescript
{
  statusCode: 500,
  message: "Internal server error"
}
```

**Manejo:**

- Notificación toast genérica
- Log completo del error
- Opción de reintentar
- Contactar soporte si persiste

### 18.2 Errores de Red

**Network Error:**

```typescript
catch (error) {
  if (error.message === 'Network Error') {
    notifications.show({
      title: 'Error de Conexión',
      message: 'No se pudo conectar al servidor. Verifica tu conexión a internet.',
      color: 'red',
    });
  }
}
```

**Timeout:**

```typescript
// Axios config
timeout: 10000, // 10 segundos

// Manejo
if (error.code === 'ECONNABORTED') {
  notifications.show({
    title: 'Tiempo de Espera Agotado',
    message: 'La solicitud tardó demasiado. Intenta nuevamente.',
    color: 'orange',
  });
}
```

### 18.3 Retry Logic

**TanStack Query Retry:**

```typescript
useQuery({
  queryKey: offeringKeys.list(),
  queryFn: () => offeringsService.getAll(),
  retry: 2, // Reintentar 2 veces
  retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
});
```

**Manual Retry:**

```typescript
const { refetch, isRefetching } = useOfferings();

<Button
  onClick={() => refetch()}
  loading={isRefetching}
>
  Reintentar
</Button>
```

---

## 19. Changelog

| Versión | Fecha       | Cambios                                         |
| ------- | ----------- | ----------------------------------------------- |
| 1.0     | Jan 9, 2026 | Versión inicial - Vista de gestión de servicios |

---

## 20. Referencias

### 20.1 Documentación Relacionada

**Features:**

- [docs/features/offering.md](../features/offering.md) - Features del BC Offering

**API:**

- [docs/api/offering.md](../api/offering.md) - API endpoints de Offering

**Backend:**

- [apps/backend/src/offering/](../../apps/backend/src/offering/) - Implementación backend

**Frontend:**

- [apps/frontend/src/pages/OfferingsPage/](../../apps/frontend/src/pages/OfferingsPage/) - Componente de página
- [apps/frontend/src/entities/offering/](../../apps/frontend/src/entities/offering/) - Hooks y lógica

**Steering:**

- [.kiro/steering/02-bounded-contexts.md](../../.kiro/steering/02-bounded-contexts.md) - Bounded Contexts
- [.kiro/steering/51-frontend-architecture.md](../../.kiro/steering/51-frontend-architecture.md) - Arquitectura frontend

### 20.2 Librerías y Dependencias

**Core:**

- `react` (v18.x) - UI library
- `react-dom` (v18.x) - React DOM renderer
- `typescript` (v5.x) - Type safety

**State Management:**

- `@tanstack/react-query` (v5.x) - Server state management
- `@tanstack/react-query-devtools` - Development tools

**UI Components:**

- `@mantine/core` (v7.x) - Component library
- `@mantine/hooks` - React hooks
- `@mantine/notifications` - Toast notifications
- `@mantine/modals` - Modal management
- `@tabler/icons-react` - Icon library

**Forms & Validation:**

- `react-hook-form` (v7.x) - Form management
- `@hookform/resolvers` - Form resolvers
- `zod` (v3.x) - Schema validation

**HTTP Client:**

- `axios` (v1.x) - HTTP requests

**Routing:**

- `react-router-dom` (v6.x) - Client-side routing

### 20.3 Comandos Útiles

**Desarrollo:**

```bash
# Iniciar frontend en modo desarrollo
pnpm --filter frontend dev

# Ejecutar tests
pnpm --filter frontend test

# Ejecutar tests en modo watch
pnpm --filter frontend test:watch

# Type check
pnpm --filter frontend typecheck

# Lint
pnpm --filter frontend lint

# Build para producción
pnpm --filter frontend build
```

**Testing:**

```bash
# Tests unitarios
pnpm --filter frontend test src/pages/OfferingsPage

# Tests con coverage
pnpm --filter frontend test:coverage

# Tests de integración
pnpm --filter frontend test:integration
```

---

## 21. Ejemplo Completo de Implementación

### 21.1 Componente Principal

```typescript
// apps/frontend/src/pages/OfferingsPage/ui/OfferingsPage.tsx

import { useState } from 'react';
import {
  Container,
  Stack,
  Grid,
  Button,
  Center,
  Text,
  Loader,
  Alert,
  Group,
  Badge,
  Card,
  ActionIcon,
  Menu,
  Modal,
} from '@mantine/core';
import {
  IconAlertCircle,
  IconPlus,
  IconDots,
  IconEdit,
  IconTrash,
  IconCheck,
  IconX,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { PageHeader } from '@shared/ui/PageHeader/PageHeader';
import {
  useOfferings,
  useDeleteOffering,
  useToggleOfferingActive,
  useCreateOffering,
  useUpdateOffering,
} from '@entities/offering';
import type { OfferingDto } from '@packages/shared-types';
import { OfferingForm } from './OfferingForm';

export function OfferingsPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingOffering, setEditingOffering] = useState<OfferingDto | null>(null);

  const { data: offerings, isLoading, isError, error } = useOfferings();
  const deleteOffering = useDeleteOffering();
  const toggleActive = useToggleOfferingActive();
  const createOffering = useCreateOffering();
  const updateOffering = useUpdateOffering();

  const handleCreate = async (data: OfferingFormData) => {
    try {
      await createOffering.mutateAsync(data);
      notifications.show({
        title: 'Éxito',
        message: 'Servicio creado exitosamente',
        color: 'green',
        icon: <IconCheck size={16} />,
      });
      setIsCreateModalOpen(false);
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error.message || 'Error al crear servicio',
        color: 'red',
        icon: <IconX size={16} />,
      });
    }
  };

  const handleUpdate = async (data: OfferingFormData) => {
    if (!editingOffering) return;

    try {
      await updateOffering.mutateAsync({ id: editingOffering.id, dto: data });
      notifications.show({
        title: 'Éxito',
        message: 'Servicio actualizado exitosamente',
        color: 'green',
        icon: <IconCheck size={16} />,
      });
      setEditingOffering(null);
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error.message || 'Error al actualizar servicio',
        color: 'red',
        icon: <IconX size={16} />,
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Estás seguro de eliminar este servicio?')) return;

    try {
      await deleteOffering.mutateAsync(id);
      notifications.show({
        title: 'Éxito',
        message: 'Servicio eliminado exitosamente',
        color: 'green',
        icon: <IconCheck size={16} />,
      });
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error.message || 'Error al eliminar servicio',
        color: 'red',
        icon: <IconX size={16} />,
      });
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await toggleActive.mutateAsync({ id, isActive: !currentStatus });
      notifications.show({
        title: 'Éxito',
        message: `Servicio ${!currentStatus ? 'activado' : 'desactivado'} exitosamente`,
        color: 'green',
        icon: <IconCheck size={16} />,
      });
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error.message || 'Error al cambiar estado',
        color: 'red',
        icon: <IconX size={16} />,
      });
    }
  };

  return (
    <Container fluid py="md">
      <Stack gap="lg">
        <Group justify="space-between">
          <PageHeader title="Servicios" />
          <Button
            leftSection={<IconPlus size={16} />}
            radius="xl"
            onClick={() => setIsCreateModalOpen(true)}
          >
            Nuevo Servicio
          </Button>
        </Group>

        {isLoading && (
          <Center py="xl">
            <Loader size="lg" />
          </Center>
        )}

        {isError && (
          <Alert
            icon={<IconAlertCircle size={16} />}
            title="Error al cargar servicios"
            color="red"
            variant="light"
          >
            {error instanceof Error ? error.message : 'Ocurrió un error inesperado'}
          </Alert>
        )}

        {!isLoading && !isError && offerings && offerings.length === 0 && (
          <Center py="xl">
            <Stack align="center" gap="xs">
              <Text size="lg" c="dimmed">No hay servicios configurados</Text>
              <Text size="sm" c="dimmed">Crea tu primer servicio para comenzar</Text>
            </Stack>
          </Center>
        )}

        {!isLoading && !isError && offerings && offerings.length > 0 && (
          <Grid gutter="md">
            {offerings.map((offering) => (
              <Grid.Col key={offering.id} span={{ base: 12, sm: 6, md: 4, lg: 3 }}>
                <Card withBorder shadow="sm" radius="xl" p="lg">
                  <Stack gap="md">
                    <Group justify="space-between">
                      <Text fw={600} size="lg">{offering.name}</Text>
                      <Menu shadow="md" width={200}>
                        <Menu.Target>
                          <ActionIcon variant="subtle" color="gray">
                            <IconDots size={16} />
                          </ActionIcon>
                        </Menu.Target>
                        <Menu.Dropdown>
                          <Menu.Item
                            leftSection={<IconEdit size={14} />}
                            onClick={() => setEditingOffering(offering)}
                          >
                            Editar
                          </Menu.Item>
                          <Menu.Item
                            leftSection={
                              offering.isActive ? <IconX size={14} /> : <IconCheck size={14} />
                            }
                            onClick={() => handleToggleActive(offering.id, offering.isActive)}
                          >
                            {offering.isActive ? 'Desactivar' : 'Activar'}
                          </Menu.Item>
                          <Menu.Divider />
                          <Menu.Item
                            color="red"
                            leftSection={<IconTrash size={14} />}
                            onClick={() => handleDelete(offering.id)}
                          >
                            Eliminar
                          </Menu.Item>
                        </Menu.Dropdown>
                      </Menu>
                    </Group>

                    <Stack gap="xs">
                      <Group gap="xs">
                        <Text size="sm" c="dimmed">Duración:</Text>
                        <Text size="sm" fw={500}>{offering.duration} min</Text>
                      </Group>

                      <Group gap="xs">
                        <Text size="sm" c="dimmed">Capacidad:</Text>
                        <Text size="sm" fw={500}>{offering.maxCapacityPerSlot} por slot</Text>
                      </Group>

                      {offering.maxDailyCapacity && (
                        <Group gap="xs">
                          <Text size="sm" c="dimmed">Máx. diario:</Text>
                          <Text size="sm" fw={500}>{offering.maxDailyCapacity}</Text>
                        </Group>
                      )}

                      <Badge
                        color={offering.isActive ? 'green' : 'gray'}
                        variant="light"
                        size="sm"
                      >
                        {offering.isActive ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </Stack>
                  </Stack>
                </Card>
              </Grid.Col>
            ))}
          </Grid>
        )}
      </Stack>

      {/* Create Modal */}
      <Modal
        opened={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Crear Servicio"
        size="md"
      >
        <OfferingForm
          onSubmit={handleCreate}
          onCancel={() => setIsCreateModalOpen(false)}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        opened={!!editingOffering}
        onClose={() => setEditingOffering(null)}
        title="Editar Servicio"
        size="md"
      >
        {editingOffering && (
          <OfferingForm
            offering={editingOffering}
            onSubmit={handleUpdate}
            onCancel={() => setEditingOffering(null)}
          />
        )}
      </Modal>
    </Container>
  );
}
```

---

**Última actualización:** January 9, 2026  
**Mantenido por:** Development Team  
**Versión:** 1.0

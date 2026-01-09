# Design Document

## Overview

Este documento describe el diseño de la implementación completa del frontend de gestión de offerings. La solución incluye modales de creación y edición, formularios con validación robusta, notificaciones de usuario, y una experiencia de usuario accesible y responsiva.

**Objetivos del Diseño:**

- Completar la funcionalidad CRUD de offerings en el frontend
- Proporcionar validación de formularios en tiempo real con feedback claro
- Implementar modales reutilizables siguiendo patrones de Mantine UI
- Garantizar accesibilidad completa (WCAG 2.1 AA)
- Asegurar responsividad en todos los dispositivos
- Mantener consistencia con el resto de la aplicación

## Architecture

### Component Structure

```
apps/frontend/src/
├── pages/
│   └── OfferingsPage/
│       └── ui/
│           ├── OfferingsPage.tsx (✅ existe, necesita actualización)
│           ├── OfferingCreateModal.tsx (❌ nuevo)
│           ├── OfferingEditModal.tsx (❌ nuevo)
│           └── OfferingForm.tsx (❌ nuevo)
├── entities/
│   └── offering/
│       ├── index.ts (✅ existe)
│       ├── model/
│       │   └── useOfferings.ts (✅ existe)
│       └── lib/
│           └── validation.ts (❌ nuevo)
└── shared/
    └── api/
        └── services/
            └── offerings.service.ts (✅ existe)
```

### Technology Stack

- **UI Framework**: React 18 + TypeScript
- **UI Components**: Mantine UI v7
- **Form Management**: React Hook Form v7
- **Validation**: Zod v3
- **Server State**: TanStack Query v5
- **Notifications**: Mantine Notifications
- **Testing**: Vitest + React Testing Library

### Design Patterns

1. **Feature-Sliced Design**: Organización por features (entities, pages, shared)
2. **Compound Components**: Modal + Form como componentes separados pero relacionados
3. **Controlled Forms**: React Hook Form con validación de Zod
4. **Optimistic Updates**: TanStack Query para actualizaciones optimistas
5. **Error Boundaries**: Manejo de errores a nivel de componente

## Components and Interfaces

### 1. OfferingForm Component

**Propósito**: Formulario reutilizable para crear y editar offerings

**Props Interface**:

```typescript
interface OfferingFormProps {
  offering?: OfferingDto | null;
  onSubmit: (data: OfferingFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}
```

**Campos del Formulario**:

- `name`: TextInput (3-100 caracteres)
- `durationMinutes`: NumberInput (15-480, step 15)
- `maxCapacityPerSlot`: NumberInput (1-100)
- `maxDailyCapacity`: NumberInput (opcional, ≥1)

**Validación**: Schema de Zod (ver Data Models)

**Comportamiento**:

- Modo creación: Campos vacíos con valores por defecto
- Modo edición: Campos precargados con datos del offering
- Validación en tiempo real (onBlur)
- Deshabilitación durante loading
- Focus automático en primer campo

### 2. OfferingCreateModal Component

**Propósito**: Modal para crear nuevos offerings

**Props Interface**:

```typescript
interface OfferingCreateModalProps {
  opened: boolean;
  onClose: () => void;
}
```

**Comportamiento**:

- Abre con formulario vacío
- Llama a `useCreateOffering` hook
- Muestra notificación de éxito/error
- Cierra automáticamente al crear exitosamente
- Invalida queries de TanStack Query

### 3. OfferingEditModal Component

**Propósito**: Modal para editar offerings existentes

**Props Interface**:

```typescript
interface OfferingEditModalProps {
  opened: boolean;
  onClose: () => void;
  offering: OfferingDto;
}
```

**Comportamiento**:

- Abre con formulario precargado
- Llama a `useUpdateOffering` hook
- Muestra notificación de éxito/error
- Cierra automáticamente al actualizar exitosamente
- Actualiza caché de TanStack Query

### 4. OfferingsPage Component (Actualización)

**Cambios Necesarios**:

- Agregar estado para controlar modales
- Agregar estado para offering seleccionado
- Conectar botón "Nuevo Servicio" con modal de creación
- Conectar opción "Editar" con modal de edición
- Implementar confirmación de eliminación con window.confirm

**Nuevo Estado**:

```typescript
const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
const [isEditModalOpen, setIsEditModalOpen] = useState(false);
const [selectedOffering, setSelectedOffering] = useState<OfferingDto | null>(
  null,
);
```

## Data Models

### Zod Validation Schema

```typescript
import { z } from "zod";

export const offeringFormSchema = z.object({
  name: z
    .string()
    .min(3, "El nombre debe tener al menos 3 caracteres")
    .max(100, "El nombre no puede exceder 100 caracteres")
    .trim(),

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

export type OfferingFormData = z.infer<typeof offeringFormSchema>;
```

### Form Default Values

```typescript
export const defaultOfferingValues: OfferingFormData = {
  name: "",
  durationMinutes: 30,
  maxCapacityPerSlot: 1,
  maxDailyCapacity: null,
};
```

### OfferingDto (ya existe en @packages/shared-types)

```typescript
interface OfferingDto {
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
```

## Correctness Properties

_Una propiedad es una característica o comportamiento que debe mantenerse verdadero en todas las ejecuciones válidas del sistema. Las propiedades sirven como puente entre las especificaciones legibles por humanos y las garantías de correctness verificables por máquina._

### Property 1: Modal cierra sin guardar al cancelar

_Para cualquier_ modal (creación o edición), cuando el usuario hace clic en "Cancelar", el modal debe cerrarse sin realizar ninguna llamada a la API y sin modificar el estado del servidor.

**Validates: Requirements 1.3, 2.6**

### Property 2: Creación exitosa actualiza la lista

_Para cualquier_ conjunto de datos válidos de offering, cuando se crea exitosamente, la lista de offerings debe actualizarse automáticamente para incluir el nuevo offering sin necesidad de recargar la página.

**Validates: Requirements 1.4, 1.5**

### Property 3: Error mantiene modal abierto

_Para cualquier_ operación (crear o editar) que falle, el modal debe permanecer abierto con los datos ingresados preservados, permitiendo al usuario corregir y reintentar.

**Validates: Requirements 1.6, 2.5**

### Property 4: Edición precarga datos correctamente

_Para cualquier_ offering existente, cuando se abre el modal de edición, todos los campos del formulario deben contener exactamente los valores actuales del offering.

**Validates: Requirements 2.2**

### Property 5: Actualización exitosa refleja cambios

_Para cualquier_ modificación válida de un offering, cuando se actualiza exitosamente, la tarjeta del offering en la lista debe reflejar inmediatamente los nuevos valores sin necesidad de recargar.

**Validates: Requirements 2.3, 2.4**

### Property 6: Validación previene envío inválido

_Para cualquier_ conjunto de datos que viole las reglas de validación, el formulario debe prevenir el envío y mostrar todos los mensajes de error correspondientes.

**Validates: Requirements 3.8**

### Property 7: Notificaciones de éxito son consistentes

_Para cualquier_ operación exitosa (crear, actualizar, eliminar, toggle), el sistema debe mostrar una notificación toast verde con el mensaje apropiado que se oculta automáticamente después de 3 segundos.

**Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.6**

### Property 8: Notificaciones de error son consistentes

_Para cualquier_ operación que falle, el sistema debe mostrar una notificación toast roja con el mensaje de error específico que se oculta automáticamente después de 5 segundos.

**Validates: Requirements 4.5, 4.7**

### Property 9: Loading deshabilita interacción

_Para cualquier_ operación en progreso (crear o editar), el botón de guardar debe estar deshabilitado y mostrar un spinner, previniendo múltiples envíos.

**Validates: Requirements 5.1, 5.2**

### Property 10: Eliminación requiere confirmación

_Para cualquier_ offering, cuando el usuario intenta eliminarlo, el sistema debe mostrar un diálogo de confirmación antes de proceder con la eliminación.

**Validates: Requirements 5.3**

### Property 11: Operaciones no bloquean UI

_Para cualquier_ operación (crear, editar, eliminar, toggle), el sistema debe procesarla de forma asíncrona sin bloquear la interfaz de usuario.

**Validates: Requirements 5.4**

### Property 12: Modal previene cierre accidental durante operación

_Para cualquier_ operación en progreso, el modal debe prevenir que el usuario lo cierre accidentalmente (por ejemplo, deshabilitando el botón X o el clic fuera del modal).

**Validates: Requirements 5.5**

### Property 13: API calls son correctas

_Para cualquier_ operación CRUD, el sistema debe enviar la petición HTTP correcta (POST para crear, PUT para actualizar, DELETE para eliminar, PATCH para toggle) al endpoint apropiado con los datos correctos.

**Validates: Requirements 6.1, 6.2, 6.3, 6.4**

### Property 14: Cache se invalida después de operaciones

_Para cualquier_ operación exitosa que modifique datos, el sistema debe invalidar las queries relevantes de TanStack Query para asegurar que la UI muestra datos actualizados.

**Validates: Requirements 6.5**

### Property 15: Modales son accesibles

_Para cualquier_ modal abierto, debe tener los atributos ARIA correctos (role="dialog", aria-modal="true"), enfocar automáticamente el primer campo, responder a la tecla Escape, y mantener el foco dentro del modal (focus trap).

**Validates: Requirements 7.1, 7.2, 7.3, 7.4**

### Property 16: Errores de validación son accesibles

_Para cualquier_ campo con error de validación, el mensaje de error debe estar asociado con el campo usando aria-describedby para que los lectores de pantalla puedan anunciarlo.

**Validates: Requirements 7.5**

### Property 17: Notificaciones son anunciadas

_Para cualquier_ notificación mostrada, debe tener los atributos ARIA correctos (role="status", aria-live="polite") para que los lectores de pantalla la anuncien automáticamente.

**Validates: Requirements 7.6**

## Error Handling

### Validation Errors

**Estrategia**: Validación en tiempo real con Zod + React Hook Form

**Tipos de Errores**:

- Campos requeridos vacíos
- Valores fuera de rango (min/max)
- Tipos de datos incorrectos
- Formato inválido

**Manejo**:

- Mostrar mensaje de error debajo del campo
- Marcar campo con borde rojo
- Prevenir envío del formulario
- Mantener foco en campo con error

### API Errors

**Estrategia**: Manejo centralizado con notificaciones toast

**Tipos de Errores**:

- 400 Bad Request: Validación del servidor
- 401 Unauthorized: Token inválido o expirado
- 403 Forbidden: Sin permisos
- 404 Not Found: Offering no encontrado
- 409 Conflict: Nombre duplicado
- 500 Internal Server Error: Error del servidor

**Manejo**:

```typescript
const handleApiError = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const message = error.response?.data?.message;

    switch (status) {
      case 409:
        return "Ya existe un servicio con ese nombre";
      case 403:
        return "No tienes permisos para realizar esta acción";
      case 401:
        return "Tu sesión ha expirado. Por favor, inicia sesión nuevamente";
      default:
        return message || "Ocurrió un error inesperado";
    }
  }
  return "Ocurrió un error inesperado";
};
```

### Network Errors

**Estrategia**: Retry automático con TanStack Query

**Configuración**:

- Retry: 3 intentos
- Retry delay: Exponencial (1s, 2s, 4s)
- Timeout: 30 segundos

**Manejo**:

- Mostrar notificación de error de red
- Permitir retry manual
- Mantener datos en formulario

## Testing Strategy

### Unit Tests

**Componentes a Testear**:

- OfferingForm: Validación, renderizado, eventos
- OfferingCreateModal: Apertura, cierre, creación
- OfferingEditModal: Apertura, cierre, edición, precarga
- OfferingsPage: Integración con modales

**Herramientas**:

- Vitest para test runner
- React Testing Library para renderizado
- MSW (Mock Service Worker) para API mocking
- @testing-library/user-event para interacciones

**Cobertura Objetivo**: > 80%

### Property-Based Tests

**Librería**: fast-check (JavaScript/TypeScript)

**Configuración**:

- Mínimo 100 iteraciones por propiedad
- Generadores personalizados para datos de offering
- Shrinking automático para encontrar casos mínimos de falla

**Generadores Necesarios**:

```typescript
// Generador de nombres válidos
const validNameArb = fc.string({ minLength: 3, maxLength: 100 });

// Generador de duraciones válidas
const validDurationArb = fc.integer({ min: 15, max: 480 });

// Generador de capacidades válidas
const validCapacityArb = fc.integer({ min: 1, max: 100 });

// Generador de offerings completos
const offeringArb = fc.record({
  name: validNameArb,
  durationMinutes: validDurationArb,
  maxCapacityPerSlot: validCapacityArb,
  maxDailyCapacity: fc.option(fc.integer({ min: 1 }), { nil: null }),
});
```

### Integration Tests

**Flujos a Testear**:

1. Crear offering completo (abrir modal → llenar formulario → guardar → verificar lista)
2. Editar offering (abrir modal → modificar → guardar → verificar cambios)
3. Eliminar offering (confirmar → verificar eliminación)
4. Validación de errores (datos inválidos → verificar mensajes)
5. Manejo de errores de API (simular errores → verificar notificaciones)

**Herramientas**:

- React Testing Library para renderizado completo
- MSW para simular respuestas de API
- @testing-library/user-event para flujos de usuario

### Accessibility Tests

**Herramientas**:

- jest-axe para auditoría automática
- @testing-library/react para verificación de ARIA

**Tests Específicos**:

- Atributos ARIA en modales
- Focus management (trap, auto-focus)
- Navegación por teclado
- Anuncios de screen reader
- Contraste de colores
- Tamaños de touch targets

## Performance Considerations

### Optimizations

1. **Memoization**: Usar `React.memo` para OfferingCard
2. **Debouncing**: Validación de formulario con debounce de 300ms
3. **Code Splitting**: Lazy loading de modales
4. **Query Caching**: TanStack Query con staleTime de 5 minutos
5. **Optimistic Updates**: Actualizar UI antes de confirmar con servidor

### Bundle Size

**Objetivo**: < 50KB adicional (gzipped)

**Estrategias**:

- Tree-shaking de Mantine UI (importar solo componentes usados)
- Lazy loading de modales
- Compartir validación entre componentes

### Rendering Performance

**Objetivo**: < 16ms por render (60 FPS)

**Estrategias**:

- Evitar re-renders innecesarios con React.memo
- Usar useCallback para funciones pasadas como props
- Virtualización si la lista de offerings crece (react-window)

## Accessibility

### WCAG 2.1 AA Compliance

**Requisitos Cumplidos**:

- 1.3.1 Info and Relationships: Estructura semántica correcta
- 1.4.3 Contrast: Contraste mínimo 4.5:1
- 2.1.1 Keyboard: Navegación completa por teclado
- 2.4.3 Focus Order: Orden lógico de foco
- 2.4.7 Focus Visible: Indicador de foco visible
- 3.2.2 On Input: Sin cambios inesperados
- 3.3.1 Error Identification: Errores claramente identificados
- 3.3.2 Labels or Instructions: Labels claros en todos los campos
- 4.1.2 Name, Role, Value: ARIA correctamente implementado

### Keyboard Navigation

**Shortcuts**:

- `Tab`: Navegar entre campos
- `Shift + Tab`: Navegar hacia atrás
- `Enter`: Enviar formulario
- `Escape`: Cerrar modal
- `Space`: Activar botones

### Screen Reader Support

**Anuncios**:

- Apertura de modal: "Diálogo: Crear Servicio"
- Errores de validación: "Error: El nombre debe tener al menos 3 caracteres"
- Notificaciones: "Servicio creado exitosamente"
- Loading: "Guardando servicio..."

## Responsive Design

### Breakpoints

- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

### Modal Behavior

**Mobile**:

- Pantalla completa
- Botones apilados verticalmente
- Padding reducido

**Tablet/Desktop**:

- Ancho fijo de 600px
- Centrado en pantalla
- Botones en fila

### Form Layout

**Mobile**:

- Campos apilados verticalmente
- Labels encima de inputs
- Botones full-width

**Tablet/Desktop**:

- Campos en columna
- Labels a la izquierda (opcional)
- Botones con ancho automático

## Implementation Notes

### Mantine UI Components Used

- `Modal`: Contenedor de modales
- `TextInput`: Campo de texto para nombre
- `NumberInput`: Campos numéricos para duración y capacidad
- `Button`: Botones de acción
- `Group`: Agrupación de botones
- `Stack`: Layout vertical de campos
- `Loader`: Indicador de carga
- `notifications`: Sistema de notificaciones

### React Hook Form Integration

```typescript
const {
  register,
  handleSubmit,
  formState: { errors },
  reset,
} = useForm<OfferingFormData>({
  resolver: zodResolver(offeringFormSchema),
  defaultValues: offering || defaultOfferingValues,
  mode: "onBlur", // Validar al perder foco
});
```

### TanStack Query Integration

```typescript
// Invalidación después de crear
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: offeringKeys.lists() });
  notifications.show({ message: 'Servicio creado exitosamente', color: 'green' });
  onClose();
}

// Actualización optimista
onMutate: async (newOffering) => {
  await queryClient.cancelQueries({ queryKey: offeringKeys.lists() });
  const previousOfferings = queryClient.getQueryData(offeringKeys.lists());
  queryClient.setQueryData(offeringKeys.lists(), (old) => [...old, newOffering]);
  return { previousOfferings };
},
onError: (err, newOffering, context) => {
  queryClient.setQueryData(offeringKeys.lists(), context.previousOfferings);
}
```

### File Organization

```
apps/frontend/src/
├── pages/OfferingsPage/
│   └── ui/
│       ├── OfferingsPage.tsx          # Página principal (actualizar)
│       ├── OfferingCreateModal.tsx    # Modal de creación (nuevo)
│       ├── OfferingEditModal.tsx      # Modal de edición (nuevo)
│       └── OfferingForm.tsx           # Formulario compartido (nuevo)
├── entities/offering/
│   ├── index.ts                       # Exports públicos
│   ├── model/
│   │   └── useOfferings.ts            # Hooks de TanStack Query (existe)
│   └── lib/
│       └── validation.ts              # Schema de Zod (nuevo)
└── shared/
    └── api/
        └── services/
            └── offerings.service.ts   # Servicio de API (existe)
```

### Dependencies to Add

```json
{
  "dependencies": {
    "react-hook-form": "^7.49.0",
    "@hookform/resolvers": "^3.3.0",
    "zod": "^3.22.0"
  },
  "devDependencies": {
    "fast-check": "^3.15.0",
    "@testing-library/user-event": "^14.5.0",
    "jest-axe": "^8.0.0"
  }
}
```

## Security Considerations

### Input Sanitization

- Trim whitespace de strings
- Validar tipos de datos
- Limitar longitud de strings
- Prevenir inyección de código

### Authentication

- JWT token en todas las peticiones
- Validar token en cada operación
- Manejar expiración de token
- Redirigir a login si no autenticado

### Authorization

- Verificar permisos en backend
- Mostrar solo acciones permitidas
- Manejar errores 403 apropiadamente

### Data Validation

- Validación en cliente (UX)
- Validación en servidor (seguridad)
- Nunca confiar solo en validación de cliente
- Sanitizar datos antes de enviar

## Future Enhancements

### Phase 2

- Drag & drop para reordenar offerings
- Categorías de offerings
- Imágenes de offerings
- Precios de offerings
- Descuentos y promociones

### Phase 3

- Duplicar offerings
- Importar/exportar offerings
- Plantillas de offerings
- Historial de cambios
- Búsqueda y filtros avanzados

### Phase 4

- Offerings recurrentes
- Paquetes de offerings
- Offerings con múltiples variantes
- Integración con calendario
- Analytics de offerings más populares

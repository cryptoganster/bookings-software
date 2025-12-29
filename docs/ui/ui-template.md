# UI Template - [Nombre de la Vista]

**Versión:** 1.0  
**Fecha:** [Fecha]  
**Ruta:** `/[ruta-url]`  
**Roles Permitidos:** `[BUSINESS_OWNER, ADMIN, etc.]`

---

## 1. Visión General

**Propósito:** [Descripción breve de qué hace esta vista]

**Casos de Uso Principales:**

- [Caso de uso 1]
- [Caso de uso 2]
- [Caso de uso 3]

**Navegación:**

- Desde: [Vista origen]
- Hacia: [Vistas destino]

---

## 2. Estructura de la Vista

### 2.1 Layout

```
┌─────────────────────────────────────────────────────────┐
│  Header / Breadcrumbs                                   │
├─────────────────────────────────────────────────────────┤
│  Título Principal                                       │
│  [Descripción opcional]                                 │
├─────────────────────────────────────────────────────────┤
│  Filtros y Acciones Rápidas                            │
├─────────────────────────────────────────────────────────┤
│  Sección 1: [Nombre]                                    │
│  [Contenido]                                            │
├─────────────────────────────────────────────────────────┤
│  Sección 2: [Nombre]                                    │
│  [Contenido]                                            │
├─────────────────────────────────────────────────────────┤
│  Sección 3: [Nombre]                                    │
│  [Contenido]                                            │
└─────────────────────────────────────────────────────────┘
```

### 2.2 Responsive Behavior

**Desktop (> 1024px):**

- [Comportamiento en desktop]

**Tablet (768px - 1024px):**

- [Comportamiento en tablet]

**Mobile (< 768px):**

- [Comportamiento en mobile]

---

## 3. Componentes y Widgets

### 3.1 Header

**Elementos:**

- Título: `[Texto del título]`
- Breadcrumbs: `[Ruta de navegación]`
- Acciones principales: `[Botones/acciones]`

### 3.2 Filtros y Búsqueda

**Filtros Disponibles:**

| Filtro   | Tipo               | Valores    | Default | Endpoint       |
| -------- | ------------------ | ---------- | ------- | -------------- |
| [Nombre] | [select/date/text] | [Opciones] | [Valor] | [API endpoint] |

**Búsqueda:**

- Campo: `[Campo de búsqueda]`
- Placeholder: `[Texto placeholder]`
- Debounce: `[300ms]`
- Endpoint: `GET /api/[endpoint]?search=[query]`

### 3.3 Métricas / Stats Cards

**Card 1: [Nombre de la Métrica]**

- **Endpoint:** `GET /api/[endpoint]`
- **Campo:** `[nombreCampo]`
- **Tipo:** `number | percentage | currency`
- **Formato:** `[Formato de visualización]`
- **Indicador:** `[global | trend | comparison]`
- **Icono:** `[Nombre del icono]`
- **Color:** `[primary | success | warning | danger]`
- **Tooltip:** `[Texto explicativo]`

**Card 2: [Nombre de la Métrica]**

- [Misma estructura]

**Card 3: [Nombre de la Métrica]**

- [Misma estructura]

### 3.4 Gráficos y Visualizaciones

**Gráfico 1: [Nombre del Gráfico]**

- **Tipo:** `[line | bar | pie | donut | area]`
- **Endpoint:** `GET /api/[endpoint]`
- **Datos:**
  - Eje X: `[campo]` - `[label]`
  - Eje Y: `[campo]` - `[label]`
  - Series: `[campos]`
- **Configuración:**
  - Colores: `[paleta]`
  - Leyenda: `[posición]`
  - Tooltips: `[formato]`
  - Animación: `[sí/no]`
- **Interactividad:**
  - Click: `[acción]`
  - Hover: `[acción]`
  - Zoom: `[sí/no]`

**Gráfico 2: [Nombre del Gráfico]**

- [Misma estructura]

### 3.5 Tablas y Listados

**Tabla Principal: [Nombre]**

**Endpoint:** `GET /api/[endpoint]`

**Columnas:**

| Columna  | Campo API | Tipo   | Formato   | Sortable | Filtrable | Ancho  |
| -------- | --------- | ------ | --------- | -------- | --------- | ------ |
| [Nombre] | `[campo]` | [tipo] | [formato] | ✅/❌    | ✅/❌     | [px/%] |

**Acciones por Fila:**

- Ver Detalle: `[icono]` → `[ruta]`
- Editar: `[icono]` → `[modal/ruta]`
- Eliminar: `[icono]` → `[confirmación]`
- [Acción custom]: `[icono]` → `[comportamiento]`

**Paginación:**

- Tipo: `[client-side | server-side]`
- Items por página: `[10, 25, 50, 100]`
- Default: `[25]`
- Endpoint: `GET /api/[endpoint]?page=[n]&limit=[n]`

**Estados:**

- Loading: `[Skeleton | Spinner]`
- Empty: `[Mensaje + Ilustración + CTA]`
- Error: `[Mensaje de error + Retry]`

### 3.6 Secciones Destacadas

**Sección: [Nombre]**

**Propósito:** [Descripción]

**Contenido:**

- Elemento 1: `[descripción]`
- Elemento 2: `[descripción]`
- Elemento 3: `[descripción]`

**Endpoint:** `GET /api/[endpoint]`

**Interacciones:**

- [Acción 1]: `[comportamiento]`
- [Acción 2]: `[comportamiento]`

### 3.7 Modales y Drawers

**Modal: [Nombre]**

**Trigger:** `[Botón/acción que lo abre]`

**Contenido:**

- Título: `[Texto]`
- Formulario/Contenido: `[Descripción]`
- Acciones:
  - Primaria: `[Texto botón]` → `[endpoint]`
  - Secundaria: `[Texto botón]` → `[acción]`
  - Cancelar: `[Texto botón]` → `[cerrar]`

**Validaciones:**

- Campo 1: `[reglas]`
- Campo 2: `[reglas]`

**Estados:**

- Loading: `[Comportamiento]`
- Success: `[Mensaje + Acción]`
- Error: `[Mensaje + Retry]`

---

## 4. Acciones y Botones

### 4.1 Acciones Principales

**Botón: [Nombre]**

- **Ubicación:** `[Header | Toolbar | Inline]`
- **Tipo:** `[primary | secondary | danger]`
- **Icono:** `[Nombre del icono]`
- **Acción:** `[Descripción]`
- **Endpoint:** `POST /api/[endpoint]`
- **Payload:**
  ```json
  {
    "campo1": "valor",
    "campo2": "valor"
  }
  ```
- **Confirmación:** `[sí/no]` - `[Mensaje]`
- **Success:** `[Mensaje + Redirección/Actualización]`
- **Error:** `[Mensaje de error]`

### 4.2 Acciones Secundarias

**Botón: [Nombre]**

- [Misma estructura]

### 4.3 Acciones Contextuales

**Menú de Acciones (Dropdown/Kebab):**

- Acción 1: `[nombre]` → `[endpoint]`
- Acción 2: `[nombre]` → `[endpoint]`
- Acción 3: `[nombre]` → `[endpoint]`

---

## 5. Integraciones con API

### 5.1 Endpoints Utilizados

**Referencia:** Ver `docs/api/[nombre-bc].md`

| Endpoint              | Método | Propósito     | Usado en     |
| --------------------- | ------ | ------------- | ------------ |
| `/api/[endpoint]`     | GET    | [Descripción] | [Componente] |
| `/api/[endpoint]`     | POST   | [Descripción] | [Componente] |
| `/api/[endpoint]/:id` | PUT    | [Descripción] | [Componente] |
| `/api/[endpoint]/:id` | DELETE | [Descripción] | [Componente] |

### 5.2 Queries (TanStack Query)

**Query: [Nombre]**

```typescript
// Query Key
const queryKey = ["[resource]", "[filters]"];

// Hook
useQuery({
  queryKey,
  queryFn: () => api.get("/api/[endpoint]"),
  staleTime: [tiempo],
  cacheTime: [tiempo],
  refetchOnWindowFocus: [true / false],
});
```

### 5.3 Mutations (TanStack Query)

**Mutation: [Nombre]**

```typescript
useMutation({
  mutationFn: (data) => api.post("/api/[endpoint]", data),
  onSuccess: () => {
    // Invalidar queries
    queryClient.invalidateQueries(["[resource]"]);
    // Mostrar notificación
    // Redireccionar
  },
  onError: (error) => {
    // Mostrar error
  },
});
```

### 5.4 Optimistic Updates

**Recurso: [Nombre]**

```typescript
onMutate: async (newData) => {
  await queryClient.cancelQueries(['[resource]']);
  const previous = queryClient.getQueryData(['[resource]']);
  queryClient.setQueryData(['[resource]'], (old) => {
    // Actualización optimista
  });
  return { previous };
},
onError: (err, newData, context) => {
  queryClient.setQueryData(['[resource]'], context.previous);
},
onSettled: () => {
  queryClient.invalidateQueries(['[resource]']);
},
```

---

## 6. Estado y Formularios

### 6.1 Estado Local (useState)

**Estado: [Nombre]**

- **Propósito:** `[Descripción]`
- **Tipo:** `[tipo TypeScript]`
- **Valor inicial:** `[valor]`
- **Usado en:** `[Componentes]`

### 6.2 Estado Global (Zustand)

**Store: [Nombre]**

- **Propósito:** `[Descripción]`
- **Estado:**
  ```typescript
  {
    campo1: tipo,
    campo2: tipo,
  }
  ```
- **Acciones:**
  - `setField()`: `[Descripción]`
  - `reset()`: `[Descripción]`

### 6.3 Formularios (React Hook Form + Zod)

**Formulario: [Nombre]**

**Schema de Validación:**

```typescript
const schema = z.object({
  campo1: z.string().min(3).max(50),
  campo2: z.number().min(1),
  campo3: z.date(),
});
```

**Campos:**

| Campo    | Tipo               | Validación | Placeholder | Default |
| -------- | ------------------ | ---------- | ----------- | ------- |
| [nombre] | [text/number/date] | [reglas]   | [texto]     | [valor] |

**Submit:**

- Endpoint: `POST /api/[endpoint]`
- Success: `[Mensaje + Acción]`
- Error: `[Mensaje + Retry]`

---

## 7. Notificaciones y Feedback

### 7.1 Notificaciones Toast

**Tipo: Success**

- Mensaje: `[Texto]`
- Duración: `[3000ms]`
- Posición: `[top-right]`
- Icono: `[check-circle]`

**Tipo: Error**

- Mensaje: `[Texto]`
- Duración: `[5000ms]`
- Posición: `[top-right]`
- Icono: `[x-circle]`

**Tipo: Warning**

- Mensaje: `[Texto]`
- Duración: `[4000ms]`
- Posición: `[top-right]`
- Icono: `[alert-triangle]`

### 7.2 Estados de Carga

**Loading States:**

- Skeleton: `[Componentes que usan skeleton]`
- Spinner: `[Componentes que usan spinner]`
- Progress Bar: `[Componentes que usan progress]`

### 7.3 Estados Vacíos

**Empty State: [Nombre]**

- Ilustración: `[Nombre/URL]`
- Título: `[Texto]`
- Descripción: `[Texto]`
- CTA: `[Botón]` → `[Acción]`

---

## 8. Permisos y Roles

### 8.1 Visibilidad por Rol

| Elemento       | BUSINESS_OWNER | ADMIN | CUSTOMER |
| -------------- | -------------- | ----- | -------- |
| [Componente 1] | ✅             | ✅    | ❌       |
| [Componente 2] | ✅             | ❌    | ❌       |
| [Acción 1]     | ✅             | ✅    | ❌       |

### 8.2 Validaciones de Permisos

**Componente: [Nombre]**

```typescript
const canView = user.roles.includes("BUSINESS_OWNER");
const canEdit = user.roles.includes("ADMIN");
const canDelete = user.roles.includes("ADMIN") && resource.ownerId === user.id;
```

---

## 9. Navegación y Rutas

### 9.1 Rutas

**Ruta Principal:** `/[ruta]`

**Rutas Relacionadas:**

- `/[ruta]/[subruta]` - `[Descripción]`
- `/[ruta]/:id` - `[Descripción]`
- `/[ruta]/:id/edit` - `[Descripción]`

### 9.2 Breadcrumbs

```
Home > [Nivel 1] > [Nivel 2] > [Nivel 3]
```

### 9.3 Navegación Contextual

**Links Rápidos:**

- `[Texto]` → `/[ruta]`
- `[Texto]` → `/[ruta]`

---

## 10. Accesibilidad (a11y)

### 10.1 ARIA Labels

- Botones: `aria-label="[texto]"`
- Inputs: `aria-describedby="[id]"`
- Modales: `role="dialog"` + `aria-modal="true"`

### 10.2 Navegación por Teclado

- Tab: `[Orden de navegación]`
- Enter: `[Acción]`
- Escape: `[Cerrar modal/cancelar]`
- Arrow keys: `[Navegación en listas]`

### 10.3 Screen Readers

- Anuncios: `[Mensajes importantes]`
- Live regions: `[Actualizaciones dinámicas]`

---

## 11. Performance

### 11.1 Optimizaciones

- Lazy loading: `[Componentes]`
- Code splitting: `[Rutas]`
- Memoización: `[Componentes pesados]`
- Virtualización: `[Listas largas]`

### 11.2 Métricas Objetivo

- First Contentful Paint: `< 1.5s`
- Time to Interactive: `< 3s`
- Largest Contentful Paint: `< 2.5s`

---

## 12. Testing

### 12.1 Tests Unitarios

**Componente: [Nombre]**

```typescript
describe("[Nombre]", () => {
  it("should render correctly", () => {
    // Test
  });

  it("should handle [acción]", () => {
    // Test
  });
});
```

### 12.2 Tests de Integración

**Flujo: [Nombre]**

```typescript
describe("[Flujo]", () => {
  it("should complete [flujo] successfully", async () => {
    // Test con MSW
  });
});
```

---

## 13. Dependencias de Features

**Referencia:** Ver `docs/features/[nombre-bc].md`

**Features Utilizadas:**

- Feature 1: `[Nombre]` - `[Descripción]`
- Feature 2: `[Nombre]` - `[Descripción]`

---

## 14. Wireframes y Mockups

**Figma/Diseño:** `[URL]`

**Screenshots:**

- Desktop: `[URL/path]`
- Tablet: `[URL/path]`
- Mobile: `[URL/path]`

---

## 15. Notas de Implementación

### 15.1 Consideraciones Técnicas

- [Consideración 1]
- [Consideración 2]

### 15.2 Limitaciones Conocidas

- [Limitación 1]
- [Limitación 2]

### 15.3 Mejoras Futuras

- [Mejora 1]
- [Mejora 2]

---

## 16. Changelog

| Versión | Fecha   | Cambios         |
| ------- | ------- | --------------- |
| 1.0     | [Fecha] | Versión inicial |

---

**Última actualización:** [Fecha]  
**Mantenido por:** [Equipo/Persona]

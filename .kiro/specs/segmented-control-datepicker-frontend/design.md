# Design Document

## Overview

Este diseño implementa un sistema de filtros de fecha mejorado para la página de Appointments, utilizando un SegmentedControl de Mantine para presets rápidos (Hoy, Esta Semana, Este Mes, Personalizado) y un DatePickerInput condicional para rangos personalizados. La solución se integra con la arquitectura FSD existente, el store de Zustand, y TanStack Query.

## Architecture

### Component Structure

```
features/appointment/filter/
├── ui/
│   ├── AppointmentFilters.tsx (modificar)
│   └── DateRangeFilter.tsx (nuevo)
├── model/
│   ├── useAppointmentFilters.ts (modificar)
│   └── useDateRangePresets.ts (nuevo)
└── lib/
    └── dateRangeCalculations.ts (nuevo)
```

### Data Flow

```
User selects preset
    ↓
DateRangeFilter component
    ↓
useDateRangePresets hook
    ↓
dateRangeCalculations utility
    ↓
useAppointmentFilters store (setDateRange + setPreset)
    ↓
AppointmentsList component
    ↓
useAppointments query (with filters)
    ↓
API call with startDate/endDate
```

## Components and Interfaces

### 1. DateRangeFilter Component

**Ubicación:** `features/appointment/filter/ui/DateRangeFilter.tsx`

**Props:**

```typescript
interface DateRangeFilterProps {
  // No props - usa el store directamente
}
```

**Responsabilidades:**

- Renderizar SegmentedControl con presets
- Mostrar/ocultar DatePickerInput según preset
- Manejar cambios de preset y rango personalizado
- Aplicar estilos consistentes (radius="xl")

### 2. useDateRangePresets Hook

**Ubicación:** `features/appointment/filter/model/useDateRangePresets.ts`

**Interface:**

```typescript
export type DateRangePreset = "today" | "week" | "month" | "custom";

export interface UseDateRangePresetsReturn {
  preset: DateRangePreset;
  setPreset: (preset: DateRangePreset) => void;
  getPresetRange: (preset: DateRangePreset) => [Date, Date] | null;
  getPresetLabel: (preset: DateRangePreset) => string;
}
```

**Responsabilidades:**

- Gestionar el estado del preset actual
- Calcular rangos de fechas para cada preset
- Integrar con useAppointmentFilters store
- Proporcionar labels para UI

### 3. Date Range Calculations Utility

**Ubicación:** `features/appointment/filter/lib/dateRangeCalculations.ts`

**Functions:**

```typescript
export function getTodayRange(): [Date, Date];
export function getWeekRange(): [Date, Date];
export function getMonthRange(): [Date, Date];
export function formatDateRangeLabel(range: [Date, Date] | null): string;
```

**Responsabilidades:**

- Cálculos puros de rangos de fechas
- Usar date-fns para manipulación de fechas
- Retornar rangos con hora exacta (00:00:00 - 23:59:59)

## Data Models

### Extended AppointmentFiltersState

```typescript
interface AppointmentFiltersState {
  status: AppointmentStatus | null;
  dateRange: [Date, Date] | null;
  offeringId: string | null;
  dateRangePreset: DateRangePreset; // NUEVO
  setStatus: (status: AppointmentStatus | null) => void;
  setDateRange: (range: [Date, Date] | null) => void;
  setOfferingId: (id: string | null) => void;
  setDateRangePreset: (preset: DateRangePreset) => void; // NUEVO
  reset: () => void;
}
```

### DateRangePreset Type

```typescript
export type DateRangePreset = "today" | "week" | "month" | "custom";
```

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Property 1: Preset range calculation consistency

_For any_ preset type ('today', 'week', 'month'), calling `getPresetRange()` multiple times within the same day should return the same date range
**Validates: Requirements 3.1, 3.4**

### Property 2: Date range boundaries

_For any_ calculated preset range, the start date should always be at 00:00:00 and the end date should always be at 23:59:59
**Validates: Requirements 3.1, 3.2, 3.3**

### Property 3: Week range starts on Monday

_For any_ date, calling `getWeekRange()` should return a range where the start date is a Monday and the end date is a Sunday
**Validates: Requirements 3.2**

### Property 4: Month range covers full month

_For any_ date, calling `getMonthRange()` should return a range from day 1 to the last day of that month
**Validates: Requirements 3.3**

### Property 5: Custom preset preserves user selection

_For any_ custom date range selected by the user, the preset should remain 'custom' until explicitly changed
**Validates: Requirements 2.4**

### Property 6: Preset change clears custom range

_For any_ preset change from 'custom' to another preset, the custom date range should be cleared from the store
**Validates: Requirements 2.3**

### Property 7: Filter integration preservation

_For any_ preset change, other filters (status, offeringId) should remain unchanged
**Validates: Requirements 4.1**

### Property 8: Reset clears all date state

_For any_ state, calling `reset()` should set preset to 'custom' and dateRange to null
**Validates: Requirements 4.2**

## Error Handling

### Invalid Date Handling

```typescript
try {
  const range = getPresetRange(preset);
  setDateRange(range);
} catch (error) {
  console.error("Error calculating date range:", error);
  // Fallback to custom preset
  setPreset("custom");
  setDateRange(null);
}
```

### Edge Cases

1. **Timezone handling:** Usar date-fns con zona horaria del navegador
2. **Leap years:** date-fns maneja automáticamente
3. **DST transitions:** Usar startOfDay/endOfDay para evitar problemas
4. **Invalid custom ranges:** Validar que start < end antes de aplicar

## Testing Strategy

### Unit Tests

**dateRangeCalculations.test.ts:**

- ✅ `getTodayRange()` retorna rango del día actual
- ✅ `getWeekRange()` retorna lunes a domingo
- ✅ `getMonthRange()` retorna día 1 al último día
- ✅ Rangos tienen horas correctas (00:00:00 - 23:59:59)
- ✅ `formatDateRangeLabel()` formatea correctamente

**useDateRangePresets.test.ts:**

- ✅ Hook inicializa con preset 'custom'
- ✅ `setPreset()` actualiza el store correctamente
- ✅ `getPresetRange()` retorna rangos correctos
- ✅ Cambiar de 'custom' a otro preset limpia dateRange

### Property-Based Tests

**dateRangeCalculations.pbt.test.ts:**

- ✅ Property 1: Consistency - mismo día retorna mismo rango
- ✅ Property 2: Boundaries - start 00:00:00, end 23:59:59
- ✅ Property 3: Week starts Monday
- ✅ Property 4: Month covers full month

### Integration Tests

**DateRangeFilter.integration.test.tsx:**

- ✅ Seleccionar preset actualiza filtros
- ✅ Preset 'custom' muestra DatePickerInput
- ✅ Otros presets ocultan DatePickerInput
- ✅ Cambiar preset actualiza appointments list
- ✅ "Limpiar filtros" resetea preset

### Component Tests

**DateRangeFilter.test.tsx:**

- ✅ Renderiza SegmentedControl con 4 opciones
- ✅ Click en preset actualiza estado
- ✅ DatePickerInput visible solo en 'custom'
- ✅ Accesibilidad: navegación con teclado
- ✅ Responsive: layout correcto en mobile

## Implementation Notes

### Date-fns Functions to Use

```typescript
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  format,
} from "date-fns";
```

### Mantine Components

```typescript
import { SegmentedControl, Stack } from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
```

### Store Integration

```typescript
// En useAppointmentFilters.ts
export const useAppointmentFilters = create<AppointmentFiltersState>((set) => ({
  // ... estado existente
  dateRangePreset: "custom",

  setDateRangePreset: (preset) => set({ dateRangePreset: preset }),

  reset: () =>
    set({
      status: null,
      dateRange: null,
      offeringId: null,
      dateRangePreset: "custom", // Resetear preset también
    }),
}));
```

### Styling Consistency

- Usar `radius="xl"` en SegmentedControl
- Mantener `gap="md"` en Stack
- Aplicar `style={{ minWidth: 300 }}` al DatePickerInput
- Usar colores del tema brandGreen para estados activos

## Performance Considerations

1. **Memoization:** Usar `useMemo` para cálculos de rangos si es necesario
2. **Debouncing:** No necesario - cambios de preset son instantáneos
3. **Query invalidation:** TanStack Query maneja automáticamente con query keys
4. **Re-renders:** SegmentedControl es eficiente, no requiere optimización adicional

## Accessibility

1. **Keyboard navigation:** SegmentedControl soporta flechas nativamente
2. **Screen readers:** Agregar `aria-label` descriptivos
3. **Focus management:** Mantener focus visible con outline
4. **Labels:** Usar labels claros y descriptivos en español

## Migration Strategy

1. ✅ Agregar nuevo campo `dateRangePreset` al store (default: 'custom')
2. ✅ Crear utilities y hooks nuevos
3. ✅ Crear componente DateRangeFilter
4. ✅ Integrar en AppointmentFilters (reemplazar DatePickerInput directo)
5. ✅ Escribir tests
6. ✅ Verificar que filtros existentes siguen funcionando
7. ✅ No requiere migración de datos - es solo UI

## Rollback Plan

Si hay problemas:

1. Revertir cambios en AppointmentFilters.tsx
2. Mantener DatePickerInput directo como antes
3. Eliminar archivos nuevos (DateRangeFilter, useDateRangePresets, dateRangeCalculations)
4. Revertir cambios en useAppointmentFilters.ts
5. El store es compatible hacia atrás (campo nuevo es opcional)

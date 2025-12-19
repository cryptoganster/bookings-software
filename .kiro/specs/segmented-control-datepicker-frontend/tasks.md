# Implementation Plan - Segmented Control DatePicker Frontend

## Fase 1: Setup y Preparación

- [x] 1. Crear rama feature
  - Crear rama `feature/segmented-control-datepicker-frontend` desde `develop`
  - Verificar que estamos en la rama correcta
  - _Requirements: Setup_

- [x] 2. Crear estructura de archivos
  - Crear `features/appointment/filter/lib/dateRangeCalculations.ts`
  - Crear `features/appointment/filter/lib/__tests__/dateRangeCalculations.test.ts`
  - Crear `features/appointment/filter/lib/__tests__/dateRangeCalculations.pbt.test.ts`
  - Crear `features/appointment/filter/model/useDateRangePresets.ts`
  - Crear `features/appointment/filter/model/__tests__/useDateRangePresets.test.ts`
  - Crear `features/appointment/filter/ui/DateRangeFilter.tsx`
  - Crear `features/appointment/filter/ui/__tests__/DateRangeFilter.test.tsx`
  - _Requirements: 1.1, 2.1, 3.1_

## Fase 2: Utilities y Cálculos de Fecha

- [x] 3. Implementar dateRangeCalculations utility
  - Implementar `getTodayRange()`: retorna [startOfDay(now), endOfDay(now)]
  - Implementar `getWeekRange()`: retorna [startOfWeek(now, {weekStartsOn: 1}), endOfWeek(now, {weekStartsOn: 1})]
  - Implementar `getMonthRange()`: retorna [startOfMonth(now), endOfMonth(now)]
  - Implementar `formatDateRangeLabel(range)`: formatea rango para display
  - Usar date-fns para todas las operaciones
  - Exportar tipo `DateRangePreset = 'today' | 'week' | 'month' | 'custom'`
  - _Requirements: 3.1, 3.2, 3.3_
  - **Commit:** `feat(filters): add date range calculation utilities`

- [x] 4. Ejecutar validaciones
  - Ejecutar `pnpm lint:frontend` y corregir errores si existen
  - Ejecutar `pnpm typecheck:frontend` y corregir errores si existen
  - Ejecutar `pnpm format:frontend`
  - _Requirements: Code Quality_

- [x] 5. Escribir unit tests para dateRangeCalculations
  - Test: `getTodayRange()` retorna rango del día actual con horas correctas
  - Test: `getWeekRange()` retorna lunes a domingo de la semana actual
  - Test: `getMonthRange()` retorna día 1 al último día del mes actual
  - Test: `formatDateRangeLabel()` formatea correctamente rangos
  - Test: Rangos tienen start en 00:00:00 y end en 23:59:59
  - Ejecutar `pnpm test:frontend` y verificar que pasan
  - _Requirements: 3.1, 3.2, 3.3_
  - **Commit:** `test(filters): add unit tests for date range calculations`

- [x] 6. Ejecutar validaciones
  - Ejecutar `pnpm lint:frontend` y corregir errores si existen
  - Ejecutar `pnpm typecheck:frontend` y corregir errores si existen
  - Ejecutar `pnpm format:frontend`
  - _Requirements: Code Quality_

- [x] 7. Escribir property-based tests para dateRangeCalculations
  - **Property 1: Consistency** - Para cualquier fecha, llamar getPresetRange() múltiples veces retorna mismo resultado
  - **Property 2: Boundaries** - Para cualquier rango, start es 00:00:00 y end es 23:59:59
  - **Property 3: Week starts Monday** - Para cualquier fecha, getWeekRange() empieza en lunes
  - **Property 4: Month covers full month** - Para cualquier fecha, getMonthRange() va del día 1 al último día
  - Usar `@fast-check/vitest` para generación de fechas aleatorias
  - Ejecutar `pnpm test:frontend` y verificar que pasan
  - _Validates: Property 1, Property 2, Property 3, Property 4, Requirements 3.1, 3.2, 3.3, 3.4_
  - **Commit:** `test(filters): add property-based tests for date calculations`

- [x] 8. Ejecutar validaciones
  - Ejecutar `pnpm lint:frontend` y corregir errores si existen
  - Ejecutar `pnpm typecheck:frontend` y corregir errores si existen
  - Ejecutar `pnpm format:frontend`
  - _Requirements: Code Quality_

## Fase 3: Store y State Management

- [x] 9. Extender useAppointmentFilters store
  - Agregar campo `dateRangePreset: DateRangePreset` al state (default: 'custom')
  - Agregar acción `setDateRangePreset: (preset: DateRangePreset) => void`
  - Actualizar acción `reset()` para incluir `dateRangePreset: 'custom'`
  - Importar tipo `DateRangePreset` desde dateRangeCalculations
  - _Requirements: 2.3, 4.2_
  - **Commit:** `feat(filters): extend store with date range preset state`

- [x] 10. Ejecutar validaciones
  - Ejecutar `pnpm lint:frontend` y corregir errores si existen
  - Ejecutar `pnpm typecheck:frontend` y corregir errores si existen
  - Ejecutar `pnpm format:frontend`
  - _Requirements: Code Quality_

- [x] 11. Actualizar tests existentes de useAppointmentFilters
  - Actualizar tests para incluir `dateRangePreset` en el estado inicial
  - Agregar test: `reset()` resetea `dateRangePreset` a 'custom'
  - Ejecutar `pnpm test:frontend` y verificar que todos los tests pasan
  - _Requirements: 4.2_
  - **Commit:** `test(filters): update store tests for preset field`

- [x] 12. Ejecutar validaciones
  - Ejecutar `pnpm lint:frontend` y corregir errores si existen
  - Ejecutar `pnpm typecheck:frontend` y corregir errores si existen
  - Ejecutar `pnpm format:frontend`
  - _Requirements: Code Quality_

## Fase 4: Custom Hook

- [x] 13. Implementar useDateRangePresets hook
  - Crear hook que usa `useAppointmentFilters` internamente
  - Implementar `preset` getter desde store
  - Implementar `setPreset(preset)` que:
    - Actualiza `dateRangePreset` en store
    - Si preset !== 'custom', calcula rango con `getPresetRange()` y actualiza `dateRange`
    - Si preset === 'custom', no modifica `dateRange`
  - Implementar `getPresetRange(preset)` que llama a las funciones de dateRangeCalculations
  - Implementar `getPresetLabel(preset)` que retorna labels en español
  - Retornar interface `UseDateRangePresetsReturn`
  - _Requirements: 1.2, 1.3, 1.4, 2.3, 3.4_
  - **Commit:** `feat(filters): add useDateRangePresets hook`

- [x] 14. Ejecutar validaciones
  - Ejecutar `pnpm lint:frontend` y corregir errores si existen
  - Ejecutar `pnpm typecheck:frontend` y corregir errores si existen
  - Ejecutar `pnpm format:frontend`
  - _Requirements: Code Quality_

- [x] 15. Escribir tests para useDateRangePresets
  - Test: Hook inicializa con preset 'custom'
  - Test: `setPreset('today')` actualiza store y calcula rango correcto
  - Test: `setPreset('week')` actualiza store y calcula rango correcto
  - Test: `setPreset('month')` actualiza store y calcula rango correcto
  - Test: `setPreset('custom')` actualiza store pero no modifica dateRange
  - Test: `getPresetLabel()` retorna labels correctos en español
  - Test: Cambiar de 'custom' a otro preset limpia dateRange anterior
  - Usar `@testing-library/react-hooks` para testing
  - Ejecutar `pnpm test:frontend` y verificar que pasan
  - _Validates: Property 5, Property 6, Requirements 1.2, 1.3, 1.4, 2.3_
  - **Commit:** `test(filters): add tests for useDateRangePresets hook`

- [x] 16. Ejecutar validaciones
  - Ejecutar `pnpm lint:frontend` y corregir errores si existen
  - Ejecutar `pnpm typecheck:frontend` y corregir errores si existen
  - Ejecutar `pnpm format:frontend`
  - _Requirements: Code Quality_

## Fase 5: UI Component

- [x] 17. Implementar DateRangeFilter component
  - Crear componente funcional que usa `useDateRangePresets()`
  - Renderizar `SegmentedControl` con data: [{label: 'Hoy', value: 'today'}, {label: 'Esta Semana', value: 'week'}, {label: 'Este Mes', value: 'month'}, {label: 'Personalizado', value: 'custom'}]
  - Configurar `value={preset}` y `onChange={setPreset}`
  - Aplicar `radius="xl"` al SegmentedControl
  - Renderizar `DatePickerInput` condicionalmente: `{preset === 'custom' && <DatePickerInput ... />}`
  - Configurar DatePickerInput con `type="range"`, `label="Rango personalizado"`, `clearable`
  - Obtener `dateRange` y `setDateRange` desde `useAppointmentFilters()`
  - Aplicar `style={{ minWidth: 300 }}` al DatePickerInput
  - Envolver en `<Stack gap="md">`
  - _Requirements: 1.1, 1.5, 2.1, 2.2, 5.4_
  - **Commit:** `feat(filters): add DateRangeFilter component`

- [x] 18. Ejecutar validaciones
  - Ejecutar `pnpm lint:frontend` y corregir errores si existen
  - Ejecutar `pnpm typecheck:frontend` y corregir errores si existen
  - Ejecutar `pnpm format:frontend`
  - _Requirements: Code Quality_

- [x] 19. Integrar DateRangeFilter en AppointmentFilters
  - Importar `DateRangeFilter` en `AppointmentFilters.tsx`
  - Reemplazar `<DatePickerInput ... />` existente con `<DateRangeFilter />`
  - Mantener `Select` de estado y botón "Limpiar filtros"
  - Verificar que layout se mantiene correcto con `<Group gap="md">`
  - _Requirements: 1.1, 4.1_
  - **Commit:** `feat(filters): integrate DateRangeFilter in AppointmentFilters`

- [x] 20. Ejecutar validaciones
  - Ejecutar `pnpm lint:frontend` y corregir errores si existen
  - Ejecutar `pnpm typecheck:frontend` y corregir errores si existen
  - Ejecutar `pnpm format:frontend`
  - _Requirements: Code Quality_

## Fase 6: Component Testing

- [x] 21. Escribir component tests para DateRangeFilter
  - Test: Renderiza SegmentedControl con 4 opciones
  - Test: Click en "Hoy" actualiza preset y oculta DatePickerInput
  - Test: Click en "Esta Semana" actualiza preset y oculta DatePickerInput
  - Test: Click en "Este Mes" actualiza preset y oculta DatePickerInput
  - Test: Click en "Personalizado" muestra DatePickerInput
  - Test: DatePickerInput solo visible cuando preset es 'custom'
  - Test: Cambiar fecha personalizada mantiene preset en 'custom'
  - Usar `@testing-library/react` y `@testing-library/user-event`
  - Ejecutar `pnpm test:frontend` y verificar que pasan
  - _Requirements: 1.1, 1.5, 2.1, 2.2, 2.4_
  - **Commit:** `test(filters): add component tests for DateRangeFilter`

- [x] 22. Ejecutar validaciones
  - Ejecutar `pnpm lint:frontend` y corregir errores si existen
  - Ejecutar `pnpm typecheck:frontend` y corregir errores si existen
  - Ejecutar `pnpm format:frontend`
  - _Requirements: Code Quality_

- [x] 23. Escribir integration tests
  - Test: Seleccionar preset "Hoy" filtra appointments del día actual
  - Test: Seleccionar preset "Esta Semana" filtra appointments de la semana
  - Test: Seleccionar preset "Este Mes" filtra appointments del mes
  - Test: Seleccionar rango personalizado filtra appointments correctamente
  - Test: Cambiar preset actualiza la query de appointments
  - Test: "Limpiar filtros" resetea preset a 'custom' y limpia dateRange
  - Test: Otros filtros (status) se mantienen al cambiar preset
  - Mockear `useAppointments` con MSW
  - Ejecutar `pnpm test:frontend` y verificar que pasan
  - _Validates: Property 7, Property 8, Requirements 1.2, 1.3, 1.4, 4.1, 4.2_
  - **Commit:** `test(filters): add integration tests for date range filtering`

- [ ] 24. Ejecutar validaciones
  - Ejecutar `pnpm lint:frontend` y corregir errores si existen
  - Ejecutar `pnpm typecheck:frontend` y corregir errores si existen
  - Ejecutar `pnpm format:frontend`
  - _Requirements: Code Quality_

## Fase 7: Accessibility y Responsive

- [ ] 25. Agregar accesibilidad al DateRangeFilter
  - Agregar `aria-label="Seleccionar período de fechas"` al SegmentedControl
  - Agregar `aria-label="Rango de fechas personalizado"` al DatePickerInput
  - Verificar que navegación con teclado funciona (Tab, flechas)
  - Agregar `role="group"` al Stack contenedor
  - _Requirements: 5.2, 5.3_
  - **Commit:** `a11y(filters): add accessibility attributes to DateRangeFilter`

- [ ] 26. Ejecutar validaciones
  - Ejecutar `pnpm lint:frontend` y corregir errores si existen
  - Ejecutar `pnpm typecheck:frontend` y corregir errores si existen
  - Ejecutar `pnpm format:frontend`
  - _Requirements: Code Quality_

- [ ] 27. Verificar responsive design
  - Probar en viewport mobile (< 768px)
  - Verificar que SegmentedControl se adapta correctamente
  - Verificar que DatePickerInput mantiene minWidth o se ajusta
  - Agregar media queries si es necesario
  - _Requirements: 5.1_
  - **Commit:** `style(filters): ensure responsive design for DateRangeFilter`

- [ ] 28. Ejecutar validaciones finales
  - Ejecutar `pnpm lint:frontend` y corregir errores si existen
  - Ejecutar `pnpm typecheck:frontend` y corregir errores si existen
  - Ejecutar `pnpm format:frontend`
  - Ejecutar `pnpm test:frontend` y verificar que TODOS los tests pasan
  - _Requirements: Code Quality_

## Fase 8: Manual Testing y Verificación

- [ ] 29. Checkpoint - Verificar funcionalidad completa
  - Iniciar frontend: `pnpm dev:frontend`
  - Navegar a `/appointments`
  - Verificar que SegmentedControl se muestra con 4 opciones
  - Probar preset "Hoy": verificar que filtra citas de hoy
  - Probar preset "Esta Semana": verificar que filtra citas de la semana
  - Probar preset "Este Mes": verificar que filtra citas del mes
  - Probar preset "Personalizado": verificar que muestra DatePickerInput
  - Seleccionar rango personalizado y verificar filtrado
  - Probar "Limpiar filtros": verificar que resetea todo
  - Combinar con filtro de estado: verificar que ambos funcionan
  - Navegar fuera y regresar: verificar que filtros persisten
  - Probar en mobile: verificar responsive
  - Probar navegación con teclado: verificar accesibilidad
  - _Requirements: ALL_

## Fase 9: Git Workflow

- [ ] 30. Commit final y merge
  - Verificar que todos los tests pasan: `pnpm test:frontend`
  - Verificar que no hay errores de lint: `pnpm lint:frontend`
  - Verificar que no hay errores de tipos: `pnpm typecheck:frontend`
  - Hacer commit final si hay cambios pendientes
  - Cambiar a rama `develop`: `git checkout develop`
  - Mergear feature branch: `git merge feature/segmented-control-datepicker-frontend --no-ff`
  - Verificar que todo funciona en develop
  - Push a main remoto: `git push origin develop:main`
  - Eliminar feature branch local: `git branch -d feature/segmented-control-datepicker-frontend`
  - _Requirements: Git Workflow_

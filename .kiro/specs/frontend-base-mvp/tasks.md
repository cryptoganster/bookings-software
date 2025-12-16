# Implementation Plan - Frontend Base MVP

## Fase 1: Reorganización a Monorepo

- [x] 1. Preparar reorganización del proyecto
  - Crear rama `feature/monorepo-restructure`
  - Verificar que tests actuales pasan
  - Commit checkpoint antes de reorganizar
  - Instalar pnpm globalmente
  - _Requirements: 1.1, 1.4_

- [x] 2. Crear estructura de directorios
  - Crear `apps/backend/`, `apps/frontend/`, `packages/shared-types/`
  - Mover código backend a `apps/backend/`
  - Mover configuraciones (tsconfig, eslint, etc.) a `apps/backend/`
  - Mover archivos de entorno a `apps/backend/`
  - _Requirements: 1.1_

- [x] 3. Configurar pnpm workspace
  - Crear `pnpm-workspace.yaml` en raíz
  - Crear root `package.json` con scripts unificados
  - Actualizar `apps/backend/package.json`
  - Actualizar `.gitignore` para monorepo
  - _Requirements: 1.3_
  - **Commit:** `chore: configure pnpm workspace`

- [x] 4. Crear package de tipos compartidos
  - Crear `packages/shared-types/package.json`
  - Crear `packages/shared-types/tsconfig.json`
  - Crear `packages/shared-types/src/index.ts` con tipos iniciales
  - Build shared-types y verificar
  - _Requirements: 1.3, 8.5_
  - **Commit:** `feat: add shared-types package`

- [x] 5. Instalar dependencias y verificar
  - Ejecutar `pnpm install` en raíz
  - Verificar que backend compila
  - Verificar que tests de backend pasan
  - Verificar estructura de node_modules
  - _Requirements: 1.4_
  - **Commit:** `chore: install dependencies with pnpm`

## Fase 2: Setup del Frontend

- [x] 6. Inicializar proyecto Vite + React
  - Ejecutar `pnpm create vite` en `apps/frontend/`
  - Seleccionar template `react-ts`
  - Actualizar `apps/frontend/package.json` con dependencias del PRD
  - Instalar dependencias del frontend
  - _Requirements: 1.2_
  - **Commit:** `feat: initialize frontend with Vite + React`

- [x] 7. Configurar Vite y TypeScript
  - Crear `apps/frontend/vite.config.ts` con path aliases
  - Configurar proxy `/api` → `http://localhost:3000`
  - Crear `apps/frontend/tsconfig.json` con paths
  - Crear `apps/frontend/tsconfig.node.json`
  - _Requirements: 8.1_
  - **Commit:** `config: setup Vite and TypeScript`

- [x] 8. Crear estructura FSD básica
  - Crear directorios: `app/`, `pages/`, `widgets/`, `features/`, `entities/`, `shared/`
  - Crear subdirectorios en `app/`: `providers/`, `router/`, `store/`, `layouts/`
  - Crear subdirectorios en `shared/`: `api/`, `config/`, `lib/`, `ui/`, `hooks/`
  - Crear archivo `.gitkeep` en directorios vacíos
  - _Requirements: 1.2_
  - **Commit:** `chore: create FSD directory structure`

- [x] 9. Configurar providers globales
  - Crear `app/providers/QueryProvider.tsx` con TanStack Query
  - Crear `app/providers/MantineProvider.tsx` con tema
  - Crear `app/providers/index.tsx` que compone todos los providers
  - Actualizar `app/index.tsx` para usar providers
  - _Requirements: 8.1_
  - **Commit:** `feat: setup global providers (Query, Mantine)`

- [x] 10. Checkpoint - Verificar setup básico
  - Ejecutar `pnpm dev` y verificar que backend y frontend inician
  - Verificar que frontend carga en `http://localhost:5173`
  - Verificar que backend responde en `http://localhost:3000`
  - Verificar hot reload en frontend
  - _Requirements: 1.4_

## Fase 3: Shared Layer (API y Utilidades)

- [x] 11. Configurar API client
  - Crear `shared/api/client.ts` con axios instance
  - Configurar baseURL desde env variable
  - Agregar request interceptor para token
  - Agregar response interceptor para errores
  - _Requirements: 8.1, 8.2_
  - **Commit:** `feat: setup axios API client with interceptors`

- [x] 12. Crear endpoints y tipos API
  - Crear `shared/api/endpoints.ts` con constantes de URLs
  - Crear `shared/api/types.ts` con tipos de respuesta
  - Crear `shared/config/env.ts` para variables de entorno
  - Crear `shared/config/constants.ts` para constantes
  - _Requirements: 8.1_
  - **Commit:** `feat: add API endpoints and types`

- [x] 13. Crear utilidades de fecha
  - Crear `shared/lib/date/formatters.ts` con formatDate, formatTime
  - Crear `shared/lib/date/timezone.ts` con utilidades de zona horaria
  - Usar date-fns para implementación
  - _Requirements: 8.1_
  - **Commit:** `feat: add date formatting utilities`

- [x] 14. Crear componentes UI compartidos
  - Crear `shared/ui/LoadingOverlay/LoadingOverlay.tsx`
  - Crear `shared/ui/EmptyState/EmptyState.tsx`
  - Crear `shared/ui/ErrorBoundary/ErrorBoundary.tsx`
  - Crear `shared/ui/PageHeader/PageHeader.tsx`
  - _Requirements: 7.1, 7.2_
  - **Commit:** `feat: add shared UI components`

- [x] 15. Crear hooks compartidos
  - Crear `shared/hooks/useDebounce.ts`
  - Crear `shared/hooks/useDisclosure.ts` para modals
  - Crear `shared/hooks/useMediaQuery.ts`
  - _Requirements: 8.1_
  - **Commit:** `feat: add shared hooks`

## Fase 4: Autenticación

- [x] 16. Crear auth store con Zustand
  - Crear `app/store/auth.store.ts`
  - Implementar state: user, token, isAuthenticated
  - Implementar actions: login, logout
  - Configurar persist middleware para localStorage
  - _Requirements: 2.2, 2.3_
  - **Commit:** `feat: create auth store with Zustand`

- [x] 17. Crear entity de user
  - Crear `entities/user/model/types.ts` con User, LoginDto
  - Crear `entities/user/model/queries.ts` con query keys
  - Importar tipos desde `@packages/shared-types`
  - _Requirements: 8.5_
  - **Commit:** `feat: add user entity types`

- [x] 18. Implementar feature de login
  - Crear `features/auth/login/api/loginApi.ts`
  - Crear `features/auth/login/model/useLogin.ts` (mutation hook)
  - Crear `features/auth/login/model/schema.ts` con validación Zod
  - Crear `features/auth/login/ui/LoginForm.tsx`
  - _Requirements: 2.2, 8.3_
  - **Commit:** `feat: implement login feature`

- [x] 19. Crear página de login
  - Crear `pages/LoginPage/ui/LoginPage.tsx`
  - Integrar LoginForm
  - Manejar redirección después de login exitoso
  - Manejar errores de autenticación
  - _Requirements: 2.2_
  - **Commit:** `feat: create login page`

- [x] 20. Implementar feature de logout
  - Crear `features/auth/logout/ui/LogoutButton.tsx`
  - Integrar con auth store
  - Limpiar token y redirigir a login
  - _Requirements: 2.5_
  - **Commit:** `feat: implement logout feature`

- [x] 21. Configurar router y rutas protegidas
  - Crear `app/router/routes.tsx` con definición de rutas
  - Crear `app/router/ProtectedRoute.tsx` con guard de autenticación
  - Configurar ruta `/login` (pública)
  - Configurar ruta `/` (protegida)
  - _Requirements: 2.1, 2.4_
  - **Commit:** `feat: setup router with protected routes`

- [ ] 22. Mejorar diseño visual del LoginForm
  - Actualizar `features/auth/login/ui/LoginForm.tsx` con diseño profesional
  - Usar Paper con withBorder, shadow="md", padding=30, radius="md"
  - Agregar Title centrado con order={2}
  - Agregar Text descriptivo con color dimmed
  - Configurar inputs con size="md" y radius="md"
  - Asegurar botón fullWidth con mt="md"
  - Mantener toda la funcionalidad existente (validación, loading, errores)
  - _Requirements: 2.2, 2.6_
  - **Commit:** `style: improve LoginForm visual design with Mantine components`

- [ ] 22.1 Checkpoint - Verificar autenticación
  - Probar login con credenciales válidas
  - Verificar redirección a dashboard
  - Verificar que token se guarda en localStorage
  - Probar logout y verificar limpieza
  - Probar acceso a ruta protegida sin auth
  - Verificar que el LoginForm se ve profesional y centrado
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

## Fase 5: Layout y Navegación

- [ ] 23.1 Crear layout principal
  - Crear `app/layouts/DashboardLayout.tsx` con AppShell de Mantine
  - Agregar Navbar con links de navegación
  - Agregar Header con logo y user menu
  - Integrar LogoutButton en user menu
  - _Requirements: 6.1, 6.2_
  - **Commit:** `feat: create dashboard layout with navigation`

- [ ] 23.2 Configurar navegación
  - Agregar NavLinks para Dashboard, Appointments
  - Implementar highlight de item activo
  - Hacer layout responsive
  - Agregar iconos con @tabler/icons-react
  - _Requirements: 6.2, 6.3, 6.5_
  - **Commit:** `feat: implement navigation with active states`

- [ ] 23.3 Checkpoint - Verificar navegación
  - Probar navegación entre páginas
  - Verificar highlight de item activo
  - Probar en mobile y desktop
  - Verificar que logout funciona desde layout
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

## Fase 6: Entity de Appointment

- [ ] 24. Crear tipos de appointment
  - Crear `entities/appointment/model/types.ts`
  - Importar AppointmentReadModel desde shared-types
  - Crear tipos de filtros: AppointmentFilters
  - _Requirements: 8.5_
  - **Commit:** `feat: add appointment entity types`

- [ ] 25. Crear query keys y hooks
  - Crear `entities/appointment/model/queries.ts` con appointmentKeys
  - Crear `useAppointments()` hook para lista
  - Crear `useAppointment(id)` hook para detalle
  - Crear `useUpcomingAppointments()` hook
  - _Requirements: 8.2_
  - **Commit:** `feat: add appointment query hooks`

- [ ] 26. Crear API de appointments
  - Crear `entities/appointment/model/api.ts`
  - Implementar `appointmentsApi.getAll()`
  - Implementar `appointmentsApi.getById()`
  - Implementar `appointmentsApi.cancel()`
  - _Requirements: 8.2, 8.3_
  - **Commit:** `feat: implement appointments API service`

- [ ] 27. Crear componentes de presentación
  - Crear `entities/appointment/ui/AppointmentCard.tsx`
  - Crear `entities/appointment/ui/AppointmentBadge.tsx` para status
  - Crear `entities/appointment/lib/formatAppointment.ts`
  - Crear `entities/appointment/lib/getStatusColor.ts`
  - _Requirements: 4.2_
  - **Commit:** `feat: add appointment presentation components`

## Fase 7: Dashboard

- [ ] 28. Crear widget de stats cards
  - Crear `widgets/StatsCards/model/useStats.ts` (query hook)
  - Crear `widgets/StatsCards/ui/StatCard.tsx`
  - Crear `widgets/StatsCards/ui/StatsCards.tsx`
  - Mostrar: Citas hoy, Citas semana
  - _Requirements: 3.1, 3.2_
  - **Commit:** `feat: create stats cards widget`

- [ ] 29. Crear widget de upcoming appointments
  - Crear `widgets/UpcomingAppointments/model/useUpcomingAppointments.ts`
  - Crear `widgets/UpcomingAppointments/ui/UpcomingAppointments.tsx`
  - Mostrar lista de próximas 5 citas
  - Agregar botón "Ver todas"
  - _Requirements: 3.4, 3.5_
  - **Commit:** `feat: create upcoming appointments widget`

- [ ] 30. Crear página de dashboard
  - Crear `pages/DashboardPage/ui/DashboardPage.tsx`
  - Componer StatsCards y UpcomingAppointments
  - Usar Grid de Mantine para layout
  - Manejar loading y error states
  - _Requirements: 3.1, 3.2, 3.3_
  - **Commit:** `feat: create dashboard page`

- [ ] 31. Checkpoint - Verificar dashboard
  - Verificar que stats cards cargan datos
  - Verificar que upcoming appointments muestra citas
  - Verificar loading states
  - Verificar error handling
  - Verificar empty state cuando no hay citas
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

## Fase 8: Gestión de Citas

- [ ] 32. Crear feature de filtros
  - Crear `features/appointment/filter/model/useAppointmentFilters.ts` (Zustand)
  - Implementar state: status, dateRange, offeringId
  - Implementar actions: setStatus, setDateRange, reset
  - _Requirements: 5.1, 5.2, 5.3, 5.4_
  - **Commit:** `feat: create appointment filters store`

- [ ] 33. Crear UI de filtros
  - Crear `features/appointment/filter/ui/AppointmentFilters.tsx`
  - Agregar Select para status
  - Agregar DateRangePicker para fechas
  - Agregar botón "Limpiar filtros"
  - _Requirements: 5.1, 5.2, 5.3_
  - **Commit:** `feat: create appointment filters UI`

- [ ] 34. Crear feature de cancelación
  - Crear `features/appointment/cancel/model/useCancelAppointment.ts`
  - Implementar optimistic update
  - Implementar rollback en error
  - Implementar invalidación de queries
  - _Requirements: 4.3, 4.4, 9.1, 9.2, 9.3_
  - **Commit:** `feat: implement cancel appointment with optimistic update`

- [ ] 35. Crear UI de cancelación
  - Crear `features/appointment/cancel/ui/CancelAppointmentButton.tsx`
  - Agregar modal de confirmación
  - Mostrar loading state durante cancelación
  - Mostrar notificación de éxito/error
  - _Requirements: 4.3, 4.4_
  - **Commit:** `feat: create cancel appointment button`

- [ ] 36. Crear página de appointments
  - Crear `pages/AppointmentsPage/ui/AppointmentsPage.tsx`
  - Crear `pages/AppointmentsPage/ui/AppointmentsList.tsx`
  - Integrar AppointmentFilters
  - Integrar CancelAppointmentButton
  - _Requirements: 4.1, 4.2_
  - **Commit:** `feat: create appointments page`

- [ ] 37. Checkpoint - Verificar gestión de citas
  - Verificar que tabla de citas carga
  - Probar filtros de estado y fecha
  - Probar cancelación de cita
  - Verificar optimistic update
  - Verificar rollback en error
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 5.1, 5.2, 5.3, 5.4, 5.5_

## Fase 9: Testing

- [ ] 38. Configurar testing
  - Configurar Vitest en `apps/frontend/vitest.config.ts`
  - Configurar React Testing Library
  - Configurar MSW para mocking de API
  - Crear `mocks/handlers.ts` con handlers de API
  - _Requirements: 10.1, 10.2, 10.3_
  - **Commit:** `test: setup Vitest, RTL, and MSW`

- [ ] 39. Tests de LoginForm
  - Test: renderiza correctamente
  - Test: valida campos requeridos
  - Test: muestra errores de validación
  - Test: llama a onSubmit con datos correctos
  - _Requirements: 10.2_
  - **Commit:** `test: add LoginForm tests`

- [ ] 40. Tests de useLogin hook
  - Test: success case - actualiza auth store
  - Test: error case - muestra notificación
  - Test: loading state
  - _Requirements: 10.2_
  - **Commit:** `test: add useLogin hook tests`

- [ ] 41. Tests de useCancelAppointment
  - Test: optimistic update funciona
  - Test: rollback en error
  - Test: invalidación de queries en éxito
  - _Requirements: 10.2_
  - **Commit:** `test: add useCancelAppointment tests`

- [ ] 42. Tests de AppointmentFilters
  - Test: cambio de filtros actualiza store
  - Test: reset limpia todos los filtros
  - Test: múltiples filtros se combinan
  - _Requirements: 10.2_
  - **Commit:** `test: add AppointmentFilters tests`

- [ ] 43. Tests de utilidades
  - Test: formatAppointment formatea correctamente
  - Test: getStatusColor retorna colores correctos
  - Test: date formatters funcionan
  - _Requirements: 10.2_
  - **Commit:** `test: add utility function tests`

- [ ] 44. Checkpoint final - Ejecutar todos los tests
  - Ejecutar `pnpm test:frontend`
  - Verificar que todos los tests pasan
  - Generar reporte de cobertura
  - Verificar cobertura > 70%
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

## Fase 10: Documentación y Limpieza

- [ ] 45. Actualizar documentación
  - Actualizar README.md principal
  - Crear README.md para backend
  - Crear README.md para frontend
  - Documentar scripts disponibles
  - _Requirements: 1.5_
  - **Commit:** `docs: update README files`

- [ ] 46. Limpieza final
  - Eliminar archivos temporales
  - Eliminar código comentado
  - Verificar .gitignore
  - Ejecutar linter y formatter
  - _Requirements: 1.5_
  - **Commit:** `chore: final cleanup`

- [ ] 47. Verificación completa
  - Ejecutar `pnpm dev` y verificar ambos servidores
  - Probar flujo completo: login → dashboard → appointments → cancel → logout
  - Verificar en diferentes navegadores
  - Verificar responsive en mobile
  - _Requirements: ALL_

- [ ] 48. Merge y deploy
  - Crear Pull Request
  - Solicitar code review
  - Mergear a main
  - Actualizar documentación de deployment
  - _Requirements: ALL_

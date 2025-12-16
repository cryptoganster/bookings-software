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
  - Crear `app/providers/MantineProvider.tsx` con tema personalizado brandGreen
  - Definir paleta brandGreen con 10 shades usando colores de la imagen (#086b38, #107c42, #138147, #19874e)
  - Configurar primaryColor="brandGreen" y primaryShade={ light: 6, dark: 7 }
  - Crear `app/providers/index.tsx` que compone todos los providers
  - Actualizar `app/index.tsx` para usar providers
  - _Requirements: 8.1, 2.11_
  - **Commit:** `feat: setup global providers (Query, Mantine with brandGreen theme)`

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

- [x] 16.1 Fix: Restaurar estado de autenticación al recargar página
  - Modificar `app/store/auth.store.ts` para derivar `isAuthenticated` del token
  - Cambiar `isAuthenticated` de campo de estado a computed getter
  - Implementar: `get isAuthenticated() { return !!this.token; }`
  - Eliminar `isAuthenticated` del estado inicial y de la acción `login`
  - Mantener solo `token` y `user` en `partialize` (ya no es necesario persistir `isAuthenticated`)
  - Verificar que `ProtectedRoute` funciona correctamente con el getter
  - Probar manualmente: login → refresh → debe permanecer autenticado
  - _Validates: Property 1 (Authentication token persistence), Requirements 2.2, 2.3_
  - **Commit:** `fix: derive isAuthenticated from token for persistence`

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

- [x] 22. Mejorar diseño visual del LoginPage con layout de dos columnas
  - Mover imagen `login-background.png` a `apps/frontend/src/assets/`
  - Actualizar `pages/LoginPage/ui/LoginPage.tsx` con layout de dos columnas
  - Columna izquierda (50%): Formulario de login centrado verticalmente
  - Columna derecha (50%): Imagen de fondo que cubre toda la altura
  - Usar Grid de Mantine para el layout responsive
  - En mobile: ocultar imagen, mostrar solo formulario
  - Actualizar `features/auth/login/ui/LoginForm.tsx` con diseño profesional
  - Usar Paper con withBorder, shadow="xl", padding={30}, radius="xl"
  - Agregar Title centrado con order={2}
  - Agregar Text descriptivo con color dimmed
  - Configurar TextInput con size="md" y radius="xl"
  - Configurar PasswordInput con size="md" y radius="xl"
  - Asegurar botón fullWidth con mt="md", radius="xl" y color="brandGreen" (paleta verde personalizada)
  - Mantener toda la funcionalidad existente (validación, loading, errores)
  - _Requirements: 2.6, 2.7, 2.8, 2.9, 2.10, 2.11, 2.12, 2.13_
  - **Commit:** `style: improve LoginPage with two-column layout and professional design`

- [x] 22.1 Checkpoint - Verificar autenticación y diseño
  - Probar login con credenciales válidas
  - Verificar redirección a dashboard
  - Verificar que token se guarda en localStorage
  - Probar logout y verificar limpieza
  - Probar acceso a ruta protegida sin auth
  - Verificar layout de dos columnas (formulario izquierda, imagen derecha)
  - Verificar que Paper tiene shadow="xl", padding={30}, radius="xl"
  - Verificar que inputs tienen size="md" y radius="xl"
  - Verificar que botón tiene color="brandGreen" (paleta verde personalizada)
  - Verificar que el tema tiene primaryColor="brandGreen" configurado
  - Verificar responsive en mobile (solo formulario visible)
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10, 2.11, 2.12, 2.13_

## Fase 5: Layout y Navegación

- [x] 23. Crear layout principal adaptando template dashvista
  - Copiar estructura de `templates-mantine-ui/dashvista/App.tsx` a `app/layouts/DashboardLayout.tsx`
  - Adaptar a React Router DOM (eliminar dependencias de Remix)
  - Configurar AppShell: header={{ height: 60 }}, navbar={{ width: 280, breakpoint: "md" }}
  - Usar useDisclosure de @mantine/hooks para controlar Navbar mobile
  - Aplicar radius="xl" a todos los componentes interactivos
  - Preparar estructura para Header y Navbar components
  - _Requirements: 6.1, 6.2_
  - **Commit:** `feat: create DashboardLayout based on dashvista template`

- [x] 23.1 Implementar Header component adaptando template
  - Copiar estructura de `templates-mantine-ui/dashvista/Header.tsx` a `app/layouts/components/Header.tsx`
  - Copiar estilos de `templates-mantine-ui/dashvista/Header.module.css` a `app/layouts/components/Header.module.css`
  - Reemplazar logo del template con nombre del negocio (texto simple por ahora)
  - Mantener Burger menu para mobile (hiddenFrom="md")
  - Eliminar SearchInput, ActionIcons de notificaciones y settings (fuera del MVP)
  - Mantener Avatar con Popover para user menu
  - Integrar LogoutButton existente en el Popover
  - Adaptar estilos: usar brandGreen en lugar de colores del template
  - Aplicar radius="xl" a ActionIcons y Popover
  - _Requirements: 6.2, 6.6, 6.7, 6.8_
  - **Commit:** `feat: create Header component adapted from dashvista`

- [x] 23.2 Implementar Navbar component adaptando template
  - Copiar estructura de `templates-mantine-ui/dashvista/Navbar.tsx` a `app/layouts/components/Navbar.tsx`
  - Copiar estilos de `templates-mantine-ui/dashvista/Navbar.module.css` a `app/layouts/components/Navbar.module.css`
  - Reemplazar título del template con "Bienvenido al Sistema de Reservas"
  - Eliminar componente UsersChat (fuera del MVP)
  - Crear array de navlinks: Dashboard (IconHome2), Appointments (IconCalendar)
  - Reemplazar iconos de iconsax-react con @tabler/icons-react
  - Cambiar de Link de Remix a Link de react-router-dom
  - Implementar highlight con data-active usando useLocation de react-router-dom
  - Adaptar estilos CSS: navlink activo usa brandGreen.6, hover usa brandGreen.1
  - Mantener radius="xl" en navlinks
  - Mantener ScrollArea para navegación responsive
  - Mantener transición suave: transition: all 0.2s cubic-bezier(0.075, 0.82, 0.165, 1)
  - _Requirements: 6.3, 6.4, 6.5, 6.6, 6.7, 6.10, 6.11, 6.12_
  - **Commit:** `feat: create Navbar component adapted from dashvista`

- [x] 23.3 Adaptar estilos CSS del template
  - Copiar `templates-mantine-ui/dashvista/App.module.css` a `app/layouts/DashboardLayout.module.css`
  - Eliminar estilos específicos del template (font-family Fredoka, variables custom)
  - Mantener estilos de navbar, header, main
  - Adaptar background colors para usar paleta de Mantine
  - Eliminar pseudo-elemento ::before del main (decorativo del template)
  - Actualizar Header.module.css: adaptar actionControl para usar brandGreen
  - Actualizar Navbar.module.css: navlink activo con brandGreen.6, hover con brandGreen.1
  - Asegurar que todos los radius usan "xl"
  - _Requirements: 6.5, 6.6, 6.7, 6.12_
  - **Commit:** `style: adapt dashvista CSS with brandGreen palette`

- [x] 23.4 Integrar layout en router
  - Actualizar `app/router/routes.tsx` para usar DashboardLayout
  - Envolver rutas protegidas con DashboardLayout usando Outlet
  - Crear página temporal `pages/DashboardPage/ui/DashboardPage.tsx` con mensaje "Dashboard - Coming Soon"
  - Crear página temporal `pages/AppointmentsPage/ui/AppointmentsPage.tsx` con mensaje "Appointments - Coming Soon"
  - Configurar rutas: "/" → DashboardPage, "/appointments" → AppointmentsPage
  - Verificar que navegación funciona entre Login y Dashboard
  - _Requirements: 6.1, 6.4_
  - **Commit:** `feat: integrate DashboardLayout in router with temp pages`

- [x] 23.5 Checkpoint - Verificar layout y navegación
  - Probar login y redirección a dashboard
  - Verificar que Header muestra correctamente con nombre del negocio y Burger menu
  - Verificar que Avatar en Header abre Popover con LogoutButton
  - Verificar que Navbar muestra título de bienvenida y links de navegación
  - Probar navegación: click en Dashboard y Appointments
  - Verificar highlight de item activo (brandGreen.6) al navegar
  - Verificar hover states (brandGreen.1) en navlinks
  - Probar logout desde Popover en Header
  - Verificar responsive en mobile: Burger menu funciona, Navbar se colapsa
  - Verificar responsive en desktop: Navbar permanentemente visible
  - Verificar que todos los elementos usan radius="xl" (ActionIcons, Popover, navlinks)
  - Verificar transiciones suaves en navlinks
  - Verificar que estilos adaptados del template se ven correctamente
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9, 6.10, 6.11, 6.12_

## Fase 6: Entity de Appointment

- [x] 24. Crear tipos de appointment
  - Crear `entities/appointment/model/types.ts`
  - Importar AppointmentReadModel desde shared-types
  - Crear tipos de filtros: AppointmentFilters
  - _Requirements: 8.5_
  - **Commit:** `feat: add appointment entity types`

- [x] 25. Crear query keys y hooks
  - Crear `entities/appointment/model/queries.ts` con appointmentKeys
  - Crear `useAppointments()` hook para lista
  - Crear `useAppointment(id)` hook para detalle
  - Crear `useUpcomingAppointments()` hook
  - _Requirements: 8.2_
  - **Commit:** `feat: add appointment query hooks`

- [x] 26. Crear API de appointments
  - Crear `entities/appointment/model/api.ts`
  - Implementar `appointmentsApi.getAll()`
  - Implementar `appointmentsApi.getById()`
  - Implementar `appointmentsApi.cancel()`
  - _Requirements: 8.2, 8.3_
  - **Commit:** `feat: implement appointments API service`

- [x] 27. Crear componentes de presentación
  - Crear `entities/appointment/ui/AppointmentCard.tsx`
  - Crear `entities/appointment/ui/AppointmentBadge.tsx` para status
  - Crear `entities/appointment/lib/formatAppointment.ts`
  - Crear `entities/appointment/lib/getStatusColor.ts`
  - _Requirements: 4.2_
  - **Commit:** `feat: add appointment presentation components`

## Fase 7: Dashboard

- [x] 28. Crear widget de stats cards
  - Crear `widgets/StatsCards/model/useStats.ts` (query hook)
  - Crear `widgets/StatsCards/ui/StatCard.tsx`
  - Crear `widgets/StatsCards/ui/StatsCards.tsx`
  - Mostrar: Citas hoy, Citas semana
  - _Requirements: 3.1, 3.2_
  - **Commit:** `feat: create stats cards widget`

- [x] 29. Crear widget de upcoming appointments
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

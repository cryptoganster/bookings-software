# Requirements Document - Frontend Base MVP

## Introduction

Este documento define los requisitos para el MVP del frontend del Sistema de Reservas Multi-Tenant. El objetivo es crear un panel de administración web moderno que permita a los dueños de negocios gestionar sus reservaciones de WhatsApp de manera intuitiva.

**Alcance del MVP:**
- Reorganización del proyecto a monorepo (apps/backend + apps/frontend)
- Implementación de páginas principales con Feature-Sliced Design
- Integración con APIs existentes del backend
- Autenticación y navegación protegida
- Dashboard con métricas básicas
- Gestión de citas (visualización y cancelación)

**Fuera del alcance del MVP:**
- Gestión de servicios (offerings)
- Gestión de horarios (schedules)
- Respuesta a consultas de clientes
- Configuración de negocio
- Notificaciones en tiempo real

## Glossary

- **FSD (Feature-Sliced Design)**: Arquitectura de frontend basada en capas (app, pages, widgets, features, entities, shared)
- **Monorepo**: Repositorio único que contiene múltiples aplicaciones (backend y frontend)
- **TanStack Query**: Librería para gestión de estado del servidor (antes React Query)
- **Zustand**: Librería minimalista para gestión de estado UI
- **Mantine**: Framework de componentes UI para React
- **Workspace**: Configuración de pnpm para gestionar múltiples packages
- **Shared Types**: Package compartido con tipos TypeScript entre backend y frontend
- **Protected Route**: Ruta que requiere autenticación para acceder
- **Optimistic Update**: Actualización de UI antes de confirmar con servidor

## Requirements

### Requirement 1: Reorganización a Monorepo

**User Story:** Como desarrollador, quiero reorganizar el proyecto en una estructura de monorepo, para poder gestionar backend y frontend de manera unificada con código compartido.

#### Acceptance Criteria

1. WHEN se ejecuta la reorganización THEN el sistema SHALL crear la estructura `apps/backend/` con todo el código backend existente
2. WHEN se ejecuta la reorganización THEN el sistema SHALL crear la estructura `apps/frontend/` para el nuevo frontend
3. WHEN se ejecuta la reorganización THEN el sistema SHALL crear `packages/shared-types/` con tipos compartidos
4. WHEN se configura pnpm workspaces THEN el sistema SHALL permitir ejecutar `pnpm dev` para iniciar backend y frontend simultáneamente
5. WHEN se instalan dependencias THEN el sistema SHALL usar pnpm para gestionar el workspace correctamente

### Requirement 2: Autenticación y Navegación

**User Story:** Como dueño de negocio, quiero poder iniciar sesión en el panel web, para acceder a la gestión de mis reservaciones de manera segura.

#### Acceptance Criteria

1. WHEN un usuario no autenticado intenta acceder a rutas protegidas THEN el sistema SHALL redirigir a la página de login
2. WHEN un usuario ingresa credenciales válidas THEN el sistema SHALL almacenar el token JWT y redirigir al dashboard
3. WHEN un usuario está autenticado THEN el sistema SHALL incluir el token en todas las peticiones API
4. WHEN el token expira o es inválido THEN el sistema SHALL cerrar sesión automáticamente y redirigir a login
5. WHEN un usuario cierra sesión THEN el sistema SHALL limpiar el token y redirigir a login
6. WHEN se muestra el formulario de login THEN el sistema SHALL presentar una interfaz profesional con Paper de Mantine usando shadow="xl", padding={30}, radius="xl"
7. WHEN se muestra la página de login THEN el sistema SHALL usar un layout de dos columnas con el formulario a la izquierda y una imagen de fondo a la derecha
8. WHEN se renderizan los inputs del formulario THEN el sistema SHALL usar size="md" y radius="xl" para todos los campos
9. WHEN se usa PasswordInput THEN el sistema SHALL aplicar size="md" y radius="xl" consistente con los demás inputs
10. WHEN se carga la imagen de fondo THEN el sistema SHALL importarla desde `src/assets/login-background.png`
11. WHEN se configura el tema de Mantine THEN el sistema SHALL definir una paleta personalizada "brandGreen" con 10 shades basados en los colores de la imagen
12. WHEN se renderiza el botón de login THEN el sistema SHALL usar color="brandGreen" para aplicar la paleta verde personalizada
13. WHEN se configura el tema THEN el sistema SHALL establecer primaryColor="brandGreen" para usar la paleta verde como color principal de la aplicación

### Requirement 3: Dashboard Principal

**User Story:** Como dueño de negocio, quiero ver un dashboard con métricas de mis citas, para tener una visión general del estado de mi negocio.

#### Acceptance Criteria

1. WHEN un usuario accede al dashboard THEN el sistema SHALL mostrar cards con métricas básicas (citas hoy, esta semana)
2. WHEN se cargan las métricas THEN el sistema SHALL mostrar un loading state mientras obtiene los datos
3. WHEN hay un error al cargar métricas THEN el sistema SHALL mostrar un mensaje de error amigable
4. WHEN se cargan las citas próximas THEN el sistema SHALL mostrar una lista de las próximas 5 citas
5. WHEN no hay citas próximas THEN el sistema SHALL mostrar un estado vacío con mensaje apropiado

### Requirement 4: Gestión de Citas

**User Story:** Como dueño de negocio, quiero ver y gestionar las citas de mis clientes, para mantener control sobre las reservaciones.

#### Acceptance Criteria

1. WHEN un usuario accede a la página de citas THEN el sistema SHALL mostrar una tabla con todas las citas
2. WHEN se carga la lista de citas THEN el sistema SHALL incluir información del cliente, servicio, fecha/hora y estado
3. WHEN un usuario cancela una cita THEN el sistema SHALL solicitar confirmación antes de proceder
4. WHEN se confirma la cancelación THEN el sistema SHALL actualizar la UI optimísticamente y luego confirmar con el servidor
5. WHEN hay un error en la cancelación THEN el sistema SHALL revertir el cambio optimista y mostrar mensaje de error

### Requirement 5: Filtrado de Citas

**User Story:** Como dueño de negocio, quiero filtrar las citas por estado y fecha, para encontrar rápidamente las citas que necesito revisar.

#### Acceptance Criteria

1. WHEN un usuario selecciona un filtro de estado THEN el sistema SHALL actualizar la lista mostrando solo citas con ese estado
2. WHEN un usuario selecciona un rango de fechas THEN el sistema SHALL actualizar la lista mostrando solo citas en ese rango
3. WHEN un usuario limpia los filtros THEN el sistema SHALL mostrar todas las citas nuevamente
4. WHEN se aplican filtros THEN el sistema SHALL mantener los filtros al navegar y regresar a la página
5. WHEN se aplican múltiples filtros THEN el sistema SHALL combinarlos con lógica AND

### Requirement 6: Layout y Navegación

**User Story:** Como dueño de negocio, quiero navegar fácilmente entre las diferentes secciones del panel, para acceder rápidamente a la información que necesito.

#### Acceptance Criteria

1. WHEN un usuario está autenticado THEN el sistema SHALL mostrar un layout con sidebar de navegación
2. WHEN un usuario hace click en un item del menú THEN el sistema SHALL navegar a la página correspondiente
3. WHEN un usuario está en una página THEN el sistema SHALL resaltar el item del menú activo
4. WHEN un usuario hace click en logout THEN el sistema SHALL cerrar sesión y redirigir a login
5. WHEN el layout se renderiza THEN el sistema SHALL ser responsive y funcionar en mobile y desktop

### Requirement 7: Manejo de Errores Global

**User Story:** Como usuario del sistema, quiero recibir mensajes claros cuando algo sale mal, para entender qué sucedió y qué puedo hacer.

#### Acceptance Criteria

1. WHEN ocurre un error de red THEN el sistema SHALL mostrar una notificación con mensaje descriptivo
2. WHEN ocurre un error 401 (no autorizado) THEN el sistema SHALL cerrar sesión automáticamente
3. WHEN ocurre un error 404 THEN el sistema SHALL mostrar mensaje "Recurso no encontrado"
4. WHEN ocurre un error 500 THEN el sistema SHALL mostrar mensaje "Error del servidor, intenta más tarde"
5. WHEN se muestra una notificación de error THEN el sistema SHALL auto-ocultarla después de 5 segundos

### Requirement 8: Integración con APIs Existentes

**User Story:** Como desarrollador, quiero que el frontend se integre correctamente con las APIs del backend existente, para aprovechar la funcionalidad ya implementada.

#### Acceptance Criteria

1. WHEN se realiza una petición API THEN el sistema SHALL usar axios con configuración centralizada
2. WHEN se obtienen citas THEN el sistema SHALL usar el endpoint `GET /api/appointments`
3. WHEN se cancela una cita THEN el sistema SHALL usar el endpoint `PUT /api/appointments/:id/cancel`
4. WHEN se hace login THEN el sistema SHALL usar el endpoint `POST /api/auth/login`
5. WHEN se usan tipos compartidos THEN el sistema SHALL importarlos desde `@packages/shared-types`

### Requirement 9: Optimistic Updates

**User Story:** Como usuario del sistema, quiero que la interfaz responda inmediatamente a mis acciones, para tener una experiencia fluida sin esperas innecesarias.

#### Acceptance Criteria

1. WHEN un usuario cancela una cita THEN el sistema SHALL actualizar la UI inmediatamente antes de confirmar con el servidor
2. WHEN la operación en el servidor falla THEN el sistema SHALL revertir el cambio optimista
3. WHEN la operación en el servidor tiene éxito THEN el sistema SHALL invalidar y refrescar los datos relacionados
4. WHEN se realiza un optimistic update THEN el sistema SHALL mantener un snapshot del estado anterior
5. WHEN se revierte un optimistic update THEN el sistema SHALL restaurar el estado exacto anterior

### Requirement 10: Testing del Frontend

**User Story:** Como desarrollador, quiero tener tests automatizados del frontend, para asegurar que los componentes funcionan correctamente y prevenir regresiones.

#### Acceptance Criteria

1. WHEN se ejecutan los tests THEN el sistema SHALL usar Vitest como test runner
2. WHEN se testean componentes THEN el sistema SHALL usar React Testing Library
3. WHEN se testean peticiones API THEN el sistema SHALL usar MSW (Mock Service Worker) para mockear
4. WHEN se ejecuta `pnpm test:frontend` THEN el sistema SHALL ejecutar todos los tests del frontend
5. WHEN se ejecuta `pnpm test:frontend:coverage` THEN el sistema SHALL generar reporte de cobertura

# Frontend Base MVP - Spec Overview

## Resumen Ejecutivo

Este spec define la implementación del MVP del frontend para el Sistema de Reservas Multi-Tenant, incluyendo la reorganización del proyecto a monorepo y la creación de un panel de administración web moderno.

## Objetivos

1. **Reorganizar** el proyecto en monorepo con pnpm workspaces
2. **Implementar** frontend React con Feature-Sliced Design
3. **Integrar** con APIs existentes del backend
4. **Proporcionar** experiencia de usuario fluida con optimistic updates
5. **Asegurar** type safety end-to-end con TypeScript

## Alcance del MVP

### ✅ Incluido

- Reorganización a monorepo (apps/backend + apps/frontend + packages/shared-types)
- Autenticación con JWT
- Dashboard con métricas básicas
- Gestión de citas (visualización, filtrado, cancelación)
- Layout con navegación
- Testing con Vitest + RTL + MSW

### ❌ Fuera del Alcance

- Gestión de servicios (offerings)
- Gestión de horarios (schedules)
- Respuesta a consultas de clientes
- Configuración de negocio
- Notificaciones en tiempo real

## Stack Tecnológico

### Frontend

- **Framework:** React 18 + Vite 5
- **Lenguaje:** TypeScript 5
- **UI:** Mantine 7
- **State Management:** TanStack Query 5 + Zustand 4
- **Forms:** React Hook Form + Zod
- **Routing:** React Router 6
- **Testing:** Vitest + React Testing Library + MSW

### Monorepo

- **Package Manager:** pnpm 8
- **Workspace:** pnpm workspaces
- **Shared Code:** @packages/shared-types

## Estructura del Proyecto

```
bookings-system/
├── apps/
│   ├── backend/          # NestJS API (código existente movido)
│   └── frontend/         # React + Vite (nuevo)
│       └── src/
│           ├── app/      # Providers, Router, Store
│           ├── pages/    # DashboardPage, AppointmentsPage, LoginPage
│           ├── widgets/  # StatsCards, UpcomingAppointments
│           ├── features/ # Login, CancelAppointment, FilterAppointments
│           ├── entities/ # Appointment, User
│           └── shared/   # API, Utils, UI
├── packages/
│   └── shared-types/     # Tipos compartidos TypeScript
├── docs/
└── .kiro/
```

## Fases de Implementación

### Fase 1: Reorganización a Monorepo (Tasks 1-5)

- Crear estructura de directorios
- Configurar pnpm workspace
- Crear package de tipos compartidos
- Instalar dependencias

### Fase 2: Setup del Frontend (Tasks 6-10)

- Inicializar Vite + React
- Configurar TypeScript y path aliases
- Crear estructura FSD
- Configurar providers globales

### Fase 3: Shared Layer (Tasks 11-15)

- Configurar API client con axios
- Crear utilidades de fecha
- Crear componentes UI compartidos
- Crear hooks compartidos

### Fase 4: Autenticación (Tasks 16-22)

- Crear auth store con Zustand
- Implementar feature de login
- Crear página de login
- Configurar router y rutas protegidas

### Fase 5: Layout y Navegación (Tasks 23-25)

- Crear layout principal con Mantine
- Configurar navegación
- Implementar responsive design

### Fase 6: Entity de Appointment (Tasks 26-29)

- Crear tipos y query hooks
- Crear API service
- Crear componentes de presentación

### Fase 7: Dashboard (Tasks 30-33)

- Crear widgets de stats y upcoming appointments
- Crear página de dashboard
- Integrar componentes

### Fase 8: Gestión de Citas (Tasks 34-39)

- Implementar filtros con Zustand
- Implementar cancelación con optimistic updates
- Crear página de appointments

### Fase 9: Testing (Tasks 40-46)

- Configurar Vitest + RTL + MSW
- Tests de componentes y hooks
- Tests de utilidades
- Verificar cobertura

### Fase 10: Documentación (Tasks 47-50)

- Actualizar READMEs
- Limpieza final
- Verificación completa
- Merge y deploy

## Comandos Principales

```bash
# Instalar dependencias
pnpm install

# Desarrollo (backend + frontend simultáneamente)
pnpm dev

# Desarrollo individual
pnpm dev:backend   # http://localhost:3000
pnpm dev:frontend  # http://localhost:5173

# Build
pnpm build
pnpm build:backend
pnpm build:frontend

# Testing
pnpm test
pnpm test:backend
pnpm test:frontend

# Linting
pnpm lint
pnpm lint:fix
```

## Correctness Properties

El spec incluye 8 propiedades de correctness que deben ser verificadas:

1. **Authentication token persistence** - Token se restaura desde localStorage
2. **Protected route redirection** - Usuarios no autenticados son redirigidos
3. **Optimistic update rollback** - UI revierte en caso de error
4. **Query invalidation** - Queries se refrescan después de mutaciones
5. **Filter state persistence** - Filtros persisten al navegar
6. **API error handling** - Errores muestran mensajes apropiados
7. **Token injection** - Token se incluye en requests
8. **Automatic logout on 401** - Logout automático en respuestas 401

## Métricas de Éxito

- ✅ Monorepo funcional con `pnpm dev`
- ✅ Login y autenticación funcionando
- ✅ Dashboard mostrando métricas
- ✅ Citas se pueden visualizar y cancelar
- ✅ Filtros funcionan correctamente
- ✅ Optimistic updates implementados
- ✅ Tests con cobertura > 70%
- ✅ Responsive en mobile y desktop

## Tiempo Estimado

- **Reorganización:** 4-6 horas
- **Setup Frontend:** 3-4 horas
- **Implementación:** 12-16 horas
- **Testing:** 4-6 horas
- **Total:** 23-32 horas

## Referencias

- [Requirements Document](./requirements.md)
- [Design Document](./design.md)
- [Tasks Document](./tasks.md)
- [Frontend PRD](../../steering/frontend/PRD.md)
- [Backend PRD](../../steering/backend/PRD.md)
- [Reorganization Plan](../../../docs/REORGANIZATION_PLAN.md)

## Próximos Pasos

Después de completar este MVP, los siguientes features a implementar serían:

1. Gestión de servicios (offerings)
2. Gestión de horarios (schedules)
3. Respuesta a consultas de clientes
4. Configuración de negocio
5. Notificaciones en tiempo real
6. Analytics y reportes

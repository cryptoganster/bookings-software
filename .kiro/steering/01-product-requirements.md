---
inclusion: always
---

# Product Requirements Document (PRD)

## Sistema de Reservas Multi-Tenant vía WhatsApp

**Version:** 1.0 | **Date:** December 2024 | **Type:** MVP

---

## Visión General

**Propósito:** Plataforma SaaS multi-tenant para gestión automatizada de citas vía WhatsApp Business API.

**Objetivos MVP:**

- Registro y configuración de negocios
- Reservación automatizada vía WhatsApp
- Gestión de servicios con límites configurables
- Panel web de administración
- Notificaciones automáticas

**Stack:** NestJS + TypeScript + PostgreSQL + WhatsApp Business API  
**Arquitectura:** Clean Architecture + DDD + CQRS + Event-Driven

---

## Arquitectura

**Principios:**

- Clean Architecture (Domain → Application → Infrastructure → Presentation)
- DDD con Bounded Contexts
- CQRS estricto (separación lectura/escritura)
- Event-Driven con Domain Events
- Process Managers (Sagas) para orquestación

---

## Documentación Detallada

Este PRD es el documento principal que proporciona una visión general del sistema. Para información detallada, consulta los siguientes documentos:

### Arquitectura y Diseño

- **[02-bounded-contexts.md](./02-bounded-contexts.md)** - Definición detallada de Bounded Contexts
- **[03-identity-architecture.md](./03-identity-architecture.md)** - Arquitectura de User/Customer/BusinessOwner
- **[04-system-architecture.md](./04-system-architecture.md)** - Arquitectura técnica y gestión de concurrencia

### Implementación

- **[05-user-flows.md](./05-user-flows.md)** - Flujos de usuario detallados
- **[06-data-model.md](./06-data-model.md)** - Modelo de datos y entidades
- **[07-business-rules.md](./07-business-rules.md)** - Reglas de negocio por BC
- **[08-cqrs-commands-queries.md](./08-cqrs-commands-queries.md)** - Commands, Queries, Events y Sagas
- **[09-api-endpoints.md](./09-api-endpoints.md)** - API REST y webhooks
- **[10-non-functional-requirements.md](./10-non-functional-requirements.md)** - Requisitos no funcionales y fases

### Patrones y Convenciones

- **[11-ddd-tactical-patterns.md](./11-ddd-tactical-patterns.md)** - Patrones tácticos de DDD
- **[20-nestjs-implementation.md](./20-nestjs-implementation.md)** - Patrones de implementación con NestJS
- **[21-clean-code-principles.md](./21-clean-code-principles.md)** - Principios de código limpio
- **[30-naming-conventions.md](./30-naming-conventions.md)** - Convenciones de nomenclatura
- **[31-import-conventions.md](./31-import-conventions.md)** - Convenciones de imports

---

## Bounded Contexts

### Resumen de Bounded Contexts

| BC               | Responsabilidad             | Aggregates Principales                                        |
| ---------------- | --------------------------- | ------------------------------------------------------------- |
| **auth**         | Autenticación e identidades | `User` (roles múltiples: BUSINESS_OWNER, CUSTOMER, ADMIN)     |
| **account**      | Perfiles y suscripciones    | `BusinessOwner` (vinculado a User, subscription plan)         |
| **business**     | Configuración de negocios   | `Business` (ownerId → User.id, WhatsApp, timezone)            |
| **offering**     | Servicios ofrecidos         | `Offering` (nombre, duración, capacidad)                      |
| **availability** | Horarios y límites          | `Schedule`, `Blockout`, `Capacity` (versioned)                |
| **booking**      | Reservaciones               | `Appointment` (versioned, customerId, businessId)             |
| **customer**     | Perfiles de clientes        | `Customer` (anónimo: userId=null, registrado: userId→User.id) |
| **conversation** | WhatsApp integration        | `Conversation`, `Message` (versioned)                         |
| **notification** | Recordatorios               | `Reminder` (scheduled, sent, cancelled)                       |

> **📖 Detalles Completos:** Ver [02-bounded-contexts.md](./02-bounded-contexts.md)

---

## Arquitectura de Identidades

**Conceptos clave:**

- **User (Auth):** Identidad universal con autenticación JWT
- **BusinessOwner (Account):** Perfil de cuenta (siempre vinculado a User)
- **Business (Business):** Negocio específico (ownerId → User.id)
- **Customer (Customer):** Perfil de cliente (opcional vinculado a User)
  - Anónimo: Solo WhatsApp, sin panel web
  - Registrado: Acceso a panel web, historial completo

> **📖 Detalles Completos:** Ver [03-identity-architecture.md](./03-identity-architecture.md)

---

## Gestión de Concurrencia

**Estrategia:** Unit of Work + Optimistic Locking + Versioning

**Entidades Versionadas:**

- ✅ Appointment - Alta concurrencia en modificaciones
- ✅ Capacity - Race conditions en reservaciones simultáneas
- ✅ Conversation - Cambios de estado concurrentes

> **📖 Detalles Completos:** Ver [04-system-architecture.md](./04-system-architecture.md)

---

## Flujos de Usuario

**Flujos principales:**

1. **Dueño de Negocio:** Registro, configuración, gestión
2. **Cliente Final:** Reservación vía WhatsApp
3. **Cliente Final:** Modificar/Cancelar cita
4. **Cliente Final:** Consulta al administrador
5. **Sistema:** Envío de recordatorios

> **📖 Detalles Completos:** Ver [05-user-flows.md](./05-user-flows.md)

---

## Modelo de Datos

**Entidades principales:**

- User, BusinessOwner, Business
- Offering, Schedule, Blockout, Capacity
- Appointment, Customer
- Conversation, Message, Reminder

> **📖 Detalles Completos:** Ver [06-data-model.md](./06-data-model.md)

---

## Reglas de Negocio

**Categorías principales:**

- Reservaciones (capacidad, horarios, bloqueos)
- Cancelaciones (tiempo límite, liberación de capacidad)
- Modificaciones (validación de disponibilidad)
- Multi-tenancy (aislamiento de datos)
- Zona horaria (almacenamiento UTC, presentación local)

> **📖 Detalles Completos:** Ver [07-business-rules.md](./07-business-rules.md)

---

## CQRS: Commands, Queries, Events & Sagas

**Patrones:**

- **Commands:** Escritura con `Command<TResult>`
- **Queries:** Lectura con `Query<TResult>`
- **Event Handlers:** Reacción a eventos de dominio
- **Sagas:** Orquestación de flujos complejos

> **📖 Detalles Completos:** Ver [08-cqrs-commands-queries.md](./08-cqrs-commands-queries.md)

---

## API Endpoints

**Categorías:**

- Autenticación (register, login, refresh)
- Business Management (CRUD)
- Offerings, Schedules, Blockouts (CRUD)
- Appointments (consultas y gestión)
- Admin Queries (respuestas a clientes)
- Webhooks (WhatsApp Business API)

> **📖 Detalles Completos:** Ver [09-api-endpoints.md](./09-api-endpoints.md)

---

## Requisitos No Funcionales

**Aspectos clave:**

- **Performance:** < 1s webhooks, < 2s panel web
- **Escalabilidad:** 100 negocios MVP, 500 citas/mes
- **Seguridad:** JWT, bcrypt, validación webhooks
- **Disponibilidad:** 99% uptime, circuit breakers
- **Observabilidad:** Logging estructurado, event tracking

**Fases de Implementación:**

1. Fundamentos (Semanas 1-2)
2. Core Domain (Semanas 3-4)
3. Application Layer (Semanas 5-6)
4. Integración WhatsApp (Semanas 7-8)
5. Panel Web (Semanas 9-10)
6. Notificaciones (Semana 11)
7. Testing y Refinamiento (Semana 12)

> **📖 Detalles Completos:** Ver [10-non-functional-requirements.md](./10-non-functional-requirements.md)

---

## Métricas de Éxito del MVP

| Categoría    | Métricas                                                                                         |
| ------------ | ------------------------------------------------------------------------------------------------ |
| **Técnicas** | Tests > 70%, API < 200ms (p95), Webhook < 1s, Zero downtime                                      |
| **Producto** | 10 negocios, 100+ citas, Cancelación < 10%, Errores conversación < 5%, Zero errores concurrencia |
| **UX**       | Reservación < 2min, NPS > 8, < 3 clics para agendar                                              |

---

## Próximos Pasos Post-MVP

1. Pagos integrados (Stripe, PayPal)
2. Recordatorios múltiples (24h, 2h antes)
3. Lista de espera para citas
4. Reportes y analytics avanzados
5. Integración con Google Calendar
6. App móvil para dueños de negocios
7. Webhooks para integraciones externas
8. IA para respuestas automáticas mejoradas
9. Sistema de valoraciones de clientes
10. Multi-idioma

---

**Fin del PRD v1.0**

Para información detallada sobre cualquier aspecto del sistema, consulta los documentos específicos listados al inicio de este documento.

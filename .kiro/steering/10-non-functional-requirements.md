---
inclusion: manual
---

# Non-Functional Requirements

**Performance, scalability, security, and implementation phases**

> **Cross-References:**
>
> - [01-product-requirements.md](./01-product-requirements.md) - Product overview
> - [04-system-architecture.md](./04-system-architecture.md) - Technical architecture
> - [07-business-rules.md](./07-business-rules.md) - Business rules

---

# Requisitos No Funcionales

Este documento define los requisitos no funcionales del sistema, dependencias, y fases de implementación.

---

## 1. Requisitos No Funcionales

### 1.1 Performance

| Métrica                  | Objetivo                 |
| ------------------------ | ------------------------ |
| **Webhook WhatsApp**     | < 1 segundo de respuesta |
| **Panel Web**            | < 2 segundos de carga    |
| **API REST**             | < 200ms (p95)            |
| **Queries**              | Optimizadas con índices  |
| **Database Connections** | Pool de 20 conexiones    |

### 1.2 Escalabilidad

| Aspecto               | Objetivo MVP                       |
| --------------------- | ---------------------------------- |
| **Negocios**          | 100 negocios                       |
| **Citas por negocio** | 500 citas/mes                      |
| **Mensajes**          | Procesamiento asíncrono            |
| **Concurrencia**      | 50 usuarios simultáneos            |
| **Database**          | PostgreSQL con índices optimizados |

### 1.3 Seguridad

| Aspecto           | Implementación                        |
| ----------------- | ------------------------------------- |
| **Autenticación** | JWT con expiración de 24 horas        |
| **Passwords**     | bcrypt con salt rounds = 10           |
| **Webhooks**      | Validación de firma HMAC SHA-256      |
| **Multi-tenancy** | Aislamiento por businessId            |
| **Rate Limiting** | 100 req/min por usuario               |
| **HTTPS**         | Obligatorio en producción             |
| **CORS**          | Configurado para dominios específicos |

### 1.4 Disponibilidad

| Aspecto              | Objetivo                            |
| -------------------- | ----------------------------------- |
| **Uptime**           | 99% (MVP)                           |
| **Circuit Breakers** | Para integraciones externas         |
| **Reintentos**       | Automáticos con exponential backoff |
| **Health Checks**    | `/health` endpoint                  |
| **Monitoring**       | Logging estructurado                |

### 1.5 Observabilidad

| Aspecto            | Implementación                |
| ------------------ | ----------------------------- |
| **Logging**        | Winston/Pino con niveles      |
| **Event Tracking** | Todos los domain events       |
| **Error Tracking** | Stack traces completos        |
| **Metrics**        | Request duration, error rates |
| **Health Checks**  | Database, external APIs       |

---

## 2. Dependencias y Librerías

### 2.1 Core

| Librería         | Versión | Propósito                           |
| ---------------- | ------- | ----------------------------------- |
| `@nestjs/core`   | ^10.x   | Framework base                      |
| `@nestjs/common` | ^10.x   | Decoradores y utilidades            |
| `@nestjs/cqrs`   | ^10.x   | CQRS pattern (CommandBus, QueryBus) |
| `typeorm`        | ^0.3.x  | ORM para PostgreSQL                 |
| `pg`             | ^8.x    | Driver de PostgreSQL                |
| `typescript`     | ^5.x    | Lenguaje                            |
| `rxjs`           | ^7.x    | Reactive programming (Sagas)        |

### 2.2 Autenticación

| Librería           | Versión | Propósito                    |
| ------------------ | ------- | ---------------------------- |
| `@nestjs/jwt`      | ^10.x   | JWT tokens                   |
| `@nestjs/passport` | ^10.x   | Estrategias de autenticación |
| `passport-jwt`     | ^4.x    | Estrategia JWT               |
| `bcrypt`           | ^5.x    | Hashing de passwords         |

### 2.3 Validación

| Librería            | Versión | Propósito                 |
| ------------------- | ------- | ------------------------- |
| `class-validator`   | ^0.14.x | Validación de DTOs        |
| `class-transformer` | ^0.5.x  | Transformación de objetos |

### 2.4 WhatsApp

| Librería | Versión | Propósito                     |
| -------- | ------- | ----------------------------- |
| `axios`  | ^1.x    | HTTP client para WhatsApp API |

### 2.5 Utilidades

| Librería      | Versión | Propósito              |
| ------------- | ------- | ---------------------- |
| `date-fns`    | ^2.x    | Manipulación de fechas |
| `date-fns-tz` | ^2.x    | Zonas horarias         |
| `uuid`        | ^9.x    | Generación de UUIDs    |

### 2.6 Logging

| Librería  | Versión | Propósito            |
| --------- | ------- | -------------------- |
| `winston` | ^3.x    | Logging estructurado |

---

## 3. Fases de Implementación del MVP

### Fase 1: Fundamentos (Semanas 1-2)

**Objetivo:** Establecer la base del proyecto

**Tareas:**

- ✅ Setup del proyecto NestJS
- ✅ Instalación y configuración de `@nestjs/cqrs` con `CqrsModule.forRoot()`
- ✅ Configuración de TypeORM + PostgreSQL
- ✅ Estructura de carpetas por Bounded Contexts
- ✅ Shared Kernel: VersionedAggregateRoot (extiende AggregateRoot de NestJS), ValueObject base, IUnitOfWork
- ✅ Implementación de Unit of Work con TypeORM
- ✅ Configuración de CommandBus, QueryBus, EventBus

**Entregables:**

- Proyecto compilando
- Base de datos conectada
- Estructura de carpetas definida
- Shared Kernel implementado

---

### Fase 2: Core Domain (Semanas 3-4)

**Objetivo:** Implementar el dominio principal

**Tareas:**

- ✅ Implementar Aggregates principales extendiendo VersionedAggregateRoot
- ✅ Value Objects (incluyendo AggregateVersion)
- ✅ Domain Events (clases simples, sin decoradores)
- ✅ Repositories (interfaces e implementaciones con Optimistic Locking)
- ✅ ConcurrencyException y manejo de errores

**Entregables:**

- Aggregates: Appointment, Capacity, Customer, Business
- Value Objects: AppointmentStatus, AppointmentDateTime, etc.
- Domain Events: AppointmentCreated, AppointmentCancelled, etc.
- Repositories con Optimistic Locking

---

### Fase 3: Application Layer (Semanas 5-6)

**Objetivo:** Implementar casos de uso

**Tareas:**

- ✅ Commands extendiendo `Command<TResult>` de @nestjs/cqrs
- ✅ Command Handlers con `@CommandHandler` decorator y retry logic
- ✅ Queries extendiendo `Query<TResult>` de @nestjs/cqrs
- ✅ Query Handlers con `@QueryHandler` decorator
- ✅ Event Handlers con `@EventsHandler` decorator
- ✅ Sagas con `@Saga()` decorator (Process Managers)
- ✅ Registro de todos los handlers en módulos

**Entregables:**

- Commands: CreateAppointment, CancelAppointment, etc.
- Queries: GetAppointment, GetAvailableSlots, etc.
- Event Handlers: OnAppointmentCreated, etc.
- Sagas: AppointmentNotificationSaga, etc.

---

### Fase 4: Integración WhatsApp (Semanas 7-8)

**Objetivo:** Conectar con WhatsApp Business API

**Tareas:**

- ✅ Cliente de WhatsApp Business API
- ✅ Webhook endpoint
- ✅ Lógica conversacional básica
- ✅ Botones interactivos
- ✅ Validación de firma de webhook
- ✅ Retry logic para envío de mensajes

**Entregables:**

- WhatsAppClient implementado
- Webhook funcionando
- Flujo de conversación básico
- Mensajes con botones interactivos

---

### Fase 5: Panel Web (Semanas 9-10)

**Objetivo:** Implementar panel de administración

**Tareas:**

- ✅ APIs REST para panel
- ✅ Autenticación y autorización (JWT)
- ✅ CRUD de offerings y horarios
- ✅ Vista de citas
- ✅ Dashboard con métricas
- ✅ Respuesta a consultas de clientes

**Entregables:**

- Endpoints REST completos
- Autenticación JWT
- Panel web funcional
- Dashboard con métricas

---

### Fase 6: Notificaciones (Semana 11)

**Objetivo:** Sistema de recordatorios

**Tareas:**

- ✅ Sistema de recordatorios
- ✅ Cron jobs
- ✅ Envío automático 24h antes
- ✅ Cancelación de recordatorios

**Entregables:**

- Recordatorios funcionando
- Cron job configurado
- Notificaciones por WhatsApp

---

### Fase 7: Testing y Refinamiento (Semana 12)

**Objetivo:** Asegurar calidad y estabilidad

**Tareas:**

- ✅ Tests unitarios (Aggregates, Value Objects)
- ✅ Tests de integración (Command/Query Handlers)
- ✅ Tests de concurrencia (simular race conditions)
- ✅ Tests E2E (flujos completos)
- ✅ Documentación
- ✅ Performance tuning
- ✅ Security audit

**Entregables:**

- Cobertura de tests > 70%
- Tests de concurrencia pasando
- Documentación completa
- Sistema listo para producción

---

## 4. Métricas de Éxito del MVP

### 4.1 Métricas Técnicas

| Métrica                   | Objetivo      |
| ------------------------- | ------------- |
| **Cobertura de Tests**    | > 70%         |
| **API Response Time**     | < 200ms (p95) |
| **Webhook Response Time** | < 1 segundo   |
| **Uptime**                | 99%           |
| **Zero Downtime Deploys** | Sí            |

### 4.2 Métricas de Producto

| Métrica                     | Objetivo                         |
| --------------------------- | -------------------------------- |
| **Negocios Activos**        | 10 negocios                      |
| **Citas Creadas**           | 100+ citas                       |
| **Tasa de Cancelación**     | < 10%                            |
| **Errores de Conversación** | < 5%                             |
| **Errores de Concurrencia** | 0 (gracias a Optimistic Locking) |

### 4.3 Métricas de UX

| Métrica                   | Objetivo    |
| ------------------------- | ----------- |
| **Tiempo de Reservación** | < 2 minutos |
| **NPS**                   | > 8         |
| **Clics para Agendar**    | < 3 clics   |

---

## 5. Riesgos y Mitigaciones

### 5.1 Riesgos Técnicos

| Riesgo                         | Probabilidad | Impacto | Mitigación                                                  |
| ------------------------------ | ------------ | ------- | ----------------------------------------------------------- |
| **Límites WhatsApp API**       | Media        | Alto    | Rate limiting + queue system                                |
| **Zonas horarias**             | Baja         | Medio   | date-fns-tz, almacenar UTC, convertir en presentación       |
| **Race conditions** ✅         | Alta         | Alto    | UoW + Optimistic Locking + Retry logic + Tests concurrencia |
| **Escalabilidad multi-tenant** | Media        | Alto    | Particionar BD por tenant, índices compuestos               |
| **Conversaciones ambiguas**    | Media        | Medio   | Flujo estructurado con botones, minimizar texto libre       |

### 5.2 Riesgos de Negocio

| Riesgo                 | Probabilidad | Impacto | Mitigación                              |
| ---------------------- | ------------ | ------- | --------------------------------------- |
| **Adopción lenta**     | Media        | Alto    | Onboarding simplificado, soporte activo |
| **Competencia**        | Alta         | Medio   | Diferenciación por UX y automatización  |
| **Costos de WhatsApp** | Baja         | Medio   | Monitorear uso, optimizar mensajes      |

---

## 6. Próximos Pasos Post-MVP

### 6.1 Funcionalidades

1. ✅ Pagos integrados (Stripe, PayPal)
2. ✅ Recordatorios múltiples (24h, 2h antes)
3. ✅ Lista de espera para citas
4. ✅ Reportes y analytics avanzados
5. ✅ Integración con Google Calendar
6. ✅ App móvil para dueños de negocios
7. ✅ Webhooks para integraciones externas
8. ✅ IA para respuestas automáticas mejoradas
9. ✅ Sistema de valoraciones de clientes
10. ✅ Multi-idioma

### 6.2 Mejoras Técnicas

1. ✅ Event Sourcing completo
2. ✅ CQRS con bases de datos separadas
3. ✅ Microservicios por BC
4. ✅ Message queue (RabbitMQ/Kafka)
5. ✅ Caching con Redis
6. ✅ CDN para assets estáticos
7. ✅ Kubernetes para orquestación
8. ✅ Monitoring avanzado (Prometheus, Grafana)

---

## 7. Notas Adicionales

### 7.1 CQRS Estricto con NestJS

- **Escritura:** Aggregates + Commands (`Command<TResult>`)
- **Lectura:** Read Models + Queries (`Query<TResult>`)
- **Sincronización:** Domain Events + Event Handlers + Sagas
- **Infraestructura:** `@nestjs/cqrs` provee CommandBus, QueryBus, EventBus
- **Eventos:** Auto-publicados con `autoCommit=true`

### 7.2 Testing Strategy

- **Unit:** Aggregates, Value Objects, Domain Services
- **Integration:** Command/Query Handlers, Repositories, Sagas (RxJS streams)
- **Concurrency:** Race conditions con múltiples threads
- **E2E:** Flujos completos con CommandBus/QueryBus/EventBus
- **Contract:** Integración WhatsApp API
- **Saga:** Marble testing de RxJS

### 7.3 Optimistic Locking Best Practices

- **Versionar:** Appointment, Capacity, Conversation
- **Sin versionar:** BusinessOwner, Customer, Offering (baja concurrencia)
- **Retry:** Máximo 3 intentos con exponential backoff
- **Feedback:** Mensajes claros al usuario en conflictos
- **Monitoring:** Trackear ConcurrencyExceptions

### 7.4 Integración NestJS CQRS + DDD

**Componentes:**

1. **Aggregates:** Extienden `VersionedAggregateRoot` → `AggregateRoot` de @nestjs/cqrs, usan `apply(event)`, `autoCommit=true`
2. **Commands:** Extienden `Command<TResult>`, ejecutados por `CommandBus`, manejados por `@CommandHandler`
3. **Queries:** Extienden `Query<TResult>`, ejecutados por `QueryBus`, manejados por `@QueryHandler`
4. **Events:** POJOs publicados con `apply()`, manejados por `@EventsHandler`
5. **Sagas:** `@Saga()` retorna `Observable<ICommand>`, filtran con `ofType()`, mapean a comandos
6. **EventPublisher:** `mergeObjectContext()` opcional si `autoCommit=true`

**Flujo:** Controller → CommandBus → Handler → Aggregate.apply(event) → EventBus → EventHandlers/Sagas → CommandBus

**Ventajas:** Infraestructura probada, tipado fuerte, DI nativo, testing facilitado, RxJS, menos boilerplate

---

## 8. Configuración de Entornos

### 8.1 Development

```env
NODE_ENV=development
DATABASE_URL=postgresql://user:pass@localhost:5432/booking_dev
JWT_SECRET=dev-secret-key
WHATSAPP_API_URL=https://graph.facebook.com/v18.0
WHATSAPP_WEBHOOK_SECRET=dev-webhook-secret
```

### 8.2 Production

```env
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@prod-db:5432/booking_prod
JWT_SECRET=<strong-secret-key>
WHATSAPP_API_URL=https://graph.facebook.com/v18.0
WHATSAPP_WEBHOOK_SECRET=<strong-webhook-secret>
```

---

**Fin del documento de Requisitos No Funcionales**

> **📖 Referencias:**
>
> - [01-product-requirements.md](./01-product-requirements.md) - Visión general del producto
> - [04-system-architecture.md](./04-system-architecture.md) - Arquitectura técnica
> - [20-nestjs-implementation.md](./20-nestjs-implementation.md) - Patrones de implementación

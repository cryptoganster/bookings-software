# Arquitectura del Sistema

Este documento define los principios arquitectónicos y la estructura de alto nivel del Sistema de Reservas Multi-Tenant.

## Principios Arquitectónicos Fundamentales

### 1. Clean Architecture (Arquitectura Limpia)

El sistema sigue Clean Architecture con capas concéntricas:

```
┌─────────────────────────────────────────┐
│         Presentation Layer              │  ← Controllers, DTOs
│  ┌───────────────────────────────────┐  │
│  │     Application Layer             │  │  ← Commands, Queries, Handlers
│  │  ┌─────────────────────────────┐  │  │
│  │  │      Domain Layer           │  │  │  ← Aggregates, Events, VOs
│  │  │   (Business Logic)          │  │  │
│  │  └─────────────────────────────┘  │  │
│  └───────────────────────────────────┘  │
│         Infrastructure Layer            │  ← Repositories, External APIs
└─────────────────────────────────────────┘
```

**Reglas de dependencia:**
- Las capas internas NO conocen las externas
- Domain NO depende de nada
- Application depende solo de Domain
- Infrastructure implementa interfaces de Domain
- Presentation usa Application

### 2. Domain-Driven Design (DDD)

**Bounded Contexts:**
- Cada BC es un límite explícito de modelo de dominio
- Comunicación entre BCs solo vía eventos
- Lenguaje ubicuo por BC
- Aggregates como unidad de consistencia

**Tactical Patterns:**
- Aggregates: Clusters de objetos con raíz
- Entities: Objetos con identidad
- Value Objects: Objetos inmutables sin identidad
- Domain Events: Hechos del pasado
- Repositories: Abstracción de persistencia
- Domain Services: Lógica que no pertenece a entidades

### 3. CQRS (Command Query Responsibility Segregation)

**Separación estricta:**
```
Commands (Write)          Queries (Read)
     ↓                         ↓
CommandHandlers          QueryHandlers
     ↓                         ↓
WriteRepositories        ReadRepositories
     ↓                         ↓
Write Models             Read Models
     ↓                         ↓
   Database               Database
```

**Sincronización:**
- Via Domain Events
- Event Handlers actualizan Read Models
- Eventual consistency aceptable

### 4. Event-Driven Architecture

**Flujo de eventos:**
```
Aggregate.apply(event)
    ↓
EventBus.publish(event)
    ↓
EventHandlers (async)
    ↓
Side effects / Commands
```

**Tipos de eventos:**
- Domain Events: Cambios en aggregates
- Integration Events: Comunicación entre BCs
- System Events: Eventos técnicos

## Estructura de Capas

### Domain Layer (Núcleo)

**Responsabilidad:** Lógica de negocio pura

**Componentes:**
- `aggregates/` - Raíces de agregados
- `entities/` - Entidades del dominio
- `vo/` - Value Objects
- `events/` - Domain Events
- `exceptions/` - Excepciones de dominio
- `interfaces/` - Contratos (repositories, services)
- `services/` - Domain Services

**Reglas:**
- Sin dependencias externas
- Solo lógica de negocio
- Inmutabilidad donde sea posible
- Validaciones en constructores

### Application Layer

**Responsabilidad:** Casos de uso y orquestación

**Componentes:**
- `commands/` - Commands y handlers (escritura)
- `queries/` - Queries y handlers (lectura)
- `event_handlers/` - Manejadores de eventos
- `sagas/` - Process managers
- `dtos/` - Data Transfer Objects

**Reglas:**
- Orquesta domain objects
- Maneja transacciones
- Despacha eventos
- No contiene lógica de negocio

### Infrastructure Layer

**Responsabilidad:** Implementaciones técnicas

**Componentes:**
- `persistence/` - Repositories, models, mappers
- `external/` - Clientes de APIs externas
- `messaging/` - Implementación de mensajería
- `config/` - Configuraciones

**Reglas:**
- Implementa interfaces de domain
- Maneja detalles técnicos
- Puede usar frameworks
- Aislada del domain

### Presentation Layer

**Responsabilidad:** Interfaz con el exterior

**Componentes:**
- `controllers/` - REST controllers
- `dtos/` - Request/Response DTOs
- `guards/` - Autenticación/Autorización
- `filters/` - Exception filters
- `interceptors/` - Request/Response interceptors

**Reglas:**
- Valida entrada
- Transforma respuestas
- Maneja HTTP concerns
- Delega a Application

## Patrones de Diseño Aplicados

### 1. Repository Pattern

```typescript
// Domain interface
interface IAppointmentWriteRepository {
  save(appointment: Appointment): Promise<void>;
  findById(id: UUID): Promise<Appointment | null>;
}

// Infrastructure implementation
class AppointmentWriteRepository implements IAppointmentWriteRepository {
  // Implementación con TypeORM
}
```

### 2. Unit of Work Pattern

```typescript
interface IUnitOfWork {
  transaction<T>(work: () => Promise<T>): Promise<T>;
}

// Uso
await uow.transaction(async () => {
  await repo1.save(entity1);
  await repo2.save(entity2);
  // Commit automático o rollback en error
});
```

### 3. Factory Pattern

```typescript
class Appointment {
  static create(...params): Appointment {
    // Validaciones
    // Lógica de creación
    // Apply events
    return appointment;
  }
  
  static fromPersistence(...params): Appointment {
    // Reconstruir desde BD
    return appointment;
  }
}
```

### 4. Strategy Pattern

```typescript
interface IWhatsAppClient {
  sendMessage(to: string, message: string): Promise<void>;
}

// Diferentes implementaciones
class WhatsAppBusinessApiClient implements IWhatsAppClient {}
class MockWhatsAppClient implements IWhatsAppClient {}
```

### 5. Observer Pattern (via Events)

```typescript
// Publisher
appointment.apply(new AppointmentCreated(...));

// Subscribers
@EventsHandler(AppointmentCreated)
class OnAppointmentCreatedHandler {
  handle(event: AppointmentCreated) {
    // React to event
  }
}
```

## Manejo de Concurrencia

### Optimistic Locking

**Estrategia:**
- Campo `version` en aggregates críticos
- Incremento en cada cambio de estado
- Verificación en UPDATE con WHERE version
- ConcurrencyException si falla
- Retry logic con exponential backoff

**Aggregates versionados:**
- Appointment
- Capacity
- Conversation

### Unit of Work + Transacciones

**Isolation Level:** READ COMMITTED (default)

**Uso:**
```typescript
await uow.transaction(async () => {
  // Todas las operaciones en misma transacción
  // Commit automático si éxito
  // Rollback automático si error
});
```

## Comunicación entre Bounded Contexts

### Via Domain Events

```
BC1: Booking                    BC2: Notification
    ↓                                ↓
Appointment.create()           EventHandler
    ↓                                ↓
apply(AppointmentCreated)      handle(AppointmentCreated)
    ↓                                ↓
EventBus                       Create Reminder
```

**Reglas:**
- Comunicación asíncrona
- Eventual consistency
- No llamadas directas entre BCs
- Eventos como contratos

## Escalabilidad y Performance

### Estrategias

1. **Índices de Base de Datos**
   - Campos de búsqueda frecuente
   - Claves foráneas
   - Campos de ordenamiento

2. **Query Optimization**
   - Usar QueryBuilder para joins
   - Proyecciones específicas
   - Paginación en listas

3. **Caching (Futuro)**
   - Redis para datos frecuentes
   - TTL apropiado por tipo de dato
   - Cache invalidation via eventos

4. **Async Processing**
   - Event handlers asíncronos
   - Message queues (futuro)
   - Background jobs

## Seguridad

### Capas de Seguridad

1. **Autenticación**
   - JWT tokens
   - Refresh tokens
   - Password hashing (bcrypt)

2. **Autorización**
   - Guards en controllers
   - Role-based access control
   - Resource ownership validation

3. **Validación**
   - DTOs con class-validator
   - Sanitización de entrada
   - Whitelist de campos

4. **Rate Limiting**
   - Por IP
   - Por usuario
   - Por endpoint

5. **Webhook Security**
   - Signature verification
   - HTTPS only
   - Request validation

## Observabilidad

### Logging

**Niveles:**
- ERROR: Errores que requieren atención
- WARN: Situaciones anormales pero manejables
- INFO: Eventos importantes del sistema
- DEBUG: Información detallada para debugging

**Estructura:**
```json
{
  "timestamp": "2024-12-14T10:30:00Z",
  "level": "info",
  "context": "CreateAppointmentHandler",
  "message": "Appointment created",
  "metadata": {
    "appointmentId": "uuid",
    "businessId": "uuid",
    "duration": 150
  }
}
```

### Health Checks

**Endpoints:**
- `/health` - Estado general
- `/health/db` - Estado de base de datos
- `/health/ready` - Listo para recibir tráfico

### Metrics (Futuro)

- Request duration
- Error rates
- Business metrics (appointments/day)
- Resource usage

## Testing Strategy

### Pirámide de Testing

```
        E2E Tests (10%)
       ↗            ↖
  Integration Tests (30%)
 ↗                      ↖
Unit Tests (60%)
```

### Tipos de Tests

1. **Unit Tests**
   - Aggregates
   - Value Objects
   - Domain Services
   - Aislados, rápidos

2. **Integration Tests**
   - Command/Query Handlers
   - Repositories
   - Event Handlers
   - Con BD real (test container)

3. **Property-Based Tests**
   - Propiedades universales
   - Generación de datos aleatorios
   - 100+ iteraciones

4. **E2E Tests**
   - Flujos completos
   - HTTP requests
   - Validación end-to-end

5. **Concurrency Tests**
   - Race conditions
   - Optimistic locking
   - Transacciones

## Deployment Architecture (Futuro)

```
Load Balancer
    ↓
┌─────────────────────┐
│  NestJS Instances   │ (Horizontal scaling)
│  (Stateless)        │
└─────────────────────┘
    ↓           ↓
PostgreSQL   Redis
(Primary)    (Cache)
    ↓
PostgreSQL
(Replica)
```

## Decisiones Arquitectónicas Clave

### 1. ¿Por qué CQRS estricto?
- Optimización independiente de lectura/escritura
- Escalabilidad diferenciada
- Modelos específicos por caso de uso

### 2. ¿Por qué Optimistic Locking?
- Alto throughput de lectura
- Sin bloqueos
- Manejo explícito de conflictos

### 3. ¿Por qué Event-Driven?
- Desacoplamiento entre BCs
- Extensibilidad
- Audit trail natural

### 4. ¿Por qué NestJS?
- Estructura opinada
- CQRS nativo
- Ecosistema maduro
- TypeScript first-class

### 5. ¿Por qué PostgreSQL?
- ACID completo
- Índices avanzados
- JSON support
- Madurez y estabilidad

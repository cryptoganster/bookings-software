# Sistema de Reservas Multi-Tenant vía WhatsApp

Sistema de gestión de citas automatizado a través de WhatsApp Business API, construido con NestJS, TypeScript, PostgreSQL y siguiendo principios de Clean Architecture, DDD y CQRS.

## 🚀 Características Principales

- **Reservaciones Automatizadas**: Flujo conversacional completo vía WhatsApp
- **Multi-Tenant**: Soporte para múltiples negocios en una sola instancia
- **CQRS Estricto**: Separación completa entre comandos y queries
- **Event-Driven**: Arquitectura basada en eventos de dominio
- **Optimistic Locking**: Manejo de concurrencia con versioning de aggregates
- **Property-Based Testing**: Tests exhaustivos con fast-check
- **Clean Architecture**: Separación clara de capas (Domain, Application, Infrastructure, Presentation)

## 📋 Requisitos Previos

- **Node.js**: v18 o superior
- **PostgreSQL**: v14 o superior
- **npm**: v9 o superior

## 🛠️ Instalación

### 1. Clonar el Repositorio

```bash
git clone https://github.com/cryptoganster/bookings-software.git
cd bookings-software
```

### 2. Instalar Dependencias

```bash
npm install
```

### 3. Configurar Variables de Entorno

Copiar el archivo de ejemplo y configurar las variables:

```bash
cp .env.example .env
```

Editar `.env` con tus configuraciones:

```env
# Application
NODE_ENV=development
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=tu_password
DB_DATABASE=bookings_dev

# JWT
JWT_SECRET=tu_secret_key_muy_seguro
JWT_EXPIRATION=1d

# WhatsApp Business API (opcional para desarrollo)
WHATSAPP_API_URL=https://graph.facebook.com/v18.0/PHONE_NUMBER_ID
WHATSAPP_ACCESS_TOKEN=tu_token
WHATSAPP_WEBHOOK_VERIFY_TOKEN=tu_verify_token

# Logging
LOG_LEVEL=debug
```

### 4. Configurar Base de Datos

#### Opción A: Usando Docker (Recomendado)

```bash
# Iniciar PostgreSQL con Docker Compose
docker-compose -f docker-compose.dev.yml up -d

# La base de datos estará disponible en localhost:5432
```

#### Opción B: PostgreSQL Local

Crear la base de datos manualmente:

```bash
psql -U postgres
CREATE DATABASE bookings_dev;
CREATE DATABASE bookings_test;
\q
```

### 5. Ejecutar Migraciones

```bash
# Ejecutar migraciones
npm run migration:run

# Ejecutar seeders (datos de prueba)
npm run seed
```

## 🚀 Ejecución

### Modo Desarrollo

```bash
# Iniciar con hot-reload
npm run start:dev

# La aplicación estará disponible en http://localhost:3000
```

### Modo Producción

```bash
# Compilar TypeScript
npm run build

# Iniciar versión compilada
npm run start:prod
```

### Modo Debug

```bash
# Iniciar con debugger
npm run start:debug
```

## 🧪 Testing

### Tests Unitarios

```bash
# Ejecutar todos los tests unitarios
npm run test

# Ejecutar tests en modo watch
npm run test:watch

# Ejecutar tests con cobertura
npm run test:cov
```

### Tests E2E

```bash
# Ejecutar tests end-to-end
npm run test:e2e

# Ejecutar test específico
npm run test:e2e -- conversation-flow.e2e-spec.ts
```

### Tests de Property-Based

Los tests de property-based están integrados en los tests unitarios y usan `fast-check`:

```bash
# Ejecutar tests que incluyen property-based tests
npm run test -- --testPathPattern="pbt.spec.ts"
```

## 📁 Estructura del Proyecto

```
src/
├── shared/                    # Shared Kernel
│   ├── kernel/               # Abstracciones base (VersionedAggregateRoot, ValueObject)
│   ├── vo/                   # Value Objects compartidos (UUID, AggregateVersion)
│   └── infra/                # Implementaciones compartidas (UnitOfWork)
│
├── auth/                     # Bounded Context: Autenticación
│   ├── domain/              # User aggregate, Events, Value Objects (UserRole enum)
│   ├── app/                 # Commands (Register, Login, AddRole, RemoveRole), Queries, Event Handlers
│   ├── infra/               # Repositories, Mappers, Guards (JwtAuthGuard, RolesGuard), JWT Strategy
│   └── presentation/        # Controllers, DTOs (RegisterDto, AddUserRoleDto)
│
├── availability/            # Bounded Context: Disponibilidad
│   ├── domain/             # Capacity aggregate, Events
│   ├── app/                # Commands, Queries
│   ├── infra/              # Repositories, Factories
│   └── presentation/       # (vacío por ahora)
│
├── booking/                # Bounded Context: Reservaciones ⭐
│   ├── domain/            # Appointment aggregate, Events, Exceptions
│   ├── app/               # Commands, Queries, Event Handlers, Sagas
│   ├── infra/             # Repositories, Mappers
│   └── presentation/      # Controllers
│
└── conversation/          # Bounded Context: Conversaciones WhatsApp
    ├── domain/           # Conversation aggregate, Events
    ├── app/              # Commands, Queries
    ├── infra/            # WhatsApp Client
    └── presentation/     # Webhook Controller
```

## 🏗️ Arquitectura

### Principios Aplicados

- **Clean Architecture**: Separación de capas con dependencias hacia el dominio
- **Domain-Driven Design (DDD)**: Bounded Contexts, Aggregates, Value Objects, Domain Events
- **CQRS**: Separación estricta entre Commands (escritura) y Queries (lectura)
- **Event-Driven**: Comunicación entre Bounded Contexts vía Domain Events
- **Optimistic Locking**: Control de concurrencia con versioning

### Bounded Contexts

1. **Auth**: Gestión de autenticación y autorización con roles múltiples (JWT)
   - Soporte para roles: `BUSINESS_OWNER`, `CUSTOMER`, `ADMIN`
   - Un usuario puede tener múltiples roles simultáneamente
   - Gestión de roles: agregar/remover roles dinámicamente
   - Verificación de email y activación/desactivación de cuentas
2. **Availability**: Gestión de capacidad y horarios disponibles
3. **Booking**: Gestión de citas y reservaciones (BC principal)
4. **Conversation**: Integración con WhatsApp y flujo conversacional

### Patrones Implementados

- **Repository Pattern**: Abstracción de persistencia
- **Unit of Work**: Gestión de transacciones
- **Factory Pattern**: Creación de aggregates complejos
- **Saga Pattern**: Orquestación de procesos largos
- **CQRS**: CommandBus, QueryBus, EventBus de NestJS

## 📚 Comandos Disponibles

### Desarrollo

```bash
npm run start:dev          # Iniciar con hot-reload
npm run start:debug        # Iniciar con debugger
npm run lint               # Ejecutar ESLint
npm run format             # Formatear con Prettier
```

### Base de Datos

```bash
npm run migration:generate # Generar migración
npm run migration:run      # Ejecutar migraciones
npm run migration:revert   # Revertir última migración
npm run seed               # Ejecutar seeders
```

### Testing

```bash
npm run test               # Tests unitarios
npm run test:watch         # Tests en modo watch
npm run test:cov           # Tests con cobertura
npm run test:e2e           # Tests end-to-end
```

### Producción

```bash
npm run build              # Compilar TypeScript
npm run start:prod         # Iniciar versión compilada
```

## 🔧 Agregar Nuevos Bounded Contexts

Para agregar un nuevo Bounded Context siguiendo el patrón de Booking:

### 1. Crear Estructura de Carpetas

```bash
mkdir -p src/nuevo-bc/{domain,app,infra,presentation}
mkdir -p src/nuevo-bc/domain/{aggregates,events,vo,exceptions,interfaces}
mkdir -p src/nuevo-bc/app/{commands,queries,event-handlers,sagas}
mkdir -p src/nuevo-bc/infra/{persistence,external}
mkdir -p src/nuevo-bc/presentation/controllers
```

### 2. Crear Aggregate

```typescript
// src/nuevo-bc/domain/aggregates/mi-aggregate.ts
import { VersionedAggregateRoot } from "@shared/kernel/versioned-aggregate-root";
import { UUID } from "@shared/vo/uuid";

export class MiAggregate extends VersionedAggregateRoot {
  private id: UUID;

  static create(id: UUID, ...params): MiAggregate {
    const aggregate = new MiAggregate();
    aggregate.id = id;
    aggregate.incrementVersion();
    aggregate.apply(new MiAggregateCreated(id.getValue()));
    return aggregate;
  }

  // Métodos de negocio...
}
```

### 3. Crear Command y Handler

```typescript
// src/nuevo-bc/app/commands/mi-command/command.ts
import { Command } from "@nestjs/cqrs";

export class MiCommand extends Command<{ id: string }> {
  constructor(public readonly param: string) {
    super();
  }
}

// src/nuevo-bc/app/commands/mi-command/handler.ts
import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";

@CommandHandler(MiCommand)
export class MiCommandHandler implements ICommandHandler<MiCommand> {
  async execute(command: MiCommand): Promise<{ id: string }> {
    // Implementación...
  }
}
```

### 4. Crear Módulo NestJS

```typescript
// src/nuevo-bc/nuevo-bc.module.ts
import { Module } from "@nestjs/common";
import { CqrsModule } from "@nestjs/cqrs";

@Module({
  imports: [CqrsModule],
  providers: [
    // Command Handlers
    MiCommandHandler,
    // Query Handlers
    // Event Handlers
    // Repositories
  ],
  exports: [],
})
export class NuevoBcModule {}
```

### 5. Registrar en AppModule

```typescript
// src/app.module.ts
import { NuevoBcModule } from "./nuevo-bc/nuevo-bc.module";

@Module({
  imports: [
    // ...otros módulos
    NuevoBcModule,
  ],
})
export class AppModule {}
```

## 🐛 Troubleshooting

### Error: "Cannot connect to database"

Verificar que PostgreSQL esté corriendo y las credenciales sean correctas:

```bash
# Verificar estado de PostgreSQL
docker-compose -f docker-compose.dev.yml ps

# Ver logs de PostgreSQL
docker-compose -f docker-compose.dev.yml logs postgres
```

### Error: "Migration failed"

Revertir migraciones y volver a ejecutar:

```bash
npm run migration:revert
npm run migration:run
```

### Tests Fallando

Limpiar base de datos de test y volver a ejecutar:

```bash
npm run test:e2e
```

## 📖 Documentación Adicional

- [Arquitectura](docs/steering/architecture.md)
- [Bounded Contexts](docs/steering/bounded-contexts.md)
- [CQRS](docs/steering/cqrs.md)
- [DDD Patterns](docs/steering/ddd-patterns.md)
- [NestJS Patterns](docs/steering/nestjs-patterns.md)
- [Naming Conventions](docs/steering/naming-conventions.md)
- [Git Workflow](docs/steering/git-workflow.md)

## 🤝 Contribuir

1. Fork el proyecto
2. Crear una rama para tu feature (`git checkout -b feature/amazing-feature`)
3. Commit tus cambios (`git commit -m 'feat: add amazing feature'`)
4. Push a la rama (`git push origin feature/amazing-feature`)
5. Abrir un Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo [LICENSE](LICENSE) para más detalles.

## 👥 Autores

- **Bryan Stevens** - _Desarrollo Inicial_ - [cryptoganster](https://github.com/cryptoganster)

## 🔐 Autenticación y Autorización

### Sistema de Roles

El sistema implementa un modelo de autenticación basado en roles múltiples, donde un usuario puede tener varios roles simultáneamente:

#### Roles Disponibles

- **`BUSINESS_OWNER`**: Dueño de negocio, puede administrar servicios, horarios y ver citas
- **`CUSTOMER`**: Cliente que agenda citas (futuro: panel web para clientes)
- **`ADMIN`**: Administrador del sistema con permisos completos

#### Registro de Usuario

```bash
POST /api/auth/register
Content-Type: application/json

{
  "email": "usuario@example.com",
  "password": "password123",
  "name": "Juan Pérez",
  "initialRole": "BUSINESS_OWNER"  // Opcional, default: BUSINESS_OWNER
}
```

**Respuesta:**
```json
{
  "user": {
    "id": "uuid",
    "email": "usuario@example.com",
    "name": "Juan Pérez",
    "roles": ["BUSINESS_OWNER"],
    "isActive": true,
    "emailVerified": false
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Login

```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "usuario@example.com",
  "password": "password123"
}
```

**Respuesta:**
```json
{
  "user": {
    "id": "uuid",
    "email": "usuario@example.com",
    "name": "Juan Pérez",
    "roles": ["BUSINESS_OWNER", "CUSTOMER"],
    "isActive": true,
    "emailVerified": true
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### JWT Payload

El token JWT contiene:

```json
{
  "userId": "uuid",
  "email": "usuario@example.com",
  "roles": ["BUSINESS_OWNER", "CUSTOMER"],
  "iat": 1734480000,
  "exp": 1734566400
}
```

**Nota:** El JWT **NO** contiene `businessId`. Para obtener el negocio de un usuario, usar el endpoint correspondiente del Business BC.

### Gestión de Roles

#### Agregar Rol a Usuario

```bash
POST /api/auth/users/:userId/roles
Authorization: Bearer {token}
Content-Type: application/json

{
  "role": "CUSTOMER"
}
```

**Reglas:**
- No se puede agregar un rol que el usuario ya tiene
- El usuario debe existir y estar activo

#### Remover Rol de Usuario

```bash
DELETE /api/auth/users/:userId/roles/:role
Authorization: Bearer {token}
```

**Reglas:**
- No se puede remover el último rol de un usuario
- El usuario siempre debe tener al menos un rol

### Autorización Basada en Roles

#### Proteger Endpoints con Guards

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@auth/infra/guards/jwt-auth.guard';
import { RolesGuard } from '@auth/infra/guards/roles.guard';
import { Roles } from '@auth/presentation/decorators/roles.decorator';
import { UserRole } from '@auth/domain/vo/user-role';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  
  @Get('dashboard')
  @Roles(UserRole.ADMIN)
  getDashboard() {
    // Solo accesible para usuarios con rol ADMIN
    return { message: 'Admin dashboard' };
  }
  
  @Get('business-stats')
  @Roles(UserRole.BUSINESS_OWNER, UserRole.ADMIN)
  getBusinessStats() {
    // Accesible para BUSINESS_OWNER o ADMIN
    return { message: 'Business statistics' };
  }
}
```

#### Obtener Usuario Actual

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@auth/infra/guards/jwt-auth.guard';
import { CurrentUser } from '@auth/presentation/decorators/current-user.decorator';
import { UserPayload } from '@auth/presentation/decorators/current-user.decorator';

@Controller('profile')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  
  @Get()
  getProfile(@CurrentUser() user: UserPayload) {
    // user contiene: { userId, email, roles }
    return {
      id: user.userId,
      email: user.email,
      roles: user.roles,
    };
  }
}
```

### Verificación de Email

```bash
POST /api/auth/verify-email
Authorization: Bearer {token}
Content-Type: application/json

{
  "userId": "uuid"
}
```

**Reglas:**
- Solo se puede verificar una vez
- Intentar verificar un email ya verificado lanza `EmailAlreadyVerifiedException`

### Activación/Desactivación de Cuenta

#### Desactivar Usuario

```bash
POST /api/auth/users/:userId/deactivate
Authorization: Bearer {token}
```

#### Activar Usuario

```bash
POST /api/auth/users/:userId/activate
Authorization: Bearer {token}
```

**Reglas:**
- Usuarios desactivados no pueden hacer login
- Las operaciones son idempotentes (no fallan si ya están en ese estado)

### Integración con Otros BCs

#### Account BC

Cuando un usuario se registra con rol `BUSINESS_OWNER`, el Account BC automáticamente:
1. Escucha el evento `UserRegistered`
2. Crea un `BusinessOwner` vinculado al usuario
3. Asigna plan de suscripción inicial (FREE)

#### Customer BC

Cuando un cliente anónimo se vincula a un usuario:
1. Customer BC publica evento `CustomerLinkedToUser`
2. Auth BC escucha el evento
3. Agrega automáticamente el rol `CUSTOMER` al usuario

### Arquitectura de Identidades

El sistema sigue una arquitectura unificada de identidades:

```
User (Auth BC) → Identidad Universal
    ↓                           ↓
BusinessOwner (Account)    Customer (Customer)
    ↓                           ↓
Business (Business)        Appointment (Booking)
```

**Beneficios:**
- Un usuario puede ser proveedor (BUSINESS_OWNER) y consumidor (CUSTOMER) simultáneamente
- Preparado para marketplace: Juan (abogado) publica servicios Y agenda cita con dentista
- Separación clara de concerns: User = autenticación, BusinessOwner = cuenta, Business = negocio

Para más detalles, ver: `.kiro/steering/user-customer-businessowner-architecture.md`

## 📡 WebSocket Events API

El sistema emite eventos en tiempo real vía WebSocket para notificar cambios a los clientes conectados.

### Conexión

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', {
  auth: {
    token: 'your-jwt-token'
  }
});

// El servidor automáticamente une al cliente a la room de su negocio
// Room: business:{businessId}
```

### Eventos de Offering

#### `offering:created`

Emitido cuando se crea un nuevo servicio.

**Payload:**
```typescript
{
  offeringId: string;        // UUID del offering
  name: string;              // Nombre del servicio
  durationMinutes: number;   // Duración en minutos
  maxCapacityPerSlot: number; // Capacidad máxima por slot
  maxDailyCapacity: number | null; // Límite diario (opcional)
  timestamp: string;         // ISO 8601 timestamp
}
```

**Ejemplo:**
```javascript
socket.on('offering:created', (data) => {
  console.log('Nuevo servicio creado:', data);
  // Actualizar UI, invalidar cache, etc.
});
```

#### `offering:updated`

Emitido cuando se actualiza un servicio existente.

**Payload:**
```typescript
{
  offeringId: string;        // UUID del offering
  name: string;              // Nombre actualizado
  durationMinutes: number;   // Duración actualizada
  maxCapacityPerSlot: number; // Capacidad actualizada
  maxDailyCapacity: number | null; // Límite diario actualizado
  timestamp: string;         // ISO 8601 timestamp
}
```

**Ejemplo:**
```javascript
socket.on('offering:updated', (data) => {
  console.log('Servicio actualizado:', data);
  // Actualizar servicio en UI
});
```

#### `offering:deactivated`

Emitido cuando se desactiva un servicio.

**Payload:**
```typescript
{
  offeringId: string;  // UUID del offering desactivado
  timestamp: string;   // ISO 8601 timestamp
}
```

**Ejemplo:**
```javascript
socket.on('offering:deactivated', (data) => {
  console.log('Servicio desactivado:', data);
  // Marcar servicio como inactivo en UI
});
```

#### `offering:activated`

Emitido cuando se reactiva un servicio previamente desactivado.

**Payload:**
```typescript
{
  offeringId: string;  // UUID del offering activado
  timestamp: string;   // ISO 8601 timestamp
}
```

**Ejemplo:**
```javascript
socket.on('offering:activated', (data) => {
  console.log('Servicio activado:', data);
  // Marcar servicio como activo en UI
});
```

### Eventos de Appointment

#### `appointment:created`

Emitido cuando se crea una nueva cita.

**Payload:**
```typescript
{
  appointmentId: string;  // UUID de la cita
  customerId: string;     // UUID del cliente
  offeringId: string;     // UUID del servicio
  dateTime: string;       // ISO 8601 timestamp de la cita
  timestamp: string;      // ISO 8601 timestamp del evento
}
```

#### `appointment:cancelled`

Emitido cuando se cancela una cita.

**Payload:**
```typescript
{
  appointmentId: string;  // UUID de la cita cancelada
  timestamp: string;      // ISO 8601 timestamp
}
```

**Nota:** Este evento se broadcast a todos los clientes conectados (no solo al negocio) debido a limitaciones del evento de dominio. Los clientes deben filtrar por `appointmentId`.

#### `appointment:modified`

Emitido cuando se modifica una cita existente.

**Payload:**
```typescript
{
  appointmentId: string;  // UUID de la cita
  newDateTime: string;    // Nueva fecha/hora (ISO 8601)
  timestamp: string;      // ISO 8601 timestamp
}
```

**Nota:** Este evento se broadcast a todos los clientes conectados (no solo al negocio) debido a limitaciones del evento de dominio. Los clientes deben filtrar por `appointmentId`.

### Multi-Tenancy

Los eventos de Offering se emiten **solo a los clientes del mismo negocio** (room `business:{businessId}`), garantizando aislamiento de datos entre tenants.

Los eventos de Appointment actualmente se emiten a todos los clientes debido a limitaciones en los eventos de dominio (no incluyen `businessId`). Esto será mejorado en versiones futuras.

### Manejo de Errores

```javascript
socket.on('connect_error', (error) => {
  console.error('Error de conexión:', error);
});

socket.on('error', (error) => {
  console.error('Error de WebSocket:', error);
});
```

### Ejemplo Completo

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', {
  auth: {
    token: localStorage.getItem('jwt-token')
  }
});

// Escuchar eventos de offerings
socket.on('offering:created', (data) => {
  // Agregar nuevo offering a la lista
  addOfferingToUI(data);
});

socket.on('offering:updated', (data) => {
  // Actualizar offering en la lista
  updateOfferingInUI(data);
});

socket.on('offering:deactivated', (data) => {
  // Marcar como inactivo
  markOfferingAsInactive(data.offeringId);
});

socket.on('offering:activated', (data) => {
  // Marcar como activo
  markOfferingAsActive(data.offeringId);
});

// Escuchar eventos de appointments
socket.on('appointment:created', (data) => {
  // Agregar nueva cita al calendario
  addAppointmentToCalendar(data);
});

socket.on('appointment:cancelled', (data) => {
  // Remover cita del calendario
  removeAppointmentFromCalendar(data.appointmentId);
});

socket.on('appointment:modified', (data) => {
  // Actualizar cita en el calendario
  updateAppointmentInCalendar(data);
});

// Manejo de errores
socket.on('connect_error', (error) => {
  console.error('Error de conexión:', error);
  showErrorNotification('No se pudo conectar al servidor');
});
```

## 🙏 Agradecimientos

- NestJS por el excelente framework
- La comunidad de DDD y CQRS por los patrones y mejores prácticas
- fast-check por la librería de property-based testing

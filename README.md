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
│   ├── domain/              # Aggregates, Events, Value Objects
│   ├── app/                 # Commands, Queries, Event Handlers
│   ├── infra/               # Repositories, Mappers, Guards
│   └── presentation/        # Controllers, DTOs
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

1. **Auth**: Gestión de autenticación y autorización (JWT)
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
import { VersionedAggregateRoot } from '@shared/kernel/versioned-aggregate-root';
import { UUID } from '@shared/vo/uuid';

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
import { Command } from '@nestjs/cqrs';

export class MiCommand extends Command<{ id: string }> {
  constructor(public readonly param: string) {
    super();
  }
}

// src/nuevo-bc/app/commands/mi-command/handler.ts
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

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
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

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
import { NuevoBcModule } from './nuevo-bc/nuevo-bc.module';

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

- **Bryan Stevens** - *Desarrollo Inicial* - [cryptoganster](https://github.com/cryptoganster)

## 🙏 Agradecimientos

- NestJS por el excelente framework
- La comunidad de DDD y CQRS por los patrones y mejores prácticas
- fast-check por la librería de property-based testing

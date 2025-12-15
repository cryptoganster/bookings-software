---
inclusion: always
---

# Stack Tecnológico

Este documento define el stack tecnológico oficial del proyecto Sistema de Reservas Multi-Tenant vía WhatsApp.

## Backend Framework

### NestJS v10.x
- Framework principal para Node.js con TypeScript
- Arquitectura modular basada en decoradores
- Dependency Injection nativo
- Soporte completo para CQRS con `@nestjs/cqrs`
- Integración con TypeORM para persistencia
- **HTTP Adapter:** Fastify (mejor performance que Express)
- **Logger:** Pino (logging estructurado de alto rendimiento)

**Razón de elección:**
- Estructura opinada que facilita Clean Architecture
- Excelente soporte para DDD y CQRS
- Ecosistema maduro con módulos oficiales
- TypeScript first-class citizen
- Fastify ofrece mejor performance y menor overhead
- Pino es el logger más rápido para Node.js

## Base de Datos

### PostgreSQL v14+
- Base de datos relacional principal
- Soporte para transacciones ACID
- Índices avanzados para optimización
- JSON/JSONB para datos semi-estructurados

**Configuración:**
- Usar TypeORM como ORM
- Migraciones versionadas
- Índices en campos críticos (businessId, customerId, offeringId, date)

## ORM y Persistencia

### TypeORM v0.3.x
- ORM oficial recomendado por NestJS
- Soporte para migraciones
- Query Builder para queries complejas
- Decoradores para definir entidades

**Patrones a usar:**
- Repository Pattern para acceso a datos
- Separación Write/Read repositories (CQRS)
- Unit of Work para transacciones

## Mensajería

### WhatsApp Business API (Oficial)
- API REST oficial de Meta
- Webhooks para recepción en tiempo real
- Soporte para mensajes interactivos (botones)
- Envío de ubicaciones y multimedia

**Cliente HTTP:**
- Axios v1.x para llamadas HTTP
- Retry logic con exponential backoff
- Validación de firma de webhooks

## Autenticación y Seguridad

### JWT (JSON Web Tokens)
- `@nestjs/jwt` v10.x
- `@nestjs/passport` v10.x
- `passport-jwt` v4.x

### Hashing de Passwords
- `bcrypt` v5.x
- Salt rounds: 10

### Validación
- `class-validator` v0.14.x
- `class-transformer` v0.5.x

## Utilidades

### Manejo de Fechas
- `date-fns` v2.x - Manipulación de fechas
- `date-fns-tz` v2.x - Soporte para zonas horarias
- **Regla:** Almacenar siempre en UTC, convertir en presentación

### Identificadores
- `uuid` v9.x - Generación de UUIDs v4

### Logging
- `nestjs-pino` v3.x - Integración de Pino con NestJS
- `pino-http` - HTTP logging middleware
- `pino-pretty` - Formato legible para desarrollo
- Formato JSON para producción
- Formato pretty colorizado para desarrollo

## Testing

### Framework de Testing
- **Jest** - Incluido con NestJS
- **Supertest** - Tests E2E de HTTP
- **fast-check** - Property-based testing

### Cobertura Mínima
- Unit tests: > 80% en domain layer
- Integration tests: Todos los handlers
- Property tests: Lógica crítica de negocio
- E2E tests: Flujos principales

## Arquitectura y Patrones

### CQRS
- `@nestjs/cqrs` v10.x
- CommandBus, QueryBus, EventBus
- Separación estricta lectura/escritura

### Event-Driven
- Domain Events
- Event Handlers asíncronos
- Sagas para orquestación

### Reactive Programming
- `rxjs` v7.x - Incluido con NestJS
- Usado en Sagas y Event Streams

## Dependencias Principales

```json
{
  "@nestjs/common": "^10.x",
  "@nestjs/core": "^10.x",
  "@nestjs/platform-fastify": "^10.x",
  "@nestjs/cqrs": "^10.x",
  "@nestjs/typeorm": "^10.x",
  "@nestjs/config": "^3.x",
  "@nestjs/jwt": "^10.x",
  "@nestjs/passport": "^10.x",
  "@nestjs/terminus": "^10.x",
  "typeorm": "^0.3.x",
  "pg": "^8.x",
  "passport-jwt": "^4.x",
  "bcrypt": "^5.x",
  "class-validator": "^0.14.x",
  "class-transformer": "^0.5.x",
  "date-fns": "^2.x",
  "date-fns-tz": "^2.x",
  "uuid": "^9.x",
  "axios": "^1.x",
  "nestjs-pino": "^3.x",
  "pino-http": "^8.x",
  "pino-pretty": "^10.x",
  "rxjs": "^7.x",
  "reflect-metadata": "^0.1.x"
}
```

## Dependencias de Desarrollo

```json
{
  "@types/node": "^20.x",
  "@types/jest": "^29.x",
  "@types/bcrypt": "^5.x",
  "@types/uuid": "^9.x",
  "@types/passport-jwt": "^3.x",
  "@types/supertest": "^2.x",
  "@typescript-eslint/eslint-plugin": "^6.x",
  "@typescript-eslint/parser": "^6.x",
  "eslint": "^8.x",
  "prettier": "^3.x",
  "ts-node": "^10.x",
  "typescript": "^5.x",
  "fast-check": "^3.x",
  "supertest": "^6.x"
}
```

## Configuración de TypeScript

```json
{
  "compilerOptions": {
    "target": "ES2021",
    "module": "commonjs",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "sourceMap": true,
    "outDir": "./dist",
    "baseUrl": "./",
    "incremental": true,
    "paths": {
      "@shared/*": ["src/shared/*"],
      "@booking/*": ["src/booking/*"],
      "@messaging/*": ["src/messaging/*"],
      "@auth/*": ["src/auth/*"]
    }
  }
}
```

## Variables de Entorno Requeridas

```bash
# Application
NODE_ENV=development|production
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=
DB_DATABASE=bookings_dev

# JWT
JWT_SECRET=
JWT_EXPIRATION=1d

# WhatsApp Business API
WHATSAPP_API_URL=https://graph.facebook.com/v18.0/PHONE_NUMBER_ID
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_WEBHOOK_VERIFY_TOKEN=

# Logging
LOG_LEVEL=debug|info|warn|error
```

## Comandos NPM Estándar

```bash
# Desarrollo
npm run start:dev          # Inicia con hot-reload
npm run start:debug        # Inicia con debugger

# Producción
npm run build              # Compila TypeScript
npm run start:prod         # Inicia versión compilada

# Testing
npm run test               # Tests unitarios
npm run test:watch         # Tests en modo watch
npm run test:cov           # Tests con cobertura
npm run test:e2e           # Tests end-to-end

# Base de datos
npm run migration:generate # Genera migración
npm run migration:run      # Ejecuta migraciones
npm run migration:revert   # Revierte última migración
npm run seed               # Ejecuta seeders

# Calidad de código
npm run lint               # Ejecuta ESLint
npm run format             # Formatea con Prettier
```

## Reglas de Versionado

- Usar Semantic Versioning (SemVer)
- Major: Cambios breaking en API
- Minor: Nuevas features compatibles
- Patch: Bug fixes

## Notas Importantes

1. **No usar `any` en TypeScript** - Siempre tipar correctamente
2. **Evitar `@ts-ignore`** - Resolver problemas de tipos correctamente
3. **Usar decoradores de NestJS** - `@Injectable()`, `@Controller()`, etc.
4. **Dependency Injection siempre** - No instanciar clases manualmente
5. **Interfaces para abstracciones** - Especialmente en repositories
6. **Configuración centralizada** - Usar `@nestjs/config`
7. **Validación en DTOs** - Usar `class-validator` decorators
8. **Logging estructurado** - JSON en producción, legible en desarrollo

---
inclusion: fileMatch
fileMatchPattern: "**/infra/**/*.ts,**/*.module.ts"
---

# Backend Technology Stack

**Backend technologies, frameworks, and libraries**

> **Cross-References:**
>
> - [20-nestjs-implementation.md](./20-nestjs-implementation.md) - NestJS patterns
> - [04-system-architecture.md](./04-system-architecture.md) - Architecture overview
> - [52-resilience-patterns.md](./52-resilience-patterns.md) - Resilience patterns

---

# Backend Technology Stack

Este documento define el stack tecnológico del backend (NestJS).

## Core Framework

### NestJS (v10.x)

**Propósito:** Framework principal para backend  
**Características:**

- TypeScript first-class support
- Dependency Injection nativo
- Modular architecture
- CQRS nativo (`@nestjs/cqrs`)
- Decorators para routing, validation, guards

**Instalación:**

```bash
npm install @nestjs/core @nestjs/common @nestjs/platform-express
```

**Uso:**

```typescript
import { Module } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";

@Module({
  imports: [],
  controllers: [],
  providers: [],
})
export class AppModule {}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
}
bootstrap();
```

---

## Database

### PostgreSQL (v15+)

**Propósito:** Base de datos relacional principal  
**Características:**

- ACID completo
- JSON support (JSONB)
- Índices avanzados (B-tree, GiST, GIN)
- Full-text search
- Transacciones robustas

**Conexión:**

```typescript
import { TypeOrmModule } from "@nestjs/typeorm";

TypeOrmModule.forRoot({
  type: "postgres",
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [__dirname + "/**/*.model{.ts,.js}"],
  synchronize: false, // ❌ Never true in production
  logging: process.env.NODE_ENV === "development",
});
```

### TypeORM (v0.3.x)

**Propósito:** ORM para PostgreSQL  
**Características:**

- Entity mapping
- Query builder
- Migrations
- Transactions
- Repository pattern

**Instalación:**

```bash
npm install typeorm @nestjs/typeorm pg
```

**Entity Example:**

```typescript
import { Entity, Column, PrimaryColumn, CreateDateColumn } from "typeorm";

@Entity("appointments")
export class AppointmentModel {
  @PrimaryColumn("uuid")
  id: string;

  @Column("uuid")
  businessId: string;

  @Column("timestamp")
  dateTime: Date;

  @Column("varchar")
  status: string;

  @Column("int", { default: 0 })
  version: number;

  @CreateDateColumn()
  createdAt: Date;
}
```

---

## CQRS & Event Sourcing

### @nestjs/cqrs (v10.x)

**Propósito:** CQRS pattern implementation  
**Características:**

- CommandBus, QueryBus, EventBus
- Command/Query handlers
- Event handlers
- Sagas (Process Managers)

**Instalación:**

```bash
npm install @nestjs/cqrs
```

**Uso:**

```typescript
import { Module } from "@nestjs/common";
import { CqrsModule } from "@nestjs/cqrs";

@Module({
  imports: [CqrsModule],
  providers: [
    CreateAppointmentHandler,
    GetAppointmentHandler,
    OnAppointmentCreatedHandler,
  ],
})
export class BookingModule {}
```

**Command Example:**

```typescript
import { Command } from "@nestjs/cqrs";

export class CreateAppointmentCommand extends Command<{
  appointmentId: string;
}> {
  constructor(
    public readonly businessId: string,
    public readonly customerId: string,
    public readonly offeringId: string,
    public readonly dateTime: Date,
  ) {
    super();
  }
}
```

**Handler Example:**

```typescript
import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";

@CommandHandler(CreateAppointmentCommand)
export class CreateAppointmentHandler implements ICommandHandler<CreateAppointmentCommand> {
  async execute(
    command: CreateAppointmentCommand,
  ): Promise<{ appointmentId: string }> {
    // Implementation
  }
}
```

---

## Validation

### class-validator (v0.14.x)

**Propósito:** Validación de DTOs  
**Características:**

- Decorator-based validation
- Custom validators
- Nested validation
- Transformation

**Instalación:**

```bash
npm install class-validator class-transformer
```

**Uso:**

```typescript
import { IsUUID, IsNotEmpty, IsISO8601 } from "class-validator";

export class CreateAppointmentDto {
  @IsUUID()
  @IsNotEmpty()
  businessId: string;

  @IsUUID()
  @IsNotEmpty()
  customerId: string;

  @IsISO8601()
  @IsNotEmpty()
  dateTime: string;
}
```

**Global Validation Pipe:**

```typescript
import { ValidationPipe } from "@nestjs/common";

app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }),
);
```

---

## Authentication & Security

### @nestjs/jwt (v10.x)

**Propósito:** JWT authentication  
**Características:**

- Token generation
- Token verification
- Refresh tokens
- Expiration handling

**Instalación:**

```bash
npm install @nestjs/jwt @nestjs/passport passport passport-jwt
```

**Configuración:**

```typescript
import { JwtModule } from "@nestjs/jwt";

JwtModule.register({
  secret: process.env.JWT_SECRET,
  signOptions: { expiresIn: "1h" },
});
```

### bcrypt (v5.x)

**Propósito:** Password hashing  
**Características:**

- Secure hashing
- Salt generation
- Comparison

**Instalación:**

```bash
npm install bcrypt
npm install -D @types/bcrypt
```

**Uso:**

```typescript
import * as bcrypt from "bcrypt";

// Hash password
const hashedPassword = await bcrypt.hash(plainPassword, 10);

// Compare password
const isMatch = await bcrypt.compare(plainPassword, hashedPassword);
```

---

## Logging

### nestjs-pino (v3.x)

**Propósito:** Structured logging  
**Características:**

- JSON logging
- Request ID tracking
- Performance logging
- Log levels

**Instalación:**

```bash
npm install nestjs-pino pino-http
```

**Configuración:**

```typescript
import { LoggerModule } from "nestjs-pino";

LoggerModule.forRoot({
  pinoHttp: {
    level: process.env.LOG_LEVEL || "info",
    transport:
      process.env.NODE_ENV === "development"
        ? { target: "pino-pretty" }
        : undefined,
  },
});
```

**Uso:**

```typescript
import { PinoLogger } from "nestjs-pino";

@Injectable()
export class MyService {
  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(MyService.name);
  }

  doSomething() {
    this.logger.info({ data: "value" }, "Doing something");
  }
}
```

---

## Date & Time

### date-fns (v2.x)

**Propósito:** Date manipulation  
**Características:**

- Immutable
- Tree-shakeable
- Timezone support (with date-fns-tz)
- Locale support

**Instalación:**

```bash
npm install date-fns date-fns-tz
```

**Uso:**

```typescript
import { format, addHours, isBefore } from "date-fns";
import { utcToZonedTime, zonedTimeToUtc } from "date-fns-tz";

// Format date
const formatted = format(new Date(), "yyyy-MM-dd HH:mm:ss");

// Add hours
const futureDate = addHours(new Date(), 24);

// Compare dates
const isPast = isBefore(date, new Date());

// Timezone conversion
const zonedDate = utcToZonedTime(new Date(), "America/Santo_Domingo");
```

---

## HTTP Client

### axios (v1.x)

**Propósito:** HTTP client para APIs externas  
**Características:**

- Promise-based
- Request/response interceptors
- Automatic JSON transformation
- Timeout support

**Instalación:**

```bash
npm install axios
```

**Uso:**

```typescript
import axios from "axios";

const response = await axios.post(
  "https://api.whatsapp.com/v1/messages",
  {
    to: "+18095551234",
    message: "Hello",
  },
  {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    timeout: 5000,
  },
);
```

---

## Configuration

### @nestjs/config (v3.x)

**Propósito:** Environment configuration  
**Características:**

- .env file support
- Validation
- Type-safe configuration
- Namespaces

**Instalación:**

```bash
npm install @nestjs/config
```

**Configuración:**

```typescript
import { ConfigModule } from "@nestjs/config";
import * as Joi from "joi";

ConfigModule.forRoot({
  isGlobal: true,
  envFilePath: ".env",
  validationSchema: Joi.object({
    NODE_ENV: Joi.string()
      .valid("development", "production", "test")
      .required(),
    PORT: Joi.number().default(3000),
    DATABASE_URL: Joi.string().required(),
    JWT_SECRET: Joi.string().required(),
  }),
});
```

**Uso:**

```typescript
import { ConfigService } from "@nestjs/config";

@Injectable()
export class MyService {
  constructor(private configService: ConfigService) {}

  getDatabaseUrl() {
    return this.configService.get<string>("DATABASE_URL");
  }
}
```

---

## Testing

### Jest (v29.x)

**Propósito:** Testing framework  
**Características:**

- Unit tests
- Integration tests
- Mocking
- Coverage reports

**Instalación:**

```bash
npm install -D jest @types/jest ts-jest
```

**Configuración:**

```json
{
  "jest": {
    "moduleFileExtensions": ["js", "json", "ts"],
    "rootDir": "src",
    "testRegex": ".*\\.spec\\.ts$",
    "transform": {
      "^.+\\.(t|j)s$": "ts-jest"
    },
    "collectCoverageFrom": ["**/*.(t|j)s"],
    "coverageDirectory": "../coverage",
    "testEnvironment": "node"
  }
}
```

### @nestjs/testing (v10.x)

**Propósito:** NestJS testing utilities  
**Características:**

- TestingModule
- Mock providers
- E2E testing

**Uso:**

```typescript
import { Test, TestingModule } from "@nestjs/testing";

describe("MyService", () => {
  let service: MyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MyService],
    }).compile();

    service = module.get<MyService>(MyService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
```

---

## Development Tools

### nodemon (v3.x)

**Propósito:** Hot reload en desarrollo  
**Características:**

- Auto-restart on file changes
- TypeScript support
- Custom watch patterns

**Instalación:**

```bash
npm install -D nodemon
```

**Configuración (nodemon.json):**

```json
{
  "watch": ["src"],
  "ext": "ts",
  "ignore": ["src/**/*.spec.ts"],
  "exec": "ts-node -r tsconfig-paths/register src/main.ts"
}
```

### ts-node (v10.x)

**Propósito:** TypeScript execution  
**Características:**

- Direct TypeScript execution
- No compilation step
- REPL support

**Instalación:**

```bash
npm install -D ts-node tsconfig-paths
```

---

## Utilities

### uuid (v9.x)

**Propósito:** UUID generation  
**Características:**

- v4 (random) UUIDs
- v5 (namespace) UUIDs
- Validation

**Instalación:**

```bash
npm install uuid
npm install -D @types/uuid
```

**Uso:**

```typescript
import { v4 as uuidv4 } from "uuid";

const id = uuidv4(); // '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d'
```

### RxJS (v7.x)

**Propósito:** Reactive programming  
**Características:**

- Observables
- Operators
- Subjects
- Used by @nestjs/cqrs for Sagas

**Instalación:**

```bash
npm install rxjs
```

**Uso (Sagas):**

```typescript
import { Injectable } from "@nestjs/common";
import { ICommand, ofType, Saga } from "@nestjs/cqrs";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";

@Injectable()
export class AppointmentSaga {
  @Saga()
  appointmentCreated = (events$: Observable<any>): Observable<ICommand> => {
    return events$.pipe(
      ofType(AppointmentCreated),
      map((event) => new ScheduleReminderCommand(event.appointmentId)),
    );
  };
}
```

---

## Package Manager

### pnpm (v8.x)

**Propósito:** Package manager para monorepo  
**Características:**

- Disk space efficient
- Fast installation
- Workspace support
- Strict dependency resolution

**Instalación:**

```bash
npm install -g pnpm
```

**Workspace Configuration (pnpm-workspace.yaml):**

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

**Comandos:**

```bash
# Install dependencies
pnpm install

# Run script in specific workspace
pnpm --filter backend dev

# Run script in all workspaces
pnpm -r test
```

---

## Version Requirements

| Package    | Version | Notes           |
| ---------- | ------- | --------------- |
| Node.js    | 18.x+   | LTS recommended |
| TypeScript | 5.x     | Latest stable   |
| NestJS     | 10.x    | Latest stable   |
| PostgreSQL | 15+     | Latest stable   |
| pnpm       | 8.x     | Latest stable   |

---

## Installation Commands

```bash
# Core dependencies
pnpm add @nestjs/core @nestjs/common @nestjs/platform-express
pnpm add @nestjs/cqrs @nestjs/typeorm typeorm pg
pnpm add @nestjs/config @nestjs/jwt @nestjs/passport
pnpm add passport passport-jwt bcrypt
pnpm add class-validator class-transformer
pnpm add date-fns date-fns-tz
pnpm add axios uuid rxjs
pnpm add nestjs-pino pino-http

# Dev dependencies
pnpm add -D @types/node @types/bcrypt @types/uuid
pnpm add -D typescript ts-node tsconfig-paths
pnpm add -D jest @types/jest ts-jest
pnpm add -D @nestjs/testing
pnpm add -D nodemon
```

---

## Environment Variables

```bash
# .env.example
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/bookings_db
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=password
DB_NAME=bookings_db

# JWT
JWT_SECRET=your-secret-key-here
JWT_EXPIRATION=1h

# WhatsApp
WHATSAPP_API_URL=https://api.whatsapp.com
WHATSAPP_API_TOKEN=your-token-here

# Logging
LOG_LEVEL=info
```

---

## Troubleshooting

### TypeORM Connection Issues

**Problema:** Cannot connect to database

**Solución:**

```bash
# Verify PostgreSQL is running
psql -h localhost -U postgres -d bookings_db

# Check connection string
echo $DATABASE_URL
```

### Module Resolution Issues

**Problema:** Cannot find module '@shared/...'

**Solución:**

```json
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": "./",
    "paths": {
      "@shared/*": ["src/shared/*"],
      "@booking/*": ["src/booking/*"]
    }
  }
}
```

### Hot Reload Not Working

**Problema:** Changes not detected

**Solución:**

```bash
# Restart nodemon
pnpm --filter backend dev

# Check nodemon.json configuration
cat nodemon.json
```

---

**Last Updated:** January 9, 2026  
**Status:** Active

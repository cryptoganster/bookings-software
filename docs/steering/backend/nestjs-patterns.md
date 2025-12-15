---
inclusion: always
---

# NestJS Patterns y Best Practices

Este documento define los patrones y mejores prácticas para usar NestJS en el proyecto.

## Módulos (Modules)

### Estructura de Módulo

```typescript
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    CqrsModule,                              // CQRS support
    TypeOrmModule.forFeature([...models]),   // TypeORM entities
  ],
  controllers: [...controllers],             // REST controllers
  providers: [
    ...commandHandlers,                      // Command handlers
    ...queryHandlers,                        // Query handlers
    ...eventHandlers,                        // Event handlers
    ...sagas,                                // Sagas
    ...repositories,                         // Repositories con DI
  ],
  exports: [                                 // Exportar para otros módulos
    'IAppointmentWriteRepository',
    'IAppointmentReadRepository',
  ],
})
export class BookingModule {}
```

### Reglas de Módulos

1. **Un BC = Un Módulo**
2. **Imports mínimos** - Solo lo necesario
3. **Exports explícitos** - Solo interfaces, no implementaciones
4. **Global solo SharedModule** - Resto son feature modules

## Dependency Injection

### Inyección por Constructor

```typescript
@Injectable()
export class CreateAppointmentHandler {
  constructor(
    private readonly appointmentRepo: IAppointmentWriteRepository,
    private readonly capacityRepo: ICapacityWriteRepository,
    private readonly uow: IUnitOfWork,
  ) {}
}
```

### Inyección de Interfaces

```typescript
// En module
providers: [
  {
    provide: 'IAppointmentWriteRepository',
    useClass: AppointmentWriteRepository,
  },
]

// En clase
constructor(
  @Inject('IAppointmentWriteRepository')
  private readonly repo: IAppointmentWriteRepository,
) {}
```

### Scopes

**Default: SINGLETON** - Usar siempre que sea posible

```typescript
@Injectable({ scope: Scope.DEFAULT })  // Singleton (default)
```

**REQUEST scope** - Solo si absolutamente necesario (performance impact)

## Controllers

### Estructura de Controller

```typescript
import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard';
import { CurrentUser } from '@auth/decorators/current-user.decorator';

@Controller('appointments')
@UseGuards(JwtAuthGuard)  // Proteger todo el controller
export class AppointmentController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}
  
  @Post()
  async create(
    @Body() dto: CreateAppointmentDto,
    @CurrentUser() user: UserPayload,
  ) {
    const result = await this.commandBus.execute(
      new CreateAppointmentCommand(
        user.businessId,
        dto.customerId,
        dto.offeringId,
        dto.dateTime,
      )
    );
    return result;
  }
  
  @Get()
  async findAll(@CurrentUser() user: UserPayload) {
    return this.queryBus.execute(
      new GetBusinessAppointmentsQuery(user.businessId)
    );
  }
  
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.queryBus.execute(
      new GetAppointmentQuery(id)
    );
  }
  
  @Delete(':id')
  async cancel(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    await this.commandBus.execute(
      new CancelAppointmentCommand(id, user.userId)
    );
    return { message: 'Appointment cancelled successfully' };
  }
}
```

### Reglas de Controllers

1. **Delgados** - Solo validación y delegación
2. **No lógica de negocio** - Usar CommandBus/QueryBus
3. **DTOs para validación** - class-validator
4. **Guards para autenticación** - JwtAuthGuard
5. **Decorators para extracción** - @CurrentUser, @Param, @Body

## DTOs (Data Transfer Objects)

### DTO con Validación

```typescript
import { IsString, IsUUID, IsDate, IsNotEmpty, MinDate } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateAppointmentDto {
  @IsUUID()
  @IsNotEmpty()
  customerId: string;
  
  @IsUUID()
  @IsNotEmpty()
  offeringId: string;
  
  @IsDate()
  @Type(() => Date)
  @MinDate(new Date())
  dateTime: Date;
}
```

### Reglas de DTOs

1. **Validación completa** - Usar decoradores de class-validator
2. **Transformación** - Usar class-transformer cuando sea necesario
3. **Inmutables** - readonly properties
4. **Específicos** - Un DTO por endpoint
5. **No lógica** - Solo datos y validación

## Guards

### JWT Auth Guard

```typescript
import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }
}
```

### Custom Guard

```typescript
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';

@Injectable()
export class WhatsAppSignatureGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    // Validar firma
    return isValid;
  }
}
```

## Interceptors

### Logging con Pino

### Configuración de Pino Logger

```typescript
// src/main.ts
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
    { bufferLogs: true }
  );
  
  // Usar Pino como logger
  app.useLogger(app.get(Logger));
  
  await app.listen(3000, '0.0.0.0');
}
bootstrap();
```

### Configuración del LoggerModule

```typescript
// src/app.module.ts
import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        transport: process.env.NODE_ENV !== 'production' ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
        } : undefined,
        level: process.env.LOG_LEVEL || 'info',
        serializers: {
          req: (req) => ({
            id: req.id,
            method: req.method,
            url: req.url,
          }),
          res: (res) => ({
            statusCode: res.statusCode,
          }),
        },
      },
    }),
  ],
})
export class AppModule {}
```

### Uso del Logger en Services

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';

@Injectable()
export class AppointmentService {
  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(AppointmentService.name);
  }
  
  async createAppointment(data: any) {
    this.logger.info({ data }, 'Creating appointment');
    
    try {
      // Lógica de negocio
      this.logger.info({ appointmentId: result.id }, 'Appointment created successfully');
      return result;
    } catch (error) {
      this.logger.error({ error, data }, 'Failed to create appointment');
      throw error;
    }
  }
}
```

## Exception Filters

### Domain Exception Filter

```typescript
import { ExceptionFilter, Catch, ArgumentsHost, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { DomainException } from '@shared/kernel/exceptions/domain.exception';

@Catch(DomainException)
export class DomainExceptionFilter implements ExceptionFilter {
  catch(exception: DomainException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    
    const statusCode = this.getStatusCode(exception);
    
    response.status(statusCode).json({
      statusCode,
      message: exception.message,
      error: exception.name,
      timestamp: new Date().toISOString(),
    });
  }
  
  private getStatusCode(exception: DomainException): number {
    // Mapear excepciones a códigos HTTP
    if (exception instanceof AppointmentNotFoundException) {
      return HttpStatus.NOT_FOUND;
    }
    if (exception instanceof NoAvailableSlotsException) {
      return HttpStatus.CONFLICT;
    }
    return HttpStatus.BAD_REQUEST;
  }
}
```

### Registro Global

```typescript
// main.ts
app.useGlobalFilters(new DomainExceptionFilter());
```

## Pipes

### Validation Pipe

```typescript
// main.ts
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,              // Remover propiedades no decoradas
    forbidNonWhitelisted: true,   // Lanzar error si hay propiedades extra
    transform: true,              // Transformar a tipos correctos
    transformOptions: {
      enableImplicitConversion: true,
    },
  })
);
```

## Decorators Personalizados

### Current User Decorator

```typescript
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
```

### Uso

```typescript
@Get()
async findAll(@CurrentUser() user: UserPayload) {
  // user está disponible
}
```

## CQRS con NestJS

### Command

```typescript
import { Command } from '@nestjs/cqrs';

export class CreateAppointmentCommand extends Command<{ appointmentId: string }> {
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

### Command Handler

```typescript
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

@CommandHandler(CreateAppointmentCommand)
export class CreateAppointmentHandler 
  implements ICommandHandler<CreateAppointmentCommand> {
  
  constructor(
    private readonly repo: IAppointmentWriteRepository,
    private readonly uow: IUnitOfWork,
  ) {}
  
  async execute(command: CreateAppointmentCommand): Promise<{ appointmentId: string }> {
    // Lógica del handler
    return { appointmentId: 'uuid' };
  }
}
```

### Query

```typescript
import { Query } from '@nestjs/cqrs';

export class GetAppointmentQuery extends Query<AppointmentReadModel> {
  constructor(public readonly appointmentId: string) {
    super();
  }
}
```

### Query Handler

```typescript
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';

@QueryHandler(GetAppointmentQuery)
export class GetAppointmentHandler 
  implements IQueryHandler<GetAppointmentQuery> {
  
  constructor(
    private readonly repo: IAppointmentReadRepository
  ) {}
  
  async execute(query: GetAppointmentQuery): Promise<AppointmentReadModel> {
    return this.repo.findById(query.appointmentId);
  }
}
```

### Event Handler

```typescript
import { EventsHandler, IEventHandler, CommandBus } from '@nestjs/cqrs';

@EventsHandler(AppointmentCreated)
export class OnAppointmentCreatedHandler 
  implements IEventHandler<AppointmentCreated> {
  
  constructor(private readonly commandBus: CommandBus) {}
  
  async handle(event: AppointmentCreated) {
    try {
      await this.commandBus.execute(
        new ScheduleReminderCommand(event.appointmentId, event.dateTime)
      );
    } catch (error) {
      // Log pero no propagar
      console.error('Error handling AppointmentCreated:', error);
    }
  }
}
```

### Saga

```typescript
import { Injectable } from '@nestjs/common';
import { Saga, ofType } from '@nestjs/cqrs';
import { Observable, map } from 'rxjs';
import { ICommand } from '@nestjs/cqrs';

@Injectable()
export class AppointmentNotificationSaga {
  @Saga()
  appointmentCreated = (events$: Observable<any>): Observable<ICommand> => {
    return events$.pipe(
      ofType(AppointmentCreated),
      map((event) => new ScheduleReminderCommand(
        event.appointmentId,
        event.dateTime
      ))
    );
  };
}
```

## Configuration

### ConfigModule

```typescript
// app.module.ts
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validationSchema: Joi.object({
        NODE_ENV: Joi.string().valid('development', 'production', 'test'),
        PORT: Joi.number().default(3000),
        DB_HOST: Joi.string().required(),
        // ... más validaciones
      }),
    }),
  ],
})
export class AppModule {}
```

### Uso de ConfigService

```typescript
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SomeService {
  constructor(private configService: ConfigService) {
    const dbHost = this.configService.get<string>('DB_HOST');
    const port = this.configService.get<number>('PORT', 3000); // con default
  }
}
```

## TypeORM Integration

### Module Setup

```typescript
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT, 10),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      autoLoadEntities: true,
      synchronize: process.env.NODE_ENV === 'development',
    }),
  ],
})
export class AppModule {}
```

### Feature Module

```typescript
@Module({
  imports: [
    TypeOrmModule.forFeature([AppointmentModel, CapacityModel]),
  ],
  providers: [...],
})
export class BookingModule {}
```

### Repository Injection

```typescript
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class AppointmentWriteRepository {
  constructor(
    @InjectRepository(AppointmentModel)
    private readonly repository: Repository<AppointmentModel>,
  ) {}
}
```

## Testing

### Unit Test

```typescript
import { Test, TestingModule } from '@nestjs/testing';

describe('CreateAppointmentHandler', () => {
  let handler: CreateAppointmentHandler;
  let repo: IAppointmentWriteRepository;
  
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateAppointmentHandler,
        {
          provide: 'IAppointmentWriteRepository',
          useValue: {
            save: jest.fn(),
            findById: jest.fn(),
          },
        },
      ],
    }).compile();
    
    handler = module.get<CreateAppointmentHandler>(CreateAppointmentHandler);
    repo = module.get('IAppointmentWriteRepository');
  });
  
  it('should create appointment', async () => {
    // Test implementation
  });
});
```

### E2E Test

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('AppointmentController (e2e)', () => {
  let app: INestApplication;
  
  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    
    app = moduleFixture.createNestApplication();
    await app.init();
  });
  
  it('/appointments (POST)', () => {
    return request(app.getHttpServer())
      .post('/appointments')
      .send({ /* dto */ })
      .expect(201);
  });
});
```

## Best Practices

### 1. Usar Dependency Injection Siempre

❌ **No hacer:**
```typescript
const repo = new AppointmentRepository();
```

✅ **Hacer:**
```typescript
constructor(private readonly repo: IAppointmentWriteRepository) {}
```

### 2. Controllers Delgados

❌ **No hacer:**
```typescript
@Post()
async create(@Body() dto: CreateAppointmentDto) {
  // Lógica de negocio aquí
  const appointment = new Appointment();
  // ...
}
```

✅ **Hacer:**
```typescript
@Post()
async create(@Body() dto: CreateAppointmentDto) {
  return this.commandBus.execute(new CreateAppointmentCommand(...));
}
```

### 3. Validación en DTOs

❌ **No hacer:**
```typescript
@Post()
async create(@Body() dto: any) {
  if (!dto.customerId) throw new Error('...');
}
```

✅ **Hacer:**
```typescript
export class CreateAppointmentDto {
  @IsUUID()
  @IsNotEmpty()
  customerId: string;
}
```

### 4. Exception Filters para Errores de Dominio

❌ **No hacer:**
```typescript
try {
  // ...
} catch (error) {
  throw new HttpException(error.message, 400);
}
```

✅ **Hacer:**
```typescript
// Lanzar DomainException
throw new AppointmentNotFoundException(id);

// Capturar con DomainExceptionFilter
```

### 5. Async/Await Consistente

✅ **Hacer:**
```typescript
async execute(command: CreateAppointmentCommand): Promise<Result> {
  const appointment = await this.repo.findById(id);
  await this.repo.save(appointment);
  return result;
}
```

### 6. Logging Estructurado

✅ **Hacer:**
```typescript
this.logger.log({
  message: 'Appointment created',
  appointmentId: result.appointmentId,
  businessId: command.businessId,
  duration: Date.now() - start,
});
```

### 7. Health Checks

```typescript
import { HealthCheckService, TypeOrmHealthIndicator } from '@nestjs/terminus';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
  ) {}
  
  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.db.pingCheck('database'),
    ]);
  }
}
```

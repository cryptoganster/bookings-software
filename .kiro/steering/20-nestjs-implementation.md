---
inclusion: fileMatch
fileMatchPattern: "**/*.module.ts,**/presentation/controllers/**/*.ts"
---

# NestJS Implementation Patterns

**NestJS-specific patterns and best practices for the bookings-bot project**

> **Cross-References:**
>
> - [10-cqrs-pattern.md](./10-cqrs-pattern.md) - CQRS implementation with NestJS
> - [04-system-architecture.md](./04-system-architecture.md) - Overall architecture
> - [21-clean-code-principles.md](./21-clean-code-principles.md) - Clean code principles

---

# NestJS Patterns

Este documento define los patrones específicos de NestJS aplicados en el proyecto.

## Módulos por Bounded Context

Cada Bounded Context es un módulo NestJS independiente.

### Estructura de Módulo

```typescript
@Module({
  imports: [
    CqrsModule,
    TypeOrmModule.forFeature([AppointmentModel, CapacityModel]),
  ],
  controllers: [AppointmentController],
  providers: [
    // Command Handlers
    CreateAppointmentHandler,
    CancelAppointmentHandler,

    // Query Handlers
    GetAppointmentHandler,
    GetCustomerAppointmentsHandler,

    // Event Handlers
    OnAppointmentCreatedHandler,

    // Repositories
    {
      provide: "IAppointmentWriteRepository",
      useClass: AppointmentWriteRepository,
    },
    {
      provide: "IAppointmentReadRepository",
      useClass: AppointmentReadRepository,
    },

    // Factories
    {
      provide: "IAppointmentFactory",
      useClass: AppointmentFactory,
    },

    // Domain Services
    {
      provide: "IAvailabilityChecker",
      useClass: AvailabilityChecker,
    },
  ],
  exports: ["IAppointmentReadRepository", "IAvailabilityChecker"],
})
export class BookingModule {}
```

## Dependency Injection

### Inyección de Interfaces

```typescript
@Injectable()
export class CreateAppointmentHandler {
  constructor(
    @Inject("IAppointmentWriteRepository")
    private readonly appointmentRepo: IAppointmentWriteRepository,
    @Inject("ICapacityWriteRepository")
    private readonly capacityRepo: ICapacityWriteRepository,
    @Inject("IUnitOfWork")
    private readonly uow: IUnitOfWork,
  ) {}
}
```

### Tokens de Inyección

**Reglas:**

- Usar strings para interfaces: `'IAppointmentWriteRepository'`
- Usar clases directamente para implementaciones concretas
- Exportar tokens necesarios para otros módulos

## Controllers

### REST Controllers

```typescript
@Controller("appointments")
@UseGuards(JwtAuthGuard)
export class AppointmentController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: CreateAppointmentDto,
    @CurrentUser() user: UserPayload,
  ): Promise<CreateAppointmentResponseDto> {
    const result = await this.commandBus.execute(
      new CreateAppointmentCommand(
        dto.businessId,
        dto.customerId,
        dto.offeringId,
        dto.dateTime,
      ),
    );

    return { appointmentId: result.appointmentId };
  }

  @Get()
  async findAll(
    @CurrentUser() user: UserPayload,
    @Query() query: GetAppointmentsQueryDto,
  ): Promise<AppointmentReadModel[]> {
    return this.queryBus.execute(
      new GetCustomerAppointmentsQuery(user.customerId),
    );
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async cancel(
    @Param("id") id: string,
    @CurrentUser() user: UserPayload,
  ): Promise<void> {
    await this.commandBus.execute(
      new CancelAppointmentCommand(id, user.userId),
    );
  }
}
```

### Validación con DTOs

```typescript
export class CreateAppointmentDto {
  @IsUUID()
  @IsNotEmpty()
  businessId: string;

  @IsUUID()
  @IsNotEmpty()
  customerId: string;

  @IsUUID()
  @IsNotEmpty()
  offeringId: string;

  @IsISO8601()
  @IsNotEmpty()
  dateTime: string;
}
```

## Guards

### JWT Authentication Guard

```typescript
@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest(err, user, info) {
    if (err || !user) {
      throw new UnauthorizedException("Invalid token");
    }
    return user;
  }
}
```

### Role-Based Guard

```typescript
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      'roles',
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.some((role) => user.roles?.includes(role));
  }
}

// Uso
@Roles(UserRole.BUSINESS_OWNER)
@UseGuards(JwtAuthGuard, RolesGuard)
@Get('admin/appointments')
async getBusinessAppointments() {
  // ...
}
```

## Interceptors

### Logging Interceptor

```typescript
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: Logger) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;
    const now = Date.now();

    return next.handle().pipe(
      tap(() => {
        const response = context.switchToHttp().getResponse();
        const { statusCode } = response;
        const duration = Date.now() - now;

        this.logger.log(
          `${method} ${url} ${statusCode} - ${duration}ms`,
          "HTTP",
        );
      }),
    );
  }
}
```

### Transform Interceptor

```typescript
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  Response<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    return next.handle().pipe(
      map((data) => ({
        success: true,
        data,
        timestamp: new Date().toISOString(),
      })),
    );
  }
}
```

## Exception Filters

### Domain Exception Filter

```typescript
@Catch(DomainException)
export class DomainExceptionFilter implements ExceptionFilter {
  catch(exception: DomainException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = this.getHttpStatus(exception);

    response.status(status).json({
      success: false,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: exception.message,
      error: exception.constructor.name,
    });
  }

  private getHttpStatus(exception: DomainException): number {
    if (exception instanceof NotFoundException) {
      return HttpStatus.NOT_FOUND;
    }
    if (exception instanceof ValidationException) {
      return HttpStatus.BAD_REQUEST;
    }
    if (exception instanceof ConcurrencyException) {
      return HttpStatus.CONFLICT;
    }
    return HttpStatus.INTERNAL_SERVER_ERROR;
  }
}
```

### Global Exception Filter

```typescript
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly logger: Logger) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.message
        : "Internal server error";

    this.logger.error(
      `${request.method} ${request.url} ${status} - ${message}`,
      exception instanceof Error ? exception.stack : undefined,
      "ExceptionFilter",
    );

    response.status(status).json({
      success: false,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
    });
  }
}
```

## Pipes

### Validation Pipe

```typescript
// Global configuration
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true, // Strip properties not in DTO
    forbidNonWhitelisted: true, // Throw error if extra properties
    transform: true, // Transform payloads to DTO instances
    transformOptions: {
      enableImplicitConversion: true,
    },
  }),
);
```

### Parse UUID Pipe

```typescript
@Get(':id')
async findOne(@Param('id', ParseUUIDPipe) id: string) {
  return this.queryBus.execute(new GetAppointmentQuery(id));
}
```

## Middleware

### Request ID Middleware

```typescript
@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    req["id"] = randomUUID();
    res.setHeader("X-Request-Id", req["id"]);
    next();
  }
}

// Aplicar en módulo
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware).forRoutes("*");
  }
}
```

## Configuration

### Environment Variables

```typescript
@Injectable()
export class ConfigService {
  constructor(private readonly configService: NestConfigService) {}

  get databaseUrl(): string {
    return this.configService.get<string>("DATABASE_URL");
  }

  get jwtSecret(): string {
    return this.configService.get<string>("JWT_SECRET");
  }

  get whatsappApiUrl(): string {
    return this.configService.get<string>("WHATSAPP_API_URL");
  }
}

// Uso en módulo
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
      validationSchema: Joi.object({
        DATABASE_URL: Joi.string().required(),
        JWT_SECRET: Joi.string().required(),
        WHATSAPP_API_URL: Joi.string().uri().required(),
      }),
    }),
  ],
})
export class AppModule {}
```

## Testing

### Unit Tests

```typescript
describe("CreateAppointmentHandler", () => {
  let handler: CreateAppointmentHandler;
  let appointmentRepo: jest.Mocked<IAppointmentWriteRepository>;
  let capacityRepo: jest.Mocked<ICapacityWriteRepository>;
  let uow: jest.Mocked<IUnitOfWork>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateAppointmentHandler,
        {
          provide: "IAppointmentWriteRepository",
          useValue: {
            save: jest.fn(),
          },
        },
        {
          provide: "ICapacityWriteRepository",
          useValue: {
            findByOfferingAndDate: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: "IUnitOfWork",
          useValue: {
            transaction: jest.fn((work) => work()),
          },
        },
      ],
    }).compile();

    handler = module.get(CreateAppointmentHandler);
    appointmentRepo = module.get("IAppointmentWriteRepository");
    capacityRepo = module.get("ICapacityWriteRepository");
    uow = module.get("IUnitOfWork");
  });

  it("should create appointment and decrement capacity", async () => {
    // Arrange
    const command = new CreateAppointmentCommand(
      "business-id",
      "customer-id",
      "offering-id",
      new Date(),
    );

    const capacity = Capacity.create(
      UUID.generate(),
      UUID.fromString("offering-id"),
      new Date(),
      10,
    );

    capacityRepo.findByOfferingAndDate.mockResolvedValue(capacity);

    // Act
    const result = await handler.execute(command);

    // Assert
    expect(result.appointmentId).toBeDefined();
    expect(appointmentRepo.save).toHaveBeenCalled();
    expect(capacityRepo.save).toHaveBeenCalled();
  });
});
```

### Integration Tests

```typescript
describe("AppointmentController (e2e)", () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Get auth token
    const response = await request(app.getHttpServer())
      .post("/auth/login")
      .send({ email: "test@example.com", password: "password" });

    authToken = response.body.token;
  });

  afterAll(async () => {
    await app.close();
  });

  it("/appointments (POST)", () => {
    return request(app.getHttpServer())
      .post("/appointments")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        businessId: "business-uuid",
        customerId: "customer-uuid",
        offeringId: "offering-uuid",
        dateTime: "2024-12-20T10:00:00Z",
      })
      .expect(201)
      .expect((res) => {
        expect(res.body.appointmentId).toBeDefined();
      });
  });
});
```

## Mejores Prácticas

### 1. Módulos

✅ **Hacer:**

- Un módulo por Bounded Context
- Exportar solo lo necesario
- Usar `forRoot()` para configuración global
- Usar `forFeature()` para configuración específica

❌ **No hacer:**

- Módulos monolíticos
- Exportar todo
- Dependencias circulares

### 2. Providers

✅ **Hacer:**

- Usar tokens de string para interfaces
- Registrar con `provide`/`useClass`
- Scope DEFAULT para singletons
- Scope REQUEST para request-scoped

❌ **No hacer:**

- Inyectar implementaciones directamente
- Usar `@Injectable()` sin registrar en módulo
- Scope REQUEST sin necesidad (performance)

### 3. Controllers

✅ **Hacer:**

- Delegar a CommandBus/QueryBus
- Validar con DTOs
- Usar decoradores de NestJS
- Retornar DTOs, no aggregates

❌ **No hacer:**

- Lógica de negocio en controllers
- Acceso directo a repositories
- Retornar aggregates del dominio

### 4. Exception Handling

✅ **Hacer:**

- Usar Exception Filters
- Mapear domain exceptions a HTTP status
- Logging de errores
- Respuestas consistentes

❌ **No hacer:**

- Try-catch en controllers
- Exponer stack traces en producción
- Ignorar errores

## Referencias

- [NestJS Documentation](https://docs.nestjs.com/)
- [NestJS CQRS](https://docs.nestjs.com/recipes/cqrs)
- [NestJS Testing](https://docs.nestjs.com/fundamentals/testing)

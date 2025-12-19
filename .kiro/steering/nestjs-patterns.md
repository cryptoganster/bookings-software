---
inclusion: always
---

# NestJS Patterns y Best Practices

Patrones y mejores prácticas para NestJS en el proyecto.

## Módulos

| Regla                        | Descripción                              |
| ---------------------------- | ---------------------------------------- |
| **Un BC = Un Módulo**        | Cada Bounded Context es un módulo NestJS |
| **Imports mínimos**          | Solo importar lo necesario               |
| **Exports explícitos**       | Solo interfaces, no implementaciones     |
| **Global solo SharedModule** | Feature modules no son globales          |

````typescript
@Module({
  imports: [CqrsModule, TypeOrmModule.forFeature([...models])],
  controllers: [...controllers],
  providers: [...commandHandlers, ...queryHandlers, ...eventHandlers, ...sagas, ...repositories],
  exports: ['IAppointmentWriteRepository', 'IAppointmentReadRepository'],
})
export class BookingModule {}

## Dependency Injection

**Inyección por Constructor:**
```typescript
@Injectable()
export class CreateAppointmentHandler {
  constructor(
    private readonly appointmentRepo: IAppointmentWriteRepository,
    private readonly uow: IUnitOfWork,
  ) {}
}
````

**Inyección de Interfaces:**

```typescript
// Module
providers: [{ provide: 'IAppointmentWriteRepository', useClass: AppointmentWriteRepository }]

// Clase
constructor(@Inject('IAppointmentWriteRepository') private readonly repo: IAppointmentWriteRepository) {}
```

**Scopes:** Default SINGLETON (usar siempre). REQUEST scope solo si absolutamente necesario (performance impact).

## Controllers

**Reglas:** Delgados (solo validación y delegación), usar CommandBus/QueryBus, DTOs con class-validator, Guards para auth, Decorators personalizados.

````typescript
@Controller('appointments')
@UseGuards(JwtAuthGuard)
export class AppointmentController {
  constructor(private readonly commandBus: CommandBus, private readonly queryBus: QueryBus) {}

  @Post()
  async create(@Body() dto: CreateAppointmentDto, @CurrentUser() user: UserPayload) {
    return this.commandBus.execute(new CreateAppointmentCommand(user.businessId, dto.customerId, dto.offeringId, dto.dateTime));
  }

  @Get()
  async findAll(@CurrentUser() user: UserPayload) {
    return this.queryBus.execute(new GetBusinessAppointmentsQuery(user.businessId));
  }

  @Delete(':id')
  async cancel(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    await this.commandBus.execute(new CancelAppointmentCommand(id, user.userId));
    return { message: 'Appointment cancelled successfully' };
  }
}

## DTOs

**Reglas:** Validación completa (class-validator), transformación (class-transformer), inmutables (readonly), específicos (un DTO por endpoint), sin lógica.

```typescript
export class CreateAppointmentDto {
  @IsUUID() @IsNotEmpty() customerId: string;
  @IsUUID() @IsNotEmpty() offeringId: string;
  @IsDate() @Type(() => Date) @MinDate(new Date()) dateTime: Date;
}

## Guards & Logging

**JWT Auth Guard:**
```typescript
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) { return super.canActivate(context); }
}
````

**Custom Guard:**

```typescript
@Injectable()
export class WhatsAppSignatureGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    return isValid; // Validar firma
  }
}
```

**Pino Logger Setup:**

````typescript
// main.ts
const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter(), { bufferLogs: true });
app.useLogger(app.get(Logger));

// app.module.ts
LoggerModule.forRoot({
  pinoHttp: {
    transport: process.env.NODE_ENV !== 'production' ? { target: 'pino-pretty', options: { colorize: true } } : undefined,
    level: process.env.LOG_LEVEL || 'info',
  },
})

// Service
@Injectable()
export class AppointmentService {
  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(AppointmentService.name);
  }
  async createAppointment(data: any) {
    this.logger.info({ data }, 'Creating appointment');
    try {
      this.logger.info({ appointmentId: result.id }, 'Appointment created successfully');
      return result;
    } catch (error) {
      this.logger.error({ error, data }, 'Failed to create appointment');
      throw error;
    }
  }
}

## Exception Filters, Pipes & Decorators

**Domain Exception Filter:**
```typescript
@Catch(DomainException)
export class DomainExceptionFilter implements ExceptionFilter {
  catch(exception: DomainException, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse();
    const statusCode = this.getStatusCode(exception); // Mapear a HTTP status
    response.status(statusCode).json({ statusCode, message: exception.message, error: exception.name, timestamp: new Date().toISOString() });
  }
}
// main.ts: app.useGlobalFilters(new DomainExceptionFilter());
````

**Validation Pipe:**

```typescript
// main.ts
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: { enableImplicitConversion: true },
  }),
);
```

**Custom Decorator:**

```typescript
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    return ctx.switchToHttp().getRequest().user;
  },
);
// Uso: @Get() async findAll(@CurrentUser() user: UserPayload) { }
```

## CQRS con NestJS

**Command & Handler:**

```typescript
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

@CommandHandler(CreateAppointmentCommand)
export class CreateAppointmentHandler implements ICommandHandler<CreateAppointmentCommand> {
  constructor(
    private readonly repo: IAppointmentWriteRepository,
    private readonly uow: IUnitOfWork,
  ) {}
  async execute(
    command: CreateAppointmentCommand,
  ): Promise<{ appointmentId: string }> {
    // Lógica del handler
    return { appointmentId: "uuid" };
  }
}
```

**Query & Handler:**

```typescript
export class GetAppointmentQuery extends Query<AppointmentReadModel> {
  constructor(public readonly appointmentId: string) {
    super();
  }
}

@QueryHandler(GetAppointmentQuery)
export class GetAppointmentHandler implements IQueryHandler<GetAppointmentQuery> {
  constructor(private readonly repo: IAppointmentReadRepository) {}
  async execute(query: GetAppointmentQuery): Promise<AppointmentReadModel> {
    return this.repo.findById(query.appointmentId);
  }
}
```

**Event Handler:**

```typescript
@EventsHandler(AppointmentCreated)
export class OnAppointmentCreatedHandler implements IEventHandler<AppointmentCreated> {
  constructor(private readonly commandBus: CommandBus) {}
  async handle(event: AppointmentCreated) {
    try {
      await this.commandBus.execute(
        new ScheduleReminderCommand(event.appointmentId, event.dateTime),
      );
    } catch (error) {
      console.error("Error handling AppointmentCreated:", error); // Log pero no propagar
    }
  }
}
```

**Saga:**

```typescript
@Injectable()
export class AppointmentNotificationSaga {
  @Saga()
  appointmentCreated = (events$: Observable<any>): Observable<ICommand> => {
    return events$.pipe(
      ofType(AppointmentCreated),
      map(
        (event) =>
          new ScheduleReminderCommand(event.appointmentId, event.dateTime),
      ),
    );
  };
}
```

## Configuration & TypeORM

**ConfigModule:**

```typescript
ConfigModule.forRoot({
  isGlobal: true,
  envFilePath: ".env",
  validationSchema: Joi.object({
    NODE_ENV: Joi.string().valid("development", "production", "test"),
    PORT: Joi.number().default(3000),
    DB_HOST: Joi.string().required(),
  }),
});

// Uso
@Injectable()
export class SomeService {
  constructor(private configService: ConfigService) {
    const dbHost = this.configService.get<string>("DB_HOST");
    const port = this.configService.get<number>("PORT", 3000); // con default
  }
}
```

**TypeORM Setup:**

```typescript
// App Module
TypeOrmModule.forRoot({ type: 'postgres', host: process.env.DB_HOST, port: parseInt(process.env.DB_PORT, 10), username: process.env.DB_USERNAME, password: process.env.DB_PASSWORD, database: process.env.DB_DATABASE, autoLoadEntities: true, synchronize: process.env.NODE_ENV === 'development' })

// Feature Module
@Module({ imports: [TypeOrmModule.forFeature([AppointmentModel, CapacityModel])], providers: [...] })

// Repository Injection
@Injectable()
export class AppointmentWriteRepository {
  constructor(@InjectRepository(AppointmentModel) private readonly repository: Repository<AppointmentModel>) {}
}
```

## Testing

**Unit Test:**

```typescript
describe("CreateAppointmentHandler", () => {
  let handler: CreateAppointmentHandler;
  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        CreateAppointmentHandler,
        {
          provide: "IAppointmentWriteRepository",
          useValue: { save: jest.fn(), findById: jest.fn() },
        },
      ],
    }).compile();
    handler = module.get<CreateAppointmentHandler>(CreateAppointmentHandler);
  });
  it("should create appointment", async () => {
    /* Test implementation */
  });
});
```

**E2E Test:**

```typescript
describe("AppointmentController (e2e)", () => {
  let app: INestApplication;
  beforeEach(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    await app.init();
  });
  it("/appointments (POST)", () =>
    request(app.getHttpServer())
      .post("/appointments")
      .send({
        /* dto */
      })
      .expect(201));
});
```

## Best Practices

| Práctica        | ❌ No Hacer                                    | ✅ Hacer                                                                                    |
| --------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------- |
| **DI**          | `const repo = new AppointmentRepository();`    | `constructor(private readonly repo: IAppointmentWriteRepository) {}`                        |
| **Controllers** | Lógica de negocio en controller                | `return this.commandBus.execute(new CreateAppointmentCommand(...));`                        |
| **Validación**  | `if (!dto.customerId) throw new Error('...');` | DTOs con decoradores: `@IsUUID() @IsNotEmpty() customerId: string;`                         |
| **Excepciones** | `throw new HttpException(error.message, 400);` | `throw new AppointmentNotFoundException(id);` + DomainExceptionFilter                       |
| **Async/Await** | Callbacks o promesas sin await                 | `const appointment = await this.repo.findById(id); await this.repo.save(appointment);`      |
| **Logging**     | `console.log('Created')`                       | `this.logger.log({ message: 'Appointment created', appointmentId, businessId, duration });` |

**Health Checks:**

```typescript
@Controller("health")
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
  ) {}
  @Get() @HealthCheck() check() {
    return this.health.check([() => this.db.pingCheck("database")]);
  }
}
```

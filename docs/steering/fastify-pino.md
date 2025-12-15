# Fastify y Pino en NestJS

Este documento define cómo usar Fastify como HTTP adapter y Pino como logger en NestJS.

## Fastify como HTTP Adapter

### ¿Por qué Fastify?

- **Performance:** Hasta 2x más rápido que Express
- **Bajo overhead:** Menor uso de memoria
- **Schema validation:** Validación de schemas integrada
- **TypeScript:** Excelente soporte de tipos
- **Plugins:** Ecosistema rico de plugins

### Configuración en main.ts

```typescript
// src/main.ts
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      logger: false, // Desactivar logger de Fastify, usaremos Pino
    }),
    { bufferLogs: true } // Buffer logs hasta que Pino esté listo
  );
  
  // Usar Pino como logger
  app.useLogger(app.get(Logger));
  
  // Configurar CORS si es necesario
  app.enableCors();
  
  // Escuchar en todas las interfaces
  await app.listen(3000, '0.0.0.0');
  
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
```

### Diferencias con Express

#### Request/Response Objects

```typescript
// Express
import { Request, Response } from 'express';

// Fastify
import { FastifyRequest, FastifyReply } from 'fastify';

// En controllers
@Get()
async findAll(
  @Req() request: FastifyRequest,
  @Res() reply: FastifyReply
) {
  // ...
}
```

#### Enviar Respuestas

```typescript
// Express
@Get()
async findAll(@Res() res: Response) {
  return res.status(200).json({ data: [] });
}

// Fastify - Opción 1 (recomendada)
@Get()
async findAll() {
  return { data: [] }; // Fastify serializa automáticamente
}

// Fastify - Opción 2 (manual)
@Get()
async findAll(@Res() reply: FastifyReply) {
  return reply.status(200).send({ data: [] });
}
```

## Pino como Logger

### ¿Por qué Pino?

- **Performance:** El logger más rápido para Node.js
- **Bajo overhead:** Logging asíncrono
- **Structured logging:** JSON por defecto
- **Child loggers:** Contexto por módulo
- **Pretty printing:** Formato legible en desarrollo

### Instalación

```bash
npm install nestjs-pino pino-http pino-pretty
```

### Configuración en AppModule

```typescript
// src/app.module.ts
import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        // Configuración de transporte
        transport: process.env.NODE_ENV !== 'production' ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
            singleLine: false,
          },
        } : undefined,
        
        // Nivel de logging
        level: process.env.LOG_LEVEL || 'info',
        
        // Serializers personalizados
        serializers: {
          req: (req) => ({
            id: req.id,
            method: req.method,
            url: req.url,
            query: req.query,
            params: req.params,
            // No loggear headers sensibles
          }),
          res: (res) => ({
            statusCode: res.statusCode,
          }),
        },
        
        // Auto-logging de requests HTTP
        autoLogging: true,
        
        // Customizar mensaje de request
        customLogLevel: (req, res, err) => {
          if (res.statusCode >= 400 && res.statusCode < 500) {
            return 'warn';
          } else if (res.statusCode >= 500 || err) {
            return 'error';
          }
          return 'info';
        },
      },
    }),
  ],
})
export class AppModule {}
```

### Uso en Services y Handlers

```typescript
import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';

@Injectable()
export class CreateAppointmentHandler {
  constructor(private readonly logger: PinoLogger) {
    // Establecer contexto para este handler
    this.logger.setContext(CreateAppointmentHandler.name);
  }
  
  async execute(command: CreateAppointmentCommand) {
    // Log con contexto
    this.logger.info(
      { 
        commandId: command.id,
        businessId: command.businessId,
        customerId: command.customerId,
      },
      'Executing CreateAppointmentCommand'
    );
    
    try {
      const result = await this.createAppointment(command);
      
      // Log de éxito
      this.logger.info(
        { 
          appointmentId: result.appointmentId,
          duration: Date.now() - startTime,
        },
        'Appointment created successfully'
      );
      
      return result;
      
    } catch (error) {
      // Log de error con stack trace
      this.logger.error(
        { 
          error: {
            message: error.message,
            stack: error.stack,
            name: error.name,
          },
          command,
        },
        'Failed to create appointment'
      );
      
      throw error;
    }
  }
}
```

### Niveles de Logging

```typescript
// Niveles disponibles (de menor a mayor severidad)
logger.trace({ data }, 'Trace message');  // 10
logger.debug({ data }, 'Debug message');  // 20
logger.info({ data }, 'Info message');    // 30
logger.warn({ data }, 'Warning message'); // 40
logger.error({ data }, 'Error message');  // 50
logger.fatal({ data }, 'Fatal message');  // 60
```

### Child Loggers

```typescript
@Injectable()
export class BookingService {
  private readonly logger: PinoLogger;
  
  constructor(logger: PinoLogger) {
    // Crear child logger con contexto
    this.logger = logger.child({ service: 'BookingService' });
  }
  
  async processBooking() {
    // Todos los logs incluirán { service: 'BookingService' }
    this.logger.info('Processing booking');
  }
}
```

### Logging de Eventos de Dominio

```typescript
@EventsHandler(AppointmentCreated)
export class OnAppointmentCreatedHandler {
  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(OnAppointmentCreatedHandler.name);
  }
  
  async handle(event: AppointmentCreated) {
    this.logger.info(
      {
        event: {
          type: event.constructor.name,
          appointmentId: event.appointmentId,
          businessId: event.businessId,
          dateTime: event.dateTime,
        },
      },
      'Handling AppointmentCreated event'
    );
    
    try {
      await this.commandBus.execute(
        new ScheduleReminderCommand(event.appointmentId, event.dateTime)
      );
      
      this.logger.info(
        { appointmentId: event.appointmentId },
        'Reminder scheduled successfully'
      );
    } catch (error) {
      this.logger.error(
        { error, event },
        'Failed to schedule reminder'
      );
    }
  }
}
```

## Configuración de Producción vs Desarrollo

### Variables de Entorno

```bash
# .env.development
NODE_ENV=development
LOG_LEVEL=debug

# .env.production
NODE_ENV=production
LOG_LEVEL=info
```

### Formato de Logs

**Desarrollo (pino-pretty):**
```
[2024-12-14 10:30:00] INFO (CreateAppointmentHandler): Executing CreateAppointmentCommand
    commandId: "cmd-123"
    businessId: "bus-456"
    customerId: "cus-789"
```

**Producción (JSON):**
```json
{
  "level": 30,
  "time": 1702551000000,
  "pid": 12345,
  "hostname": "server-01",
  "context": "CreateAppointmentHandler",
  "commandId": "cmd-123",
  "businessId": "bus-456",
  "customerId": "cus-789",
  "msg": "Executing CreateAppointmentCommand"
}
```

## Mejores Prácticas

### ✅ Hacer

```typescript
// Usar structured logging
logger.info({ userId, action: 'login' }, 'User logged in');

// Establecer contexto
logger.setContext(ClassName.name);

// Loggear errores con contexto
logger.error({ error, context }, 'Operation failed');

// Usar child loggers para contexto persistente
const childLogger = logger.child({ requestId });

// Loggear métricas importantes
logger.info({ duration, status }, 'Request completed');
```

### ❌ Evitar

```typescript
// No usar console.log
console.log('User logged in'); // ❌

// No loggear información sensible
logger.info({ password: user.password }); // ❌

// No usar string interpolation
logger.info(`User ${userId} logged in`); // ❌ (usar objeto)

// No loggear en loops sin control
for (const item of items) {
  logger.info({ item }); // ❌ (puede generar demasiados logs)
}
```

## Performance Tips

### 1. Logging Asíncrono

Pino escribe logs de forma asíncrona por defecto, no bloquea el event loop.

### 2. Conditional Logging

```typescript
// Solo calcular si el nivel está habilitado
if (logger.isLevelEnabled('debug')) {
  const expensiveData = calculateExpensiveData();
  logger.debug({ expensiveData }, 'Debug info');
}
```

### 3. Evitar Serialización Costosa

```typescript
// ❌ Mal - serializa todo el objeto
logger.info({ appointment }, 'Appointment created');

// ✅ Bien - solo campos necesarios
logger.info(
  { 
    appointmentId: appointment.getId(),
    status: appointment.getStatus(),
  },
  'Appointment created'
);
```

## Integración con Fastify

Pino se integra perfectamente con Fastify ya que Fastify usa Pino internamente:

```typescript
// main.ts
const app = await NestFactory.create<NestFastifyApplication>(
  AppModule,
  new FastifyAdapter({
    logger: false, // Desactivar logger de Fastify
  }),
  { bufferLogs: true }
);

// Usar Pino de NestJS
app.useLogger(app.get(Logger));
```

## Health Checks con Pino

```typescript
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
    private logger: PinoLogger,
  ) {
    this.logger.setContext(HealthController.name);
  }
  
  @Get()
  @HealthCheck()
  async check() {
    const result = await this.health.check([
      () => this.db.pingCheck('database'),
    ]);
    
    this.logger.info(
      { 
        status: result.status,
        details: result.details,
      },
      'Health check performed'
    );
    
    return result;
  }
}
```

## Troubleshooting

### Logs no aparecen

```typescript
// Verificar que el logger está configurado
app.useLogger(app.get(Logger));

// Verificar nivel de logging
LOG_LEVEL=debug npm run start:dev
```

### Formato pretty no funciona

```bash
# Instalar pino-pretty
npm install pino-pretty

# Verificar NODE_ENV
NODE_ENV=development npm run start:dev
```

### Logs duplicados

```typescript
// No usar console.log junto con Pino
// Reemplazar todos los console.log con logger
```

Estas configuraciones aseguran logging de alto rendimiento y HTTP handling eficiente en el proyecto.

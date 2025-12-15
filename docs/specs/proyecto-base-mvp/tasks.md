# Implementation Plan

- [x] 1. Configurar Git y repositorio
  - Clonar repositorio: `git clone https://github.com/cryptoganster/bookings-software.git`
  - Configurar usuario Git local
  - Crear rama develop: `git checkout -b develop`
  - Subir rama develop: `git push -u origin develop`
  - Crear .gitignore con node_modules/, dist/, .env, .kiro/, logs/, coverage/
  - Hacer commit inicial: `git commit -m "chore: initial repository setup"`
  - _Requirements: 1.1_

- [x] 2. Setup proyecto NestJS y configuración inicial
  - Crear rama: `git checkout -b feature/project-setup`
  - [x] 2.1 Inicializar proyecto con Nest CLI
    - Instalar Nest CLI globalmente: `npm i -g @nestjs/cli`
    - Crear proyecto: `nest new bookings-software --strict`
    - Seleccionar npm como package manager
    - Verificar que el proyecto inicia: `npm run start:dev`
    - _Requirements: 1.1_
  
  - [x] 2.2 Configurar Fastify como HTTP adapter
    - Instalar Fastify: `npm install @nestjs/platform-fastify`
    - Modificar main.ts para usar FastifyAdapter
    - Verificar que funciona con Fastify
    - _Requirements: 1.1_
  
  - [x] 2.3 Configurar Pino como logger
    - Instalar Pino: `npm install nestjs-pino pino-http pino-pretty`
    - Configurar LoggerModule en AppModule
    - Configurar formato pretty para desarrollo
    - Configurar formato JSON para producción
    - _Requirements: 12.1_
  
  - [x] 2.4 Instalar dependencias principales
    - CQRS: `npm install @nestjs/cqrs`
    - TypeORM: `npm install @nestjs/typeorm typeorm pg`
    - Auth: `npm install @nestjs/jwt @nestjs/passport passport-jwt bcrypt`
    - Validación: `npm install class-validator class-transformer`
    - Utilidades: `npm install date-fns date-fns-tz uuid axios`
    - Config: `npm install @nestjs/config`
    - Health: `npm install @nestjs/terminus`
    - _Requirements: 1.1_
  
  - [x] 2.5 Instalar dependencias de desarrollo
    - Types: `npm install -D @types/node @types/jest @types/bcrypt @types/uuid @types/passport-jwt`
    - Testing: `npm install -D fast-check supertest @types/supertest`
    - Linting: `npm install -D @typescript-eslint/eslint-plugin @typescript-eslint/parser`
    - Prettier: `npm install -D prettier`
    - _Requirements: 1.1_
  
  - [x] 2.6 Configurar TypeScript
    - Verificar tsconfig.json tiene strict: true
    - Configurar paths para imports (@shared/*, @booking/*, etc.)
    - Configurar experimentalDecorators y emitDecoratorMetadata
    - _Requirements: 1.1_
  
  - [x] 2.7 Configurar ESLint y Prettier
    - Configurar .eslintrc.js con reglas de TypeScript
    - Configurar .prettierrc con singleQuote, trailingComma, printWidth: 100
    - Agregar scripts: `npm run lint` y `npm run format`
    - _Requirements: 1.1_
  
  - [x] 2.8 Crear estructura de carpetas
    - Crear src/shared/ con subdirectorios: kernel/, infra/, vo/
    - Crear src/booking/ con subdirectorios: domain/, app/, infra/, presentation/
    - Crear src/messaging/ con estructura similar
    - Crear src/auth/ con estructura similar
    - _Requirements: 1.1_
  
  - [x] 2.9 Configurar variables de entorno
    - Crear .env.example con todas las variables necesarias
    - Crear .env con valores de desarrollo
    - Agregar .env al .gitignore
    - Configurar @nestjs/config en AppModule
    - _Requirements: 1.1_
  
  - Commit: `git commit -m "feat: setup NestJS project with Fastify and Pino"`
  - Push y crear PR a develop
  - _Requirements: 1.1, 1.5, 12.1_

- [x] 3. Implementar Shared Kernel
  - Crear rama: `git checkout -b feature/shared-kernel`
  - [x] 3.1 Crear Value Objects base
    - Implementar ValueObject abstract class con equals y getEqualityComponents
    - Implementar AggregateVersion value object con increment y getValue
    - Implementar UUID value object con generate, fromString y getValue
    - _Requirements: 2.5_
  
  - [x] 2.2 Crear VersionedAggregateRoot
    - Extender AggregateRoot de @nestjs/cqrs
    - Agregar campo version de tipo AggregateVersion
    - Implementar getVersion, incrementVersion y setVersion
    - Configurar autoCommit = true
    - _Requirements: 2.1_
  
  - [x] 2.3 Implementar Unit of Work
    - Crear interfaz IUnitOfWork con método transaction
    - Implementar TypeOrmUnitOfWork usando DataSource de TypeORM
    - Manejar inicio, commit y rollback de transacciones
    - Soportar isolation levels configurables
    - _Requirements: 2.3_
  
  - [x] 2.4 Crear excepciones de dominio
    - Implementar DomainException base class
    - Implementar ConcurrencyException
    - Crear DomainExceptionFilter para manejo global
    - _Requirements: 2.4_
  
  - [x] 3.5 Escribir tests unitarios para Shared Kernel
    - Test para ValueObject equals
    - Test para AggregateVersion increment
    - Test para UUID generation y parsing
    - Test para UnitOfWork transaction rollback
    - _Requirements: 2.1, 2.2, 2.3, 2.5_
  
  - Commit: `git commit -m "feat: implement shared kernel with versioning support"`
  - Push y crear PR a develop

- [x] 4. Configurar base de datos y CQRS
  - Crear rama: `git checkout -b feature/database-cqrs-setup`
  - [x] 3.1 Configurar TypeORM
    - Configurar TypeOrmModule en AppModule
    - Crear data-source.ts para migraciones
    - Configurar sincronización automática en desarrollo
    - _Requirements: 1.3_
  
  - [x] 3.2 Configurar CQRS
    - Importar CqrsModule.forRoot() en AppModule
    - Crear SharedModule global con UnitOfWork
    - Registrar DomainExceptionFilter como APP_FILTER
    - _Requirements: 1.2_
  
  - [x] 4.3 Crear migraciones iniciales
    - Migración para tabla appointments con campo version
    - Migración para tabla capacities con campo version
    - Crear índices: appointments(businessId), appointments(customerId), capacities(offeringId, date) UNIQUE
    - _Requirements: 11.1, 11.4_
  
  - Commit: `git commit -m "feat: configure TypeORM, CQRS and initial migrations"`
  - Push y crear PR a develop

- [x] 5. Implementar Booking Domain Layer
  - Crear rama: `git checkout -b feature/booking-domain`
  - [x] 4.1 Crear Value Objects de Booking
    - Implementar AppointmentStatus con estados CONFIRMED, CANCELLED, COMPLETED
    - Implementar DateTime wrapper con toDate y fromDate
    - Agregar validaciones en constructores
    - _Requirements: 3.1_
  
  - [x] 4.2 Crear Domain Events
    - Implementar AppointmentCreated event
    - Implementar AppointmentCancelled event
    - Implementar AppointmentModified event
    - _Requirements: 3.1_
  
  - [x] 4.3 Implementar Appointment Aggregate
    - Crear src/booking/domain/aggregates/appointment.ts
    - Extender VersionedAggregateRoot
    - Implementar método estático create con apply(AppointmentCreated)
    - Implementar método cancel con validación y apply(AppointmentCancelled)
    - Implementar método modify con validación y apply(AppointmentModified)
    - Implementar método estático fromPersistence para hidratar desde BD
    - Incrementar version en cada método de cambio de estado
    - _Requirements: 3.1_
  
  - [x] 4.4 Crear excepciones de Booking
    - Crear src/booking/domain/exceptions/appointment-not-found.ts
    - Implementar AppointmentNotFoundException
    - Crear appointment-cannot-be-cancelled.ts
    - Implementar AppointmentCannotBeCancelledException
    - Crear no-available-slots.ts
    - Implementar NoAvailableSlotsException
    - _Requirements: 3.1_
  
  - [x] 4.5 Escribir tests unitarios para Appointment Aggregate
    - Crear src/booking/domain/aggregates/__tests__/appointment.spec.ts
    - Test create incrementa version a 1
    - Test cancel incrementa version
    - Test modify incrementa version
    - Test create aplica AppointmentCreated event
    - Test cancel lanza excepción si status no permite cancelación
    - _Requirements: 3.1_
  
  - [x] 4.6 Escribir property test para Appointment
    - **Property 1: Aggregate version increments on state changes**
    - **Validates: Requirements 2.2**
    - Generar appointments aleatorios, aplicar cambios de estado, verificar incremento de versión
    - _Requirements: 2.2_
  
  - [x] 5.7 Escribir property test para eventos
    - **Property 4: Commands produce expected events**
    - **Validates: Requirements 3.4**
    - Generar appointments aleatorios, verificar que create aplica exactamente 1 AppointmentCreated
    - _Requirements: 3.4_
  
  - Commit: `git commit -m "feat: implement booking domain layer with aggregates and events"`
  - Push y crear PR a develop

- [x] 6. Implementar Booking Infrastructure Layer
  - Crear rama: `git checkout -b feature/booking-infrastructure`
  - [x] 5.1 Crear TypeORM entities
    - Crear src/booking/infra/persistence/models/appointment.ts
    - Crear AppointmentModel con decoradores @Entity, @Column, @PrimaryColumn
    - Agregar campo version con default 0
    - Agregar timestamps createdAt, updatedAt, cancelledAt
    - Crear src/booking/infra/persistence/models/capacity.ts
    - Crear CapacityModel con campo version
    - _Requirements: 4.1_
  
  - [x] 5.2 Crear Read Models
    - Crear src/booking/domain/read-models/appointment.ts
    - Crear AppointmentReadModel con datos desnormalizados (customerName, offeringName)
    - _Requirements: 4.2_
  
  - [x] 5.3 Crear Mappers
    - Crear src/booking/infra/persistence/mappers/appointment-write.ts
    - Implementar AppointmentWriteMapper.toModel y toDomain
    - Crear src/booking/infra/persistence/mappers/appointment-read.ts
    - Implementar AppointmentReadMapper.toReadModel
    - Mapear correctamente version entre aggregate y model
    - _Requirements: 4.5_
  
  - [x] 5.4 Implementar Write Repository
    - Implementar IAppointmentWriteRepository interface
    - Implementar AppointmentWriteRepository con save usando UPDATE WHERE version
    - Detectar affected = 0 y lanzar ConcurrencyException
    - Implementar findById que retorna Appointment domain object
    - Usar UnitOfWork para transacciones
    - _Requirements: 4.1, 4.4_
  
  - [x] 5.5 Implementar Read Repository
    - Implementar IAppointmentReadRepository interface
    - Implementar queries optimizadas con joins para desnormalización
    - Implementar findById, findByCustomerId, findByBusinessId, findUpcoming
    - _Requirements: 4.2_
  
  - [x] 5.6 Escribir tests de integración para repositories
    - Test save con versión correcta
    - Test save con versión incorrecta lanza ConcurrencyException
    - Test findById retorna aggregate correctamente hidratado
    - Test read repository retorna datos desnormalizados
    - _Requirements: 4.1, 4.4_
  
  - [x] 6.7 Escribir property test para Optimistic Locking
    - **Property 2: Optimistic locking prevents concurrent modifications**
    - **Validates: Requirements 3.5, 8.3**
    - Simular dos saves concurrentes con misma versión inicial, verificar que uno falla
    - _Requirements: 3.5, 8.3_
  
  - Commit: `git commit -m "feat: implement booking infrastructure with repositories and mappers"`
  - Push y crear PR a develop

- [x] 7. Implementar Booking Application Layer - Commands
  - Crear rama: `git checkout -b feature/booking-commands`
  - [x] 6.1 Crear estructura de Commands con SRP
    - Crear directorio src/booking/app/commands/create-appointment/
    - Crear command.ts con CreateAppointmentCommand extends Command<{ appointmentId: string }>
    - Crear handler.ts con CreateAppointmentHandler
    - Crear dto.ts con CreateAppointmentDto (si aplica)
    - Crear index.ts para exports
    - Repetir estructura para cancel-appointment y modify-appointment
    - _Requirements: 3.2_
  
  - [x] 6.2 Implementar CreateAppointmentHandler
    - En src/booking/app/commands/create-appointment/handler.ts
    - Decorar con @CommandHandler(CreateAppointmentCommand)
    - Inyectar IAppointmentWriteRepository, ICapacityWriteRepository, IUnitOfWork
    - Verificar capacidad disponible
    - Crear Appointment con Appointment.create()
    - Decrementar capacity.availableSlots
    - Guardar ambos en misma transacción usando UnitOfWork
    - Retornar { appointmentId }
    - _Requirements: 3.2, 8.2_
  
  - [x] 6.3 Implementar CancelAppointmentHandler
    - En src/booking/app/commands/cancel-appointment/handler.ts
    - Decorar con @CommandHandler(CancelAppointmentCommand)
    - Implementar retry logic con maxRetries = 3
    - Capturar ConcurrencyException y reintentar con exponential backoff
    - Llamar appointment.cancel() que incrementa version
    - Guardar con repository.save()
    - _Requirements: 3.2, 8.3_
  
  - [x] 6.4 Implementar ModifyAppointmentHandler
    - En src/booking/app/commands/modify-appointment/handler.ts
    - Similar a CancelAppointmentHandler con retry logic
    - Llamar appointment.modify(newDateTime)
    - _Requirements: 3.2_
  
  - [x] 6.5 Escribir tests de integración para Command Handlers
    - Test CreateAppointmentHandler crea appointment y decrementa capacity
    - Test CreateAppointmentHandler lanza NoAvailableSlotsException si capacity = 0
    - Test CancelAppointmentHandler cancela appointment exitosamente
    - Test CancelAppointmentHandler reintenta en ConcurrencyException
    - _Requirements: 3.2, 8.2, 8.3_
  
  - [x] 6.6 Escribir property test para transacciones
    - **Property 3: Capacity decrements atomically with appointment creation**
    - **Validates: Requirements 8.2**
    - Crear appointment, verificar que capacity decrementó en misma transacción
    - _Requirements: 8.2_
  
  - [x] 6.7 Escribir property test para retry logic
    - **Property 7: Command handlers retry on concurrency exceptions**
    - **Validates: Requirements 8.3**
    - Simular ConcurrencyException, verificar reintentos con backoff
    - _Requirements: 8.3_
  
  - [x] 7.8 Escribir test de concurrencia
    - Simular dos CreateAppointmentCommand concurrentes para mismo slot
    - Verificar que solo uno tiene éxito
    - Verificar que el fallido recibe NoAvailableSlotsException
    - _Requirements: 8.3, 8.4_
  
  - Commit: `git commit -m "feat: implement booking command handlers with retry logic"`
  - Push y crear PR a develop

- [x] 8. Implementar Booking Application Layer - Queries
  - Crear rama: `git checkout -b feature/booking-queries`
  - [x] 7.1 Crear estructura de Queries con SRP
    - Crear directorio src/booking/app/queries/get-customer-appointments/
    - Crear query.ts con GetCustomerAppointmentsQuery extends Query<AppointmentReadModel[]>
    - Crear handler.ts con GetCustomerAppointmentsHandler
    - Crear index.ts para exports
    - Repetir estructura para get-appointment
    - _Requirements: 3.3_
  
  - [x] 7.2 Implementar Query Handlers
    - En src/booking/app/queries/get-customer-appointments/handler.ts
    - Implementar GetCustomerAppointmentsHandler con @QueryHandler
    - En src/booking/app/queries/get-appointment/handler.ts
    - Implementar GetAppointmentHandler con @QueryHandler
    - Usar IAppointmentReadRepository
    - _Requirements: 3.3_
  
  - [x] 7.3 Escribir tests para Query Handlers
    - Test GetCustomerAppointmentsHandler retorna lista correcta
    - Test GetAppointmentHandler retorna appointment específico
    - _Requirements: 3.3_
  
  - [x] 8.4 Escribir property test para queries
    - **Property 8: Queries return read models without side effects**
    - **Validates: Requirements 4.2**
    - Ejecutar query, verificar que BD no cambió
    - _Requirements: 4.2_
  
  - Commit: `git commit -m "feat: implement booking query handlers"`
  - Push y crear PR a develop

- [x] 9. Implementar Event Handlers y Sagas
  - Crear rama: `git checkout -b feature/booking-events-sagas`
  - [x] 8.1 Crear Event Handlers
    - Crear src/booking/app/event-handlers/on-appointment-created.ts
    - Implementar OnAppointmentCreatedHandler con @EventsHandler(AppointmentCreated)
    - Inyectar CommandBus
    - Despachar ScheduleReminderCommand y SendWhatsAppMessageCommand
    - Envolver en try-catch para no propagar errores
    - Crear on-appointment-cancelled.ts con estructura similar
    - _Requirements: 5.1, 5.2_
  
  - [x] 8.2 Crear Sagas
    - Crear src/booking/app/sagas/appointment-notification.ts
    - Implementar AppointmentNotificationSaga
    - Decorar método con @Saga()
    - Usar ofType(AppointmentCreated) para filtrar eventos
    - Mapear a ScheduleReminderCommand
    - Retornar Observable<ICommand>
    - _Requirements: 5.3, 5.4_
  
  - [x] 8.3 Escribir tests para Event Handlers
    - Test OnAppointmentCreatedHandler despacha comandos correctos
    - Test errores en handler no propagan
    - _Requirements: 5.1, 5.2_
  
  - [x] 8.4 Escribir property test para eventos
    - **Property 5: Events are published automatically**
    - **Validates: Requirements 3.4**
    - Crear appointment con autoCommit=true, verificar evento publicado sin commit()
    - _Requirements: 3.4_
  
  - [x] 8.5 Escribir property test para event handlers
    - **Property 10: Event handlers handle errors gracefully**
    - **Validates: Requirements 5.2**
    - Simular error en handler, verificar que no propaga
    - _Requirements: 5.2_
  
  - [x] 8.6 Escribir tests para Sagas
    - Test saga emite comando correcto para evento
    - Test saga usa ofType correctamente
    - _Requirements: 5.3, 5.4_
  
  - [x] 9.7 Escribir property test para sagas
    - **Property 11: Sagas emit commands for matching events**
    - **Validates: Requirements 5.4**
    - Publicar evento, verificar comando emitido
    - _Requirements: 5.4_
  
  - Commit: `git commit -m "feat: implement event handlers and sagas for booking"`
  - Push y crear PR a develop

- [x] 10. Configurar Booking Module
  - Crear BookingModule con imports de CqrsModule y TypeOrmModule
  - Registrar todos los CommandHandlers en providers
  - Registrar todos los QueryHandlers en providers
  - Registrar todos los EventHandlers en providers
  - Registrar todas las Sagas en providers
  - Registrar repositories con provide/useClass
  - Exportar interfaces de repositories
  - Commit: `git commit -m "feat: configure booking module with all providers"`
  - Push y crear PR a develop
  - _Requirements: 3.1_

- [x] 11. Checkpoint - Verificar Booking BC completo
  - Ejecutar todos los tests unitarios
  - Ejecutar todos los property tests
  - Ejecutar tests de integración
  - Ejecutar tests de concurrencia
  - Verificar que CommandBus, QueryBus y EventBus funcionan correctamente
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 12. Implementar WhatsApp Integration
  - Crear rama: `git checkout -b feature/whatsapp-integration`
  - [x] 11.1 Crear interfaces de WhatsApp
    - Crear IWhatsAppClient interface con sendMessage, sendInteractiveButtons, sendLocation
    - Definir tipos Button y Location
    - _Requirements: 6.1_
  
  - [x] 11.2 Implementar WhatsApp Business API Client
    - Implementar WhatsAppBusinessApiClient
    - Configurar axios con headers de autorización
    - Implementar sendMessage con retry logic (3 intentos, exponential backoff)
    - Implementar sendInteractiveButtons con formato correcto de WhatsApp API
    - Implementar sendLocation
    - _Requirements: 6.4, 6.5_
  
  - [x] 11.3 Crear Webhook Controller
    - Crear WebhookController con endpoint POST /api/webhooks/whatsapp
    - Implementar WhatsAppSignatureGuard para validar firma
    - Parsear payload de WhatsApp
    - Despachar ProcessIncomingMessageCommand
    - _Requirements: 6.2, 6.3_
  
  - [x] 11.4 Escribir tests para WhatsApp Client
    - Test sendMessage exitoso
    - Test sendMessage con retry en fallo
    - Test sendInteractiveButtons formato correcto
    - _Requirements: 6.4, 6.5_
  
  - [x] 12.5 Escribir property test para retry logic
    - **Property 9: WhatsApp message sending retries on failure**
    - **Validates: Requirements 6.5**
    - Simular fallos, verificar 3 reintentos con backoff
    - _Requirements: 6.5_
  
  - Commit: `git commit -m "feat: implement WhatsApp Business API integration"`
  - Push y crear PR a develop

- [ ] 13. Implementar flujo conversacional básico
  - Crear rama: `git checkout -b feature/conversation-flow`
  - [x] 12.1 Crear Conversation Aggregate (simplificado)
    - Crear Conversation aggregate con estado (SELECTING_SERVICE, SELECTING_DATE, etc.)
    - Implementar métodos para transiciones de estado
    - _Requirements: 7.1_
  
  - [ ] 12.2 Implementar ProcessIncomingMessageHandler
    - Decorar con @CommandHandler(ProcessIncomingMessageCommand)
    - Obtener o crear Conversation para el cliente
    - Implementar máquina de estados simple para flujo conversacional
    - Según estado actual, responder con botones apropiados
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_
  
  - [x] 12.3 Implementar lógica de disponibilidad
    - Crear GetAvailableDatesQuery
    - Crear GetAvailableTimeSlotsQuery
    - Implementar handlers que consultan Capacity
    - _Requirements: 8.1_
  
  - [ ] 12.4 Integrar creación de cita en flujo
    - Cuando cliente confirma, despachar CreateAppointmentCommand
    - Manejar NoAvailableSlotsException y responder "Este horario ya no está disponible"
    - Enviar confirmación exitosa con detalles de la cita
    - _Requirements: 7.5, 8.4_
  
  - [ ] 13.5 Escribir tests E2E para flujo conversacional
    - Test flujo completo: mensaje inicial → selección servicio → fecha → hora → confirmación
    - Test manejo de slot no disponible
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_
  
  - Commit: `git commit -m "feat: implement conversational booking flow"`
  - Push y crear PR a develop

- [-] 14. Implementar Availability Bounded Context (Migración Agresiva Guiada por Pruebas)
  - Crear rama: `git checkout -b feature/availability-bc`
  
  - [x] 14.1 Pre-migración: Ejecutar tests baseline
    - Ejecutar `npm test` y guardar resultados
    - Ejecutar `npm run test:e2e` y guardar resultados
    - Ejecutar `tsc --noEmit` para verificar tipos
    - Ejecutar `npm run lint` para verificar linting
    - Ejecutar `npm run format` para verificar formato
    - Documentar estado actual: todos los tests deben pasar
    - _Requirements: 1.1_
  
  - [x] 14.2 Crear estructura base del BC Availability
    - Crear directorios: src/availability/{domain,app,infra,presentation}
    - Crear subdirectorios: domain/{aggregates,interfaces,read-models,events,exceptions}
    - Crear subdirectorios: app/{commands,queries}
    - Crear subdirectorios: infra/persistence/{models,mappers,repositories}
    - Ejecutar `tsc --noEmit` para verificar
    - Commit: `git commit -m "chore: create availability BC structure"`
    - _Requirements: 1.1, 8.1_
  
  - [x] 14.3 Mover CapacityModel (TypeORM Entity)
    - Mover `src/booking/infra/persistence/models/capacity.ts` → `src/availability/infra/persistence/models/capacity.ts`
    - Ejecutar `tsc --noEmit` (esperamos errores de imports)
    - Ejecutar `npm test` (esperamos fallos)
    - Commit: `git commit -m "refactor: move CapacityModel to availability BC"`
    - _Requirements: 8.1_
  
  - [x] 14.4 Mover CapacityReadModel
    - Mover `src/booking/domain/read-models/capacity.ts` → `src/availability/domain/read-models/capacity.ts`
    - Eliminar duplicado en `src/conversation/domain/read-models/capacity.ts` (si existe)
    - Ejecutar `tsc --noEmit`
    - Commit: `git commit -m "refactor: move CapacityReadModel to availability BC"`
    - _Requirements: 8.1_
  
  - [x] 14.5 Mover interfaces de repositorios
    - Mover `src/booking/domain/interfaces/repositories/capacity-read.ts` → `src/availability/domain/interfaces/repositories/capacity-read.ts`
    - Crear `src/availability/domain/interfaces/repositories/capacity-write.ts` (nueva interfaz)
    - Eliminar duplicados en `src/conversation/domain/interfaces/repositories/capacity-read.ts`
    - Actualizar imports en archivos afectados
    - Ejecutar `tsc --noEmit`
    - Commit: `git commit -m "refactor: move capacity repository interfaces to availability BC"`
    - _Requirements: 8.1_
  
  - [x] 14.6 Mover mappers
    - Mover `src/booking/infra/persistence/mappers/capacity-read.ts` → `src/availability/infra/persistence/mappers/capacity-read.ts`
    - Crear `src/availability/infra/persistence/mappers/capacity-write.ts` (nuevo mapper)
    - Eliminar duplicado en `src/conversation/infra/persistence/mappers/capacity-read.ts`
    - Actualizar imports para usar `@availability/`
    - Ejecutar `tsc --noEmit`
    - Commit: `git commit -m "refactor: move capacity mappers to availability BC"`
    - _Requirements: 8.1_
  
  - [x] 14.7 Mover repositorios
    - Mover `src/booking/infra/persistence/repositories/capacity-read.ts` → `src/availability/infra/persistence/repositories/capacity-read.ts`
    - Crear `src/availability/infra/persistence/repositories/capacity-write.ts` (nuevo repositorio)
    - Eliminar duplicado en `src/conversation/infra/persistence/repositories/capacity-read.ts`
    - Actualizar imports para usar `@availability/`
    - Ejecutar `tsc --noEmit`
    - Commit: `git commit -m "refactor: move capacity repositories to availability BC"`
    - _Requirements: 8.1_
  
  - [x] 14.8 Crear Capacity Aggregate
    - Crear `src/availability/domain/aggregates/capacity.ts`
    - Implementar métodos: create(), bookSlot(), releaseSlot(), updateCapacity()
    - Crear eventos: CapacityCreated, SlotBooked, SlotReleased, CapacityChanged
    - Ejecutar `tsc --noEmit`
    - Commit: `git commit -m "feat: create Capacity aggregate in availability BC"`
    - _Requirements: 8.1, 8.2_
  
  - [x] 14.9 Crear AvailabilityModule
    - Crear `src/availability/availability.module.ts`
    - Importar CqrsModule y TypeOrmModule.forFeature([CapacityModel])
    - Registrar CapacityReadRepository y CapacityWriteRepository
    - Exportar 'ICapacityReadRepository' y 'ICapacityWriteRepository'
    - Ejecutar `tsc --noEmit`
    - Commit: `git commit -m "feat: create AvailabilityModule"`
    - _Requirements: 8.1_
  
  - [x] 14.10 Actualizar BookingModule
    - Importar AvailabilityModule en BookingModule
    - Remover CapacityModel de TypeOrmModule.forFeature
    - Remover CapacityReadRepository de providers
    - Remover MockCapacityWriteRepository (usar el real de AvailabilityModule)
    - Remover exports de ICapacityReadRepository e ICapacityWriteRepository
    - Actualizar imports en CreateAppointmentHandler: `@availability/domain/interfaces/repositories/capacity-write`
    - Ejecutar `tsc --noEmit`
    - Ejecutar `npm test -- booking` (tests de booking deben pasar)
    - Commit: `git commit -m "refactor: update BookingModule to use AvailabilityModule"`
    - _Requirements: 8.1, 8.2_
  
  - [x] 14.11 Actualizar ConversationModule
    - Importar AvailabilityModule en ConversationModule (reemplazar BookingModule)
    - Actualizar imports en GetAvailableDatesHandler: `@availability/domain/interfaces/repositories/capacity-read`
    - Actualizar imports en GetAvailableTimeSlotsHandler: `@availability/domain/interfaces/repositories/capacity-read`
    - Actualizar import de TimeSlot: `@availability/domain/read-models/capacity`
    - Ejecutar `tsc --noEmit`
    - Ejecutar `npm test -- conversation` (tests de conversation deben pasar)
    - Commit: `git commit -m "refactor: update ConversationModule to use AvailabilityModule"`
    - _Requirements: 8.1_
  
  - [x] 14.12 Actualizar AppModule
    - Importar AvailabilityModule en AppModule
    - Agregar AvailabilityModule ANTES de BookingModule (para resolver dependencias)
    - Ejecutar `tsc --noEmit`
    - Commit: `git commit -m "feat: integrate AvailabilityModule in AppModule"`
    - _Requirements: 1.1, 8.1_
  
  - [x] 14.13 Actualizar tsconfig paths
    - Agregar `"@availability/*": ["src/availability/*"]` en tsconfig.json paths
    - Ejecutar `tsc --noEmit`
    - Commit: `git commit -m "chore: add availability path alias to tsconfig"`
    - _Requirements: 1.1_
  
  - [x] 14.14 Post-migración: Verificar tests completos
    - Ejecutar `npm test` (todos los tests deben pasar)
    - Ejecutar `npm run test:e2e` (tests E2E deben pasar)
    - Ejecutar `tsc --noEmit` (sin errores de tipos)
    - Ejecutar `npm run lint` (sin errores de linting)
    - Ejecutar `npm run format` (código formateado)
    - Comparar con baseline de 14.1: mismo número de tests pasando
    - _Requirements: 1.1, 8.1_
  
  - [ ] 14.15 Limpiar archivos duplicados
    - Eliminar archivos vacíos o duplicados en booking/conversation
    - Verificar que no quedan referencias a capacity en booking (excepto en tests)
    - Ejecutar `npm test`
    - Commit: `git commit -m "chore: clean up duplicate capacity files"`
    - _Requirements: 8.1_
  
  - [ ] 14.16 Crear comandos básicos de Availability
    - Crear SetCapacityCommand y SetCapacityHandler
    - Registrar en AvailabilityModule
    - Escribir tests unitarios
    - Ejecutar `npm test -- availability`
    - Commit: `git commit -m "feat: add SetCapacityCommand to availability BC"`
    - _Requirements: 8.1_
  
  - [x] 14.17 Crear queries básicas de Availability
    - Crear GetAvailableSlotsQuery y GetAvailableSlotsHandler
    - Registrar en AvailabilityModule
    - Escribir tests unitarios
    - Ejecutar `npm test -- availability`
    - Commit: `git commit -m "feat: add GetAvailableSlotsQuery to availability BC"`
    - _Requirements: 8.1_
  
  - [x] 14.18 Checkpoint final
    - Ejecutar suite completa: `npm test && npm run test:e2e`
    - Ejecutar `tsc --noEmit && npm run lint && npm run format`
    - Verificar que todos los tests pasan
    - Verificar que no hay errores de tipos
    - Verificar que el código está formateado
    - _Requirements: 1.1, 8.1_
  
  - Push: `git push -u origin feature/availability-bc`
  - Crear PR a develop con título: "feat: implement availability bounded context and migrate capacity"
  - Merge a develop después de aprobación
  - Merge develop a main: `git checkout main && git merge develop && git push origin main`

- [ ] 15. Implementar Autenticación JWT
  - Crear rama: `git checkout -b feature/jwt-authentication`
  - [x] 13.1 Crear Auth Module
    - Instalar @nestjs/jwt y @nestjs/passport
    - Configurar JwtModule con secret y expiration
    - Crear JwtStrategy con PassportStrategy
    - _Requirements: 9.1, 9.2_
  
  - [x] 13.2 Implementar Login y Register
    - Crear RegisterCommand y handler (hashear password con bcrypt)
    - Crear LoginCommand y handler (validar y generar JWT)
    - Crear AuthController con endpoints /api/auth/register y /api/auth/login
    - _Requirements: 9.1, 9.2_
  
  - [x] 13.3 Crear Guards y Decorators
    - Crear JwtAuthGuard usando @nestjs/passport
    - Crear @CurrentUser decorator para extraer usuario del request
    - _Requirements: 9.3, 9.4_
  
  - [x] 13.4 Escribir tests para autenticación
    - Test register hashea password correctamente
    - Test login genera JWT válido
    - Test JwtAuthGuard rechaza tokens inválidos
    - _Requirements: 9.1, 9.2, 9.3, 9.4_
  
  - [x] 13.5 Escribir property test para JWT
    - **Property 13: JWT tokens contain valid user data**
    - **Validates: Requirements 9.3**
    - Generar usuarios aleatorios, crear tokens, verificar payload
    - _Requirements: 9.3_
  
  - [ ] 14.6 Escribir property test para guards
    - **Property 14: Protected endpoints reject invalid tokens**
    - **Validates: Requirements 9.4**
    - Generar tokens inválidos, verificar rechazo 401
    - _Requirements: 9.4_
  
  - Commit: `git commit -m "feat: implement JWT authentication module"`
  - Push y crear PR a develop

- [ ] 16. Implementar REST API para Panel Web
  - Crear rama: `git checkout -b feature/rest-api`
  - [ ] 14.1 Crear DTOs con validación
    - Crear CreateAppointmentDto con decoradores class-validator
    - Crear UpdateBusinessDto
    - Crear CreateOfferingDto
    - Configurar ValidationPipe global en main.ts
    - _Requirements: 10.4_
  
  - [ ] 14.2 Crear AppointmentController
    - Implementar GET /api/appointments (protegido con JwtAuthGuard)
    - Implementar GET /api/appointments/:id
    - Implementar POST /api/appointments
    - Inyectar CommandBus y QueryBus
    - Despachar comandos y queries apropiados
    - _Requirements: 10.1, 10.2_
  
  - [ ] 14.3 Manejar errores de validación
    - Configurar ValidationPipe para retornar 400 con detalles
    - Verificar que DomainExceptionFilter captura excepciones de dominio
    - _Requirements: 10.4, 10.5_
  
  - [ ] 14.4 Escribir tests E2E para API
    - Test POST /api/appointments crea cita exitosamente
    - Test GET /api/appointments retorna lista
    - Test endpoints protegidos requieren JWT
    - Test validación retorna 400 con detalles
    - _Requirements: 10.1, 10.2, 10.3, 10.4_
  
  - [x] 15.5 Escribir property test para validación
    - **Property 15: Validation errors return 400 with details**
    - **Validates: Requirements 10.4**
    - Generar DTOs inválidos, verificar 400 con detalles
    - _Requirements: 10.4_
  
  - Commit: `git commit -m "feat: implement REST API for web panel"`
  - Push y crear PR a develop

- [x] 17. Configurar Logging y Health Checks
  - Crear rama: `git checkout -b feature/logging-health`
  - [x] 15.1 Configurar Winston
    - Instalar winston y nest-winston
    - Configurar transports (Console, File)
    - Configurar formato JSON estructurado
    - Integrar con NestJS Logger
    - _Requirements: 12.1_
  
  - [x] 15.2 Agregar logging a Command Handlers
    - Loggear inicio y fin de cada comando
    - Loggear errores con stack trace
    - Incluir metadata relevante (commandName, timestamp)
    - _Requirements: 12.2, 12.5_
  
  - [x] 15.3 Implementar Health Check
    - Instalar @nestjs/terminus
    - Crear HealthController con endpoint GET /health
    - Agregar TypeOrmHealthIndicator para verificar BD
    - Retornar 503 si BD no está disponible
    - _Requirements: 12.3, 12.4_
  
  - [x] 16.4 Escribir tests para health check
    - Test /health retorna 200 cuando BD está disponible
    - Test /health retorna 503 cuando BD no está disponible
    - _Requirements: 12.3, 12.4_
  
  - Commit: `git commit -m "feat: configure logging and health checks"`
  - Push y crear PR a develop

- [ ] 18. Crear migraciones y seeders
  - Crear rama: `git checkout -b feature/migrations-seeders`
  - [ ] 16.1 Generar migraciones finales
    - Ejecutar npm run migration:generate para capturar todos los cambios
    - Revisar y ajustar migraciones generadas
    - _Requirements: 11.1, 11.2_
  
  - [ ] 16.2 Crear seeder de datos de prueba
    - Crear script seed.ts
    - Insertar negocio de prueba con offerings
    - Insertar horarios de atención
    - Insertar capacidades para próximos 30 días
    - _Requirements: 11.3_
  
  - [x] 17.3 Documentar comandos de BD
    - Documentar npm run migration:run
    - Documentar npm run migration:revert
    - Documentar npm run seed
    - _Requirements: 11.2_
  
  - Commit: `git commit -m "feat: add database migrations and seeders"`
  - Push y crear PR a develop

- [ ] 19. Configurar AppModule principal
  - Crear rama: `git checkout -b feature/app-module-config`
  - Importar ConfigModule.forRoot() como global
  - Importar TypeOrmModule.forRoot() con configuración desde .env
  - Importar CqrsModule.forRoot()
  - Importar SharedModule
  - Importar BookingModule
  - Importar MessagingModule
  - Importar AuthModule
  - Configurar ValidationPipe global
  - Configurar Winston logger
  - Commit: `git commit -m "feat: configure main app module with all imports"`
  - Push y crear PR a develop
  - _Requirements: 1.1, 1.2, 1.3_

- [ ] 20. Checkpoint Final - Verificar sistema completo
  - Ejecutar todos los tests unitarios (npm run test)
  - Ejecutar todos los property tests
  - Ejecutar tests de integración
  - Ejecutar tests de concurrencia
  - Ejecutar tests E2E (npm run test:e2e)
  - Verificar cobertura de tests (npm run test:cov)
  - Ejecutar migraciones en BD limpia
  - Ejecutar seeder
  - Iniciar aplicación y verificar /health
  - Probar flujo completo: registro → login → crear cita vía API
  - Probar flujo WhatsApp: enviar mensaje → recibir botones → crear cita
  - _Requirements: 1.5, 12.3_

- [ ] 21. Documentación final
  - Crear rama: `git checkout -b docs/final-documentation`
  - Crear README.md con instrucciones de setup
  - Documentar variables de entorno requeridas
  - Documentar comandos npm disponibles
  - Documentar estructura de carpetas
  - Documentar cómo agregar nuevos bounded contexts siguiendo el patrón de Booking
  - Crear diagrama de arquitectura actualizado
  - Commit: `git commit -m "docs: add comprehensive project documentation"`
  - Push y crear PR a develop
  - _Requirements: 1.1_

- [ ] 22. Release a producción
  - Merge develop a main: `git checkout main && git merge develop`
  - Crear tag de versión: `git tag -a v1.0.0 -m "Release MVP v1.0.0"`
  - Push a main: `git push origin main`
  - Push tags: `git push origin v1.0.0`
  - _Requirements: 1.1_

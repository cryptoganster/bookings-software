# Requirements Document

## Introduction

Este documento define los requisitos para establecer las bases funcionales del Sistema de Reservas Multi-Tenant vía WhatsApp. El objetivo es crear una estructura escalable aprovechando NestJS y CQRS, con un bounded context completo como referencia para futuras implementaciones.

## Glossary

- **Sistema**: Plataforma SaaS de reservas multi-tenant
- **Bounded Context**: Límite explícito dentro del cual un modelo de dominio es definido y aplicable
- **Aggregate**: Cluster de objetos de dominio que se tratan como una unidad para cambios de datos
- **CQRS**: Command Query Responsibility Segregation - patrón que separa operaciones de lectura y escritura
- **Value Object**: Objeto inmutable que describe características del dominio sin identidad conceptual
- **Command**: Objeto que representa una intención de cambiar el estado del sistema
- **Query**: Objeto que representa una solicitud de información sin cambiar el estado
- **Event**: Objeto que representa algo que ha ocurrido en el dominio
- **Saga**: Orquestador de procesos que escucha eventos y dispara comandos
- **Unit of Work**: Patrón que mantiene una lista de objetos afectados por una transacción
- **Optimistic Locking**: Estrategia de concurrencia que verifica conflictos antes de confirmar cambios
- **Shared Kernel**: Código compartido entre bounded contexts (abstracciones, utilidades)
- **WhatsApp Business API**: API oficial de WhatsApp para comunicación empresarial
- **Webhook**: Endpoint HTTP que recibe notificaciones en tiempo real

## Requirements

### Requirement 1

**User Story:** Como desarrollador, quiero una estructura base de proyecto NestJS configurada con CQRS, para que pueda implementar bounded contexts siguiendo Clean Architecture y DDD.

#### Acceptance Criteria

1. WHEN el proyecto se inicializa THEN el Sistema SHALL crear la estructura de carpetas siguiendo Clean Architecture con capas Domain, Application, Infrastructure y Presentation
2. WHEN se configura CQRS THEN el Sistema SHALL registrar CqrsModule de @nestjs/cqrs con CommandBus, QueryBus y EventBus disponibles
3. WHEN se configura TypeORM THEN el Sistema SHALL establecer conexión con PostgreSQL y configurar migraciones automáticas
4. WHEN se crea el Shared Kernel THEN el Sistema SHALL proveer clases base VersionedAggregateRoot, ValueObject, IUnitOfWork y excepciones comunes
5. WHEN se ejecuta el proyecto THEN el Sistema SHALL iniciar correctamente en modo desarrollo con hot-reload habilitado

### Requirement 2

**User Story:** Como desarrollador, quiero implementar el Shared Kernel con soporte para Optimistic Locking, para que todos los bounded contexts puedan manejar concurrencia de forma consistente.

#### Acceptance Criteria

1. WHEN se crea VersionedAggregateRoot THEN el Sistema SHALL extender AggregateRoot de @nestjs/cqrs y agregar campo version de tipo AggregateVersion
2. WHEN se incrementa la versión de un aggregate THEN el Sistema SHALL crear una nueva instancia de AggregateVersion con el valor incrementado
3. WHEN se implementa IUnitOfWork THEN el Sistema SHALL proveer método transaction que ejecute funciones dentro de transacciones de TypeORM
4. WHEN ocurre un conflicto de versión THEN el Sistema SHALL lanzar ConcurrencyException con mensaje descriptivo
5. WHEN se crea un ValueObject base THEN el Sistema SHALL proveer método equals y getEqualityComponents para comparación por valor

### Requirement 3

**User Story:** Como desarrollador, quiero implementar el bounded context de Booking completo end-to-end, para que sirva como referencia arquitectónica para otros bounded contexts.

#### Acceptance Criteria

1. WHEN se crea el Aggregate Appointment THEN el Sistema SHALL extender VersionedAggregateRoot e implementar métodos create, cancel y modify
2. WHEN se ejecuta un Command THEN el Sistema SHALL procesarlo a través de CommandBus y ejecutar el CommandHandler correspondiente
3. WHEN se ejecuta una Query THEN el Sistema SHALL procesarla a través de QueryBus y retornar datos desde el ReadRepository
4. WHEN un Aggregate aplica un evento THEN el Sistema SHALL publicar el evento automáticamente al EventBus con autoCommit habilitado
5. WHEN se persiste un Aggregate THEN el Sistema SHALL verificar la versión usando Optimistic Locking y lanzar ConcurrencyException si hay conflicto

### Requirement 4

**User Story:** Como desarrollador, quiero configurar repositorios con separación CQRS, para que las operaciones de escritura y lectura estén completamente desacopladas.

#### Acceptance Criteria

1. WHEN se crea un WriteRepository THEN el Sistema SHALL implementar métodos save y findById usando el modelo de escritura
2. WHEN se crea un ReadRepository THEN el Sistema SHALL implementar queries optimizadas usando el modelo de lectura
3. WHEN se guarda un Aggregate THEN el Sistema SHALL usar UPDATE con WHERE version para implementar Optimistic Locking
4. WHEN falla una actualización por versión THEN el Sistema SHALL detectar affected=0 y lanzar ConcurrencyException
5. WHEN se mapea entre dominio y persistencia THEN el Sistema SHALL usar Mappers dedicados para WriteModel y ReadModel

### Requirement 5

**User Story:** Como desarrollador, quiero implementar Event Handlers y Sagas básicas, para que el sistema pueda orquestar flujos complejos mediante eventos.

#### Acceptance Criteria

1. WHEN se publica un evento AppointmentCreated THEN el Sistema SHALL ejecutar OnAppointmentCreatedHandler de forma asíncrona
2. WHEN un EventHandler procesa un evento THEN el Sistema SHALL manejar errores con try-catch sin afectar otros handlers
3. WHEN se define una Saga THEN el Sistema SHALL decorarla con @Saga y retornar Observable que mapea eventos a comandos
4. WHEN una Saga emite un comando THEN el Sistema SHALL despacharlo automáticamente a través de CommandBus
5. WHEN se registran handlers THEN el Sistema SHALL incluirlos en el array providers del módulo correspondiente

### Requirement 6

**User Story:** Como desarrollador, quiero configurar la integración básica con WhatsApp Business API, para que el sistema pueda enviar y recibir mensajes.

#### Acceptance Criteria

1. WHEN se configura WhatsApp Client THEN el Sistema SHALL implementar la interfaz IWhatsAppClient con métodos sendMessage y sendInteractiveButtons
2. WHEN se recibe un webhook de WhatsApp THEN el Sistema SHALL validar la firma del request antes de procesarlo
3. WHEN se procesa un mensaje entrante THEN el Sistema SHALL crear un Command ProcessIncomingMessageCommand y despacharlo
4. WHEN se envía un mensaje THEN el Sistema SHALL hacer una llamada HTTP POST a WhatsApp Business API con el formato correcto
5. WHEN falla el envío de un mensaje THEN el Sistema SHALL registrar el error y reintentar hasta 3 veces con exponential backoff

### Requirement 7

**User Story:** Como desarrollador, quiero implementar un flujo conversacional básico de reservación, para que los clientes puedan agendar citas vía WhatsApp.

#### Acceptance Criteria

1. WHEN un cliente envía su primer mensaje THEN el Sistema SHALL responder con botones interactivos mostrando servicios disponibles
2. WHEN un cliente selecciona un servicio THEN el Sistema SHALL consultar fechas disponibles y presentarlas como botones
3. WHEN un cliente selecciona una fecha THEN el Sistema SHALL consultar horarios disponibles para esa fecha y presentarlos
4. WHEN un cliente selecciona un horario THEN el Sistema SHALL mostrar resumen de la cita con botones Confirmar y Cambiar
5. WHEN un cliente confirma THEN el Sistema SHALL ejecutar CreateAppointmentCommand y enviar mensaje de confirmación

### Requirement 8

**User Story:** Como desarrollador, quiero implementar validación de disponibilidad con manejo de concurrencia, para que múltiples usuarios no puedan reservar el mismo slot simultáneamente.

#### Acceptance Criteria

1. WHEN se verifica disponibilidad THEN el Sistema SHALL consultar el Aggregate Capacity para la fecha y offering solicitados
2. WHEN se crea una cita THEN el Sistema SHALL decrementar availableSlots del Capacity dentro de una transacción
3. WHEN ocurre reservación simultánea THEN el Sistema SHALL detectar conflicto de versión y reintentar hasta 3 veces
4. WHEN se agotan los reintentos THEN el Sistema SHALL responder al cliente con mensaje "Este horario ya no está disponible"
5. WHEN se cancela una cita THEN el Sistema SHALL incrementar availableSlots del Capacity correspondiente

### Requirement 9

**User Story:** Como desarrollador, quiero configurar el módulo de autenticación JWT para el panel web, para que los dueños de negocio puedan acceder de forma segura.

#### Acceptance Criteria

1. WHEN un usuario se registra THEN el Sistema SHALL hashear el password usando bcrypt con salt rounds de 10
2. WHEN un usuario hace login THEN el Sistema SHALL validar credenciales y retornar un JWT token válido
3. WHEN se accede a un endpoint protegido THEN el Sistema SHALL validar el JWT token usando JwtAuthGuard
4. WHEN un token expira THEN el Sistema SHALL retornar error 401 Unauthorized con mensaje descriptivo
5. WHEN se extrae el usuario del token THEN el Sistema SHALL inyectarlo en el request usando @CurrentUser decorator

### Requirement 10

**User Story:** Como desarrollador, quiero implementar endpoints REST básicos para el panel web, para que los dueños de negocio puedan gestionar sus citas y configuración.

#### Acceptance Criteria

1. WHEN se accede a GET /api/appointments THEN el Sistema SHALL ejecutar GetBusinessAppointmentsQuery y retornar lista de citas
2. WHEN se accede a POST /api/offerings THEN el Sistema SHALL ejecutar CreateOfferingCommand con datos validados
3. WHEN se accede a PUT /api/business THEN el Sistema SHALL ejecutar UpdateBusinessInfoCommand y retornar datos actualizados
4. WHEN se envían datos inválidos THEN el Sistema SHALL retornar error 400 con detalles de validación usando class-validator
5. WHEN ocurre un error de dominio THEN el Sistema SHALL capturarlo con ExceptionFilter y retornar código HTTP apropiado

### Requirement 11

**User Story:** Como desarrollador, quiero configurar migraciones de base de datos y seeders iniciales, para que el sistema tenga datos de prueba y estructura consistente.

#### Acceptance Criteria

1. WHEN se ejecuta npm run migration:generate THEN el Sistema SHALL crear archivo de migración con cambios detectados en entities
2. WHEN se ejecuta npm run migration:run THEN el Sistema SHALL aplicar todas las migraciones pendientes en orden
3. WHEN se ejecuta npm run seed THEN el Sistema SHALL crear un negocio de prueba con offerings y horarios configurados
4. WHEN se crea una tabla THEN el Sistema SHALL incluir campos id, createdAt, updatedAt y version donde corresponda
5. WHEN se define una relación THEN el Sistema SHALL crear índices apropiados para optimizar queries

### Requirement 12

**User Story:** Como desarrollador, quiero configurar logging estructurado y health checks, para que el sistema sea observable y monitoreable.

#### Acceptance Criteria

1. WHEN ocurre un evento importante THEN el Sistema SHALL registrarlo con Winston usando formato JSON estructurado
2. WHEN se ejecuta un Command THEN el Sistema SHALL loggear el nombre del command, timestamp y resultado
3. WHEN se accede a GET /health THEN el Sistema SHALL retornar status 200 con información de database y memoria
4. WHEN falla la conexión a base de datos THEN el Sistema SHALL retornar status 503 en el health check
5. WHEN ocurre una excepción THEN el Sistema SHALL loggear el stack trace completo con nivel error

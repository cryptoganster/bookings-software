# Requirements Document

## Introduction

Este documento define los requisitos para refactorizar el backend y eliminar todas las violaciones arquitectónicas identificadas. El sistema actualmente viola principios de Clean Architecture, CQRS estricto y DDD en varios puntos críticos. Esta refactorización garantizará que el código cumpla estrictamente con los principios arquitectónicos definidos en los steering files del proyecto.

## Glossary

- **System**: Backend del Sistema de Reservas Multi-Tenant
- **Command Handler**: Componente de application layer que ejecuta comandos de escritura
- **Query Handler**: Componente de application layer que ejecuta consultas de lectura
- **Domain Service**: Servicio que encapsula lógica de dominio que no pertenece a un aggregate
- **Read Repository**: Repositorio que solo retorna read models (DTOs) para queries
- **Write Repository**: Repositorio que solo persiste aggregates
- **Factory**: Componente que carga aggregates desde persistencia para modificación
- **Bounded Context (BC)**: Límite explícito de un modelo de dominio
- **Application Layer**: Capa que contiene commands, queries y event handlers
- **Infrastructure Layer**: Capa que contiene implementaciones técnicas (repositories, models, external clients)
- **Domain Layer**: Capa que contiene lógica de negocio pura (aggregates, value objects, events)

## Requirements

### Requirement 1: CQRS Strict Separation

**User Story:** Como arquitecto del sistema, quiero que los command handlers NO usen read repositories, para mantener CQRS estricto y permitir optimización independiente de lectura y escritura.

#### Acceptance Criteria

1. WHEN a command handler needs to validate uniqueness THEN the System SHALL use a domain service that encapsulates the read repository access
2. WHEN a command handler needs to verify existence THEN the System SHALL use a domain service or query before the command
3. WHEN a command handler executes THEN the System SHALL only use write repositories and factories for aggregate persistence
4. WHEN a query handler executes THEN the System SHALL only use read repositories and SHALL NOT modify any state
5. WHEN validating business rules THEN the System SHALL use domain services instead of direct read repository access in command handlers

### Requirement 2: Clean Architecture Layer Boundaries

**User Story:** Como arquitecto del sistema, quiero que la application layer NO importe de infrastructure layer, para mantener la inversión de dependencias y permitir cambiar implementaciones sin afectar lógica de negocio.

#### Acceptance Criteria

1. WHEN application layer code is written THEN the System SHALL NOT import TypeORM models from infrastructure layer
2. WHEN application layer code is written THEN the System SHALL NOT use TypeORM decorators like InjectRepository
3. WHEN application layer code is written THEN the System SHALL NOT import Repository class from typeorm
4. WHEN application layer needs database access THEN the System SHALL use domain interfaces (IRepository, IFactory) injected via tokens
5. WHEN infrastructure implementations change THEN the System SHALL NOT require changes in application layer

### Requirement 3: Bounded Context Isolation

**User Story:** Como arquitecto del sistema, quiero que los bounded contexts se comuniquen solo via domain events y CommandBus/QueryBus, para mantener bajo acoplamiento y permitir evolución independiente de cada BC.

#### Acceptance Criteria

1. WHEN a BC needs data from another BC THEN the System SHALL use QueryBus to execute queries from that BC
2. WHEN a BC needs to trigger actions in another BC THEN the System SHALL use CommandBus to execute commands
3. WHEN a BC reacts to changes in another BC THEN the System SHALL use event handlers listening to domain events
4. WHEN application layer code is written THEN the System SHALL NOT import aggregates from other BCs
5. WHEN application layer code is written THEN the System SHALL NOT import value objects from other BCs except through shared kernel

### Requirement 4: Domain Services for Validation

**User Story:** Como desarrollador, quiero domain services que encapsulen validaciones de unicidad y existencia, para mantener CQRS estricto y reutilizar lógica de validación.

#### Acceptance Criteria

1. WHEN validating uniqueness constraints THEN the System SHALL provide domain services with methods that return boolean results
2. WHEN a domain service is created THEN the System SHALL place it in the domain/services directory
3. WHEN a domain service needs data access THEN the System SHALL inject read repositories via domain interfaces
4. WHEN multiple command handlers need the same validation THEN the System SHALL reuse the same domain service
5. WHEN domain services execute THEN the System SHALL NOT modify any state or publish events

### Requirement 5: Factory Pattern Compliance

**User Story:** Como desarrollador, quiero que todos los aggregates se carguen usando factories, para mantener CQRS estricto y preservar versiones para optimistic locking.

#### Acceptance Criteria

1. WHEN a command handler needs to load an existing aggregate THEN the System SHALL use a factory interface
2. WHEN a factory loads an aggregate THEN the System SHALL preserve the version field for optimistic locking
3. WHEN a factory is created THEN the System SHALL place the interface in domain/interfaces/factories
4. WHEN a factory is implemented THEN the System SHALL place the implementation in infra/persistence/factories
5. WHEN write repositories are defined THEN the System SHALL NOT include findById or load methods

### Requirement 6: Test Coverage Maintenance

**User Story:** Como desarrollador, quiero que todas las refactorizaciones mantengan o mejoren la cobertura de tests, para garantizar que no introducimos regresiones.

#### Acceptance Criteria

1. WHEN code is refactored THEN the System SHALL maintain all existing passing tests
2. WHEN domain services are created THEN the System SHALL include unit tests for each service
3. WHEN command handlers are refactored THEN the System SHALL update integration tests accordingly
4. WHEN refactoring is complete THEN the System SHALL execute all tests and verify they pass
5. WHEN new patterns are introduced THEN the System SHALL add tests demonstrating the correct usage

### Requirement 7: Import Path Compliance

**User Story:** Como desarrollador, quiero que todos los imports usen path aliases correctamente, para mantener consistencia y facilitar refactoring.

#### Acceptance Criteria

1. WHEN importing from another module THEN the System SHALL use TypeScript path aliases instead of relative paths
2. WHEN importing from shared kernel THEN the System SHALL use @shared/\* path alias
3. WHEN importing from same BC THEN the System SHALL use @{bc-name}/\* path alias
4. WHEN importing from packages THEN the System SHALL use @packages/\* path alias
5. WHEN ESLint validation runs THEN the System SHALL report zero path alias violations

### Requirement 8: Documentation and Examples

**User Story:** Como desarrollador, quiero documentación clara de los patrones arquitectónicos correctos, para evitar futuras violaciones y facilitar onboarding de nuevos desarrolladores.

#### Acceptance Criteria

1. WHEN architectural patterns are documented THEN the System SHALL include code examples showing correct usage
2. WHEN architectural patterns are documented THEN the System SHALL include anti-patterns showing incorrect usage
3. WHEN domain services pattern is documented THEN the System SHALL explain when to use domain services vs queries
4. WHEN refactoring is complete THEN the System SHALL update all relevant steering files with new patterns
5. WHEN documentation is updated THEN the System SHALL include references to actual code files as examples

### Requirement 9: Commit Strategy and Git Workflow

**User Story:** Como desarrollador, quiero commits atómicos y descriptivos durante la refactorización, para facilitar code review y permitir rollback granular si es necesario.

#### Acceptance Criteria

1. WHEN refactoring a module THEN the System SHALL create one commit per bounded context refactored
2. WHEN creating domain services THEN the System SHALL commit domain services separately from handler refactoring
3. WHEN updating tests THEN the System SHALL commit test updates separately from implementation changes
4. WHEN all refactoring is complete THEN the System SHALL verify all tests pass before final commit
5. WHEN commit messages are written THEN the System SHALL follow conventional commits format with scope

### Requirement 10: Backward Compatibility

**User Story:** Como arquitecto del sistema, quiero que la refactorización mantenga compatibilidad con el comportamiento actual, para evitar romper funcionalidad existente.

#### Acceptance Criteria

1. WHEN command handlers are refactored THEN the System SHALL maintain the same public interface (command structure)
2. WHEN domain services are introduced THEN the System SHALL NOT change the behavior of existing commands
3. WHEN repositories are refactored THEN the System SHALL maintain the same query results
4. WHEN refactoring is complete THEN the System SHALL verify all E2E tests pass
5. WHEN exceptions are thrown THEN the System SHALL maintain the same exception types and messages

### Requirement 11: Specific Handler Refactoring - SendAdminResponseHandler

**User Story:** Como desarrollador, quiero refactorizar SendAdminResponseHandler para eliminar el uso directo de TypeORM Repository y Read Repository, manteniendo CQRS estricto.

#### Acceptance Criteria

1. WHEN SendAdminResponseHandler needs conversation data THEN the System SHALL use ConversationFactory to load the aggregate
2. WHEN SendAdminResponseHandler updates conversation status THEN the System SHALL call aggregate method and use write repository
3. WHEN SendAdminResponseHandler executes THEN the System SHALL NOT inject TypeORM Repository directly
4. WHEN SendAdminResponseHandler executes THEN the System SHALL NOT inject IConversationReadRepository
5. WHEN conversation is not found THEN the System SHALL throw NotFoundException with same message as before

### Requirement 12: Retry Logic for Optimistic Locking

**User Story:** Como desarrollador, quiero que los command handlers que modifican aggregates versionados implementen retry logic, para manejar ConcurrencyException automáticamente.

#### Acceptance Criteria

1. WHEN a command handler modifies a versioned aggregate THEN the System SHALL implement retry logic with maximum 3 attempts
2. WHEN ConcurrencyException is caught THEN the System SHALL wait with exponential backoff (100ms \* 2^attempt)
3. WHEN retrying THEN the System SHALL reload the aggregate with updated version using factory
4. WHEN maximum retries are exhausted THEN the System SHALL throw descriptive error to user
5. WHEN retry succeeds THEN the System SHALL complete the command normally

### Requirement 13: Event Handler Error Handling

**User Story:** Como arquitecto del sistema, quiero que los event handlers NO propaguen excepciones, para mantener eventual consistency y evitar que un BC falle por errores en otro BC.

#### Acceptance Criteria

1. WHEN an event handler executes THEN the System SHALL wrap execution in try-catch
2. WHEN an event handler throws exception THEN the System SHALL log the error with full context
3. WHEN an event handler throws exception THEN the System SHALL NOT propagate the exception to the event publisher
4. WHEN an event handler fails THEN the System SHALL allow other event handlers to execute normally
5. WHEN critical event handlers fail THEN the System SHALL implement retry mechanism or dead letter queue

### Requirement 14: Process Manager (Saga) Validation

**User Story:** Como arquitecto del sistema, quiero validar que los Process Managers usen correctamente RxJS y CommandBus, para mantener orquestación asíncrona correcta.

#### Acceptance Criteria

1. WHEN a process manager is defined THEN the System SHALL use @Saga() decorator
2. WHEN a process manager listens to events THEN the System SHALL use ofType() operator from RxJS
3. WHEN a process manager emits commands THEN the System SHALL return Observable<ICommand>
4. WHEN a process manager combines multiple event streams THEN the System SHALL use merge() operator
5. WHEN a process manager is registered THEN the System SHALL be singleton scope

### Requirement 15: Domain Service Implementation Standards

**User Story:** Como desarrollador, quiero estándares claros para implementar domain services, para mantener consistencia en todo el código.

#### Acceptance Criteria

1. WHEN a domain service is created THEN the System SHALL place interface in domain/interfaces/services
2. WHEN a domain service is created THEN the System SHALL place implementation in domain/services
3. WHEN a domain service is created THEN the System SHALL use @Injectable() decorator
4. WHEN a domain service needs repositories THEN the System SHALL inject via domain interfaces with tokens
5. WHEN a domain service is created THEN the System SHALL include JSDoc comments explaining purpose and usage

### Requirement 16: Eliminate Direct TypeORM Usage in Application Layer

**User Story:** Como arquitecto del sistema, quiero eliminar todo uso directo de TypeORM en application layer, para mantener inversión de dependencias.

#### Acceptance Criteria

1. WHEN application layer code is analyzed THEN the System SHALL NOT import Repository from typeorm
2. WHEN application layer code is analyzed THEN the System SHALL NOT use @InjectRepository decorator
3. WHEN application layer code is analyzed THEN the System SHALL NOT import TypeORM models
4. WHEN application layer needs database access THEN the System SHALL use domain interfaces only
5. WHEN ESLint runs THEN the System SHALL report violations of TypeORM usage in application layer

### Requirement 17: Validate No Cross-BC Aggregate Imports

**User Story:** Como arquitecto del sistema, quiero validar que ningún BC importe aggregates de otro BC, para mantener boundaries estrictos.

#### Acceptance Criteria

1. WHEN code is analyzed THEN the System SHALL NOT import aggregates from other BCs in application layer
2. WHEN code is analyzed THEN the System SHALL NOT import value objects from other BCs (except shared)
3. WHEN code is analyzed THEN the System SHALL allow imports of domain events from other BCs
4. WHEN code is analyzed THEN the System SHALL allow imports of domain interfaces from other BCs
5. WHEN ESLint runs THEN the System SHALL report cross-BC aggregate imports as errors

### Requirement 18: Integration Test Updates

**User Story:** Como desarrollador, quiero actualizar integration tests para reflejar el nuevo diseño con domain services, para mantener cobertura de tests.

#### Acceptance Criteria

1. WHEN command handlers are refactored THEN the System SHALL update integration tests to mock domain services
2. WHEN domain services are created THEN the System SHALL create integration tests that verify repository interaction
3. WHEN integration tests run THEN the System SHALL use test database with proper isolation
4. WHEN integration tests complete THEN the System SHALL clean up test data
5. WHEN all integration tests run THEN the System SHALL pass 100% of tests

### Requirement 19: Property-Based Tests for Domain Services

**User Story:** Como desarrollador, quiero property-based tests para domain services, para validar comportamiento con múltiples inputs aleatorios.

#### Acceptance Criteria

1. WHEN domain services validate uniqueness THEN the System SHALL include property tests with random inputs
2. WHEN domain services check existence THEN the System SHALL include property tests verifying idempotence
3. WHEN property tests run THEN the System SHALL execute minimum 100 iterations
4. WHEN property tests are written THEN the System SHALL use fast-check library
5. WHEN property tests fail THEN the System SHALL report the failing example for debugging

### Requirement 20: CI/CD Validation

**User Story:** Como arquitecto del sistema, quiero que CI/CD valide automáticamente el cumplimiento arquitectónico, para prevenir merge de código que viole reglas.

#### Acceptance Criteria

1. WHEN CI pipeline runs THEN the System SHALL execute ESLint with architecture rules
2. WHEN CI pipeline runs THEN the System SHALL execute all unit tests
3. WHEN CI pipeline runs THEN the System SHALL execute all integration tests
4. WHEN CI pipeline runs THEN the System SHALL execute type checking with TypeScript
5. WHEN any validation fails THEN the System SHALL block merge to main branch

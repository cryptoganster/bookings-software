# Requirements Document

## Introduction

Este spec define la implementación del patrón Factory para la reconstrucción de aggregates desde persistencia, eliminando métodos de lectura de los write repositories y garantizando CQRS estricto en todos los bounded contexts del sistema.

Actualmente, el bounded context `availability` ya implementa este patrón correctamente con `CapacityFactory`. Este spec busca replicar esta solución en todos los demás bounded contexts que tienen write repositories con métodos de lectura.

## Glossary

- **Factory**: Componente de infraestructura responsable de reconstruir aggregates desde modelos de persistencia
- **Write Repository**: Repositorio que solo debe contener operaciones de escritura (save, delete)
- **Read Repository**: Repositorio que solo debe contener operaciones de lectura (find, list)
- **Aggregate**: Raíz de agregado en DDD que encapsula lógica de negocio
- **CQRS**: Command Query Responsibility Segregation - separación estricta entre escritura y lectura
- **Persistence Model**: Modelo de TypeORM que representa la estructura de base de datos
- **Domain Aggregate**: Objeto de dominio con lógica de negocio

## Requirements

### Requirement 1

**User Story:** Como desarrollador del sistema, quiero que todos los write repositories solo contengan operaciones de escritura, para mantener CQRS estricto y separación de responsabilidades.

#### Acceptance Criteria

1. WHEN un write repository necesita reconstruir un aggregate THEN el sistema SHALL usar una Factory dedicada para la reconstrucción
2. WHEN se implementa un write repository THEN el sistema SHALL garantizar que no contiene métodos de lectura como `findById`, `findByBusinessId`, etc.
3. WHEN se necesita cargar un aggregate para modificarlo THEN el sistema SHALL usar el read repository para obtener datos y la factory para reconstruir el aggregate
4. WHEN se implementa una factory THEN el sistema SHALL colocarla en `src/{bc}/infra/persistence/factories/`
5. WHERE un bounded context tiene aggregates versionados THEN la factory SHALL reconstruir el aggregate con su versión correcta

### Requirement 2

**User Story:** Como desarrollador del sistema, quiero que las factories sigan un patrón consistente en todos los bounded contexts, para facilitar el mantenimiento y comprensión del código.

#### Acceptance Criteria

1. WHEN se crea una factory THEN el sistema SHALL seguir el patrón establecido por `CapacityFactory`
2. WHEN una factory reconstruye un aggregate THEN el sistema SHALL usar el método estático `fromPersistence` del aggregate
3. WHEN una factory recibe un modelo de persistencia THEN el sistema SHALL mapear todos los campos necesarios incluyendo la versión
4. WHEN se implementa una factory THEN el sistema SHALL usar inyección de dependencias para repositorios necesarios
5. WHEN una factory necesita datos relacionados THEN el sistema SHALL usar read repositories para obtenerlos

### Requirement 3

**User Story:** Como desarrollador del sistema, quiero refactorizar los bounded contexts existentes para usar factories, para eliminar violaciones de CQRS en write repositories.

#### Acceptance Criteria

1. WHEN se identifica un write repository con métodos de lectura THEN el sistema SHALL crear una factory correspondiente
2. WHEN se crea una factory THEN el sistema SHALL mover la lógica de reconstrucción desde el write repository a la factory
3. WHEN se refactoriza un write repository THEN el sistema SHALL actualizar los command handlers para usar la factory
4. WHEN se completa la refactorización THEN el sistema SHALL eliminar los métodos de lectura del write repository
5. WHEN se actualiza un command handler THEN el sistema SHALL usar read repository + factory en lugar de write repository con métodos de lectura

### Requirement 4

**User Story:** Como desarrollador del sistema, quiero que los command handlers usen el patrón correcto de lectura + factory + escritura, para mantener la separación de responsabilidades.

#### Acceptance Criteria

1. WHEN un command handler necesita modificar un aggregate THEN el sistema SHALL usar read repository para obtener datos
2. WHEN un command handler obtiene datos del read repository THEN el sistema SHALL usar factory para reconstruir el aggregate
3. WHEN un command handler modifica un aggregate THEN el sistema SHALL usar write repository solo para persistir
4. WHEN un command handler no encuentra datos en read repository THEN el sistema SHALL lanzar excepción de dominio apropiada
5. WHEN un command handler completa exitosamente THEN el sistema SHALL haber usado read repository, factory y write repository en ese orden

### Requirement 5

**User Story:** Como desarrollador del sistema, quiero que las factories manejen correctamente aggregates con relaciones, para reconstruir el estado completo del aggregate.

#### Acceptance Criteria

1. WHEN un aggregate tiene value objects THEN la factory SHALL reconstruir los value objects correctamente
2. WHEN un aggregate tiene referencias a otros aggregates THEN la factory SHALL usar solo IDs (UUIDs) sin cargar los aggregates relacionados
3. WHEN un aggregate necesita datos de otros bounded contexts THEN la factory SHALL obtenerlos mediante read repositories
4. WHEN una factory reconstruye un aggregate versionado THEN el sistema SHALL establecer la versión correcta usando `setVersion()`
5. WHEN una factory reconstruye un aggregate THEN el sistema SHALL NO publicar eventos de dominio

### Requirement 6

**User Story:** Como desarrollador del sistema, quiero que los tests validen el uso correcto de factories, para garantizar que CQRS estricto se mantiene.

#### Acceptance Criteria

1. WHEN se testea un command handler THEN el test SHALL verificar que usa read repository para lectura
2. WHEN se testea un command handler THEN el test SHALL verificar que usa factory para reconstrucción
3. WHEN se testea un command handler THEN el test SHALL verificar que usa write repository solo para escritura
4. WHEN se testea una factory THEN el test SHALL verificar que reconstruye el aggregate correctamente
5. WHEN se testea una factory THEN el test SHALL verificar que establece la versión correcta en aggregates versionados

### Requirement 7

**User Story:** Como desarrollador del sistema, quiero identificar todos los bounded contexts que necesitan refactorización, para planificar el trabajo de implementación.

#### Acceptance Criteria

1. WHEN se audita el código THEN el sistema SHALL identificar todos los write repositories con métodos de lectura
2. WHEN se identifica un write repository violando CQRS THEN el sistema SHALL documentar qué métodos deben moverse
3. WHEN se planifica la refactorización THEN el sistema SHALL priorizar bounded contexts por impacto y complejidad
4. WHEN se documenta un bounded context THEN el sistema SHALL listar los aggregates que necesitan factories
5. WHEN se completa la auditoría THEN el sistema SHALL tener una lista completa de trabajo a realizar

### Requirement 8

**User Story:** Como desarrollador del sistema, quiero actualizar toda la documentación existente para reflejar el nuevo patrón Factory, para mantener consistencia en specs y steering files.

#### Acceptance Criteria

1. WHEN se implementa el patrón Factory THEN el sistema SHALL actualizar `.kiro/steering/ddd-patterns.md` con ejemplos del nuevo patrón
2. WHEN se actualiza la documentación THEN el sistema SHALL reemplazar ejemplos de write repositories con métodos de lectura por el patrón Factory
3. WHEN se documenta el patrón THEN el sistema SHALL incluir ejemplos de command handlers usando read repo + factory + write repo
4. WHEN se actualiza `.kiro/steering/ddd-patterns.md` THEN el sistema SHALL agregar una sección dedicada al patrón Factory
5. WHEN se completa la documentación THEN el sistema SHALL verificar que todos los specs existentes referencien el patrón correcto

## Bounded Contexts Identificados para Refactorización

### BC: Booking

**Aggregates:** Appointment
**Write Repository:** `IAppointmentWriteRepository`
**Métodos a eliminar:** `findById()`
**Factory a crear:** `AppointmentFactory`

### BC: Offering

**Aggregates:** Offering
**Write Repository:** `IOfferingWriteRepository`
**Métodos a eliminar:** `findById()`, `findByBusinessId()`
**Factory a crear:** `OfferingFactory`

### BC: Auth

**Aggregates:** User
**Write Repository:** `IUserWriteRepository`
**Métodos a eliminar:** `findById()`, `findByEmail()`
**Factory a crear:** `UserFactory`

### BC: Availability (✅ Ya implementado)

**Aggregates:** Capacity
**Write Repository:** `ICapacityWriteRepository`
**Factory existente:** `CapacityFactory` ✅

## Patrón de Referencia

El patrón a seguir está implementado en:

- Factory: `apps/backend/src/availability/infra/persistence/factories/capacity-factory.ts`
- Write Repository: `apps/backend/src/availability/infra/persistence/repositories/capacity-write.ts`
- Command Handler: `apps/backend/src/availability/app/commands/set-capacity/handler.ts`

## Documentación a Actualizar

### Steering Files

#### `.kiro/steering/ddd-patterns.md`

**Sección a actualizar:** Repositories
**Cambios necesarios:**

- Eliminar ejemplo de `IAppointmentWriteRepository` con método `findById()`
- Agregar nueva sección "Factories" después de "Repositories"
- Actualizar ejemplo de write repository para mostrar solo operaciones de escritura
- Agregar ejemplo de Factory pattern con `CapacityFactory` como referencia
- Actualizar ejemplo de command handler para mostrar uso de read repo + factory + write repo

### Specs Existentes

#### `.kiro/specs/offering-bc/tasks.md`

**Línea 108-111:** Actualizar task 10 "Implement Write Repository"
**Cambios necesarios:**

- Agregar sub-task para crear `OfferingFactory`
- Especificar que write repository solo debe tener `save()` y `delete()`
- Agregar referencia al patrón Factory de availability

#### Otros Specs

**Verificar y actualizar si contienen:**

- Referencias a write repositories con métodos de lectura
- Ejemplos de command handlers que usan write repositories para lectura
- Diagramas o flujos que no muestren el patrón Factory

## Beneficios Esperados

1. **CQRS Estricto**: Separación clara entre lectura y escritura
2. **Single Responsibility**: Cada componente tiene una única responsabilidad
3. **Testabilidad**: Más fácil mockear y testear componentes individuales
4. **Mantenibilidad**: Código más limpio y fácil de entender
5. **Consistencia**: Patrón uniforme en todos los bounded contexts
6. **Escalabilidad**: Facilita optimizaciones independientes de lectura/escritura
7. **Documentación Actualizada**: Toda la documentación refleja las mejores prácticas actuales

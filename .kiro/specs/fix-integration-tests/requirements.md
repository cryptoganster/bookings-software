# Requirements Document - Fix Integration Tests

## Introduction

Los tests de integración del backend están fallando debido a problemas de conexión con PostgreSQL. El error principal es `TypeError: this.postgres.Pool is not a constructor`, lo que indica un problema de compatibilidad entre TypeORM y el driver `pg`.

## Glossary

- **Integration Test**: Test que verifica la integración entre componentes del sistema, incluyendo la base de datos
- **TypeORM**: ORM (Object-Relational Mapping) utilizado en el proyecto
- **pg**: Driver de PostgreSQL para Node.js
- **Docker Container**: Contenedor de Docker que ejecuta PostgreSQL para tests

## Requirements

### Requirement 1

**User Story:** Como desarrollador, quiero que los tests de integración pasen exitosamente, para poder validar que el código funciona correctamente con la base de datos.

#### Acceptance Criteria

1. WHEN se ejecutan los tests de integración THEN el sistema SHALL conectarse exitosamente a la base de datos de prueba
2. WHEN se ejecutan los tests de integración THEN todos los tests SHALL pasar sin errores de conexión
3. WHEN se ejecutan los tests de integración THEN el sistema SHALL usar el driver `pg` correctamente con TypeORM
4. WHEN se ejecutan los tests de integración THEN el sistema SHALL limpiar correctamente las conexiones después de cada test

### Requirement 2

**User Story:** Como desarrollador, quiero que el contenedor de Docker de PostgreSQL esté configurado correctamente, para que los tests puedan ejecutarse de manera confiable.

#### Acceptance Criteria

1. WHEN se inicia el contenedor de PostgreSQL THEN el sistema SHALL verificar que el contenedor está corriendo
2. WHEN se ejecutan los tests THEN el sistema SHALL usar la base de datos `bookings_test`
3. WHEN se ejecutan los tests THEN el sistema SHALL usar las credenciales correctas (postgres/postgres)
4. WHEN se ejecutan los tests THEN el sistema SHALL conectarse al puerto 5432

### Requirement 3

**User Story:** Como desarrollador, quiero que las dependencias de TypeORM y pg estén en versiones compatibles, para evitar errores de tipo "Pool is not a constructor".

#### Acceptance Criteria

1. WHEN se instalan las dependencias THEN el sistema SHALL usar versiones compatibles de TypeORM y pg
2. WHEN se ejecuta TypeORM THEN el sistema SHALL poder crear instancias de Pool correctamente
3. WHEN se ejecutan múltiples tests THEN el sistema SHALL manejar correctamente el pool de conexiones
4. WHEN se finalizan los tests THEN el sistema SHALL cerrar todas las conexiones abiertas

### Requirement 4

**User Story:** Como desarrollador, quiero que todas las entidades del sistema estén registradas en el DataSource de pruebas, para que los tests de integración puedan hacer joins y queries correctamente.

#### Acceptance Criteria

1. WHEN se crea el DataSource de pruebas THEN el sistema SHALL incluir todas las entidades del sistema (Appointment, Capacity, Offering, Customer, Business, BusinessOwner, User)
2. WHEN se ejecutan tests que hacen joins con otras tablas THEN el sistema SHALL encontrar las tablas correspondientes en la base de datos
3. WHEN se ejecutan tests de AppointmentReadRepository THEN el sistema SHALL poder hacer joins con la tabla `offerings`
4. WHEN se ejecutan tests de AppointmentReadRepository THEN el sistema SHALL poder hacer joins con la tabla `customers`
5. WHEN se ejecutan tests que usan cualquier entidad THEN el sistema SHALL tener acceso a todas las tablas necesarias

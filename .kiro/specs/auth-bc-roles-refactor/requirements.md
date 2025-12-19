# Requirements Document

## Introduction

Este documento define los requisitos para refactorizar el Auth BC (Bounded Context de Autenticación) para soportar la arquitectura unificada de identidades con roles múltiples según el diseño definido en `.kiro/steering/user-customer-businessowner-architecture.md` y `.kiro/steering/PRD.md`.

El Auth BC actual tiene una implementación básica que vincula directamente User con Business (campo `businessId`), lo cual no refleja la arquitectura objetivo donde:

- **User** es la identidad universal con roles múltiples
- **BusinessOwner** es un perfil separado en Account BC
- **Customer** es un perfil separado en Customer BC
- Un User puede tener ambos roles simultáneamente

## Glossary

- **User**: Identidad universal del sistema con autenticación (email/password) y roles múltiples
- **UserRole**: Enum que define los roles posibles: BUSINESS_OWNER, CUSTOMER, ADMIN
- **Auth BC**: Bounded Context responsable de autenticación y gestión de identidades universales
- **Account BC**: Bounded Context responsable de perfiles de BusinessOwner y suscripciones
- **Customer BC**: Bounded Context responsable de perfiles de clientes finales
- **JWT Token**: JSON Web Token usado para autenticación stateless
- **Domain Event**: Evento que representa un cambio en el estado del dominio

## Requirements

### Requirement 1

**User Story:** Como desarrollador del sistema, quiero que User sea la identidad universal con roles múltiples, para que un mismo usuario pueda ser BUSINESS_OWNER y CUSTOMER simultáneamente.

#### Acceptance Criteria

1. WHEN se crea un User THEN el sistema SHALL almacenar un array de roles (UserRole[])
2. WHEN se registra un User THEN el sistema SHALL requerir al menos un rol inicial
3. WHEN se consulta un User THEN el sistema SHALL retornar todos sus roles activos
4. WHEN un User tiene múltiples roles THEN el sistema SHALL permitir operaciones según cada rol
5. THE User aggregate SHALL NOT tener campo businessId (violación de separación de concerns)

### Requirement 2

**User Story:** Como desarrollador del sistema, quiero que User pueda agregar y remover roles dinámicamente, para soportar la evolución de usuarios en el marketplace.

#### Acceptance Criteria

1. WHEN se ejecuta AddUserRoleCommand THEN el sistema SHALL agregar el rol si no existe
2. WHEN se intenta agregar un rol existente THEN el sistema SHALL lanzar UserAlreadyHasRoleException
3. WHEN se ejecuta RemoveUserRoleCommand THEN el sistema SHALL remover el rol si existe
4. WHEN se intenta remover el último rol THEN el sistema SHALL lanzar CannotRemoveLastRoleException
5. WHEN se agrega o remueve un rol THEN el sistema SHALL publicar UserRoleAdded o UserRoleRemoved event

### Requirement 3

**User Story:** Como desarrollador del sistema, quiero que UserRegistered event incluya el rol inicial, para que otros BCs puedan reaccionar apropiadamente.

#### Acceptance Criteria

1. WHEN se publica UserRegistered event THEN el sistema SHALL incluir el initialRole
2. WHEN Account BC escucha UserRegistered con role=BUSINESS_OWNER THEN el sistema SHALL crear BusinessOwner automáticamente
3. WHEN Customer BC escucha CustomerLinkedToUser THEN el sistema SHALL agregar role CUSTOMER al User
4. THE UserRegistered event SHALL incluir userId, email, name, initialRole, occurredAt

### Requirement 4

**User Story:** Como desarrollador del sistema, quiero que el JWT token incluya los roles del usuario, para que el frontend pueda mostrar vistas apropiadas según el contexto.

#### Acceptance Criteria

1. WHEN se genera un JWT token THEN el sistema SHALL incluir el array de roles en el payload
2. WHEN se valida un JWT token THEN el sistema SHALL extraer los roles del payload
3. THE JWT payload SHALL NOT incluir businessId (violación de separación)
4. WHEN un User tiene role BUSINESS_OWNER THEN el frontend SHALL mostrar vista "Mi Negocio"
5. WHEN un User tiene role CUSTOMER THEN el frontend SHALL mostrar vista "Mis Citas"

### Requirement 5

**User Story:** Como desarrollador del sistema, quiero que User tenga métodos de negocio para gestionar roles, para encapsular la lógica de validación.

#### Acceptance Criteria

1. THE User aggregate SHALL tener método addRole(role: UserRole): void
2. THE User aggregate SHALL tener método removeRole(role: UserRole): void
3. THE User aggregate SHALL tener método hasRole(role: UserRole): boolean
4. WHEN se llama addRole con rol duplicado THEN el sistema SHALL lanzar excepción
5. WHEN se llama removeRole en último rol THEN el sistema SHALL lanzar excepción

### Requirement 6

**User Story:** Como desarrollador del sistema, quiero que User tenga soporte para verificación de email, para mejorar la seguridad del sistema.

#### Acceptance Criteria

1. THE User aggregate SHALL tener campo emailVerified: boolean
2. THE User aggregate SHALL tener método verifyEmail(): void
3. WHEN se crea un User THEN emailVerified SHALL ser false por defecto
4. WHEN se llama verifyEmail() THEN el sistema SHALL cambiar emailVerified a true
5. WHEN se llama verifyEmail() en email ya verificado THEN el sistema SHALL lanzar EmailAlreadyVerifiedException

### Requirement 7

**User Story:** Como desarrollador del sistema, quiero que User tenga campo isActive para soportar suspensión de cuentas, para gestión de usuarios problemáticos.

#### Acceptance Criteria

1. THE User aggregate SHALL tener campo isActive: boolean
2. WHEN se crea un User THEN isActive SHALL ser true por defecto
3. THE User aggregate SHALL tener método deactivate(): void
4. THE User aggregate SHALL tener método activate(): void
5. WHEN se desactiva un User THEN el sistema SHALL publicar UserDeactivated event

### Requirement 8

**User Story:** Como desarrollador del sistema, quiero eliminar el campo businessId de User, para respetar la separación de concerns entre Auth BC y Business BC.

#### Acceptance Criteria

1. THE User aggregate SHALL NOT tener campo businessId
2. THE User persistence model SHALL NOT tener columna business_id
3. THE RegisterCommand SHALL NOT aceptar parámetro businessId
4. THE LoginResponseDto SHALL NOT incluir campo businessId
5. THE JWT payload SHALL NOT incluir businessId

### Requirement 9

**User Story:** Como desarrollador del sistema, quiero que los comandos de Auth BC soporten el nuevo modelo de roles, para mantener consistencia en la capa de aplicación.

#### Acceptance Criteria

1. THE RegisterCommand SHALL aceptar parámetro initialRole: UserRole
2. THE RegisterCommand SHALL validar que initialRole sea válido
3. WHEN se ejecuta RegisterCommand THEN el sistema SHALL crear User con role=[initialRole]
4. THE AddUserRoleCommand SHALL validar que el User existe
5. THE RemoveUserRoleCommand SHALL validar que el User existe

### Requirement 10

**User Story:** Como desarrollador del sistema, quiero que las migraciones de base de datos reflejen el nuevo esquema, para mantener integridad de datos.

#### Acceptance Criteria

1. THE migration SHALL agregar columna roles (array de strings) a tabla users
2. THE migration SHALL agregar columna email_verified (boolean) a tabla users
3. THE migration SHALL agregar columna is_active (boolean) a tabla users
4. THE migration SHALL remover columna business_id de tabla users
5. THE migration SHALL migrar datos existentes con role=['BUSINESS_OWNER'] por defecto

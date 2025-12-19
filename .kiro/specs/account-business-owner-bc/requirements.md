# Requirements Document - Account BC (BusinessOwner)

## Introduction

Este documento define los requisitos para implementar el Bounded Context de Account (BC1) en el Sistema de Reservas Multi-Tenant vía WhatsApp. El Account BC es responsable de gestionar los perfiles de dueños de negocios (BusinessOwner) y sus suscripciones, límites y estado de onboarding.

### Separación de Concerns: User vs BusinessOwner

> **📖 Referencia Completa:** Ver `.kiro/steering/user-customer-businessowner-architecture.md` y `.kiro/steering/PRD.md` sección 2.2.1

**User (Auth BC) - Identidad y Autenticación**

- **Responsabilidad:** ¿QUIÉN eres? ¿Puedes autenticarte? ¿Qué roles tienes?
- **Contiene:** email, password, roles (BUSINESS_OWNER, CUSTOMER, ADMIN)
- **Tabla:** `users`

**BusinessOwner (Account BC) - Perfil de Cuenta y Suscripción**

- **Responsabilidad:** ¿QUÉ plan tienes? ¿Cuántos negocios puedes crear? ¿Completaste onboarding?
- **Contiene:** subscriptionPlan, subscriptionStatus, onboardingCompleted, límites
- **Tabla:** `business_owners`
- **Relación:** BusinessOwner.userId → User.id (obligatorio, 1:1)

**¿Por qué NO son redundantes?**

- **User** = Autenticación universal (puede tener múltiples roles)
- **BusinessOwner** = Perfil de cuenta con límites según plan de suscripción
- **Ejemplo:** Juan (User) tiene plan PRO (BusinessOwner) que le permite crear 3 Business

```
┌─────────────────────────────────────────────────────────┐
│                    User (Auth BC)                       │
│  - id: user-123                                         │
│  - email: juan@example.com                              │
│  - roles: ['BUSINESS_OWNER', 'CUSTOMER']               │
│  → Responsabilidad: Autenticación y roles               │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│              BusinessOwner (Account BC)                 │
│  - id: owner-456                                        │
│  - userId: user-123 ← Vinculado a User                 │
│  - subscriptionPlan: PRO                                │
│  - maxBusinesses: 3                                     │
│  - maxAppointmentsPerMonth: 2000                        │
│  → Responsabilidad: Límites y suscripción               │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│              Business #1, #2, #3 (Business BC)          │
│  - ownerId: user-123 ← Referencia a User.id            │
│  → Responsabilidad: Información de cada negocio         │
└─────────────────────────────────────────────────────────┘
```

### Flujo de Registro

```
1. Usuario se registra en panel web:
   RegisterUserCommand(email, password, name, role=BUSINESS_OWNER)
   → User creado en Auth BC
   → UserRegistered event publicado

2. Event Handler escucha UserRegistered con role=BUSINESS_OWNER:
   OnUserRegisteredHandler
   → CreateBusinessOwnerCommand(userId, subscriptionPlan=FREE)
   → BusinessOwner creado automáticamente en Account BC
   → BusinessOwnerCreated event publicado

3. Usuario completa onboarding:
   CompleteOnboardingCommand(businessOwnerId)
   → BusinessOwner.onboardingCompleted = true

4. Usuario crea su primer negocio:
   CreateBusinessCommand(ownerId=userId, ...)
   → Validación: BusinessOwner.maxBusinesses
   → Si OK: Business creado en Business BC
```

### Nota sobre shared-types

El `BusinessOwnerDto` necesitará ser agregado a `packages/shared-types/src/index.ts` para exponer datos de suscripción en el panel web.

## Glossary

- **BusinessOwner**: Perfil de cuenta del dueño de negocio con información de suscripción y límites
- **User**: Identidad universal con autenticación (Auth BC) - siempre vinculado 1:1 con BusinessOwner
- **SubscriptionPlan**: Plan de suscripción (FREE, BASIC, PRO, ENTERPRISE) que determina límites
- **SubscriptionStatus**: Estado de la suscripción (ACTIVE, SUSPENDED, CANCELLED)
- **Onboarding**: Proceso de configuración inicial que debe completarse antes de crear negocios
- **maxBusinesses**: Número máximo de negocios que puede crear según su plan
- **maxAppointmentsPerMonth**: Número máximo de citas mensuales según su plan

## Requirements

### Requirement 1

**User Story:** Como sistema, quiero crear automáticamente un BusinessOwner cuando un User se registra con role BUSINESS_OWNER, para que cada dueño de negocio tenga su perfil de cuenta vinculado.

#### Acceptance Criteria

1. WHEN un User se registra con role=BUSINESS_OWNER THEN el Sistema SHALL escuchar el evento UserRegistered
2. WHEN se recibe UserRegistered con role=BUSINESS_OWNER THEN el Sistema SHALL ejecutar CreateBusinessOwnerCommand con userId y subscriptionPlan=FREE
3. WHEN se crea un BusinessOwner THEN el Sistema SHALL generar un UUID único como identificador
4. WHEN se crea un BusinessOwner THEN el Sistema SHALL establecer onboardingCompleted=false por defecto
5. WHEN se crea un BusinessOwner THEN el Sistema SHALL publicar el evento BusinessOwnerCreated con businessOwnerId y userId

### Requirement 2

**User Story:** Como dueño de negocio, quiero que mi plan de suscripción determine cuántos negocios puedo crear, para que el sistema respete los límites de mi plan.

#### Acceptance Criteria

1. WHEN el plan es FREE THEN el Sistema SHALL establecer maxBusinesses=1 y maxAppointmentsPerMonth=100
2. WHEN el plan es BASIC THEN el Sistema SHALL establecer maxBusinesses=1 y maxAppointmentsPerMonth=500
3. WHEN el plan es PRO THEN el Sistema SHALL establecer maxBusinesses=3 y maxAppointmentsPerMonth=2000
4. WHEN el plan es ENTERPRISE THEN el Sistema SHALL establecer maxBusinesses=10 y maxAppointmentsPerMonth=10000
5. WHEN se intenta crear un Business THEN el Sistema SHALL validar que no se exceda maxBusinesses del BusinessOwner

### Requirement 3

**User Story:** Como dueño de negocio, quiero completar un proceso de onboarding, para que el sistema me guíe en la configuración inicial antes de crear mi primer negocio.

#### Acceptance Criteria

1. WHEN se crea un BusinessOwner THEN el Sistema SHALL establecer onboardingCompleted=false
2. WHEN se ejecuta CompleteOnboardingCommand THEN el Sistema SHALL cambiar onboardingCompleted=true
3. WHEN onboardingCompleted=false THEN el Sistema SHALL prevenir la creación de Business
4. WHEN se completa el onboarding THEN el Sistema SHALL publicar BusinessOwnerOnboardingCompleted
5. WHEN onboardingCompleted=true THEN el Sistema SHALL permitir la creación de Business

### Requirement 4

**User Story:** Como dueño de negocio, quiero poder mejorar mi plan de suscripción, para que pueda crear más negocios y tener más citas mensuales.

#### Acceptance Criteria

1. WHEN se ejecuta UpgradeSubscriptionCommand THEN el Sistema SHALL validar que el nuevo plan sea superior al actual
2. WHEN se mejora el plan THEN el Sistema SHALL actualizar subscriptionPlan y los límites correspondientes
3. WHEN se mejora el plan THEN el Sistema SHALL publicar BusinessOwnerSubscriptionUpgraded con oldPlan y newPlan
4. WHEN se intenta "mejorar" a un plan inferior THEN el Sistema SHALL lanzar CannotDowngradeSubscriptionException
5. WHEN se intenta mejorar al mismo plan THEN el Sistema SHALL lanzar AlreadyOnThisPlanException

### Requirement 5

**User Story:** Como administrador del sistema, quiero poder suspender suscripciones, para que los negocios con pagos pendientes no puedan crear nuevas citas.

#### Acceptance Criteria

1. WHEN se ejecuta SuspendSubscriptionCommand THEN el Sistema SHALL cambiar subscriptionStatus=SUSPENDED
2. WHEN subscriptionStatus=SUSPENDED THEN el Sistema SHALL prevenir la creación de nuevas Appointments
3. WHEN se suspende una suscripción THEN el Sistema SHALL publicar BusinessOwnerSubscriptionSuspended
4. WHEN se ejecuta RestoreSubscriptionCommand THEN el Sistema SHALL cambiar subscriptionStatus=ACTIVE
5. WHEN se restaura una suscripción THEN el Sistema SHALL publicar BusinessOwnerSubscriptionRestored

### Requirement 6

**User Story:** Como desarrollador, quiero implementar el BusinessOwner Aggregate con lógica de dominio, para que las reglas de negocio estén encapsuladas.

#### Acceptance Criteria

1. WHEN se crea el Aggregate BusinessOwner THEN el Sistema SHALL extender VersionedAggregateRoot para Optimistic Locking
2. WHEN se crea un BusinessOwner THEN el Sistema SHALL validar que userId no sea nulo
3. WHEN se crea un BusinessOwner THEN el Sistema SHALL validar que subscriptionPlan sea uno de los valores permitidos
4. WHEN se aplica un cambio THEN el Sistema SHALL incrementar la versión del aggregate
5. WHEN se reconstruye desde persistencia THEN el Sistema SHALL usar fromPersistence preservando la versión

### Requirement 7

**User Story:** Como desarrollador, quiero implementar Value Objects para SubscriptionPlan y SubscriptionStatus, para que la validación esté encapsulada.

#### Acceptance Criteria

1. WHEN se crea un SubscriptionPlan THEN el Sistema SHALL proveer factory methods free(), basic(), pro(), enterprise()
2. WHEN se crea un SubscriptionPlan THEN el Sistema SHALL incluir los límites (maxBusinesses, maxAppointmentsPerMonth, price)
3. WHEN se comparan dos SubscriptionPlan THEN el Sistema SHALL usar comparación por valor
4. WHEN se crea un SubscriptionStatus THEN el Sistema SHALL proveer factory methods active(), suspended(), cancelled()
5. WHEN se valida un estado THEN el Sistema SHALL proveer métodos isActive(), isSuspended(), isCancelled()

### Requirement 8

**User Story:** Como desarrollador, quiero separar WriteRepository y ReadRepository siguiendo CQRS estricto, para que las operaciones estén desacopladas.

#### Acceptance Criteria

1. WHEN se define IBusinessOwnerWriteRepository THEN el Sistema SHALL incluir solo método save(businessOwner: BusinessOwner)
2. WHEN se necesita cargar un BusinessOwner THEN el Sistema SHALL usar IBusinessOwnerFactory con loadById(id: UUID)
3. WHEN se define IBusinessOwnerReadRepository THEN el Sistema SHALL incluir findById, findByUserId
4. WHEN se persiste un BusinessOwner THEN el Sistema SHALL usar Optimistic Locking verificando la versión
5. WHEN falla por versión THEN el Sistema SHALL lanzar ConcurrencyException

### Requirement 9

**User Story:** Como desarrollador, quiero implementar Commands y Queries para BusinessOwner, para que sigan el patrón CQRS de NestJS.

#### Acceptance Criteria

1. WHEN se define CreateBusinessOwnerCommand THEN el Sistema SHALL extender Command<{ businessOwnerId: string }>
2. WHEN se define CompleteOnboardingCommand THEN el Sistema SHALL extender Command<void>
3. WHEN se define UpgradeSubscriptionCommand THEN el Sistema SHALL extender Command<void>
4. WHEN se define GetBusinessOwnerQuery THEN el Sistema SHALL extender Query<BusinessOwnerReadModel>
5. WHEN se define GetBusinessOwnerByUserIdQuery THEN el Sistema SHALL extender Query<BusinessOwnerReadModel | null>

### Requirement 10

**User Story:** Como desarrollador, quiero que Account BC se integre con Auth BC, para que BusinessOwner se cree automáticamente al registrar un User.

#### Acceptance Criteria

1. WHEN se publica UserRegistered THEN el Sistema SHALL tener un EventHandler OnUserRegisteredHandler
2. WHEN el evento tiene role=BUSINESS_OWNER THEN el Sistema SHALL ejecutar CreateBusinessOwnerCommand
3. WHEN el evento tiene role!=BUSINESS_OWNER THEN el Sistema SHALL ignorar el evento
4. WHEN falla la creación THEN el Sistema SHALL loggear el error pero no propagar (eventual consistency)
5. WHEN se crea exitosamente THEN el Sistema SHALL loggear el businessOwnerId creado

### Requirement 11

**User Story:** Como desarrollador, quiero que Account BC se integre con Business BC, para que se validen los límites antes de crear negocios.

#### Acceptance Criteria

1. WHEN Business BC intenta crear un Business THEN el Sistema SHALL consultar BusinessOwner via GetBusinessOwnerByUserIdQuery
2. WHEN se obtiene el BusinessOwner THEN el Sistema SHALL verificar que onboardingCompleted=true
3. WHEN onboardingCompleted=false THEN el Sistema SHALL lanzar OnboardingNotCompletedException
4. WHEN se cuenta los Business existentes THEN el Sistema SHALL verificar que count < maxBusinesses
5. WHEN se excede maxBusinesses THEN el Sistema SHALL lanzar MaxBusinessesExceededException

### Requirement 12

**User Story:** Como desarrollador, quiero implementar migraciones y seeds para BusinessOwner, para que la base de datos tenga la estructura correcta.

#### Acceptance Criteria

1. WHEN se ejecuta la migración THEN el Sistema SHALL crear tabla business_owners con columnas id, user_id, subscription_plan, subscription_status, onboarding_completed, version, created_at, updated_at
2. WHEN se crea la tabla THEN el Sistema SHALL agregar índice único en user_id
3. WHEN se crea la tabla THEN el Sistema SHALL agregar foreign key de user_id a users(id)
4. WHEN se ejecuta el seed THEN el Sistema SHALL crear 2 business owners de prueba con planes FREE y PRO
5. WHEN se ejecuta el seed THEN el Sistema SHALL vincular los business owners a users existentes

### Requirement 13

**User Story:** Como desarrollador, quiero implementar tests unitarios, de integración y PBT para Account BC, para que el código tenga alta cobertura.

#### Acceptance Criteria

1. WHEN se testea SubscriptionPlan VO THEN el Sistema SHALL verificar que cada plan tenga los límites correctos
2. WHEN se testea BusinessOwner Aggregate THEN el Sistema SHALL verificar create(), completeOnboarding(), upgradeSubscription()
3. WHEN se testea con PBT THEN el Sistema SHALL verificar que upgradeSubscription solo permita mejoras
4. WHEN se testea CreateBusinessOwnerHandler THEN el Sistema SHALL verificar que crea correctamente vinculado a userId
5. WHEN se testea OnUserRegisteredHandler THEN el Sistema SHALL verificar que solo reacciona a role=BUSINESS_OWNER

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Property 1: BusinessOwner-User relationship is 1:1

_For any_ userId, there should exist at most one BusinessOwner with that userId.

**Validates: Requirements 1.3, 8.3**

### Property 2: Subscription plan determines limits

_For any_ SubscriptionPlan, the maxBusinesses and maxAppointmentsPerMonth should match the predefined limits for that plan tier.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4**

### Property 3: Onboarding must be completed before creating Business

_For any_ BusinessOwner with onboardingCompleted=false, attempting to create a Business should fail.

**Validates: Requirements 3.3, 11.2, 11.3**

### Property 4: Subscription upgrade is monotonic

_For any_ BusinessOwner, upgrading subscription should only allow moving to a higher tier (FREE → BASIC → PRO → ENTERPRISE).

**Validates: Requirements 4.1, 4.4**

### Property 5: Suspended subscription prevents new appointments

_For any_ BusinessOwner with subscriptionStatus=SUSPENDED, attempting to create a new Appointment should fail.

**Validates: Requirements 5.2**

### Property 6: Version increments on state changes

_For any_ BusinessOwner, applying any domain operation should increment the version by exactly 1.

**Validates: Requirements 6.4**

### Property 7: Business count respects maxBusinesses limit

_For any_ BusinessOwner, the number of active Business entities should never exceed maxBusinesses.

**Validates: Requirements 11.4, 11.5**

## Edge Cases

### Edge Case 1: User with multiple roles

WHEN a User has roles ['BUSINESS_OWNER', 'CUSTOMER'] THEN the Sistema SHALL create only one BusinessOwner (not duplicate).

### Edge Case 2: Concurrent BusinessOwner creation

WHEN two UserRegistered events arrive simultaneously for the same userId THEN the Sistema SHALL create only one BusinessOwner.

### Edge Case 3: Upgrade to same plan

WHEN UpgradeSubscriptionCommand is called with the current plan THEN the Sistema SHALL throw AlreadyOnThisPlanException.

### Edge Case 4: Downgrade attempt

WHEN UpgradeSubscriptionCommand is called with a lower tier plan THEN the Sistema SHALL throw CannotDowngradeSubscriptionException.

### Edge Case 5: Suspended subscription restoration

WHEN RestoreSubscriptionCommand is called on an already ACTIVE subscription THEN the Sistema SHALL be idempotent (no error, no event).

# Requirements Document - Business BC

## Introduction

Este documento define los requisitos para implementar el Bounded Context de Business (BC2) en el Sistema de Reservas Multi-Tenant vía WhatsApp. El Business BC es responsable de gestionar la información y configuración de cada negocio específico.

### Separación de Concerns: User vs BusinessOwner vs Business

> **📖 Referencia Completa:** Ver `.kiro/steering/user-customer-businessowner-architecture.md` y `.kiro/steering/PRD.md` sección 2.2.1

**User (Auth BC) - Identidad y Autenticación**

- **Responsabilidad:** ¿QUIÉN eres? ¿Puedes autenticarte?
- **Tabla:** `users`

**BusinessOwner (Account BC) - Perfil de Cuenta y Suscripción**

- **Responsabilidad:** ¿QUÉ plan tienes? ¿Cuántos negocios puedes crear?
- **Tabla:** `business_owners`
- **Relación:** BusinessOwner.userId → User.id (1:1)

**Business (Business BC) - Información del Negocio**

- **Responsabilidad:** ¿CUÁL es tu negocio? ¿Dónde está? ¿Qué servicios ofreces?
- **Tabla:** `businesses`
- **Relación:** Business.ownerId → User.id (N:1)

**Ejemplo Concreto:**

```
User (user-123, juan@example.com)
  ↓
BusinessOwner (owner-456, plan=PRO, maxBusinesses=3)
  ↓
Business #1 (business-789, "Bufete López - Centro", +18095551111)
Business #2 (business-790, "Bufete López - Norte", +18095552222)
Business #3 (business-791, "Consultoría Legal", +18095553333)
```

### Nota sobre shared-types

El `BusinessDto` necesitará ser agregado a `packages/shared-types/src/index.ts` para exponer información del negocio en el panel web.

## Glossary

- **Business**: Negocio específico con información de contacto, ubicación y configuración
- **ownerId**: Referencia al User.id del dueño (NO BusinessOwner.id)
- **WhatsAppNumber**: Número de WhatsApp Business único en todo el sistema
- **Timezone**: Zona horaria IANA (ej: America/Santo_Domingo)
- **BusinessAddress**: Dirección completa del negocio
- **Multi-Business**: Un User puede tener múltiples Business según su subscription plan

## Requirements

### Requirement 1

**User Story:** Como dueño de negocio, quiero crear mi negocio con información básica, para que mis clientes puedan identificarlo y contactarlo.

#### Acceptance Criteria

1. WHEN se ejecuta CreateBusinessCommand THEN el Sistema SHALL crear un Business con ownerId referenciando User.id
2. WHEN se crea un Business THEN el Sistema SHALL validar que name tenga entre 3 y 100 caracteres
3. WHEN se crea un Business THEN el Sistema SHALL validar que whatsappNumber sea único en todo el sistema
4. WHEN se crea un Business THEN el Sistema SHALL establecer isActive=true por defecto
5. WHEN se crea un Business THEN el Sistema SHALL publicar BusinessCreated con businessId, ownerId y whatsappNumber

### Requirement 2

**User Story:** Como sistema, quiero validar que el dueño puede crear más negocios según su plan, para que se respeten los límites de suscripción.

#### Acceptance Criteria

1. WHEN se ejecuta CreateBusinessCommand THEN el Sistema SHALL consultar BusinessOwner via GetBusinessOwnerByUserIdQuery
2. WHEN se obtiene el BusinessOwner THEN el Sistema SHALL verificar que onboardingCompleted=true
3. WHEN onboardingCompleted=false THEN el Sistema SHALL lanzar OnboardingNotCompletedException
4. WHEN se cuenta los Business activos del User THEN el Sistema SHALL verificar que count < maxBusinesses
5. WHEN se excede maxBusinesses THEN el Sistema SHALL lanzar MaxBusinessesExceededException

### Requirement 3

**User Story:** Como dueño de negocio, quiero configurar el número de WhatsApp de mi negocio, para que los clientes puedan enviar mensajes y agendar citas.

#### Acceptance Criteria

1. WHEN se crea un Business THEN el Sistema SHALL usar WhatsAppPhone VO de @shared/vo para validar formato E.164
2. WHEN se valida whatsappPhone THEN el Sistema SHALL verificar que no exista otro Business con ese número
3. WHEN se configura WhatsApp THEN el Sistema SHALL publicar BusinessWhatsAppConfigured
4. WHEN se actualiza whatsappPhone THEN el Sistema SHALL validar unicidad antes de persistir
5. WHEN falla la validación de unicidad THEN el Sistema SHALL lanzar WhatsAppPhoneAlreadyExistsException

### Requirement 4

**User Story:** Como dueño de negocio, quiero configurar la zona horaria de mi negocio, para que las citas se muestren en el horario local correcto.

#### Acceptance Criteria

1. WHEN se crea un Business THEN el Sistema SHALL validar que timezone sea una zona IANA válida
2. WHEN timezone es inválida THEN el Sistema SHALL lanzar InvalidTimezoneException con mensaje descriptivo
3. WHEN se almacena timezone THEN el Sistema SHALL usar el string IANA (ej: America/Santo_Domingo)
4. WHEN se actualiza timezone THEN el Sistema SHALL publicar BusinessTimezoneUpdated
5. WHEN se consulta un Business THEN el Sistema SHALL retornar timezone como string IANA

### Requirement 5

**User Story:** Como dueño de negocio, quiero configurar la dirección de mi negocio, para que los clientes sepan dónde está ubicado.

#### Acceptance Criteria

1. WHEN se crea un Business THEN el Sistema SHALL permitir BusinessAddress con street, city, state, country, postalCode
2. WHEN se valida BusinessAddress THEN el Sistema SHALL verificar que street y city no estén vacíos
3. WHEN postalCode está presente THEN el Sistema SHALL validar formato según el país
4. WHEN se actualiza la dirección THEN el Sistema SHALL publicar BusinessAddressUpdated
5. WHEN se serializa BusinessAddress THEN el Sistema SHALL retornar objeto con todos los campos

### Requirement 6

**User Story:** Como dueño de negocio, quiero poder desactivar temporalmente mi negocio, para que no se puedan crear nuevas citas cuando esté cerrado.

#### Acceptance Criteria

1. WHEN se ejecuta DeactivateBusinessCommand THEN el Sistema SHALL establecer isActive=false
2. WHEN isActive=false THEN el Sistema SHALL prevenir la creación de nuevas Appointments
3. WHEN se desactiva THEN el Sistema SHALL publicar BusinessDeactivated
4. WHEN se ejecuta ActivateBusinessCommand THEN el Sistema SHALL establecer isActive=true
5. WHEN se activa THEN el Sistema SHALL publicar BusinessActivated

### Requirement 7

**User Story:** Como desarrollador, quiero implementar el Business Aggregate con lógica de dominio, para que las reglas de negocio estén encapsuladas.

#### Acceptance Criteria

1. WHEN se crea el Aggregate Business THEN el Sistema SHALL extender VersionedAggregateRoot
2. WHEN se crea un Business THEN el Sistema SHALL validar que ownerId, name y whatsappNumber no sean nulos
3. WHEN se actualiza información THEN el Sistema SHALL incrementar la versión del aggregate
4. WHEN se reconstruye desde persistencia THEN el Sistema SHALL usar fromPersistence preservando la versión
5. WHEN se aplica un cambio THEN el Sistema SHALL publicar el evento de dominio correspondiente

### Requirement 8

**User Story:** Como desarrollador, quiero reutilizar WhatsAppPhone de shared y crear VOs específicos para Timezone y BusinessAddress, para que la validación esté encapsulada.

#### Acceptance Criteria

1. WHEN se crea Business THEN el Sistema SHALL importar WhatsAppPhone desde @shared/vo/whatsapp-phone
2. WHEN se crea Timezone THEN el Sistema SHALL validar contra lista de zonas IANA
3. WHEN se crea BusinessAddress THEN el Sistema SHALL validar que street y city no estén vacíos
4. WHEN se comparan Value Objects THEN el Sistema SHALL usar comparación por valor (equals)
5. WHEN se serializan THEN el Sistema SHALL proveer métodos getValue() o toObject()

### Requirement 9

**User Story:** Como desarrollador, quiero separar WriteRepository y ReadRepository siguiendo CQRS estricto, para que las operaciones estén desacopladas.

#### Acceptance Criteria

1. WHEN se define IBusinessWriteRepository THEN el Sistema SHALL incluir solo método save(business: Business)
2. WHEN se necesita cargar un Business THEN el Sistema SHALL usar IBusinessFactory con loadById(id: UUID)
3. WHEN se define IBusinessReadRepository THEN el Sistema SHALL incluir findById, findByOwnerId, findByWhatsAppPhone
4. WHEN se persiste un Business THEN el Sistema SHALL usar Optimistic Locking verificando la versión
5. WHEN falla por versión THEN el Sistema SHALL lanzar ConcurrencyException

### Requirement 10

**User Story:** Como desarrollador, quiero implementar Commands y Queries para Business, para que sigan el patrón CQRS de NestJS.

#### Acceptance Criteria

1. WHEN se define CreateBusinessCommand THEN el Sistema SHALL extender Command<{ businessId: string }>
2. WHEN se define UpdateBusinessInfoCommand THEN el Sistema SHALL extender Command<void>
3. WHEN se define ConfigureWhatsAppCommand THEN el Sistema SHALL extender Command<void>
4. WHEN se define GetBusinessQuery THEN el Sistema SHALL extender Query<BusinessReadModel>
5. WHEN se define GetBusinessByWhatsAppPhoneQuery THEN el Sistema SHALL extender Query<BusinessReadModel | null>

### Requirement 11

**User Story:** Como desarrollador, quiero que Business BC se integre con Account BC, para que se validen límites de suscripción.

#### Acceptance Criteria

1. WHEN CreateBusinessHandler se ejecuta THEN el Sistema SHALL consultar GetBusinessOwnerByUserIdQuery
2. WHEN se obtiene BusinessOwner THEN el Sistema SHALL verificar onboardingCompleted=true
3. WHEN se obtiene BusinessOwner THEN el Sistema SHALL contar Business existentes del ownerId
4. WHEN count >= maxBusinesses THEN el Sistema SHALL lanzar MaxBusinessesExceededException
5. WHEN todas las validaciones pasan THEN el Sistema SHALL crear el Business

### Requirement 12

**User Story:** Como desarrollador, quiero que Business BC se integre con otros BCs, para que puedan consultar información del negocio.

#### Acceptance Criteria

1. WHEN Offering BC crea un Offering THEN el Sistema SHALL validar que businessId exista
2. WHEN Availability BC crea Schedule THEN el Sistema SHALL validar que businessId exista
3. WHEN Booking BC crea Appointment THEN el Sistema SHALL validar que businessId exista
4. WHEN Conversation BC recibe mensaje THEN el Sistema SHALL identificar Business por whatsappPhone usando GetBusinessByWhatsAppPhoneQuery
5. WHEN se consulta Business THEN el Sistema SHALL retornar timezone para conversión de fechas

### Requirement 13

**User Story:** Como desarrollador, quiero implementar migraciones y seeds para Business, para que la base de datos tenga la estructura correcta.

#### Acceptance Criteria

1. WHEN se ejecuta la migración THEN el Sistema SHALL crear tabla businesses con columnas id, owner_id, name, whatsapp_phone, address_street, address_city, address_state, address_country, address_postal_code, timezone, is_active, version, created_at, updated_at
2. WHEN se crea la tabla THEN el Sistema SHALL agregar índice único en whatsapp_phone (consistente con Customer BC)
3. WHEN se crea la tabla THEN el Sistema SHALL agregar foreign key de owner_id a users(id)
4. WHEN se ejecuta el seed THEN el Sistema SHALL crear 2 businesses de prueba vinculados a users existentes
5. WHEN se ejecuta el seed THEN el Sistema SHALL usar números de WhatsApp únicos y válidos en formato E.164

### Requirement 14

**User Story:** Como desarrollador, quiero implementar tests para Business BC, para que el código tenga alta cobertura.

#### Acceptance Criteria

1. WHEN se testea Timezone VO THEN el Sistema SHALL validar zonas IANA válidas e inválidas
2. WHEN se testea BusinessAddress VO THEN el Sistema SHALL validar campos requeridos (street, city)
3. WHEN se testea Business Aggregate THEN el Sistema SHALL verificar create(), updateInfo(), deactivate()
4. WHEN se testea CreateBusinessHandler THEN el Sistema SHALL verificar validación de límites de BusinessOwner
5. WHEN se testea con PBT THEN el Sistema SHALL verificar que whatsappPhone sea único globalmente (nota: WhatsAppPhone VO ya testeado en Customer BC)

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Property 1: WhatsAppPhone global uniqueness

_For any_ two Business entities, they should never have the same whatsappPhone (using WhatsAppPhone VO from @shared/vo).

**Validates: Requirements 1.3, 3.2**

### Property 2: Business count respects subscription limits

_For any_ User with N businesses, N should always be less than or equal to BusinessOwner.maxBusinesses.

**Validates: Requirements 2.4, 2.5, 11.4, 11.5**

### Property 3: Onboarding must be completed before creating Business

_For any_ User, attempting to create a Business when BusinessOwner.onboardingCompleted=false should fail.

**Validates: Requirements 2.2, 2.3, 11.2**

### Property 4: Business ownerId references User.id

_For any_ Business, the ownerId should always reference an existing User.id (not BusinessOwner.id).

**Validates: Requirements 1.1, 11.1**

### Property 5: Timezone validation

_For any_ string representing a valid IANA timezone, creating a Timezone VO and calling getValue() should return the same string.

**Validates: Requirements 4.1, 4.3**

### Property 6: Inactive business prevents appointments

_For any_ Business with isActive=false, attempting to create an Appointment should fail.

**Validates: Requirements 6.2**

### Property 7: Version increments on state changes

_For any_ Business, applying any domain operation should increment the version by exactly 1.

**Validates: Requirements 7.3**

## Edge Cases

### Edge Case 1: WhatsApp phone with international prefix variations

WHEN WhatsAppPhone is created with different prefix formats (+1, 001, 1) THEN the Sistema SHALL normalize to E.164 format or reject invalid formats (handled by WhatsAppPhone VO from @shared/vo).

### Edge Case 2: Very long business names

WHEN Business name exceeds 100 characters THEN the Sistema SHALL reject with InvalidBusinessNameException.

### Edge Case 3: Invalid timezone strings

WHEN Timezone is created with non-IANA string (ej: "EST", "GMT-5") THEN the Sistema SHALL throw InvalidTimezoneException.

### Edge Case 4: Concurrent business creation at limit

WHEN a User at maxBusinesses limit tries to create two businesses simultaneously THEN the Sistema SHALL allow only one and reject the other.

### Edge Case 5: Address with missing optional fields

WHEN BusinessAddress is created with only street and city THEN the Sistema SHALL accept it (state, country, postalCode are optional).

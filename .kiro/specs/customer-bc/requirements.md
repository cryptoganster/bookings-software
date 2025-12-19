# Requirements Document - Customer BC

## Introduction

Este documento define los requisitos para implementar el Bounded Context de Customer (BC6) en el Sistema de Reservas Multi-Tenant vía WhatsApp. El Customer BC es responsable de gestionar la información de los clientes finales de cada negocio, identificados principalmente por su número de WhatsApp.

### User vs Customer - Arquitectura Unificada

> **📖 Referencia Completa:** Ver `.kiro/steering/user-customer-businessowner-architecture.md`

**User (Auth BC)** - Identidad Universal con Roles Múltiples:

- **Responsabilidad:** Autenticación (email/password) y gestión de roles
- **Roles posibles:** `['BUSINESS_OWNER', 'CUSTOMER', 'ADMIN']`
- **Un User puede tener múltiples roles simultáneamente** (preparado para marketplace)

**Customer (Customer BC)** - Perfil de Cliente por Negocio:

- **Responsabilidad:** Perfil contextual del cliente en un negocio específico
- **Vinculación:** `userId` opcional (null = anónimo, UUID = registrado)
- **Alcance:** Multi-tenant (un Customer por combinación businessId + whatsappPhone)

**Tipos de Customer:**
| Tipo | userId | WhatsApp | Panel Web | Email | Historial |
|------|--------|----------|-----------|-------|-----------|
| **Anónimo** | null | ✅ | ❌ | ❌ | ❌ |
| **Registrado** | UUID | ✅ | ✅ | ✅ | ✅ |

### Flujo de Customer - MVP y Marketplace

```
┌─────────────────────────────────────────────────────────────────┐
│                    FLUJO COMPLETO DEL SISTEMA                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ESCENARIO MVP: Customer Anónimo                                │
│  ================================                               │
│  1. Cliente envía mensaje WhatsApp al negocio                   │
│  2. Sistema ejecuta IdentifyCustomerCommand                     │
│  3. Customer creado con userId=null (anónimo)                   │
│  4. Cliente agenda citas vía WhatsApp                           │
│  5. NO tiene acceso al panel web                                │
│                                                                 │
│  ESCENARIO FUTURO: Customer Registrado (Marketplace)            │
│  ===================================================            │
│  1. Cliente envía primer mensaje WhatsApp                       │
│  2. Customer creado con userId=null (anónimo)                   │
│  3. En primera agenda, bot solicita nombre y email              │
│  4. Sistema crea User con role=['CUSTOMER']                     │
│  5. Customer se vincula a User (userId = User.id)               │
│  6. Cliente puede acceder al panel web con sus citas            │
│                                                                 │
│  ESCENARIO MARKETPLACE: User con Ambos Roles                    │
│  ============================================                   │
│  Juan (abogado) tiene Business → role=['BUSINESS_OWNER']        │
│  Juan agenda cita con dentista → Customer creado                │
│  Customer se vincula a Juan → role=['BUSINESS_OWNER','CUSTOMER']│
│  Juan puede: administrar su negocio + ver sus citas como cliente│
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Relación User ↔ Customer:**

- Customer.userId → User.id (opcional, 1:N - un User puede ser Customer en múltiples negocios)
- Cuando Customer se vincula a User, Auth BC agrega role CUSTOMER al User

### Nota sobre shared-types

El `CustomerDto` ya está implementado en `packages/shared-types/src/index.ts` y coincide con el diseño de este BC. No se requieren cambios en shared-types para el MVP ya que Customer BC no expone endpoints REST (es un BC interno usado por Booking BC y Conversation BC).

## Glossary

- **Customer**: Cliente final del negocio que agenda citas vía WhatsApp
- **WhatsAppPhone**: Número de teléfono de WhatsApp en formato E.164 (+18095551234)
- **BusinessId**: Identificador único del negocio al que pertenece el customer
- **Multi-tenancy**: Aislamiento de datos donde cada customer pertenece a un solo negocio
- **Identificación Automática**: Proceso de crear o recuperar un customer basado en su número de WhatsApp
- **Read Model**: Modelo optimizado para consultas que incluye datos desnormalizados
- **Write Model**: Aggregate del dominio con lógica de negocio
- **Factory Pattern**: Patrón para cargar aggregates desde persistencia manteniendo CQRS estricto

## Requirements

### Requirement 1

**User Story:** Como sistema, quiero identificar automáticamente a los clientes por su número de WhatsApp, para que cada cliente tenga un registro único por negocio sin necesidad de registro manual.

#### Acceptance Criteria

1. WHEN un mensaje de WhatsApp es recibido THEN el Sistema SHALL buscar o crear un Customer usando el número de WhatsApp y businessId
2. WHEN se crea un nuevo Customer THEN el Sistema SHALL generar un UUID único como identificador y almacenar el número de WhatsApp
3. WHEN un Customer ya existe para ese número y negocio THEN el Sistema SHALL retornar el Customer existente sin crear duplicados
4. WHEN se valida un número de WhatsApp THEN el Sistema SHALL verificar que cumple el formato E.164 (+[código país][número])
5. WHEN se crea un Customer THEN el Sistema SHALL publicar el evento CustomerCreated con customerId, businessId y whatsappPhone

### Requirement 2

**User Story:** Como sistema, quiero almacenar el nombre del cliente cuando esté disponible, para que las citas muestren información personalizada en el panel de administración.

#### Acceptance Criteria

1. WHEN se crea un Customer inicialmente THEN el Sistema SHALL permitir que el campo name sea null
2. WHEN se obtiene el nombre del perfil de WhatsApp THEN el Sistema SHALL actualizar el campo name del Customer
3. WHEN se actualiza el nombre de un Customer THEN el Sistema SHALL publicar el evento CustomerNameUpdated con customerId y newName
4. WHEN el nombre es actualizado THEN el Sistema SHALL preservar el nombre anterior en el historial de eventos
5. WHEN se consulta un Customer THEN el Sistema SHALL retornar el nombre más reciente o null si no está disponible

### Requirement 2.1

**User Story:** Como sistema, quiero soportar Customers anónimos y registrados, para preparar el sistema para el escenario marketplace donde clientes pueden registrarse y acceder al panel web.

#### Acceptance Criteria

1. WHEN se crea un Customer THEN el Sistema SHALL permitir que el campo userId sea null (customer anónimo)
2. WHEN un Customer tiene userId null THEN el Sistema SHALL identificarlo como customer anónimo sin acceso al panel web
3. WHEN un Customer tiene userId no-null THEN el Sistema SHALL identificarlo como customer registrado con acceso al panel web
4. WHEN se consulta un Customer THEN el Sistema SHALL incluir el campo userId en el read model
5. WHEN se persiste un Customer THEN el Sistema SHALL almacenar el userId en la tabla customers

### Requirement 3

**User Story:** Como desarrollador, quiero implementar el Customer Aggregate con lógica de dominio, para que las reglas de negocio estén encapsuladas y el aggregate sea la única fuente de verdad.

#### Acceptance Criteria

1. WHEN se crea el Aggregate Customer THEN el Sistema SHALL extender VersionedAggregateRoot para soporte de Optimistic Locking
2. WHEN se crea un Customer THEN el Sistema SHALL validar que businessId y whatsappPhone no sean nulos o vacíos
3. WHEN se actualiza el nombre THEN el Sistema SHALL validar que el nombre tenga entre 1 y 100 caracteres
4. WHEN se aplica un cambio al Customer THEN el Sistema SHALL incrementar la versión del aggregate
5. WHEN se reconstruye un Customer desde persistencia THEN el Sistema SHALL usar el método fromPersistence preservando la versión

### Requirement 4

**User Story:** Como desarrollador, quiero implementar Value Objects para WhatsAppPhone, para que la validación del formato esté encapsulada y sea reutilizable.

#### Acceptance Criteria

1. WHEN se crea un WhatsAppPhone THEN el Sistema SHALL validar que el formato sea E.164 usando regex `^\+[1-9]\d{1,14}$`
2. WHEN el formato es inválido THEN el Sistema SHALL lanzar InvalidWhatsAppPhoneException con mensaje descriptivo
3. WHEN se comparan dos WhatsAppPhone THEN el Sistema SHALL usar comparación por valor (equals)
4. WHEN se serializa un WhatsAppPhone THEN el Sistema SHALL retornar el string del número vía getValue()
5. WHEN se crea desde string THEN el Sistema SHALL proveer método estático fromString(value: string)

### Requirement 5

**User Story:** Como desarrollador, quiero separar WriteRepository y ReadRepository siguiendo CQRS estricto, para que las operaciones de escritura y lectura estén completamente desacopladas.

#### Acceptance Criteria

1. WHEN se define ICustomerWriteRepository THEN el Sistema SHALL incluir solo método save(customer: Customer)
2. WHEN se necesita cargar un Customer para modificación THEN el Sistema SHALL usar ICustomerFactory con método loadById(id: UUID)
3. WHEN se define ICustomerReadRepository THEN el Sistema SHALL incluir métodos findById, findByWhatsAppPhone y findByBusinessId
4. WHEN se persiste un Customer THEN el Sistema SHALL usar Optimistic Locking verificando la versión
5. WHEN falla la actualización por versión THEN el Sistema SHALL lanzar ConcurrencyException
6. WHEN se consulta un Customer THEN el Sistema SHALL retornar CustomerReadModel con datos desnormalizados

### Requirement 6

**User Story:** Como desarrollador, quiero implementar Commands y Queries para Customer, para que las operaciones sigan el patrón CQRS de NestJS.

#### Acceptance Criteria

1. WHEN se define IdentifyCustomerCommand THEN el Sistema SHALL extender Command<{ customerId: string }> de @nestjs/cqrs
2. WHEN se ejecuta IdentifyCustomerCommand THEN el Sistema SHALL buscar Customer existente o crear uno nuevo
3. WHEN se define UpdateCustomerNameCommand THEN el Sistema SHALL extender Command<void>
4. WHEN se define GetCustomerQuery THEN el Sistema SHALL extender Query<CustomerReadModel>
5. WHEN se define GetCustomerByPhoneQuery THEN el Sistema SHALL extender Query<CustomerReadModel | null>

### Requirement 7

**User Story:** Como desarrollador, quiero que el Customer BC se integre con Booking BC, para que las citas puedan mostrar información del cliente en el panel de administración.

#### Acceptance Criteria

1. WHEN se consultan appointments THEN el Sistema SHALL hacer JOIN con la tabla customers para obtener customerName y customerPhone
2. WHEN se crea una appointment THEN el Sistema SHALL verificar que el customerId exista en la tabla customers
3. WHEN se serializa AppointmentReadModel THEN el Sistema SHALL incluir campos customerName (string | null) y customerPhone (string)
4. WHEN customerName es null THEN el Sistema SHALL permitir que el frontend muestre solo el teléfono
5. WHEN se actualiza el nombre de un Customer THEN el Sistema SHALL reflejar el cambio en futuras consultas de appointments

### Requirement 8

**User Story:** Como desarrollador, quiero que el Customer BC se integre con Conversation BC, para que las conversaciones puedan identificar al cliente automáticamente.

#### Acceptance Criteria

1. WHEN se recibe un mensaje de WhatsApp THEN el Sistema SHALL ejecutar IdentifyCustomerCommand antes de procesar la conversación
2. WHEN se crea una Conversation THEN el Sistema SHALL usar el customerId retornado por IdentifyCustomerCommand
3. WHEN se obtiene el nombre del perfil de WhatsApp THEN el Sistema SHALL ejecutar UpdateCustomerNameCommand
4. WHEN Conversation necesita datos del Customer THEN el Sistema SHALL consultar via GetCustomerQuery
5. WHEN se lista conversaciones THEN el Sistema SHALL incluir customerName en el read model

### Requirement 9

**User Story:** Como desarrollador, quiero implementar migraciones y seeds para Customer, para que la base de datos tenga la estructura correcta y datos de prueba.

#### Acceptance Criteria

1. WHEN se ejecuta la migración THEN el Sistema SHALL crear tabla customers con columnas id, business_id, whatsapp_phone, name, version, created_at, updated_at
2. WHEN se crea la tabla THEN el Sistema SHALL agregar índice único en (business_id, whatsapp_phone)
3. WHEN se crea la tabla THEN el Sistema SHALL agregar foreign key de business_id a businesses(id)
4. WHEN se ejecuta el seed THEN el Sistema SHALL crear 3 customers de prueba con nombres y teléfonos válidos
5. WHEN se ejecuta el seed THEN el Sistema SHALL actualizar los appointments existentes para referenciar los customer IDs correctos

### Requirement 9.1

**User Story:** Como sistema, quiero vincular Customers anónimos a Users registrados, para que clientes que se registren puedan acceder al panel web y ver su historial de citas.

#### Acceptance Criteria

1. WHEN se ejecuta LinkCustomerToUserCommand THEN el Sistema SHALL actualizar el campo userId del Customer
2. WHEN un Customer ya está vinculado a un User THEN el Sistema SHALL lanzar CustomerAlreadyLinkedToUserException
3. WHEN se vincula un Customer a un User THEN el Sistema SHALL publicar el evento CustomerLinkedToUser con customerId y userId
4. WHEN se vincula un Customer THEN el Sistema SHALL incrementar la versión del aggregate
5. WHEN se consulta un Customer vinculado THEN el Sistema SHALL retornar el userId en el read model

### Requirement 9.2

**User Story:** Como sistema, quiero desvincular Customers de Users, para soportar casos donde un cliente quiere desregistrarse pero mantener su historial de citas.

#### Acceptance Criteria

1. WHEN se ejecuta UnlinkCustomerFromUserCommand THEN el Sistema SHALL establecer el campo userId a null
2. WHEN un Customer no está vinculado THEN el Sistema SHALL lanzar CustomerNotLinkedToUserException
3. WHEN se desvincula un Customer THEN el Sistema SHALL publicar el evento CustomerUnlinkedFromUser con customerId y previousUserId
4. WHEN se desvincula un Customer THEN el Sistema SHALL incrementar la versión del aggregate
5. WHEN se consulta un Customer desvinculado THEN el Sistema SHALL retornar userId como null

### Requirement 10

**User Story:** Como sistema, quiero registrar automáticamente a Customers como Users durante su primera agenda vía WhatsApp, para que puedan acceder al panel web y ver su historial de citas.

#### Acceptance Criteria

1. WHEN un Customer anónimo intenta agendar su primera cita THEN el Sistema SHALL solicitar nombre y email vía WhatsApp
2. WHEN el Customer proporciona nombre y email válidos THEN el Sistema SHALL crear un User con role=['CUSTOMER']
3. WHEN se crea el User THEN el Sistema SHALL vincular el Customer al User (userId = User.id)
4. WHEN se vincula el Customer THEN el Sistema SHALL publicar el evento CustomerLinkedToUser
5. WHEN el Customer está vinculado a un User THEN el Sistema SHALL permitir acceso al panel web con historial de citas
6. WHEN el email proporcionado ya existe en el sistema THEN el Sistema SHALL vincular el Customer al User existente (si no tiene conflicto de roles)
7. WHEN el Customer ya está vinculado a un User THEN el Sistema SHALL omitir el flujo de registro y proceder con la agenda

### Requirement 11

**User Story:** Como desarrollador, quiero implementar tests unitarios, de integración y PBT para Customer BC, para que el código tenga alta cobertura y confiabilidad.

#### Acceptance Criteria

1. WHEN se testea WhatsAppPhone VO THEN el Sistema SHALL validar formato correcto e incorrecto con ejemplos específicos
2. WHEN se testea WhatsAppPhone con PBT THEN el Sistema SHALL generar números aleatorios y verificar que el formato se preserve en round-trip
3. WHEN se testea Customer Aggregate THEN el Sistema SHALL verificar que createAnonymous(), linkToUser(), unlinkFromUser() y updateName() funcionen correctamente
4. WHEN se testea IdentifyCustomerHandler THEN el Sistema SHALL verificar que crea nuevo customer o retorna existente
5. WHEN se testea CustomerWriteRepository THEN el Sistema SHALL simular ConcurrencyException y verificar manejo correcto
6. WHEN se testea el flujo de auto-registro THEN el Sistema SHALL verificar que se crea User y se vincula Customer correctamente

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Property 1: WhatsAppPhone format validation

_For any_ string that represents a valid E.164 phone number, creating a WhatsAppPhone and then calling getValue() should return the same string.

**Validates: Requirements 4.1, 4.4**

### Property 2: Customer uniqueness per business

_For any_ businessId and whatsappPhone combination, calling IdentifyCustomerCommand multiple times should always return the same customerId.

**Validates: Requirements 1.3**

### Property 3: Customer name update preserves identity

_For any_ Customer, updating the name should not change the customerId, businessId, or whatsappPhone.

**Validates: Requirements 2.3, 2.4**

### Property 4: Optimistic locking prevents concurrent modifications

_For any_ Customer with version N, attempting to save two modifications concurrently should result in one success and one ConcurrencyException.

**Validates: Requirements 5.4, 5.5**

### Property 5: Read model consistency

_For any_ Customer in the write model, the read model should contain the same customerId, businessId, whatsappPhone, and name values.

**Validates: Requirements 5.6, 7.3**

### Property 6: WhatsAppPhone validation rejects invalid formats

_For any_ string that does not match E.164 format, attempting to create a WhatsAppPhone should throw InvalidWhatsAppPhoneException.

**Validates: Requirements 4.2**

### Property 7: Customer aggregate version increments

_For any_ Customer, applying any domain operation (createAnonymous, updateName, linkToUser, unlinkFromUser) should increment the version by exactly 1.

**Validates: Requirements 3.4**

### Property 8: Customer linking preserves identity

_For any_ Customer, linking to a User should not change the customerId, businessId, whatsappPhone, or name.

**Validates: Requirements 9.1.4**

### Property 9: Customer unlinking preserves identity

_For any_ Customer, unlinking from a User should not change the customerId, businessId, whatsappPhone, or name.

**Validates: Requirements 9.2.4**

### Property 10: Anonymous customer has null userId

_For any_ Customer created with createAnonymous(), the userId should be null and isAnonymous() should return true.

**Validates: Requirements 2.1.2**

### Property 11: Registered customer has non-null userId

_For any_ Customer that has been linked to a User, the userId should be non-null and isRegistered() should return true.

**Validates: Requirements 2.1.3**

### Property 12: Auto-registration creates User and links Customer

_For any_ anonymous Customer that completes the auto-registration flow with valid name and email, a User should be created with role=['CUSTOMER'] and the Customer should be linked to that User.

**Validates: Requirements 10.2, 10.3**

### Property 13: Auto-registration is idempotent for linked Customers

_For any_ Customer that is already linked to a User, attempting the auto-registration flow should not create a new User or change the existing link.

**Validates: Requirements 10.7**

## Edge Cases

### Edge Case 1: Empty or whitespace name

WHEN UpdateCustomerNameCommand is called with empty string or only whitespace THEN the Sistema SHALL reject the update and throw InvalidCustomerNameException.

### Edge Case 2: Very long names

WHEN UpdateCustomerNameCommand is called with name longer than 100 characters THEN the Sistema SHALL truncate or reject the name.

### Edge Case 3: Special characters in name

WHEN a Customer name contains emojis or special Unicode characters THEN the Sistema SHALL store and retrieve them correctly.

### Edge Case 4: Phone number with spaces or dashes

WHEN a WhatsAppPhone is created with spaces or dashes THEN the Sistema SHALL reject it as invalid format.

### Edge Case 5: Concurrent customer creation

WHEN two processes try to create a Customer with the same businessId and whatsappPhone simultaneously THEN the Sistema SHALL create only one Customer and return the same customerId to both.

### Edge Case 6: Auto-registration with existing email

WHEN a Customer provides an email that already exists in the system THEN the Sistema SHALL link the Customer to the existing User if the User doesn't have conflicting roles.

### Edge Case 7: Auto-registration with invalid email format

WHEN a Customer provides an invalid email format during auto-registration THEN the Sistema SHALL reject the registration and ask for a valid email.

### Edge Case 8: Auto-registration timeout

WHEN a Customer doesn't respond to the name/email request within a reasonable time THEN the Sistema SHALL allow the booking to proceed without registration (Customer remains anonymous).

### Edge Case 9: User with BUSINESS_OWNER role becomes Customer

WHEN a User with role=['BUSINESS_OWNER'] is linked to a Customer THEN the Sistema SHALL add 'CUSTOMER' to their roles, resulting in role=['BUSINESS_OWNER', 'CUSTOMER'] (marketplace scenario).

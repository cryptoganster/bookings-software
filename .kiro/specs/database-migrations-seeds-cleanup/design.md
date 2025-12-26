# Design Document - Database Migrations & Seeds Cleanup

## Overview

Este documento define la arquitectura técnica para reorganizar migraciones y seeds de la base de datos, eliminando redundancias y asegurando consistencia con la arquitectura de Bounded Contexts.

## Architecture

### Current State Analysis

**Migraciones Ejecutadas (17 total):**

```
1. EnableUuidExtension (1702550000000)
2. CreateAppointmentsTable (1702551000000)
3. CreateCapacitiesTable (1702551100000)
4. CreateUsersTable (1702552000000)
5. CreateOfferingsTable (1702553000000)
6. RefactorUserRoles (1734480000000)
7. StandardizeUsersTableNaming (1734481000000)
8. CreateCustomersTable (1734482000000)
9. AddSearchIndexesToCustomers (251219020859) ⚠️ TIMESTAMP INCORRECTO
10. AddMergedIntoToCustomers (1766128110000)
13. CreateBusinessesTableOld (1734480001000) ❌ DUPLICADA
16. CreateBusinessesTable (1766334699000) ✅ MANTENER
18. CreateSchedulesTable (1734650000000)
19. CreateBlockoutsTable (1734650100000)
20. CreateConversationsTable (1734999000000)
21. CreateMessagesTable (1735000000000)
22. CreateBusinessOwnersTable (1766345898000)
```

**Seeds Existentes:**

- ✅ auth.seed.ts
- ✅ account.seed.ts
- ✅ business.seed.ts
- ✅ customer.seed.ts
- ✅ offering.seed.ts
- ⚠️ availability.seed.ts (solo capacities)
- ✅ booking.seed.ts
- ❌ conversation.seed.ts (FALTA)

### Target State

**Migraciones Reorganizadas (orden cronológico por BC):**

```
Phase 1: Foundation
1. EnableUuidExtension (1702550000000)

Phase 2: Auth BC
2. CreateUsersTable (1702552000000)
3. RefactorUserRoles (1734480000000)
4. StandardizeUsersTableNaming (1734481000000)

Phase 3: Account BC
5. CreateBusinessOwnersTable (1766345898000)

Phase 4: Business BC
6. CreateBusinessesTable (1766334699000)

Phase 5: Customer BC
7. CreateCustomersTable (1734482000000)
8. AddMergedIntoToCustomers (1766128110000)
9. AddSearchIndexesToCustomers (20251219020859) ← CORREGIR TIMESTAMP

Phase 6: Offering BC
10. CreateOfferingsTable (1702553000000)

Phase 7: Availability BC
11. CreateSchedulesTable (1734650000000)
12. CreateBlockoutsTable (1734650100000)
13. CreateCapacitiesTable (1702551100000)

Phase 8: Booking BC
14. CreateAppointmentsTable (1702551000000)

Phase 9: Conversation BC
15. CreateConversationsTable (1734999000000)
16. CreateMessagesTable (1735000000000)
```

## Components and Interfaces

### Migration Cleanup Strategy

**Acciones Requeridas:**

1. **Eliminar Migración Duplicada:**
   - Archivo: `1734480001000-CreateBusinessesTableOld.ts`
   - Acción: Eliminar archivo físico
   - Razón: Duplicada con `CreateBusinessesTable`
   - Impacto: Ninguno (tabla ya existe con migración correcta)

2. **Corregir Timestamp:**
   - Archivo: `20251219020859-add-search-indexes-to-customers.ts`
   - Timestamp actual: `251219020859`
   - Timestamp correcto: `20251219020859`
   - Acción: Renombrar archivo y actualizar clase

3. **Reorganizar Archivos:**
   - Mantener timestamps originales (no cambiar)
   - Solo renombrar para claridad si es necesario
   - Documentar orden lógico en README

### Seed Organization Strategy

**Estructura de Seeds por BC:**

```typescript
// apps/backend/src/database/seeds/

1. auth.seed.ts          // Users con diferentes roles
2. account.seed.ts       // BusinessOwners con diferentes planes
3. business.seed.ts      // Businesses vinculados a users
4. customer.seed.ts      // Customers anónimos y registrados
5. offering.seed.ts      // Offerings activos e inactivos
6. availability.seed.ts  // Schedules + Blockouts + Capacities
7. booking.seed.ts       // Appointments con diferentes estados
8. conversation.seed.ts  // Conversations + Messages (NUEVO)
9. seed.ts              // Orquestador principal
```

**Orden de Ejecución (respetando foreign keys):**

```
1. auth.seed.ts          (users)
2. account.seed.ts       (business_owners → users)
3. business.seed.ts      (businesses → users)
4. customer.seed.ts      (customers → users, businesses)
5. offering.seed.ts      (offerings → businesses)
6. availability.seed.ts  (schedules/blockouts → businesses, capacities → offerings)
7. booking.seed.ts       (appointments → customers, offerings, businesses)
8. conversation.seed.ts  (conversations → customers, businesses; messages → conversations)
```

## Data Models

### Seed Data Structure

#### 1. Auth Seed (auth.seed.ts)

**Users a crear:**

```typescript
const users = [
  {
    id: "user-1-uuid",
    email: "owner1@example.com",
    password: "hashed-password",
    name: "Juan Pérez",
    roles: ["BUSINESS_OWNER"],
    email_verified: true,
    is_active: true,
  },
  {
    id: "user-2-uuid",
    email: "owner2@example.com",
    password: "hashed-password",
    name: "María García",
    roles: ["BUSINESS_OWNER"],
    email_verified: true,
    is_active: true,
  },
  {
    id: "user-3-uuid",
    email: "customer1@example.com",
    password: "hashed-password",
    name: "Carlos López",
    roles: ["CUSTOMER"],
    email_verified: true,
    is_active: true,
  },
  {
    id: "user-4-uuid",
    email: "both@example.com",
    password: "hashed-password",
    name: "Ana Martínez",
    roles: ["BUSINESS_OWNER", "CUSTOMER"],
    email_verified: true,
    is_active: true,
  },
  {
    id: "user-5-uuid",
    email: "admin@example.com",
    password: "hashed-password",
    name: "Admin User",
    roles: ["ADMIN"],
    email_verified: true,
    is_active: true,
  },
];
```

#### 2. Account Seed (account.seed.ts)

**BusinessOwners a crear:**

```typescript
const businessOwners = [
  {
    id: "bo-1-uuid",
    user_id: "user-1-uuid",
    subscription_plan: "FREE",
    subscription_status: "ACTIVE",
    onboarding_completed: true,
  },
  {
    id: "bo-2-uuid",
    user_id: "user-2-uuid",
    subscription_plan: "PRO",
    subscription_status: "ACTIVE",
    onboarding_completed: true,
  },
  {
    id: "bo-4-uuid",
    user_id: "user-4-uuid",
    subscription_plan: "BASIC",
    subscription_status: "ACTIVE",
    onboarding_completed: false, // En proceso de onboarding
  },
];
```

#### 3. Business Seed (business.seed.ts)

**Businesses a crear:**

```typescript
const businesses = [
  {
    id: "business-1-uuid",
    owner_id: "user-1-uuid",
    name: "Peluquería El Corte",
    whatsapp_phone: "+18095551001",
    address_street: "Calle Principal 123",
    address_city: "Santo Domingo",
    address_state: "Distrito Nacional",
    address_country: "República Dominicana",
    address_postal_code: "10101",
    timezone: "America/Santo_Domingo",
    is_active: true,
  },
  {
    id: "business-2-uuid",
    owner_id: "user-2-uuid",
    name: "Spa Relax",
    whatsapp_phone: "+18095551002",
    address_street: "Av. Winston Churchill 456",
    address_city: "Santo Domingo",
    timezone: "America/Santo_Domingo",
    is_active: true,
  },
  {
    id: "business-3-uuid",
    owner_id: "user-4-uuid",
    name: "Consultorio Dental",
    whatsapp_phone: "+18095551003",
    address_street: "Calle Salud 789",
    address_city: "Santiago",
    timezone: "America/Santo_Domingo",
    is_active: false, // Negocio inactivo
  },
];
```

#### 4. Customer Seed (customer.seed.ts)

**Customers a crear:**

```typescript
const customers = [
  // Customer anónimo (solo WhatsApp)
  {
    id: "customer-1-uuid",
    user_id: null, // Anónimo
    business_id: "business-1-uuid",
    whatsapp_phone: "+18095552001",
    name: "Pedro Rodríguez",
  },
  // Customer anónimo sin nombre
  {
    id: "customer-2-uuid",
    user_id: null,
    business_id: "business-1-uuid",
    whatsapp_phone: "+18095552002",
    name: null,
  },
  // Customer registrado (vinculado a User)
  {
    id: "customer-3-uuid",
    user_id: "user-3-uuid",
    business_id: "business-1-uuid",
    whatsapp_phone: "+18095552003",
    name: "Carlos López",
  },
  // User con ambos roles como customer
  {
    id: "customer-4-uuid",
    user_id: "user-4-uuid",
    business_id: "business-2-uuid",
    whatsapp_phone: "+18095552004",
    name: "Ana Martínez",
  },
  // Customer con merged_into
  {
    id: "customer-5-uuid",
    user_id: null,
    business_id: "business-1-uuid",
    whatsapp_phone: "+18095552005",
    name: "Duplicado",
    merged_into: "customer-1-uuid",
  },
];
```

#### 5. Offering Seed (offering.seed.ts)

**Offerings a crear:**

```typescript
const offerings = [
  {
    id: "offering-1-uuid",
    business_id: "business-1-uuid",
    name: "Corte de Pelo",
    duration: 30, // minutos
    max_capacity_per_slot: 2,
    max_daily_capacity: 20,
    is_active: true,
  },
  {
    id: "offering-2-uuid",
    business_id: "business-1-uuid",
    name: "Tinte",
    duration: 90,
    max_capacity_per_slot: 1,
    max_daily_capacity: 5,
    is_active: true,
  },
  {
    id: "offering-3-uuid",
    business_id: "business-2-uuid",
    name: "Masaje Relajante",
    duration: 60,
    max_capacity_per_slot: 3,
    max_daily_capacity: null,
    is_active: true,
  },
  {
    id: "offering-4-uuid",
    business_id: "business-1-uuid",
    name: "Servicio Descontinuado",
    duration: 45,
    max_capacity_per_slot: 1,
    max_daily_capacity: 10,
    is_active: false, // Inactivo
  },
];
```

#### 6. Availability Seed (availability.seed.ts)

**ACTUALIZAR PARA INCLUIR SCHEDULES, BLOCKOUTS Y CAPACITIES**

**Schedules a crear:**

```typescript
const schedules = [
  // Peluquería - Lunes a Viernes
  {
    id: "schedule-1-uuid",
    business_id: "business-1-uuid",
    day_of_week: 1,
    start_time: "09:00",
    end_time: "18:00",
    is_active: true,
  },
  {
    id: "schedule-2-uuid",
    business_id: "business-1-uuid",
    day_of_week: 2,
    start_time: "09:00",
    end_time: "18:00",
    is_active: true,
  },
  {
    id: "schedule-3-uuid",
    business_id: "business-1-uuid",
    day_of_week: 3,
    start_time: "09:00",
    end_time: "18:00",
    is_active: true,
  },
  {
    id: "schedule-4-uuid",
    business_id: "business-1-uuid",
    day_of_week: 4,
    start_time: "09:00",
    end_time: "18:00",
    is_active: true,
  },
  {
    id: "schedule-5-uuid",
    business_id: "business-1-uuid",
    day_of_week: 5,
    start_time: "09:00",
    end_time: "18:00",
    is_active: true,
  },
  // Peluquería - Sábado (horario reducido)
  {
    id: "schedule-6-uuid",
    business_id: "business-1-uuid",
    day_of_week: 6,
    start_time: "09:00",
    end_time: "14:00",
    is_active: true,
  },

  // Spa - Todos los días
  {
    id: "schedule-7-uuid",
    business_id: "business-2-uuid",
    day_of_week: 0,
    start_time: "10:00",
    end_time: "20:00",
    is_active: true,
  },
  {
    id: "schedule-8-uuid",
    business_id: "business-2-uuid",
    day_of_week: 1,
    start_time: "10:00",
    end_time: "20:00",
    is_active: true,
  },
  {
    id: "schedule-9-uuid",
    business_id: "business-2-uuid",
    day_of_week: 2,
    start_time: "10:00",
    end_time: "20:00",
    is_active: true,
  },
  {
    id: "schedule-10-uuid",
    business_id: "business-2-uuid",
    day_of_week: 3,
    start_time: "10:00",
    end_time: "20:00",
    is_active: true,
  },
  {
    id: "schedule-11-uuid",
    business_id: "business-2-uuid",
    day_of_week: 4,
    start_time: "10:00",
    end_time: "20:00",
    is_active: true,
  },
  {
    id: "schedule-12-uuid",
    business_id: "business-2-uuid",
    day_of_week: 5,
    start_time: "10:00",
    end_time: "20:00",
    is_active: true,
  },
  {
    id: "schedule-13-uuid",
    business_id: "business-2-uuid",
    day_of_week: 6,
    start_time: "10:00",
    end_time: "20:00",
    is_active: true,
  },
];

const blockouts = [
  // Vacaciones de Navidad
  {
    id: "blockout-1-uuid",
    business_id: "business-1-uuid",
    start_date: "2024-12-24 00:00:00",
    end_date: "2024-12-26 23:59:59",
    reason: "Vacaciones de Navidad",
  },
  // Año Nuevo
  {
    id: "blockout-2-uuid",
    business_id: "business-1-uuid",
    start_date: "2024-12-31 00:00:00",
    end_date: "2025-01-01 23:59:59",
    reason: "Año Nuevo",
  },
  // Mantenimiento del Spa
  {
    id: "blockout-3-uuid",
    business_id: "business-2-uuid",
    start_date: "2025-01-15 00:00:00",
    end_date: "2025-01-15 23:59:59",
    reason: "Mantenimiento de instalaciones",
  },
];

const capacities = [
  // Capacidades para próximos 7 días
  // Business 1 - Offering 1 (Corte de Pelo)
  {
    id: "capacity-1-uuid",
    offering_id: "offering-1-uuid",
    date: "2025-01-20",
    total_slots: 16,
    available_slots: 10,
  },
  {
    id: "capacity-2-uuid",
    offering_id: "offering-1-uuid",
    date: "2025-01-21",
    total_slots: 16,
    available_slots: 16,
  },
  {
    id: "capacity-3-uuid",
    offering_id: "offering-1-uuid",
    date: "2025-01-22",
    total_slots: 16,
    available_slots: 5,
  },

  // Business 1 - Offering 2 (Tinte)
  {
    id: "capacity-4-uuid",
    offering_id: "offering-2-uuid",
    date: "2025-01-20",
    total_slots: 5,
    available_slots: 3,
  },
  {
    id: "capacity-5-uuid",
    offering_id: "offering-2-uuid",
    date: "2025-01-21",
    total_slots: 5,
    available_slots: 5,
  },

  // Business 2 - Offering 3 (Masaje)
  {
    id: "capacity-6-uuid",
    offering_id: "offering-3-uuid",
    date: "2025-01-20",
    total_slots: 10,
    available_slots: 7,
  },
  {
    id: "capacity-7-uuid",
    offering_id: "offering-3-uuid",
    date: "2025-01-21",
    total_slots: 10,
    available_slots: 0,
  }, // Completamente reservado
];
```

#### 7. Booking Seed (booking.seed.ts)

**Appointments a crear:**

```typescript
const appointments = [
  // Cita confirmada en el futuro
  {
    id: "appointment-1-uuid",
    business_id: "business-1-uuid",
    customer_id: "customer-1-uuid",
    offering_id: "offering-1-uuid",
    date_time: "2025-01-20 10:00:00",
    status: "CONFIRMED",
    cancelled_at: null,
  },
  // Cita confirmada en el futuro (customer registrado)
  {
    id: "appointment-2-uuid",
    business_id: "business-1-uuid",
    customer_id: "customer-3-uuid",
    offering_id: "offering-1-uuid",
    date_time: "2025-01-20 11:00:00",
    status: "CONFIRMED",
    cancelled_at: null,
  },
  // Cita cancelada
  {
    id: "appointment-3-uuid",
    business_id: "business-1-uuid",
    customer_id: "customer-1-uuid",
    offering_id: "offering-2-uuid",
    date_time: "2025-01-21 14:00:00",
    status: "CANCELLED",
    cancelled_at: "2025-01-19 10:00:00",
  },
  // Cita completada (en el pasado)
  {
    id: "appointment-4-uuid",
    business_id: "business-2-uuid",
    customer_id: "customer-4-uuid",
    offering_id: "offering-3-uuid",
    date_time: "2024-12-15 15:00:00",
    status: "COMPLETED",
    cancelled_at: null,
  },
  // Cita confirmada para hoy
  {
    id: "appointment-5-uuid",
    business_id: "business-1-uuid",
    customer_id: "customer-2-uuid",
    offering_id: "offering-1-uuid",
    date_time: new Date().toISOString(), // Hoy
    status: "CONFIRMED",
    cancelled_at: null,
  },
];
```

#### 8. Conversation Seed (conversation.seed.ts) - NUEVO

**Conversations a crear:**

```typescript
const conversations = [
  // Conversación activa
  {
    id: "conversation-1-uuid",
    business_id: "business-1-uuid",
    customer_id: "customer-1-uuid",
    customer_phone: "+18095552001",
    status: "ACTIVE",
    state: "AWAITING_SERVICE_SELECTION",
    selected_offering_id: null,
    selected_date: null,
    selected_time: null,
    created_appointment_id: null,
    last_message_at: "2025-01-19 10:00:00",
  },
  // Conversación esperando admin
  {
    id: "conversation-2-uuid",
    business_id: "business-1-uuid",
    customer_id: "customer-2-uuid",
    customer_phone: "+18095552002",
    status: "AWAITING_ADMIN",
    state: "ADMIN_QUERY",
    selected_offering_id: null,
    selected_date: null,
    selected_time: null,
    created_appointment_id: null,
    last_message_at: "2025-01-19 11:30:00",
  },
  // Conversación resuelta (cita creada)
  {
    id: "conversation-3-uuid",
    business_id: "business-1-uuid",
    customer_id: "customer-3-uuid",
    customer_phone: "+18095552003",
    status: "RESOLVED",
    state: "APPOINTMENT_CONFIRMED",
    selected_offering_id: "offering-1-uuid",
    selected_date: "2025-01-20",
    selected_time: "11:00:00",
    created_appointment_id: "appointment-2-uuid",
    last_message_at: "2025-01-18 14:00:00",
  },
];
```

**Messages a crear:**

```typescript
const messages = [
  // Conversación 1 - Activa
  {
    id: "message-1-uuid",
    conversation_id: "conversation-1-uuid",
    direction: "INBOUND",
    content: "Hola, quiero agendar una cita",
    message_type: "TEXT",
    is_from_admin: false,
    sent_at: "2025-01-19 10:00:00",
  },
  {
    id: "message-2-uuid",
    conversation_id: "conversation-1-uuid",
    direction: "OUTBOUND",
    content: "¡Hola! Bienvenido a Peluquería El Corte. ¿Qué servicio deseas?",
    message_type: "TEXT",
    is_from_admin: false,
    sent_at: "2025-01-19 10:00:05",
  },

  // Conversación 2 - Esperando admin
  {
    id: "message-3-uuid",
    conversation_id: "conversation-2-uuid",
    direction: "INBOUND",
    content: "Hola",
    message_type: "TEXT",
    is_from_admin: false,
    sent_at: "2025-01-19 11:30:00",
  },
  {
    id: "message-4-uuid",
    conversation_id: "conversation-2-uuid",
    direction: "OUTBOUND",
    content: "¡Hola! ¿En qué puedo ayudarte?",
    message_type: "TEXT",
    is_from_admin: false,
    sent_at: "2025-01-19 11:30:05",
  },
  {
    id: "message-5-uuid",
    conversation_id: "conversation-2-uuid",
    direction: "INBOUND",
    content: "Tengo una pregunta sobre precios",
    message_type: "TEXT",
    is_from_admin: false,
    sent_at: "2025-01-19 11:31:00",
  },
  {
    id: "message-6-uuid",
    conversation_id: "conversation-2-uuid",
    direction: "OUTBOUND",
    content: "Un momento, te conecto con un asesor",
    message_type: "TEXT",
    is_from_admin: false,
    sent_at: "2025-01-19 11:31:10",
  },

  // Conversación 3 - Resuelta
  {
    id: "message-7-uuid",
    conversation_id: "conversation-3-uuid",
    direction: "INBOUND",
    content: "Quiero agendar corte de pelo",
    message_type: "TEXT",
    is_from_admin: false,
    sent_at: "2025-01-18 14:00:00",
  },
  {
    id: "message-8-uuid",
    conversation_id: "conversation-3-uuid",
    direction: "OUTBOUND",
    content: "Perfecto. Selecciona una fecha",
    message_type: "BUTTON",
    is_from_admin: false,
    sent_at: "2025-01-18 14:00:05",
  },
  {
    id: "message-9-uuid",
    conversation_id: "conversation-3-uuid",
    direction: "INBOUND",
    content: "2025-01-20",
    message_type: "BUTTON",
    is_from_admin: false,
    sent_at: "2025-01-18 14:00:30",
  },
  {
    id: "message-10-uuid",
    conversation_id: "conversation-3-uuid",
    direction: "OUTBOUND",
    content: "✅ Cita confirmada para 20/01/2025 a las 11:00",
    message_type: "TEXT",
    is_from_admin: false,
    sent_at: "2025-01-18 14:01:00",
  },
];
```

## Correctness Properties

### Property 1: Migration Uniqueness

_For any_ migration file, there SHALL NOT exist another migration creating the same table
**Validates: Requirements 2.1**

### Property 2: Timestamp Consistency

_For any_ migration timestamp, it SHALL follow format YYYYMMDDHHMMSS (13 digits)
**Validates: Requirements 2.2**

### Property 3: Seed Foreign Key Integrity

_For any_ seed data with foreign key, the referenced record SHALL exist before insertion
**Validates: Requirements 6.2, 6.3**

### Property 4: BC Coverage

_For any_ Bounded Context with tables, there SHALL exist a corresponding seed file
**Validates: Requirements 4.7**

### Property 5: Availability Seed Completeness

_For any_ availability seed, it SHALL include schedules, blockouts AND capacities
**Validates: Requirements 4.4**

## Error Handling

### Migration Errors

**Scenario 1: Duplicate Migration Detected**

```typescript
if (migrationExists("CreateBusinessesTable")) {
  throw new Error(
    "Duplicate migration: CreateBusinessesTableOld already exists as CreateBusinessesTable",
  );
}
```

**Scenario 2: Invalid Timestamp**

```typescript
if (!isValidTimestamp(timestamp)) {
  throw new Error(
    `Invalid timestamp format: ${timestamp}. Expected: YYYYMMDDHHMMSS`,
  );
}
```

### Seed Errors

**Scenario 1: Foreign Key Violation**

```typescript
try {
  await queryRunner.manager.save(Customer, customerData);
} catch (error) {
  if (error.code === "23503") {
    // FK violation
    throw new Error(
      `Foreign key violation: user_id ${customerData.user_id} does not exist`,
    );
  }
  throw error;
}
```

**Scenario 2: Unique Constraint Violation**

```typescript
try {
  await queryRunner.manager.save(Business, businessData);
} catch (error) {
  if (error.code === "23505") {
    // Unique violation
    throw new Error(`Duplicate whatsapp_phone: ${businessData.whatsapp_phone}`);
  }
  throw error;
}
```

## Testing Strategy

### Unit Tests

**Test 1: Validate Migration Timestamps**

```typescript
describe("Migration Timestamps", () => {
  it("should have valid timestamp format", () => {
    const migrations = getMigrationFiles();
    migrations.forEach((migration) => {
      const timestamp = extractTimestamp(migration.filename);
      expect(timestamp).toMatch(/^\d{13}$/);
    });
  });
});
```

**Test 2: Validate No Duplicate Migrations**

```typescript
describe("Migration Uniqueness", () => {
  it("should not have duplicate table creations", () => {
    const migrations = getMigrationFiles();
    const tableCreations = migrations
      .filter((m) => m.filename.includes("Create"))
      .map((m) => extractTableName(m.filename));

    const duplicates = findDuplicates(tableCreations);
    expect(duplicates).toHaveLength(0);
  });
});
```

### Integration Tests

**Test 1: Run All Migrations**

```typescript
describe("Migration Execution", () => {
  it("should run all migrations without error", async () => {
    await expect(dataSource.runMigrations()).resolves.not.toThrow();
  });

  it("should create all expected tables", async () => {
    const tables = await dataSource.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);

    expect(tables).toContainEqual({ table_name: "users" });
    expect(tables).toContainEqual({ table_name: "business_owners" });
    expect(tables).toContainEqual({ table_name: "businesses" });
    expect(tables).toContainEqual({ table_name: "customers" });
    expect(tables).toContainEqual({ table_name: "offerings" });
    expect(tables).toContainEqual({ table_name: "schedules" });
    expect(tables).toContainEqual({ table_name: "blockouts" });
    expect(tables).toContainEqual({ table_name: "capacities" });
    expect(tables).toContainEqual({ table_name: "appointments" });
    expect(tables).toContainEqual({ table_name: "conversations" });
    expect(tables).toContainEqual({ table_name: "messages" });
  });
});
```

**Test 2: Run All Seeds**

```typescript
describe("Seed Execution", () => {
  it("should run all seeds without error", async () => {
    await expect(runSeeds()).resolves.not.toThrow();
  });

  it("should create expected number of records", async () => {
    const userCount = await dataSource.getRepository("users").count();
    expect(userCount).toBeGreaterThanOrEqual(5);

    const businessCount = await dataSource.getRepository("businesses").count();
    expect(businessCount).toBeGreaterThanOrEqual(3);

    const conversationCount = await dataSource
      .getRepository("conversations")
      .count();
    expect(conversationCount).toBeGreaterThanOrEqual(3);
  });
});
```

**Test 3: Validate Foreign Key Integrity**

```typescript
describe("Foreign Key Integrity", () => {
  it("should have valid foreign keys", async () => {
    // Verify business_owners.user_id references users.id
    const invalidBusinessOwners = await dataSource.query(`
      SELECT bo.id FROM business_owners bo
      LEFT JOIN users u ON bo.user_id = u.id
      WHERE u.id IS NULL
    `);
    expect(invalidBusinessOwners).toHaveLength(0);

    // Verify businesses.owner_id references users.id
    const invalidBusinesses = await dataSource.query(`
      SELECT b.id FROM businesses b
      LEFT JOIN users u ON b.owner_id = u.id
      WHERE u.id IS NULL
    `);
    expect(invalidBusinesses).toHaveLength(0);

    // Verify appointments.customer_id references customers.id
    const invalidAppointments = await dataSource.query(`
      SELECT a.id FROM appointments a
      LEFT JOIN customers c ON a.customer_id = c.id
      WHERE c.id IS NULL
    `);
    expect(invalidAppointments).toHaveLength(0);
  });
});
```

### Property-Based Tests

**Test 1: Seed Data Validity**

```typescript
import { fc, test } from '@fast-check/vitest';

describe('Seed Data Properties', () => {
  test.prop([fc.array(fc.uuid())])('all user_ids in customers should exist in users', async (userIds) => {
    // Generate users
    const users = userIds.map(id => ({ id, email: `${id}@test.com`, ... }));
    await insertUsers(users);

    // Generate customers with valid user_ids
    const customers = userIds.map(userId => ({
      id: uuid(),
      user_id: userId,
      business_id: 'valid-business-id',
      whatsapp_phone: `+1809555${Math.random()}`,
    }));

    // Should not throw FK violation
    await expect(insertCustomers(customers)).resolves.not.toThrow();
  });
});
```

## Implementation Plan

### Phase 1: Analysis & Documentation (Day 1)

1. ✅ Analyze current state (COMPLETED)
2. Create migration cleanup script
3. Document current vs target state
4. Create README.md with migration order

### Phase 2: Migration Cleanup (Day 1-2)

1. Delete `1734480001000-CreateBusinessesTableOld.ts`
2. Rename `20251219020859-add-search-indexes-to-customers.ts` (fix timestamp)
3. Verify no impact on existing data
4. Update migration table if needed

### Phase 3: Seed Updates (Day 2-3)

1. Update `availability.seed.ts` to include schedules and blockouts
2. Create `conversation.seed.ts` with conversations and messages
3. Update `seed.ts` orchestrator with correct order
4. Add helper functions for data generation

### Phase 4: Testing (Day 3-4)

1. Write unit tests for migration validation
2. Write integration tests for migration execution
3. Write integration tests for seed execution
4. Write property-based tests for data integrity
5. Run full test suite

### Phase 5: Documentation (Day 4)

1. Create `MIGRATIONS.md` with detailed migration history
2. Create `SEEDS.md` with seed data documentation
3. Update main README with database setup instructions
4. Document troubleshooting steps

## File Structure

```
apps/backend/src/database/
├── migrations/
│   ├── 1702550000000-EnableUuidExtension.ts
│   ├── 1702552000000-CreateUsersTable.ts
│   ├── 1734480000000-RefactorUserRoles.ts
│   ├── 1734481000000-StandardizeUsersTableNaming.ts
│   ├── 1766345898000-CreateBusinessOwnersTable.ts
│   ├── 1766334699000-CreateBusinessesTable.ts
│   ├── 1734482000000-CreateCustomersTable.ts
│   ├── 1766128110000-AddMergedIntoToCustomers.ts
│   ├── 20251219020859-AddSearchIndexesToCustomers.ts ← CORREGIDO
│   ├── 1702553000000-CreateOfferingsTable.ts
│   ├── 1734650000000-CreateSchedulesTable.ts
│   ├── 1734650100000-CreateBlockoutsTable.ts
│   ├── 1702551100000-CreateCapacitiesTable.ts
│   ├── 1702551000000-CreateAppointmentsTable.ts
│   ├── 1734999000000-CreateConversationsTable.ts
│   └── 1735000000000-CreateMessagesTable.ts
│
├── seeds/
│   ├── auth.seed.ts              ← Users
│   ├── account.seed.ts           ← BusinessOwners
│   ├── business.seed.ts          ← Businesses
│   ├── customer.seed.ts          ← Customers
│   ├── offering.seed.ts          ← Offerings
│   ├── availability.seed.ts      ← Schedules + Blockouts + Capacities (ACTUALIZAR)
│   ├── booking.seed.ts           ← Appointments
│   ├── conversation.seed.ts      ← Conversations + Messages (NUEVO)
│   └── seed.ts                   ← Orchestrator
│
├── __tests__/
│   ├── migrations.test.ts        ← Migration validation tests
│   ├── seeds.test.ts             ← Seed execution tests
│   └── integrity.test.ts         ← Foreign key integrity tests
│
├── MIGRATIONS.md                 ← Migration documentation (NUEVO)
├── SEEDS.md                      ← Seed documentation (NUEVO)
└── README.md                     ← Database setup guide (ACTUALIZAR)
```

## Success Metrics

- ✅ Zero duplicate migrations
- ✅ All timestamps follow YYYYMMDDHHMMSS format
- ✅ All BCs have corresponding seeds
- ✅ 100% of tables have seed data
- ✅ All foreign keys validated
- ✅ All tests pass
- ✅ Documentation complete

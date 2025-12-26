# Requirements Document - Database Migrations & Seeds Cleanup

## Introduction

Este spec define la reorganización completa de migraciones y seeds de la base de datos para eliminar redundancias, ambigüedades y asegurar que la estructura refleje correctamente la arquitectura de Bounded Contexts del sistema.

### Estado Actual de la Base de Datos

**Tablas existentes en `bookings-software`:**

- `users` (Auth BC) - ✅ Completa con roles, email_verified, is_active
- `business_owners` (Account BC) - ✅ Completa con subscription_plan, subscription_status
- `businesses` (Business BC) - ✅ Completa con address fields, whatsapp_phone
- `customers` (Customer BC) - ✅ Completa con user_id nullable, merged_into
- `offerings` (Offering BC) - ✅ Completa
- `schedules` (Availability BC) - ✅ Completa
- `blockouts` (Availability BC) - ✅ Completa
- `capacities` (Availability BC) - ✅ Completa con version
- `appointments` (Booking BC) - ✅ Completa con version
- `conversations` (Conversation BC) - ✅ Completa con state, status, version
- `messages` (Conversation BC) - ✅ Completa

**Problemas Identificados:**

1. **Migración duplicada:** `CreateBusinessesTableOld` (id=13) vs `CreateBusinessesTable` (id=16)
2. **Timestamp inconsistente:** Migración id=9 tiene timestamp `251219020859` (debería ser `20251219020859`)
3. **Orden de ejecución:** Migraciones no siguen orden cronológico correcto en la tabla
4. **Seeds incompletos:** Falta seed para Conversation BC (conversations + messages)
5. **Availability seed:** Solo tiene capacities, falta schedules y blockouts

## Glossary

- **Migration**: Archivo TypeORM que define cambios en el esquema de base de datos
- **Seed**: Archivo que inserta datos de prueba en la base de datos
- **BC (Bounded Context)**: Límite explícito de un modelo de dominio
- **Redundant Migration**: Migración duplicada o que crea la misma tabla dos veces
- **Orphan Table**: Tabla en BD sin migración correspondiente
- **Seed Coverage**: Porcentaje de tablas con datos de prueba

## Requirements

### Requirement 1: Análisis de Estado Actual

**User Story:** Como desarrollador, quiero entender el estado actual de migraciones y seeds, para identificar problemas y redundancias.

#### Acceptance Criteria

1. WHEN se ejecuta el análisis THEN el sistema SHALL listar todas las migraciones existentes con sus timestamps
2. WHEN se compara con la BD THEN el sistema SHALL identificar tablas sin migración correspondiente
3. WHEN se revisan migraciones THEN el sistema SHALL detectar migraciones duplicadas (ej: CreateBusinessesTableOld vs CreateBusinessesTable)
4. WHEN se revisan seeds THEN el sistema SHALL identificar BCs sin seeds correspondientes
5. WHEN se analiza cobertura THEN el sistema SHALL reportar qué tablas no tienen seeds

### Requirement 2: Limpieza de Migraciones Redundantes

**User Story:** Como desarrollador, quiero eliminar migraciones redundantes y ambiguas, para tener un historial limpio y claro.

#### Acceptance Criteria

1. WHEN se detecta migración duplicada THEN el sistema SHALL eliminar `CreateBusinessesTableOld` (id=13) manteniendo solo `CreateBusinessesTable` (id=16)
2. WHEN se corrige timestamp THEN el sistema SHALL renombrar migración con timestamp `251219020859` a `20251219020859`
3. WHEN se reorganizan migraciones THEN el sistema SHALL mantener orden cronológico correcto en archivos
4. WHEN se renombran migraciones THEN el sistema SHALL usar nomenclatura consistente (PascalCase, descriptiva)
5. WHEN se eliminan migraciones THEN el sistema SHALL verificar que no afecten datos existentes en BD
6. WHEN se consolidan migraciones THEN el sistema SHALL agrupar cambios relacionados del mismo BC

### Requirement 3: Organización por Bounded Context

**User Story:** Como desarrollador, quiero que migraciones estén organizadas por BC, para facilitar mantenimiento y comprensión.

#### Acceptance Criteria

1. WHEN se crean migraciones THEN el sistema SHALL agruparlas por BC en el nombre (ej: CreateAuthTables, CreateBookingTables)
2. WHEN se revisa orden THEN el sistema SHALL seguir dependencias entre BCs (Auth → Account → Business → Booking)
3. WHEN se documenta migración THEN el sistema SHALL incluir comentario con BC y requirements relacionados
4. WHEN se crea tabla THEN el sistema SHALL incluir todos los campos necesarios del aggregate correspondiente
5. WHEN se crean índices THEN el sistema SHALL incluir índices para queries frecuentes del BC

### Requirement 4: Seeds Completos por BC

**User Story:** Como desarrollador, quiero seeds organizados por BC con datos realistas, para facilitar testing y desarrollo.

#### Acceptance Criteria

1. WHEN se crea seed de Auth THEN el sistema SHALL incluir datos para users con múltiples roles (['BUSINESS_OWNER'], ['CUSTOMER'], ['BUSINESS_OWNER', 'CUSTOMER'])
2. WHEN se crea seed de Account THEN el sistema SHALL incluir business_owners con diferentes planes (FREE, BASIC, PRO)
3. WHEN se crea seed de Business THEN el sistema SHALL incluir businesses vinculados a users con diferentes timezones
4. WHEN se crea seed de Availability THEN el sistema SHALL incluir schedules (horarios por día), blockouts (vacaciones) Y capacities (slots disponibles)
5. WHEN se crea seed de Booking THEN el sistema SHALL incluir appointments con diferentes estados (CONFIRMED, CANCELLED, COMPLETED)
6. WHEN se crea seed de Customer THEN el sistema SHALL incluir customers anónimos (user_id=null) Y registrados (user_id!=null)
7. WHEN se crea seed de Conversation THEN el sistema SHALL incluir conversations con diferentes estados (ACTIVE, AWAITING_ADMIN, RESOLVED) Y messages (INBOUND, OUTBOUND)
8. WHEN se crea seed de Offering THEN el sistema SHALL incluir offerings activos (is_active=true) e inactivos (is_active=false)

### Requirement 5: Datos de Prueba Realistas

**User Story:** Como desarrollador, quiero seeds con datos realistas y variados, para probar diferentes escenarios.

#### Acceptance Criteria

1. WHEN se generan users THEN el sistema SHALL crear al menos 5 users con diferentes combinaciones de roles
2. WHEN se generan businesses THEN el sistema SHALL crear al menos 3 businesses con diferentes timezones
3. WHEN se generan appointments THEN el sistema SHALL crear appointments en pasado, presente y futuro
4. WHEN se generan customers THEN el sistema SHALL crear mix de anónimos (userId=null) y registrados (userId!=null)
5. WHEN se generan conversations THEN el sistema SHALL crear conversations con diferentes estados (ACTIVE, AWAITING_ADMIN, RESOLVED)
6. WHEN se generan schedules THEN el sistema SHALL crear horarios variados (diferentes días, horarios)
7. WHEN se generan capacities THEN el sistema SHALL crear capacities con diferentes niveles de ocupación
8. WHEN se generan offerings THEN el sistema SHALL crear offerings con diferentes duraciones y capacidades

### Requirement 6: Validación de Integridad

**User Story:** Como desarrollador, quiero validar que migraciones y seeds mantengan integridad referencial, para evitar errores en runtime.

#### Acceptance Criteria

1. WHEN se ejecutan migraciones THEN el sistema SHALL crear todas las foreign keys necesarias
2. WHEN se ejecutan seeds THEN el sistema SHALL respetar orden de dependencias (users → business_owners → businesses → appointments)
3. WHEN se insertan datos THEN el sistema SHALL validar que foreign keys existan
4. WHEN se crean índices THEN el sistema SHALL incluir índices para todas las foreign keys
5. WHEN se ejecuta rollback THEN el sistema SHALL limpiar datos en orden inverso

### Requirement 7: Documentación y Mantenibilidad

**User Story:** Como desarrollador, quiero migraciones y seeds bien documentados, para facilitar mantenimiento futuro.

#### Acceptance Criteria

1. WHEN se crea migración THEN el sistema SHALL incluir comentario JSDoc con propósito y BC
2. WHEN se crea seed THEN el sistema SHALL incluir comentario explicando datos generados
3. WHEN se documenta estructura THEN el sistema SHALL crear README.md con orden de ejecución
4. WHEN se agregan datos THEN el sistema SHALL usar constantes nombradas en lugar de magic numbers
5. WHEN se crean helpers THEN el sistema SHALL extraer lógica repetitiva a funciones reutilizables

### Requirement 8: Testing de Migraciones

**User Story:** Como desarrollador, quiero tests que validen migraciones, para asegurar que funcionan correctamente.

#### Acceptance Criteria

1. WHEN se ejecuta test THEN el sistema SHALL verificar que todas las migraciones corren sin error
2. WHEN se ejecuta rollback THEN el sistema SHALL verificar que todas las migraciones revierten correctamente
3. WHEN se valida esquema THEN el sistema SHALL verificar que todas las tablas esperadas existen
4. WHEN se valida índices THEN el sistema SHALL verificar que todos los índices esperados existen
5. WHEN se valida foreign keys THEN el sistema SHALL verificar que todas las relaciones existen

## Out of Scope (Post-MVP)

- Migraciones automáticas desde modelos TypeORM
- Versionado de seeds por ambiente
- Seeds con datos de producción anonimizados
- Migraciones zero-downtime para producción
- Rollback automático en caso de error

## Success Criteria

- ✅ Cero migraciones duplicadas (eliminar CreateBusinessesTableOld)
- ✅ Timestamps consistentes (corregir 251219020859 → 20251219020859)
- ✅ Todos los BCs tienen seeds correspondientes (agregar conversation.seed.ts)
- ✅ Availability seed completo (schedules + blockouts + capacities)
- ✅ 100% de tablas tienen datos de prueba
- ✅ Migraciones ejecutan en orden correcto
- ✅ Seeds respetan integridad referencial (users → business_owners → businesses → appointments)
- ✅ Documentación completa de estructura
- ✅ Tests de migraciones pasan al 100%
- ✅ Al menos 5 users con diferentes combinaciones de roles
- ✅ Al menos 3 businesses con diferentes configuraciones
- ✅ Mix de customers anónimos y registrados
- ✅ Conversations con diferentes estados y mensajes

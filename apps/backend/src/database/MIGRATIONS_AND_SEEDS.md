# Migraciones y Seeders - Sistema de Reservas

## 📋 Resumen

Este documento describe las migraciones de base de datos y los seeders implementados para el Sistema de Reservas Multi-Tenant.

## 🗄️ Migraciones Implementadas

### 1. EnableUuidExtension (1702550000000)

**Archivo:** `src/database/migrations/1702550000000-EnableUuidExtension.ts`

Habilita la extensión `uuid-ossp` de PostgreSQL para generar UUIDs automáticamente.

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp"
```

### 2. CreateAppointmentsTable (1702551000000)

**Archivo:** `src/database/migrations/1702551000000-CreateAppointmentsTable.ts`

Crea la tabla `appointments` con los siguientes campos:

| Campo        | Tipo        | Descripción                                |
| ------------ | ----------- | ------------------------------------------ |
| id           | uuid        | Primary key, generado automáticamente      |
| business_id  | uuid        | ID del negocio                             |
| customer_id  | uuid        | ID del cliente                             |
| offering_id  | uuid        | ID del servicio                            |
| date_time    | timestamp   | Fecha y hora de la cita                    |
| status       | varchar(50) | Estado (CONFIRMED, CANCELLED, COMPLETED)   |
| version      | int         | Campo para Optimistic Locking (default: 0) |
| created_at   | timestamp   | Fecha de creación                          |
| updated_at   | timestamp   | Fecha de última actualización              |
| cancelled_at | timestamp   | Fecha de cancelación (nullable)            |

**Índices:**

- `IDX_APPOINTMENTS_BUSINESS_ID` en `business_id`
- `IDX_APPOINTMENTS_CUSTOMER_ID` en `customer_id`

### 3. CreateCapacitiesTable (1702551100000)

**Archivo:** `src/database/migrations/1702551100000-CreateCapacitiesTable.ts`

Crea la tabla `capacities` con los siguientes campos:

| Campo           | Tipo      | Descripción                                |
| --------------- | --------- | ------------------------------------------ |
| id              | uuid      | Primary key, generado automáticamente      |
| offering_id     | uuid      | ID del servicio                            |
| date            | date      | Fecha de la capacidad                      |
| total_slots     | int       | Total de slots disponibles                 |
| available_slots | int       | Slots disponibles actualmente              |
| version         | int       | Campo para Optimistic Locking (default: 0) |
| created_at      | timestamp | Fecha de creación                          |
| updated_at      | timestamp | Fecha de última actualización              |

**Índices:**

- `IDX_CAPACITIES_OFFERING_DATE_UNIQUE` en `(offering_id, date)` - UNIQUE

Este índice único garantiza que no haya duplicados de capacidad para el mismo servicio y fecha.

### 4. CreateUsersTable (1702552000000)

**Archivo:** `src/database/migrations/1702552000000-CreateUsersTable.ts`

Crea la tabla `users` con los siguientes campos:

| Campo      | Tipo      | Descripción                        |
| ---------- | --------- | ---------------------------------- |
| id         | uuid      | Primary key                        |
| email      | varchar   | Email del usuario (unique)         |
| password   | varchar   | Password hasheado                  |
| name       | varchar   | Nombre del usuario                 |
| businessId | uuid      | ID del negocio (nullable)          |
| version    | int       | Campo para versioning (default: 0) |
| createdAt  | timestamp | Fecha de creación                  |

**Índices:**

- `IDX_users_email` en `email`

## 🌱 Seeder Implementado

### Archivo: `src/database/seeds/seed.ts`

El seeder crea datos de prueba para desarrollo y testing:

#### 1. Usuario de Prueba

- **Email:** test@example.com
- **Password:** Test123!
- **Nombre:** Test Business Owner
- **Business ID:** Generado automáticamente

#### 2. Offerings (IDs generados)

Se generan 3 IDs de offerings ficticios:

- Offering 1: Simulando "Corte de pelo" (8 slots/día)
- Offering 2: Simulando "Lavado" (12 slots/día)
- Offering 3: Simulando "Tinte" (4 slots/día)

**Nota:** En una implementación completa, estos se insertarían en una tabla `offerings`.

#### 3. Capacidades (30 días)

Se crean capacidades para los próximos 30 días:

- **Total de registros:** 90 (3 offerings × 30 días)
- **Offering 1:** 8 slots por día
- **Offering 2:** 12 slots por día
- **Offering 3:** 4 slots por día

#### 4. Citas de Ejemplo

Se crean 2 citas de ejemplo:

- **Cita 1:** Mañana a las 10:00 AM (Offering 1)
- **Cita 2:** Pasado mañana a las 2:00 PM (Offering 2)

Las capacidades se actualizan automáticamente para reflejar estas citas.

## 🚀 Comandos Disponibles

### Ejecutar Migraciones

```bash
# Ejecutar todas las migraciones pendientes
npm run migration:run

# Revertir la última migración
npm run migration:revert
```

### Generar Nueva Migración

```bash
# Generar migración basada en cambios en entities
npm run migration:generate -- src/database/migrations/NombreDeLaMigracion

# Crear migración vacía
npm run migration:create -- src/database/migrations/NombreDeLaMigracion
```

### Ejecutar Seeder

```bash
# Ejecutar el seeder (limpia y crea datos de prueba)
npm run seed
```

**⚠️ ADVERTENCIA:** El seeder ejecuta `TRUNCATE` en las tablas, eliminando todos los datos existentes.

## 📝 Configuración

### Variables de Entorno Requeridas

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=tu_password
DB_DATABASE=postgres_dev
```

### Archivo de Configuración

La configuración del DataSource se encuentra en `src/config/database.ts`:

```typescript
export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  entities: ['dist/**/*.model.js'],
  migrations: ['dist/database/migrations/**/*.js'],
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
  migrationsRun: false,
  migrationsTableName: 'migrations',
});
```

## 🔒 Optimistic Locking

Las tablas `appointments` y `capacities` incluyen el campo `version` para implementar Optimistic Locking:

### ¿Cómo funciona?

1. Al leer un registro, se obtiene su `version` actual
2. Al actualizar, se verifica que la `version` no haya cambiado
3. Si cambió, se lanza `ConcurrencyException`
4. El handler puede reintentar la operación

### Ejemplo de Query con Optimistic Locking

```sql
UPDATE appointments
SET
  status = 'CANCELLED',
  version = version + 1,
  updated_at = NOW()
WHERE
  id = 'uuid-here'
  AND version = 5;  -- Verifica que la versión sea la esperada
```

Si `affected = 0`, significa que otro proceso modificó el registro.

## 🧪 Testing

### Setup de Base de Datos para Tests

```bash
# Ejecutar setup de BD de test
npm run test:setup-db
```

Este comando:

1. Crea la base de datos de test si no existe
2. Ejecuta todas las migraciones
3. Ejecuta el seeder

## 📊 Diagrama de Relaciones

```
┌─────────────┐
│    users    │
└──────┬──────┘
       │
       │ businessId
       │
       ▼
┌─────────────┐      ┌──────────────┐
│appointments │      │ capacities   │
├─────────────┤      ├──────────────┤
│ business_id │      │ offering_id  │
│ customer_id │      │ date         │
│ offering_id │◄─────┤ total_slots  │
│ date_time   │      │ available_   │
│ status      │      │   slots      │
│ version     │      │ version      │
└─────────────┘      └──────────────┘
```

## 🔄 Flujo de Creación de Cita

1. **Verificar Capacidad:**

   ```sql
   SELECT * FROM capacities
   WHERE offering_id = ? AND date = ?
   FOR UPDATE;  -- Lock para evitar race conditions
   ```

2. **Crear Cita:**

   ```sql
   INSERT INTO appointments (...) VALUES (...);
   ```

3. **Decrementar Capacidad:**

   ```sql
   UPDATE capacities
   SET
     available_slots = available_slots - 1,
     version = version + 1
   WHERE
     offering_id = ?
     AND date = ?
     AND version = ?;
   ```

4. **Verificar Actualización:**
   - Si `affected = 0` → Lanzar `ConcurrencyException`
   - Si `affected = 1` → Commit exitoso

## 📚 Referencias

- [TypeORM Migrations](https://typeorm.io/migrations)
- [PostgreSQL UUID Extension](https://www.postgresql.org/docs/current/uuid-ossp.html)
- [Optimistic Locking Pattern](https://martinfowler.com/eaaCatalog/optimisticOfflineLock.html)

## ✅ Checklist de Implementación

- [x] Migración para habilitar UUID extension
- [x] Migración para tabla `appointments` con versioning
- [x] Migración para tabla `capacities` con versioning
- [x] Migración para tabla `users`
- [x] Índices en campos de búsqueda frecuente
- [x] Índice único compuesto en `capacities(offering_id, date)`
- [x] Seeder con usuario de prueba
- [x] Seeder con capacidades para 30 días
- [x] Seeder con citas de ejemplo
- [x] Scripts npm configurados
- [x] Documentación completa

## 🎯 Próximos Pasos

1. Crear migraciones para tablas adicionales:
   - `offerings` (servicios)
   - `schedules` (horarios)
   - `blockouts` (bloqueos)
   - `customers` (clientes)
   - `conversations` (conversaciones WhatsApp)
   - `messages` (mensajes)
   - `reminders` (recordatorios)

2. Expandir seeder con datos más realistas

3. Implementar migraciones de datos (data migrations) si es necesario

4. Configurar CI/CD para ejecutar migraciones automáticamente

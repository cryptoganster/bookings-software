# Análisis: Datos Faltantes en Display de Appointments

**Fecha:** 2024-12-17  
**Contexto:** Verificación de datos mostrados en frontend vs datos disponibles en seeds

## 🔍 Hallazgos

### 1. Backend: Datos Disponibles en Read Model

El `AppointmentReadModel` define los siguientes campos:

```typescript
export class AppointmentReadModel {
  id!: string;
  businessId!: string;
  customerId!: string;
  customerName!: string | null; // ✅ Campo existe
  customerPhone!: string; // ✅ Campo existe
  offeringId!: string;
  offeringName!: string; // ✅ Campo existe
  dateTime!: Date;
  status!: string;
  createdAt!: Date;
  cancelledAt!: Date | null;
}
```

### 2. Frontend: Datos Mostrados en AppointmentCard

El componente `AppointmentCard` **SÍ muestra** todos los campos relevantes:

```tsx
// ✅ Muestra nombre del cliente
<Text fw={500} size="sm">
  {formatCustomerName(appointment)}
</Text>

// ✅ Muestra teléfono del cliente
<IconPhone size={14} />
<Text size="xs" c="dimmed">
  {formatPhoneNumber(appointment.customerPhone)}
</Text>

// ✅ Muestra nombre del servicio (offering)
<IconScissors size={16} />
<Text size="sm" fw={500}>
  {appointment.offeringName}
</Text>
```

### 3. ❌ PROBLEMA IDENTIFICADO: Seeds No Crean Datos Completos

#### Problema 1: No Existe Bounded Context de Customer

- **Ubicación esperada:** `apps/backend/src/customer/`
- **Estado:** ❌ NO EXISTE
- **Impacto:** No hay tabla `customers` en la base de datos

#### Problema 2: Seeds Solo Crean Appointments

El archivo `apps/backend/src/database/seeds/booking.seed.ts`:

```typescript
// ❌ Solo crea appointments con customer_id UUID
await dataSource.query(
  `INSERT INTO appointments (id, business_id, customer_id, offering_id, ...)
   VALUES ($1, $2, $3, $4, ...)`,
  [uuidv4(), businessId, customerId1, offering1Id, ...]
);

// ❌ NO crea registros en tabla customers
// ❌ NO hay nombres de clientes
// ❌ NO hay teléfonos de clientes
```

#### Problema 3: Repository No Hace JOINs

El `AppointmentReadRepository` **NO hace JOIN** con otras tablas:

```typescript
// ❌ Solo consulta tabla appointments
const models = await this.repository.find({
  where: { customerId },
  order: { dateTime: "ASC" },
});

// ❌ NO hace JOIN con customers
// ❌ NO hace JOIN con offerings
```

**Resultado:** Los campos `customerName`, `customerPhone`, y `offeringName` siempre son `null` o vacíos.

## 📊 Estado Actual en Browser

Según el screenshot de `/appointments`:

- ✅ **Fecha y hora:** Se muestran correctamente
- ✅ **Estado (badge):** Se muestra correctamente (COMPLETADA, CANCELADA, CONFIRMADA)
- ❌ **Nombre del cliente:** NO se muestra (campo vacío con solo icono de usuario)
- ❌ **Teléfono del cliente:** NO se muestra
- ❌ **Nombre del servicio:** NO se muestra (solo icono de tijeras)

## 🎯 Soluciones Requeridas

### Opción 1: Implementar Customer BC (Recomendado según PRD)

Según `.kiro/steering/PRD.md`, el sistema **SÍ debe tener** un Customer BC:

```
#### BC6: `customer`
**Responsabilidad:** Gestión de clientes finales
**Aggregates:**
- `Customer` - Cliente final del negocio (identificado por número WhatsApp)
```

**Pasos:**

1. Crear `apps/backend/src/customer/` con estructura completa
2. Crear tabla `customers` con campos:
   - `id` (UUID)
   - `business_id` (UUID)
   - `whatsapp_phone` (string)
   - `name` (string, nullable)
   - `created_at` (timestamp)
3. Actualizar seeds para crear customers:
   ```typescript
   await dataSource.query(
     `INSERT INTO customers (id, business_id, whatsapp_phone, name, created_at)
      VALUES ($1, $2, $3, $4, NOW())`,
     [customerId1, businessId, "+18095551234", "Juan Pérez"],
   );
   ```
4. Actualizar `AppointmentReadRepository` para hacer JOINs:
   ```typescript
   const queryBuilder = this.repository
     .createQueryBuilder("appointment")
     .leftJoin("customers", "c", "c.id = appointment.customerId")
     .leftJoin("offerings", "o", "o.id = appointment.offeringId")
     .select([
       "appointment.*",
       "c.name as customerName",
       "c.whatsapp_phone as customerPhone",
       "o.name as offeringName",
     ])
     .where("appointment.businessId = :businessId", { businessId });
   ```

### Opción 2: Workaround Temporal (Solo para MVP)

Si Customer BC no es prioridad inmediata:

1. Agregar campos desnormalizados a tabla `appointments`:
   - `customer_name` (string, nullable)
   - `customer_phone` (string)
   - `offering_name` (string)
2. Actualizar seeds para incluir estos datos
3. Actualizar mapper para leer estos campos

**⚠️ Advertencia:** Esta opción viola DDD y CQRS, solo para MVP rápido.

## 📝 Archivos Afectados

### Backend

- ❌ `apps/backend/src/customer/` - NO EXISTE (debe crearse)
- ✅ `apps/backend/src/booking/domain/read-models/appointment.ts` - Campos definidos correctamente
- ❌ `apps/backend/src/booking/infra/persistence/repositories/appointment-read.ts` - Falta JOINs
- ❌ `apps/backend/src/database/seeds/booking.seed.ts` - Falta crear customers

### Frontend

- ✅ `apps/frontend/src/entities/appointment/ui/AppointmentCard.tsx` - Implementado correctamente
- ✅ `apps/frontend/src/entities/appointment/lib/formatAppointment.ts` - Formatters listos

## 🚀 Prioridad

**ALTA** - Los usuarios no pueden ver información básica de las citas (quién es el cliente, qué servicio reservó).

## 📚 Referencias

- PRD: `.kiro/steering/PRD.md` - Sección "BC6: customer"
- Bounded Contexts: `.kiro/steering/bounded-contexts.md`
- Factory Pattern: `.kiro/steering/factory-pattern.md`
- DDD Patterns: `.kiro/steering/ddd-patterns.md`

## ✅ Conclusión

El frontend **está implementado correctamente** y muestra todos los campos necesarios. El problema es que:

1. **No existe el Customer BC** (debe implementarse según PRD)
2. **Seeds no crean datos de customers**
3. **Repository no hace JOINs** para obtener datos relacionados

**Acción recomendada:** Implementar Customer BC completo siguiendo la arquitectura DDD del proyecto.

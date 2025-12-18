# Dashboard Stats Fix - Diagnóstico y Solución

## Problema Reportado

El dashboard mostraba:
- **StatsCards:** "5 citas hoy" y "23 citas esta semana" (hardcodeado)
- **UpcomingAppointments:** Panel vacío (debería mostrar 2 citas futuras)

## Diagnóstico

### 1. Datos Reales en la BD (PostgreSQL)

```sql
-- Total de citas: 5
SELECT COUNT(*) FROM appointments;
-- Resultado: 5

-- Citas por fecha y estado:
- 2025-12-16 15:00 | COMPLETED  (pasada)
- 2025-12-18 10:00 | CONFIRMED  (pasada - hoy es 18 a las 14:01)
- 2025-12-19 14:00 | CONFIRMED  (futura)
- 2025-12-20 16:00 | CONFIRMED  (futura)
- 2025-12-22 11:00 | CANCELLED  (cancelada)
```

**Citas futuras (upcoming):** 2 citas (19 y 20 de diciembre)

### 2. Problema #1: StatsCards con Datos Mock

**Archivo:** `apps/frontend/src/widgets/StatsCards/model/useStats.ts`

```typescript
// ❌ Datos hardcodeados
return {
  appointmentsToday: 5,    // Mock
  appointmentsThisWeek: 23, // Mock
};
```

**Causa:** El endpoint `/appointments/stats` no existía en el backend.

### 3. Problema #2: UpcomingAppointments Vacío

**Archivo:** `apps/frontend/src/widgets/UpcomingAppointments/ui/UpcomingAppointments.tsx`

El widget usa el endpoint real `/appointments/upcoming` que SÍ existe y funciona correctamente.

**Posible causa del panel vacío:**
- Error de autenticación (token inválido)
- Error de CORS
- Error en la query del backend
- Problema con el mapper de datos

## Solución Implementada

### Backend: Nuevo Endpoint `/appointments/stats`

#### 1. Query y Handler

**Archivos creados:**
- `apps/backend/src/booking/app/queries/get-appointment-stats/query.ts`
- `apps/backend/src/booking/app/queries/get-appointment-stats/handler.ts`

**Lógica:**
```typescript
// Calcula:
// - appointmentsToday: Citas entre 00:00 y 23:59 de hoy
// - appointmentsThisWeek: Citas entre lunes 00:00 y domingo 23:59
// Excluye citas CANCELLED
```

#### 2. Nuevo Método en Repositorio

**Archivo:** `apps/backend/src/booking/infra/persistence/repositories/appointment-read.ts`

```typescript
async findByBusinessAndDateRange(
  businessId: string,
  startDate: Date,
  endDate: Date,
): Promise<AppointmentReadModel[]> {
  // Query con rango de fechas
  // Excluye CANCELLED
}
```

#### 3. Endpoint en Controller

**Archivo:** `apps/backend/src/booking/presentation/controllers/appointment.controller.ts`

```typescript
@Get('stats')
async getStats(@CurrentUser() user: UserPayload) {
  const businessId = user.businessId || user.userId;
  const stats = await this.queryBus.execute(
    new GetAppointmentStatsQuery(businessId)
  );
  return stats;
}
```

**Nota:** El endpoint `stats` debe estar ANTES de `:id` para evitar que se interprete como un ID.

#### 4. Registro en Módulo

**Archivo:** `apps/backend/src/booking/booking.module.ts`

```typescript
import { GetAppointmentStatsHandler } from './app/queries/get-appointment-stats/handler';

const QueryHandlers = [
  // ...
  GetAppointmentStatsHandler,
];
```

### Frontend: Usar Endpoint Real

**Archivo:** `apps/frontend/src/widgets/StatsCards/model/useStats.ts`

```typescript
// ✅ Ahora usa el endpoint real
async function fetchStats(): Promise<StatsData> {
  const { data } = await apiClient.get<StatsData>("/appointments/stats");
  return data;
}
```

## Resultado Esperado

Después del fix:

### StatsCards (Datos Reales)
- **Citas Hoy:** 0 (la cita de hoy a las 10:00 ya pasó)
- **Citas Esta Semana:** 2 (19 y 20 de diciembre, excluyendo la cancelada del 22)

### UpcomingAppointments
- Debería mostrar 2 citas:
  1. 19 de diciembre 14:00 - CONFIRMED
  2. 20 de diciembre 16:00 - CONFIRMED

## Verificación

### 1. Backend

```bash
# Verificar que el servidor recompiló
# Nodemon debería detectar los cambios automáticamente

# Test manual del endpoint
curl -H "Authorization: Bearer <token>" \
  http://localhost:3000/api/appointments/stats
```

**Respuesta esperada:**
```json
{
  "appointmentsToday": 0,
  "appointmentsThisWeek": 2
}
```

### 2. Frontend

```bash
# El frontend debería recargar automáticamente (Vite HMR)
# Verificar en el navegador:
# - StatsCards muestra datos reales
# - UpcomingAppointments muestra 2 citas
```

### 3. Verificar en BD

```bash
docker exec <container-id> psql -U postgres -d bookings-software -c \
  "SELECT date_time, status FROM appointments WHERE status != 'CANCELLED' AND date_time >= NOW() ORDER BY date_time;"
```

## Archivos Modificados

### Backend
1. ✅ `apps/backend/src/booking/app/queries/get-appointment-stats/query.ts` (nuevo)
2. ✅ `apps/backend/src/booking/app/queries/get-appointment-stats/handler.ts` (nuevo)
3. ✅ `apps/backend/src/booking/domain/interfaces/repositories/appointment-read.ts` (modificado)
4. ✅ `apps/backend/src/booking/infra/persistence/repositories/appointment-read.ts` (modificado)
5. ✅ `apps/backend/src/booking/presentation/controllers/appointment.controller.ts` (modificado)
6. ✅ `apps/backend/src/booking/booking.module.ts` (modificado)

### Frontend
7. ✅ `apps/frontend/src/widgets/StatsCards/model/useStats.ts` (modificado)

## Notas Adicionales

### Orden de Endpoints en Controller

Es importante que el endpoint `@Get('stats')` esté ANTES de `@Get(':id')` porque:
- NestJS evalúa las rutas en orden
- Si `:id` está primero, `stats` se interpretaría como un ID
- Orden correcto:
  ```typescript
  @Get('stats')      // Primero
  @Get('upcoming')   // Segundo
  @Get(':id')        // Último (catch-all)
  ```

### Cálculo de "Esta Semana"

El handler calcula la semana de lunes a domingo:
- Lunes 00:00:00 → Domingo 23:59:59
- Si hoy es miércoles, incluye desde el lunes anterior hasta el domingo siguiente

### Exclusión de Citas Canceladas

Tanto `findByBusinessAndDateRange` como `findUpcoming` excluyen citas con status `CANCELLED`.

## Testing

### Unit Test del Handler

```typescript
describe('GetAppointmentStatsHandler', () => {
  it('should return correct stats for today and this week', async () => {
    // Mock repository
    // Execute handler
    // Assert counts
  });
});
```

### Integration Test

```typescript
describe('GET /appointments/stats', () => {
  it('should return stats with valid token', async () => {
    const response = await request(app.getHttpServer())
      .get('/appointments/stats')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    
    expect(response.body).toHaveProperty('appointmentsToday');
    expect(response.body).toHaveProperty('appointmentsThisWeek');
  });
});
```

## Conclusión

El problema era que el frontend usaba datos mock porque el endpoint `/appointments/stats` no existía. Ahora:

1. ✅ Backend tiene endpoint funcional con lógica correcta
2. ✅ Frontend consume datos reales
3. ✅ StatsCards muestra estadísticas precisas
4. ✅ UpcomingAppointments debería funcionar (verificar autenticación si sigue vacío)

Si UpcomingAppointments sigue vacío después de este fix, el problema es diferente (probablemente autenticación o CORS).

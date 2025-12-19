# Offering Bounded Context - Spec Summary

## Overview

Esta spec define la implementación completa del **Bounded Context Offering** en el backend del sistema de reservas multi-tenant.

## Status

- **Requirements:** ✅ Completado
- **Design:** ✅ Completado
- **Tasks:** ✅ Completado (51 tareas, todas requeridas)
- **Implementation:** ⏳ Pendiente

## Quick Links

- [Requirements](./requirements.md) - 9 requirements con acceptance criteria
- [Design](./design.md) - Arquitectura, componentes, y correctness properties
- [Tasks](./tasks.md) - 51 tareas organizadas en 9 fases

## Key Features

### Domain Layer

- **Aggregate:** Offering con versioning (Optimistic Locking)
- **Value Objects:** OfferingDuration, OfferingCapacity
- **Events:** OfferingCreated, OfferingUpdated, OfferingDeactivated, OfferingActivated
- **Exceptions:** 5 domain exceptions específicas

### Application Layer

- **Commands:** Create, Update, Deactivate, Activate
- **Queries:** GetActive, GetById, GetByBusiness
- **Event Handlers:** WebSocket broadcasting para todos los eventos

### Infrastructure Layer

- **TypeORM Model:** Con índices optimizados
- **Repositories:** Write y Read separados (CQRS)
- **Migration:** Tabla offerings con índices

### Integration Points

- **Conversation BC:** Reemplaza hardcoded offerings con query real
- **Availability BC:** Capacity ya referencia offeringId
- **Booking BC:** Appointments ya referencian offeringId
- **Frontend:** WebSocket para actualizaciones en tiempo real

## Testing Strategy

### Comprehensive Testing (51 tasks total)

- **Unit Tests:** Aggregate, Value Objects
- **Property-Based Tests:** 5 correctness properties
- **Integration Tests:** Repositories, Command/Query Handlers, Event Handlers
- **WebSocket Tests:** Event broadcasting
- **E2E Tests:** Flujo completo con Conversation BC

### Correctness Properties

1. Name uniqueness per business
2. Duration validation (múltiplo de 15, rango [15, 480])
3. Capacity validation (>= 1)
4. Active offerings query (solo isActive=true)
5. Business isolation (multi-tenancy)
6. Event publication (todos los eventos)
7. Deactivation preserves data
8. Update preserves identity

## Implementation Plan

### Phase 1: Domain Layer (Tasks 1-6)

- Value Objects con validaciones
- Domain Events
- Domain Exceptions
- Offering Aggregate
- Repository Interfaces
- Read Model

### Phase 2: Infrastructure Layer (Tasks 7-11)

- TypeORM Model
- Database Migration
- Mappers (Write/Read)
- Write Repository con Optimistic Locking
- Read Repository con queries optimizadas

### Phase 3: Commands (Tasks 12-19)

- CreateOfferingCommand + Handler
- UpdateOfferingCommand + Handler
- DeactivateOfferingCommand + Handler
- ActivateOfferingCommand + Handler

### Phase 4: Queries (Tasks 20-25)

- GetActiveOfferingsQuery + Handler
- GetOfferingByIdQuery + Handler
- GetOfferingsByBusinessQuery + Handler

### Phase 5: WebSocket Integration (Tasks 26-29)

- OnOfferingCreatedHandler
- OnOfferingUpdatedHandler
- OnOfferingDeactivatedHandler
- OnOfferingActivatedHandler

### Phase 6: Module Configuration (Tasks 30-32)

- OfferingModule (NestJS)
- Register in AppModule
- Run Migration

### Phase 7: Conversation BC Integration (Task 33)

- Update ProcessIncomingMessageHandler
- Replace hardcoded offerings with query
- Remove TODOs

### Phase 8: Validation (Tasks 34-37)

- TypeCheck
- Lint
- All Tests
- E2E Tests

### Phase 9: Documentation (Tasks 38-40)

- API Documentation
- Seed Data (optional)
- Final Checkpoint

## Estimated Timeline

- **Total Time:** 4-5 días de desarrollo
- **Tasks:** 51 (todas requeridas)
- **Testing:** Comprehensivo (100% coverage objetivo)

## Dependencies

### Reutiliza de @shared

- `VersionedAggregateRoot` - Base para Aggregate
- `ValueObject` - Base para VOs
- `IUnitOfWork` - Transacciones
- `EventBroadcaster` - WebSocket broadcasting
- `DomainException` - Base para excepciones

### Integra con

- `@nestjs/cqrs` - CommandBus, QueryBus, EventBus
- `@nestjs/typeorm` - Persistencia
- `@shared/infra/websocket` - WebSocket Gateway

## Success Criteria

- ✅ Todos los tests pasan (unit, property, integration, E2E)
- ✅ No errores de TypeScript
- ✅ No warnings de ESLint
- ✅ Cobertura de tests > 70%
- ✅ WebSocket funciona correctamente
- ✅ Conversation BC usa offerings reales (no hardcoded)
- ✅ Multi-tenancy garantizado (aislamiento por businessId)
- ✅ Optimistic Locking funciona (ConcurrencyException)

## Next Steps

1. Revisar y aprobar esta spec
2. Comenzar implementación con Task 1
3. Commit después de cada task
4. Ejecutar tests continuamente
5. Validar con typecheck y lint
6. Integrar con Conversation BC
7. Verificar WebSocket en frontend

## Notes

- **Sin sufijos redundantes:** `offering.ts` no `offering.aggregate.ts`
- **WebSocket en lugar de REST:** Actualizaciones en tiempo real
- **CQRS estricto:** Write y Read separados
- **Testing comprehensivo:** Todas las tareas de testing son requeridas
- **Commits frecuentes:** Después de cada task principal

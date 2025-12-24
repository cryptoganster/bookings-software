# Requirements Document - Remove TODOs and Implement Production Persistence

## Introduction

Este spec documenta la eliminación de todos los TODOs, valores temporales y mocks del sistema, implementando completamente la persistencia de Conversation BC para un entorno de producción funcional.

## Glossary

- **TODO**: Comentario en código que indica funcionalidad pendiente o temporal
- **Mock Repository**: Implementación temporal en memoria que debe ser reemplazada por persistencia real
- **Production Ready**: Código sin mocks, sin valores temporales, completamente funcional con persistencia real
- **ConversationWriteRepository**: Repository real con TypeORM para persistir conversations
- **ConversationFactory**: Factory que carga aggregates desde base de datos
- **Deprecated**: Código marcado para eliminación que debe ser removido

## Requirements

### Requirement 1: ✅ COMPLETADO - Integrar Business BC en Seed Scripts

**User Story:** Como desarrollador, quiero que el seed script cree businesses reales vinculados a users, para que el sistema funcione correctamente en desarrollo y testing.

#### Acceptance Criteria

1. ✅ WHEN el seed script ejecuta THEN el sistema SHALL crear un business real vinculado al user de prueba
2. ✅ WHEN se crea un business THEN el sistema SHALL usar el businessId real en lugar de un UUID temporal
3. ✅ WHEN se ejecuta seedAuth THEN el sistema SHALL retornar solo userId (no businessId temporal)
4. ✅ WHEN se ejecuta el seed completo THEN el sistema SHALL crear business después de account y antes de customer
5. ✅ WHEN se crea un business THEN el sistema SHALL usar datos válidos (WhatsApp E.164, timezone IANA, dirección completa)

**Estado:** Ya implementado en `apps/backend/src/database/seeds/`

### Requirement 2: ✅ COMPLETADO - Login Incluye businessId

**User Story:** Como business owner, quiero que mi businessId esté incluido en el token JWT al hacer login, para que el frontend pueda hacer queries correctamente.

#### Acceptance Criteria

1. ✅ WHEN un BUSINESS_OWNER hace login THEN el sistema SHALL consultar sus businesses usando GetBusinessesByOwnerIdQuery
2. ✅ WHEN se encuentran businesses THEN el sistema SHALL incluir el primer businessId en el payload del JWT
3. ✅ WHEN se genera el token JWT THEN el sistema SHALL incluir businessId en el payload si el user es BUSINESS_OWNER
4. ✅ WHEN el login es exitoso THEN el sistema SHALL retornar el token con businessId incluido
5. ✅ WHEN no se encuentran businesses THEN el sistema SHALL continuar el login sin businessId (no fallar)

**Estado:** Ya implementado en `apps/backend/src/auth/app/commands/login/handler.ts`

### Requirement 3: Implementar ConversationWriteRepository Real

**User Story:** Como desarrollador, quiero implementar el ConversationWriteRepository real con TypeORM, para eliminar el mock y tener persistencia real.

#### Acceptance Criteria

1. WHEN se crea ConversationWriteMapper THEN el sistema SHALL convertir Conversation aggregate a ConversationModel
2. WHEN se implementa ConversationWriteRepository THEN el sistema SHALL usar TypeORM Repository<ConversationModel>
3. WHEN se guarda una conversation THEN el sistema SHALL usar optimistic locking con campo version
4. WHEN se actualiza una conversation THEN el sistema SHALL incrementar version y verificar concurrencia
5. WHEN falla optimistic locking THEN el sistema SHALL lanzar ConcurrencyException

### Requirement 4: Implementar ConversationFactory Real

**User Story:** Como desarrollador, quiero implementar el ConversationFactory real, para cargar conversations desde base de datos en lugar de retornar null.

#### Acceptance Criteria

1. WHEN se carga conversation por ID THEN el sistema SHALL consultar base de datos usando TypeORM
2. WHEN se carga conversation por customer y business THEN el sistema SHALL consultar con WHERE clause correcto
3. WHEN se encuentra conversation THEN el sistema SHALL usar ConversationWriteMapper.toDomain() para reconstruir aggregate
4. WHEN se reconstruye aggregate THEN el sistema SHALL preservar version para optimistic locking
5. WHEN no se encuentra conversation THEN el sistema SHALL retornar null

### Requirement 5: Actualizar ProcessIncomingMessageHandler para Usar Factory

**User Story:** Como desarrollador, quiero que ProcessIncomingMessageHandler use IConversationFactory en lugar del mock repository, para seguir CQRS estricto.

#### Acceptance Criteria

1. WHEN se procesa mensaje THEN el sistema SHALL usar IConversationFactory.loadByCustomerIdAndBusinessId()
2. WHEN se encuentra conversation THEN el sistema SHALL usar el aggregate cargado
3. WHEN no se encuentra conversation THEN el sistema SHALL crear nueva conversation
4. WHEN se guarda conversation THEN el sistema SHALL usar IConversationWriteRepository.save()
5. WHEN se actualiza conversation THEN el sistema SHALL manejar ConcurrencyException con retry logic

### Requirement 6: Eliminar Mock de ConversationWriteRepository

**User Story:** Como desarrollador, quiero eliminar el MockConversationWriteRepository de conversation.module.ts, para que el código esté production-ready.

#### Acceptance Criteria

1. WHEN se revisa conversation.module.ts THEN el sistema SHALL no tener clase MockConversationWriteRepository
2. WHEN se registra IConversationWriteRepository THEN el sistema SHALL usar ConversationWriteRepository real
3. WHEN se revisa el código THEN el sistema SHALL no tener conversationsStore Map global
4. WHEN se revisa el código THEN el sistema SHALL no tener comentarios sobre mock temporal
5. WHEN se ejecutan tests THEN el sistema SHALL usar mocks solo en archivos .spec.ts

### Requirement 7: Eliminar Archivo Deprecated

**User Story:** Como desarrollador, quiero eliminar el archivo deprecated de WhatsAppNumberAlreadyExistsException, para que el código esté limpio.

#### Acceptance Criteria

1. WHEN se revisa business/domain/exceptions THEN el sistema SHALL no tener archivos deprecated
2. WHEN se busca WhatsAppNumberAlreadyExistsException THEN el sistema SHALL usar solo la versión de @shared/kernel
3. WHEN se revisa el código THEN el sistema SHALL no tener barrel exports temporales para backwards compatibility

### Requirement 8: Actualizar Frontend TODOs

**User Story:** Como desarrollador, quiero implementar los modals de create/edit en SchedulesPage, para que el frontend esté completo.

#### Acceptance Criteria

1. WHEN se hace click en "Crear Horario" THEN el sistema SHALL abrir modal de creación
2. WHEN se hace click en "Editar" THEN el sistema SHALL abrir modal de edición con datos pre-cargados
3. WHEN se guarda schedule THEN el sistema SHALL llamar API y actualizar lista
4. WHEN se cancela modal THEN el sistema SHALL cerrar sin guardar cambios
5. WHEN hay error THEN el sistema SHALL mostrar mensaje de error claro

## Out of Scope

- Implementar RolesGuard (mejora futura, no bloqueante para MVP)
- Implementar notificaciones WhatsApp automáticas (responsabilidad de Notification BC)
- Implementar parsing avanzado de botones y ubicaciones (mejora futura)

## Success Criteria

1. ✅ Seed script crea business real vinculado a user (YA IMPLEMENTADO)
2. ✅ Login retorna token con businessId válido (YA IMPLEMENTADO)
3. ✅ ConversationWriteRepository usa TypeORM (no mock)
4. ✅ ConversationFactory carga desde base de datos (no retorna null)
5. ✅ ProcessIncomingMessageHandler usa factory (no repository directo)
6. ✅ No hay mocks en código de producción (solo en tests)
7. ✅ No hay archivos deprecated
8. ✅ Frontend tiene modals funcionales de create/edit schedules
9. ✅ Tests pasan correctamente
10. ✅ Optimistic locking funciona correctamente

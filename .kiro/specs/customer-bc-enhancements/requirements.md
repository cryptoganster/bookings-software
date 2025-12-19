# Requirements Document - Customer BC Enhancements

## Introduction

Este documento define los requisitos para las mejoras post-MVP del Customer BC, incluyendo gestión avanzada de clientes, búsqueda, deduplicación, GDPR compliance, y UI dedicada.

## Glossary

- **Customer Management**: Panel dedicado para administrar clientes
- **Deduplication**: Proceso de identificar y fusionar registros duplicados
- **GDPR**: General Data Protection Regulation - regulación de privacidad de datos
- **Anonymization**: Proceso de eliminar datos personales manteniendo registros históricos
- **Customer Merge**: Fusionar dos registros de customer en uno solo
- **Search Index**: Índice optimizado para búsqueda de texto completo

## Requirements

### Requirement 1: Frontend Customer Entity Layer

**User Story:** Como desarrollador frontend, quiero una capa de entidad dedicada para Customer, para que el código esté organizado según Feature-Sliced Design.

#### Acceptance Criteria

1. WHEN se crea la capa de entidad THEN el Sistema SHALL crear `apps/frontend/src/entities/customer/` con estructura FSD
2. WHEN se define el modelo THEN el Sistema SHALL usar `CustomerReadModel` de shared-types
3. WHEN se crean hooks THEN el Sistema SHALL implementar `useCustomer(id)`, `useCustomers(filters)`, `useCustomersByUserId(userId)`
4. WHEN se crean componentes UI THEN el Sistema SHALL implementar `CustomerCard`, `CustomerAvatar`, `CustomerBadge`
5. WHEN se crean utilidades THEN el Sistema SHALL implementar `formatCustomerName()`, `formatCustomerPhone()`, `getCustomerInitials()`

### Requirement 2: Customer Search and Filtering

**User Story:** Como business owner, quiero buscar clientes por nombre o teléfono, para encontrar rápidamente información de un cliente específico.

#### Acceptance Criteria

1. WHEN se busca por nombre THEN el Sistema SHALL retornar clientes cuyo nombre contenga el texto (case-insensitive)
2. WHEN se busca por teléfono THEN el Sistema SHALL retornar clientes cuyo teléfono contenga los dígitos
3. WHEN se aplican filtros THEN el Sistema SHALL soportar filtros por: anonymous/registered, dateRange
4. WHEN se pagina THEN el Sistema SHALL soportar paginación con page, limit, total
5. WHEN se ordena THEN el Sistema SHALL soportar ordenamiento por: name, createdAt, appointmentCount

### Requirement 3: Advanced Customer Queries

**User Story:** Como sistema, quiero queries avanzadas de clientes, para soportar reportes y analytics.

#### Acceptance Criteria

1. WHEN se consulta GetCustomerStatsQuery THEN el Sistema SHALL retornar: totalCustomers, anonymousCount, registeredCount, newThisMonth
2. WHEN se consulta GetCustomerAppointmentHistoryQuery THEN el Sistema SHALL retornar lista de citas del cliente con detalles
3. WHEN se consulta GetTopCustomersQuery THEN el Sistema SHALL retornar clientes ordenados por número de citas
4. WHEN se consulta SearchCustomersQuery THEN el Sistema SHALL soportar búsqueda de texto completo con paginación
5. WHEN se consulta GetCustomersByDateRangeQuery THEN el Sistema SHALL retornar clientes creados en rango de fechas

### Requirement 4: Customer Deduplication Detection

**User Story:** Como sistema, quiero detectar clientes duplicados, para mantener la calidad de datos.

#### Acceptance Criteria

1. WHEN se ejecuta DetectDuplicateCustomersQuery THEN el Sistema SHALL identificar clientes con mismo nombre y teléfonos similares
2. WHEN se comparan teléfonos THEN el Sistema SHALL normalizar formatos antes de comparar
3. WHEN se comparan nombres THEN el Sistema SHALL usar algoritmo de similitud (Levenshtein distance)
4. WHEN se detectan duplicados THEN el Sistema SHALL retornar pares de (customerId1, customerId2, similarityScore)
5. WHEN se filtra THEN el Sistema SHALL permitir threshold de similitud configurable (default: 0.8)

### Requirement 5: Customer Merge

**User Story:** Como business owner, quiero fusionar clientes duplicados, para consolidar el historial de citas.

#### Acceptance Criteria

1. WHEN se ejecuta MergeCustomersCommand THEN el Sistema SHALL fusionar sourceCustomerId en targetCustomerId
2. WHEN se fusiona THEN el Sistema SHALL actualizar todas las appointments del source al target
3. WHEN se fusiona THEN el Sistema SHALL actualizar todas las conversations del source al target
4. WHEN se fusiona THEN el Sistema SHALL preservar el nombre del target (o source si target no tiene)
5. WHEN se fusiona THEN el Sistema SHALL marcar el source customer como merged (soft delete)
6. WHEN se fusiona THEN el Sistema SHALL publicar evento CustomersMerged con sourceId, targetId
7. WHEN se fusiona THEN el Sistema SHALL usar transacción para garantizar atomicidad

### Requirement 6: GDPR Compliance - Customer Deletion

**User Story:** Como business owner, quiero eliminar datos de un cliente, para cumplir con solicitudes GDPR de derecho al olvido.

#### Acceptance Criteria

1. WHEN se ejecuta DeleteCustomerCommand THEN el Sistema SHALL verificar que el cliente no tenga citas futuras
2. WHEN hay citas futuras THEN el Sistema SHALL lanzar CannotDeleteCustomerWithFutureAppointmentsException
3. WHEN se elimina THEN el Sistema SHALL anonimizar datos: name → null, whatsappPhone → "DELETED\_[timestamp]"
4. WHEN se elimina THEN el Sistema SHALL mantener el registro para integridad referencial
5. WHEN se elimina THEN el Sistema SHALL publicar evento CustomerDeleted con customerId
6. WHEN se elimina THEN el Sistema SHALL desvincular de User si está vinculado

### Requirement 7: GDPR Compliance - Data Export

**User Story:** Como business owner, quiero exportar datos de un cliente, para cumplir con solicitudes GDPR de portabilidad de datos.

#### Acceptance Criteria

1. WHEN se ejecuta ExportCustomerDataQuery THEN el Sistema SHALL retornar JSON con todos los datos del cliente
2. WHEN se exporta THEN el Sistema SHALL incluir: customer info, appointments, conversations, messages
3. WHEN se exporta THEN el Sistema SHALL incluir timestamps de creación y modificación
4. WHEN se exporta THEN el Sistema SHALL excluir datos internos (version, IDs de sistema)
5. WHEN se exporta THEN el Sistema SHALL formatear fechas en ISO 8601

### Requirement 8: Customer Management UI - List Page

**User Story:** Como business owner, quiero ver una lista de mis clientes, para gestionar mi base de clientes.

#### Acceptance Criteria

1. WHEN se accede a /customers THEN el Sistema SHALL mostrar tabla de clientes con: name, phone, type (anonymous/registered), appointmentCount, lastAppointment
2. WHEN se carga la lista THEN el Sistema SHALL paginar con 20 clientes por página
3. WHEN se busca THEN el Sistema SHALL mostrar campo de búsqueda con debounce de 300ms
4. WHEN se filtra THEN el Sistema SHALL mostrar filtros: type, dateRange
5. WHEN se ordena THEN el Sistema SHALL permitir ordenar por columnas clickeables
6. WHEN se hace click en cliente THEN el Sistema SHALL navegar a /customers/:id

### Requirement 9: Customer Management UI - Detail Page

**User Story:** Como business owner, quiero ver detalles de un cliente, para revisar su historial completo.

#### Acceptance Criteria

1. WHEN se accede a /customers/:id THEN el Sistema SHALL mostrar: name, phone, type, createdAt, appointmentCount
2. WHEN se muestra historial THEN el Sistema SHALL listar todas las citas del cliente ordenadas por fecha
3. WHEN se muestra conversaciones THEN el Sistema SHALL listar conversaciones recientes
4. WHEN es anonymous THEN el Sistema SHALL mostrar badge "Cliente Anónimo"
5. WHEN es registered THEN el Sistema SHALL mostrar badge "Cliente Registrado" con email
6. WHEN se hace click en cita THEN el Sistema SHALL navegar a /appointments/:id

### Requirement 10: Customer Management UI - Actions

**User Story:** Como business owner, quiero realizar acciones sobre clientes, para gestionar mi base de datos.

#### Acceptance Criteria

1. WHEN se hace click en "Editar" THEN el Sistema SHALL permitir editar nombre del cliente
2. WHEN se hace click en "Fusionar" THEN el Sistema SHALL mostrar modal para seleccionar cliente target
3. WHEN se hace click en "Eliminar" THEN el Sistema SHALL mostrar confirmación con advertencia GDPR
4. WHEN se hace click en "Exportar Datos" THEN el Sistema SHALL descargar JSON con datos del cliente
5. WHEN se ejecuta acción THEN el Sistema SHALL mostrar loading state y feedback de éxito/error

### Requirement 11: Customer Analytics Widget

**User Story:** Como business owner, quiero ver métricas de clientes en el dashboard, para entender el crecimiento de mi base de clientes.

#### Acceptance Criteria

1. WHEN se muestra widget THEN el Sistema SHALL mostrar: totalCustomers, newThisMonth, registeredPercentage
2. WHEN se muestra gráfico THEN el Sistema SHALL mostrar evolución de clientes por mes (últimos 6 meses)
3. WHEN se hace click en métrica THEN el Sistema SHALL navegar a /customers con filtro aplicado
4. WHEN se carga THEN el Sistema SHALL usar skeleton loading
5. WHEN falla THEN el Sistema SHALL mostrar error state con retry button

### Requirement 12: Customer Deduplication UI

**User Story:** Como business owner, quiero revisar y fusionar clientes duplicados, para mantener mi base de datos limpia.

#### Acceptance Criteria

1. WHEN se accede a /customers/duplicates THEN el Sistema SHALL mostrar lista de pares de clientes duplicados
2. WHEN se muestra par THEN el Sistema SHALL mostrar: ambos clientes lado a lado, similarity score, appointmentCount de cada uno
3. WHEN se hace click en "Fusionar" THEN el Sistema SHALL mostrar modal de confirmación con preview
4. WHEN se confirma fusión THEN el Sistema SHALL ejecutar MergeCustomersCommand y actualizar lista
5. WHEN se hace click en "No son duplicados" THEN el Sistema SHALL marcar el par como revisado y ocultarlo

## Correctness Properties

### Property 1: Search consistency

_For any_ customer in the database, searching by their exact name or phone should return that customer in the results.

**Validates: Requirements 2.1, 2.2**

### Property 2: Deduplication symmetry

_For any_ pair of customers (A, B), if A is detected as duplicate of B, then B should be detected as duplicate of A with the same similarity score.

**Validates: Requirements 4.1, 4.4**

### Property 3: Merge atomicity

_For any_ merge operation, either all related records (appointments, conversations) are updated or none are (transaction rollback).

**Validates: Requirements 5.2, 5.3, 5.7**

### Property 4: GDPR deletion preserves referential integrity

_For any_ deleted customer, all foreign key references should remain valid (customer record exists but anonymized).

**Validates: Requirements 6.3, 6.4**

### Property 5: Export completeness

_For any_ customer, exporting their data should include all appointments and conversations associated with that customer.

**Validates: Requirements 7.2**

### Property 6: Pagination consistency

_For any_ search query, paginating through all pages should return each customer exactly once.

**Validates: Requirements 2.4**

### Property 7: Merge idempotency

_For any_ customer pair, attempting to merge them multiple times should have the same effect as merging once.

**Validates: Requirements 5.1**

## Edge Cases

### Edge Case 1: Merging customer with itself

WHEN MergeCustomersCommand is called with sourceId === targetId THEN the Sistema SHALL reject with CannotMergeCustomerWithItselfException.

### Edge Case 2: Searching with special characters

WHEN search query contains special characters (%, \_, \) THEN the Sistema SHALL escape them properly to prevent SQL injection.

### Edge Case 3: Deleting customer with pending conversations

WHEN DeleteCustomerCommand is called and customer has active conversations THEN the Sistema SHALL complete deletion but mark conversations as archived.

### Edge Case 4: Exporting customer with no data

WHEN ExportCustomerDataQuery is called for customer with no appointments or conversations THEN the Sistema SHALL return valid JSON with empty arrays.

### Edge Case 5: Detecting duplicates with null names

WHEN DetectDuplicateCustomersQuery runs and customers have null names THEN the Sistema SHALL only compare phone numbers.

### Edge Case 6: Merging customers with conflicting data

WHEN merging customers with different names THEN the Sistema SHALL use target customer's name and log the conflict.

### Edge Case 7: Pagination beyond total pages

WHEN requesting page number greater than total pages THEN the Sistema SHALL return empty array with correct total count.

### Edge Case 8: Concurrent merge operations

WHEN two merge operations target the same customer simultaneously THEN the Sistema SHALL use optimistic locking to prevent conflicts.

### Edge Case 9: Searching with empty query

WHEN search query is empty string THEN the Sistema SHALL return all customers (paginated).

### Edge Case 10: Deleting already deleted customer

WHEN DeleteCustomerCommand is called for already anonymized customer THEN the Sistema SHALL be idempotent and succeed.

## Non-Functional Requirements

### Performance

- Customer search response time < 200ms (p95)
- Deduplication detection < 5 seconds for 10,000 customers
- Merge operation < 2 seconds
- Export operation < 3 seconds
- UI list page load < 1 second

### Scalability

- Support 100,000+ customers per business
- Pagination handles large result sets efficiently
- Search uses database indexes

### Security

- Only business owner can access their customers
- GDPR operations require explicit confirmation
- Audit log for all delete/merge operations

### Usability

- Search has debounce to reduce API calls
- Loading states for all async operations
- Clear error messages for failed operations
- Confirmation dialogs for destructive actions

### Compliance

- GDPR deletion completes within 30 days
- Data export includes all personal data
- Audit trail for compliance verification

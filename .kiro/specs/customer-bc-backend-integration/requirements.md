# Requirements Document - Customer BC Backend Integration

## Introduction

Este documento define los requisitos para completar la integración backend-frontend del Customer BC, implementando los endpoints REST faltantes que permitan al frontend interactuar completamente con las funcionalidades de búsqueda, filtrado, deduplicación, merge, eliminación y exportación de clientes.

## Glossary

- **Customer BC**: Customer Bounded Context - Contexto delimitado que gestiona perfiles de clientes
- **REST API**: Representational State Transfer Application Programming Interface
- **DTO**: Data Transfer Object - Objeto de transferencia de datos
- **Controller**: Componente de NestJS que maneja peticiones HTTP
- **Guard**: Middleware de NestJS para autenticación/autorización
- **Pipe**: Middleware de NestJS para validación y transformación
- **Query Handler**: Manejador CQRS para operaciones de lectura
- **Command Handler**: Manejador CQRS para operaciones de escritura
- **Read Model**: Modelo optimizado para lectura (queries)
- **Pagination**: Técnica para dividir resultados en páginas

---

## Requirements

### Requirement 1: Customer Search Endpoint

**User Story:** As a business owner, I want to search and filter customers via REST API, so that the frontend can display a paginated list of customers with search and filter capabilities.

#### Acceptance Criteria

1. WHEN a GET request is made to `/api/customers/search` with query parameters THEN the system SHALL return a paginated list of customers matching the search criteria
2. WHEN searchText parameter is provided THEN the system SHALL search by customer name and phone number (case-insensitive)
3. WHEN type parameter is provided THEN the system SHALL filter by customer type (anonymous or registered)
4. WHEN sortBy and sortOrder parameters are provided THEN the system SHALL sort results accordingly
5. WHEN page and limit parameters are provided THEN the system SHALL return the specified page with the specified number of results
6. WHEN the request is unauthenticated THEN the system SHALL return 401 Unauthorized
7. WHEN the request is authenticated THEN the system SHALL only return customers belonging to the authenticated user's business

---

### Requirement 2: Customer Stats Endpoint

**User Story:** As a business owner, I want to retrieve customer statistics via REST API, so that the frontend can display analytics about my customer base.

#### Acceptance Criteria

1. WHEN a GET request is made to `/api/customers/stats` THEN the system SHALL return aggregated customer statistics
2. WHEN calculating stats THEN the system SHALL include total customers, anonymous count, registered count
3. WHEN calculating stats THEN the system SHALL include new customers this week and this month
4. WHEN calculating stats THEN the system SHALL include top customers by appointment count
5. WHEN the request is unauthenticated THEN the system SHALL return 401 Unauthorized
6. WHEN the request is authenticated THEN the system SHALL only return stats for the authenticated user's business

---

### Requirement 3: Customer Detail Endpoint

**User Story:** As a business owner, I want to retrieve a single customer's details via REST API, so that the frontend can display complete customer information.

#### Acceptance Criteria

1. WHEN a GET request is made to `/api/customers/:id` THEN the system SHALL return the customer's complete information
2. WHEN the customer exists THEN the system SHALL return customer data with status 200
3. WHEN the customer does not exist THEN the system SHALL return 404 Not Found
4. WHEN the customer belongs to a different business THEN the system SHALL return 403 Forbidden
5. WHEN the request is unauthenticated THEN the system SHALL return 401 Unauthorized

---

### Requirement 4: Duplicate Detection Endpoint

**User Story:** As a business owner, I want to detect duplicate customers via REST API, so that the frontend can display potential duplicates for review.

#### Acceptance Criteria

1. WHEN a GET request is made to `/api/customers/duplicates` THEN the system SHALL return a list of potential duplicate customer pairs
2. WHEN detecting duplicates THEN the system SHALL use phone normalization and name similarity algorithms
3. WHEN detecting duplicates THEN the system SHALL include similarity score and reasons for each pair
4. WHEN threshold parameter is provided THEN the system SHALL only return pairs with similarity >= threshold
5. WHEN the request is unauthenticated THEN the system SHALL return 401 Unauthorized
6. WHEN the request is authenticated THEN the system SHALL only detect duplicates within the authenticated user's business

---

### Requirement 5: Customer Merge Endpoint

**User Story:** As a business owner, I want to merge duplicate customers via REST API, so that the frontend can consolidate customer records.

#### Acceptance Criteria

1. WHEN a POST request is made to `/api/customers/merge` with sourceCustomerId and targetCustomerId THEN the system SHALL merge the customers
2. WHEN merging customers THEN the system SHALL transfer all appointments from source to target
3. WHEN merging customers THEN the system SHALL transfer all conversations from source to target
4. WHEN merging customers THEN the system SHALL mark source customer as merged (soft delete)
5. WHEN source and target are the same THEN the system SHALL return 400 Bad Request
6. WHEN customers belong to different businesses THEN the system SHALL return 400 Bad Request
7. WHEN the request is unauthenticated THEN the system SHALL return 401 Unauthorized
8. WHEN merge is successful THEN the system SHALL return 200 OK with success message

---

### Requirement 6: Customer Delete Endpoint

**User Story:** As a business owner, I want to delete (anonymize) a customer via REST API, so that the frontend can comply with GDPR data deletion requests.

#### Acceptance Criteria

1. WHEN a DELETE request is made to `/api/customers/:id` THEN the system SHALL anonymize the customer's personal data
2. WHEN deleting a customer THEN the system SHALL set name to null and phone to "+999{timestamp}"
3. WHEN the customer has future appointments THEN the system SHALL return 400 Bad Request
4. WHEN the customer is linked to a User THEN the system SHALL unlink the customer
5. WHEN deletion is successful THEN the system SHALL publish CustomerDeleted event
6. WHEN the request is unauthenticated THEN the system SHALL return 401 Unauthorized
7. WHEN the customer belongs to a different business THEN the system SHALL return 403 Forbidden

---

### Requirement 7: Customer Data Export Endpoint

**User Story:** As a business owner, I want to export a customer's complete data via REST API, so that the frontend can provide GDPR-compliant data portability.

#### Acceptance Criteria

1. WHEN a GET request is made to `/api/customers/:id/export` THEN the system SHALL return all customer data in JSON format
2. WHEN exporting data THEN the system SHALL include customer profile, appointments, and conversations
3. WHEN exporting data THEN the system SHALL format dates in ISO 8601
4. WHEN exporting data THEN the system SHALL exclude internal system fields (version, IDs)
5. WHEN the customer does not exist THEN the system SHALL return 404 Not Found
6. WHEN the request is unauthenticated THEN the system SHALL return 401 Unauthorized
7. WHEN the customer belongs to a different business THEN the system SHALL return 403 Forbidden

---

### Requirement 8: Customers by User ID Endpoint

**User Story:** As a registered customer, I want to retrieve my customer profiles via REST API, so that the frontend can display my profiles across different businesses (marketplace support).

#### Acceptance Criteria

1. WHEN a GET request is made to `/api/customers/by-user/:userId` THEN the system SHALL return all customer profiles linked to that user
2. WHEN the user has no customer profiles THEN the system SHALL return an empty array
3. WHEN the request is unauthenticated THEN the system SHALL return 401 Unauthorized
4. WHEN requesting another user's profiles THEN the system SHALL return 403 Forbidden (unless admin)

---

### Requirement 9: Authentication and Authorization

**User Story:** As a system administrator, I want all customer endpoints to be protected, so that only authenticated users can access their own business data.

#### Acceptance Criteria

1. WHEN any customer endpoint is called without authentication THEN the system SHALL return 401 Unauthorized
2. WHEN a user tries to access another business's customers THEN the system SHALL return 403 Forbidden
3. WHEN a user accesses their own business's customers THEN the system SHALL return the requested data
4. WHEN using JWT authentication THEN the system SHALL extract businessId from the token
5. WHEN the JWT token is invalid or expired THEN the system SHALL return 401 Unauthorized

---

### Requirement 10: Input Validation

**User Story:** As a developer, I want all endpoint inputs to be validated, so that invalid data is rejected before reaching the application layer.

#### Acceptance Criteria

1. WHEN invalid query parameters are provided THEN the system SHALL return 400 Bad Request with validation errors
2. WHEN invalid UUIDs are provided THEN the system SHALL return 400 Bad Request
3. WHEN required fields are missing THEN the system SHALL return 400 Bad Request
4. WHEN pagination parameters are out of range THEN the system SHALL return 400 Bad Request
5. WHEN validation fails THEN the system SHALL return descriptive error messages

---

### Requirement 11: Error Handling

**User Story:** As a frontend developer, I want consistent error responses, so that I can handle errors appropriately in the UI.

#### Acceptance Criteria

1. WHEN an error occurs THEN the system SHALL return a consistent error response format
2. WHEN a domain exception occurs THEN the system SHALL map it to the appropriate HTTP status code
3. WHEN a validation error occurs THEN the system SHALL return 400 with field-level errors
4. WHEN a resource is not found THEN the system SHALL return 404 with a descriptive message
5. WHEN an internal error occurs THEN the system SHALL return 500 and log the error

---

### Requirement 12: Performance

**User Story:** As a business owner, I want fast API responses, so that the frontend provides a smooth user experience.

#### Acceptance Criteria

1. WHEN searching customers THEN the system SHALL respond in less than 200ms (p95)
2. WHEN retrieving customer stats THEN the system SHALL respond in less than 300ms (p95)
3. WHEN detecting duplicates THEN the system SHALL respond in less than 2 seconds for up to 1000 customers
4. WHEN merging customers THEN the system SHALL complete in less than 2 seconds
5. WHEN exporting customer data THEN the system SHALL respond in less than 3 seconds

---

## Non-Functional Requirements

### Security

- All endpoints must use JWT authentication
- All endpoints must validate business ownership
- SQL injection prevention in search queries
- Rate limiting on all endpoints (100 requests/minute per user)

### Scalability

- Support for 1000+ customers per business
- Efficient pagination for large result sets
- Database indexes on search fields

### Maintainability

- RESTful API design principles
- Consistent error response format
- OpenAPI/Swagger documentation
- Comprehensive logging

### Testing

- Unit tests for all DTOs and validation
- Integration tests for all endpoints
- E2E tests for critical flows
- Property-based tests for search and pagination

---

## API Contract Summary

| Endpoint                         | Method | Auth | Description                 |
| -------------------------------- | ------ | ---- | --------------------------- |
| `/api/customers/search`          | GET    | ✅   | Search and filter customers |
| `/api/customers/stats`           | GET    | ✅   | Get customer statistics     |
| `/api/customers/:id`             | GET    | ✅   | Get customer details        |
| `/api/customers/duplicates`      | GET    | ✅   | Detect duplicate customers  |
| `/api/customers/merge`           | POST   | ✅   | Merge two customers         |
| `/api/customers/:id`             | DELETE | ✅   | Delete (anonymize) customer |
| `/api/customers/:id/export`      | GET    | ✅   | Export customer data        |
| `/api/customers/by-user/:userId` | GET    | ✅   | Get customers by user ID    |

---

## Dependencies

- NestJS v10.x
- @nestjs/cqrs (CommandBus, QueryBus)
- class-validator v0.14.x
- class-transformer v0.5.x
- JWT authentication (existing)
- Customer BC domain layer (existing)
- Customer BC application layer (existing)

---

## Seed Data Requirements

### Requirement 13: Comprehensive Test Data

**User Story:** As a developer, I want comprehensive seed data for testing, so that I can validate all customer scenarios and edge cases.

#### Acceptance Criteria

1. WHEN seeds are executed THEN the system SHALL create at least 20 customers with diverse characteristics
2. WHEN seeds are executed THEN the system SHALL include customers with various name patterns (short, long, special characters, null)
3. WHEN seeds are executed THEN the system SHALL include customers with various phone patterns (different country codes, formats)
4. WHEN seeds are executed THEN the system SHALL include both anonymous (userId=null) and registered (userId!=null) customers
5. WHEN seeds are executed THEN the system SHALL include customers with different appointment counts (0, 1, 5, 10+)
6. WHEN seeds are executed THEN the system SHALL include potential duplicate pairs for testing deduplication
7. WHEN seeds are executed THEN the system SHALL include customers with merged_into set (soft deleted)
8. WHEN seeds are executed THEN the system SHALL include customers created at different dates for time-based filtering

---

## Database Verification Requirements

### Requirement 14: Docker Container Verification

**User Story:** As a developer, I want to verify seed data in the Docker database, so that I can ensure data integrity and correctness.

#### Acceptance Criteria

1. WHEN connecting to Docker container THEN the system SHALL allow psql access with correct credentials
2. WHEN querying customers table THEN the system SHALL return all seeded customers
3. WHEN querying with filters THEN the system SHALL return correct subsets (anonymous, registered, merged)
4. WHEN checking indexes THEN the system SHALL show all required indexes exist
5. WHEN checking foreign keys THEN the system SHALL show referential integrity is maintained
6. WHEN checking constraints THEN the system SHALL show unique constraints are enforced

---

## References

- `.kiro/specs/customer-bc/` - Customer BC MVP implementation (Phase 1-10)
- `.kiro/specs/customer-bc-enhancements/` - Customer BC enhancements (Phase 1-7)
- `.kiro/specs/customer-bc-backend-integration/` - This spec (REST API integration)
- `.kiro/steering/user-customer-businessowner-architecture.md` - Identity architecture
- `.kiro/steering/nestjs-patterns.md` - NestJS best practices
- `.kiro/steering/architecture.md` - System architecture
- `.kiro/steering/clean-code.md` - Code quality standards
- `apps/backend/src/database/seeds/customer.seed.ts` - Current seed implementation

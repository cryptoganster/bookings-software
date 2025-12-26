# Requirements Document - Fix Customer E2E Tests

## Introduction

Los tests E2E del módulo Customer están fallando porque `ProcessIncomingMessageHandler` requiere que existan offerings activos en la base de datos antes de procesar cualquier mensaje de WhatsApp. Los tests actuales no están configurando correctamente el estado inicial de la base de datos.

## Glossary

- **E2E Test**: End-to-End test que valida flujos completos del sistema
- **ProcessIncomingMessageHandler**: Handler que procesa mensajes entrantes de WhatsApp
- **Offering**: Servicio ofrecido por un negocio
- **Customer**: Cliente que interactúa vía WhatsApp
- **Test Setup**: Configuración inicial de datos para tests

## Requirements

### Requirement 1: Test Data Setup

**User Story:** Como desarrollador, quiero que los tests E2E configuren correctamente los datos iniciales, para que los flujos de conversación funcionen correctamente.

#### Acceptance Criteria

1. WHEN un test E2E ejecuta ProcessIncomingMessageCommand THEN el sistema SHALL tener al menos un offering activo en la base de datos
2. WHEN un test crea un offering THEN el offering SHALL estar asociado al businessId correcto
3. WHEN un test crea capacidad THEN la capacidad SHALL estar asociada al offeringId correcto
4. WHEN un test limpia la base de datos THEN todos los datos relacionados SHALL ser eliminados en el orden correcto

### Requirement 2: Error Handling in Tests

**User Story:** Como desarrollador, quiero que los tests manejen errores de manera clara, para que pueda identificar rápidamente qué está fallando.

#### Acceptance Criteria

1. WHEN ProcessIncomingMessageHandler falla THEN el error SHALL indicar claramente qué paso del flujo falló
2. WHEN no hay offerings disponibles THEN el sistema SHALL enviar un mensaje informativo al cliente
3. WHEN un test falla THEN el mensaje de error SHALL incluir el contexto relevante (businessId, customerId, etc.)

### Requirement 3: Test Isolation

**User Story:** Como desarrollador, quiero que cada test sea independiente, para que los tests no se afecten entre sí.

#### Acceptance Criteria

1. WHEN un test termina THEN todos los datos creados por ese test SHALL ser limpiados
2. WHEN un test inicia THEN la base de datos SHALL estar en un estado limpio
3. WHEN múltiples tests se ejecutan THEN cada test SHALL usar IDs únicos para evitar colisiones

### Requirement 4: Mock WhatsApp Client

**User Story:** Como desarrollador, quiero que el cliente de WhatsApp esté correctamente mockeado, para que los tests no dependan de servicios externos.

#### Acceptance Criteria

1. WHEN un test ejecuta THEN el mock de WhatsApp client SHALL capturar todos los mensajes enviados
2. WHEN el sistema envía botones interactivos THEN el mock SHALL registrar los botones correctamente
3. WHEN un test verifica mensajes enviados THEN el mock SHALL proporcionar acceso a todos los mensajes capturados

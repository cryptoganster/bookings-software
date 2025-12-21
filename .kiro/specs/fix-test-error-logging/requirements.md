# Requirements Document - Fix Test Error Logging

## Introduction

Los tests de event handlers están generando logs de ERROR en la salida de tests, lo cual es confuso y hace parecer que hay errores reales cuando en realidad son parte del comportamiento esperado del test.

## Glossary

- **Event Handler**: Componente que escucha y procesa eventos de dominio
- **Logger**: Servicio de NestJS para logging
- **Test Spy**: Mock de Jest para interceptar llamadas a métodos
- **Silent Logger**: Logger que no produce output durante tests

## Requirements

### Requirement 1: Silenciar Logger en Tests

**User Story:** Como desarrollador, quiero que los tests no muestren logs de ERROR esperados, para que la salida de tests sea limpia y solo muestre errores reales.

#### Acceptance Criteria

1. WHEN un test verifica el manejo de errores THEN el logger NO debe imprimir en la consola
2. WHEN un test usa spies en el logger THEN debe poder verificar que se llamaron los métodos correctos
3. WHEN los tests terminan THEN la salida debe estar limpia sin logs de ERROR esperados
4. WHEN hay un error real en el test THEN debe ser visible en la salida

### Requirement 2: Mantener Verificación de Logging

**User Story:** Como desarrollador, quiero seguir verificando que el handler loguea correctamente, sin que esos logs aparezcan en la salida.

#### Acceptance Criteria

1. WHEN un test verifica logging THEN debe usar spies de Jest
2. WHEN se verifica un log de error THEN el spy debe capturar la llamada sin imprimir
3. WHEN se verifica un log de info THEN el spy debe capturar la llamada sin imprimir
4. WHEN el test termina THEN todas las verificaciones de logging deben pasar

### Requirement 3: Aplicar a Todos los Tests de Event Handlers

**User Story:** Como desarrollador, quiero que todos los tests de event handlers tengan logging silenciado, para consistencia.

#### Acceptance Criteria

1. WHEN se ejecutan tests de `OnCustomerLinkedToUserHandler` THEN no debe haber logs en consola
2. WHEN se ejecutan tests de `OnUserRegisteredHandler` THEN no debe haber logs en consola
3. WHEN se ejecutan otros tests de event handlers THEN no debe haber logs en consola
4. WHEN se ejecuta toda la suite de tests THEN la salida debe estar limpia

## Non-Functional Requirements

- Los tests deben seguir pasando después del cambio
- No debe afectar el logging en producción
- Debe ser fácil de mantener
- Debe seguir las mejores prácticas de testing de NestJS

# Requirements Document - Offering Bounded Context

## Introduction

El Bounded Context **Offering** gestiona los servicios que un negocio ofrece a sus clientes. Un offering representa un servicio específico (ej: "Corte de Pelo", "Tinte", "Consulta Médica") con sus características como duración, capacidad máxima por slot, y límites diarios.

Este BC es fundamental para el sistema ya que:

- Define qué servicios puede reservar un cliente
- Establece las restricciones de capacidad y duración
- Se integra con Availability (Capacity) para gestionar disponibilidad
- Se usa en Conversation para mostrar opciones al cliente
- Se referencia en Booking para crear appointments

## Glossary

- **Offering**: Servicio que ofrece un negocio (ej: "Corte de Pelo", "Consulta Médica")
- **Business**: Negocio que ofrece servicios
- **Duration**: Duración del servicio en minutos
- **MaxCapacityPerSlot**: Número máximo de clientes que pueden reservar el mismo horario
- **MaxDailyCapacity**: Límite opcional de servicios por día
- **Active Status**: Estado que indica si un offering está disponible para reservas

## Requirements

### Requirement 1

**User Story:** Como dueño de negocio, quiero crear servicios (offerings) con sus características, para que mis clientes puedan reservarlos.

#### Acceptance Criteria

1. WHEN un dueño de negocio crea un offering THEN el sistema SHALL validar que el nombre tenga al menos 3 caracteres
2. WHEN un dueño de negocio crea un offering THEN el sistema SHALL validar que la duración sea múltiplo de 15 minutos y mínimo 15 minutos
3. WHEN un dueño de negocio crea un offering THEN el sistema SHALL validar que maxCapacityPerSlot sea al menos 1
4. WHEN un dueño de negocio crea un offering THEN el sistema SHALL crear el offering con estado activo por defecto
5. WHEN un offering es creado THEN el sistema SHALL publicar un evento OfferingCreated

### Requirement 2

**User Story:** Como dueño de negocio, quiero actualizar las características de mis servicios, para ajustarlos a las necesidades del negocio.

#### Acceptance Criteria

1. WHEN un dueño de negocio actualiza un offering THEN el sistema SHALL validar que el offering exista
2. WHEN un dueño de negocio actualiza un offering THEN el sistema SHALL aplicar las mismas validaciones que en creación
3. WHEN un offering es actualizado THEN el sistema SHALL publicar un evento OfferingUpdated
4. WHEN un offering es actualizado THEN el sistema SHALL mantener su ID y businessId sin cambios

### Requirement 3

**User Story:** Como dueño de negocio, quiero desactivar servicios temporalmente, para que no estén disponibles para reservas sin eliminarlos.

#### Acceptance Criteria

1. WHEN un dueño de negocio desactiva un offering THEN el sistema SHALL cambiar su estado a inactivo
2. WHEN un offering es desactivado THEN el sistema SHALL publicar un evento OfferingDeactivated
3. WHEN un offering está inactivo THEN el sistema SHALL excluirlo de las consultas de offerings activos
4. WHEN un dueño de negocio reactiva un offering THEN el sistema SHALL cambiar su estado a activo

### Requirement 4

**User Story:** Como sistema, necesito consultar offerings activos de un negocio, para mostrarlos en el flujo conversacional de WhatsApp.

#### Acceptance Criteria

1. WHEN el sistema consulta offerings activos THEN el sistema SHALL retornar solo offerings con isActive=true
2. WHEN el sistema consulta offerings activos THEN el sistema SHALL ordenarlos alfabéticamente por nombre
3. WHEN un negocio no tiene offerings activos THEN el sistema SHALL retornar una lista vacía
4. WHEN el sistema consulta offerings por businessId THEN el sistema SHALL retornar solo offerings de ese negocio

### Requirement 5

**User Story:** Como sistema, necesito consultar un offering específico por ID, para validar reservas y mostrar información detallada.

#### Acceptance Criteria

1. WHEN el sistema consulta un offering por ID THEN el sistema SHALL retornar el offering si existe
2. WHEN el sistema consulta un offering inexistente THEN el sistema SHALL retornar null
3. WHEN el sistema consulta un offering THEN el sistema SHALL incluir todos sus atributos (nombre, duración, capacidades, estado)

### Requirement 6

**User Story:** Como sistema, necesito validar que un offering pertenece a un negocio específico, para garantizar aislamiento multi-tenant.

#### Acceptance Criteria

1. WHEN el sistema valida un offering THEN el sistema SHALL verificar que el businessId coincida
2. WHEN un offering no pertenece al negocio THEN el sistema SHALL lanzar una excepción OfferingNotFoundForBusinessException
3. WHEN se crea un offering THEN el sistema SHALL asociarlo permanentemente al businessId proporcionado

### Requirement 7

**User Story:** Como sistema, necesito garantizar que los nombres de offerings sean únicos por negocio, para evitar confusión.

#### Acceptance Criteria

1. WHEN se crea un offering THEN el sistema SHALL verificar que no exista otro offering con el mismo nombre en ese negocio
2. WHEN se actualiza un offering THEN el sistema SHALL verificar unicidad del nombre excluyendo el offering actual
3. WHEN se intenta crear un offering duplicado THEN el sistema SHALL lanzar DuplicateOfferingNameException

### Requirement 8

**User Story:** Como sistema, necesito integrar offerings con el módulo de disponibilidad (Capacity), para gestionar slots disponibles.

#### Acceptance Criteria

1. WHEN se crea un offering THEN el sistema SHALL permitir que Capacity referencie su ID
2. WHEN se consulta disponibilidad THEN el sistema SHALL usar el offeringId para filtrar capacidades
3. WHEN un offering es desactivado THEN el sistema SHALL mantener las capacidades existentes pero no permitir nuevas reservas

### Requirement 9

**User Story:** Como sistema, necesito exponer offerings vía WebSocket, para que el frontend reciba actualizaciones en tiempo real.

#### Acceptance Criteria

1. WHEN un offering es creado THEN el sistema SHALL emitir evento offering:created vía WebSocket
2. WHEN un offering es actualizado THEN el sistema SHALL emitir evento offering:updated vía WebSocket
3. WHEN un offering es desactivado THEN el sistema SHALL emitir evento offering:deactivated vía WebSocket
4. WHEN un cliente se conecta THEN el sistema SHALL permitir suscripción al room offerings:{businessId}

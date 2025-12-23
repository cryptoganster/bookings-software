# Requirements Document - Availability BC Backend

## Introduction

El Bounded Context de Availability es responsable de gestionar los horarios de atención, bloqueos de fechas y capacidad de slots para los servicios ofrecidos por los negocios. Este BC es crítico para el sistema de reservas ya que determina cuándo y cuántos appointments pueden ser creados.

## Glossary

- **System**: Backend del sistema de reservas multi-tenant
- **Business**: Negocio que ofrece servicios y gestiona su disponibilidad
- **Schedule**: Horario de atención configurado por día de semana
- **Blockout**: Bloqueo de fechas específicas (vacaciones, festivos, etc.)
- **Capacity**: Límite de slots disponibles para un offering en una fecha específica
- **Offering**: Servicio ofrecido por el negocio
- **Slot**: Espacio de tiempo disponible para una reserva
- **Time Slot**: Horario específico dentro de un día (ej: 10:00 AM)

## Requirements

### Requirement 1: Schedule Management

**User Story:** As a business owner, I want to configure my business hours by day of week, so that customers can only book appointments during my operating hours.

#### Acceptance Criteria

1. WHEN a business owner creates a schedule, THE System SHALL validate that start time is before end time
2. WHEN a business owner creates a schedule, THE System SHALL validate that day of week is between 0 and 6
3. WHEN a business owner creates a schedule, THE System SHALL store the schedule with business ID and day of week
4. WHEN a business owner updates a schedule, THE System SHALL validate the new time range
5. WHEN a business owner deletes a schedule, THE System SHALL remove it from the system
6. WHEN querying schedules, THE System SHALL return all schedules for the specified business

### Requirement 2: Blockout Management

**User Story:** As a business owner, I want to block specific dates (vacations, holidays), so that customers cannot book appointments on those dates.

#### Acceptance Criteria

1. WHEN a business owner creates a blockout, THE System SHALL validate that start date is not in the past
2. WHEN a business owner creates a blockout, THE System SHALL validate that end date is after or equal to start date
3. WHEN a business owner creates a blockout, THE System SHALL store the blockout with business ID and date range
4. WHEN a business owner removes a blockout, THE System SHALL delete it from the system
5. WHEN querying blockouts, THE System SHALL return all blockouts for the specified business

### Requirement 3: Capacity Management

**User Story:** As a business owner, I want to set capacity limits for my services, so that I don't get overbooked.

#### Acceptance Criteria

1. WHEN setting capacity for an offering, THE System SHALL validate that total slots is greater than zero
2. WHEN setting capacity for a past date, THE System SHALL reject the operation
3. WHEN updating capacity, THE System SHALL validate that new capacity is not less than already booked slots
4. WHEN a slot is booked, THE System SHALL decrement available slots and increment booked slots
5. WHEN a slot is released, THE System SHALL increment available slots and decrement booked slots
6. WHEN capacity reaches zero, THE System SHALL prevent further bookings

### Requirement 4: Availability Queries

**User Story:** As a customer, I want to see available dates and time slots, so that I can choose when to book my appointment.

#### Acceptance Criteria

1. WHEN querying available dates, THE System SHALL return only dates within business hours
2. WHEN querying available dates, THE System SHALL exclude blocked dates
3. WHEN querying available dates, THE System SHALL exclude dates with zero capacity
4. WHEN querying available time slots, THE System SHALL return slots based on offering duration
5. WHEN querying available time slots, THE System SHALL respect business hours for that day
6. WHEN querying available time slots, THE System SHALL exclude blocked dates

### Requirement 5: Concurrency Control

**User Story:** As a system, I want to handle concurrent bookings safely, so that capacity limits are never exceeded.

#### Acceptance Criteria

1. WHEN two users book the same slot simultaneously, THE System SHALL use optimistic locking to prevent double booking
2. WHEN a capacity update conflicts with another transaction, THE System SHALL retry the operation
3. WHEN maximum retries are reached, THE System SHALL return a clear error message
4. WHEN a slot is booked, THE System SHALL increment the version number
5. WHEN a slot is released, THE System SHALL increment the version number

### Requirement 6: Data Integrity

**User Story:** As a system, I want to maintain data integrity, so that the availability data is always consistent.

#### Acceptance Criteria

1. WHEN creating a schedule, THE System SHALL ensure no duplicate schedules exist for the same business and day
2. WHEN creating capacity, THE System SHALL ensure offering exists
3. WHEN booking a slot, THE System SHALL ensure capacity exists for that date
4. WHEN releasing a slot, THE System SHALL ensure booked slots is greater than zero
5. WHEN updating capacity, THE System SHALL ensure total slots is not less than booked slots

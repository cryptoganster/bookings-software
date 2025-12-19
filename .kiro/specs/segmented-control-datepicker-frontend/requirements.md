# Requirements Document

## Introduction

Este documento define los requisitos para mejorar el componente de filtros de fecha en la página de Appointments, agregando presets rápidos (Hoy, Esta Semana, Este Mes, Personalizado) mediante un SegmentedControl de Mantine, mejorando significativamente la experiencia de usuario al reducir la fricción para filtrar citas por períodos comunes.

## Glossary

- **SegmentedControl**: Componente de Mantine que permite seleccionar una opción de un conjunto de opciones mutuamente excluyentes
- **DateRangePreset**: Tipo de preset de rango de fechas (today, week, month, custom)
- **DatePickerInput**: Componente de Mantine para seleccionar rangos de fechas
- **AppointmentFilters**: Store de Zustand que mantiene el estado de los filtros de appointments
- **Custom Range**: Rango de fechas personalizado seleccionado manualmente por el usuario

## Requirements

### Requirement 1

**User Story:** Como usuario del panel de administración, quiero filtrar citas por períodos predefinidos (Hoy, Esta Semana, Este Mes), para poder acceder rápidamente a las citas más relevantes sin tener que seleccionar fechas manualmente.

#### Acceptance Criteria

1. WHEN el usuario accede a la página de Appointments THEN el sistema SHALL mostrar un SegmentedControl con las opciones: "Hoy", "Esta Semana", "Este Mes", "Personalizado"
2. WHEN el usuario selecciona "Hoy" THEN el sistema SHALL filtrar las citas mostrando solo las del día actual
3. WHEN el usuario selecciona "Esta Semana" THEN el sistema SHALL filtrar las citas mostrando solo las de la semana actual (lunes a domingo)
4. WHEN el usuario selecciona "Este Mes" THEN el sistema SHALL filtrar las citas mostrando solo las del mes actual
5. WHEN el usuario selecciona "Personalizado" THEN el sistema SHALL mostrar el DatePickerInput para selección manual de rango

### Requirement 2

**User Story:** Como usuario, quiero que el filtro de fecha personalizado solo aparezca cuando lo necesito, para mantener la interfaz limpia y enfocada en las opciones más comunes.

#### Acceptance Criteria

1. WHEN el preset seleccionado es "Hoy", "Esta Semana" o "Este Mes" THEN el sistema SHALL ocultar el DatePickerInput
2. WHEN el preset seleccionado es "Personalizado" THEN el sistema SHALL mostrar el DatePickerInput debajo del SegmentedControl
3. WHEN el usuario cambia de "Personalizado" a otro preset THEN el sistema SHALL limpiar el rango de fechas personalizado del store
4. WHEN el usuario selecciona un rango personalizado THEN el sistema SHALL mantener "Personalizado" como preset activo

### Requirement 3

**User Story:** Como usuario, quiero que los presets de fecha calculen correctamente los rangos según la fecha actual, para obtener resultados precisos y actualizados.

#### Acceptance Criteria

1. WHEN se calcula el preset "Hoy" THEN el sistema SHALL retornar un rango desde las 00:00:00 hasta las 23:59:59 del día actual
2. WHEN se calcula el preset "Esta Semana" THEN el sistema SHALL retornar un rango desde el lunes 00:00:00 hasta el domingo 23:59:59 de la semana actual
3. WHEN se calcula el preset "Este Mes" THEN el sistema SHALL retornar un rango desde el día 1 00:00:00 hasta el último día 23:59:59 del mes actual
4. WHEN el usuario cambia de preset THEN el sistema SHALL recalcular el rango de fechas basándose en la fecha actual del momento del cambio

### Requirement 4

**User Story:** Como usuario, quiero que el filtro de fecha se integre correctamente con los otros filtros existentes (estado, offering), para poder combinar múltiples criterios de búsqueda.

#### Acceptance Criteria

1. WHEN el usuario aplica un preset de fecha THEN el sistema SHALL mantener los otros filtros activos (estado, offeringId)
2. WHEN el usuario hace clic en "Limpiar filtros" THEN el sistema SHALL resetear el preset a "Personalizado" y limpiar el rango de fechas
3. WHEN el usuario navega fuera y regresa a la página THEN el sistema SHALL mantener el preset y rango de fechas seleccionados
4. WHEN se aplican filtros THEN el sistema SHALL actualizar la query de appointments con los parámetros correctos

### Requirement 5

**User Story:** Como usuario, quiero que el componente de filtros de fecha sea responsive y accesible, para poder usarlo en diferentes dispositivos y con tecnologías asistivas.

#### Acceptance Criteria

1. WHEN el usuario accede desde mobile THEN el sistema SHALL mostrar el SegmentedControl en orientación vertical si es necesario
2. WHEN el usuario navega con teclado THEN el sistema SHALL permitir cambiar entre presets usando las teclas de flecha
3. WHEN el usuario usa un lector de pantalla THEN el sistema SHALL anunciar correctamente el preset seleccionado y el rango de fechas resultante
4. WHEN el componente se renderiza THEN el sistema SHALL aplicar radius="xl" consistente con el diseño del sistema

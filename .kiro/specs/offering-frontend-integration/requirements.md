# Requirements Document

## Introduction

Este documento define los requisitos para completar la implementación del frontend de gestión de servicios (offerings) en la aplicación. La página de offerings permite a los dueños de negocio crear, editar, activar/desactivar y eliminar los servicios que ofrecen a sus clientes.

## Glossary

- **Offering**: Servicio que ofrece un negocio a sus clientes (ej: "Corte de Pelo", "Manicure")
- **Business_Owner**: Usuario dueño de un negocio que gestiona los servicios
- **Modal**: Ventana emergente para crear o editar un offering
- **Form**: Formulario con campos de entrada para datos del offering
- **Validation**: Proceso de verificar que los datos ingresados cumplen las reglas de negocio
- **Toast_Notification**: Notificación temporal que aparece en pantalla
- **Active_Status**: Estado que indica si un offering está disponible para reservas
- **TanStack_Query**: Librería para gestión de estado del servidor
- **React_Hook_Form**: Librería para gestión de formularios en React
- **Zod**: Librería para validación de esquemas de datos

## Requirements

### Requirement 1: Modal de Creación de Offering

**User Story:** Como dueño de negocio, quiero crear nuevos servicios mediante un modal, para que pueda agregar offerings a mi catálogo de forma rápida y clara.

#### Acceptance Criteria

1. WHEN el usuario hace clic en el botón "Nuevo Servicio", THEN el sistema SHALL mostrar un modal con el título "Crear Servicio"
2. WHEN el modal de creación está abierto, THEN el sistema SHALL mostrar un formulario con los campos: nombre, duración, capacidad por slot y capacidad diaria máxima
3. WHEN el usuario hace clic en "Cancelar", THEN el sistema SHALL cerrar el modal sin guardar cambios
4. WHEN el usuario hace clic en "Guardar" con datos válidos, THEN el sistema SHALL crear el offering y cerrar el modal
5. WHEN el offering se crea exitosamente, THEN el sistema SHALL mostrar una notificación de éxito y actualizar la lista de offerings
6. IF la creación falla, THEN el sistema SHALL mostrar una notificación de error y mantener el modal abierto

### Requirement 2: Modal de Edición de Offering

**User Story:** Como dueño de negocio, quiero editar servicios existentes mediante un modal, para que pueda actualizar la información de mis offerings cuando sea necesario.

#### Acceptance Criteria

1. WHEN el usuario hace clic en "Editar" en el menú de acciones, THEN el sistema SHALL mostrar un modal con el título "Editar Servicio"
2. WHEN el modal de edición está abierto, THEN el sistema SHALL precargar los campos del formulario con los datos actuales del offering
3. WHEN el usuario modifica los datos y hace clic en "Guardar", THEN el sistema SHALL actualizar el offering y cerrar el modal
4. WHEN el offering se actualiza exitosamente, THEN el sistema SHALL mostrar una notificación de éxito y actualizar la tarjeta del offering
5. IF la actualización falla, THEN el sistema SHALL mostrar una notificación de error y mantener el modal abierto
6. WHEN el usuario hace clic en "Cancelar", THEN el sistema SHALL cerrar el modal sin guardar cambios

### Requirement 3: Validación de Formulario

**User Story:** Como dueño de negocio, quiero que el sistema valide los datos que ingreso, para que no pueda crear offerings con información inválida.

#### Acceptance Criteria

1. WHEN el usuario ingresa un nombre con menos de 3 caracteres, THEN el sistema SHALL mostrar el mensaje "El nombre debe tener al menos 3 caracteres"
2. WHEN el usuario ingresa un nombre con más de 100 caracteres, THEN el sistema SHALL mostrar el mensaje "El nombre no puede exceder 100 caracteres"
3. WHEN el usuario ingresa una duración menor a 15 minutos, THEN el sistema SHALL mostrar el mensaje "La duración mínima es 15 minutos"
4. WHEN el usuario ingresa una duración mayor a 480 minutos, THEN el sistema SHALL mostrar el mensaje "La duración máxima es 480 minutos (8 horas)"
5. WHEN el usuario ingresa una capacidad por slot menor a 1, THEN el sistema SHALL mostrar el mensaje "La capacidad mínima es 1"
6. WHEN el usuario ingresa una capacidad por slot mayor a 100, THEN el sistema SHALL mostrar el mensaje "La capacidad máxima es 100"
7. WHEN el usuario ingresa una capacidad diaria menor a 1, THEN el sistema SHALL mostrar el mensaje "La capacidad diaria mínima es 1"
8. WHEN el usuario intenta enviar el formulario con errores de validación, THEN el sistema SHALL prevenir el envío y mostrar todos los mensajes de error

### Requirement 4: Notificaciones de Usuario

**User Story:** Como dueño de negocio, quiero recibir notificaciones claras sobre el resultado de mis acciones, para que sepa si mis operaciones fueron exitosas o fallaron.

#### Acceptance Criteria

1. WHEN un offering se crea exitosamente, THEN el sistema SHALL mostrar una notificación toast verde con el mensaje "Servicio creado exitosamente"
2. WHEN un offering se actualiza exitosamente, THEN el sistema SHALL mostrar una notificación toast verde con el mensaje "Servicio actualizado exitosamente"
3. WHEN un offering se elimina exitosamente, THEN el sistema SHALL mostrar una notificación toast verde con el mensaje "Servicio eliminado exitosamente"
4. WHEN un offering se activa o desactiva exitosamente, THEN el sistema SHALL mostrar una notificación toast verde con el mensaje "Servicio activado/desactivado exitosamente"
5. WHEN una operación falla, THEN el sistema SHALL mostrar una notificación toast roja con el mensaje de error específico
6. WHEN se muestra una notificación de éxito, THEN el sistema SHALL ocultarla automáticamente después de 3 segundos
7. WHEN se muestra una notificación de error, THEN el sistema SHALL ocultarla automáticamente después de 5 segundos

### Requirement 5: Estados de Carga

**User Story:** Como dueño de negocio, quiero ver indicadores de carga durante las operaciones, para que sepa que el sistema está procesando mi solicitud.

#### Acceptance Criteria

1. WHEN el usuario hace clic en "Guardar" en el modal de creación, THEN el sistema SHALL deshabilitar el botón y mostrar un spinner
2. WHEN el usuario hace clic en "Guardar" en el modal de edición, THEN el sistema SHALL deshabilitar el botón y mostrar un spinner
3. WHEN el usuario hace clic en "Eliminar", THEN el sistema SHALL mostrar un diálogo de confirmación antes de proceder
4. WHEN el usuario confirma la eliminación, THEN el sistema SHALL procesar la eliminación sin bloquear la interfaz
5. WHEN una operación está en progreso, THEN el sistema SHALL prevenir que el usuario cierre el modal accidentalmente

### Requirement 6: Integración con API

**User Story:** Como sistema, quiero comunicarme correctamente con el backend, para que las operaciones de offerings se ejecuten de forma confiable.

#### Acceptance Criteria

1. WHEN se crea un offering, THEN el sistema SHALL enviar una petición POST a /api/offerings con los datos del formulario
2. WHEN se actualiza un offering, THEN el sistema SHALL enviar una petición PUT a /api/offerings/:id con los datos del formulario
3. WHEN se elimina un offering, THEN el sistema SHALL enviar una petición DELETE a /api/offerings/:id
4. WHEN se activa o desactiva un offering, THEN el sistema SHALL enviar una petición PATCH a /api/offerings/:id/active
5. WHEN una operación es exitosa, THEN el sistema SHALL invalidar las queries de TanStack Query para actualizar la lista
6. WHEN una operación falla con error 409 (conflicto), THEN el sistema SHALL mostrar el mensaje "Ya existe un servicio con ese nombre"
7. WHEN una operación falla con error 403 (prohibido), THEN el sistema SHALL mostrar el mensaje "No tienes permisos para realizar esta acción"

### Requirement 7: Accesibilidad

**User Story:** Como usuario con necesidades de accesibilidad, quiero poder usar la página de offerings con tecnologías asistivas, para que pueda gestionar mis servicios de forma independiente.

#### Acceptance Criteria

1. WHEN el modal está abierto, THEN el sistema SHALL establecer el atributo role="dialog" y aria-modal="true"
2. WHEN el modal está abierto, THEN el sistema SHALL enfocar automáticamente el primer campo del formulario
3. WHEN el usuario presiona la tecla Escape, THEN el sistema SHALL cerrar el modal abierto
4. WHEN el usuario navega con Tab, THEN el sistema SHALL mantener el foco dentro del modal
5. WHEN un campo tiene un error de validación, THEN el sistema SHALL asociar el mensaje de error con el campo usando aria-describedby
6. WHEN se muestra una notificación, THEN el sistema SHALL anunciarla a los lectores de pantalla usando role="status" y aria-live="polite"

### Requirement 8: Responsividad

**User Story:** Como dueño de negocio, quiero que los modales se vean bien en cualquier dispositivo, para que pueda gestionar mis servicios desde mi teléfono o tablet.

#### Acceptance Criteria

1. WHEN el modal se abre en dispositivos móviles (< 768px), THEN el sistema SHALL mostrar el modal en pantalla completa
2. WHEN el modal se abre en tablets (768px - 1024px), THEN el sistema SHALL mostrar el modal con ancho de 600px centrado
3. WHEN el modal se abre en desktop (> 1024px), THEN el sistema SHALL mostrar el modal con ancho de 600px centrado
4. WHEN el formulario se muestra en móvil, THEN el sistema SHALL apilar los campos verticalmente con espaciado adecuado
5. WHEN los botones se muestran en móvil, THEN el sistema SHALL mostrarlos en columna con ancho completo

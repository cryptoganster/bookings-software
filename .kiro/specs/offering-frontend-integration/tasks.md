# Implementation Plan: Offering Frontend Integration

## Overview

Este plan de implementación completa la funcionalidad CRUD de offerings en el frontend, agregando modales de creación y edición, formularios con validación robusta, y una experiencia de usuario accesible y responsiva.

## Tasks

- [ ] 1. Configurar dependencias y estructura base
  - Instalar dependencias necesarias (react-hook-form, zod, @hookform/resolvers, fast-check)
  - Crear estructura de carpetas para nuevos componentes
  - Configurar exports en index.ts
  - _Requirements: 1.1, 2.1, 3.1_

- [ ] 2. Implementar validación de formulario
  - [ ] 2.1 Crear schema de validación con Zod
    - Definir offeringFormSchema con todas las reglas de validación
    - Exportar tipo OfferingFormData
    - Definir valores por defecto del formulario
    - Crear archivo apps/frontend/src/entities/offering/lib/validation.ts
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

  - [ ] 2.2 Escribir property test para validación
    - **Property 6: Validación previene envío inválido**
    - **Validates: Requirements 3.8**
    - Generar datos inválidos aleatorios con fast-check
    - Verificar que el schema rechaza datos inválidos
    - Verificar que se muestran todos los mensajes de error apropiados

- [ ] 3. Implementar componente OfferingForm
  - [ ] 3.1 Crear componente base con React Hook Form
    - Definir interface OfferingFormProps
    - Configurar useForm con zodResolver
    - Implementar campos: name, durationMinutes, maxCapacityPerSlot, maxDailyCapacity
    - Implementar botones Guardar y Cancelar
    - Crear archivo apps/frontend/src/pages/OfferingsPage/ui/OfferingForm.tsx
    - _Requirements: 1.2, 2.2, 3.1-3.7_

  - [ ] 3.2 Implementar manejo de errores de validación
    - Mostrar mensajes de error debajo de cada campo
    - Aplicar estilos de error (borde rojo)
    - Asociar errores con campos usando aria-describedby
    - _Requirements: 3.1-3.7, 7.5_

  - [ ] 3.3 Implementar estados de carga
    - Deshabilitar campos durante loading
    - Mostrar spinner en botón de guardar
    - Prevenir envío múltiple
    - _Requirements: 5.1, 5.2_

  - [ ] 3.4 Escribir unit tests para OfferingForm
    - Test: Renderiza todos los campos correctamente
    - Test: Muestra errores de validación
    - Test: Llama onSubmit con datos válidos
    - Test: Llama onCancel al hacer clic en cancelar
    - Test: Deshabilita campos durante loading

  - [ ] 3.5 Escribir property test para precarga de datos
    - **Property 4: Edición precarga datos correctamente**
    - **Validates: Requirements 2.2**
    - Generar offerings aleatorios con fast-check
    - Verificar que todos los campos contienen los valores correctos

- [ ] 4. Implementar OfferingCreateModal
  - [ ] 4.1 Crear componente modal de creación
    - Definir interface OfferingCreateModalProps
    - Usar Mantine Modal component
    - Integrar OfferingForm
    - Usar hook useCreateOffering
    - Crear archivo apps/frontend/src/pages/OfferingsPage/ui/OfferingCreateModal.tsx
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [ ] 4.2 Implementar manejo de éxito
    - Mostrar notificación toast verde
    - Cerrar modal automáticamente
    - Invalidar queries de TanStack Query
    - Reset del formulario
    - _Requirements: 1.5, 4.1, 4.6, 6.5_

  - [ ] 4.3 Implementar manejo de errores
    - Mostrar notificación toast roja
    - Mantener modal abierto
    - Preservar datos del formulario
    - Manejar errores específicos (409, 403)
    - _Requirements: 1.6, 4.5, 4.7, 6.6, 6.7_

  - [ ] 4.4 Implementar accesibilidad
    - Establecer role="dialog" y aria-modal="true"
    - Auto-focus en primer campo
    - Cerrar con tecla Escape
    - Implementar focus trap
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [ ] 4.5 Escribir unit tests para OfferingCreateModal
    - Test: Abre y cierra correctamente
    - Test: Crea offering exitosamente
    - Test: Muestra notificación de éxito
    - Test: Maneja errores apropiadamente
    - Test: Cierra con Escape

  - [ ] 4.6 Escribir property test para creación
    - **Property 2: Creación exitosa actualiza la lista**
    - **Validates: Requirements 1.4, 1.5**
    - Generar datos válidos aleatorios
    - Verificar que se crea el offering
    - Verificar que la lista se actualiza

  - [ ] 4.7 Escribir property test para API call
    - **Property 13: API calls son correctas**
    - **Validates: Requirements 6.1**
    - Verificar que se envía POST a /api/offerings
    - Verificar que el payload contiene los datos correctos

- [ ] 5. Implementar OfferingEditModal
  - [ ] 5.1 Crear componente modal de edición
    - Definir interface OfferingEditModalProps
    - Usar Mantine Modal component
    - Integrar OfferingForm con datos precargados
    - Usar hook useUpdateOffering
    - Crear archivo apps/frontend/src/pages/OfferingsPage/ui/OfferingEditModal.tsx
    - _Requirements: 2.1, 2.2, 2.3, 2.6_

  - [ ] 5.2 Implementar manejo de éxito
    - Mostrar notificación toast verde
    - Cerrar modal automáticamente
    - Actualizar caché de TanStack Query
    - _Requirements: 2.4, 4.2, 4.6, 6.5_

  - [ ] 5.3 Implementar manejo de errores
    - Mostrar notificación toast roja
    - Mantener modal abierto
    - Preservar datos del formulario
    - Manejar errores específicos (409, 403, 404)
    - _Requirements: 2.5, 4.5, 4.7, 6.6, 6.7_

  - [ ] 5.4 Implementar accesibilidad
    - Establecer role="dialog" y aria-modal="true"
    - Auto-focus en primer campo
    - Cerrar con tecla Escape
    - Implementar focus trap
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [ ] 5.5 Escribir unit tests para OfferingEditModal
    - Test: Abre con datos precargados
    - Test: Actualiza offering exitosamente
    - Test: Muestra notificación de éxito
    - Test: Maneja errores apropiadamente
    - Test: Cierra con Escape

  - [ ] 5.6 Escribir property test para actualización
    - **Property 5: Actualización exitosa refleja cambios**
    - **Validates: Requirements 2.3, 2.4**
    - Generar modificaciones válidas aleatorias
    - Verificar que se actualiza el offering
    - Verificar que la tarjeta refleja los cambios

  - [ ] 5.7 Escribir property test para API call
    - **Property 13: API calls son correctas**
    - **Validates: Requirements 6.2**
    - Verificar que se envía PUT a /api/offerings/:id
    - Verificar que el payload contiene los datos correctos

- [ ] 6. Actualizar OfferingsPage
  - [ ] 6.1 Agregar estado para modales
    - Agregar useState para isCreateModalOpen
    - Agregar useState para isEditModalOpen
    - Agregar useState para selectedOffering
    - _Requirements: 1.1, 2.1_

  - [ ] 6.2 Conectar botón "Nuevo Servicio"
    - Implementar onClick para abrir modal de creación
    - _Requirements: 1.1_

  - [ ] 6.3 Conectar opción "Editar"
    - Implementar onClick para abrir modal de edición
    - Pasar offering seleccionado al modal
    - _Requirements: 2.1_

  - [ ] 6.4 Mejorar confirmación de eliminación
    - Usar window.confirm con mensaje claro
    - Implementar manejo de confirmación
    - _Requirements: 5.3_

  - [ ] 6.5 Renderizar modales
    - Agregar OfferingCreateModal al final del componente
    - Agregar OfferingEditModal al final del componente
    - Pasar props apropiadas
    - _Requirements: 1.1, 2.1_

  - [ ] 6.6 Escribir integration tests para flujos completos
    - Test: Flujo completo de creación
    - Test: Flujo completo de edición
    - Test: Flujo completo de eliminación
    - Test: Manejo de errores de API

- [ ] 7. Implementar sistema de notificaciones
  - [ ] 7.1 Crear helper para notificaciones
    - Función showSuccessNotification
    - Función showErrorNotification
    - Configurar duración automática (3s éxito, 5s error)
    - Configurar atributos ARIA (role="status", aria-live="polite")
    - _Requirements: 4.1-4.7, 7.6_

  - [ ] 7.2 Escribir property tests para notificaciones
    - **Property 7: Notificaciones de éxito son consistentes**
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.6**
    - Verificar color verde, mensaje correcto, duración 3s
    - **Property 8: Notificaciones de error son consistentes**
    - **Validates: Requirements 4.5, 4.7**
    - Verificar color rojo, mensaje de error, duración 5s

- [ ] 8. Checkpoint - Verificar funcionalidad básica
  - Verificar que se pueden crear offerings
  - Verificar que se pueden editar offerings
  - Verificar que se pueden eliminar offerings
  - Verificar que las validaciones funcionan
  - Verificar que las notificaciones aparecen
  - Preguntar al usuario si hay problemas

- [ ] 9. Implementar mejoras de accesibilidad
  - [ ] 9.1 Agregar ARIA labels a botones
    - Botón "Nuevo Servicio"
    - Botón "Guardar"
    - Botón "Cancelar"
    - Botones de menú de acciones
    - _Requirements: 7.1_

  - [ ] 9.2 Implementar navegación por teclado
    - Tab entre campos
    - Enter para enviar formulario
    - Escape para cerrar modal
    - _Requirements: 7.3_

  - [ ] 9.3 Implementar focus management
    - Auto-focus en primer campo al abrir modal
    - Focus trap dentro del modal
    - Restaurar focus al cerrar modal
    - _Requirements: 7.2, 7.4_

  - [ ] 9.4 Escribir property tests para accesibilidad
    - **Property 15: Modales son accesibles**
    - **Validates: Requirements 7.1, 7.2, 7.3, 7.4**
    - Verificar atributos ARIA
    - Verificar focus management
    - Verificar navegación por teclado
    - **Property 16: Errores de validación son accesibles**
    - **Validates: Requirements 7.5**
    - Verificar aria-describedby en campos con error
    - **Property 17: Notificaciones son anunciadas**
    - **Validates: Requirements 7.6**
    - Verificar role="status" y aria-live="polite"

  - [ ] 9.5 Ejecutar auditoría de accesibilidad con jest-axe
    - Test: OfferingForm no tiene violaciones de accesibilidad
    - Test: OfferingCreateModal no tiene violaciones
    - Test: OfferingEditModal no tiene violaciones

- [ ] 10. Implementar responsividad
  - [ ] 10.1 Configurar breakpoints de modales
    - Mobile: Pantalla completa
    - Tablet/Desktop: 600px centrado
    - _Requirements: 8.1, 8.2, 8.3_

  - [ ] 10.2 Ajustar layout de formulario
    - Mobile: Campos apilados verticalmente
    - Desktop: Campos en columna con labels
    - _Requirements: 8.4_

  - [ ] 10.3 Ajustar botones
    - Mobile: Botones apilados, full-width
    - Desktop: Botones en fila, ancho automático
    - _Requirements: 8.5_

  - [ ] 10.4 Escribir tests de responsividad
    - Test: Modal en mobile es pantalla completa
    - Test: Modal en desktop es 600px
    - Test: Formulario se adapta a mobile
    - Test: Botones se adaptan a mobile

- [ ] 11. Implementar optimizaciones de performance
  - [ ] 11.1 Agregar memoización
    - Memoizar OfferingCard con React.memo
    - Usar useCallback para handlers
    - _Requirements: Performance_

  - [ ] 11.2 Implementar lazy loading
    - Lazy load de modales con React.lazy
    - Suspense boundary apropiado
    - _Requirements: Performance_

  - [ ] 11.3 Configurar TanStack Query
    - staleTime: 5 minutos
    - cacheTime: 10 minutos
    - refetchOnWindowFocus: true
    - _Requirements: Performance_

  - [ ] 11.4 Escribir property tests para cache
    - **Property 14: Cache se invalida después de operaciones**
    - **Validates: Requirements 6.5**
    - Verificar invalidación después de crear
    - Verificar invalidación después de actualizar
    - Verificar invalidación después de eliminar

- [ ] 12. Implementar property tests adicionales
  - [ ] 12.1 Property test: Modal cierra sin guardar
    - **Property 1: Modal cierra sin guardar al cancelar**
    - **Validates: Requirements 1.3, 2.6**
    - Verificar que no se hace llamada a API
    - Verificar que el modal se cierra

  - [ ] 12.2 Property test: Error mantiene modal abierto
    - **Property 3: Error mantiene modal abierto**
    - **Validates: Requirements 1.6, 2.5**
    - Simular error de API
    - Verificar que modal permanece abierto
    - Verificar que datos se preservan

  - [ ] 12.3 Property test: Loading deshabilita interacción
    - **Property 9: Loading deshabilita interacción**
    - **Validates: Requirements 5.1, 5.2**
    - Verificar botón deshabilitado durante loading
    - Verificar spinner visible

  - [ ] 12.4 Property test: Eliminación requiere confirmación
    - **Property 10: Eliminación requiere confirmación**
    - **Validates: Requirements 5.3**
    - Verificar que se muestra window.confirm
    - Verificar que no se elimina sin confirmación

  - [ ] 12.5 Property test: Operaciones no bloquean UI
    - **Property 11: Operaciones no bloquean UI**
    - **Validates: Requirements 5.4**
    - Verificar que operaciones son asíncronas
    - Verificar que UI permanece responsive

  - [ ] 12.6 Property test: Modal previene cierre accidental
    - **Property 12: Modal previene cierre accidental durante operación**
    - **Validates: Requirements 5.5**
    - Verificar que no se puede cerrar durante loading
    - Verificar que botón X está deshabilitado

- [ ] 13. Checkpoint final - Ejecutar todos los tests
  - Ejecutar todos los unit tests
  - Ejecutar todos los property tests
  - Ejecutar todos los integration tests
  - Ejecutar tests de accesibilidad
  - Verificar cobertura > 80%
  - Preguntar al usuario si hay problemas

- [ ] 14. Documentación y limpieza
  - [ ] 14.1 Agregar comentarios JSDoc
    - Documentar props de componentes
    - Documentar funciones helper
    - Documentar tipos y interfaces
    - _Requirements: Documentation_

  - [ ] 14.2 Actualizar README si es necesario
    - Documentar nuevas dependencias
    - Documentar estructura de componentes
    - _Requirements: Documentation_

  - [ ] 14.3 Limpiar código
    - Remover console.logs
    - Remover código comentado
    - Verificar imports no usados
    - Formatear código con Prettier
    - _Requirements: Code Quality_

  - [ ] 14.4 Verificar convenciones de nomenclatura
    - Archivos en kebab-case
    - Componentes en PascalCase
    - Funciones en camelCase
    - _Requirements: Code Quality_

## Notes

- Todas las tareas son requeridas para una implementación completa
- Cada tarea referencia los requisitos específicos que implementa
- Los property tests usan fast-check con mínimo 100 iteraciones
- Los tests de accesibilidad usan jest-axe para auditoría automática
- La cobertura objetivo es > 80% para todos los componentes
- Seguir convenciones de nomenclatura del proyecto (kebab-case para archivos)
- Usar TanStack Query para todas las operaciones de servidor
- Usar Mantine UI para todos los componentes de UI
- Usar React Hook Form + Zod para todos los formularios

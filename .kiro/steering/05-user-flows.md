---
inclusion: manual
---

# User Flows

**Detailed user interaction flows for the booking system**

> **Cross-References:**
>
> - [01-product-requirements.md](./01-product-requirements.md) - Product overview
> - [02-bounded-contexts.md](./02-bounded-contexts.md) - Bounded Context definitions
> - [03-identity-architecture.md](./03-identity-architecture.md) - User/Customer/BusinessOwner architecture
> - [07-business-rules.md](./07-business-rules.md) - Business rules validation

---

# Flujos de Usuario

Este documento describe los flujos de interacción de usuarios con el sistema.

## 1. Flujo: Dueño de Negocio - Registro e Configuración

**Actor:** Dueño de Negocio  
**Canal:** Panel Web

> **📖 Referencia:** Ver [03-identity-architecture.md](./03-identity-architecture.md) sección "Flujo: Registro de Business Owner"

### Pasos

1. Dueño accede al panel web
2. Se registra (email, password, nombre)
   - `RegisterUserCommand(email, password, name, role=BUSINESS_OWNER)`
   - User creado con role=['BUSINESS_OWNER']
3. Event Handler escucha `UserRegistered` con role=BUSINESS_OWNER
   - `CreateBusinessOwnerCommand(userId, subscriptionPlan=FREE)`
   - BusinessOwner creado automáticamente
4. Dueño completa onboarding
   - `CompleteOnboardingCommand(businessOwnerId)`
5. Dueño crea su primer negocio
   - `CreateBusinessCommand(ownerId=userId, businessName, whatsapp, ...)`
   - Business creado vinculado a User
6. Configura información del negocio:
   - Nombre comercial, dirección, zona horaria
   - Número de WhatsApp Business
7. Define horarios de atención (días y horas)
8. Crea offerings (servicios):
   - Nombre del servicio, duración, capacidad
9. Configura bloqueos de fechas (vacaciones, días festivos)
10. Sistema genera webhook URL para WhatsApp Business API

### Eventos de Dominio

- `UserRegistered` (Auth BC)
- `BusinessOwnerCreated` (Account BC)
- `BusinessOwnerOnboardingCompleted` (Account BC)
- `BusinessCreated` (Business BC)
- `BusinessWhatsAppConfigured` (Business BC)
- `OfferingCreated` (Offering BC)
- `ScheduleConfigured` (Availability BC)
- `BlockoutCreated` (Availability BC)

---

## 2. Flujo: Cliente Final - Reservación de Cita vía WhatsApp

**Actor:** Cliente Final  
**Canal:** WhatsApp

### Pasos

1. Cliente envía mensaje al número de WhatsApp del negocio
2. Bot saluda y presenta opciones mediante botones interactivos:

   ```
   ¡Hola! 👋 Bienvenido a [Nombre del Negocio]

   ¿Qué servicio deseas agendar?
   [Corte de Pelo] [Lavado] [Tinte] [Consulta al Admin]
   ```

3. Cliente selecciona un servicio (ej: "Corte de Pelo")
4. Sistema verifica disponibilidad y presenta fechas disponibles:
   ```
   Selecciona una fecha:
   [Lunes 18/12] [Martes 19/12] [Miércoles 20/12]
   ```
5. Cliente selecciona fecha
6. Sistema presenta horarios disponibles:
   ```
   Horarios disponibles para Lunes 18/12:
   [9:00 AM] [10:30 AM] [2:00 PM] [4:00 PM]
   ```
7. Cliente selecciona horario
8. Sistema confirma los datos:

   ```
   Confirma tu cita:
   📅 Lunes 18 de Diciembre
   🕐 10:30 AM
   ✂️ Corte de Pelo

   [Confirmar] [Cambiar]
   ```

9. Cliente confirma
10. Sistema crea la cita y envía confirmación con datos de ubicación

### Eventos de Dominio

- `CustomerIdentified` (Customer BC - customer anónimo creado/identificado)
- `ConversationStarted` (Conversation BC)
- `MessageReceived` (Conversation BC)
- `AppointmentCreated` (Booking BC)
- `ReminderScheduled` (Notification BC)
- `MessageSent` (Conversation BC)

### Nota Importante

El Customer creado es anónimo (userId = null). No tiene acceso al panel web.

---

## 3. Flujo: Cliente Final - Modificar/Cancelar Cita

**Actor:** Cliente Final  
**Canal:** WhatsApp

### Pasos

1. Cliente envía mensaje
2. Bot detecta que tiene citas activas y muestra menú:

   ```
   ¡Hola de nuevo! Tienes una cita:
   📅 Lunes 18/12 - 10:30 AM
   ✂️ Corte de Pelo

   ¿Qué deseas hacer?
   [Nueva Cita] [Modificar Cita] [Cancelar Cita] [Ver Ubicación]
   ```

3. Cliente selecciona "Modificar Cita" o "Cancelar Cita"
4. Si modifica: repite flujo de selección de fecha/hora
5. Si cancela: solicita confirmación y cancela

### Eventos de Dominio

- `AppointmentCancelled`
- `AppointmentModified`
- `ReminderCancelled`

---

## 4. Flujo: Cliente Final - Consulta al Administrador

**Actor:** Cliente Final, Dueño de Negocio  
**Canal:** WhatsApp (Cliente), Panel Web (Admin)

### Pasos

1. Cliente selecciona "Consulta al Admin"
2. Bot solicita que escriba su consulta
3. Cliente escribe su mensaje
4. Sistema marca la conversación como "Pendiente de Admin"
5. Administrador ve notificación en panel web
6. Administrador responde desde panel
7. Sistema envía respuesta al cliente vía WhatsApp

### Eventos de Dominio

- `AdminQueryRequested`
- `AdminResponseSent`

---

## 5. Flujo: Sistema - Envío de Recordatorios

**Actor:** Sistema (automatizado)  
**Canal:** WhatsApp

### Pasos

1. Cron job verifica recordatorios programados
2. Para citas próximas (24 horas antes):

   ```
   🔔 Recordatorio de Cita

   Tienes una cita mañana:
   📅 Lunes 18/12
   🕐 10:30 AM
   ✂️ Corte de Pelo
   📍 [Ubicación del Negocio]

   [Confirmar Asistencia] [Cancelar Cita]
   ```

3. Sistema registra envío del recordatorio

### Eventos de Dominio

- `ReminderSent`

---

## 6. Integraciones Externas

### 6.1 WhatsApp Business API

**Tipo:** API REST + Webhooks  
**Propósito:** Envío y recepción de mensajes

**Funcionalidades Requeridas:**

- Envío de mensajes de texto
- Envío de botones interactivos
- Envío de mensajes con ubicación
- Recepción de mensajes vía webhook (tiempo real)
- Gestión de estado de conversaciones

**Implementación:**

- Interfaz: `src/conversation/domain/interfaces/external/whatsapp-client.interface.ts`
- Implementación: `src/conversation/infra/external/whatsapp-business-api.client.ts`

**Webhook Endpoint:**

```
POST /api/webhooks/whatsapp
```

**Estrategia de Recepción:**

- Webhooks en tiempo real (streaming)
- Evita polling para reducir latencia y recursos
- Validación de firma de webhook para seguridad

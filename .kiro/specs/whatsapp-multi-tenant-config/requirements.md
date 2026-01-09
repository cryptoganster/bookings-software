# Requirements Document - WhatsApp Multi-Tenant Configuration

## Introduction

Sistema de configuración multi-tenant para WhatsApp Business API que permite a cada negocio configurar sus propias credenciales, webhook, y parámetros del bot de manera independiente y segura.

## Glossary

- **Business**: Negocio registrado en la plataforma
- **WhatsApp_Credentials**: Credenciales de WhatsApp Business API (API Key, Phone Number ID, Business Account ID)
- **Webhook_URL**: URL única por negocio para recibir mensajes de WhatsApp
- **Webhook_Token**: Token de verificación para validar webhooks
- **Bot_Configuration**: Configuración del comportamiento del bot (mensajes, flujos, idioma)
- **System**: Sistema de reservas multi-tenant

## Requirements

### Requirement 1: Configuración de Credenciales de WhatsApp

**User Story:** Como dueño de negocio, quiero configurar mis credenciales de WhatsApp Business API, para que mi negocio pueda enviar y recibir mensajes de manera independiente.

#### Acceptance Criteria

1. WHEN un dueño de negocio accede a la configuración de WhatsApp, THE System SHALL mostrar un formulario para ingresar credenciales
2. WHEN un dueño ingresa credenciales válidas (API Key, Phone Number ID, Business Account ID), THE System SHALL validar la conexión con WhatsApp API
3. WHEN las credenciales son válidas, THE System SHALL almacenar las credenciales de forma segura (encriptadas)
4. WHEN las credenciales son inválidas, THE System SHALL mostrar un mensaje de error descriptivo
5. WHEN un negocio ya tiene credenciales configuradas, THE System SHALL permitir actualizarlas
6. THE System SHALL almacenar las credenciales encriptadas en la base de datos
7. THE System SHALL nunca exponer las credenciales completas en respuestas de API (solo mostrar últimos 4 caracteres)

### Requirement 2: Generación de Webhook URL Único

**User Story:** Como dueño de negocio, quiero tener una URL de webhook única para mi negocio, para que WhatsApp pueda enviar mensajes solo a mi instancia.

#### Acceptance Criteria

1. WHEN un negocio configura WhatsApp por primera vez, THE System SHALL generar una URL de webhook única
2. THE Webhook_URL SHALL incluir el businessId como identificador único
3. THE Webhook_URL SHALL seguir el formato: `https://api.domain.com/webhooks/whatsapp/{businessId}`
4. WHEN se genera un webhook URL, THE System SHALL generar también un Webhook_Token único para verificación
5. THE System SHALL mostrar la URL de webhook y el token al dueño del negocio
6. THE System SHALL permitir regenerar el Webhook_Token si es necesario
7. WHEN se regenera el token, THE System SHALL invalidar el token anterior

### Requirement 3: Validación de Webhooks Entrantes

**User Story:** Como sistema, quiero validar que los webhooks entrantes provienen de WhatsApp, para garantizar la seguridad de las comunicaciones.

#### Acceptance Criteria

1. WHEN un webhook es recibido en `/webhooks/whatsapp/{businessId}`, THE System SHALL extraer el businessId de la URL
2. WHEN se recibe un webhook, THE System SHALL validar la firma del webhook usando el Webhook_Token del negocio
3. WHEN la firma es válida, THE System SHALL procesar el mensaje
4. WHEN la firma es inválida, THE System SHALL rechazar el webhook con HTTP 401
5. WHEN el businessId no existe, THE System SHALL rechazar el webhook con HTTP 404
6. WHEN el negocio no tiene WhatsApp configurado, THE System SHALL rechazar el webhook con HTTP 403
7. THE System SHALL registrar todos los intentos de webhook (exitosos y fallidos) para auditoría

### Requirement 4: Configuración del Bot por Negocio

**User Story:** Como dueño de negocio, quiero personalizar los mensajes y comportamiento de mi bot, para que refleje la identidad de mi negocio.

#### Acceptance Criteria

1. WHEN un dueño accede a la configuración del bot, THE System SHALL mostrar opciones de personalización
2. THE System SHALL permitir configurar el mensaje de bienvenida del bot
3. THE System SHALL permitir configurar los nombres de los botones interactivos
4. THE System SHALL permitir configurar el idioma del bot (español, inglés)
5. THE System SHALL permitir configurar el horario de respuesta automática
6. WHEN se guarda la configuración, THE System SHALL validar que todos los campos requeridos estén completos
7. WHEN la configuración es válida, THE System SHALL aplicar los cambios inmediatamente
8. THE System SHALL proporcionar una vista previa de cómo se verán los mensajes

### Requirement 5: Aislamiento Multi-Tenant

**User Story:** Como sistema, quiero garantizar que cada negocio solo pueda acceder a sus propias configuraciones y mensajes, para mantener la seguridad y privacidad.

#### Acceptance Criteria

1. WHEN un webhook es procesado, THE System SHALL usar las credenciales del negocio específico para enviar respuestas
2. WHEN se envía un mensaje, THE System SHALL usar el Phone Number ID del negocio correspondiente
3. THE System SHALL garantizar que un negocio no pueda ver o modificar configuraciones de otro negocio
4. WHEN se consultan conversaciones, THE System SHALL filtrar solo las del negocio autenticado
5. THE System SHALL validar que el businessId en la URL coincida con el negocio del usuario autenticado
6. WHEN un usuario tiene múltiples negocios, THE System SHALL permitir cambiar entre ellos
7. THE System SHALL mantener sesiones separadas para cada negocio

### Requirement 6: Prueba de Configuración

**User Story:** Como dueño de negocio, quiero probar mi configuración de WhatsApp antes de activarla, para asegurarme de que todo funciona correctamente.

#### Acceptance Criteria

1. WHEN un dueño completa la configuración, THE System SHALL ofrecer una opción de "Probar Configuración"
2. WHEN se ejecuta la prueba, THE System SHALL enviar un mensaje de prueba al número de WhatsApp configurado
3. WHEN el mensaje de prueba se envía exitosamente, THE System SHALL mostrar confirmación
4. WHEN el mensaje de prueba falla, THE System SHALL mostrar el error específico
5. THE System SHALL validar que el webhook esté correctamente configurado en WhatsApp
6. THE System SHALL proporcionar instrucciones paso a paso para configurar el webhook en Meta Developer Console
7. WHEN la prueba es exitosa, THE System SHALL marcar la configuración como "Activa"

### Requirement 7: Gestión de Errores de Conexión

**User Story:** Como sistema, quiero manejar errores de conexión con WhatsApp API de manera robusta, para garantizar la continuidad del servicio.

#### Acceptance Criteria

1. WHEN falla el envío de un mensaje, THE System SHALL reintentar hasta 3 veces con backoff exponencial
2. WHEN todos los reintentos fallan, THE System SHALL registrar el error y notificar al dueño del negocio
3. WHEN las credenciales expiran o son inválidas, THE System SHALL notificar al dueño para que las actualice
4. WHEN WhatsApp API está temporalmente no disponible, THE System SHALL encolar los mensajes para envío posterior
5. THE System SHALL proporcionar un dashboard de estado de conexión por negocio
6. WHEN hay errores recurrentes, THE System SHALL sugerir acciones correctivas
7. THE System SHALL mantener un log de errores accesible para el dueño del negocio

### Requirement 8: Migración de Configuración Existente

**User Story:** Como sistema, quiero migrar la configuración global de WhatsApp a configuraciones por negocio, para soportar multi-tenancy.

#### Acceptance Criteria

1. WHEN se ejecuta la migración, THE System SHALL crear configuraciones individuales para cada negocio existente
2. THE System SHALL copiar las credenciales globales a cada negocio como configuración inicial
3. THE System SHALL generar webhooks únicos para cada negocio
4. WHEN la migración se completa, THE System SHALL validar que todos los negocios tengan configuración
5. THE System SHALL proporcionar un reporte de migración con éxitos y fallos
6. WHEN hay fallos en la migración, THE System SHALL permitir reintentar solo los negocios fallidos
7. THE System SHALL mantener compatibilidad con el sistema anterior durante un período de transición

## Immediate Configuration Requirements (Pre-Multi-Tenant)

### Current State (Single Business Configuration)

**Real WhatsApp Business Number Configured:**

- Phone Number: +1 809 798 2896 (Dominican Republic)
- Phone Number ID: 853410294532655
- Business Account ID: 1635138637494802
- Permanent Access Token: Configured in `.env`
- Provider: Meta (WhatsApp Business API)

**Current Issues to Fix:**

1. **Environment Variable Mismatch** (CRITICAL):
   - `WhatsAppSignatureGuard` expects `WHATSAPP_APP_SECRET`
   - `.env` file has `WHATSAPP_WEBHOOK_SECRET`
   - **Action Required**: Update guard to use `WHATSAPP_WEBHOOK_SECRET`

2. **Webhook URL Update Required**:
   - Current ngrok URL: `https://12e6d1fbf5c6.ngrok-free.app`
   - Old URL in Facebook: `https://54b8f59f4708.ngrok-free.app`
   - **Action Required**: Update webhook URL in Facebook Developer Console
   - Webhook endpoint: `/api/webhooks/whatsapp`
   - Full URL: `https://12e6d1fbf5c6.ngrok-free.app/api/webhooks/whatsapp`

3. **Testing Checklist**:
   - [ ] Fix environment variable name in `WhatsAppSignatureGuard`
   - [ ] Update webhook URL in Facebook Developer Console
   - [ ] Restart backend server with `pnpm dev:backend`
   - [ ] Send test message from WhatsApp to +1 809 798 2896
   - [ ] Verify webhook receives message in backend logs
   - [ ] Verify signature validation passes
   - [ ] Test bot response flow

**Facebook Developer Console Configuration:**

- App ID: 1167358032149359
- Webhook Configuration URL: https://developers.facebook.com/apps/1167358032149359/use_cases/customize/wa-settings/
- Webhook Field Subscribed: "messages" ✅
- Verify Token: `0506e8cfa7196a698891348fb6a259bbfce804a438eaf78a56abe0af3deb60e7`

## Notes

- Las credenciales deben almacenarse encriptadas usando AES-256
- Los webhooks deben validarse usando HMAC-SHA256
- La configuración del bot debe ser extensible para futuras personalizaciones
- Considerar rate limiting por negocio para evitar abuso
- Implementar circuit breaker para llamadas a WhatsApp API
- Documentar el proceso de configuración en Meta Developer Console
- **Current implementation is single-tenant; multi-tenant requirements above are for future implementation**

# Twilio WhatsApp Sandbox - Guía de Configuración

Alternativa a la API oficial de Meta para desarrollo y testing local.

## ¿Por qué usar Twilio Sandbox?

| Aspecto       | Meta API Oficial                    | Twilio Sandbox       |
| ------------- | ----------------------------------- | -------------------- |
| **Setup**     | Verificación de negocio, app review | Inmediato            |
| **Costo**     | Gratis pero complejo                | Gratis (trial)       |
| **Webhooks**  | Requiere HTTPS público              | Funciona con ngrok   |
| **Templates** | Requiere aprobación                 | Mensajes libres      |
| **Botones**   | Nativos de WhatsApp                 | Simulados como texto |

## Configuración Paso a Paso

### 1. Crear Cuenta Twilio

1. Ir a [twilio.com/try-twilio](https://www.twilio.com/try-twilio)
2. Crear cuenta con email
3. Verificar número de teléfono

### 2. Activar WhatsApp Sandbox

1. En el dashboard, ir a **Messaging → Try it out → Send a WhatsApp message**
2. Verás tu información del sandbox:
   - Número del sandbox (ej: `+1 415 523 8886`)
   - Tu código único (ej: `join manufacturing-taken`)
   - QR code

### 3. Unirse al Sandbox

Desde tu WhatsApp personal:

1. Agregar el número del sandbox como contacto
2. Enviar el mensaje con tu código: `join <tu-codigo>`
3. Recibirás confirmación: "You are all set!"

> ⚠️ **Importante**: Cada número que quiera recibir mensajes debe unirse al sandbox primero.

### 4. Obtener Credenciales

En el dashboard de Twilio:

1. **Account SID**: Visible en la página principal
2. **Auth Token**: Click en "Show" para revelarlo
3. **WhatsApp From**: El número del sandbox con prefijo `whatsapp:`

### 5. Configurar Variables de Entorno

En `apps/backend/.env`:

```bash
# Cambiar provider a twilio
WHATSAPP_PROVIDER=twilio

# Credenciales de Twilio
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_WHATSAPP_FROM=+14155238886
```

### 6. Configurar Webhook (Opcional)

Para recibir mensajes entrantes:

1. Exponer tu servidor local con ngrok:

   ```bash
   ngrok http 3005
   ```

2. En Twilio Console → Messaging → Settings → WhatsApp Sandbox Settings:
   - **When a message comes in**: `https://tu-url.ngrok.io/api/webhooks/whatsapp`
   - Method: POST

## Limitaciones del Sandbox

1. **Solo números unidos**: Deben enviar `join <codigo>` primero
2. **Sesión 24h**: Expira después de 24h sin actividad
3. **Sin templates**: No soporta WhatsApp Business Templates
4. **Botones simulados**: Se envían como texto formateado
5. **Ubicación simulada**: Se envía como link de Google Maps

## Ejemplo de Uso

```typescript
// El código no cambia, solo la configuración
// El factory selecciona automáticamente el cliente según WHATSAPP_PROVIDER

// Enviar mensaje
await whatsAppClient.sendMessage("+18093192896", "Hola desde Twilio!");

// Enviar botones (se simulan como texto)
await whatsAppClient.sendInteractiveButtons(
  "+18093192896",
  "¿Qué servicio deseas?",
  [
    { id: "corte", title: "Corte de Pelo" },
    { id: "lavado", title: "Lavado" },
  ],
);
// Resultado:
// ¿Qué servicio deseas?
//
// 1. Corte de Pelo
// 2. Lavado
//
// _Responde con el número de tu opción_
```

## Cambiar entre Proveedores

```bash
# Usar Meta API oficial
WHATSAPP_PROVIDER=meta

# Usar Twilio Sandbox
WHATSAPP_PROVIDER=twilio
```

## Troubleshooting

### "Twilio credentials not configured"

Verifica que las 3 variables estén configuradas:

- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_WHATSAPP_FROM`

### "Message failed to send"

1. Verifica que el número destino haya enviado `join <codigo>`
2. Verifica que la sesión no haya expirado (24h)
3. Revisa los logs de Twilio en el dashboard

### "Invalid phone number"

El número debe incluir código de país:

- ✅ `+18093192896`
- ❌ `8093192896`

## Recursos

- [Twilio WhatsApp Sandbox Docs](https://www.twilio.com/docs/whatsapp/sandbox)
- [Twilio Node.js SDK](https://www.twilio.com/docs/libraries/node)
- [Twilio Console](https://www.twilio.com/console)

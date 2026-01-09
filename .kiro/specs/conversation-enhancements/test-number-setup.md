# Configuración del Test Number - Guía Paso a Paso

## Estado Actual

✅ **Backend configurado** con credenciales del Test Number  
✅ **Mensajes enviados exitosamente** desde la API  
✅ **Tu número está en la lista de destinatarios permitidos**  
⚠️ **Mensajes no recibidos** en tu WhatsApp - Investigando causa

## Verificación Completada

**Confirmado el 2026-01-03 a las 19:11:**

- Tu número `+1 (809) 319-2896` (formato: `18093192896`) **SÍ está en la lista de destinatarios permitidos**
- El Test Number puede enviar mensajes a tu número
- La configuración en Meta es correcta

## Solución: Verificar y Agregar tu Número

### Opción 1: Desde Meta for Developers (Recomendado)

1. **Abre la página de API Setup:**
   - URL: https://developers.facebook.com/apps/1167358032149359/whatsapp-business/wa-dev-console/?business_id=593684328632946

2. **Busca la sección "Paso 1: Seleccionar números de teléfono"**

3. **Haz scroll hasta el final de la página**
   - Deberías ver un botón: **"Administrar lista de números de teléfono"**

4. **Haz clic en "Administrar lista de números de teléfono"**

5. **Verifica que tu número esté en la lista:**
   - Número: `+1 (809) 319-2896`
   - Formato: `18093192896`

6. **Si tu número NO está en la lista:**
   - Haz clic en "Agregar número de teléfono"
   - Ingresa: `18093192896` (sin espacios ni guiones)
   - Haz clic en "Guardar"

7. **Verifica que el número esté marcado como "Verificado"**

### Opción 2: Desde WhatsApp Business Manager

1. **Abre WhatsApp Business Manager:**
   - URL: https://business.facebook.com/latest/settings/whatsapp_account?business_id=593684328632946&selected_asset_id=1938086190422833

2. **Busca la sección de "Test Numbers" o "Números de prueba"**

3. **Haz clic en el Test Number: `+1 555 164 6083`**

4. **Busca "Recipient Phone Numbers" o "Números de destinatarios"**

5. **Agrega tu número si no está:**
   - Formato: `18093192896`

## Verificación

Después de agregar tu número, prueba enviar un mensaje:

```bash
curl -X POST "https://graph.facebook.com/v22.0/856623764205587/messages" \
  -H "Authorization: Bearer EAAQltLjUZB28BQfEmU4kUhZCzklZB9Ja79ZCsPXWHUZAnv4p2OEZAk5cTiZAl2RhtORuJyz1EyXpJjpgmbMJM86hOTs7pEZBYOi8ZCg0SHOMN4GZCGXZBqXQ3kTt1tjBamrjPoWpvzjPhb6mSyH3nIrkMtGsWdQG4daYKBi2bO6xDayvTG7negjGmdCUVjsJDo8wwZDZD" \
  -H "Content-Type: application/json" \
  -d '{
    "messaging_product": "whatsapp",
    "to": "18093192896",
    "type": "template",
    "template": {
      "name": "hello_world",
      "language": {
        "code": "en_US"
      }
    }
  }'
```

**Respuesta esperada:**

```json
{
  "messaging_product": "whatsapp",
  "contacts": [{ "input": "18093192896", "wa_id": "18093192896" }],
  "messages": [{ "id": "wamid...", "message_status": "accepted" }]
}
```

**Deberías recibir en tu WhatsApp:**

```
Hello World!
```

## Limitaciones del Test Number

⚠️ **Importante:**

- **Máximo 5 destinatarios** en la lista permitida
- **Solo para desarrollo** - No usar en producción
- **Gratis por 90 días**
- **Solo puede enviar plantillas aprobadas** (como "hello_world")

## Próximos Pasos

Una vez que recibas el mensaje "Hello World":

1. ✅ **Responde al mensaje** para probar el webhook
2. ✅ **Verifica los logs del backend** para ver si recibe el mensaje
3. ✅ **Continúa con Task 3.4** - Validación de firma del webhook

## Troubleshooting

### ✅ Número en lista de destinatarios - VERIFICADO

Tu número está correctamente agregado. **Posibles causas adicionales:**

### 1. WhatsApp no está instalado o activo

**Verifica:**

- ¿Tienes WhatsApp instalado en tu teléfono con el número `+1 (809) 319-2896`?
- ¿WhatsApp está activo y conectado a internet?
- ¿El número está verificado en WhatsApp?

### 2. Mensajes en carpeta de "Desconocidos" o "Spam"

**Verifica:**

- Abre WhatsApp
- Ve a la pestaña "Chats"
- Busca mensajes de números desconocidos
- Revisa si hay un mensaje del número `+1 555 164 6083`

### 3. Número bloqueado en WhatsApp

**Verifica:**

- Configuración de WhatsApp → Cuenta → Privacidad → Bloqueados
- Asegúrate de que `+1 555 164 6083` no esté bloqueado

### 4. Formato del número incorrecto en la API

**Verifica que el curl use el formato correcto:**

```bash
"to": "18093192896"  # ✅ Correcto (sin espacios, sin guiones, sin +)
```

### 5. Test Number no puede enviar mensajes de texto libre

**Limitación importante:**

- Los Test Numbers **solo pueden enviar plantillas aprobadas** (como "hello_world")
- **NO pueden enviar mensajes de texto libre**
- Para texto libre, necesitas un número real verificado

### 6. Delay en la entrega

**Posible:**

- Los mensajes pueden tardar hasta 1-2 minutos en llegar
- Espera unos minutos después de enviar el curl

### 7. Verificar estado del mensaje en la API

**Revisa la respuesta del curl:**

```json
{
  "messages": [
    {
      "id": "wamid...",
      "message_status": "accepted" // ← Debe ser "accepted"
    }
  ]
}
```

Si el status es "accepted", el mensaje fue enviado correctamente por Meta.

### Error "Account not registered"

Este error ocurre cuando intentas usar un número real que no está registrado en tu WhatsApp Business Account. **Solución:** Usar el Test Number (ya configurado).

### Error "Recipient phone number not allowed"

Tu número no está en la lista de destinatarios permitidos. **Solución:** Agregar tu número siguiendo los pasos arriba.

## Contacto

Si después de seguir estos pasos aún no recibes mensajes, avísame y te ayudaré a investigar más.

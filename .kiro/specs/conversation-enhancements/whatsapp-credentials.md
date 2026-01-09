# WhatsApp Business API Credentials

## ✅ Información Obtenida (Test Number - Actualizado 2026-01-03)

### 1. Access Token (Permanente) ✅

```
EAAQltLjUZB28BQfEmU4kUhZCzklZB9Ja79ZCsPXWHUZAnv4p2OEZAk5cTiZAl2RhtORuJyz1EyXpJjpgmbMJM86hOTs7pEZBYOi8ZCg0SHOMN4GZCGXZBqXQ3kTt1tjBamrjPoWpvzjPhb6mSyH3nIrkMtGsWdQG4daYKBi2bO6xDayvTG7negjGmdCUVjsJDo8wwZDZD
```

**✅ Token Permanente:** Este token no expira y puede usarse en producción.

### 2. App ID ✅

```
1167358032149359
```

**Nota:** Nueva app creada el 2026-01-03.

### 3. Business ID

```
593684328632946
```

### 4. WhatsApp Business Account ID (Test Number) ✅

```
1938086190422833
```

**Nota:** Este es el Business Account ID del Test Number.

### 5. Phone Number ID (Test Number) ✅

```
856623764205587
```

**Nota:** Este es el Phone Number ID del Test Number de Meta.

### 6. Test Number ✅

```
+1 555 164 6083
```

**Nota:** Número de prueba proporcionado por Meta. Puede enviar mensajes a máximo 5 destinatarios en la lista permitida.

### 7. Tu Número para Testing ✅

```
+1 (809) 319-2896
```

**Formato para API:** `18093192896`
**Nota:** Este número debe estar en la lista de destinatarios permitidos del Test Number.

### 8. Webhook URL (ngrok) ✅

```
https://54b8f59f4708.ngrok-free.app/api/webhooks/whatsapp
```

**Nota:** Backend corriendo en puerto 3005, ngrok apuntando al puerto correcto.
**Actualizado:** 2026-01-03 17:16

### 9. Verify Token (Para Webhook) ✅

```
0506e8cfa7196a698891348fb6a259bbfce804a438eaf78a56abe0af3deb60e7
```

**Nota:** Este token se usará para:

- Configurar el webhook en Meta
- Configurar tu `.env` en el backend

## ⚠️ Limitaciones del Test Number

- **Máximo 5 destinatarios:** Solo puedes enviar mensajes a 5 números que agregues a la lista permitida
- **Solo desarrollo:** No se puede usar en producción
- **Sin costo:** Completamente gratis para testing

## 📝 Próximos Pasos

1. ✅ **Obtener Phone Number ID** - COMPLETADO
   - Phone Number ID: `856623764205587`
   - Test Number: `+1 555 164 6083`

2. ✅ **Generar Verify Token** - COMPLETADO
   - Token: `0506e8cfa7196a698891348fb6a259bbfce804a438eaf78a56abe0af3deb60e7`

3. ✅ **Actualizar `.env`** - COMPLETADO

   ```env
   WHATSAPP_ACCESS_TOKEN=EAAQltLjUZB28BQfEmU4kUhZCzklZB9Ja79ZCsPXWHUZAnv4p2OEZAk5cTiZAl2RhtORuJyz1EyXpJjpgmbMJM86hOTs7pEZBYOi8ZCg0SHOMN4GZCGXZBqXQ3kTt1tjBamrjPoWpvzjPhb6mSyH3nIrkMtGsWdQG4daYKBi2bO6xDayvTG7negjGmdCUVjsJDo8wwZDZD
   WHATSAPP_PHONE_NUMBER_ID=932648049929676
   WHATSAPP_BUSINESS_ACCOUNT_ID=1413727767425381
   WHATSAPP_WEBHOOK_VERIFY_TOKEN=0506e8cfa7196a698891348fb6a259bbfce804a438eaf78a56abe0af3deb60e7
   WHATSAPP_API_VERSION=v22.0
   ```

4. ✅ **Configurar Webhook en Meta** - COMPLETADO
   - URL: `https://54b8f59f4708.ngrok-free.app/api/webhooks/whatsapp`
   - Verify Token: `0506e8cfa7196a698891348fb6a259bbfce804a438eaf78a56abe0af3deb60e7`
   - **Status**: ✅ Verified successfully at 17:19:08 on 2026-01-03
   - **Subscribed Fields**:
     - `messages` - ✅ Debe estar suscrito (incluye mensajes entrantes y estados de mensajes)

## 🔗 Enlaces Útiles

- **App Dashboard:** https://developers.facebook.com/apps/3149617022081111/dashboard/
- **WhatsApp Config:** https://developers.facebook.com/apps/3149617022081111/whatsapp-business/wa-configurations/
- **Business Manager:** https://business.facebook.com/settings/whatsapp-business-accounts
- **ngrok Dashboard:** http://127.0.0.1:4040 (para ver requests en tiempo real)

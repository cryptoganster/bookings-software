# Comparación: Single-Tenant vs Multi-Tenant SaaS

## 📊 Tabla Comparativa

| Aspecto                | Single-Tenant (Actual)   | Multi-Tenant SaaS (Target)  |
| ---------------------- | ------------------------ | --------------------------- |
| **Número de WhatsApp** | 1 número hardcoded       | N números (uno por negocio) |
| **Configuración**      | Variables en `.env`      | Base de datos por negocio   |
| **Onboarding**         | Manual (soporte técnico) | Automático (OAuth)          |
| **Webhook**            | URL única, routing fijo  | URL única, routing dinámico |
| **Seguridad**          | Tokens en plain text     | Tokens encriptados          |
| **Escalabilidad**      | 1 negocio                | Ilimitado                   |
| **UX**                 | Usuario ve tokens        | Usuario nunca ve tokens     |
| **Mantenimiento**      | Cambios en código        | Cambios en DB               |

---

## 🔄 Flujo de Conexión

### Actual (Single-Tenant)

```
1. Desarrollador crea app en Meta
2. Desarrollador obtiene tokens manualmente
3. Desarrollador copia tokens a .env
4. Desarrollador configura webhook en Meta
5. Desarrollador reinicia servidor
6. ✅ Sistema funciona para 1 negocio
```

### Target (Multi-Tenant SaaS)

```
1. Usuario se registra en tu SaaS
2. Usuario hace clic en "Conectar WhatsApp"
3. Popup de Facebook se abre
4. Usuario autoriza tu app
5. Meta devuelve tokens automáticamente
6. Backend guarda tokens en DB (encriptados)
7. ✅ Sistema funciona para ese negocio
8. Repetir pasos 1-7 para cada nuevo negocio
```

---

## 💾 Almacenamiento de Configuración

### Actual

```bash
# .env (global, un solo negocio)
WHATSAPP_API_URL=https://graph.facebook.com/v22.0/853410294532655/
WHATSAPP_ACCESS_TOKEN=EAAQltLjUZB28BQ...
WHATSAPP_PHONE_NUMBER_ID=853410294532655
WHATSAPP_BUSINESS_ACCOUNT_ID=1635138637494802
DEFAULT_BUSINESS_ID=93f91bdb-805a-4fa4-8804-c937b6b0c14d
```

### Target

```sql
-- whatsapp_configurations (DB, múltiples negocios)
SELECT * FROM whatsapp_configurations;

| id   | business_id | phone_number_id | display_phone    | access_token (encrypted) | status    |
|------|-------------|-----------------|------------------|--------------------------|-----------|
| uuid1| biz_123     | 853410294532655 | +1 809 798 2896  | [encrypted]              | connected |
| uuid2| biz_456     | 987654321098765 | +1 555 123 4567  | [encrypted]              | connected |
| uuid3| biz_789     | 123456789012345 | +1 555 987 6543  | [encrypted]              | connected |
```

---

## 🔀 Webhook Processing

### Actual (Single-Tenant)

```typescript
// webhook.ts línea 126
const businessId = process.env.DEFAULT_BUSINESS_ID; // ← Siempre el mismo

await commandBus.execute(
  new ProcessIncomingMessageCommand(
    businessId, // ← Hardcoded
    customerPhone,
    messageText,
  ),
);
```

**Problema**: Todos los mensajes van al mismo negocio.

### Target (Multi-Tenant)

```typescript
// Extraer phone_number_id del payload
const phoneNumberId = metadata.phone_number_id;

// Buscar configuración en DB
const config = await whatsappConfigRepo.findByPhoneNumberId(phoneNumberId);

if (!config) {
  throw new Error("No configuration found");
}

const businessId = config.business_id; // ← Dinámico

await commandBus.execute(
  new ProcessIncomingMessageCommand(
    businessId, // ← Correcto para cada negocio
    customerPhone,
    messageText,
  ),
);
```

**Solución**: Cada mensaje va al negocio correcto.

---

## 🔐 Seguridad

### Actual

```bash
# .env (plain text, visible en código)
WHATSAPP_ACCESS_TOKEN=EAAQltLjUZB28BQ...
WHATSAPP_WEBHOOK_SECRET=fdc29afce904d950561314b9f2240bd9
```

**Riesgos**:

- ❌ Tokens en plain text
- ❌ Visible en repositorio (si se commitea por error)
- ❌ Accesible por cualquiera con acceso al servidor

### Target

```typescript
// DB (encrypted)
{
  access_token: "iv:encrypted_data", // ← Encriptado con AES-256
  webhook_secret: "iv:encrypted_data" // ← Encriptado con AES-256
}

// Uso
const token = decrypt(config.access_token);
const secret = decrypt(config.webhook_secret);
```

**Beneficios**:

- ✅ Tokens encriptados en DB
- ✅ No visible en código ni repositorio
- ✅ Requiere ENCRYPTION_KEY para desencriptar
- ✅ Compliance con GDPR, PCI-DSS

---

## 📈 Escalabilidad

### Actual

```
1 App → 1 Número WhatsApp → 1 Negocio
```

**Límite**: 1 negocio

### Target

```
1 App → N Números WhatsApp → N Negocios
```

**Límite**: Ilimitado (solo limitado por recursos del servidor)

---

## 💰 Modelo de Negocio

### Actual

```
Revenue = 1 negocio × $X/mes = $X/mes
```

### Target

```
Revenue = N negocios × $X/mes = $N×X/mes
```

**Ejemplo**:

- 10 negocios × $50/mes = $500/mes
- 100 negocios × $50/mes = $5,000/mes
- 1,000 negocios × $50/mes = $50,000/mes

---

## 🎯 Conclusión

| Métrica                 | Single-Tenant | Multi-Tenant SaaS |
| ----------------------- | ------------- | ----------------- |
| **Negocios soportados** | 1             | Ilimitado         |
| **Onboarding**          | Manual        | Automático        |
| **Seguridad**           | Baja          | Alta              |
| **Escalabilidad**       | No            | Sí                |
| **Revenue potencial**   | Limitado      | Alto              |
| **Mantenimiento**       | Alto          | Bajo              |

**Recomendación**: Migrar a Multi-Tenant SaaS para desbloquear crecimiento.

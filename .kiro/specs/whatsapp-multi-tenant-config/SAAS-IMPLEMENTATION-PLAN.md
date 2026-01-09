# WhatsApp SaaS Multi-Tenant Implementation Plan

## 📋 Executive Summary

**Current State**: Single-tenant configuration con un solo número de WhatsApp hardcoded  
**Target State**: SaaS multi-tenant donde cada negocio conecta su propio número de WhatsApp  
**Solution**: Embedded Signup de Meta (OAuth flow) + Dynamic webhook routing

---

## 🎯 Problema Actual

### Variables de Entorno Actuales (Single-Tenant)

```bash
# Global - Una sola vez para toda la app
WHATSAPP_API_URL=https://graph.facebook.com/v22.0/853410294532655/
WHATSAPP_ACCESS_TOKEN=EAAQltLjUZB28BQ...
WHATSAPP_PHONE_NUMBER_ID=853410294532655
WHATSAPP_BUSINESS_ACCOUNT_ID=1635138637494802
WHATSAPP_WEBHOOK_VERIFY_TOKEN=0506e8cfa7196a698891348fb6a259bbfce804a438eaf78a56abe0af3deb60e7
WHATSAPP_WEBHOOK_SECRET=fdc29afce904d950561314b9f2240bd9
DEFAULT_BUSINESS_ID=93f91bdb-805a-4fa4-8804-c937b6b0c14d
```

### Limitaciones

1. ❌ Solo un negocio puede usar WhatsApp
2. ❌ Todos los mensajes van al mismo `DEFAULT_BUSINESS_ID`
3. ❌ No hay forma de que otros negocios conecten sus números
4. ❌ Webhook único para todos (no escalable)

---

## 🚀 Solución: Embedded Signup (Meta OAuth)

### ¿Qué es Embedded Signup?

Es el flujo OAuth oficial de Meta para SaaS que permite a los usuarios:

1. Conectar su WhatsApp Business sin ver tokens ni secretos
2. Autorizar tu app para enviar/recibir mensajes en su nombre
3. Meta te devuelve automáticamente los IDs necesarios

### Empresas que lo usan

- Calendly-like bots
- CRM SaaS (HubSpot, Salesforce)
- Herramientas de reservas
- Chatbots modernos

---

## 🏗️ Arquitectura Propuesta

### 1. Variables Globales (Una sola vez en tu app)

```bash
# Meta App Configuration (Global)
META_APP_ID=1167358032149359
META_APP_SECRET=fdc29afce904d950561314b9f2240bd9
SYSTEM_USER_ACCESS_TOKEN=<generated_once>
WEBHOOK_VERIFY_TOKEN=<random_token>
```

### 2. Variables por Cliente (En Base de Datos)

```typescript
// Nueva tabla: whatsapp_configurations
interface WhatsAppConfiguration {
  id: string;
  business_id: string; // FK a businesses
  waba_id: string; // WhatsApp Business Account ID
  phone_number_id: string; // Phone Number ID
  display_phone: string; // +1 809 798 2896
  access_token: string; // Encrypted
  status: "connected" | "disconnected" | "pending";
  webhook_secret: string; // Encrypted, único por negocio
  created_at: Date;
  updated_at: Date;
}
```

### 3. Webhook Único con Routing Dinámico

**Antes (Single-Tenant)**:

```
POST /api/webhooks/whatsapp
→ Siempre va a DEFAULT_BUSINESS_ID
```

**Después (Multi-Tenant)**:

```
POST /api/webhooks/whatsapp
→ Extrae phone_number_id del payload
→ Busca business_id en DB por phone_number_id
→ Procesa mensaje para ese business_id
```

---

## 📐 Flujo de Embedded Signup

### Paso 1: Usuario en tu SaaS

```
1. Usuario se registra en tu plataforma
2. Completa onboarding
3. Llega a "Configuración de WhatsApp"
4. Ve botón: "Conectar WhatsApp Business"
```

### Paso 2: OAuth Flow

```typescript
// Frontend: Botón que abre popup de Meta
<button onClick={() => {
  const url = `https://www.facebook.com/v22.0/dialog/oauth?
    client_id=${META_APP_ID}&
    redirect_uri=${REDIRECT_URI}&
    config_id=${CONFIG_ID}&
    response_type=code&
    override_default_response_type=true&
    extras={"setup":{"business":{"name":"${businessName}"}}}`;

  window.open(url, 'facebook-login', 'width=600,height=800');
}}>
  Conectar WhatsApp Business
</button>
```

### Paso 3: Usuario en Meta

```
1. Se abre popup de Facebook
2. Usuario inicia sesión en Facebook (si no lo está)
3. Selecciona o crea WhatsApp Business Account
4. Verifica su número de teléfono
5. Autoriza tu app
6. Meta redirige a tu REDIRECT_URI con un code
```

### Paso 4: Backend Exchange Code

```typescript
// Backend: Endpoint que recibe el code
@Post('auth/whatsapp/callback')
async handleWhatsAppCallback(@Body() body: { code: string, business_id: string }) {
  // 1. Exchange code por access_token
  const tokenResponse = await axios.post(
    `https://graph.facebook.com/v22.0/oauth/access_token`,
    {
      client_id: process.env.META_APP_ID,
      client_secret: process.env.META_APP_SECRET,
      code: body.code,
    }
  );

  const { access_token } = tokenResponse.data;

  // 2. Obtener WhatsApp Business Account ID
  const wabaResponse = await axios.get(
    `https://graph.facebook.com/v22.0/debug_token?input_token=${access_token}`,
    {
      headers: { Authorization: `Bearer ${process.env.SYSTEM_USER_ACCESS_TOKEN}` }
    }
  );

  const { granular_scopes } = wabaResponse.data.data;
  const wabaId = granular_scopes.find(s => s.scope === 'whatsapp_business_management')?.target_ids[0];

  // 3. Obtener Phone Number ID
  const phoneResponse = await axios.get(
    `https://graph.facebook.com/v22.0/${wabaId}/phone_numbers`,
    {
      headers: { Authorization: `Bearer ${access_token}` }
    }
  );

  const phoneNumberId = phoneResponse.data.data[0].id;
  const displayPhone = phoneResponse.data.data[0].display_phone_number;

  // 4. Guardar en DB
  await this.whatsappConfigRepo.save({
    business_id: body.business_id,
    waba_id: wabaId,
    phone_number_id: phoneNumberId,
    display_phone: displayPhone,
    access_token: encrypt(access_token), // Encriptar
    status: 'connected',
    webhook_secret: generateRandomSecret(),
  });

  // 5. Configurar webhook automáticamente (opcional)
  await this.configureWebhook(wabaId, access_token);

  return { success: true, phone: displayPhone };
}
```

### Paso 5: Configurar Webhook Automáticamente

```typescript
async configureWebhook(wabaId: string, accessToken: string) {
  await axios.post(
    `https://graph.facebook.com/v22.0/${wabaId}/subscribed_apps`,
    {
      subscribed_fields: ['messages'],
    },
    {
      headers: { Authorization: `Bearer ${accessToken}` }
    }
  );
}
```

---

## 🔄 Webhook Processing (Multi-Tenant)

### Webhook Payload de Meta

```json
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "changes": [
        {
          "value": {
            "metadata": {
              "phone_number_id": "987654321" // ← Identificador único
            },
            "messages": [
              {
                "from": "+1234567890",
                "text": { "body": "Hola" }
              }
            ]
          }
        }
      ]
    }
  ]
}
```

### Webhook Controller (Actualizado)

```typescript
@Controller("webhooks/whatsapp")
@UseGuards(WhatsAppSignatureGuard)
export class WebhookController {
  @Post()
  async handleIncomingMessage(@Body() payload: WhatsAppWebhookPayload) {
    for (const entry of payload.entry) {
      for (const change of entry.changes) {
        const { messages, metadata } = change.value;

        // ✅ MULTI-TENANT: Buscar business por phone_number_id
        const phoneNumberId = metadata.phone_number_id;

        const config =
          await this.whatsappConfigRepo.findByPhoneNumberId(phoneNumberId);

        if (!config) {
          this.logger.warn(
            `No configuration found for phone_number_id: ${phoneNumberId}`,
          );
          continue;
        }

        const businessId = config.business_id;

        // Procesar mensaje para ese business específico
        for (const message of messages) {
          const customerPhone = message.from.startsWith("+")
            ? message.from
            : `+${message.from}`;

          await this.commandBus.execute(
            new ProcessIncomingMessageCommand(
              businessId, // ← Dinámico, basado en phone_number_id
              customerPhone,
              customerPhone,
              messageText,
              buttonId,
            ),
          );
        }
      }
    }

    return { status: "success" };
  }
}
```

---

## 🗄️ Cambios en Base de Datos

### Nueva Tabla: whatsapp_configurations

```sql
CREATE TABLE whatsapp_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  waba_id VARCHAR(255) NOT NULL,
  phone_number_id VARCHAR(255) NOT NULL UNIQUE, -- ← Índice único
  display_phone VARCHAR(20) NOT NULL,
  access_token TEXT NOT NULL, -- Encrypted
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  webhook_secret VARCHAR(255) NOT NULL, -- Encrypted
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT unique_business_whatsapp UNIQUE (business_id)
);

CREATE INDEX idx_whatsapp_phone_number_id ON whatsapp_configurations(phone_number_id);
CREATE INDEX idx_whatsapp_business_id ON whatsapp_configurations(business_id);
```

### Actualizar Tabla: businesses

```sql
-- Agregar columna opcional para referencia rápida
ALTER TABLE businesses
ADD COLUMN whatsapp_phone VARCHAR(20),
ADD COLUMN whatsapp_configured BOOLEAN DEFAULT FALSE;
```

---

## 🔐 Seguridad

### 1. Encriptación de Tokens

```typescript
import * as crypto from "crypto";

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY; // 32 bytes
const IV_LENGTH = 16;

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(
    "aes-256-cbc",
    Buffer.from(ENCRYPTION_KEY),
    iv,
  );
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString("hex") + ":" + encrypted.toString("hex");
}

export function decrypt(text: string): string {
  const parts = text.split(":");
  const iv = Buffer.from(parts.shift()!, "hex");
  const encrypted = Buffer.from(parts.join(":"), "hex");
  const decipher = crypto.createDecipheriv(
    "aes-256-cbc",
    Buffer.from(ENCRYPTION_KEY),
    iv,
  );
  let decrypted = decipher.update(encrypted);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}
```

### 2. Webhook Signature Validation (Por Business)

```typescript
@Injectable()
export class WhatsAppSignatureGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<FastifyRequest>();

    // Para GET (verificación), usar token global
    if (request.method === "GET") {
      const verifyToken = request.query["hub.verify_token"];
      if (verifyToken === process.env.WEBHOOK_VERIFY_TOKEN) {
        (request as any).webhookChallenge = request.query["hub.challenge"];
        return true;
      }
      return false;
    }

    // Para POST (mensajes), validar firma con webhook_secret del business
    const signature = request.headers["x-hub-signature-256"] as string;
    const body = JSON.stringify(request.body);

    // Extraer phone_number_id del payload
    const payload = request.body as WhatsAppWebhookPayload;
    const phoneNumberId =
      payload.entry[0]?.changes[0]?.value?.metadata?.phone_number_id;

    if (!phoneNumberId) {
      return false;
    }

    // Buscar webhook_secret del business
    const config =
      await this.whatsappConfigRepo.findByPhoneNumberId(phoneNumberId);

    if (!config) {
      return false;
    }

    const webhookSecret = decrypt(config.webhook_secret);

    // Validar firma
    const expectedSignature =
      "sha256=" +
      crypto.createHmac("sha256", webhookSecret).update(body).digest("hex");

    return signature === expectedSignature;
  }
}
```

---

## 📱 UI/UX Flow

### Panel de Administración

```typescript
// Page: /settings/whatsapp

export function WhatsAppSettingsPage() {
  const { business } = useAuth();
  const { data: config, isLoading } = useQuery(['whatsapp-config', business.id]);

  if (isLoading) return <Loader />;

  if (!config) {
    return (
      <Card>
        <Title>Conectar WhatsApp Business</Title>
        <Text>
          Conecta tu número de WhatsApp Business para recibir reservas automáticamente.
        </Text>
        <Button onClick={handleConnectWhatsApp}>
          Conectar WhatsApp
        </Button>
      </Card>
    );
  }

  return (
    <Card>
      <Group>
        <ThemeIcon color="green" size="xl">
          <IconCheck />
        </ThemeIcon>
        <div>
          <Title order={3}>WhatsApp Conectado</Title>
          <Text>{config.display_phone}</Text>
        </div>
      </Group>

      <Divider my="md" />

      <Stack>
        <Group>
          <Text weight={500}>Estado:</Text>
          <Badge color={config.status === 'connected' ? 'green' : 'red'}>
            {config.status}
          </Badge>
        </Group>

        <Group>
          <Text weight={500}>Webhook URL:</Text>
          <Code>{`https://api.yourdomain.com/webhooks/whatsapp`}</Code>
        </Group>

        <Button variant="outline" color="red" onClick={handleDisconnect}>
          Desconectar WhatsApp
        </Button>
      </Stack>
    </Card>
  );
}

function handleConnectWhatsApp() {
  const url = `https://www.facebook.com/v22.0/dialog/oauth?
    client_id=${META_APP_ID}&
    redirect_uri=${encodeURIComponent(REDIRECT_URI)}&
    config_id=${CONFIG_ID}&
    response_type=code&
    override_default_response_type=true&
    extras=${encodeURIComponent(JSON.stringify({
      setup: {
        business: {
          name: business.name
        }
      }
    }))}`;

  const popup = window.open(url, 'facebook-login', 'width=600,height=800');

  // Escuchar mensaje del popup
  window.addEventListener('message', async (event) => {
    if (event.data.type === 'whatsapp-connected') {
      await queryClient.invalidateQueries(['whatsapp-config']);
      popup?.close();
    }
  });
}
```

---

## 🧪 Testing Strategy

### 1. Unit Tests

```typescript
describe("WhatsAppConfigurationService", () => {
  it("should save configuration after OAuth", async () => {
    const config = await service.saveConfiguration({
      business_id: "uuid",
      waba_id: "123",
      phone_number_id: "456",
      display_phone: "+1234567890",
      access_token: "token",
    });

    expect(config.status).toBe("connected");
    expect(config.access_token).not.toBe("token"); // Debe estar encriptado
  });
});
```

### 2. Integration Tests

```typescript
describe("Webhook Multi-Tenant Routing", () => {
  it("should route message to correct business", async () => {
    // Arrange: Create two businesses with different phone_number_ids
    const business1 = await createTestBusiness();
    const business2 = await createTestBusiness();

    await createWhatsAppConfig(business1.id, "phone_id_1");
    await createWhatsAppConfig(business2.id, "phone_id_2");

    // Act: Send webhook for business1
    const response = await request(app.getHttpServer())
      .post("/webhooks/whatsapp")
      .send({
        entry: [
          {
            changes: [
              {
                value: {
                  metadata: { phone_number_id: "phone_id_1" },
                  messages: [{ from: "+1234567890", text: { body: "Hola" } }],
                },
              },
            ],
          },
        ],
      });

    // Assert: Message processed for business1, not business2
    expect(response.status).toBe(200);
    const conversation = await conversationRepo.findByBusinessAndPhone(
      business1.id,
      "+1234567890",
    );
    expect(conversation).toBeDefined();

    const conversation2 = await conversationRepo.findByBusinessAndPhone(
      business2.id,
      "+1234567890",
    );
    expect(conversation2).toBeNull();
  });
});
```

---

## 📋 Implementation Checklist

### Phase 1: Database & Models (Week 1)

- [ ] Create `whatsapp_configurations` table migration
- [ ] Create `WhatsAppConfiguration` entity
- [ ] Create `WhatsAppConfigurationRepository`
- [ ] Implement encryption/decryption utilities
- [ ] Add unit tests for encryption

### Phase 2: OAuth Flow (Week 2)

- [ ] Create Facebook App Configuration in Meta Developer Console
- [ ] Implement OAuth callback endpoint
- [ ] Implement token exchange logic
- [ ] Implement WABA and phone number retrieval
- [ ] Add integration tests for OAuth flow

### Phase 3: Webhook Routing (Week 3)

- [ ] Update `WhatsAppSignatureGuard` for multi-tenant validation
- [ ] Update `WebhookController` to use `phone_number_id` lookup
- [ ] Remove `DEFAULT_BUSINESS_ID` hardcoding
- [ ] Add integration tests for webhook routing
- [ ] Test with multiple businesses

### Phase 4: UI/UX (Week 4)

- [ ] Create WhatsApp settings page in frontend
- [ ] Implement "Connect WhatsApp" button with OAuth popup
- [ ] Implement callback handler in frontend
- [ ] Add status indicators and disconnect functionality
- [ ] Add E2E tests for connection flow

### Phase 5: Migration & Cleanup (Week 5)

- [ ] Migrate existing single-tenant configuration to new table
- [ ] Remove old environment variables from `.env`
- [ ] Update documentation
- [ ] Deploy to staging
- [ ] Test with real WhatsApp numbers
- [ ] Deploy to production

---

## 🚨 Breaking Changes

### Environment Variables to Remove

```bash
# ❌ Remove (moved to DB per business)
WHATSAPP_API_URL
WHATSAPP_ACCESS_TOKEN
WHATSAPP_PHONE_NUMBER_ID
WHATSAPP_BUSINESS_ACCOUNT_ID
DEFAULT_BUSINESS_ID
```

### Environment Variables to Add

```bash
# ✅ Add (global configuration)
META_APP_ID=1167358032149359
META_APP_SECRET=fdc29afce904d950561314b9f2240bd9
SYSTEM_USER_ACCESS_TOKEN=<generate_once>
WEBHOOK_VERIFY_TOKEN=<random_token>
ENCRYPTION_KEY=<32_byte_random_key>
OAUTH_REDIRECT_URI=https://yourdomain.com/auth/whatsapp/callback
```

---

## 📚 References

- **Meta Embedded Signup**: https://developers.facebook.com/docs/whatsapp/embedded-signup
- **WhatsApp Business API**: https://developers.facebook.com/docs/whatsapp/business-management-api
- **OAuth Flow**: https://developers.facebook.com/docs/facebook-login/guides/advanced/manual-flow
- **Webhook Subscriptions**: https://developers.facebook.com/docs/graph-api/webhooks

---

## 💡 Key Insights

### Why Embedded Signup?

1. ✅ **User Experience**: Usuario nunca ve tokens ni secretos
2. ✅ **Security**: Tokens encriptados en tu DB, no en `.env`
3. ✅ **Scalability**: Cada negocio su propio número
4. ✅ **Compliance**: Meta recomienda este flujo para SaaS
5. ✅ **Automation**: Webhook se configura automáticamente

### Why Single Webhook?

1. ✅ **Simplicity**: Un solo endpoint en Meta Developer Console
2. ✅ **Routing**: `phone_number_id` identifica el negocio
3. ✅ **Scalability**: No necesitas crear webhooks por negocio
4. ✅ **Maintenance**: Más fácil de mantener y monitorear

### Why Encrypt Tokens?

1. ✅ **Security**: Tokens no están en plain text en DB
2. ✅ **Compliance**: GDPR, PCI-DSS requieren encriptación
3. ✅ **Best Practice**: Nunca almacenar secretos sin encriptar

---

## 🎯 Success Metrics

### Technical

- [ ] 100% de mensajes enrutados al business correcto
- [ ] 0 errores de signature validation
- [ ] < 500ms latency en webhook processing
- [ ] 100% uptime en OAuth flow

### Business

- [ ] 10+ negocios conectados en primer mes
- [ ] < 5% tasa de error en conexión
- [ ] > 90% satisfacción de usuarios
- [ ] 0 incidentes de seguridad

---

**Last Updated**: December 18, 2024  
**Status**: Ready for Implementation  
**Estimated Effort**: 5 weeks (1 developer)

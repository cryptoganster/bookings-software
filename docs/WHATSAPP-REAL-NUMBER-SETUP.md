# WhatsApp Real Number Setup Guide

## Current Configuration

**Real WhatsApp Business Number**: +1 809 798 2896 (Dominican Republic)

**Meta Configuration:**

- Phone Number ID: `853410294532655`
- Business Account ID: `1635138637494802`
- App ID: `1167358032149359`
- Permanent Access Token: Configured in `.env`

**Backend Configuration:**

- Provider: `meta` (WhatsApp Business API)
- Webhook Endpoint: `/api/webhooks/whatsapp`
- Current ngrok URL: `https://12e6d1fbf5c6.ngrok-free.app`

---

## Step 1: Fix Environment Variable Bug (COMPLETED ✅)

**Issue**: `WhatsAppSignatureGuard` was looking for `WHATSAPP_APP_SECRET` but `.env` has `WHATSAPP_WEBHOOK_SECRET`.

**Fix Applied**: Updated `apps/backend/src/conversation/presentation/guards/whatsapp-signature.ts` to use `WHATSAPP_WEBHOOK_SECRET`.

**Verification**: Code compiles successfully with `pnpm --filter backend typecheck`.

---

## Step 2: Update Webhook URL in Facebook Developer Console

### 2.1 Access Webhook Configuration

1. Go to: https://developers.facebook.com/apps/1167358032149359/use_cases/customize/wa-settings/
2. You should see the "Configuración" section with webhook settings

### 2.2 Update Webhook URL

**Current URL (OLD)**: `https://54b8f59f4708.ngrok-free.app/api/webhooks/whatsapp`

**New URL**: `https://12e6d1fbf5c6.ngrok-free.app/api/webhooks/whatsapp`

**Steps:**

1. Click on the "URL de devolución de llamada" textbox
2. Clear the current URL
3. Enter the new URL: `https://12e6d1fbf5c6.ngrok-free.app/api/webhooks/whatsapp`
4. The "Verificar y guardar" button should become enabled
5. Click "Verificar y guardar"

**What happens when you click "Verificar y guardar":**

- Facebook will send a GET request to your webhook URL with verification parameters
- Your backend's `WhatsAppSignatureGuard` will validate the `hub.verify_token`
- If valid, it will respond with the `hub.challenge` value
- Facebook will confirm the webhook is working and save the configuration

**Verify Token**: `0506e8cfa7196a698891348fb6a259bbfce804a438eaf78a56abe0af3deb60e7`

### 2.3 Verify Webhook Field Subscription

Ensure the "messages" field is subscribed (should already be checked ✅).

---

## Step 3: Restart Backend Server

```bash
# Stop current server (Ctrl+C if running)

# Start backend with updated configuration
pnpm dev:backend
```

**Expected logs:**

```
[Nest] INFO [NestFactory] Starting Nest application...
[Nest] INFO [InstanceLoader] ConversationModule dependencies initialized
[Nest] INFO [RoutesResolver] WebhookController {/api/webhooks/whatsapp}:
[Nest] INFO   GET /api/webhooks/whatsapp
[Nest] INFO   POST /api/webhooks/whatsapp
[Nest] INFO Application is running on: http://127.0.0.1:3005
```

---

## Step 4: Test Webhook Connection

### 4.1 Send Test Message from WhatsApp

1. Open WhatsApp on your phone
2. Send a message to: **+1 809 798 2896**
3. Example message: "Hola"

### 4.2 Verify Backend Receives Webhook

**Expected backend logs:**

```
[WebhookController] Received WhatsApp webhook
[WebhookController] Processing message from: +1234567890
[WebhookController] Message text: Hola
[ProcessIncomingMessageHandler] Processing incoming message...
```

### 4.3 Verify Signature Validation

If signature validation fails, you'll see:

```
[WhatsAppSignatureGuard] Invalid signature
```

If this happens:

1. Verify `WHATSAPP_WEBHOOK_SECRET` in `.env` matches the App Secret in Facebook Developer Console
2. Check that the webhook URL is correct
3. Restart the backend server

---

## Step 5: Test Bot Response Flow

### 5.1 Expected Bot Behavior

When you send "Hola" to +1 809 798 2896, the bot should:

1. **Identify/Create Customer**:
   - Check if customer exists by WhatsApp phone number
   - If not, create anonymous customer (userId = null)

2. **Start Conversation**:
   - Create or resume conversation
   - Send welcome message with interactive buttons

3. **Expected Response**:

   ```
   ¡Hola! 👋 Bienvenido a [Nombre del Negocio]

   ¿Qué servicio deseas agendar?
   [Corte de Pelo] [Lavado] [Tinte] [Consulta al Admin]
   ```

### 5.2 Troubleshooting

**If bot doesn't respond:**

1. **Check backend logs** for errors:

   ```bash
   # In terminal where backend is running
   # Look for errors in ProcessIncomingMessageHandler
   ```

2. **Verify webhook is receiving messages**:
   - Check for `[WebhookController] Received WhatsApp webhook` log
   - If not present, webhook URL might be incorrect

3. **Check WhatsApp API credentials**:
   - Verify `WHATSAPP_ACCESS_TOKEN` is valid
   - Verify `WHATSAPP_PHONE_NUMBER_ID` is correct
   - Test with a simple curl command:
     ```bash
     curl -X POST "https://graph.facebook.com/v22.0/853410294532655/messages" \
       -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
       -H "Content-Type: application/json" \
       -d '{
         "messaging_product": "whatsapp",
         "to": "YOUR_PHONE_NUMBER",
         "type": "text",
         "text": { "body": "Test message" }
       }'
     ```

4. **Verify database connection**:
   - Check that PostgreSQL is running
   - Verify database credentials in `.env`

---

## Step 6: Verify Multi-Tenant Isolation (Future)

**Current State**: Single-tenant configuration (one business, one WhatsApp number)

**Future Multi-Tenant Requirements**:

- Each business will have its own WhatsApp credentials
- Webhook URL will include businessId: `/api/webhooks/whatsapp/{businessId}`
- Signature validation will use business-specific webhook secret
- See `.kiro/specs/whatsapp-multi-tenant-config/requirements.md` for details

---

## Environment Variables Reference

```bash
# WhatsApp Provider Selection
WHATSAPP_PROVIDER=meta

# WhatsApp Business API Configuration (Meta)
WHATSAPP_API_URL=https://graph.facebook.com/v22.0/853410294532655/
WHATSAPP_ACCESS_TOKEN=EAAQltLjUZB28BQbuGGZCOMXEkaYRxiT521QAakGa25vSJv7x1cl8c8Vo76tTIsTNu8zzMPOQPZBZBXbVBI3MQj8khff3ngJBlALsrnp6jnF9ksT3pEVW3UGJsu4xO0uFtuPTZCy72JBgNF6xUTdLncB0zeHFUO7w1Gmqv9xj3y6W8S0mqqXhB1nFDoQIL7zxIZCgZDZD
WHATSAPP_PHONE_NUMBER_ID=853410294532655
WHATSAPP_BUSINESS_ACCOUNT_ID=1635138637494802
WHATSAPP_WEBHOOK_VERIFY_TOKEN=0506e8cfa7196a698891348fb6a259bbfce804a438eaf78a56abe0af3deb60e7
WHATSAPP_WEBHOOK_SECRET=fdc29afce904d950561314b9f2240bd9
```

---

## Important Notes

### Access Token Management

**Current Token**: Permanent access token (does not expire)

**Token Permissions Required**:

- `whatsapp_business_messaging`
- `whatsapp_business_management`

**If token expires or becomes invalid**:

1. Go to: https://developers.facebook.com/apps/1167358032149359/
2. Navigate to "WhatsApp" → "API Setup"
3. Generate new permanent token
4. Update `WHATSAPP_ACCESS_TOKEN` in `.env`
5. Restart backend server

### Webhook Secret vs Verify Token

**Two different values are used:**

1. **Webhook Verify Token** (`WHATSAPP_WEBHOOK_VERIFY_TOKEN`):
   - Used during webhook verification (GET request)
   - You define this value
   - Must match the value configured in Facebook Developer Console

2. **Webhook Secret** (`WHATSAPP_WEBHOOK_SECRET`):
   - Used to validate webhook signatures (POST request)
   - This is the "App Secret" from Facebook Developer Console
   - Found in: Settings → Basic → App Secret

### ngrok Considerations

**Current Setup**: Using ngrok for local development

**Important**:

- ngrok URL changes every time you restart ngrok (unless using paid plan)
- You must update the webhook URL in Facebook Developer Console each time
- For production, use a permanent domain

**Alternative for Development**:

- Use ngrok with a custom subdomain (paid feature)
- Use a cloud service (Heroku, Railway, etc.) with permanent URL
- Use a VPS with a fixed IP and domain

### Rate Limits

**WhatsApp Business API Rate Limits**:

- Free tier: 1,000 business-initiated conversations per month
- Customer-initiated conversations: Unlimited (free)
- Message rate: 80 messages per second per phone number

**Current Implementation**:

- Retry logic: 3 attempts with exponential backoff
- No rate limiting implemented yet
- Consider implementing rate limiting for production

---

## Checklist

- [x] Fix environment variable bug in `WhatsAppSignatureGuard`
- [x] Verify code compiles successfully
- [ ] Update webhook URL in Facebook Developer Console
- [ ] Restart backend server
- [ ] Send test message from WhatsApp
- [ ] Verify webhook receives message
- [ ] Verify signature validation passes
- [ ] Verify bot responds with welcome message
- [ ] Test interactive buttons
- [ ] Test full appointment booking flow

---

## Next Steps

1. **Complete webhook configuration** (Step 2)
2. **Test end-to-end flow** (Steps 3-5)
3. **Implement bot conversation logic** (if not already done)
4. **Add payment method to Facebook Business** (to enable business-initiated conversations)
5. **Plan multi-tenant migration** (see requirements document)

---

## Support Resources

- **WhatsApp Business API Documentation**: https://developers.facebook.com/docs/whatsapp/cloud-api
- **Meta Developer Console**: https://developers.facebook.com/apps/1167358032149359/
- **ngrok Documentation**: https://ngrok.com/docs
- **Project Requirements**: `.kiro/specs/whatsapp-multi-tenant-config/requirements.md`

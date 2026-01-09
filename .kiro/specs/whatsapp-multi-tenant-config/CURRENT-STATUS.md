# WhatsApp Configuration - Current Status

## ✅ Completed Tasks

### 1. Fixed Critical Bug

- **Issue**: `WhatsAppSignatureGuard` was looking for `WHATSAPP_APP_SECRET` but `.env` had `WHATSAPP_WEBHOOK_SECRET`
- **Fix**: Updated guard to use correct environment variable name
- **File**: `apps/backend/src/conversation/presentation/guards/whatsapp-signature.ts`
- **Verification**: Code compiles successfully ✅

### 2. Updated Requirements Document

- **File**: `.kiro/specs/whatsapp-multi-tenant-config/requirements.md`
- **Added**: "Immediate Configuration Requirements" section
- **Documented**: Current state, issues, and testing checklist

### 3. Created Setup Guide

- **File**: `docs/WHATSAPP-REAL-NUMBER-SETUP.md`
- **Content**: Step-by-step guide for webhook configuration and testing
- **Includes**: Troubleshooting, environment variables reference, and checklist

---

## 🔄 Next Steps (User Action Required)

### Step 1: Update Webhook URL in Facebook Developer Console

**Current Situation**:

- Old webhook URL in Facebook: `https://54b8f59f4708.ngrok-free.app/api/webhooks/whatsapp`
- New ngrok URL: `https://12e6d1fbf5c6.ngrok-free.app`

**Action Required**:

1. Go to: https://developers.facebook.com/apps/1167358032149359/use_cases/customize/wa-settings/
2. Click on "URL de devolución de llamada" textbox
3. Clear current URL and enter: `https://12e6d1fbf5c6.ngrok-free.app/api/webhooks/whatsapp`
4. Click "Verificar y guardar" button
5. Facebook will verify the webhook and save the configuration

**What to expect**:

- Facebook sends GET request to your webhook
- Backend validates `hub.verify_token` (matches `WHATSAPP_WEBHOOK_VERIFY_TOKEN` in `.env`)
- Backend responds with `hub.challenge`
- Facebook confirms webhook is working ✅

### Step 2: Restart Backend Server

```bash
# Stop current server (Ctrl+C)
pnpm dev:backend
```

### Step 3: Test Webhook

1. Send a WhatsApp message to: **+1 809 798 2896**
2. Check backend logs for:
   ```
   [WebhookController] Received WhatsApp webhook
   [WebhookController] Processing message from: +1234567890
   ```
3. Verify bot responds with welcome message

---

## 📋 Configuration Summary

### Real WhatsApp Business Number

- **Phone**: +1 809 798 2896 (Dominican Republic)
- **Phone Number ID**: 853410294532655
- **Business Account ID**: 1635138637494802
- **App ID**: 1167358032149359

### Environment Variables (`.env`)

```bash
WHATSAPP_PROVIDER=meta
WHATSAPP_API_URL=https://graph.facebook.com/v22.0/853410294532655/
WHATSAPP_ACCESS_TOKEN=[permanent token configured]
WHATSAPP_PHONE_NUMBER_ID=853410294532655
WHATSAPP_BUSINESS_ACCOUNT_ID=1635138637494802
WHATSAPP_WEBHOOK_VERIFY_TOKEN=0506e8cfa7196a698891348fb6a259bbfce804a438eaf78a56abe0af3deb60e7
WHATSAPP_WEBHOOK_SECRET=fdc29afce904d950561314b9f2240bd9
```

### Webhook Configuration

- **Endpoint**: `/api/webhooks/whatsapp`
- **Full URL**: `https://12e6d1fbf5c6.ngrok-free.app/api/webhooks/whatsapp`
- **Verify Token**: `0506e8cfa7196a698891348fb6a259bbfce804a438eaf78a56abe0af3deb60e7`
- **Webhook Secret**: `fdc29afce904d950561314b9f2240bd9` (App Secret from Facebook)

---

## 🔍 Testing Checklist

- [x] Fix environment variable bug ✅
- [x] Verify code compiles ✅
- [x] Create setup documentation ✅
- [ ] Update webhook URL in Facebook Developer Console
- [ ] Restart backend server
- [ ] Send test message from WhatsApp
- [ ] Verify webhook receives message
- [ ] Verify signature validation passes
- [ ] Verify bot responds with welcome message
- [ ] Test interactive buttons
- [ ] Test full appointment booking flow

---

## 📚 Documentation References

1. **Setup Guide**: `docs/WHATSAPP-REAL-NUMBER-SETUP.md`
   - Complete step-by-step instructions
   - Troubleshooting guide
   - Environment variables reference

2. **Requirements Document**: `.kiro/specs/whatsapp-multi-tenant-config/requirements.md`
   - Immediate configuration requirements
   - Future multi-tenant requirements
   - User stories and acceptance criteria

3. **Twilio Alternative** (for reference): `docs/TWILIO-WHATSAPP-SETUP.md`
   - Alternative development setup
   - Not needed now that real number is configured

---

## 🚀 Future Work (Multi-Tenant)

**Current State**: Single-tenant configuration (one business, one WhatsApp number)

**Future Requirements** (from requirements.md):

1. Each business configures own WhatsApp credentials
2. Unique webhook URL per business: `/api/webhooks/whatsapp/{businessId}`
3. Business-specific webhook secret validation
4. Bot configuration per business (messages, buttons, language)
5. Multi-tenant isolation and security
6. Migration from single-tenant to multi-tenant

**See**: `.kiro/specs/whatsapp-multi-tenant-config/requirements.md` for complete details

---

## 🐛 Known Issues

### None Currently

All critical issues have been resolved:

- ✅ Environment variable mismatch fixed
- ✅ Code compiles successfully
- ✅ Documentation created

---

## 💡 Important Notes

### Access Token

- **Type**: Permanent (does not expire)
- **Permissions**: `whatsapp_business_messaging`, `whatsapp_business_management`
- **If invalid**: Generate new token in Facebook Developer Console

### Webhook Secrets

- **Verify Token**: Used for webhook verification (GET request)
- **Webhook Secret**: Used for signature validation (POST request)
- **Different values**: Don't confuse them!

### ngrok Limitations

- URL changes on restart (unless paid plan)
- Must update webhook URL in Facebook each time
- Consider permanent domain for production

### Rate Limits

- Free tier: 1,000 business-initiated conversations/month
- Customer-initiated: Unlimited (free)
- Message rate: 80 messages/second/phone number

---

## 📞 Support

If you encounter issues:

1. **Check backend logs** for detailed error messages
2. **Verify environment variables** match Facebook configuration
3. **Test webhook manually** with curl (see setup guide)
4. **Review documentation** in `docs/WHATSAPP-REAL-NUMBER-SETUP.md`
5. **Check Facebook Developer Console** for webhook status

---

**Last Updated**: December 18, 2024
**Status**: Ready for webhook configuration and testing

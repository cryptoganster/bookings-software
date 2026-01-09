# WhatsApp Business API - Setup Guide

**Audience:** Developers setting up WhatsApp integration  
**Time Required:** 30-60 minutes  
**Prerequisites:** Meta/Facebook account

---

## Overview

This guide walks you through setting up WhatsApp Business API integration for the conversation system. You'll learn how to:

1. Create and configure a Meta Developer account
2. Set up WhatsApp Business API
3. Obtain necessary credentials
4. Configure webhooks
5. Test the integration without real phone numbers

---

## Part 1: Meta Developer Account Setup

### Step 1: Create Meta Developer Account

1. Visit https://developers.facebook.com
2. Click "Get Started" or "Log In"
3. Log in with your Facebook account (or create one)
4. Complete the developer registration:
   - Accept Meta Platform Terms
   - Accept Developer Policies
   - Verify your email address
5. Complete two-factor authentication (required)

**Time:** 5-10 minutes

---

## Part 2: Create WhatsApp Business App

### Step 2: Create New App

1. Go to Meta for Developers Dashboard
2. Click "Create App" button (top right)
3. Select app type: **"Business"**
4. Fill in app details:
   - **App Name:** "Bookings System - Dev" (or your preferred name)
   - **App Contact Email:** Your email
   - **Business Account:** Create new or select existing
5. Click "Create App"
6. Complete security check if prompted

### Step 3: Add WhatsApp Product

1. In your app dashboard, find "Add Products" section
2. Locate "WhatsApp" product
3. Click "Set Up" button
4. WhatsApp will be added to your app

**Time:** 5 minutes

---

## Part 3: Configure WhatsApp Business Account

### Step 4: Set Up Business Account

1. Navigate to **WhatsApp → Getting Started** in left sidebar
2. Click "Create WhatsApp Business Account" or link existing
3. Complete business information:
   - Business name
   - Business category
   - Business description
4. Add a phone number for testing:
   - **Option A:** Use Meta's test number (recommended for development)
   - **Option B:** Add your own phone number (requires verification)

### Step 5: Verify Phone Number (if using own number)

1. Enter phone number in international format (+1234567890)
2. Choose verification method: SMS or Voice Call
3. Enter verification code received
4. Phone number is now verified and ready

**Note:** For development, Meta provides free test numbers that don't require real phones.

**Time:** 10 minutes

---

## Part 4: Obtain API Credentials

### Step 6: Get Temporary Access Token (Development)

1. Go to **WhatsApp → API Setup** in left sidebar
2. Scroll to "Temporary access token" section
3. Click "Generate Token" button
4. Copy the token (valid for 24 hours)
5. Save to `apps/backend/.env` as `WHATSAPP_ACCESS_TOKEN`

**Important:** Temporary tokens expire after 24 hours. For production, you'll need a permanent token (see Part 7).

### Step 7: Get Phone Number ID

1. In **WhatsApp → API Setup** page
2. Find "Phone number ID" field
3. Copy the ID (format: 15-digit number)
4. Save to `apps/backend/.env` as `WHATSAPP_PHONE_NUMBER_ID`
5. Update `WHATSAPP_API_URL` with this ID:
   ```
   WHATSAPP_API_URL=https://graph.facebook.com/v22.0/{PHONE_NUMBER_ID}/
   ```

### Step 8: Get Business Account ID

1. In **WhatsApp → API Setup** page
2. Find "WhatsApp Business Account ID" field
3. Copy the ID
4. Save to `apps/backend/.env` as `WHATSAPP_BUSINESS_ACCOUNT_ID`

### Step 9: Get App Secret

1. Go to **App Dashboard → Settings → Basic**
2. Find "App Secret" field
3. Click "Show" button
4. Copy the secret
5. Save to `apps/backend/.env` as `WHATSAPP_WEBHOOK_SECRET`

**Time:** 5 minutes

---

## Part 5: Configure Webhook

### Step 10: Generate Webhook Verify Token

1. Generate a secure random string:
   ```bash
   openssl rand -hex 32
   ```
2. Save to `apps/backend/.env` as `WHATSAPP_WEBHOOK_VERIFY_TOKEN`
3. Keep this secret - you'll use it in Meta dashboard

### Step 11: Expose Local Server (Development)

For local development, you need to expose your local server to the internet:

**Option A: Using ngrok (Recommended)**

```bash
# Install ngrok: https://ngrok.com/download
ngrok http 3005

# Copy the HTTPS URL (e.g., https://abc123.ngrok.io)
```

**Option B: Using localtunnel**

```bash
npm install -g localtunnel
lt --port 3005

# Copy the URL provided
```

**Option C: Using Cloudflare Tunnel**

```bash
# Install: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/
cloudflared tunnel --url http://localhost:3005
```

### Step 12: Configure Webhook in Meta Dashboard

1. Go to **WhatsApp → Configuration** in left sidebar
2. Find "Webhook" section
3. Click "Edit" button
4. Enter webhook details:
   - **Callback URL:** `https://your-ngrok-url.ngrok.io/api/webhooks/whatsapp`
   - **Verify Token:** Paste the token from Step 10
5. Click "Verify and Save"
6. Meta will send a GET request to verify your endpoint

### Step 13: Subscribe to Webhook Fields

1. In the same "Webhook" section
2. Click "Manage" button
3. Subscribe to these fields:
   - ✅ **messages** (required for receiving messages)
   - ✅ **message_status** (optional, for delivery status)
4. Click "Save"

**Time:** 10 minutes

---

## Part 6: Test the Integration

### Step 14: Test Webhook Verification

1. Start your backend server:

   ```bash
   cd apps/backend
   pnpm dev
   ```

2. Check server logs for webhook verification:

   ```
   [INFO] Webhook verified successfully
   ```

3. If verification fails:
   - Check `WHATSAPP_WEBHOOK_VERIFY_TOKEN` matches in .env and Meta dashboard
   - Ensure ngrok/tunnel is running
   - Check server is accessible at webhook URL

### Step 15: Send Test Message

1. In **WhatsApp → API Setup** page
2. Find "Send and receive messages" section
3. Select a test phone number from dropdown
4. Enter a test message
5. Click "Send Message"
6. Check your backend logs for incoming webhook

### Step 16: Receive Test Message

1. Use WhatsApp app on test phone number
2. Send a message to your business number
3. Check backend logs for incoming message webhook
4. Verify message stored in database

**Time:** 10 minutes

---

## Part 7: Production Setup (Optional)

### Step 17: Complete Business Verification

**Required for production use and higher rate limits.**

1. Go to **Business Settings** in Meta Business Suite
2. Navigate to **Security Center → Business Verification**
3. Submit required documents:
   - Business registration documents
   - Tax ID or business license
   - Proof of address
4. Wait for approval (typically 1-2 weeks)

### Step 18: Generate Permanent Access Token

1. Go to **Business Settings → Users → System Users**
2. Click "Add" to create new System User
3. Enter name (e.g., "WhatsApp API Production")
4. Assign System User to your WhatsApp app
5. Generate token:
   - Select app
   - Choose permissions: `whatsapp_business_messaging`, `whatsapp_business_management`
   - Click "Generate Token"
6. Copy token and save securely (use secrets manager in production)
7. Update `WHATSAPP_ACCESS_TOKEN` in production environment

### Step 19: Configure Production Webhook

1. Set up production domain with SSL certificate
2. Update webhook URL in Meta dashboard to production URL
3. Test webhook with production environment
4. Monitor webhook delivery in Meta dashboard

**Time:** 15 minutes (plus verification wait time)

---

## Part 8: Testing Without Real Phone Numbers

### Option 1: Use Meta's Test Numbers (Recommended)

Meta provides free test phone numbers for development:

1. Go to **WhatsApp → API Setup**
2. Find "Send and receive messages" section
3. Test numbers are listed in dropdown
4. These numbers:
   - ✅ Work in development mode only
   - ✅ Can send/receive messages
   - ✅ No cost or real phone required
   - ❌ Cannot be used in production

### Option 2: Use Mock WhatsApp Client (Unit Tests)

For unit tests, use the mock client:

```typescript
// apps/backend/src/conversation/infra/external/__mocks__/mock-whatsapp-client.ts

export class MockWhatsAppClient implements IWhatsAppClient {
  async sendMessage(
    to: string,
    message: string,
  ): Promise<{ messageId: string }> {
    return { messageId: "mock-message-id" };
  }

  async sendMedia(
    to: string,
    mediaUrl: string,
    caption: string,
  ): Promise<{ messageId: string }> {
    return { messageId: "mock-media-message-id" };
  }
}
```

Usage in tests:

```typescript
const mockClient = new MockWhatsAppClient();
const handler = new SendMessageHandler(mockClient);
```

### Option 3: WhatsApp API Simulator (Integration Tests)

For integration tests, use a local simulator:

```typescript
// Create simple HTTP server simulating WhatsApp API
// Responds to POST /messages with mock success response
// Useful for testing without hitting real API
```

---

## Environment Variables Reference

Complete `.env` configuration:

```bash
# WhatsApp API Base URL
WHATSAPP_API_URL=https://graph.facebook.com/v22.0/{PHONE_NUMBER_ID}/

# Access Token (temporary for dev, permanent for prod)
WHATSAPP_ACCESS_TOKEN=your-access-token-here

# Phone Number ID (from API Setup page)
WHATSAPP_PHONE_NUMBER_ID=your-phone-number-id

# Business Account ID (from API Setup page)
WHATSAPP_BUSINESS_ACCOUNT_ID=your-business-account-id

# Webhook Verify Token (generate random string)
WHATSAPP_WEBHOOK_VERIFY_TOKEN=your-secure-random-token

# App Secret (from App Settings → Basic)
WHATSAPP_WEBHOOK_SECRET=your-app-secret
```

---

## Troubleshooting

### Issue: Webhook Verification Fails

**Symptoms:** Meta shows "Verification failed" error

**Solutions:**

1. Check `WHATSAPP_WEBHOOK_VERIFY_TOKEN` matches in .env and Meta dashboard
2. Ensure server is running and accessible
3. Check ngrok/tunnel is active
4. Verify webhook endpoint returns correct response:
   ```typescript
   // GET /api/webhooks/whatsapp?hub.mode=subscribe&hub.challenge=123&hub.verify_token=your-token
   // Should return: hub.challenge value
   ```

### Issue: Messages Not Received

**Symptoms:** Sent messages don't trigger webhook

**Solutions:**

1. Check webhook subscriptions include "messages" field
2. Verify webhook URL is correct and accessible
3. Check server logs for incoming requests
4. Test webhook with Meta's testing tool
5. Ensure phone number is verified

### Issue: "Invalid Access Token" Error

**Symptoms:** API calls return 401 or 403 error

**Solutions:**

1. Check token hasn't expired (temporary tokens last 24 hours)
2. Verify token copied correctly (no extra spaces)
3. Ensure token has correct permissions
4. For production, use permanent token from System User

### Issue: Rate Limit Exceeded

**Symptoms:** API returns 429 error

**Solutions:**

1. Check current rate limits in Meta dashboard
2. Implement exponential backoff retry logic
3. For production, complete Business Verification for higher limits
4. Consider message queuing to avoid bursts

### Issue: Test Numbers Not Working

**Symptoms:** Can't send/receive with test numbers

**Solutions:**

1. Ensure app is in development mode
2. Test numbers only work in development environment
3. Check test number is selected in API Setup
4. Verify phone number is added to app

---

## Security Best Practices

1. **Never commit credentials to version control**
   - Use `.env` files (already in `.gitignore`)
   - Use secrets manager in production (AWS Secrets Manager, Azure Key Vault, etc.)

2. **Rotate tokens regularly**
   - Generate new permanent tokens every 90 days
   - Revoke old tokens after rotation

3. **Validate webhook signatures**
   - Always verify `X-Hub-Signature-256` header
   - Reject webhooks with invalid signatures

4. **Use HTTPS only**
   - Never use HTTP for webhooks
   - Ensure SSL certificate is valid

5. **Implement rate limiting**
   - Protect webhook endpoint from abuse
   - Limit API calls to avoid rate limits

6. **Monitor and alert**
   - Track webhook delivery failures
   - Alert on API errors
   - Monitor token expiration

---

## Additional Resources

- **Official Documentation:** https://developers.facebook.com/docs/whatsapp/cloud-api
- **API Reference:** https://developers.facebook.com/docs/whatsapp/cloud-api/reference
- **Webhook Reference:** https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks
- **Rate Limits:** https://developers.facebook.com/docs/whatsapp/cloud-api/overview#throughput
- **Business Verification:** https://www.facebook.com/business/help/2058515294227817
- **Support:** https://developers.facebook.com/support/bugs/

---

## Next Steps

After completing this setup:

1. ✅ Verify all environment variables are set
2. ✅ Test sending and receiving messages
3. ✅ Implement webhook signature validation
4. ✅ Proceed with Phase 1: WebSocket Infrastructure (see tasks.md)

**Setup Complete!** You're now ready to implement conversation enhancements.

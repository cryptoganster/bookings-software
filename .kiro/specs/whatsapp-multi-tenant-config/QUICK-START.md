# WhatsApp Configuration - Quick Start

## 🎯 What You Need to Do Right Now

### 1. Update Webhook URL in Facebook (2 minutes)

**Go to**: https://developers.facebook.com/apps/1167358032149359/use_cases/customize/wa-settings/

**Steps**:

1. Click "URL de devolución de llamada" textbox
2. Replace with: `https://12e6d1fbf5c6.ngrok-free.app/api/webhooks/whatsapp`
3. Click "Verificar y guardar"
4. Wait for green checkmark ✅

### 2. Restart Backend (30 seconds)

```bash
# In terminal where backend is running
Ctrl+C

# Restart
pnpm dev:backend
```

### 3. Test It (1 minute)

1. Open WhatsApp on your phone
2. Send message to: **+1 809 798 2896**
3. Type: "Hola"
4. Wait for bot response

**Expected Response**:

```
¡Hola! 👋 Bienvenido a [Nombre del Negocio]

¿Qué servicio deseas agendar?
[Corte de Pelo] [Lavado] [Tinte] [Consulta al Admin]
```

---

## ✅ What's Already Done

- ✅ Fixed critical bug in `WhatsAppSignatureGuard`
- ✅ Code compiles successfully
- ✅ Environment variables configured correctly
- ✅ Real WhatsApp number configured (+1 809 798 2896)
- ✅ Permanent access token set
- ✅ Documentation created

---

## 🆘 If Something Goes Wrong

### Bot doesn't respond?

**Check backend logs**:

```bash
# Look for this in terminal:
[WebhookController] Received WhatsApp webhook
```

**If you don't see it**:

- Webhook URL might be wrong in Facebook
- ngrok might have restarted (URL changed)

### Signature validation fails?

**Check**:

- `WHATSAPP_WEBHOOK_SECRET` in `.env` matches App Secret in Facebook
- Restart backend after any `.env` changes

### Need more help?

**Read full guide**: `docs/WHATSAPP-REAL-NUMBER-SETUP.md`

---

## 📱 Your WhatsApp Number

**Phone**: +1 809 798 2896  
**Phone Number ID**: 853410294532655  
**Business Account ID**: 1635138637494802

---

## 🔗 Quick Links

- **Facebook Developer Console**: https://developers.facebook.com/apps/1167358032149359/
- **Webhook Settings**: https://developers.facebook.com/apps/1167358032149359/use_cases/customize/wa-settings/
- **Full Setup Guide**: `docs/WHATSAPP-REAL-NUMBER-SETUP.md`
- **Requirements Doc**: `.kiro/specs/whatsapp-multi-tenant-config/requirements.md`

---

## 💡 Pro Tips

1. **ngrok URL changes?** Update webhook URL in Facebook each time
2. **Testing?** Use your personal WhatsApp to send messages
3. **Logs?** Keep terminal visible to see webhook requests
4. **Errors?** Check backend logs first, then Facebook Developer Console

---

**Total Time**: ~5 minutes to get everything working! 🚀

# Backend - Bookings System

Sistema de reservas multi-tenant vía WhatsApp Business API.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env with your credentials

# Run database migrations
npm run migration:run

# Start development server
npm run start:dev
```

## 📋 Environment Variables

### Required Variables

#### Application

- `NODE_ENV` - Environment (development, production)
- `PORT` - Server port (default: 3005)

#### Database

- `DB_HOST` - PostgreSQL host
- `DB_PORT` - PostgreSQL port (default: 5432)
- `DB_USERNAME` - Database username
- `DB_PASSWORD` - Database password
- `DB_DATABASE` - Database name

#### JWT Authentication

- `JWT_SECRET` - Secret key for JWT tokens (generate with: `openssl rand -base64 32`)
- `JWT_EXPIRATION` - Token expiration time (e.g., "1d", "7d")

#### WhatsApp Configuration

##### Provider Selection

- `WHATSAPP_PROVIDER` - WhatsApp provider to use
  - `meta` (default) - WhatsApp Business API oficial de Meta
  - `twilio` - Twilio WhatsApp Sandbox (recommended for development)

##### Meta WhatsApp Business API (when WHATSAPP_PROVIDER=meta)

- `WHATSAPP_API_URL` - WhatsApp API base URL
  - Format: `https://graph.facebook.com/v22.0/{PHONE_NUMBER_ID}/`
  - Get PHONE_NUMBER_ID from Meta Dashboard → WhatsApp → API Setup
- `WHATSAPP_ACCESS_TOKEN` - Access token for WhatsApp API
  - **Development**: Use temporary token (expires in 24 hours) or permanent token
  - **Production**: Generate permanent token via System User
  - Get from: Meta Dashboard → WhatsApp → API Setup → "Access token"
- `WHATSAPP_PHONE_NUMBER_ID` - Phone number ID assigned by Meta
  - Get from: Meta Dashboard → WhatsApp → API Setup → "Phone number ID"
  - This is NOT your phone number, it's an ID
- `WHATSAPP_BUSINESS_ACCOUNT_ID` - WhatsApp Business Account ID
  - Get from: Meta Dashboard → WhatsApp → API Setup
- `WHATSAPP_WEBHOOK_VERIFY_TOKEN` - Token for webhook verification
  - Generate secure random string: `openssl rand -hex 32`
  - Use same token when configuring webhook in Meta Dashboard
- `WHATSAPP_WEBHOOK_SECRET` - App Secret for webhook signature validation
  - Get from: Meta Dashboard → App Settings → Basic → "App Secret"

##### Twilio WhatsApp Sandbox (when WHATSAPP_PROVIDER=twilio)

- `TWILIO_ACCOUNT_SID` - Twilio Account SID
- `TWILIO_AUTH_TOKEN` - Twilio Auth Token
- `TWILIO_WHATSAPP_FROM` - Twilio WhatsApp sandbox number (e.g., +14155238886)

#### Business Configuration

- `DEFAULT_BUSINESS_ID` - Default business UUID for webhook processing (single-tenant MVP)

### Optional Variables

- `LOG_LEVEL` - Logging level (error, warn, info, debug)
- `REDIS_HOST` - Redis host (for WebSocket scaling)
- `REDIS_PORT` - Redis port
- `REDIS_PASSWORD` - Redis password

## 🔧 WhatsApp Setup Guide

### Option 1: Meta WhatsApp Business API (Production)

1. **Create Meta Developer Account**
   - Visit https://developers.facebook.com
   - Sign up or log in with Facebook account

2. **Create WhatsApp Business App**
   - Go to Meta for Developers Dashboard
   - Click "Create App" → Select "Business" type
   - Add WhatsApp product to your app

3. **Get Credentials**
   - Navigate to WhatsApp → API Setup
   - Copy Phone Number ID
   - Copy WhatsApp Business Account ID
   - Generate Access Token (temporary or permanent)

4. **Configure Webhook**
   - Go to WhatsApp → Configuration
   - Set Callback URL: `https://your-domain.com/api/webhooks/whatsapp`
   - Set Verify Token (generate with: `openssl rand -hex 32`)
   - Subscribe to fields: `messages`, `message_status`

5. **Update .env**
   ```env
   WHATSAPP_PROVIDER=meta
   WHATSAPP_API_URL=https://graph.facebook.com/v22.0/YOUR_PHONE_NUMBER_ID/
   WHATSAPP_ACCESS_TOKEN=your-access-token
   WHATSAPP_PHONE_NUMBER_ID=your-phone-number-id
   WHATSAPP_BUSINESS_ACCOUNT_ID=your-business-account-id
   WHATSAPP_WEBHOOK_VERIFY_TOKEN=your-verify-token
   WHATSAPP_WEBHOOK_SECRET=your-app-secret
   ```

### Option 2: Twilio WhatsApp Sandbox (Development)

1. **Create Twilio Account**
   - Visit https://www.twilio.com/console
   - Sign up for free account

2. **Setup WhatsApp Sandbox**
   - Go to Messaging → Try it out → Send a WhatsApp message
   - Send "join <your-code>" to the sandbox number from your WhatsApp
   - Get credentials from Twilio Console

3. **Update .env**
   ```env
   WHATSAPP_PROVIDER=twilio
   TWILIO_ACCOUNT_SID=your-account-sid
   TWILIO_AUTH_TOKEN=your-auth-token
   TWILIO_WHATSAPP_FROM=+14155238886
   ```

### Testing with Test Numbers (Meta)

Meta provides free test phone numbers for development:

1. Go to Meta Dashboard → WhatsApp → API Setup
2. Find "Send and receive messages" section
3. Use provided test number (e.g., +1 555 164 6083)
4. Add your phone number to allowed recipients list
5. Test sending/receiving messages

**Limitations:**

- Maximum 5 recipients
- Development mode only
- No cost

## 🔍 Troubleshooting

### WhatsApp Connection Issues

**Problem**: Webhook not receiving messages

- ✅ Verify webhook URL is publicly accessible (use ngrok for local testing)
- ✅ Check webhook is verified in Meta Dashboard (green checkmark)
- ✅ Verify `WHATSAPP_WEBHOOK_VERIFY_TOKEN` matches Meta configuration
- ✅ Check webhook subscriptions include `messages` field
- ✅ Review backend logs for webhook errors

**Problem**: Messages not sending

- ✅ Verify `WHATSAPP_ACCESS_TOKEN` is valid (not expired)
- ✅ Check `WHATSAPP_PHONE_NUMBER_ID` is correct
- ✅ Verify recipient number is in allowed list (for test numbers)
- ✅ Check API rate limits not exceeded
- ✅ Review backend logs for API errors

**Problem**: Invalid signature errors

- ✅ Verify `WHATSAPP_WEBHOOK_SECRET` matches App Secret in Meta Dashboard
- ✅ Check webhook payload is not modified in transit
- ✅ Ensure webhook endpoint validates signature correctly

### Database Issues

**Problem**: Connection refused

- ✅ Verify PostgreSQL is running: `pg_isready`
- ✅ Check database credentials in .env
- ✅ Verify database exists: `psql -l`

**Problem**: Migration errors

- ✅ Check migration files are in correct order
- ✅ Verify database schema is clean
- ✅ Run migrations manually: `npm run migration:run`

### JWT Issues

**Problem**: Token validation fails

- ✅ Verify `JWT_SECRET` is set and consistent
- ✅ Check token expiration time
- ✅ Ensure token format is correct (Bearer token)

## 📚 Additional Documentation

- [WhatsApp Setup Guide](.kiro/specs/conversation-enhancements/whatsapp-setup-guide.md)
- [Database Migrations](src/database/MIGRATIONS.md)
- [API Documentation](http://localhost:3005/api/docs) (when server is running)

## 🧪 Testing

```bash
# Run all tests
npm test

# Run unit tests
npm run test:unit

# Run integration tests
npm run test:integration

# Run e2e tests
npm run test:e2e

# Run tests with coverage
npm run test:cov
```

## 📦 Scripts

```bash
# Development
npm run start:dev          # Start with hot reload
npm run start:debug        # Start with debugger

# Production
npm run build              # Build for production
npm run start:prod         # Start production server

# Database
npm run migration:generate # Generate new migration
npm run migration:run      # Run pending migrations
npm run migration:revert   # Revert last migration
npm run seed:run           # Run database seeds

# Code Quality
npm run lint               # Run ESLint
npm run format             # Format code with Prettier
npm run type-check         # Check TypeScript types
```

## 🏗️ Architecture

This backend follows Clean Architecture + DDD + CQRS:

```
src/
├── {bounded-context}/
│   ├── domain/           # Business logic, aggregates, entities
│   ├── app/              # Commands, queries, event handlers
│   ├── infra/            # Repositories, external clients
│   └── presentation/     # Controllers, DTOs
├── shared/               # Shared kernel
└── database/             # Migrations, seeds
```

## 📝 License

MIT

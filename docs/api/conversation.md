# Conversation API Documentation

**Version**: 1.0  
**Last Updated**: December 26, 2025  
**Base URL**: `/api`

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Endpoints](#endpoints)
   - [Admin Query Management](#admin-query-management)
     - [Get Pending Admin Queries](#get-pending-admin-queries)
     - [Get Conversation](#get-conversation)
     - [Get Conversation Messages](#get-conversation-messages)
     - [Respond to Admin Query](#respond-to-admin-query)
   - [WhatsApp Webhook](#whatsapp-webhook)
     - [Verify Webhook (GET)](#verify-webhook-get)
     - [Receive Messages (POST)](#receive-messages-post)
4. [Webhook Security](#webhook-security)
5. [Error Codes](#error-codes)
6. [Data Models](#data-models)
7. [WhatsApp Integration](#whatsapp-integration)
8. [Changelog](#changelog)

---

## Overview

The Conversation API manages WhatsApp Business integration and admin query handling. It provides endpoints for:

- Receiving and processing WhatsApp messages via webhooks
- Managing admin queries from customers
- Viewing conversation history
- Responding to customer inquiries

**Key Capabilities**:

- Real-time WhatsApp message processing
- Admin query management
- Conversation history tracking
- Automated and manual responses
- Webhook signature verification

**Related APIs**:

- [Booking API](./booking.md) - Appointment management via WhatsApp
- [Customer API](./customer.md) - Customer identification and management

---

## Authentication

### Admin Query Endpoints

All admin query endpoints require JWT authentication via Bearer token.

```http
Authorization: Bearer <jwt_token>
```

### WhatsApp Webhook Endpoints

Webhook endpoints use signature verification instead of JWT authentication. See [Webhook Security](#webhook-security) for details.

---

## Endpoints

### Admin Query Management

#### Get Pending Admin Queries

Retrieves all conversations awaiting admin response for a specific business.

**Endpoint**: `GET /api/admin-queries/pending`

**Authentication**: Required (JWT)

**Query Parameters**:

- `businessId` (string, required): Business UUID

**Example Request**:

```http
GET /api/admin-queries/pending?businessId=550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer <jwt_token>
```

**Response**: `200 OK`

```json
[
  {
    "id": "770e8400-e29b-41d4-a716-446655440001",
    "businessId": "550e8400-e29b-41d4-a716-446655440000",
    "customerId": "880e8400-e29b-41d4-a716-446655440002",
    "customerName": "Juan Pérez",
    "customerPhone": "+18095551234",
    "status": "AWAITING_ADMIN",
    "lastMessageAt": "2025-12-26T14:30:00.000Z",
    "createdAt": "2025-12-26T10:00:00.000Z"
  },
  {
    "id": "990e8400-e29b-41d4-a716-446655440003",
    "businessId": "550e8400-e29b-41d4-a716-446655440000",
    "customerId": "aa0e8400-e29b-41d4-a716-446655440004",
    "customerName": null,
    "customerPhone": "+18095555678",
    "status": "AWAITING_ADMIN",
    "lastMessageAt": "2025-12-26T15:00:00.000Z",
    "createdAt": "2025-12-26T14:45:00.000Z"
  }
]
```

**Notes**:

- Returns empty array `[]` if no pending queries
- Results are ordered by `lastMessageAt` (most recent first)
- `customerName` may be `null` for anonymous customers
- Only returns conversations with status `AWAITING_ADMIN`

**Error Responses**:

```json
// 400 Bad Request - Invalid businessId
{
  "statusCode": 400,
  "message": [
    "businessId must be a UUID"
  ],
  "error": "Bad Request"
}

// 401 Unauthorized
{
  "statusCode": 401,
  "message": "Unauthorized"
}

// 403 Forbidden - Not the business owner
{
  "statusCode": 403,
  "message": "You do not have permission to access this business",
  "error": "Forbidden"
}
```

---

#### Get Conversation

Retrieves a specific conversation by ID.

**Endpoint**: `GET /api/admin-queries/:id`

**Authentication**: Required (JWT)

**Path Parameters**:

- `id` (string, required): Conversation UUID

**Example Request**:

```http
GET /api/admin-queries/770e8400-e29b-41d4-a716-446655440001
Authorization: Bearer <jwt_token>
```

**Response**: `200 OK`

```json
{
  "id": "770e8400-e29b-41d4-a716-446655440001",
  "businessId": "550e8400-e29b-41d4-a716-446655440000",
  "customerId": "880e8400-e29b-41d4-a716-446655440002",
  "customerName": "Juan Pérez",
  "customerPhone": "+18095551234",
  "status": "AWAITING_ADMIN",
  "lastMessageAt": "2025-12-26T14:30:00.000Z",
  "createdAt": "2025-12-26T10:00:00.000Z"
}
```

**Error Responses**:

```json
// 400 Bad Request - Invalid UUID
{
  "statusCode": 400,
  "message": [
    "id must be a UUID"
  ],
  "error": "Bad Request"
}

// 401 Unauthorized
{
  "statusCode": 401,
  "message": "Unauthorized"
}

// 403 Forbidden
{
  "statusCode": 403,
  "message": "You do not have permission to access this conversation",
  "error": "Forbidden"
}

// 404 Not Found
{
  "statusCode": 404,
  "message": "Conversation with id 770e8400-e29b-41d4-a716-446655440001 not found",
  "error": "Not Found"
}
```

---

#### Get Conversation Messages

Retrieves the complete message history for a conversation.

**Endpoint**: `GET /api/admin-queries/:id/messages`

**Authentication**: Required (JWT)

**Path Parameters**:

- `id` (string, required): Conversation UUID

**Example Request**:

```http
GET /api/admin-queries/770e8400-e29b-41d4-a716-446655440001/messages
Authorization: Bearer <jwt_token>
```

**Response**: `200 OK`

```json
[
  {
    "id": "bb0e8400-e29b-41d4-a716-446655440005",
    "conversationId": "770e8400-e29b-41d4-a716-446655440001",
    "direction": "INBOUND",
    "content": "Hola, necesito información sobre sus servicios",
    "messageType": "TEXT",
    "sentAt": "2025-12-26T10:00:00.000Z",
    "isFromAdmin": false
  },
  {
    "id": "cc0e8400-e29b-41d4-a716-446655440006",
    "conversationId": "770e8400-e29b-41d4-a716-446655440001",
    "direction": "OUTBOUND",
    "content": "¡Hola! Bienvenido a Peluquería Central. ¿Qué servicio deseas agendar?",
    "messageType": "TEXT",
    "sentAt": "2025-12-26T10:00:05.000Z",
    "isFromAdmin": false
  },
  {
    "id": "dd0e8400-e29b-41d4-a716-446655440007",
    "conversationId": "770e8400-e29b-41d4-a716-446655440001",
    "direction": "INBOUND",
    "content": "Consulta al Admin",
    "messageType": "BUTTON",
    "sentAt": "2025-12-26T10:00:15.000Z",
    "isFromAdmin": false
  },
  {
    "id": "ee0e8400-e29b-41d4-a716-446655440008",
    "conversationId": "770e8400-e29b-41d4-a716-446655440001",
    "direction": "INBOUND",
    "content": "¿Hacen tintes para cabello gris?",
    "messageType": "TEXT",
    "sentAt": "2025-12-26T14:30:00.000Z",
    "isFromAdmin": false
  }
]
```

**Notes**:

- Messages are ordered chronologically (oldest first)
- `direction`: `INBOUND` (from customer) or `OUTBOUND` (to customer)
- `messageType`: `TEXT`, `BUTTON`, or `LOCATION`
- `isFromAdmin`: `true` if message was sent by admin, `false` if automated
- Returns empty array `[]` if no messages

**Error Responses**:

```json
// 400 Bad Request
{
  "statusCode": 400,
  "message": [
    "id must be a UUID"
  ],
  "error": "Bad Request"
}

// 401 Unauthorized
{
  "statusCode": 401,
  "message": "Unauthorized"
}

// 403 Forbidden
{
  "statusCode": 403,
  "message": "You do not have permission to access this conversation",
  "error": "Forbidden"
}

// 404 Not Found
{
  "statusCode": 404,
  "message": "Conversation with id 770e8400-e29b-41d4-a716-446655440001 not found",
  "error": "Not Found"
}
```

---

#### Respond to Admin Query

Sends an admin response to a customer query via WhatsApp.

**Endpoint**: `POST /api/admin-queries/:id/respond`

**Authentication**: Required (JWT)

**Path Parameters**:

- `id` (string, required): Conversation UUID

**Request Body**:

```json
{
  "message": "Sí, ofrecemos tintes para cabello gris. Tenemos varias opciones de colores. ¿Te gustaría agendar una cita?"
}
```

**Response**: `200 OK`

```json
{
  "message": "Response sent successfully"
}
```

**Notes**:

- Message is sent immediately to customer via WhatsApp
- Conversation status changes from `AWAITING_ADMIN` to `ACTIVE`
- Message is saved in conversation history with `isFromAdmin: true`
- Maximum message length: 5000 characters
- Supports plain text only (no formatting, emojis allowed)

**Error Responses**:

```json
// 400 Bad Request - Invalid data
{
  "statusCode": 400,
  "message": [
    "message should not be empty",
    "message must be shorter than or equal to 5000 characters"
  ],
  "error": "Bad Request"
}

// 401 Unauthorized
{
  "statusCode": 401,
  "message": "Unauthorized"
}

// 403 Forbidden
{
  "statusCode": 403,
  "message": "You do not have permission to respond to this conversation",
  "error": "Forbidden"
}

// 404 Not Found
{
  "statusCode": 404,
  "message": "Conversation with id 770e8400-e29b-41d4-a716-446655440001 not found",
  "error": "Not Found"
}

// 409 Conflict - Conversation already resolved
{
  "statusCode": 409,
  "message": "Conversation is already resolved",
  "error": "Conflict"
}

// 500 Internal Server Error - WhatsApp API error
{
  "statusCode": 500,
  "message": "Failed to send WhatsApp message",
  "error": "Internal Server Error"
}
```

---

### WhatsApp Webhook

#### Verify Webhook (GET)

WhatsApp sends a GET request to verify the webhook URL during setup.

**Endpoint**: `GET /api/webhooks/whatsapp`

**Authentication**: Signature verification (see [Webhook Security](#webhook-security))

**Query Parameters**:

- `hub.mode` (string): Should be "subscribe"
- `hub.challenge` (string): Random string to echo back
- `hub.verify_token` (string): Verification token configured in WhatsApp Business

**Example Request**:

```http
GET /api/webhooks/whatsapp?hub.mode=subscribe&hub.challenge=1234567890&hub.verify_token=my_verify_token
X-Hub-Signature-256: sha256=...
```

**Response**: `200 OK`

```
1234567890
```

**Notes**:

- Returns the `hub.challenge` value as plain text
- Used only during webhook setup in WhatsApp Business dashboard
- Verify token must match the configured value

**Error Responses**:

```http
// 403 Forbidden - Invalid verify token or signature
HTTP/1.1 403 Forbidden
Content-Type: text/plain

Forbidden
```

---

#### Receive Messages (POST)

Receives incoming WhatsApp messages and processes them.

**Endpoint**: `POST /api/webhooks/whatsapp`

**Authentication**: Signature verification (see [Webhook Security](#webhook-security))

**Request Body**:

```json
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "WHATSAPP_BUSINESS_ACCOUNT_ID",
      "changes": [
        {
          "value": {
            "messaging_product": "whatsapp",
            "metadata": {
              "display_phone_number": "+18095551234",
              "phone_number_id": "PHONE_NUMBER_ID"
            },
            "contacts": [
              {
                "profile": {
                  "name": "Juan Pérez"
                },
                "wa_id": "18095555678"
              }
            ],
            "messages": [
              {
                "from": "18095555678",
                "id": "wamid.HBgNMTgwOTU1NTU2NzgVAgARGBI5QUFEMTA2RjdGNEE0RTAzNjYA",
                "timestamp": "1703595600",
                "text": {
                  "body": "Hola, quiero agendar una cita"
                },
                "type": "text"
              }
            ]
          },
          "field": "messages"
        }
      ]
    }
  ]
}
```

**Response**: `200 OK`

```json
{
  "status": "success"
}
```

**Notes**:

- Always returns `200 OK` to prevent WhatsApp retries
- Processes messages asynchronously
- Supports text messages and interactive button responses
- Automatically identifies or creates customer
- Triggers conversation flow based on message content
- Errors are logged but not returned to WhatsApp

**Message Types Supported**:

1. **Text Message**:

```json
{
  "type": "text",
  "text": {
    "body": "Message content"
  }
}
```

2. **Interactive Button Response**:

```json
{
  "type": "interactive",
  "interactive": {
    "type": "button_reply",
    "button_reply": {
      "id": "button_id",
      "title": "Button Title"
    }
  }
}
```

**Error Responses**:

```json
// 200 OK - Even on error (to prevent retries)
{
  "status": "error",
  "message": "Internal error"
}

// 403 Forbidden - Invalid signature
HTTP/1.1 403 Forbidden
Content-Type: application/json

{
  "statusCode": 403,
  "message": "Invalid webhook signature",
  "error": "Forbidden"
}
```

---

## Webhook Security

### Signature Verification

All webhook requests from WhatsApp include a signature in the `X-Hub-Signature-256` header. The signature must be verified to ensure the request is authentic.

**Verification Process**:

1. Extract the signature from the `X-Hub-Signature-256` header
2. Compute HMAC-SHA256 of the request body using your app secret
3. Compare the computed signature with the received signature
4. Reject the request if signatures don't match

**Example Signature Header**:

```http
X-Hub-Signature-256: sha256=5d41402abc4b2a76b9719d911017c592
```

**Implementation**:

```typescript
import * as crypto from "crypto";

function verifySignature(
  payload: string,
  signature: string,
  appSecret: string,
): boolean {
  const expectedSignature = crypto
    .createHmac("sha256", appSecret)
    .update(payload)
    .digest("hex");

  return signature === `sha256=${expectedSignature}`;
}
```

**Security Best Practices**:

1. ✅ Always verify webhook signatures
2. ✅ Use HTTPS only for webhook URLs
3. ✅ Keep app secret confidential
4. ✅ Rotate app secret periodically
5. ✅ Log failed verification attempts
6. ❌ Never expose webhook URL publicly without signature verification

---

## Error Codes

| Status Code | Error                 | Description                                                    |
| ----------- | --------------------- | -------------------------------------------------------------- |
| 400         | Bad Request           | Invalid request data (validation failed)                       |
| 401         | Unauthorized          | Missing or invalid JWT token                                   |
| 403         | Forbidden             | Invalid webhook signature or insufficient permissions          |
| 404         | Not Found             | Conversation not found                                         |
| 409         | Conflict              | Invalid state transition (e.g., conversation already resolved) |
| 500         | Internal Server Error | WhatsApp API error or unexpected server error                  |

---

## Data Models

### ConversationReadModel

```typescript
{
  id: string; // UUID v4
  businessId: string; // UUID v4
  customerId: string; // UUID v4
  customerName: string | null; // Denormalized from Customer BC (may be null)
  customerPhone: string; // E.164 format (e.g., +18095551234)
  status: string; // 'ACTIVE' | 'AWAITING_ADMIN' | 'RESOLVED'
  lastMessageAt: string; // ISO 8601 (e.g., 2025-12-26T14:30:00.000Z)
  createdAt: string; // ISO 8601
}
```

### MessageReadModel

```typescript
{
  id: string; // UUID v4
  conversationId: string; // UUID v4
  direction: string; // 'INBOUND' | 'OUTBOUND'
  content: string; // Message text content
  messageType: string; // 'TEXT' | 'BUTTON' | 'LOCATION'
  sentAt: string; // ISO 8601 (e.g., 2025-12-26T10:00:00.000Z)
  isFromAdmin: boolean; // true if sent by admin, false if automated
}
```

### RespondToQueryDto

```typescript
{
  message: string; // Required, 1-5000 characters
}
```

### WhatsAppWebhookPayload

```typescript
{
  object: string; // 'whatsapp_business_account'
  entry: Array<{
    id: string; // WhatsApp Business Account ID
    changes: Array<{
      value: {
        messaging_product: string; // 'whatsapp'
        metadata: {
          display_phone_number: string; // E.164 format
          phone_number_id: string; // WhatsApp Phone Number ID
        };
        contacts?: Array<{
          profile: {
            name: string; // Customer name from WhatsApp profile
          };
          wa_id: string; // WhatsApp ID (phone number)
        }>;
        messages?: Array<{
          from: string; // Customer phone number
          id: string; // WhatsApp message ID
          timestamp: string; // Unix timestamp
          text?: {
            body: string; // Message text
          };
          type: string; // 'text' | 'interactive' | ...
          interactive?: {
            type: string; // 'button_reply' | ...
            button_reply?: {
              id: string; // Button ID
              title: string; // Button title
            };
          };
        }>;
      };
      field: string; // 'messages'
    }>;
  }>;
}
```

---

## WhatsApp Integration

### Setup Requirements

1. **WhatsApp Business Account**: Create account at [business.facebook.com](https://business.facebook.com)
2. **WhatsApp Business API Access**: Request API access
3. **Phone Number**: Register and verify a phone number
4. **Webhook URL**: Configure webhook URL in WhatsApp dashboard
5. **Verify Token**: Set a custom verify token
6. **App Secret**: Obtain app secret for signature verification

### Webhook Configuration

**Webhook URL**: `https://your-domain.com/api/webhooks/whatsapp`

**Verify Token**: Custom string (configured in environment variables)

**Subscribed Fields**:

- `messages` - Receive incoming messages

### Message Flow

```
1. Customer sends WhatsApp message
   ↓
2. WhatsApp sends webhook POST request
   ↓
3. System verifies signature
   ↓
4. System identifies/creates customer
   ↓
5. System processes message (automated or admin query)
   ↓
6. System sends response via WhatsApp API
   ↓
7. Customer receives response
```

### Automated vs Admin Responses

**Automated Responses** (handled by system):

- Greeting messages
- Service selection menus
- Date/time selection
- Appointment confirmations
- Appointment reminders

**Admin Responses** (manual):

- Custom inquiries
- Special requests
- Complaints
- General questions

### Rate Limits

WhatsApp Business API has rate limits:

- **Tier 1**: 1,000 unique customers per 24 hours
- **Tier 2**: 10,000 unique customers per 24 hours
- **Tier 3**: 100,000 unique customers per 24 hours

**Note**: Tier upgrades are automatic based on message quality and volume.

---

## Changelog

### Version 1.0 (December 26, 2025)

**Initial Release**:

- Get pending admin queries endpoint
- Get conversation endpoint
- Get conversation messages endpoint
- Respond to admin query endpoint
- WhatsApp webhook verification (GET)
- WhatsApp webhook message reception (POST)
- Signature verification for webhooks
- Support for text and interactive button messages
- Conversation status management
- Message history tracking

---

**Related Documentation**:

- [Booking API](./booking.md) - Appointment management via WhatsApp
- [Customer API](./customer.md) - Customer identification and management
- [WhatsApp Business API Documentation](https://developers.facebook.com/docs/whatsapp/cloud-api)

**Last Updated**: December 26, 2025  
**Version**: 1.0

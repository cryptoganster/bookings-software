---
inclusion: fileMatch
fileMatchPattern: "**/presentation/controllers/**/*.ts,**/shared/api/**/*.ts,**/features/**/*.ts"
---

# API Endpoints

**REST API endpoints and webhooks**

> **Cross-References:**
>
> - [01-product-requirements.md](./01-product-requirements.md) - Product overview
> - [08-cqrs-commands-queries.md](./08-cqrs-commands-queries.md) - Commands and Queries
> - [05-user-flows.md](./05-user-flows.md) - User flows

---

# API Endpoints

Este documento define los endpoints REST del sistema y webhooks externos.

---

## Panel Web - Business Owner

### Autenticación

```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/refresh
POST   /api/auth/logout
```

#### POST /api/auth/register

**Request:**

```json
{
  "email": "owner@example.com",
  "password": "SecurePass123!",
  "name": "Juan Pérez",
  "role": "BUSINESS_OWNER"
}
```

**Response:**

```json
{
  "userId": "uuid",
  "email": "owner@example.com",
  "name": "Juan Pérez"
}
```

#### POST /api/auth/login

**Request:**

```json
{
  "email": "owner@example.com",
  "password": "SecurePass123!"
}
```

**Response:**

```json
{
  "token": "jwt-token",
  "user": {
    "id": "uuid",
    "email": "owner@example.com",
    "name": "Juan Pérez",
    "roles": ["BUSINESS_OWNER"]
  }
}
```

---

### Business Management

```
GET    /api/business
PUT    /api/business
POST   /api/business/whatsapp
```

#### GET /api/business

**Headers:**

```
Authorization: Bearer {jwt-token}
```

**Response:**

```json
{
  "id": "uuid",
  "name": "Peluquería Central",
  "whatsappNumber": "+521234567890",
  "address": {
    "street": "Av. Principal 123",
    "city": "Ciudad de México",
    "state": "CDMX",
    "zipCode": "01000"
  },
  "timezone": "America/Mexico_City",
  "isActive": true
}
```

#### PUT /api/business

**Request:**

```json
{
  "name": "Peluquería Central",
  "address": {
    "street": "Av. Principal 123",
    "city": "Ciudad de México",
    "state": "CDMX",
    "zipCode": "01000"
  },
  "timezone": "America/Mexico_City"
}
```

**Response:**

```json
{
  "success": true
}
```

---

### Offerings

```
GET    /api/offerings
POST   /api/offerings
PUT    /api/offerings/:id
DELETE /api/offerings/:id
```

#### GET /api/offerings

**Response:**

```json
[
  {
    "id": "uuid",
    "name": "Corte de Pelo",
    "duration": 30,
    "maxCapacityPerSlot": 3,
    "maxDailyCapacity": 20,
    "isActive": true
  }
]
```

#### POST /api/offerings

**Request:**

```json
{
  "name": "Corte de Pelo",
  "duration": 30,
  "maxCapacityPerSlot": 3,
  "maxDailyCapacity": 20
}
```

**Response:**

```json
{
  "offeringId": "uuid"
}
```

---

### Schedules

```
GET    /api/schedules
POST   /api/schedules
PUT    /api/schedules/:id
DELETE /api/schedules/:id
```

#### GET /api/schedules

**Response:**

```json
[
  {
    "id": "uuid",
    "dayOfWeek": 1,
    "startTime": "09:00",
    "endTime": "18:00",
    "isActive": true
  }
]
```

#### POST /api/schedules

**Request:**

```json
{
  "dayOfWeek": 1,
  "startTime": "09:00",
  "endTime": "18:00"
}
```

**Response:**

```json
{
  "scheduleId": "uuid"
}
```

---

### Blockouts

```
GET    /api/blockouts
POST   /api/blockouts
DELETE /api/blockouts/:id
```

#### GET /api/blockouts

**Response:**

```json
[
  {
    "id": "uuid",
    "startDate": "2024-12-25",
    "endDate": "2024-12-25",
    "reason": "Navidad"
  }
]
```

#### POST /api/blockouts

**Request:**

```json
{
  "startDate": "2024-12-25",
  "endDate": "2024-12-25",
  "reason": "Navidad"
}
```

**Response:**

```json
{
  "blockoutId": "uuid"
}
```

---

### Appointments

```
GET    /api/appointments
GET    /api/appointments/:id
GET    /api/appointments/today
GET    /api/appointments/upcoming
```

#### GET /api/appointments

**Query Parameters:**

- `date` (optional): Filter by date (YYYY-MM-DD)
- `status` (optional): Filter by status (CONFIRMED, CANCELLED, COMPLETED)
- `offeringId` (optional): Filter by offering

**Response:**

```json
[
  {
    "id": "uuid",
    "customer": {
      "id": "uuid",
      "name": "María García",
      "whatsappPhone": "+521234567890"
    },
    "offering": {
      "id": "uuid",
      "name": "Corte de Pelo"
    },
    "dateTime": "2024-12-18T15:30:00Z",
    "status": "CONFIRMED",
    "createdAt": "2024-12-10T10:00:00Z"
  }
]
```

#### GET /api/appointments/:id

**Response:**

```json
{
  "id": "uuid",
  "customer": {
    "id": "uuid",
    "name": "María García",
    "whatsappPhone": "+521234567890"
  },
  "offering": {
    "id": "uuid",
    "name": "Corte de Pelo",
    "duration": 30
  },
  "dateTime": "2024-12-18T15:30:00Z",
  "status": "CONFIRMED",
  "createdAt": "2024-12-10T10:00:00Z",
  "cancelledAt": null
}
```

#### GET /api/appointments/today

**Response:**

```json
[
  {
    "id": "uuid",
    "customer": {
      "name": "María García"
    },
    "offering": {
      "name": "Corte de Pelo"
    },
    "dateTime": "2024-12-18T15:30:00Z",
    "status": "CONFIRMED"
  }
]
```

---

### Admin Queries

```
GET    /api/admin-queries/pending
POST   /api/admin-queries/:id/respond
```

#### GET /api/admin-queries/pending

**Response:**

```json
[
  {
    "conversationId": "uuid",
    "customer": {
      "name": "María García",
      "whatsappPhone": "+521234567890"
    },
    "lastMessage": {
      "content": "¿Tienen disponibilidad para mañana?",
      "sentAt": "2024-12-18T10:00:00Z"
    },
    "status": "AWAITING_ADMIN"
  }
]
```

#### POST /api/admin-queries/:id/respond

**Request:**

```json
{
  "responseText": "Sí, tenemos disponibilidad mañana a las 10:00 AM"
}
```

**Response:**

```json
{
  "success": true,
  "messageId": "uuid"
}
```

---

### Analytics (opcional para MVP)

```
GET    /api/analytics/appointments
GET    /api/analytics/offerings
```

#### GET /api/analytics/appointments

**Query Parameters:**

- `startDate`: Start date (YYYY-MM-DD)
- `endDate`: End date (YYYY-MM-DD)

**Response:**

```json
{
  "totalAppointments": 150,
  "confirmedAppointments": 120,
  "cancelledAppointments": 20,
  "completedAppointments": 10,
  "cancellationRate": 0.13,
  "byOffering": [
    {
      "offeringName": "Corte de Pelo",
      "count": 80
    },
    {
      "offeringName": "Lavado",
      "count": 70
    }
  ]
}
```

---

## Webhooks

### WhatsApp Business API

```
POST   /api/webhooks/whatsapp
```

#### POST /api/webhooks/whatsapp

**Headers:**

```
X-Hub-Signature-256: sha256=...
Content-Type: application/json
```

**Request (Message Received):**

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
              "display_phone_number": "521234567890",
              "phone_number_id": "PHONE_NUMBER_ID"
            },
            "contacts": [
              {
                "profile": {
                  "name": "María García"
                },
                "wa_id": "521234567890"
              }
            ],
            "messages": [
              {
                "from": "521234567890",
                "id": "wamid.xxx",
                "timestamp": "1702900000",
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

**Response:**

```json
{
  "success": true
}
```

**Validación de Firma:**

```typescript
const signature = request.headers["x-hub-signature-256"];
const payload = JSON.stringify(request.body);

const expectedSignature = crypto
  .createHmac("sha256", WEBHOOK_SECRET)
  .update(payload)
  .digest("hex");

const isValid = crypto.timingSafeEqual(
  Buffer.from(signature.replace("sha256=", "")),
  Buffer.from(expectedSignature),
);
```

---

## Componentes del Panel Web

### Páginas Principales

#### 1. Dashboard

**Endpoint:** `GET /api/dashboard`

**Response:**

```json
{
  "todayAppointments": 8,
  "upcomingAppointments": [
    {
      "id": "uuid",
      "customer": "María García",
      "offering": "Corte de Pelo",
      "dateTime": "2024-12-18T15:30:00Z"
    }
  ],
  "pendingQueries": 3,
  "weekStats": {
    "totalAppointments": 45,
    "cancellationRate": 0.08
  }
}
```

#### 2. Calendario

**Endpoint:** `GET /api/appointments?date={YYYY-MM-DD}`

Vista mensual/semanal/diaria de citas con filtros por offering.

#### 3. Servicios Ofrecidos

**Endpoints:**

- `GET /api/offerings`
- `POST /api/offerings`
- `PUT /api/offerings/:id`
- `DELETE /api/offerings/:id`

#### 4. Horarios

**Endpoints:**

- `GET /api/schedules`
- `POST /api/schedules`
- `PUT /api/schedules/:id`
- `DELETE /api/schedules/:id`

#### 5. Consultas de Clientes

**Endpoints:**

- `GET /api/admin-queries/pending`
- `POST /api/admin-queries/:id/respond`
- `GET /api/conversations/:id/history`

#### 6. Configuración

**Endpoints:**

- `GET /api/business`
- `PUT /api/business`
- `POST /api/business/whatsapp`

---

## Error Responses

### Standard Error Format

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "details": [
    {
      "field": "email",
      "message": "Email must be valid"
    }
  ]
}
```

### Common HTTP Status Codes

| Code | Meaning               | Example                                   |
| ---- | --------------------- | ----------------------------------------- |
| 200  | OK                    | Successful GET, PUT                       |
| 201  | Created               | Successful POST                           |
| 400  | Bad Request           | Validation error                          |
| 401  | Unauthorized          | Missing or invalid JWT                    |
| 403  | Forbidden             | Insufficient permissions                  |
| 404  | Not Found             | Resource doesn't exist                    |
| 409  | Conflict              | Concurrency exception, duplicate resource |
| 422  | Unprocessable Entity  | Business rule violation                   |
| 500  | Internal Server Error | Unexpected server error                   |

---

## Rate Limiting

### Business Owner Panel

- **Rate:** 100 requests per minute per user
- **Burst:** 20 requests per second

### WhatsApp Webhook

- **Rate:** 1000 requests per minute per business
- **Burst:** 50 requests per second

### Response Headers

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1702900060
```

---

## Authentication

### JWT Token Structure

```json
{
  "sub": "user-uuid",
  "email": "owner@example.com",
  "roles": ["BUSINESS_OWNER"],
  "businessId": "business-uuid",
  "iat": 1702900000,
  "exp": 1702986400
}
```

### Protected Endpoints

All endpoints except `/api/auth/*` and `/api/webhooks/*` require JWT authentication:

```
Authorization: Bearer {jwt-token}
```

---

## CORS Configuration

```typescript
{
  origin: [
    'http://localhost:3000',
    'https://app.example.com'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}
```

> **📖 Implementation Details:** Ver [20-nestjs-implementation.md](./20-nestjs-implementation.md) para patrones de controllers

---
inclusion: fileMatch
fileMatchPattern: "**/infra/external/**/*.ts,**/app/commands/**/*.ts"
---

# Resilience Patterns

**Retry logic, circuit breaker, and error recovery patterns**

> **Cross-References:**
>
> - [04-system-architecture.md](./04-system-architecture.md) - Architectural context
> - [50-backend-stack.md](./50-backend-stack.md) - Backend technologies

---

# Resilience Patterns - Retry y Circuit Breaker

Este documento define las estrategias de resiliencia para manejar fallos en servicios externos y operaciones concurrentes.

## 1️⃣ Retry con Exponential Backoff

### ¿Para qué sirve?

Para **fallos transitorios** donde reintentar tiene sentido.

### 🔍 Problema que resuelve

Errores temporales que suelen desaparecer solos:

- Timeouts breves
- Picos de latencia
- Errores 5xx esporádicos
- Conexiones momentáneamente caídas
- `ConcurrencyException` (Optimistic Locking)

### ✅ Casos de uso típicos

**Usa Retry cuando:**

- Llamas a un servicio externo (WhatsApp API, proveedor de pagos, Exchange crypto)
- Haces requests idempotentes
- El servicio sigue sano, solo falló momentáneamente
- El costo del retry es bajo

**Ejemplos concretos en nuestro sistema:**

- 📩 Enviar mensaje WhatsApp vía BSP
- 🔄 Resolver conflictos de Optimistic Locking
- 🌐 Request HTTP a otro bounded context (futuro)
- 💳 Confirmar estado de pago (futuro)

### 🚫 Cuándo NO usar Retry

- Errores 4xx (credenciales inválidas, datos incorrectos)
- Fallos determinísticos (validación de negocio)
- Operaciones no idempotentes
- Cuando el servicio destino está caído por completo

### 🔧 Implementación Actual

#### SendWhatsAppMessageHandler

```typescript
@CommandHandler(SendWhatsAppMessageCommand)
export class SendWhatsAppMessageHandler {
  private readonly MAX_RETRIES = 3;
  private readonly BASE_DELAY_MS = 100;

  private async sendWithRetry(
    to: string,
    content: string,
    messageType: string,
    conversationId: string,
  ): Promise<void> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.MAX_RETRIES; attempt++) {
      try {
        await this.whatsappClient.sendMessage(to, content);
        return; // ✅ Éxito
      } catch (error) {
        lastError = error as Error;

        if (attempt < this.MAX_RETRIES - 1) {
          // Exponential backoff: 100ms, 200ms, 400ms
          const delay = this.BASE_DELAY_MS * Math.pow(2, attempt);
          await this.sleep(delay);
        }
      }
    }

    throw new WhatsAppMessageFailedException(
      conversationId,
      lastError?.message,
    );
  }
}
```

**Backoff progression:**

- Intento 1: Falla → Espera 100ms
- Intento 2: Falla → Espera 200ms
- Intento 3: Falla → Lanza excepción

#### SendAdminResponseHandler (Optimistic Locking)

```typescript
@CommandHandler(SendAdminResponseCommand)
export class SendAdminResponseHandler {
  private readonly MAX_RETRIES = 3;

  async execute(command: SendAdminResponseCommand): Promise<void> {
    let attempt = 0;

    while (attempt < this.MAX_RETRIES) {
      try {
        const conversation = await this.factory.loadById(
          command.conversationId,
        );
        conversation.resolveAdminQuery();
        await this.writeRepo.save(conversation);
        return; // ✅ Éxito
      } catch (error) {
        if (error instanceof ConcurrencyException) {
          attempt++;

          if (attempt >= this.MAX_RETRIES) {
            throw new Error(
              `Unable to send admin response after ${this.MAX_RETRIES} attempts. Please try again.`,
            );
          }

          // Exponential backoff: 100ms, 200ms, 400ms
          const backoffMs = 100 * Math.pow(2, attempt);
          await new Promise((resolve) => setTimeout(resolve, backoffMs));
        } else {
          throw error; // ❌ Otros errores se propagan inmediatamente
        }
      }
    }
  }
}
```

### 🔧 Buenas prácticas

| Práctica                 | ✅ Implementado | ❌ Falta       |
| ------------------------ | --------------- | -------------- |
| Backoff exponencial      | ✅              |                |
| Límite de intentos (3–5) | ✅ (3 intentos) |                |
| Jitter (aleatoriedad)    |                 | ❌ No agregado |
| Timeouts claros          |                 | ❌ No config   |
| Métricas de retry        |                 | ❌ No tracked  |
| Retry solo idempotentes  | ✅              |                |
| Retry solo transitorios  | ✅              |                |

---

## 2️⃣ Circuit Breaker

### ¿Para qué sirve?

Para **proteger el sistema** cuando un servicio está fallando de forma persistente.

### 🔍 Problema que resuelve

Evita:

- Saturar un servicio caído
- Consumir threads inútilmente
- Cascading failures
- Efecto dominó entre bounded contexts

### ✅ Casos de uso típicos

**Usa Circuit Breaker cuando:**

- Un servicio remoto está lento o caído
- El fallo no es transitorio
- Hay dependencias críticas
- Necesitas fallbacks o degradación

**Ejemplos (futuro):**

- 🧾 Servicio de facturación externo caído
- 📞 API de WhatsApp responde 500 constantemente
- 🏦 Gateway de pagos inestable
- 🔍 Motor de búsqueda interno saturado

### 🔄 Estados del Circuit Breaker

```
┌─────────────┐
│   CLOSED    │ ← Tráfico normal
│ (Healthy)   │
└──────┬──────┘
       │ Errores > threshold
       ↓
┌─────────────┐
│    OPEN     │ ← Fail fast (no requests)
│  (Failing)  │
└──────┬──────┘
       │ Timeout
       ↓
┌─────────────┐
│ HALF-OPEN   │ ← Prueba si volvió
│  (Testing)  │
└──────┬──────┘
       │ Success → CLOSED
       │ Failure → OPEN
```

### 🚫 Cuándo NO usar Circuit Breaker

- Lógica interna local (sin red)
- Operaciones ultra rápidas
- Casos donde fallar rápido no aporta valor

### 🔧 Implementación (NO implementado aún)

**Estado actual:** ❌ No tenemos Circuit Breaker implementado

**Razón:** En MVP, solo tenemos una dependencia externa crítica (WhatsApp API) y el retry es suficiente.

**Cuándo implementar:**

- Post-MVP cuando agreguemos más servicios externos
- Cuando tengamos gateway de pagos
- Cuando tengamos servicio de facturación
- Cuando tengamos múltiples BSPs de WhatsApp

**Librería recomendada:** `opossum` (Circuit Breaker para Node.js)

```typescript
// Ejemplo futuro (NO implementar en MVP)
import CircuitBreaker from "opossum";

const breaker = new CircuitBreaker(whatsappClient.sendMessage, {
  timeout: 3000, // 3s timeout
  errorThresholdPercentage: 50, // Abrir si 50% fallan
  resetTimeout: 30000, // Intentar cerrar después de 30s
});

breaker.fallback(() => {
  // Fallback: guardar mensaje en cola para envío posterior
  return { queued: true };
});

breaker.on("open", () => {
  logger.warn("Circuit breaker opened - WhatsApp API is down");
});

breaker.on("halfOpen", () => {
  logger.info("Circuit breaker half-open - testing WhatsApp API");
});

breaker.on("close", () => {
  logger.info("Circuit breaker closed - WhatsApp API is healthy");
});
```

---

## 3️⃣ Retry vs Circuit Breaker — Cuándo usar cuál

| Escenario                  | Retry | Circuit Breaker |
| -------------------------- | ----- | --------------- |
| Timeout ocasional          | ✅    | ❌              |
| Servicio externo inestable | ⚠️    | ✅              |
| Errores esporádicos        | ✅    | ❌              |
| Servicio caído             | ❌    | ✅              |
| Evitar cascadas            | ❌    | ✅              |
| Operación idempotente      | ✅    | ❌              |

---

## 4️⃣ 🔥 La combinación correcta (la más usada)

En sistemas reales no se usan por separado, sino así:

```
Circuit Breaker
    └── Retry con Exponential Backoff
```

### Flujo típico:

1. **Retry** intenta recuperar errores transitorios
2. Si el error persiste → el **Circuit se abre**
3. El sistema **falla rápido**
4. Se evita **colapso global**
5. Se intenta **recuperación en half-open**

### Ejemplo de implementación futura:

```typescript
// Circuit Breaker envuelve el cliente
const breaker = new CircuitBreaker(whatsappClient.sendMessage, {
  timeout: 3000,
  errorThresholdPercentage: 50,
  resetTimeout: 30000,
});

// Retry dentro del handler
private async sendWithRetry(to: string, content: string): Promise<void> {
  for (let attempt = 0; attempt < this.MAX_RETRIES; attempt++) {
    try {
      // Circuit Breaker decide si permite el request
      await breaker.fire(to, content);
      return; // ✅ Éxito
    } catch (error) {
      if (breaker.opened) {
        // Circuit abierto - fail fast sin retry
        throw new ServiceUnavailableException('WhatsApp API is down');
      }

      // Circuit cerrado - retry con backoff
      if (attempt < this.MAX_RETRIES - 1) {
        const delay = this.BASE_DELAY_MS * Math.pow(2, attempt);
        await this.sleep(delay);
      }
    }
  }

  throw new WhatsAppMessageFailedException('Failed after retries');
}
```

---

## 5️⃣ Mejoras Pendientes (Post-MVP)

### 5.1. Agregar Jitter al Exponential Backoff

**Problema:** Múltiples clientes reintentando al mismo tiempo pueden causar "thundering herd"

**Solución:**

```typescript
// ❌ Actual (sin jitter)
const delay = this.BASE_DELAY_MS * Math.pow(2, attempt);

// ✅ Mejorado (con jitter)
const baseDelay = this.BASE_DELAY_MS * Math.pow(2, attempt);
const jitter = Math.random() * 0.3 * baseDelay; // ±30% aleatorio
const delay = baseDelay + jitter;
```

### 5.2. Configurar Timeouts en Axios

**Problema:** Sin timeout, requests pueden colgar indefinidamente

**Solución:**

```typescript
// apps/backend/src/conversation/infra/external/whatsapp-business-api-client.ts
this.httpClient = axios.create({
  baseURL: this.apiUrl,
  timeout: 5000, // ← Agregar timeout de 5s
  headers: {
    Authorization: `Bearer ${this.accessToken}`,
    "Content-Type": "application/json",
  },
});
```

### 5.3. Métricas de Retry

**Problema:** No sabemos cuántos retries ocurren ni por qué

**Solución:**

```typescript
private async sendWithRetry(...): Promise<void> {
  for (let attempt = 0; attempt < this.MAX_RETRIES; attempt++) {
    try {
      await this.whatsappClient.sendMessage(to, content);

      // ✅ Métrica: retry exitoso
      if (attempt > 0) {
        this.logger.info({
          event: 'whatsapp_retry_success',
          attempt,
          conversationId,
        });
      }

      return;
    } catch (error) {
      // ✅ Métrica: retry fallido
      this.logger.warn({
        event: 'whatsapp_retry_failed',
        attempt,
        error: error.message,
        conversationId,
      });

      // ... backoff logic
    }
  }
}
```

### 5.4. Estrategia Unificada de Retry

**Problema:** Cada handler implementa su propio retry

**Solución:** Crear un `RetryService` reutilizable

```typescript
// src/shared/infra/retry/retry.service.ts
@Injectable()
export class RetryService {
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    options: {
      maxRetries: number;
      baseDelayMs: number;
      shouldRetry?: (error: Error) => boolean;
      onRetry?: (attempt: number, error: Error) => void;
    },
  ): Promise<T> {
    // Implementación genérica de retry
  }
}

// Uso en handlers
@CommandHandler(SendWhatsAppMessageCommand)
export class SendWhatsAppMessageHandler {
  constructor(
    private readonly retryService: RetryService,
    private readonly whatsappClient: IWhatsAppClient,
  ) {}

  async execute(command: SendWhatsAppMessageCommand) {
    await this.retryService.executeWithRetry(
      () => this.whatsappClient.sendMessage(to, content),
      {
        maxRetries: 3,
        baseDelayMs: 100,
        shouldRetry: (error) => error.status >= 500, // Solo 5xx
      },
    );
  }
}
```

---

## 6️⃣ Decisiones de Arquitectura

### MVP (Actual)

✅ **Implementado:**

- Retry con exponential backoff en `SendWhatsAppMessageHandler`
- Retry para `ConcurrencyException` en `SendAdminResponseHandler`
- 3 intentos máximo
- Backoff: 100ms \* 2^attempt

❌ **NO implementado (deliberadamente):**

- Circuit Breaker (no necesario con una sola dependencia externa)
- Jitter (thundering herd no es problema en MVP)
- Timeouts explícitos (axios usa defaults)
- Métricas de retry (logging básico es suficiente)

### Post-MVP

**Cuándo agregar Circuit Breaker:**

- Múltiples servicios externos (pagos, facturación, múltiples BSPs)
- Tráfico alto (>1000 requests/min)
- SLA estrictos (99.9% uptime)

**Cuándo agregar Jitter:**

- Múltiples instancias del backend (horizontal scaling)
- Tráfico alto con picos

**Cuándo agregar RetryService:**

- Más de 3 handlers con retry logic
- Necesidad de configuración centralizada

---

## 7️⃣ Testing

### Tests de Retry

✅ **Ya implementados:**

```typescript
// apps/backend/src/conversation/app/commands/send-whatsapp-message/__tests__/handler.spec.ts

describe("execute - retry logic", () => {
  it("should retry on WhatsApp API failure and succeed on second attempt", async () => {
    // Mock: Falla 1 vez, luego éxito
    mockWhatsAppClient.sendMessage
      .mockRejectedValueOnce(new Error("Timeout"))
      .mockResolvedValueOnce(undefined);

    await handler.execute(command);

    expect(mockWhatsAppClient.sendMessage).toHaveBeenCalledTimes(2);
  });

  it("should throw after 3 failed attempts", async () => {
    // Mock: Falla 3 veces
    mockWhatsAppClient.sendMessage.mockRejectedValue(new Error("API down"));

    await expect(handler.execute(command)).rejects.toThrow(
      WhatsAppMessageFailedException,
    );

    expect(mockWhatsAppClient.sendMessage).toHaveBeenCalledTimes(3);
  });
});

describe("execute - exponential backoff", () => {
  it("should wait with exponential backoff between retries", async () => {
    const start = Date.now();

    mockWhatsAppClient.sendMessage
      .mockRejectedValueOnce(new Error("Timeout"))
      .mockRejectedValueOnce(new Error("Timeout"))
      .mockResolvedValueOnce(undefined);

    await handler.execute(command);

    const duration = Date.now() - start;

    // First retry: 100ms, Second retry: 200ms
    // Total minimum: 300ms
    expect(duration).toBeGreaterThanOrEqual(300);
  });
});
```

### Tests de Circuit Breaker (futuro)

```typescript
// Ejemplo de tests cuando implementemos Circuit Breaker

describe("Circuit Breaker", () => {
  it("should open circuit after threshold failures", async () => {
    // Simular 10 fallos consecutivos
    for (let i = 0; i < 10; i++) {
      await expect(handler.execute(command)).rejects.toThrow();
    }

    // Circuit debe estar abierto
    expect(breaker.opened).toBe(true);
  });

  it("should fail fast when circuit is open", async () => {
    breaker.open(); // Forzar apertura

    const start = Date.now();
    await expect(handler.execute(command)).rejects.toThrow();
    const duration = Date.now() - start;

    // Debe fallar inmediatamente (< 10ms)
    expect(duration).toBeLessThan(10);
  });

  it("should transition to half-open after timeout", async () => {
    breaker.open();

    // Esperar resetTimeout
    await sleep(breaker.options.resetTimeout);

    expect(breaker.halfOpen).toBe(true);
  });
});
```

---

## 8️⃣ Referencias

- [Retry Pattern - Microsoft](https://learn.microsoft.com/en-us/azure/architecture/patterns/retry)
- [Circuit Breaker Pattern - Martin Fowler](https://martinfowler.com/bliki/CircuitBreaker.html)
- [Exponential Backoff - AWS](https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/)
- [opossum - Circuit Breaker for Node.js](https://nodeshift.dev/opossum/)

---

**Last Updated:** January 9, 2026  
**Status:** Active

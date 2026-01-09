# WhatsApp Integration Testing Guide

This guide explains how to test WhatsApp Business API integration without using real phone numbers or incurring costs.

## Table of Contents

1. [Testing Strategies Overview](#testing-strategies-overview)
2. [Using Meta's Test Phone Numbers](#using-metas-test-phone-numbers)
3. [Unit Testing with MockWhatsAppClient](#unit-testing-with-mockwhatsappclient)
4. [Integration Testing with WhatsAppApiSimulator](#integration-testing-with-whatsappapisimulator)
5. [Example Test Cases](#example-test-cases)
6. [Best Practices](#best-practices)

---

## Testing Strategies Overview

We provide three complementary testing strategies for WhatsApp integration:

| Strategy                 | Use Case                            | Cost | Real API | Setup Complexity |
| ------------------------ | ----------------------------------- | ---- | -------- | ---------------- |
| **Meta Test Numbers**    | Manual testing, exploratory testing | Free | Yes      | Low              |
| **MockWhatsAppClient**   | Unit tests, fast feedback           | Free | No       | Very Low         |
| **WhatsAppApiSimulator** | Integration tests, E2E tests        | Free | No       | Low              |

### When to Use Each Strategy

- **Meta Test Numbers**: Use for manual verification, testing real WhatsApp behavior, and validating webhook integration
- **MockWhatsAppClient**: Use for unit tests where you need predictable responses and fast execution
- **WhatsAppApiSimulator**: Use for integration tests where you need to test the full flow including webhooks

---

## Using Meta's Test Phone Numbers

Meta provides free test phone numbers that work in development mode without requiring real phone numbers.

### Setup

1. **Access Test Numbers**
   - Go to Meta for Developers Dashboard
   - Navigate to your WhatsApp app → API Setup
   - Find the "Test Phone Numbers" section
   - Meta provides test numbers like `+1 555 164 6083`

2. **Limitations**
   - Only work in development mode
   - Cannot send messages to real phone numbers
   - Limited to testing with other test numbers
   - Rate limits apply (80 messages per day per test number)

3. **Testing Flow**
   ```
   Your App → WhatsApp API (Test Number) → Webhook → Your App
   ```

### Example: Manual Testing

```bash
# 1. Send a test message using curl
curl -X POST "https://graph.facebook.com/v18.0/{PHONE_NUMBER_ID}/messages" \
  -H "Authorization: Bearer {ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "messaging_product": "whatsapp",
    "to": "18093192896",
    "type": "text",
    "text": {
      "body": "Hello from test!"
    }
  }'

# 2. Verify webhook receives the message
# Check your application logs for incoming webhook payload
```

### Verifying Webhook Integration

1. **Setup ngrok for local development**

   ```bash
   ngrok http 3000
   ```

2. **Configure webhook in Meta Dashboard**
   - Use ngrok URL: `https://your-ngrok-url.ngrok-free.app/api/webhooks/whatsapp`
   - Set verify token (must match your .env)
   - Subscribe to `messages` and `message_status` fields

3. **Test webhook verification**
   - Meta will send GET request with challenge
   - Your app must respond with the challenge value
   - Verify in Meta Dashboard that webhook is verified

---

## Unit Testing with MockWhatsAppClient

The `MockWhatsAppClient` provides a simple mock implementation for unit tests.

### Features

- ✅ Implements `IWhatsAppClient` interface
- ✅ Returns predictable responses
- ✅ No network calls
- ✅ Fast execution
- ✅ Easy to configure

### Basic Usage

```typescript
import { MockWhatsAppClient } from '../__mocks__/mock-whatsapp-client';

describe('SendMessageHandler', () => {
  let handler: SendMessageHandler;
  let mockClient: MockWhatsAppClient;

  beforeEach(() => {
    mockClient = new MockWhatsAppClient();
    handler = new SendMessageHandler(mockClient);
  });

  it('should send text message successfully', async () => {
    // Arrange
    const command = new SendMessageCommand({
      to: '1234567890',
      message: 'Hello World',
    });

    // Act
    const result = await handler.execute(command);

    // Assert
    expect(result.success).toBe(true);
    expect(result.messageId).toBeDefined();
    expect(mockClient.getSentMessages()).toHaveLength(1);
  });
});
```

### Configuring Mock Responses

```typescript
// Configure success response
mockClient.configure({
  shouldSucceed: true,
  messageId: 'custom-message-id',
});

// Configure error response
mockClient.configure({
  shouldSucceed: false,
  error: new Error('Rate limit exceeded'),
});

// Configure delay
mockClient.configure({
  shouldSucceed: true,
  delay: 1000, // 1 second delay
});
```

### Inspecting Sent Messages

```typescript
// Get all sent messages
const messages = mockClient.getSentMessages();

// Get last sent message
const lastMessage = mockClient.getLastSentMessage();

// Clear message history
mockClient.clearSentMessages();

// Check if specific message was sent
const wasSent = messages.some((msg) => msg.to === '1234567890' && msg.text?.body === 'Hello World');
```

### Example: Testing Error Handling

```typescript
it('should handle rate limit errors', async () => {
  // Arrange
  mockClient.configure({
    shouldSucceed: false,
    error: new Error('Rate limit exceeded'),
  });

  const command = new SendMessageCommand({
    to: '1234567890',
    message: 'Hello',
  });

  // Act & Assert
  await expect(handler.execute(command)).rejects.toThrow('Rate limit exceeded');
});
```

---

## Integration Testing with WhatsAppApiSimulator

The `WhatsAppApiSimulator` provides a full HTTP server that simulates the WhatsApp Business API.

### Features

- ✅ Full HTTP server simulating WhatsApp API
- ✅ Webhook callback simulation
- ✅ Supports text messages, interactive buttons, and lists
- ✅ Request validation
- ✅ Configurable errors and delays
- ✅ Message tracking for assertions

### Basic Usage

```typescript
import { WhatsAppApiSimulator } from '../__mocks__/whatsapp-api-simulator';
import { WhatsAppClient } from '../whatsapp-client';

describe('WhatsApp Integration', () => {
  let simulator: WhatsAppApiSimulator;
  let client: WhatsAppClient;

  beforeAll(async () => {
    // Start simulator on random port
    simulator = new WhatsAppApiSimulator({
      webhookUrl: 'http://localhost:3000/api/webhooks/whatsapp',
      phoneNumberId: 'test-phone-123',
    });

    const port = await simulator.start();

    // Configure client to use simulator
    client = new WhatsAppClient({
      apiUrl: `http://localhost:${port}`,
      accessToken: 'test-token',
      phoneNumberId: 'test-phone-123',
    });
  });

  afterAll(async () => {
    await simulator.stop();
  });

  it('should send and receive messages', async () => {
    // Send message via client
    const result = await client.sendTextMessage('1234567890', 'Hello');

    // Verify message was sent
    expect(result.messageId).toBeDefined();

    // Verify simulator received the message
    const sentMessages = simulator.getSentMessages();
    expect(sentMessages).toHaveLength(1);
    expect(sentMessages[0].to).toBe('1234567890');
  });
});
```

### Simulating Incoming Messages

```typescript
it('should handle incoming text message', async () => {
  // Setup webhook listener
  const receivedMessages: any[] = [];
  app.post('/api/webhooks/whatsapp', (req, res) => {
    receivedMessages.push(req.body);
    res.sendStatus(200);
  });

  // Simulate incoming message
  await simulator.simulateIncomingMessage({
    from: '1234567890',
    text: 'Hello from customer',
    timestamp: Date.now(),
  });

  // Wait for webhook delivery
  await new Promise((resolve) => setTimeout(resolve, 100));

  // Verify webhook was called
  expect(receivedMessages).toHaveLength(1);
  expect(receivedMessages[0].entry[0].changes[0].value.messages[0].text.body).toBe(
    'Hello from customer',
  );
});
```

### Simulating Interactive Messages

```typescript
it('should handle button reply', async () => {
  // Simulate button click
  await simulator.simulateIncomingMessage({
    from: '1234567890',
    type: 'interactive',
    interactive: {
      type: 'button_reply',
      button_reply: {
        id: 'confirm_appointment',
        title: 'Confirm',
      },
    },
    timestamp: Date.now(),
  });

  // Verify your app processed the button click
  // ... your assertions here
});

it('should handle list reply', async () => {
  // Simulate list selection
  await simulator.simulateIncomingMessage({
    from: '1234567890',
    type: 'interactive',
    interactive: {
      type: 'list_reply',
      list_reply: {
        id: 'slot_10am',
        title: '10:00 AM',
      },
    },
    timestamp: Date.now(),
  });

  // Verify your app processed the list selection
  // ... your assertions here
});
```

### Configuring Error Simulation

```typescript
it('should handle API errors', async () => {
  // Configure simulator to return errors
  simulator.configure({
    shouldFail: true,
    errorCode: 131047, // Rate limit error
    errorMessage:
      'Message failed to send because there were too many messages sent from this phone number',
  });

  // Attempt to send message
  await expect(client.sendTextMessage('1234567890', 'Hello')).rejects.toThrow('Rate limit');
});
```

### Configuring Network Delays

```typescript
it('should handle slow network', async () => {
  // Configure 2 second delay
  simulator.configure({
    networkDelay: 2000,
  });

  const startTime = Date.now();
  await client.sendTextMessage('1234567890', 'Hello');
  const duration = Date.now() - startTime;

  expect(duration).toBeGreaterThanOrEqual(2000);
});
```

### Querying Simulator State

```typescript
// Get all sent messages
const sentMessages = simulator.getSentMessages();

// Get messages sent to specific recipient
const customerMessages = simulator.getMessagesSentTo('1234567890');

// Get all received messages (from webhook simulation)
const receivedMessages = simulator.getReceivedMessages();

// Clear all message history
simulator.clearMessages();

// Check health
const isHealthy = await simulator.isHealthy();
```

---

## Example Test Cases

### Example 1: End-to-End Appointment Booking Flow

```typescript
describe('Appointment Booking Flow', () => {
  let simulator: WhatsAppApiSimulator;
  let app: INestApplication;

  beforeAll(async () => {
    // Setup simulator
    simulator = new WhatsAppApiSimulator({
      webhookUrl: 'http://localhost:3000/api/webhooks/whatsapp',
      phoneNumberId: 'test-phone-123',
    });
    await simulator.start();

    // Setup app with simulator URL
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider('WHATSAPP_API_URL')
      .useValue(`http://localhost:${simulator.getPort()}`)
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await simulator.stop();
    await app.close();
  });

  it('should complete full booking flow', async () => {
    const customerPhone = '1234567890';

    // 1. Customer sends initial message
    await simulator.simulateIncomingMessage({
      from: customerPhone,
      text: 'I want to book an appointment',
      timestamp: Date.now(),
    });

    await waitForProcessing();

    // 2. Verify bot sent available slots
    const sentMessages = simulator.getMessagesSentTo(customerPhone);
    expect(sentMessages).toHaveLength(1);
    expect(sentMessages[0].interactive?.type).toBe('list');

    // 3. Customer selects a slot
    await simulator.simulateIncomingMessage({
      from: customerPhone,
      type: 'interactive',
      interactive: {
        type: 'list_reply',
        list_reply: {
          id: 'slot_10am_2024-01-15',
          title: '10:00 AM - Jan 15',
        },
      },
      timestamp: Date.now(),
    });

    await waitForProcessing();

    // 4. Verify confirmation message sent
    const confirmationMessages = simulator.getMessagesSentTo(customerPhone);
    expect(confirmationMessages.length).toBeGreaterThan(1);
    const lastMessage = confirmationMessages[confirmationMessages.length - 1];
    expect(lastMessage.text?.body).toContain('confirmed');
  });
});

function waitForProcessing(ms = 500): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
```

### Example 2: Testing Rate Limiting

```typescript
describe('Rate Limiting', () => {
  let mockClient: MockWhatsAppClient;
  let handler: SendMessageHandler;

  beforeEach(() => {
    mockClient = new MockWhatsAppClient();
    handler = new SendMessageHandler(mockClient);
  });

  it('should respect rate limits', async () => {
    // Configure mock to fail after 3 messages
    let messageCount = 0;
    mockClient.configure({
      shouldSucceed: true,
      beforeSend: () => {
        messageCount++;
        if (messageCount > 3) {
          throw new Error('Rate limit exceeded');
        }
      },
    });

    // Send 3 messages successfully
    for (let i = 0; i < 3; i++) {
      await handler.execute(
        new SendMessageCommand({
          to: '1234567890',
          message: `Message ${i + 1}`,
        }),
      );
    }

    // 4th message should fail
    await expect(
      handler.execute(
        new SendMessageCommand({
          to: '1234567890',
          message: 'Message 4',
        }),
      ),
    ).rejects.toThrow('Rate limit exceeded');
  });
});
```

### Example 3: Testing Webhook Signature Validation

```typescript
describe('Webhook Security', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should reject webhooks with invalid signature', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/webhooks/whatsapp')
      .set('X-Hub-Signature-256', 'sha256=invalid-signature')
      .send({
        object: 'whatsapp_business_account',
        entry: [
          {
            changes: [
              {
                value: {
                  messages: [
                    {
                      from: '1234567890',
                      text: { body: 'Hello' },
                    },
                  ],
                },
              },
            ],
          },
        ],
      });

    expect(response.status).toBe(401);
  });

  it('should accept webhooks with valid signature', async () => {
    const payload = {
      object: 'whatsapp_business_account',
      entry: [
        {
          changes: [
            {
              value: {
                messages: [
                  {
                    from: '1234567890',
                    text: { body: 'Hello' },
                  },
                ],
              },
            },
          ],
        },
      ],
    };

    const signature = generateSignature(payload, process.env.WHATSAPP_APP_SECRET);

    const response = await request(app.getHttpServer())
      .post('/api/webhooks/whatsapp')
      .set('X-Hub-Signature-256', `sha256=${signature}`)
      .send(payload);

    expect(response.status).toBe(200);
  });
});
```

---

## Best Practices

### 1. Use the Right Tool for the Job

- **Unit tests**: Use `MockWhatsAppClient` for fast, isolated tests
- **Integration tests**: Use `WhatsAppApiSimulator` for testing full flows
- **Manual testing**: Use Meta's test numbers for exploratory testing

### 2. Test Isolation

```typescript
// ✅ Good: Clean state between tests
beforeEach(() => {
  mockClient.clearSentMessages();
  simulator.clearMessages();
});

// ❌ Bad: Tests depend on each other
it('test 1', () => {
  // Sends message
});

it('test 2', () => {
  // Assumes message from test 1 exists
});
```

### 3. Test Error Scenarios

```typescript
// Test network errors
simulator.configure({ shouldFail: true });

// Test timeouts
simulator.configure({ networkDelay: 30000 });

// Test rate limits
mockClient.configure({
  error: new Error('Rate limit exceeded'),
});
```

### 4. Use Realistic Test Data

```typescript
// ✅ Good: Realistic phone numbers
const testPhone = '1234567890'; // 10 digits

// ❌ Bad: Invalid phone numbers
const testPhone = '123'; // Too short
```

### 5. Clean Up Resources

```typescript
afterAll(async () => {
  await simulator.stop(); // Stop HTTP server
  await app.close(); // Close NestJS app
});
```

### 6. Test Webhook Delivery

```typescript
// Always verify webhooks are delivered
await simulator.simulateIncomingMessage({ ... });
await waitForProcessing(); // Give time for async processing
expect(receivedWebhooks).toHaveLength(1);
```

### 7. Test Concurrent Scenarios

```typescript
it('should handle concurrent messages', async () => {
  const promises = Array.from({ length: 10 }, (_, i) =>
    client.sendTextMessage('1234567890', `Message ${i}`),
  );

  const results = await Promise.all(promises);

  expect(results).toHaveLength(10);
  expect(results.every((r) => r.success)).toBe(true);
});
```

### 8. Document Test Scenarios

```typescript
describe('Appointment Booking', () => {
  /**
   * Test Scenario: Happy Path
   * 1. Customer sends "book appointment"
   * 2. Bot shows available slots
   * 3. Customer selects slot
   * 4. Bot confirms booking
   */
  it('should complete booking flow', async () => {
    // Test implementation
  });
});
```

---

## Troubleshooting

### Simulator Not Starting

```typescript
// Check if port is already in use
const port = await simulator.start(0); // Use random port
console.log(`Simulator started on port ${port}`);
```

### Webhooks Not Being Delivered

```typescript
// Verify webhook URL is correct
simulator.configure({
  webhookUrl: 'http://localhost:3000/api/webhooks/whatsapp',
});

// Check if your app is running
const isHealthy = await simulator.isHealthy();
console.log('Simulator health:', isHealthy);
```

### Tests Timing Out

```typescript
// Increase timeout for integration tests
jest.setTimeout(30000); // 30 seconds

// Or use shorter delays in simulator
simulator.configure({
  networkDelay: 100, // 100ms instead of realistic delays
});
```

### Mock Not Returning Expected Data

```typescript
// Verify mock configuration
mockClient.configure({
  shouldSucceed: true,
  messageId: 'expected-id',
});

// Check sent messages
console.log('Sent messages:', mockClient.getSentMessages());
```

---

## Additional Resources

- [WhatsApp Business API Documentation](https://developers.facebook.com/docs/whatsapp/cloud-api)
- [Meta Test Numbers Guide](https://developers.facebook.com/docs/whatsapp/cloud-api/get-started#test-numbers)
- [MockWhatsAppClient README](./README.md#mockwhatsappclient)
- [WhatsAppApiSimulator README](./README.md#whatsappapisimulator)

---

**Last Updated:** January 9, 2026  
**Version:** 1.0.0

# Mock WhatsApp Client

Mock implementation of `IWhatsAppClient` for unit testing.

## Purpose

The `MockWhatsAppClient` provides a test double for the WhatsApp Business API client that:

- ✅ Implements the complete `IWhatsAppClient` interface
- ✅ Tracks all sent messages for verification
- ✅ Returns predictable responses
- ✅ Simulates errors and network delays
- ✅ Provides utility methods for test assertions
- ✅ Requires no external dependencies or API credentials

## Installation

```typescript
import { MockWhatsAppClient } from '@conversation/infra/external/__mocks__';
```

## Basic Usage

### Simple Message Tracking

```typescript
describe('MyService', () => {
  let mockClient: MockWhatsAppClient;
  let service: MyService;

  beforeEach(() => {
    mockClient = new MockWhatsAppClient();
    service = new MyService(mockClient);
  });

  it('should send welcome message', async () => {
    // Act
    await service.sendWelcome('1234567890');

    // Assert
    expect(mockClient.sentMessages).toHaveLength(1);
    expect(mockClient.sentMessages[0]).toEqual({
      to: '1234567890',
      message: 'Welcome to our service!',
    });
  });
});
```

### Using Utility Methods

```typescript
it('should send confirmation message', async () => {
  // Act
  await service.confirmAppointment('1234567890', appointmentId);

  // Assert
  expect(mockClient.hasMessageBeenSent('1234567890', 'Your appointment is confirmed')).toBe(true);
  expect(mockClient.getTotalMessagesSent()).toBe(1);
});
```

### Testing Interactive Buttons

```typescript
it('should send appointment options', async () => {
  // Act
  await service.sendAppointmentOptions('1234567890');

  // Assert
  expect(mockClient.sentInteractiveButtons).toHaveLength(1);
  expect(mockClient.sentInteractiveButtons[0].buttons).toHaveLength(3);
  expect(mockClient.hasInteractiveButtonsBeenSent('1234567890')).toBe(true);
});
```

### Testing Interactive Lists

```typescript
it('should send service list', async () => {
  // Act
  await service.sendServiceList('1234567890');

  // Assert
  expect(mockClient.sentInteractiveLists).toHaveLength(1);
  expect(mockClient.sentInteractiveLists[0].sections).toHaveLength(2);
  expect(mockClient.hasInteractiveListBeenSent('1234567890')).toBe(true);
});
```

### Testing Location Messages

```typescript
it('should send business location', async () => {
  // Act
  await service.sendBusinessLocation('1234567890');

  // Assert
  expect(mockClient.sentLocations).toHaveLength(1);
  expect(mockClient.sentLocations[0].location.name).toBe('Our Business');
  expect(mockClient.hasLocationBeenSent('1234567890')).toBe(true);
});
```

## Advanced Features

### Simulating Errors

```typescript
it('should handle WhatsApp API errors', async () => {
  // Arrange
  mockClient.setShouldFail(true, 'WhatsApp API rate limit exceeded');

  // Act & Assert
  await expect(service.sendMessage('1234567890', 'Test')).rejects.toThrow(
    'WhatsApp API rate limit exceeded',
  );
});
```

### Simulating Network Delay

```typescript
it('should handle slow network', async () => {
  // Arrange
  mockClient.setDelay(500); // 500ms delay

  // Act
  const startTime = Date.now();
  await service.sendMessage('1234567890', 'Test');
  const elapsed = Date.now() - startTime;

  // Assert
  expect(elapsed).toBeGreaterThanOrEqual(500);
});
```

### Resetting Between Tests

```typescript
beforeEach(() => {
  mockClient = new MockWhatsAppClient();
  // or
  mockClient.reset(); // if reusing the same instance
});
```

## API Reference

### Tracking Properties

| Property                 | Type                                                               | Description                  |
| ------------------------ | ------------------------------------------------------------------ | ---------------------------- |
| `sentMessages`           | `Array<{ to: string; message: string }>`                           | All text messages sent       |
| `sentInteractiveButtons` | `Array<{ to: string; message: string; buttons: Button[] }>`        | All interactive buttons sent |
| `sentInteractiveLists`   | `Array<{ to: string; bodyText: string; buttonText: string; ... }>` | All interactive lists sent   |
| `sentLocations`          | `Array<{ to: string; location: Location }>`                        | All location messages sent   |

### Configuration Methods

| Method                                | Description                                    |
| ------------------------------------- | ---------------------------------------------- |
| `setShouldFail(shouldFail, message?)` | Configure mock to fail on next call            |
| `setDelay(delayMs)`                   | Add artificial network delay                   |
| `reset()`                             | Clear all tracked data and reset configuration |

### Utility Methods

| Method                              | Returns    | Description                                    |
| ----------------------------------- | ---------- | ---------------------------------------------- |
| `getTotalMessagesSent()`            | `number`   | Total count of all message types               |
| `hasMessageBeenSent(to, message)`   | `boolean`  | Check if specific text message was sent        |
| `hasInteractiveButtonsBeenSent(to)` | `boolean`  | Check if interactive buttons sent to recipient |
| `hasInteractiveListBeenSent(to)`    | `boolean`  | Check if interactive list sent to recipient    |
| `hasLocationBeenSent(to)`           | `boolean`  | Check if location sent to recipient            |
| `getLastMessageTo(to)`              | `string?`  | Get last text message sent to recipient        |
| `getMessagesTo(to)`                 | `string[]` | Get all text messages sent to recipient        |

## Testing Patterns

### Pattern 1: Verify Message Content

```typescript
it('should send personalized greeting', async () => {
  await service.greetCustomer('1234567890', 'John');

  const lastMessage = mockClient.getLastMessageTo('1234567890');
  expect(lastMessage).toContain('Hello John');
});
```

### Pattern 2: Verify Message Count

```typescript
it('should send reminder sequence', async () => {
  await service.sendReminderSequence('1234567890');

  expect(mockClient.getMessagesTo('1234567890')).toHaveLength(3);
});
```

### Pattern 3: Verify Button Structure

```typescript
it('should send correct appointment actions', async () => {
  await service.sendAppointmentActions('1234567890');

  const buttons = mockClient.sentInteractiveButtons[0].buttons;
  expect(buttons).toEqual([
    { id: 'confirm', title: 'Confirm' },
    { id: 'cancel', title: 'Cancel' },
    { id: 'modify', title: 'Modify' },
  ]);
});
```

### Pattern 4: Verify No Messages Sent

```typescript
it('should not send message when customer opted out', async () => {
  await service.sendNotification('opted-out-customer');

  expect(mockClient.getTotalMessagesSent()).toBe(0);
});
```

## Integration with NestJS Testing

### Using with Test Module

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { MockWhatsAppClient } from '@conversation/infra/external/__mocks__';

describe('ConversationService', () => {
  let service: ConversationService;
  let mockClient: MockWhatsAppClient;

  beforeEach(async () => {
    mockClient = new MockWhatsAppClient();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConversationService,
        {
          provide: 'IWhatsAppClient',
          useValue: mockClient,
        },
      ],
    }).compile();

    service = module.get<ConversationService>(ConversationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
```

## Best Practices

1. **Reset Between Tests**: Always reset the mock client in `beforeEach` to ensure test isolation
2. **Use Utility Methods**: Prefer `hasMessageBeenSent()` over manual array searching
3. **Test Error Cases**: Use `setShouldFail()` to test error handling
4. **Verify Message Content**: Don't just check if a message was sent, verify the content
5. **Test All Message Types**: Ensure you test text, buttons, lists, and locations
6. **Avoid Over-Mocking**: Only mock the WhatsApp client, not the entire service layer

## Common Pitfalls

❌ **Don't**: Forget to reset between tests

```typescript
// This will cause test pollution
it('test 1', async () => {
  await service.send('1234567890', 'Test');
  expect(mockClient.sentMessages).toHaveLength(1);
});

it('test 2', async () => {
  // This will fail because sentMessages still has 1 message from test 1
  expect(mockClient.sentMessages).toHaveLength(0);
});
```

✅ **Do**: Reset in beforeEach

```typescript
beforeEach(() => {
  mockClient.reset();
});
```

❌ **Don't**: Test implementation details

```typescript
// Too coupled to implementation
expect(mockClient.sentMessages[0].message).toBe('Exact message text');
```

✅ **Do**: Test behavior

```typescript
// Tests the behavior, not the exact wording
expect(mockClient.getLastMessageTo('1234567890')).toContain('appointment confirmed');
```

## See Also

- [IWhatsAppClient Interface](../../domain/interfaces/external/whatsapp-client.ts)
- [TwilioWhatsAppClient](../twilio-whatsapp-client.ts)
- [WhatsAppBusinessApiClient](../whatsapp-business-api-client.ts)
- [Mock Client Tests](./mock-whatsapp-client.spec.ts)

---

# WhatsApp API Simulator

HTTP server that simulates WhatsApp Business API for integration testing.

## Purpose

The `WhatsAppApiSimulator` provides a complete HTTP server that:

- ✅ Simulates WhatsApp Business API endpoints
- ✅ Handles message sending requests
- ✅ Simulates incoming messages via webhook callbacks
- ✅ Validates request format
- ✅ Simulates API errors and rate limits
- ✅ Tracks all sent and received messages
- ✅ Requires no WhatsApp credentials

## When to Use

| Use MockWhatsAppClient | Use WhatsAppApiSimulator    |
| ---------------------- | --------------------------- |
| Unit tests             | Integration tests           |
| Testing business logic | Testing HTTP layer          |
| Fast execution         | Realistic HTTP interactions |
| No network calls       | Testing webhook processing  |
| Simple assertions      | End-to-end message flows    |

## Installation

```typescript
import { WhatsAppApiSimulator } from '@conversation/infra/external/__mocks__';
```

## Basic Usage

### Simple Integration Test

```typescript
describe('WhatsApp Integration', () => {
  let simulator: WhatsAppApiSimulator;
  let app: INestApplication;

  beforeAll(async () => {
    // Start simulator
    simulator = new WhatsAppApiSimulator();
    await simulator.start(0); // Random port

    // Configure app to use simulator
    process.env.WHATSAPP_API_URL = simulator.getBaseUrl();
    process.env.WHATSAPP_PHONE_NUMBER_ID = 'test-phone-id';

    // Start NestJS app
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    // Configure simulator to send webhooks to app
    const appUrl = await app.getUrl();
    simulator.setWebhookUrl(`${appUrl}/webhooks/whatsapp`);
  });

  afterAll(async () => {
    await app.close();
    await simulator.stop();
  });

  beforeEach(() => {
    simulator.reset();
  });

  it('should send message via WhatsApp API', async () => {
    // Execute command that sends message
    await request(app.getHttpServer())
      .post('/api/admin-queries/123/respond')
      .send({ message: 'Hello customer' })
      .expect(200);

    // Verify message was sent to simulator
    expect(simulator.hasTextMessageBeenSent('+1234567890', 'Hello customer')).toBe(true);
  });
});
```

### Testing Incoming Messages

```typescript
it('should receive incoming message via webhook', async () => {
  // Simulate customer sending message
  await simulator.simulateIncomingMessage('+1234567890', 'I want to book');

  // Wait for processing
  await new Promise((resolve) => setTimeout(resolve, 100));

  // Verify message was processed
  const conversations = await conversationRepo.findByCustomerPhone('+1234567890');
  expect(conversations).toHaveLength(1);
  expect(conversations[0].messages).toContainEqual(
    expect.objectContaining({ content: 'I want to book' }),
  );
});
```

### Testing Button Interactions

```typescript
it('should handle button replies', async () => {
  // Simulate customer clicking button
  await simulator.simulateIncomingButtonReply('+1234567890', 'btn_confirm', 'Confirm Appointment');

  await new Promise((resolve) => setTimeout(resolve, 100));

  // Verify button action was processed
  const appointment = await appointmentRepo.findById('appt-123');
  expect(appointment.status).toBe('CONFIRMED');
});
```

### Testing List Interactions

```typescript
it('should handle list selections', async () => {
  // Simulate customer selecting from list
  await simulator.simulateIncomingListReply('+1234567890', 'slot_10am', '10:00 AM', 'Morning slot');

  await new Promise((resolve) => setTimeout(resolve, 100));

  // Verify selection was processed
  const appointment = await appointmentRepo.findByCustomer('+1234567890');
  expect(appointment.dateTime.getHours()).toBe(10);
});
```

## Advanced Features

### Simulating API Errors

```typescript
it('should handle API errors gracefully', async () => {
  // Configure simulator to fail
  simulator.setShouldFailSendMessage(true, 429, 'Rate limit exceeded');

  // Attempt to send message
  const response = await request(app.getHttpServer())
    .post('/api/admin-queries/123/respond')
    .send({ message: 'Hello' });

  // Verify error handling
  expect(response.status).toBe(500);
  expect(response.body.message).toContain('Failed to send message');
});
```

### Simulating Network Delays

```typescript
it('should handle slow API responses', async () => {
  simulator.setNetworkDelay(1000); // 1 second delay

  const startTime = Date.now();

  await request(app.getHttpServer())
    .post('/api/admin-queries/123/respond')
    .send({ message: 'Hello' });

  const elapsed = Date.now() - startTime;
  expect(elapsed).toBeGreaterThanOrEqual(1000);
});
```

### Testing Retry Logic

```typescript
it('should retry on transient failures', async () => {
  // First attempt fails
  simulator.setShouldFailSendMessage(true, 503, 'Service Unavailable');

  const firstAttempt = request(app.getHttpServer())
    .post('/api/admin-queries/123/respond')
    .send({ message: 'Hello' });

  await expect(firstAttempt).rejects.toThrow();

  // Second attempt succeeds
  simulator.setShouldFailSendMessage(false);

  await request(app.getHttpServer())
    .post('/api/admin-queries/123/respond')
    .send({ message: 'Hello' })
    .expect(200);

  expect(simulator.hasTextMessageBeenSent('+1234567890', 'Hello')).toBe(true);
});
```

## API Reference

### Lifecycle Methods

| Method         | Returns           | Description                             |
| -------------- | ----------------- | --------------------------------------- |
| `start(port?)` | `Promise<number>` | Start HTTP server (returns actual port) |
| `stop()`       | `Promise<void>`   | Stop HTTP server                        |
| `getBaseUrl()` | `string`          | Get server base URL                     |
| `getPort()`    | `number`          | Get server port                         |

### Configuration Methods

| Method                                                            | Description                    |
| ----------------------------------------------------------------- | ------------------------------ |
| `setWebhookUrl(url)`                                              | Configure webhook callback URL |
| `setPhoneNumberId(id)`                                            | Set phone number ID            |
| `setDisplayPhoneNumber(number)`                                   | Set display phone number       |
| `setShouldFailSendMessage(shouldFail, errorCode?, errorMessage?)` | Configure API errors           |
| `setNetworkDelay(delayMs)`                                        | Configure network delay        |

### Simulation Methods

| Method                                                                                            | Description             |
| ------------------------------------------------------------------------------------------------- | ----------------------- |
| `simulateIncomingMessage(from, text, customerName?)`                                              | Simulate text message   |
| `simulateIncomingButtonReply(from, buttonId, buttonTitle, customerName?)`                         | Simulate button click   |
| `simulateIncomingListReply(from, listItemId, listItemTitle, listItemDescription?, customerName?)` | Simulate list selection |

### Query Methods

| Method                              | Returns                | Description                    |
| ----------------------------------- | ---------------------- | ------------------------------ |
| `getSentMessages()`                 | `SendMessageRequest[]` | Get all sent messages          |
| `getReceivedMessages()`             | `IncomingMessage[]`    | Get all received messages      |
| `getLastSentMessageTo(to)`          | `SendMessageRequest?`  | Get last message to recipient  |
| `hasTextMessageBeenSent(to, text)`  | `boolean`              | Check if text message was sent |
| `hasInteractiveButtonsBeenSent(to)` | `boolean`              | Check if buttons were sent     |
| `hasInteractiveListBeenSent(to)`    | `boolean`              | Check if list was sent         |

### Cleanup Methods

| Method    | Description                                |
| --------- | ------------------------------------------ |
| `reset()` | Clear all messages and reset configuration |

## Testing Patterns

### Pattern 1: End-to-End Message Flow

```typescript
it('should complete full conversation flow', async () => {
  // 1. Customer sends initial message
  await simulator.simulateIncomingMessage('+1234567890', 'I want to book');
  await new Promise((resolve) => setTimeout(resolve, 100));

  // 2. Verify system sent options
  expect(simulator.hasInteractiveButtonsBeenSent('+1234567890')).toBe(true);

  // 3. Customer selects option
  await simulator.simulateIncomingButtonReply('+1234567890', 'btn_book', 'Book Now');
  await new Promise((resolve) => setTimeout(resolve, 100));

  // 4. Verify confirmation sent
  expect(simulator.hasTextMessageBeenSent('+1234567890', 'Appointment confirmed')).toBe(true);
});
```

### Pattern 2: Testing Webhook Validation

```typescript
it('should validate webhook signatures', async () => {
  // Send webhook without proper signature
  const response = await request(app.getHttpServer()).post('/webhooks/whatsapp').send({
    object: 'whatsapp_business_account',
    entry: [
      /* ... */
    ],
  });

  expect(response.status).toBe(403);
});
```

### Pattern 3: Testing Concurrent Messages

```typescript
it('should handle concurrent messages', async () => {
  // Send multiple messages simultaneously
  await Promise.all([
    simulator.simulateIncomingMessage('+1111111111', 'Message 1'),
    simulator.simulateIncomingMessage('+2222222222', 'Message 2'),
    simulator.simulateIncomingMessage('+3333333333', 'Message 3'),
  ]);

  await new Promise((resolve) => setTimeout(resolve, 200));

  // Verify all were processed
  const messages = simulator.getReceivedMessages();
  expect(messages).toHaveLength(3);
});
```

### Pattern 4: Testing Error Recovery

```typescript
it('should recover from API failures', async () => {
  // Simulate temporary API failure
  simulator.setShouldFailSendMessage(true, 503, 'Service Unavailable');

  // First attempt fails
  await expect(
    request(app.getHttpServer()).post('/api/admin-queries/123/respond').send({ message: 'Hello' }),
  ).rejects.toThrow();

  // API recovers
  simulator.setShouldFailSendMessage(false);

  // Retry succeeds
  await request(app.getHttpServer())
    .post('/api/admin-queries/123/respond')
    .send({ message: 'Hello' })
    .expect(200);
});
```

## Best Practices

1. **Always use random ports**: Pass `0` to `start()` to avoid port conflicts
2. **Wait for webhooks**: Add small delays after `simulateIncomingMessage()`
3. **Reset between tests**: Call `reset()` in `beforeEach`
4. **Stop simulator**: Always call `stop()` in `afterAll`
5. **Configure webhook URL**: Set webhook URL after app starts
6. **Test both directions**: Verify both sent messages and webhook delivery
7. **Test error scenarios**: Use `setShouldFailSendMessage()` for error testing
8. **Test network issues**: Use `setNetworkDelay()` for timeout testing

## Common Pitfalls

❌ **Don't**: Hardcode ports

```typescript
await simulator.start(3001); // May conflict with other tests
```

✅ **Do**: Use random ports

```typescript
await simulator.start(0); // Gets random available port
```

❌ **Don't**: Forget to wait for webhooks

```typescript
await simulator.simulateIncomingMessage('+1234567890', 'Test');
// Immediately check - webhook may not have been processed yet
expect(conversations).toHaveLength(1); // May fail
```

✅ **Do**: Add delays after webhook simulation

```typescript
await simulator.simulateIncomingMessage('+1234567890', 'Test');
await new Promise((resolve) => setTimeout(resolve, 100));
expect(conversations).toHaveLength(1); // Reliable
```

❌ **Don't**: Forget to stop simulator

```typescript
afterAll(async () => {
  await app.close();
  // Forgot to stop simulator - port remains occupied
});
```

✅ **Do**: Always stop simulator

```typescript
afterAll(async () => {
  await app.close();
  await simulator.stop();
});
```

## Troubleshooting

### Simulator not receiving requests

**Problem**: App is not sending requests to simulator

**Solutions**:

- Verify `WHATSAPP_API_URL` is set to `simulator.getBaseUrl()`
- Check that phone number ID matches in both app and simulator
- Ensure simulator is started before app initialization

### Webhooks not being delivered

**Problem**: Simulated messages not triggering webhooks

**Solutions**:

- Verify webhook URL is set: `simulator.setWebhookUrl(url)`
- Check that app is listening and webhook endpoint exists
- Add delays after `simulateIncomingMessage()` to allow processing
- Check app logs for webhook processing errors

### Tests timing out

**Problem**: Tests hang or timeout

**Solutions**:

- Increase test timeout for integration tests
- Add appropriate delays after async operations
- Check for unhandled promise rejections
- Verify simulator is properly stopped in `afterAll`

### Port conflicts

**Problem**: "Port already in use" errors

**Solutions**:

- Always use port `0` for random port assignment
- Don't hardcode ports in tests
- Ensure previous test runs cleaned up properly
- Check for orphaned processes

## Example Test Suite

```typescript
describe('WhatsApp Integration Tests', () => {
  let simulator: WhatsAppApiSimulator;
  let app: INestApplication;

  beforeAll(async () => {
    // Setup simulator
    simulator = new WhatsAppApiSimulator();
    await simulator.start(0);

    // Configure environment
    process.env.WHATSAPP_API_URL = simulator.getBaseUrl();
    process.env.WHATSAPP_PHONE_NUMBER_ID = 'test-phone-id';

    // Start app
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    // Configure webhook
    const appUrl = await app.getUrl();
    simulator.setWebhookUrl(`${appUrl}/webhooks/whatsapp`);
  });

  afterAll(async () => {
    await app.close();
    await simulator.stop();
  });

  beforeEach(() => {
    simulator.reset();
  });

  describe('Outbound Messages', () => {
    it('should send text message', async () => {
      await request(app.getHttpServer())
        .post('/api/admin-queries/123/respond')
        .send({ message: 'Hello' })
        .expect(200);

      expect(simulator.hasTextMessageBeenSent('+1234567890', 'Hello')).toBe(true);
    });

    it('should send interactive buttons', async () => {
      await request(app.getHttpServer()).post('/api/admin-queries/123/send-options').expect(200);

      expect(simulator.hasInteractiveButtonsBeenSent('+1234567890')).toBe(true);
    });
  });

  describe('Inbound Messages', () => {
    it('should receive text message', async () => {
      await simulator.simulateIncomingMessage('+1234567890', 'Hello');
      await new Promise((resolve) => setTimeout(resolve, 100));

      const conversations = await conversationRepo.findByCustomer('+1234567890');
      expect(conversations).toHaveLength(1);
    });

    it('should receive button reply', async () => {
      await simulator.simulateIncomingButtonReply('+1234567890', 'btn_yes', 'Yes');
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Verify action was processed
    });
  });

  describe('Error Handling', () => {
    it('should retry on API error', async () => {
      simulator.setShouldFailSendMessage(true, 503, 'Service Unavailable');

      // Test retry logic
    });

    it('should handle rate limits', async () => {
      simulator.setShouldFailSendMessage(true, 429, 'Rate limit exceeded');

      // Test rate limit handling
    });
  });
});
```

## Dependencies

The simulator requires:

- `express` - HTTP server
- `axios` - For webhook delivery (imported dynamically)
- `crypto` - For generating message IDs

These are already included in the backend dependencies.

## See Also

- [MockWhatsAppClient](#mock-whatsapp-client) - For unit testing
- [WhatsApp API Simulator Tests](./whatsapp-api-simulator.spec.ts)
- [Webhook Controller](../../presentation/controllers/webhook.ts)

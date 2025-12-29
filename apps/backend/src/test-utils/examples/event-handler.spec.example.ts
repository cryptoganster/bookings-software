/**
 * Event Handler Testing Example
 *
 * This file demonstrates how to write tests for Event Handlers in event-driven architecture.
 * Event Handlers react to Domain Events and trigger side effects (commands, notifications, etc.).
 *
 * Event Handler tests:
 * - Test event handling logic
 * - Mock CommandBus/QueryBus
 * - Verify side effects
 * - Test error handling (handlers fail silently)
 * - Test async event processing
 *
 * @see .kiro/steering/cqrs.md
 * @see .kiro/steering/PRD.md (Section 10: Event Handlers y Process Managers)
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus, QueryBus } from '@nestjs/cqrs';

/**
 * Example 1: Testing Simple Event Handler
 *
 * This is the most common pattern for testing Event Handlers.
 * We mock the CommandBus and verify that the correct command is dispatched.
 */
describe('OnAppointmentCreatedHandler', () => {
  let handler: any; // OnAppointmentCreatedHandler
  let mockCommandBus: any;

  beforeEach(async () => {
    // Create mock for CommandBus
    mockCommandBus = {
      execute: jest.fn(),
    };

    // Create testing module with mocked dependencies
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        // Handler under test
        // OnAppointmentCreatedHandler,

        // Mocked CommandBus
        {
          provide: CommandBus,
          useValue: mockCommandBus,
        },
      ],
    }).compile();

    // handler = module.get<OnAppointmentCreatedHandler>(OnAppointmentCreatedHandler);
  });

  /**
   * Test: Successful event handling
   *
   * Verifies that the handler:
   * 1. Receives the event
   * 2. Dispatches the correct command
   * 3. Passes correct parameters
   */
  it('should schedule reminder when appointment is created', async () => {
    // Arrange
    const event = {
      appointmentId: 'appointment-123',
      businessId: 'business-123',
      customerId: 'customer-123',
      offeringId: 'offering-123',
      dateTime: new Date('2025-01-15T10:00:00Z'),
      occurredAt: new Date(),
    };

    mockCommandBus.execute.mockResolvedValue({ reminderId: 'reminder-123' });

    // Act
    // await handler.handle(event);

    // Assert
    // Verify ScheduleReminderCommand was dispatched
    expect(mockCommandBus.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        appointmentId: 'appointment-123',
        dateTime: new Date('2025-01-15T10:00:00Z'),
      }),
    );

    // Verify command was called once
    expect(mockCommandBus.execute).toHaveBeenCalledTimes(1);
  });

  /**
   * Test: Error handling
   *
   * Event handlers should NOT throw errors.
   * They should log errors and continue.
   */
  it('should log error but not throw when command fails', async () => {
    // Arrange
    const event = {
      appointmentId: 'appointment-123',
      businessId: 'business-123',
      customerId: 'customer-123',
      offeringId: 'offering-123',
      dateTime: new Date('2025-01-15T10:00:00Z'),
      occurredAt: new Date(),
    };

    // Mock command failure
    mockCommandBus.execute.mockRejectedValue(new Error('Command failed'));

    // Spy on console.error
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    // Act
    // await handler.handle(event);

    // Assert
    // Verify error was logged
    expect(consoleErrorSpy).toHaveBeenCalled();

    // Verify handler did NOT throw
    // (test passes if no exception is thrown)

    // Cleanup
    consoleErrorSpy.mockRestore();
  });
});

/**
 * Example 2: Testing Event Handler with Multiple Commands
 *
 * This demonstrates testing handlers that dispatch multiple commands.
 */
describe('OnAppointmentCancelledHandler', () => {
  let handler: any;
  let mockCommandBus: any;

  beforeEach(async () => {
    mockCommandBus = {
      execute: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        // OnAppointmentCancelledHandler,
        {
          provide: CommandBus,
          useValue: mockCommandBus,
        },
      ],
    }).compile();

    // handler = module.get<OnAppointmentCancelledHandler>(OnAppointmentCancelledHandler);
  });

  /**
   * Test: Multiple commands are dispatched
   */
  it('should cancel reminder and send notification when appointment is cancelled', async () => {
    // Arrange
    const event = {
      appointmentId: 'appointment-123',
      customerId: 'customer-123',
      cancelledBy: 'user-123',
      occurredAt: new Date(),
    };

    mockCommandBus.execute.mockResolvedValue(undefined);

    // Act
    // await handler.handle(event);

    // Assert
    // Verify CancelReminderCommand was dispatched
    expect(mockCommandBus.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        appointmentId: 'appointment-123',
      }),
    );

    // Verify SendWhatsAppMessageCommand was dispatched
    expect(mockCommandBus.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        customerId: 'customer-123',
        // message content
      }),
    );

    // Verify both commands were called
    expect(mockCommandBus.execute).toHaveBeenCalledTimes(2);
  });

  /**
   * Test: Partial failure handling
   *
   * If one command fails, the handler should continue with others.
   */
  it('should continue with other commands if one fails', async () => {
    // Arrange
    const event = {
      appointmentId: 'appointment-123',
      customerId: 'customer-123',
      cancelledBy: 'user-123',
      occurredAt: new Date(),
    };

    // First command fails, second succeeds
    mockCommandBus.execute
      .mockRejectedValueOnce(new Error('Cancel reminder failed'))
      .mockResolvedValueOnce(undefined);

    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    // Act
    // await handler.handle(event);

    // Assert
    // Verify both commands were attempted
    expect(mockCommandBus.execute).toHaveBeenCalledTimes(2);

    // Verify error was logged
    expect(consoleErrorSpy).toHaveBeenCalled();

    // Cleanup
    consoleErrorSpy.mockRestore();
  });
});

/**
 * Example 3: Testing Event Handler with Query
 *
 * This demonstrates testing handlers that query data before dispatching commands.
 */
describe('OnCustomerLinkedToUserHandler', () => {
  let handler: any;
  let mockCommandBus: any;
  let mockQueryBus: any;

  beforeEach(async () => {
    mockCommandBus = {
      execute: jest.fn(),
    };

    mockQueryBus = {
      execute: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        // OnCustomerLinkedToUserHandler,
        {
          provide: CommandBus,
          useValue: mockCommandBus,
        },
        {
          provide: QueryBus,
          useValue: mockQueryBus,
        },
      ],
    }).compile();

    // handler = module.get<OnCustomerLinkedToUserHandler>(OnCustomerLinkedToUserHandler);
  });

  /**
   * Test: Query before command
   */
  it('should query user and add CUSTOMER role when customer is linked', async () => {
    // Arrange
    const event = {
      customerId: 'customer-123',
      userId: 'user-123',
      occurredAt: new Date(),
    };

    // Mock query result
    mockQueryBus.execute.mockResolvedValue({
      id: 'user-123',
      roles: ['BUSINESS_OWNER'], // User doesn't have CUSTOMER role yet
    });

    mockCommandBus.execute.mockResolvedValue(undefined);

    // Act
    // await handler.handle(event);

    // Assert
    // Verify user was queried
    expect(mockQueryBus.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-123',
      }),
    );

    // Verify AddUserRoleCommand was dispatched
    expect(mockCommandBus.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-123',
        role: 'CUSTOMER',
      }),
    );
  });

  /**
   * Test: Skip command if user already has role
   */
  it('should not add role if user already has CUSTOMER role', async () => {
    // Arrange
    const event = {
      customerId: 'customer-123',
      userId: 'user-123',
      occurredAt: new Date(),
    };

    // Mock query result - user already has CUSTOMER role
    mockQueryBus.execute.mockResolvedValue({
      id: 'user-123',
      roles: ['BUSINESS_OWNER', 'CUSTOMER'],
    });

    // Act
    // await handler.handle(event);

    // Assert
    // Verify user was queried
    expect(mockQueryBus.execute).toHaveBeenCalled();

    // Verify AddUserRoleCommand was NOT dispatched
    expect(mockCommandBus.execute).not.toHaveBeenCalled();
  });
});

/**
 * Example 4: Testing Event Handler with External Service
 *
 * This demonstrates testing handlers that call external services.
 */
describe('OnAdminQueryRequestedHandler', () => {
  let handler: any;
  let mockWhatsAppClient: any;

  beforeEach(async () => {
    mockWhatsAppClient = {
      sendMessage: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        // OnAdminQueryRequestedHandler,
        {
          provide: 'IWhatsAppClient',
          useValue: mockWhatsAppClient,
        },
      ],
    }).compile();

    // handler = module.get<OnAdminQueryRequestedHandler>(OnAdminQueryRequestedHandler);
  });

  /**
   * Test: External service is called
   */
  it('should send WhatsApp notification to admin when query is requested', async () => {
    // Arrange
    const event = {
      conversationId: 'conversation-123',
      customerId: 'customer-123',
      customerPhone: '+18095551234',
      message: 'I need help with my appointment',
      occurredAt: new Date(),
    };

    mockWhatsAppClient.sendMessage.mockResolvedValue({ messageId: 'msg-123' });

    // Act
    // await handler.handle(event);

    // Assert
    // Verify WhatsApp message was sent
    expect(mockWhatsAppClient.sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        to: expect.any(String), // Admin phone number
        message: expect.stringContaining('New customer query'),
      }),
    );
  });

  /**
   * Test: Retry on external service failure
   */
  it('should retry sending message if external service fails', async () => {
    // Arrange
    const event = {
      conversationId: 'conversation-123',
      customerId: 'customer-123',
      customerPhone: '+18095551234',
      message: 'I need help',
      occurredAt: new Date(),
    };

    // First attempt fails, second succeeds
    mockWhatsAppClient.sendMessage
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({ messageId: 'msg-123' });

    // Act
    // await handler.handle(event);

    // Assert
    // Verify retry was attempted
    expect(mockWhatsAppClient.sendMessage).toHaveBeenCalledTimes(2);
  });
});

/**
 * Example 5: Testing Event Handler with Conditional Logic
 *
 * This demonstrates testing handlers with business logic conditions.
 */
describe('OnUserRegisteredHandler', () => {
  let handler: any;
  let mockCommandBus: any;

  beforeEach(async () => {
    mockCommandBus = {
      execute: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        // OnUserRegisteredHandler,
        {
          provide: CommandBus,
          useValue: mockCommandBus,
        },
      ],
    }).compile();

    // handler = module.get<OnUserRegisteredHandler>(OnUserRegisteredHandler);
  });

  /**
   * Test: Conditional command dispatch based on role
   */
  it('should create BusinessOwner when user registers with BUSINESS_OWNER role', async () => {
    // Arrange
    const event = {
      userId: 'user-123',
      email: 'owner@example.com',
      name: 'John Doe',
      initialRole: 'BUSINESS_OWNER',
      occurredAt: new Date(),
    };

    mockCommandBus.execute.mockResolvedValue({ businessOwnerId: 'owner-123' });

    // Act
    // await handler.handle(event);

    // Assert
    // Verify CreateBusinessOwnerCommand was dispatched
    expect(mockCommandBus.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-123',
        subscriptionPlan: 'FREE', // Default plan
      }),
    );
  });

  /**
   * Test: No command dispatch for other roles
   */
  it('should not create BusinessOwner when user registers with CUSTOMER role', async () => {
    // Arrange
    const event = {
      userId: 'user-123',
      email: 'customer@example.com',
      name: 'Jane Doe',
      initialRole: 'CUSTOMER',
      occurredAt: new Date(),
    };

    // Act
    // await handler.handle(event);

    // Assert
    // Verify CreateBusinessOwnerCommand was NOT dispatched
    expect(mockCommandBus.execute).not.toHaveBeenCalled();
  });
});

/**
 * Tips for Testing Event Handlers:
 *
 * 1. **Mock CommandBus and QueryBus**
 *    - Event handlers orchestrate commands and queries
 *    - Mock both buses to verify correct calls
 *
 * 2. **Test Side Effects**
 *    - Verify correct commands are dispatched
 *    - Verify correct parameters are passed
 *    - Verify external services are called
 *
 * 3. **Test Error Handling**
 *    - Event handlers should NOT throw errors
 *    - They should log errors and continue
 *    - Test that errors are logged but not propagated
 *
 * 4. **Test Async Processing**
 *    - Event handlers are async by nature
 *    - Use async/await in tests
 *    - Verify promises are resolved
 *
 * 5. **Test Conditional Logic**
 *    - Test all branches of conditional logic
 *    - Verify commands are dispatched only when conditions are met
 *    - Test edge cases
 *
 * 6. **Test Multiple Commands**
 *    - Verify all commands are dispatched
 *    - Verify correct order if order matters
 *    - Test partial failures
 *
 * 7. **Test Retry Logic**
 *    - Verify retries are attempted
 *    - Verify exponential backoff if implemented
 *    - Verify max retries are respected
 *
 * 8. **Keep Tests Fast**
 *    - Use mocks, not real services
 *    - Tests should run in < 10ms
 *    - No real async delays
 *
 * 9. **Test Idempotency**
 *    - Event handlers should be idempotent
 *    - Test that handling same event twice is safe
 *    - Verify no duplicate side effects
 *
 * 10. **Document Side Effects**
 *     - Add comments explaining what side effects occur
 *     - Document why certain commands are dispatched
 *     - Explain business logic conditions
 */

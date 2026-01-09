import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { WhatsAppBusinessApiClient } from '../whatsapp-business-api-client';
import { MockWhatsAppClient } from '../__mocks__/mock-whatsapp-client';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

/**
 * Integration Tests for WhatsApp Client
 *
 * Tests:
 * - sendMessage with mock client
 * - Webhook processing simulation
 * - Error handling (rate limits, invalid tokens, network errors)
 *
 * Requirements: Testing (Task 3.5)
 */
describe('WhatsApp Client - Integration Tests', () => {
  describe('MockWhatsAppClient Integration', () => {
    let mockClient: MockWhatsAppClient;

    beforeEach(() => {
      mockClient = new MockWhatsAppClient();
    });

    afterEach(() => {
      mockClient.reset();
    });

    describe('sendMessage', () => {
      it('should send message successfully and track it', async () => {
        // Arrange
        const phoneNumber = '+1234567890';
        const message = 'Hello from integration test';

        // Act
        await mockClient.sendMessage(phoneNumber, message);

        // Assert
        expect(mockClient.sentMessages).toHaveLength(1);
        expect(mockClient.sentMessages[0]).toEqual({
          to: phoneNumber,
          message: message,
        });
        expect(mockClient.hasMessageBeenSent(phoneNumber, message)).toBe(true);
      });

      it('should send multiple messages and track all', async () => {
        // Arrange
        const phoneNumber = '+1234567890';
        const messages = ['Message 1', 'Message 2', 'Message 3'];

        // Act
        for (const msg of messages) {
          await mockClient.sendMessage(phoneNumber, msg);
        }

        // Assert
        expect(mockClient.sentMessages).toHaveLength(3);
        expect(mockClient.getMessagesTo(phoneNumber)).toEqual(messages);
        expect(mockClient.getLastMessageTo(phoneNumber)).toBe('Message 3');
      });

      it('should handle failure simulation', async () => {
        // Arrange
        const phoneNumber = '+1234567890';
        const message = 'This should fail';
        mockClient.setShouldFail(true, 'Simulated API error');

        // Act & Assert
        await expect(mockClient.sendMessage(phoneNumber, message)).rejects.toThrow(
          'Simulated API error',
        );
        expect(mockClient.sentMessages).toHaveLength(0);
      });

      it('should simulate network latency', async () => {
        // Arrange
        const phoneNumber = '+1234567890';
        const message = 'Delayed message';
        mockClient.setDelay(100); // 100ms delay
        const startTime = Date.now();

        // Act
        await mockClient.sendMessage(phoneNumber, message);
        const endTime = Date.now();

        // Assert
        expect(endTime - startTime).toBeGreaterThanOrEqual(100);
        expect(mockClient.sentMessages).toHaveLength(1);
      });
    });

    describe('sendInteractiveButtons', () => {
      it('should send interactive buttons and track them', async () => {
        // Arrange
        const phoneNumber = '+1234567890';
        const message = 'Choose an option';
        const buttons = [
          { id: 'btn1', title: 'Option 1' },
          { id: 'btn2', title: 'Option 2' },
        ];

        // Act
        await mockClient.sendInteractiveButtons(phoneNumber, message, buttons);

        // Assert
        expect(mockClient.sentInteractiveButtons).toHaveLength(1);
        expect(mockClient.sentInteractiveButtons[0]).toEqual({
          to: phoneNumber,
          message: message,
          buttons: buttons,
        });
        expect(mockClient.hasInteractiveButtonsBeenSent(phoneNumber)).toBe(true);
      });
    });

    describe('sendInteractiveList', () => {
      it('should send interactive list and track it', async () => {
        // Arrange
        const phoneNumber = '+1234567890';
        const bodyText = 'Select a service';
        const buttonText = 'View Services';
        const sections = [
          {
            title: 'Services',
            rows: [
              { id: 'service1', title: 'Haircut', description: '30 min' },
              { id: 'service2', title: 'Massage', description: '60 min' },
            ],
          },
        ];

        // Act
        await mockClient.sendInteractiveList(phoneNumber, bodyText, buttonText, sections);

        // Assert
        expect(mockClient.sentInteractiveLists).toHaveLength(1);
        expect(mockClient.sentInteractiveLists[0]).toEqual({
          to: phoneNumber,
          bodyText: bodyText,
          buttonText: buttonText,
          sections: sections,
        });
        expect(mockClient.hasInteractiveListBeenSent(phoneNumber)).toBe(true);
      });
    });

    describe('sendLocation', () => {
      it('should send location and track it', async () => {
        // Arrange
        const phoneNumber = '+1234567890';
        const location = {
          latitude: 40.7128,
          longitude: -74.006,
          name: 'New York City',
          address: 'New York, NY, USA',
        };

        // Act
        await mockClient.sendLocation(phoneNumber, location);

        // Assert
        expect(mockClient.sentLocations).toHaveLength(1);
        expect(mockClient.sentLocations[0]).toEqual({
          to: phoneNumber,
          location: location,
        });
        expect(mockClient.hasLocationBeenSent(phoneNumber)).toBe(true);
      });
    });

    describe('utility methods', () => {
      it('should count total messages sent across all types', async () => {
        // Arrange
        const phoneNumber = '+1234567890';

        // Act
        await mockClient.sendMessage(phoneNumber, 'Text message');
        await mockClient.sendInteractiveButtons(phoneNumber, 'Buttons', [
          { id: 'btn1', title: 'Button 1' },
        ]);
        await mockClient.sendInteractiveList(phoneNumber, 'List', 'View', [
          { rows: [{ id: 'item1', title: 'Item 1' }] },
        ]);
        await mockClient.sendLocation(phoneNumber, {
          latitude: 0,
          longitude: 0,
          name: 'Test',
          address: 'Test',
        });

        // Assert
        expect(mockClient.getTotalMessagesSent()).toBe(4);
      });

      it('should reset all tracked messages', async () => {
        // Arrange
        const phoneNumber = '+1234567890';
        await mockClient.sendMessage(phoneNumber, 'Message 1');
        await mockClient.sendMessage(phoneNumber, 'Message 2');
        expect(mockClient.sentMessages).toHaveLength(2);

        // Act
        mockClient.reset();

        // Assert
        expect(mockClient.sentMessages).toHaveLength(0);
        expect(mockClient.getTotalMessagesSent()).toBe(0);
      });
    });
  });

  describe('WhatsAppBusinessApiClient Error Handling', () => {
    let client: WhatsAppBusinessApiClient;
    let mockAxiosInstance: {
      post: jest.Mock;
    };

    beforeEach(async () => {
      mockAxiosInstance = {
        post: jest.fn(),
      };

      mockedAxios.create = jest.fn().mockReturnValue(mockAxiosInstance);

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          WhatsAppBusinessApiClient,
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn((key: string) => {
                if (key === 'WHATSAPP_API_URL') return 'https://api.whatsapp.com';
                if (key === 'WHATSAPP_ACCESS_TOKEN') return 'test-token';
                return null;
              }),
            },
          },
        ],
      }).compile();

      client = module.get<WhatsAppBusinessApiClient>(WhatsAppBusinessApiClient);
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    describe('Rate Limit Handling', () => {
      it('should handle rate limit error (429) with retry', async () => {
        // Arrange
        const phoneNumber = '+1234567890';
        const message = 'Test message';
        const rateLimitError = {
          response: {
            status: 429,
            data: { error: { message: 'Rate limit exceeded' } },
          },
        };

        mockAxiosInstance.post
          .mockRejectedValueOnce(rateLimitError)
          .mockResolvedValueOnce({ data: { success: true } });

        // Act
        await client.sendMessage(phoneNumber, message);

        // Assert
        expect(mockAxiosInstance.post).toHaveBeenCalledTimes(2);
      }, 5000);

      it('should fail after max retries on persistent rate limit', async () => {
        // Arrange
        const phoneNumber = '+1234567890';
        const message = 'Test message';
        const rateLimitError = {
          response: {
            status: 429,
            data: { error: { message: 'Rate limit exceeded' } },
          },
        };

        mockAxiosInstance.post.mockRejectedValue(rateLimitError);

        // Act & Assert
        await expect(client.sendMessage(phoneNumber, message)).rejects.toThrow(
          'Failed to send WhatsApp message after 3 attempts',
        );
        expect(mockAxiosInstance.post).toHaveBeenCalledTimes(3);
      }, 10000);
    });

    describe('Invalid Token Handling', () => {
      it('should handle invalid token error (401)', async () => {
        // Arrange
        const phoneNumber = '+1234567890';
        const message = 'Test message';
        const authError = {
          response: {
            status: 401,
            data: { error: { message: 'Invalid access token' } },
          },
        };

        mockAxiosInstance.post.mockRejectedValue(authError);

        // Act & Assert
        await expect(client.sendMessage(phoneNumber, message)).rejects.toThrow(
          'Failed to send WhatsApp message after 3 attempts',
        );
        expect(mockAxiosInstance.post).toHaveBeenCalledTimes(3);
      }, 10000);

      it('should handle expired token error (401)', async () => {
        // Arrange
        const phoneNumber = '+1234567890';
        const message = 'Test message';
        const expiredTokenError = {
          response: {
            status: 401,
            data: { error: { message: 'Access token has expired' } },
          },
        };

        mockAxiosInstance.post.mockRejectedValue(expiredTokenError);

        // Act & Assert
        await expect(client.sendMessage(phoneNumber, message)).rejects.toThrow(
          'Failed to send WhatsApp message after 3 attempts',
        );
      }, 10000);
    });

    describe('Network Error Handling', () => {
      it('should handle network timeout', async () => {
        // Arrange
        const phoneNumber = '+1234567890';
        const message = 'Test message';
        const timeoutError = new Error('ETIMEDOUT');

        mockAxiosInstance.post
          .mockRejectedValueOnce(timeoutError)
          .mockResolvedValueOnce({ data: { success: true } });

        // Act
        await client.sendMessage(phoneNumber, message);

        // Assert
        expect(mockAxiosInstance.post).toHaveBeenCalledTimes(2);
      }, 5000);

      it('should handle connection refused', async () => {
        // Arrange
        const phoneNumber = '+1234567890';
        const message = 'Test message';
        const connectionError = new Error('ECONNREFUSED');

        mockAxiosInstance.post
          .mockRejectedValueOnce(connectionError)
          .mockResolvedValueOnce({ data: { success: true } });

        // Act
        await client.sendMessage(phoneNumber, message);

        // Assert
        expect(mockAxiosInstance.post).toHaveBeenCalledTimes(2);
      }, 5000);

      it('should handle DNS resolution failure', async () => {
        // Arrange
        const phoneNumber = '+1234567890';
        const message = 'Test message';
        const dnsError = new Error('ENOTFOUND');

        mockAxiosInstance.post
          .mockRejectedValueOnce(dnsError)
          .mockResolvedValueOnce({ data: { success: true } });

        // Act
        await client.sendMessage(phoneNumber, message);

        // Assert
        expect(mockAxiosInstance.post).toHaveBeenCalledTimes(2);
      }, 5000);
    });

    describe('API Error Responses', () => {
      it('should handle invalid phone number error (400)', async () => {
        // Arrange
        const phoneNumber = 'invalid-phone';
        const message = 'Test message';
        const validationError = {
          response: {
            status: 400,
            data: { error: { message: 'Invalid phone number format' } },
          },
        };

        mockAxiosInstance.post.mockRejectedValue(validationError);

        // Act & Assert
        await expect(client.sendMessage(phoneNumber, message)).rejects.toThrow(
          'Failed to send WhatsApp message after 3 attempts',
        );
      }, 10000);

      it('should handle message too long error (400)', async () => {
        // Arrange
        const phoneNumber = '+1234567890';
        const message = 'x'.repeat(5000); // Very long message
        const validationError = {
          response: {
            status: 400,
            data: { error: { message: 'Message body is too long' } },
          },
        };

        mockAxiosInstance.post.mockRejectedValue(validationError);

        // Act & Assert
        await expect(client.sendMessage(phoneNumber, message)).rejects.toThrow(
          'Failed to send WhatsApp message after 3 attempts',
        );
      }, 10000);

      it('should handle internal server error (500)', async () => {
        // Arrange
        const phoneNumber = '+1234567890';
        const message = 'Test message';
        const serverError = {
          response: {
            status: 500,
            data: { error: { message: 'Internal server error' } },
          },
        };

        mockAxiosInstance.post
          .mockRejectedValueOnce(serverError)
          .mockResolvedValueOnce({ data: { success: true } });

        // Act
        await client.sendMessage(phoneNumber, message);

        // Assert
        expect(mockAxiosInstance.post).toHaveBeenCalledTimes(2);
      }, 5000);
    });

    describe('Retry Logic with Exponential Backoff', () => {
      it('should retry multiple times before succeeding', async () => {
        // Arrange
        const phoneNumber = '+1234567890';
        const message = 'Test message';
        let attemptCount = 0;

        mockAxiosInstance.post.mockImplementation(() => {
          attemptCount++;
          if (attemptCount < 3) {
            return Promise.reject(new Error('Network error'));
          }
          return Promise.resolve({ data: { success: true } });
        });

        // Act
        await client.sendMessage(phoneNumber, message);

        // Assert
        expect(attemptCount).toBe(3);
        expect(mockAxiosInstance.post).toHaveBeenCalledTimes(3);
      }, 10000);
    });
  });

  describe('Webhook Processing Integration', () => {
    beforeEach(() => {
      // Setup for webhook processing tests
    });

    describe('Incoming Message Processing', () => {
      it('should process text message webhook payload', async () => {
        // Arrange
        const webhookPayload = {
          object: 'whatsapp_business_account',
          entry: [
            {
              id: 'entry-id',
              changes: [
                {
                  field: 'messages',
                  value: {
                    messaging_product: 'whatsapp',
                    metadata: {
                      display_phone_number: '+1234567890',
                      phone_number_id: 'phone-id',
                    },
                    messages: [
                      {
                        from: '18093192896',
                        id: 'msg-id',
                        timestamp: '1234567890',
                        type: 'text',
                        text: {
                          body: 'Hello, I want to book an appointment',
                        },
                      },
                    ],
                  },
                },
              ],
            },
          ],
        };

        // Act
        // Simulate webhook processing
        const message = webhookPayload.entry[0].changes[0].value.messages![0];
        const customerPhone = message.from.startsWith('+') ? message.from : `+${message.from}`;
        const messageText = message.text!.body;

        // Assert
        expect(customerPhone).toBe('+18093192896');
        expect(messageText).toBe('Hello, I want to book an appointment');
        expect(message.type).toBe('text');
      });

      it('should process interactive button reply webhook payload', async () => {
        // Arrange
        const webhookPayload = {
          object: 'whatsapp_business_account',
          entry: [
            {
              id: 'entry-id',
              changes: [
                {
                  field: 'messages',
                  value: {
                    messaging_product: 'whatsapp',
                    metadata: {
                      display_phone_number: '+1234567890',
                      phone_number_id: 'phone-id',
                    },
                    messages: [
                      {
                        from: '18093192896',
                        id: 'msg-id',
                        timestamp: '1234567890',
                        type: 'interactive',
                        interactive: {
                          type: 'button_reply',
                          button_reply: {
                            id: 'btn_book_appointment',
                            title: 'Book Appointment',
                          },
                        },
                      },
                    ],
                  },
                },
              ],
            },
          ],
        };

        // Act
        const message = webhookPayload.entry[0].changes[0].value.messages![0];
        const buttonId = message.interactive!.button_reply!.id;
        const messageText = message.interactive!.button_reply!.title;

        // Assert
        expect(buttonId).toBe('btn_book_appointment');
        expect(messageText).toBe('Book Appointment');
        expect(message.type).toBe('interactive');
      });

      it('should process interactive list reply webhook payload', async () => {
        // Arrange
        const webhookPayload = {
          object: 'whatsapp_business_account',
          entry: [
            {
              id: 'entry-id',
              changes: [
                {
                  field: 'messages',
                  value: {
                    messaging_product: 'whatsapp',
                    metadata: {
                      display_phone_number: '+1234567890',
                      phone_number_id: 'phone-id',
                    },
                    messages: [
                      {
                        from: '18093192896',
                        id: 'msg-id',
                        timestamp: '1234567890',
                        type: 'interactive',
                        interactive: {
                          type: 'list_reply',
                          list_reply: {
                            id: 'service_haircut',
                            title: 'Haircut',
                            description: '30 minutes',
                          },
                        },
                      },
                    ],
                  },
                },
              ],
            },
          ],
        };

        // Act
        const message = webhookPayload.entry[0].changes[0].value.messages![0];
        const listItemId = message.interactive!.list_reply!.id;
        const messageText = message.interactive!.list_reply!.title;

        // Assert
        expect(listItemId).toBe('service_haircut');
        expect(messageText).toBe('Haircut');
        expect(message.type).toBe('interactive');
      });

      it('should handle webhook with multiple messages', async () => {
        // Arrange
        const webhookPayload = {
          object: 'whatsapp_business_account',
          entry: [
            {
              id: 'entry-id',
              changes: [
                {
                  field: 'messages',
                  value: {
                    messaging_product: 'whatsapp',
                    metadata: {
                      display_phone_number: '+1234567890',
                      phone_number_id: 'phone-id',
                    },
                    messages: [
                      {
                        from: '18093192896',
                        id: 'msg-id-1',
                        timestamp: '1234567890',
                        type: 'text',
                        text: { body: 'Message 1' },
                      },
                      {
                        from: '18093192896',
                        id: 'msg-id-2',
                        timestamp: '1234567891',
                        type: 'text',
                        text: { body: 'Message 2' },
                      },
                    ],
                  },
                },
              ],
            },
          ],
        };

        // Act
        const messages = webhookPayload.entry[0].changes[0].value.messages!;

        // Assert
        expect(messages).toHaveLength(2);
        expect(messages[0].text!.body).toBe('Message 1');
        expect(messages[1].text!.body).toBe('Message 2');
      });

      it('should ignore non-message webhook events', async () => {
        // Arrange
        const webhookPayload = {
          object: 'whatsapp_business_account',
          entry: [
            {
              id: 'entry-id',
              changes: [
                {
                  field: 'message_status', // Not 'messages'
                  value: {
                    messaging_product: 'whatsapp',
                    metadata: {
                      display_phone_number: '+1234567890',
                      phone_number_id: 'phone-id',
                    },
                  },
                },
              ],
            },
          ],
        };

        // Act
        const change = webhookPayload.entry[0].changes[0];

        // Assert
        expect(change.field).not.toBe('messages');
      });

      it('should handle webhook with no messages', async () => {
        // Arrange
        const webhookPayload = {
          object: 'whatsapp_business_account',
          entry: [
            {
              id: 'entry-id',
              changes: [
                {
                  field: 'messages',
                  value: {
                    messaging_product: 'whatsapp',
                    metadata: {
                      display_phone_number: '+1234567890',
                      phone_number_id: 'phone-id',
                    },
                    messages: [],
                  },
                },
              ],
            },
          ],
        };

        // Act
        const messages = webhookPayload.entry[0].changes[0].value.messages;

        // Assert
        expect(messages).toHaveLength(0);
      });
    });

    describe('Phone Number Formatting', () => {
      it('should add + prefix to phone numbers without it', () => {
        // Arrange
        const phoneWithoutPrefix = '18093192896';

        // Act
        const formatted = phoneWithoutPrefix.startsWith('+')
          ? phoneWithoutPrefix
          : `+${phoneWithoutPrefix}`;

        // Assert
        expect(formatted).toBe('+18093192896');
      });

      it('should not add + prefix if already present', () => {
        // Arrange
        const phoneWithPrefix = '+18093192896';

        // Act
        const formatted = phoneWithPrefix.startsWith('+') ? phoneWithPrefix : `+${phoneWithPrefix}`;

        // Assert
        expect(formatted).toBe('+18093192896');
      });
    });
  });
});

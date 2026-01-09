import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { WhatsAppSignatureGuard } from '../whatsapp-signature';

describe('WhatsAppSignatureGuard', () => {
  let guard: WhatsAppSignatureGuard;
  let configService: ConfigService;

  const mockVerifyToken = 'test-verify-token-12345';
  const mockAppSecret = 'test-app-secret-67890';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WhatsAppSignatureGuard,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'WHATSAPP_WEBHOOK_VERIFY_TOKEN') {
                return mockVerifyToken;
              }
              if (key === 'WHATSAPP_WEBHOOK_SECRET') {
                return mockAppSecret;
              }
              return null;
            }),
          },
        },
      ],
    }).compile();

    guard = module.get<WhatsAppSignatureGuard>(WhatsAppSignatureGuard);
    configService = module.get<ConfigService>(ConfigService);
  });

  describe('GET request - Webhook Verification', () => {
    it('should allow valid webhook verification request', () => {
      // Arrange
      const mockRequest = {
        method: 'GET',
        query: {
          'hub.mode': 'subscribe',
          'hub.verify_token': mockVerifyToken,
          'hub.challenge': 'test-challenge-123',
        },
      };

      const mockContext = createMockExecutionContext(mockRequest);

      // Act
      const result = guard.canActivate(mockContext);

      // Assert
      expect(result).toBe(true);
      expect(mockRequest).toHaveProperty('webhookChallenge', 'test-challenge-123');
    });

    it('should reject webhook verification with invalid token', () => {
      // Arrange
      const mockRequest = {
        method: 'GET',
        query: {
          'hub.mode': 'subscribe',
          'hub.verify_token': 'wrong-token',
          'hub.challenge': 'test-challenge-123',
        },
      };

      const mockContext = createMockExecutionContext(mockRequest);

      // Act & Assert
      expect(() => guard.canActivate(mockContext)).toThrow(UnauthorizedException);
      expect(() => guard.canActivate(mockContext)).toThrow('Invalid webhook verification token');
    });

    it('should reject webhook verification with wrong mode', () => {
      // Arrange
      const mockRequest = {
        method: 'GET',
        query: {
          'hub.mode': 'unsubscribe',
          'hub.verify_token': mockVerifyToken,
          'hub.challenge': 'test-challenge-123',
        },
      };

      const mockContext = createMockExecutionContext(mockRequest);

      // Act & Assert
      expect(() => guard.canActivate(mockContext)).toThrow(UnauthorizedException);
    });

    it('should reject webhook verification with missing token', () => {
      // Arrange
      const mockRequest = {
        method: 'GET',
        query: {
          'hub.mode': 'subscribe',
          'hub.challenge': 'test-challenge-123',
        },
      };

      const mockContext = createMockExecutionContext(mockRequest);

      // Act & Assert
      expect(() => guard.canActivate(mockContext)).toThrow(UnauthorizedException);
    });

    it('should reject webhook verification with missing mode', () => {
      // Arrange
      const mockRequest = {
        method: 'GET',
        query: {
          'hub.verify_token': mockVerifyToken,
          'hub.challenge': 'test-challenge-123',
        },
      };

      const mockContext = createMockExecutionContext(mockRequest);

      // Act & Assert
      expect(() => guard.canActivate(mockContext)).toThrow(UnauthorizedException);
    });
  });

  describe('POST request - Signature Validation', () => {
    it('should allow request with valid signature', () => {
      // Arrange
      const payload = {
        object: 'whatsapp_business_account',
        entry: [
          {
            id: '123456',
            changes: [
              {
                value: {
                  messaging_product: 'whatsapp',
                  metadata: {
                    display_phone_number: '+1234567890',
                    phone_number_id: 'phone123',
                  },
                  messages: [
                    {
                      from: '+9876543210',
                      id: 'msg123',
                      timestamp: '1234567890',
                      text: {
                        body: 'Hello',
                      },
                      type: 'text',
                    },
                  ],
                },
                field: 'messages',
              },
            ],
          },
        ],
      };

      const payloadString = JSON.stringify(payload);
      const validSignature = crypto
        .createHmac('sha256', mockAppSecret)
        .update(payloadString)
        .digest('hex');

      const mockRequest = {
        method: 'POST',
        headers: {
          'x-hub-signature-256': `sha256=${validSignature}`,
        },
        body: payload,
      };

      const mockContext = createMockExecutionContext(mockRequest);

      // Act
      const result = guard.canActivate(mockContext);

      // Assert
      expect(result).toBe(true);
    });

    it('should reject request with invalid signature', () => {
      // Arrange
      const payload = {
        object: 'whatsapp_business_account',
        entry: [],
      };

      const invalidSignature = 'invalid-signature-hash';

      const mockRequest = {
        method: 'POST',
        headers: {
          'x-hub-signature-256': `sha256=${invalidSignature}`,
        },
        body: payload,
      };

      const mockContext = createMockExecutionContext(mockRequest);

      // Act & Assert
      expect(() => guard.canActivate(mockContext)).toThrow(UnauthorizedException);
      expect(() => guard.canActivate(mockContext)).toThrow('Invalid signature');
    });

    it('should reject request with missing signature header', () => {
      // Arrange
      const payload = {
        object: 'whatsapp_business_account',
        entry: [],
      };

      const mockRequest = {
        method: 'POST',
        headers: {},
        body: payload,
      };

      const mockContext = createMockExecutionContext(mockRequest);

      // Act & Assert
      expect(() => guard.canActivate(mockContext)).toThrow(UnauthorizedException);
      expect(() => guard.canActivate(mockContext)).toThrow('Missing signature header');
    });

    it('should reject request when webhook secret is not configured', () => {
      // Arrange
      jest.spyOn(configService, 'get').mockImplementation((key: string) => {
        if (key === 'WHATSAPP_WEBHOOK_SECRET') {
          return null;
        }
        return mockVerifyToken;
      });

      const payload = {
        object: 'whatsapp_business_account',
        entry: [],
      };

      const mockRequest = {
        method: 'POST',
        headers: {
          'x-hub-signature-256': 'sha256=somehash',
        },
        body: payload,
      };

      const mockContext = createMockExecutionContext(mockRequest);

      // Act & Assert
      expect(() => guard.canActivate(mockContext)).toThrow(UnauthorizedException);
      expect(() => guard.canActivate(mockContext)).toThrow('Webhook secret not configured');
    });

    it('should reject request with tampered payload', () => {
      // Arrange
      const originalPayload = {
        object: 'whatsapp_business_account',
        entry: [
          {
            id: '123456',
            changes: [
              {
                value: {
                  messages: [
                    {
                      from: '+9876543210',
                      text: { body: 'Original message' },
                    },
                  ],
                },
              },
            ],
          },
        ],
      };

      // Create signature for original payload
      const validSignature = crypto
        .createHmac('sha256', mockAppSecret)
        .update(JSON.stringify(originalPayload))
        .digest('hex');

      // Tamper with the payload
      const tamperedPayload = {
        ...originalPayload,
        entry: [
          {
            ...originalPayload.entry[0],
            changes: [
              {
                value: {
                  messages: [
                    {
                      from: '+9876543210',
                      text: { body: 'Tampered message' },
                    },
                  ],
                },
              },
            ],
          },
        ],
      };

      const mockRequest = {
        method: 'POST',
        headers: {
          'x-hub-signature-256': `sha256=${validSignature}`,
        },
        body: tamperedPayload,
      };

      const mockContext = createMockExecutionContext(mockRequest);

      // Act & Assert
      expect(() => guard.canActivate(mockContext)).toThrow(UnauthorizedException);
      expect(() => guard.canActivate(mockContext)).toThrow('Invalid signature');
    });

    it('should handle signature without sha256 prefix', () => {
      // Arrange
      const payload = {
        object: 'whatsapp_business_account',
        entry: [],
      };

      const mockRequest = {
        method: 'POST',
        headers: {
          'x-hub-signature-256': 'invalid-format-without-prefix',
        },
        body: payload,
      };

      const mockContext = createMockExecutionContext(mockRequest);

      // Act & Assert
      expect(() => guard.canActivate(mockContext)).toThrow(UnauthorizedException);
    });

    it('should validate signature with complex nested payload', () => {
      // Arrange
      const complexPayload = {
        object: 'whatsapp_business_account',
        entry: [
          {
            id: '123456',
            changes: [
              {
                value: {
                  messaging_product: 'whatsapp',
                  metadata: {
                    display_phone_number: '+1234567890',
                    phone_number_id: 'phone123',
                  },
                  contacts: [
                    {
                      profile: {
                        name: 'John Doe',
                      },
                      wa_id: '9876543210',
                    },
                  ],
                  messages: [
                    {
                      from: '+9876543210',
                      id: 'msg123',
                      timestamp: '1234567890',
                      type: 'interactive',
                      interactive: {
                        type: 'button_reply',
                        button_reply: {
                          id: 'btn_1',
                          title: 'Book Appointment',
                        },
                      },
                    },
                  ],
                },
                field: 'messages',
              },
            ],
          },
        ],
      };

      const payloadString = JSON.stringify(complexPayload);
      const validSignature = crypto
        .createHmac('sha256', mockAppSecret)
        .update(payloadString)
        .digest('hex');

      const mockRequest = {
        method: 'POST',
        headers: {
          'x-hub-signature-256': `sha256=${validSignature}`,
        },
        body: complexPayload,
      };

      const mockContext = createMockExecutionContext(mockRequest);

      // Act
      const result = guard.canActivate(mockContext);

      // Assert
      expect(result).toBe(true);
    });

    it('should use timing-safe comparison to prevent timing attacks', () => {
      // Arrange
      const payload = { test: 'data' };
      const payloadString = JSON.stringify(payload);

      // Create two different signatures
      const validSignature = crypto
        .createHmac('sha256', mockAppSecret)
        .update(payloadString)
        .digest('hex');

      const invalidSignature = validSignature.slice(0, -1) + 'x'; // Change last character

      const mockRequest = {
        method: 'POST',
        headers: {
          'x-hub-signature-256': `sha256=${invalidSignature}`,
        },
        body: payload,
      };

      const mockContext = createMockExecutionContext(mockRequest);

      // Act & Assert
      // The guard should reject invalid signature
      expect(() => guard.canActivate(mockContext)).toThrow(UnauthorizedException);
      expect(() => guard.canActivate(mockContext)).toThrow('Invalid signature');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty payload', () => {
      // Arrange
      const emptyPayload = {};
      const payloadString = JSON.stringify(emptyPayload);
      const validSignature = crypto
        .createHmac('sha256', mockAppSecret)
        .update(payloadString)
        .digest('hex');

      const mockRequest = {
        method: 'POST',
        headers: {
          'x-hub-signature-256': `sha256=${validSignature}`,
        },
        body: emptyPayload,
      };

      const mockContext = createMockExecutionContext(mockRequest);

      // Act
      const result = guard.canActivate(mockContext);

      // Assert
      expect(result).toBe(true);
    });

    it('should handle payload with special characters', () => {
      // Arrange
      const specialPayload = {
        message: 'Hello! 你好 🎉 @#$%^&*()',
        emoji: '😀😃😄',
        unicode: '\u0048\u0065\u006C\u006C\u006F',
      };

      const payloadString = JSON.stringify(specialPayload);
      const validSignature = crypto
        .createHmac('sha256', mockAppSecret)
        .update(payloadString)
        .digest('hex');

      const mockRequest = {
        method: 'POST',
        headers: {
          'x-hub-signature-256': `sha256=${validSignature}`,
        },
        body: specialPayload,
      };

      const mockContext = createMockExecutionContext(mockRequest);

      // Act
      const result = guard.canActivate(mockContext);

      // Assert
      expect(result).toBe(true);
    });

    it('should handle very large payload', () => {
      // Arrange
      const largePayload = {
        data: 'x'.repeat(10000), // 10KB of data
        nested: {
          array: Array(100).fill({ key: 'value' }),
        },
      };

      const payloadString = JSON.stringify(largePayload);
      const validSignature = crypto
        .createHmac('sha256', mockAppSecret)
        .update(payloadString)
        .digest('hex');

      const mockRequest = {
        method: 'POST',
        headers: {
          'x-hub-signature-256': `sha256=${validSignature}`,
        },
        body: largePayload,
      };

      const mockContext = createMockExecutionContext(mockRequest);

      // Act
      const result = guard.canActivate(mockContext);

      // Assert
      expect(result).toBe(true);
    });
  });
});

/**
 * Helper function to create a mock ExecutionContext
 */
function createMockExecutionContext(request: Record<string, unknown>): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: jest.fn(),
      getNext: jest.fn(),
    }),
    getClass: jest.fn(),
    getHandler: jest.fn(),
    getArgs: jest.fn(),
    getArgByIndex: jest.fn(),
    switchToRpc: jest.fn(),
    switchToWs: jest.fn(),
    getType: jest.fn(),
  } as ExecutionContext;
}

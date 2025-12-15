import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { WhatsAppBusinessApiClient } from '../whatsapp-business-api-client';
import * as fc from 'fast-check';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('WhatsAppBusinessApiClient - Property Tests', () => {
  let client: WhatsAppBusinessApiClient;
  let mockAxiosInstance: any;

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

  // Property 9: WhatsApp message sending retries on failure - Validates: Requirements 6.5
  it('should retry exactly 3 times on failure before throwing error', async () => {
    const phoneNumber = '+1234567890';
    const message = 'Test message';

    // Arrange: Mock all attempts to fail
    mockAxiosInstance.post.mockRejectedValue(new Error('Network error'));

    // Act & Assert
    await expect(client.sendMessage(phoneNumber, message)).rejects.toThrow(
      'Failed to send WhatsApp message after 3 attempts',
    );

    // Verify exactly 3 attempts were made
    expect(mockAxiosInstance.post).toHaveBeenCalledTimes(3);
  }, 10000); // 10 second timeout for retry delays

  it('should succeed on first attempt when API call succeeds', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 10, maxLength: 15 }), // phone number
        fc.string({ minLength: 1, maxLength: 100 }), // message
        async (phoneNumber, message) => {
          // Arrange: Mock successful response
          mockAxiosInstance.post.mockResolvedValue({ data: { success: true } });

          // Act
          await client.sendMessage(phoneNumber, message);

          // Assert: Should only call once
          expect(mockAxiosInstance.post).toHaveBeenCalledTimes(1);

          // Reset for next iteration
          mockAxiosInstance.post.mockClear();
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should succeed on retry if first attempts fail', async () => {
    const phoneNumber = '+1234567890';
    const message = 'Test message';

    // Arrange: Mock failures then success
    mockAxiosInstance.post
      .mockRejectedValueOnce(new Error('Network error'))
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({ data: { success: true } });

    // Act
    await client.sendMessage(phoneNumber, message);

    // Assert: Should have called 3 times (2 failures + 1 success)
    expect(mockAxiosInstance.post).toHaveBeenCalledTimes(3);
  }, 10000); // 10 second timeout for retry delays

  it('should apply exponential backoff between retries', async () => {
    // This test verifies that retry logic exists (actual timing tested manually)
    const phoneNumber = '+1234567890';
    const message = 'Test message';

    // Mock all attempts to fail
    mockAxiosInstance.post.mockRejectedValue(new Error('Network error'));

    const startTime = Date.now();

    // Act & Assert
    await expect(client.sendMessage(phoneNumber, message)).rejects.toThrow(
      'Failed to send WhatsApp message after 3 attempts',
    );

    const duration = Date.now() - startTime;

    // With exponential backoff: 1s + 2s (after 2 retries) = ~6s minimum
    // The first attempt is immediate, then 1s wait, then 2s wait, then 4s would be next but we stop at 3 attempts
    // Allow some tolerance for execution time
    expect(duration).toBeGreaterThanOrEqual(5900); // ~6s - 100ms tolerance
    expect(mockAxiosInstance.post).toHaveBeenCalledTimes(3);
  }, 15000); // 15 second timeout

  it('should retry for sendInteractiveButtons with same logic', async () => {
    const phoneNumber = '+1234567890';
    const message = 'Test message';
    const buttons = [{ id: 'btn1', title: 'Button 1' }];

    // Arrange: Mock all attempts to fail
    mockAxiosInstance.post.mockRejectedValue(new Error('Network error'));

    // Act & Assert
    await expect(client.sendInteractiveButtons(phoneNumber, message, buttons)).rejects.toThrow(
      'Failed to send WhatsApp interactive buttons after 3 attempts',
    );

    // Verify exactly 3 attempts were made
    expect(mockAxiosInstance.post).toHaveBeenCalledTimes(3);
  }, 10000); // 10 second timeout

  it('should retry for sendLocation with same logic', async () => {
    const phoneNumber = '+1234567890';
    const location = {
      latitude: 40.7128,
      longitude: -74.006,
      name: 'New York',
      address: 'New York, NY, USA',
    };

    // Arrange: Mock all attempts to fail
    mockAxiosInstance.post.mockRejectedValue(new Error('Network error'));

    // Act & Assert
    await expect(client.sendLocation(phoneNumber, location)).rejects.toThrow(
      'Failed to send WhatsApp location after 3 attempts',
    );

    // Verify exactly 3 attempts were made
    expect(mockAxiosInstance.post).toHaveBeenCalledTimes(3);
  }, 10000); // 10 second timeout
});

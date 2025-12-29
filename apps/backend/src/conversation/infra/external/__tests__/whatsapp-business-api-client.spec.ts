import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { WhatsAppBusinessApiClient } from '../whatsapp-business-api-client';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('WhatsAppBusinessApiClient - Unit Tests', () => {
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

  describe('sendMessage', () => {
    it('should send message successfully on first attempt', async () => {
      // Arrange
      const phoneNumber = '+1234567890';
      const message = 'Hello, this is a test message';
      mockAxiosInstance.post.mockResolvedValue({ data: { success: true } });

      // Act
      await client.sendMessage(phoneNumber, message);

      // Assert
      expect(mockAxiosInstance.post).toHaveBeenCalledTimes(1);
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/messages', {
        messaging_product: 'whatsapp',
        to: phoneNumber,
        type: 'text',
        text: { body: message },
      });
    });

    it('should retry on failure and succeed on second attempt', async () => {
      // Arrange
      const phoneNumber = '+1234567890';
      const message = 'Test message';
      mockAxiosInstance.post
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ data: { success: true } });

      // Act
      await client.sendMessage(phoneNumber, message);

      // Assert
      expect(mockAxiosInstance.post).toHaveBeenCalledTimes(2);
    }, 5000);

    it('should throw error after 3 failed attempts', async () => {
      // Arrange
      const phoneNumber = '+1234567890';
      const message = 'Test message';
      mockAxiosInstance.post.mockRejectedValue(new Error('Network error'));

      // Act & Assert
      await expect(client.sendMessage(phoneNumber, message)).rejects.toThrow(
        'Failed to send WhatsApp message after 3 attempts',
      );
      expect(mockAxiosInstance.post).toHaveBeenCalledTimes(3);
    }, 10000);
  });

  describe('sendInteractiveButtons', () => {
    it('should send interactive buttons with correct format', async () => {
      // Arrange
      const phoneNumber = '+1234567890';
      const message = 'Please select an option';
      const buttons = [
        { id: 'btn1', title: 'Option 1' },
        { id: 'btn2', title: 'Option 2' },
        { id: 'btn3', title: 'Option 3' },
      ];
      mockAxiosInstance.post.mockResolvedValue({ data: { success: true } });

      // Act
      await client.sendInteractiveButtons(phoneNumber, message, buttons);

      // Assert
      expect(mockAxiosInstance.post).toHaveBeenCalledTimes(1);
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/messages', {
        messaging_product: 'whatsapp',
        to: phoneNumber,
        type: 'interactive',
        interactive: {
          type: 'button',
          body: { text: message },
          action: {
            buttons: [
              {
                type: 'reply',
                reply: {
                  id: 'btn1',
                  title: 'Option 1',
                },
              },
              {
                type: 'reply',
                reply: {
                  id: 'btn2',
                  title: 'Option 2',
                },
              },
              {
                type: 'reply',
                reply: {
                  id: 'btn3',
                  title: 'Option 3',
                },
              },
            ],
          },
        },
      });
    });

    it('should format buttons correctly according to WhatsApp API spec', async () => {
      // Arrange
      const phoneNumber = '+1234567890';
      const message = 'Choose a service';
      const buttons = [{ id: 'service_1', title: 'Haircut' }];
      mockAxiosInstance.post.mockResolvedValue({ data: { success: true } });

      // Act
      await client.sendInteractiveButtons(phoneNumber, message, buttons);

      // Assert
      const callArgs = mockAxiosInstance.post.mock.calls[0][1];
      expect(callArgs.interactive.action.buttons[0]).toEqual({
        type: 'reply',
        reply: {
          id: 'service_1',
          title: 'Haircut',
        },
      });
    });

    it('should retry on failure', async () => {
      // Arrange
      const phoneNumber = '+1234567890';
      const message = 'Test message';
      const buttons = [{ id: 'btn1', title: 'Button 1' }];
      mockAxiosInstance.post
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ data: { success: true } });

      // Act
      await client.sendInteractiveButtons(phoneNumber, message, buttons);

      // Assert
      expect(mockAxiosInstance.post).toHaveBeenCalledTimes(2);
    }, 5000);
  });

  describe('sendLocation', () => {
    it('should send location successfully', async () => {
      // Arrange
      const phoneNumber = '+1234567890';
      const location = {
        latitude: 40.7128,
        longitude: -74.006,
        name: 'New York City',
        address: 'New York, NY, USA',
      };
      mockAxiosInstance.post.mockResolvedValue({ data: { success: true } });

      // Act
      await client.sendLocation(phoneNumber, location);

      // Assert
      expect(mockAxiosInstance.post).toHaveBeenCalledTimes(1);
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/messages', {
        messaging_product: 'whatsapp',
        to: phoneNumber,
        type: 'location',
        location: {
          latitude: location.latitude,
          longitude: location.longitude,
          name: location.name,
          address: location.address,
        },
      });
    });

    it('should retry on failure', async () => {
      // Arrange
      const phoneNumber = '+1234567890';
      const location = {
        latitude: 40.7128,
        longitude: -74.006,
        name: 'Test Location',
        address: 'Test Address',
      };
      mockAxiosInstance.post
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ data: { success: true } });

      // Act
      await client.sendLocation(phoneNumber, location);

      // Assert
      expect(mockAxiosInstance.post).toHaveBeenCalledTimes(2);
    }, 5000);
  });

  describe('axios configuration', () => {
    it('should configure axios with correct headers', () => {
      // Assert
      expect(mockedAxios.create).toHaveBeenCalledWith({
        baseURL: 'https://api.whatsapp.com',
        headers: {
          Authorization: 'Bearer test-token',
          'Content-Type': 'application/json',
        },
      });
    });
  });
});

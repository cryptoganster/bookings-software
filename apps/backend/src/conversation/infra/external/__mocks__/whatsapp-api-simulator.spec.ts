import { WhatsAppApiSimulator } from './whatsapp-api-simulator';
import * as express from 'express';
import { Express } from 'express';
import { Server } from 'http';
import axios from 'axios';

interface WebhookPayload {
  object: string;
  entry: Array<{
    id: string;
    changes: Array<{
      value: {
        messaging_product: string;
        metadata: {
          display_phone_number: string;
          phone_number_id: string;
        };
        contacts?: Array<{
          profile: {
            name: string;
          };
          wa_id: string;
        }>;
        messages?: Array<{
          from: string;
          id: string;
          timestamp: string;
          type: string;
          text?: {
            body: string;
          };
          interactive?: {
            type: string;
            button_reply?: {
              id: string;
              title: string;
            };
            list_reply?: {
              id: string;
              title: string;
              description?: string;
            };
          };
        }>;
      };
      field: string;
    }>;
  }>;
}

describe('WhatsAppApiSimulator', () => {
  let simulator: WhatsAppApiSimulator;
  let webhookServer: Express;
  let webhookServerInstance: Server;
  let webhookPort: number;
  let receivedWebhooks: WebhookPayload[] = [];

  beforeAll(async () => {
    // Setup webhook server to receive callbacks
    webhookServer = express();
    webhookServer.use(express.json());
    webhookServer.post('/webhooks/whatsapp', (req, res) => {
      receivedWebhooks.push(req.body);
      res.status(200).json({ status: 'success' });
    });

    // Start webhook server on random port
    await new Promise<void>((resolve) => {
      webhookServerInstance = webhookServer.listen(0, () => {
        const address = webhookServerInstance.address() as { port: number } | null;
        if (address !== null) {
          webhookPort = address.port;
          resolve();
        }
      });
    });
  });

  afterAll(async () => {
    // Stop webhook server
    await new Promise<void>((resolve, reject) => {
      webhookServerInstance.close((error) => {
        if (error) reject(error);
        else resolve();
      });
    });
  });

  beforeEach(async () => {
    simulator = new WhatsAppApiSimulator();
    await simulator.start(0); // Random port
    receivedWebhooks = [];
  });

  afterEach(async () => {
    await simulator.stop();
  });

  describe('Server Lifecycle', () => {
    it('should start server on specified port', async () => {
      const testSimulator = new WhatsAppApiSimulator();
      const port = await testSimulator.start(0);

      expect(port).toBeGreaterThan(0);
      expect(testSimulator.getPort()).toBe(port);

      await testSimulator.stop();
    });

    it('should stop server gracefully', async () => {
      const testSimulator = new WhatsAppApiSimulator();
      await testSimulator.start(0);
      await expect(testSimulator.stop()).resolves.not.toThrow();
    });

    it('should provide base URL after starting', async () => {
      const port = simulator.getPort();
      const baseUrl = simulator.getBaseUrl();

      expect(baseUrl).toBe(`http://localhost:${port}`);
    });

    it('should throw error when getting base URL before starting', () => {
      const testSimulator = new WhatsAppApiSimulator();
      expect(() => testSimulator.getBaseUrl()).toThrow('Server not started');
    });
  });

  describe('Send Message API', () => {
    it('should accept valid text message request', async () => {
      const response = await axios.post(
        `${simulator.getBaseUrl()}/v18.0/test-phone-id/messages`,
        {
          messaging_product: 'whatsapp',
          to: '+1234567890',
          type: 'text',
          text: {
            body: 'Hello, World!',
          },
        },
        { validateStatus: () => true },
      );

      expect(response.status).toBe(200);
      const data = response.data;
      expect(data.messaging_product).toBe('whatsapp');
      expect(data.messages).toHaveLength(1);
      expect(data.messages[0].id).toBeDefined();
      expect(data.contacts[0].wa_id).toBe('1234567890');
    });

    it('should reject request without messaging_product', async () => {
      const response = await axios.post(
        `${simulator.getBaseUrl()}/v18.0/test-phone-id/messages`,
        {
          to: '+1234567890',
          type: 'text',
          text: { body: 'Hello' },
        },
        { validateStatus: () => true },
      );

      expect(response.status).toBe(400);
      const data = response.data;
      expect(data.error.message).toContain('Invalid messaging_product');
    });

    it('should reject request without to field', async () => {
      const response = await axios.post(
        `${simulator.getBaseUrl()}/v18.0/test-phone-id/messages`,
        {
          messaging_product: 'whatsapp',
          type: 'text',
          text: { body: 'Hello' },
        },
        { validateStatus: () => true },
      );

      expect(response.status).toBe(400);
      const data = response.data;
      expect(data.error.message).toContain('Missing required parameter: to');
    });

    it('should track sent messages', async () => {
      await axios.post(
        `${simulator.getBaseUrl()}/v18.0/test-phone-id/messages`,
        {
          messaging_product: 'whatsapp',
          to: '+1234567890',
          type: 'text',
          text: { body: 'Test message' },
        },
        { validateStatus: () => true },
      );

      const sentMessages = simulator.getSentMessages();
      expect(sentMessages).toHaveLength(1);
      expect(sentMessages[0].to).toBe('+1234567890');
      expect(sentMessages[0].text?.body).toBe('Test message');
    });

    it('should simulate API error when configured', async () => {
      simulator.setShouldFailSendMessage(true, 429, 'Rate limit exceeded');

      const response = await axios.post(
        `${simulator.getBaseUrl()}/v18.0/test-phone-id/messages`,
        {
          messaging_product: 'whatsapp',
          to: '+1234567890',
          type: 'text',
          text: { body: 'Test' },
        },
        { validateStatus: () => true },
      );

      expect(response.status).toBe(429);
      const data = response.data;
      expect(data.error.message).toBe('Rate limit exceeded');
    });

    it('should simulate network delay', async () => {
      simulator.setNetworkDelay(100);

      const startTime = Date.now();

      await axios.post(
        `${simulator.getBaseUrl()}/v18.0/test-phone-id/messages`,
        {
          messaging_product: 'whatsapp',
          to: '+1234567890',
          type: 'text',
          text: { body: 'Test' },
        },
        { validateStatus: () => true },
      );

      const elapsed = Date.now() - startTime;
      expect(elapsed).toBeGreaterThanOrEqual(100);
    });
  });

  describe('Incoming Message Simulation', () => {
    beforeEach(() => {
      simulator.setWebhookUrl(`http://localhost:${webhookPort}/webhooks/whatsapp`);
    });

    it('should simulate incoming text message', async () => {
      await simulator.simulateIncomingMessage('+1234567890', 'Hello from customer');

      // Wait a bit for webhook delivery
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(receivedWebhooks).toHaveLength(1);
      const webhook = receivedWebhooks[0];

      expect(webhook.object).toBe('whatsapp_business_account');
      expect(webhook.entry[0].changes[0].value.messages).toHaveLength(1);

      const message = webhook.entry[0].changes[0].value.messages![0];
      expect(message.from).toBe('1234567890'); // Without +
      expect(message.type).toBe('text');
      expect(message.text!.body).toBe('Hello from customer');
    });

    it('should simulate incoming button reply', async () => {
      await simulator.simulateIncomingButtonReply(
        '+1234567890',
        'btn_confirm',
        'Confirm Appointment',
      );

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(receivedWebhooks).toHaveLength(1);
      const webhook = receivedWebhooks[0];
      const message = webhook.entry[0].changes[0].value.messages![0];

      expect(message.type).toBe('interactive');
      expect(message.interactive!.type).toBe('button_reply');
      expect(message.interactive!.button_reply!.id).toBe('btn_confirm');
      expect(message.interactive!.button_reply!.title).toBe('Confirm Appointment');
    });

    it('should simulate incoming list reply', async () => {
      await simulator.simulateIncomingListReply(
        '+1234567890',
        'slot_10am',
        '10:00 AM',
        'Morning slot',
      );

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(receivedWebhooks).toHaveLength(1);
      const webhook = receivedWebhooks[0];
      const message = webhook.entry[0].changes[0].value.messages![0];

      expect(message.type).toBe('interactive');
      expect(message.interactive!.type).toBe('list_reply');
      expect(message.interactive!.list_reply!.id).toBe('slot_10am');
      expect(message.interactive!.list_reply!.title).toBe('10:00 AM');
      expect(message.interactive!.list_reply!.description).toBe('Morning slot');
    });

    it('should throw error if webhook URL not configured', async () => {
      const testSimulator = new WhatsAppApiSimulator();
      await testSimulator.start(0);

      await expect(testSimulator.simulateIncomingMessage('+1234567890', 'Test')).rejects.toThrow(
        'Webhook URL not configured',
      );

      await testSimulator.stop();
    });

    it('should track received messages', async () => {
      await simulator.simulateIncomingMessage('+1234567890', 'Message 1');
      await simulator.simulateIncomingMessage('+0987654321', 'Message 2');

      const receivedMessages = simulator.getReceivedMessages();
      expect(receivedMessages).toHaveLength(2);
      expect(receivedMessages[0].text?.body).toBe('Message 1');
      expect(receivedMessages[1].text?.body).toBe('Message 2');
    });

    it('should include customer contact info in webhook', async () => {
      await simulator.simulateIncomingMessage('+1234567890', 'Test', 'John Doe');

      await new Promise((resolve) => setTimeout(resolve, 100));

      const webhook = receivedWebhooks[0];
      const contacts = webhook.entry[0].changes[0].value.contacts!;

      expect(contacts).toHaveLength(1);
      expect(contacts[0].profile.name).toBe('John Doe');
      expect(contacts[0].wa_id).toBe('1234567890');
    });
  });

  describe('Query Methods', () => {
    it('should get last sent message to recipient', async () => {
      await axios.post(
        `${simulator.getBaseUrl()}/v18.0/test-phone-id/messages`,
        {
          messaging_product: 'whatsapp',
          to: '+1111111111',
          type: 'text',
          text: { body: 'First message' },
        },
        { validateStatus: () => true },
      );

      await axios.post(
        `${simulator.getBaseUrl()}/v18.0/test-phone-id/messages`,
        {
          messaging_product: 'whatsapp',
          to: '+1111111111',
          type: 'text',
          text: { body: 'Second message' },
        },
        { validateStatus: () => true },
      );

      const lastMessage = simulator.getLastSentMessageTo('+1111111111');
      expect(lastMessage?.text?.body).toBe('Second message');
    });

    it('should check if text message was sent', async () => {
      await axios.post(
        `${simulator.getBaseUrl()}/v18.0/test-phone-id/messages`,
        {
          messaging_product: 'whatsapp',
          to: '+1234567890',
          type: 'text',
          text: { body: 'Specific message' },
        },
        { validateStatus: () => true },
      );

      expect(simulator.hasTextMessageBeenSent('+1234567890', 'Specific message')).toBe(true);
      expect(simulator.hasTextMessageBeenSent('+1234567890', 'Different message')).toBe(false);
    });

    it('should check if interactive buttons were sent', async () => {
      await axios.post(
        `${simulator.getBaseUrl()}/v18.0/test-phone-id/messages`,
        {
          messaging_product: 'whatsapp',
          to: '+1234567890',
          type: 'interactive',
          interactive: {
            type: 'button',
            body: { text: 'Choose an option' },
            action: {
              buttons: [
                { type: 'reply', reply: { id: 'btn1', title: 'Option 1' } },
                { type: 'reply', reply: { id: 'btn2', title: 'Option 2' } },
              ],
            },
          },
        },
        { validateStatus: () => true },
      );

      expect(simulator.hasInteractiveButtonsBeenSent('+1234567890')).toBe(true);
      expect(simulator.hasInteractiveButtonsBeenSent('+0987654321')).toBe(false);
    });

    it('should check if interactive list was sent', async () => {
      await axios.post(
        `${simulator.getBaseUrl()}/v18.0/test-phone-id/messages`,
        {
          messaging_product: 'whatsapp',
          to: '+1234567890',
          type: 'interactive',
          interactive: {
            type: 'list',
            body: { text: 'Select a time' },
            action: {
              button: 'View times',
              sections: [
                {
                  title: 'Morning',
                  rows: [{ id: 'slot1', title: '9:00 AM' }],
                },
              ],
            },
          },
        },
        { validateStatus: () => true },
      );

      expect(simulator.hasInteractiveListBeenSent('+1234567890')).toBe(true);
      expect(simulator.hasInteractiveListBeenSent('+0987654321')).toBe(false);
    });
  });

  describe('Configuration', () => {
    it('should configure phone number ID', () => {
      simulator.setPhoneNumberId('custom-phone-id');
      // Phone number ID is used internally, verify it doesn't throw
      expect(() => simulator.setPhoneNumberId('custom-phone-id')).not.toThrow();
    });

    it('should configure display phone number', () => {
      simulator.setDisplayPhoneNumber('+15559876543');
      expect(() => simulator.setDisplayPhoneNumber('+15559876543')).not.toThrow();
    });

    it('should reset all state', async () => {
      // Send some messages
      await axios.post(
        `${simulator.getBaseUrl()}/v18.0/test-phone-id/messages`,
        {
          messaging_product: 'whatsapp',
          to: '+1234567890',
          type: 'text',
          text: { body: 'Test' },
        },
        { validateStatus: () => true },
      );

      // Configure some settings
      simulator.setShouldFailSendMessage(true);
      simulator.setNetworkDelay(100);

      // Reset
      simulator.reset();

      // Verify state is cleared
      expect(simulator.getSentMessages()).toHaveLength(0);
      expect(simulator.getReceivedMessages()).toHaveLength(0);

      // Verify settings are reset (should not fail)
      const response = await axios.post(
        `${simulator.getBaseUrl()}/v18.0/test-phone-id/messages`,
        {
          messaging_product: 'whatsapp',
          to: '+1234567890',
          type: 'text',
          text: { body: 'After reset' },
        },
        { validateStatus: () => true },
      );

      expect(response.status).toBe(200);
    });
  });

  describe('Health Check', () => {
    it('should respond to health check', async () => {
      const response = await axios.get(`${simulator.getBaseUrl()}/health`, {
        validateStatus: () => true,
      });

      expect(response.status).toBe(200);
      const data = response.data;
      expect(data.status).toBe('ok');
      expect(data.simulator).toBe('whatsapp-api');
    });
  });
});

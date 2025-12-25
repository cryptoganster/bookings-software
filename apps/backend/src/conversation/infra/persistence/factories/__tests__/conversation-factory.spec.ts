import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConversationFactory } from '../conversation-factory';
import { ConversationModel } from '@conversation/infra/persistence/models/conversation.model';
import { UUID } from '@shared/vo/uuid';
import {
  createIntegrationTestDataSource,
  cleanDatabase,
  generateTestId,
} from '@test-utils/integration-test-helper';

describe('ConversationFactory', () => {
  let factory: ConversationFactory;
  let dataSource: DataSource;

  beforeAll(async () => {
    dataSource = await createIntegrationTestDataSource();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConversationFactory,
        {
          provide: DataSource,
          useValue: dataSource,
        },
        {
          provide: getRepositoryToken(ConversationModel),
          useFactory: (dataSource: DataSource) => dataSource.getRepository(ConversationModel),
          inject: [DataSource],
        },
      ],
    }).compile();

    factory = module.get<ConversationFactory>(ConversationFactory);
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  beforeEach(async () => {
    await cleanDatabase(dataSource);
  });

  describe('loadById', () => {
    it('should return null when conversation not found', async () => {
      // Arrange
      const id = UUID.fromString(generateTestId());

      // Act
      const conversation = await factory.loadById(id);

      // Assert
      expect(conversation).toBeNull();
    });

    it('should load conversation by ID', async () => {
      // Arrange
      const conversationId = generateTestId();
      const businessId = generateTestId();
      const customerId = generateTestId();

      const model = new ConversationModel();
      model.id = conversationId;
      model.businessId = businessId;
      model.customerId = customerId;
      model.customerPhone = '+1234567890';
      model.status = 'ACTIVE';
      model.state = 'INITIAL';
      model.lastMessageAt = new Date();
      model.version = 1;

      await dataSource.getRepository(ConversationModel).save(model);

      // Act
      const conversation = await factory.loadById(UUID.fromString(conversationId));

      // Assert
      expect(conversation).toBeDefined();
      expect(conversation!.getId().getValue()).toBe(conversationId);
      expect(conversation!.getVersion().getValue()).toBe(1);
    });
  });

  describe('loadByCustomerIdAndBusinessId', () => {
    it('should return null when conversation not found', async () => {
      // Arrange
      const customerId = UUID.fromString(generateTestId());
      const businessId = UUID.fromString(generateTestId());

      // Act
      const conversation = await factory.loadByCustomerIdAndBusinessId(customerId, businessId);

      // Assert
      expect(conversation).toBeNull();
    });

    it('should load conversation by customer and business IDs', async () => {
      // Arrange
      const conversationId = generateTestId();
      const businessId = generateTestId();
      const customerId = generateTestId();

      const model = new ConversationModel();
      model.id = conversationId;
      model.businessId = businessId;
      model.customerId = customerId;
      model.customerPhone = '+1234567890';
      model.status = 'ACTIVE';
      model.state = 'INITIAL';
      model.lastMessageAt = new Date();
      model.version = 1;

      await dataSource.getRepository(ConversationModel).save(model);

      // Act
      const conversation = await factory.loadByCustomerIdAndBusinessId(
        UUID.fromString(customerId),
        UUID.fromString(businessId),
      );

      // Assert
      expect(conversation).toBeDefined();
      expect(conversation!.getId().getValue()).toBe(conversationId);
      expect(conversation!.getBusinessId().getValue()).toBe(businessId);
      expect(conversation!.getCustomerId().getValue()).toBe(customerId);
    });
  });

  describe('persistence layer', () => {
    it('should have factory methods defined', () => {
      expect(factory).toBeDefined();
      expect(typeof factory.loadById).toBe('function');
      expect(typeof factory.loadByCustomerIdAndBusinessId).toBe('function');
    });
  });
});

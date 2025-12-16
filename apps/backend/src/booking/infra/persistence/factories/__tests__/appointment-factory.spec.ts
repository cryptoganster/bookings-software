import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppointmentFactory } from '../appointment-factory';
import { AppointmentModel } from '../../models/appointment';
import { Appointment } from '@booking/domain/aggregates/appointment';

describe('AppointmentFactory', () => {
  let factory: AppointmentFactory;
  let repository: Repository<AppointmentModel>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppointmentFactory,
        {
          provide: getRepositoryToken(AppointmentModel),
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    factory = module.get<AppointmentFactory>(AppointmentFactory);
    repository = module.get<Repository<AppointmentModel>>(getRepositoryToken(AppointmentModel));
  });

  describe('loadById', () => {
    it('should reconstruct aggregate with correct version', async () => {
      // Arrange
      const model: AppointmentModel = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        businessId: '123e4567-e89b-12d3-a456-426614174001',
        customerId: '123e4567-e89b-12d3-a456-426614174002',
        offeringId: '123e4567-e89b-12d3-a456-426614174003',
        dateTime: new Date('2024-12-20T10:00:00Z'),
        status: 'CONFIRMED',
        version: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
        cancelledAt: null,
      };
      jest.spyOn(repository, 'findOne').mockResolvedValue(model);

      // Act
      const appointment = await factory.loadById('123e4567-e89b-12d3-a456-426614174000');

      // Assert
      expect(appointment).toBeDefined();
      expect(appointment).toBeInstanceOf(Appointment);
      expect(appointment!.getVersion().getValue()).toBe(5);
      expect(appointment!.getId().getValue()).toBe('123e4567-e89b-12d3-a456-426614174000');
      expect(appointment!.getBusinessId().getValue()).toBe('123e4567-e89b-12d3-a456-426614174001');
      expect(appointment!.getCustomerId().getValue()).toBe('123e4567-e89b-12d3-a456-426614174002');
      expect(appointment!.getOfferingId().getValue()).toBe('123e4567-e89b-12d3-a456-426614174003');
    });

    it('should return null when appointment not found', async () => {
      // Arrange
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      // Act
      const appointment = await factory.loadById('non-existent-id');

      // Assert
      expect(appointment).toBeNull();
    });

    it('should reconstruct aggregate with business logic', async () => {
      // Arrange
      const model: AppointmentModel = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        businessId: '123e4567-e89b-12d3-a456-426614174001',
        customerId: '123e4567-e89b-12d3-a456-426614174002',
        offeringId: '123e4567-e89b-12d3-a456-426614174003',
        dateTime: new Date('2024-12-20T10:00:00Z'),
        status: 'CONFIRMED',
        version: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
        cancelledAt: null,
      };
      jest.spyOn(repository, 'findOne').mockResolvedValue(model);

      // Act
      const appointment = await factory.loadById('123e4567-e89b-12d3-a456-426614174000');

      // Assert
      expect(appointment).toBeDefined();
      // Verify business logic is available (methods exist and can be called)
      expect(typeof appointment!.cancel).toBe('function');
      expect(typeof appointment!.modify).toBe('function');
      expect(typeof appointment!.getStatus).toBe('function');
      // Verify status has business logic
      expect(typeof appointment!.getStatus().canBeCancelled).toBe('function');
    });

    it('should preserve all aggregate properties', async () => {
      // Arrange
      const dateTime = new Date('2024-12-20T10:00:00Z');
      const model: AppointmentModel = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        businessId: '123e4567-e89b-12d3-a456-426614174001',
        customerId: '123e4567-e89b-12d3-a456-426614174002',
        offeringId: '123e4567-e89b-12d3-a456-426614174003',
        dateTime,
        status: 'CONFIRMED',
        version: 7,
        createdAt: new Date(),
        updatedAt: new Date(),
        cancelledAt: null,
      };
      jest.spyOn(repository, 'findOne').mockResolvedValue(model);

      // Act
      const appointment = await factory.loadById('123e4567-e89b-12d3-a456-426614174000');

      // Assert
      expect(appointment).toBeDefined();
      expect(appointment!.getDateTime().toDate()).toEqual(dateTime);
      expect(appointment!.getStatus().getValue()).toBe('CONFIRMED');
      expect(appointment!.getVersion().getValue()).toBe(7);
    });
  });
});

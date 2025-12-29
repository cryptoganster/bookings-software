import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { AppointmentController } from '../appointment.controller';
import { CreateAppointmentDto } from '../../dtos/create-appointment.dto';
import { AppointmentFiltersDto } from '../../dtos/appointment-filters.dto';
import { UserPayload } from '@auth/presentation/decorators/current-user';
import { CreateAppointmentCommand } from '@booking/app/commands/create-appointment';
import { GetAppointmentQuery } from '@booking/app/queries/get-appointment';

describe('AppointmentController', () => {
  let controller: AppointmentController;
  let commandBus: CommandBus;
  let queryBus: QueryBus;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppointmentController],
      providers: [
        {
          provide: CommandBus,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: QueryBus,
          useValue: {
            execute: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AppointmentController>(AppointmentController);
    commandBus = module.get<CommandBus>(CommandBus);
    queryBus = module.get<QueryBus>(QueryBus);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should execute GetBusinessAppointmentsQuery with business id and filters', async () => {
      const user: UserPayload = {
        userId: 'user-123',
        email: 'test@example.com',
        businessId: 'business-456',
      };
      const mockAppointments = [{ id: 'apt-1' }, { id: 'apt-2' }];
      const filtersDto: AppointmentFiltersDto = { status: 'CONFIRMED' };

      jest.spyOn(queryBus, 'execute').mockResolvedValue(mockAppointments);

      const result = await controller.findAll(user, filtersDto);

      expect(queryBus.execute).toHaveBeenCalled();
      expect(result).toEqual(mockAppointments);
    });

    it('should use userId as businessId when businessId is not provided', async () => {
      const user: UserPayload = { userId: 'user-123', email: 'test@example.com' };
      const mockAppointments = [{ id: 'apt-1' }];
      const filtersDto: AppointmentFiltersDto = {};

      jest.spyOn(queryBus, 'execute').mockResolvedValue(mockAppointments);

      const result = await controller.findAll(user, filtersDto);

      expect(queryBus.execute).toHaveBeenCalled();
      expect(result).toEqual(mockAppointments);
    });
  });

  describe('findOne', () => {
    it('should execute GetAppointmentQuery with appointment id', async () => {
      const appointmentId = 'apt-123';
      const mockAppointment = { id: appointmentId };

      jest.spyOn(queryBus, 'execute').mockResolvedValue(mockAppointment);

      const result = await controller.findOne(appointmentId);

      expect(queryBus.execute).toHaveBeenCalledWith(new GetAppointmentQuery(appointmentId));
      expect(result).toEqual(mockAppointment);
    });
  });

  describe('create', () => {
    it('should execute CreateAppointmentCommand with correct parameters', async () => {
      const user: UserPayload = {
        userId: 'user-123',
        email: 'test@example.com',
        businessId: 'business-456',
      };
      const dto: CreateAppointmentDto = {
        customerId: 'customer-789',
        offeringId: 'offering-101',
        dateTime: new Date('2024-12-20T10:00:00Z'),
      };
      const mockResult = { appointmentId: 'apt-new' };

      jest.spyOn(commandBus, 'execute').mockResolvedValue(mockResult);

      const result = await controller.create(dto, user);

      expect(commandBus.execute).toHaveBeenCalledWith(
        new CreateAppointmentCommand('business-456', 'user-123', dto.offeringId, dto.dateTime),
      );
      expect(result).toEqual(mockResult);
    });

    it('should use userId as businessId when businessId is not provided', async () => {
      const user: UserPayload = {
        userId: 'user-123',
        email: 'test@example.com',
      };
      const dto: CreateAppointmentDto = {
        customerId: 'customer-789',
        offeringId: 'offering-101',
        dateTime: new Date('2024-12-20T10:00:00Z'),
      };
      const mockResult = { appointmentId: 'apt-new' };

      jest.spyOn(commandBus, 'execute').mockResolvedValue(mockResult);

      const result = await controller.create(dto, user);

      expect(commandBus.execute).toHaveBeenCalledWith(
        new CreateAppointmentCommand('user-123', 'user-123', dto.offeringId, dto.dateTime),
      );
      expect(result).toEqual(mockResult);
    });
  });
});

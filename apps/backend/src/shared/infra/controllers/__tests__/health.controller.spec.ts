import { Test, TestingModule } from '@nestjs/testing';
import { HealthCheckService, TypeOrmHealthIndicator, HealthCheckResult } from '@nestjs/terminus';
import { PinoLogger } from 'nestjs-pino';
import { HealthController } from '../health.controller';

describe('HealthController', () => {
  let controller: HealthController;
  let healthCheckService: HealthCheckService;
  let logger: PinoLogger;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthCheckService,
          useValue: {
            check: jest.fn(),
          },
        },
        {
          provide: TypeOrmHealthIndicator,
          useValue: {
            pingCheck: jest.fn(),
          },
        },
        {
          provide: PinoLogger,
          useValue: {
            setContext: jest.fn(),
            info: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    healthCheckService = module.get<HealthCheckService>(HealthCheckService);
    // TypeOrmHealthIndicator is provided but not used directly in tests
    logger = module.get<PinoLogger>(PinoLogger);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('check', () => {
    it('should return 200 when database is available', async () => {
      // Arrange
      const mockHealthCheckResult: HealthCheckResult = {
        status: 'ok',
        info: {
          database: {
            status: 'up',
          },
        },
        error: {},
        details: {
          database: {
            status: 'up',
          },
        },
      };

      jest.spyOn(healthCheckService, 'check').mockResolvedValue(mockHealthCheckResult);

      // Act
      const result = await controller.check();

      // Assert
      expect(result.status).toBe('ok');
      expect(result.details.database.status).toBe('up');
      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'ok',
          details: expect.any(Object),
          timestamp: expect.any(String),
        }),
        'Health check performed',
      );
    });

    it('should return 503 when database is not available', async () => {
      // Arrange
      const mockHealthCheckResult: HealthCheckResult = {
        status: 'error',
        info: {},
        error: {
          database: {
            status: 'down',
            message: 'Connection failed',
          },
        },
        details: {
          database: {
            status: 'down',
            message: 'Connection failed',
          },
        },
      };

      jest.spyOn(healthCheckService, 'check').mockResolvedValue(mockHealthCheckResult);

      // Act
      const result = await controller.check();

      // Assert
      expect(result.status).toBe('error');
      expect(result.error).toBeDefined();
      expect(result.error?.database?.status).toBe('down');
      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'error',
          details: expect.any(Object),
          timestamp: expect.any(String),
        }),
        'Health check performed',
      );
    });

    it('should log health check results', async () => {
      // Arrange
      const mockHealthCheckResult: HealthCheckResult = {
        status: 'ok',
        info: {
          database: {
            status: 'up',
          },
        },
        error: {},
        details: {
          database: {
            status: 'up',
          },
        },
      };

      jest.spyOn(healthCheckService, 'check').mockResolvedValue(mockHealthCheckResult);

      // Act
      await controller.check();

      // Assert
      expect(logger.info).toHaveBeenCalledTimes(1);
      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'ok',
          details: expect.objectContaining({
            database: expect.objectContaining({
              status: 'up',
            }),
          }),
          timestamp: expect.any(String),
        }),
        'Health check performed',
      );
    });
  });
});

import { Controller, Get } from '@nestjs/common';
import { HealthCheckService, TypeOrmHealthIndicator, HealthCheck } from '@nestjs/terminus';
import { PinoLogger } from 'nestjs-pino';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
    private logger: PinoLogger,
  ) {
    this.logger.setContext(HealthController.name);
  }

  @Get()
  @HealthCheck()
  async check() {
    const result = await this.health.check([() => this.db.pingCheck('database')]);

    this.logger.info(
      {
        status: result.status,
        details: result.details,
        timestamp: new Date().toISOString(),
      },
      'Health check performed',
    );

    return result;
  }
}

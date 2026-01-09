import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CqrsModule } from '@nestjs/cqrs';
import { LoggerModule } from 'nestjs-pino';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigValidationService } from '@config/config-validation.service';
import { SharedModule } from '@shared/shared.module';
import { WebSocketModule } from '@shared/infra/websocket/websocket.module';
import { AccountModule } from '@account/account.module';
import { AuthModule } from '@auth/auth.module';
import { AvailabilityModule } from '@availability/availability.module';
import { BookingModule } from '@booking/booking.module';
import { BusinessModule } from '@business/business.module';
import { ConversationModule } from '@conversation/conversation.module';
import { CustomerModule } from '@customer/customer.module';
import { OfferingModule } from '@offering/offering.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      autoLoadEntities: true,
      synchronize: false, // Always use migrations, never auto-sync
    }),
    CqrsModule.forRoot(),
    SharedModule,
    WebSocketModule, // WebSocket para actualizaciones en tiempo real
    AccountModule,
    AuthModule,
    AvailabilityModule,
    BookingModule,
    BusinessModule,
    ConversationModule,
    CustomerModule,
    OfferingModule,
    LoggerModule.forRoot({
      pinoHttp: {
        // Configuración de transporte
        transport:
          process.env.NODE_ENV !== 'production'
            ? {
                target: 'pino-pretty',
                options: {
                  colorize: true,
                  translateTime: 'SYS:standard',
                  ignore: 'pid,hostname',
                  singleLine: false,
                },
              }
            : undefined,

        // Nivel de logging
        level: process.env.LOG_LEVEL || 'info',

        // Serializers personalizados
        serializers: {
          req: (req: {
            id: string;
            method: string;
            url: string;
            query: unknown;
            params: unknown;
          }) => ({
            id: req.id,
            method: req.method,
            url: req.url,
            query: req.query,
            params: req.params,
          }),

          res: (res: { statusCode: number }) => ({
            statusCode: res.statusCode,
          }),
        },

        // Auto-logging de requests HTTP
        autoLogging: true,

        // Customizar mensaje de request

        customLogLevel: (req: unknown, res: { statusCode: number }, err?: Error) => {
          if (res.statusCode >= 400 && res.statusCode < 500) {
            return 'warn';
          } else if (res.statusCode >= 500 || err) {
            return 'error';
          }
          return 'info';
        },
      },
    }),
  ],
  controllers: [AppController],
  providers: [AppService, ConfigValidationService],
})
export class AppModule {}

import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { ValidationPipe } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      logger: false, // Desactivar logger de Fastify, usaremos Pino
    }),
    { bufferLogs: true }, // Buffer logs hasta que Pino esté listo
  );

  // Usar Pino como logger
  app.useLogger(app.get(Logger));

  // Configurar CORS
  app.enableCors({
    origin: [
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://10.0.0.180:5173', // Network access for mobile devices
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Configurar prefijo global para todas las rutas
  app.setGlobalPrefix('api');

  // Configurar ValidationPipe global
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Escuchar en todas las interfaces
  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');

  console.log(`Application is running on: ${await app.getUrl()}`);
}
void bootstrap();

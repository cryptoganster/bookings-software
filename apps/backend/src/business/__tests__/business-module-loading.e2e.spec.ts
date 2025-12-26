import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../app.module';

describe('Business Module Loading E2E', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should have /api/businesses endpoint available', async () => {
    // This should return 401 (unauthorized) not 404 (not found)
    const response = await request(app.getHttpServer())
      .post('/api/businesses')
      .send({
        name: 'Test',
        whatsappNumber: '+1234567890',
        address: {
          street: 'Test St',
          city: 'Test City',
          country: 'Test Country',
        },
        timezone: 'America/Santo_Domingo',
      });

    // Should be 401 (no auth token) not 404 (route not found)
    expect(response.status).toBe(401);
  });
});

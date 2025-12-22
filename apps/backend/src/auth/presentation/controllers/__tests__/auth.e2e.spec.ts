import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../../../../app.module';
import { E2EDatabaseHelper } from '@test-utils/e2e-helpers';

describe('Auth Controller E2E', () => {
  let app: INestApplication;
  let dbHelper: E2EDatabaseHelper;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Apply same validation pipe as main.ts
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

    // Set global prefix like in main.ts
    app.setGlobalPrefix('api');

    await app.init();

    // Setup database
    const dataSource = app.get(DataSource);
    dbHelper = new E2EDatabaseHelper(dataSource);
    await dbHelper.setup();
  });

  afterAll(async () => {
    // Cleanup database
    if (dbHelper) {
      await dbHelper.cleanup();
    }
    await app.close();
  });

  afterEach(async () => {
    // Clear data between tests
    if (dbHelper) {
      await dbHelper.clearData();
    }
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: `test-${Date.now()}@example.com`,
          password: 'Test123!@#',
          name: 'Test User',
          initialRole: 'BUSINESS_OWNER',
        })
        .expect(201);

      expect(response.body).toHaveProperty('token'); // Cambiado de accessToken a token
      expect(response.body).toHaveProperty('userId'); // Register devuelve userId directamente
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login an existing user', async () => {
      // First register a user
      const email = `test-${Date.now()}@example.com`;
      const password = 'Test123!@#';

      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email,
          password,
          name: 'Test User',
          initialRole: 'BUSINESS_OWNER',
        })
        .expect(201);

      // Then login
      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email,
          password,
        })
        .expect(201); // Login también devuelve 201

      expect(response.body).toHaveProperty('token'); // Cambiado de accessToken a token
      expect(response.body).toHaveProperty('user');
    });
  });
});

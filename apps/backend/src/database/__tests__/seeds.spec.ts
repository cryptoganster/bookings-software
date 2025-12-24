import { DataSource } from 'typeorm';
import * as path from 'path';

describe('Seed Execution', () => {
  let dataSource: DataSource;

  beforeAll(async () => {
    // Create test database connection
    dataSource = new DataSource({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_DATABASE || 'bookings-software',
      entities: [],
      migrations: [path.join(__dirname, '../migrations/*.ts')],
      synchronize: false,
      logging: false,
    });

    await dataSource.initialize();
  });

  afterAll(async () => {
    if (dataSource?.isInitialized) {
      await dataSource.destroy();
    }
  });

  describe('Seed Data Validation', () => {
    it('should have users seeded', async () => {
      const queryRunner = dataSource.createQueryRunner();

      try {
        const result = await queryRunner.query('SELECT COUNT(*) as count FROM users');
        const count = parseInt(result[0].count, 10);

        expect(count).toBeGreaterThan(0);
        expect(count).toBeGreaterThanOrEqual(2); // At least 2 users
      } finally {
        await queryRunner.release();
      }
    });

    it('should have business_owners seeded', async () => {
      const queryRunner = dataSource.createQueryRunner();

      try {
        const result = await queryRunner.query('SELECT COUNT(*) as count FROM business_owners');
        const count = parseInt(result[0].count, 10);

        expect(count).toBeGreaterThan(0);
        expect(count).toBeGreaterThanOrEqual(2); // At least 2 business owners
      } finally {
        await queryRunner.release();
      }
    });

    it('should have businesses seeded', async () => {
      const queryRunner = dataSource.createQueryRunner();

      try {
        const result = await queryRunner.query('SELECT COUNT(*) as count FROM businesses');
        const count = parseInt(result[0].count, 10);

        expect(count).toBeGreaterThan(0);
        expect(count).toBeGreaterThanOrEqual(1); // At least 1 business
      } finally {
        await queryRunner.release();
      }
    });

    it('should have customers seeded', async () => {
      const queryRunner = dataSource.createQueryRunner();

      try {
        const result = await queryRunner.query('SELECT COUNT(*) as count FROM customers');
        const count = parseInt(result[0].count, 10);

        expect(count).toBeGreaterThan(0);
        expect(count).toBeGreaterThanOrEqual(10); // At least 10 customers
      } finally {
        await queryRunner.release();
      }
    });

    it('should have offerings seeded', async () => {
      const queryRunner = dataSource.createQueryRunner();

      try {
        const result = await queryRunner.query('SELECT COUNT(*) as count FROM offerings');
        const count = parseInt(result[0].count, 10);

        expect(count).toBeGreaterThan(0);
        expect(count).toBeGreaterThanOrEqual(5); // At least 5 offerings
      } finally {
        await queryRunner.release();
      }
    });

    it('should have schedules seeded', async () => {
      const queryRunner = dataSource.createQueryRunner();

      try {
        const result = await queryRunner.query('SELECT COUNT(*) as count FROM schedules');
        const count = parseInt(result[0].count, 10);

        expect(count).toBeGreaterThan(0);
        expect(count).toBeGreaterThanOrEqual(6); // At least 6 schedules (Mon-Sat)
      } finally {
        await queryRunner.release();
      }
    });

    it('should have blockouts seeded', async () => {
      const queryRunner = dataSource.createQueryRunner();

      try {
        const result = await queryRunner.query('SELECT COUNT(*) as count FROM blockouts');
        const count = parseInt(result[0].count, 10);

        expect(count).toBeGreaterThan(0);
        expect(count).toBeGreaterThanOrEqual(3); // At least 3 blockouts
      } finally {
        await queryRunner.release();
      }
    });

    it('should have capacities seeded', async () => {
      const queryRunner = dataSource.createQueryRunner();

      try {
        const result = await queryRunner.query('SELECT COUNT(*) as count FROM capacities');
        const count = parseInt(result[0].count, 10);

        expect(count).toBeGreaterThan(0);
        expect(count).toBeGreaterThanOrEqual(50); // At least 50 capacity records
      } finally {
        await queryRunner.release();
      }
    });

    it('should have appointments seeded', async () => {
      const queryRunner = dataSource.createQueryRunner();

      try {
        const result = await queryRunner.query('SELECT COUNT(*) as count FROM appointments');
        const count = parseInt(result[0].count, 10);

        expect(count).toBeGreaterThan(0);
        expect(count).toBeGreaterThanOrEqual(10); // At least 10 appointments
      } finally {
        await queryRunner.release();
      }
    });

    it('should have conversations seeded', async () => {
      const queryRunner = dataSource.createQueryRunner();

      try {
        const result = await queryRunner.query('SELECT COUNT(*) as count FROM conversations');
        const count = parseInt(result[0].count, 10);

        expect(count).toBeGreaterThan(0);
        expect(count).toBeGreaterThanOrEqual(5); // At least 5 conversations
      } finally {
        await queryRunner.release();
      }
    });

    it('should have messages seeded', async () => {
      const queryRunner = dataSource.createQueryRunner();

      try {
        const result = await queryRunner.query('SELECT COUNT(*) as count FROM messages');
        const count = parseInt(result[0].count, 10);

        expect(count).toBeGreaterThan(0);
        expect(count).toBeGreaterThanOrEqual(10); // At least 10 messages
      } finally {
        await queryRunner.release();
      }
    });
  });

  describe('Seed Data Integrity', () => {
    it('should have valid foreign keys in business_owners', async () => {
      const queryRunner = dataSource.createQueryRunner();

      try {
        // Check that all business_owners.user_id references valid users
        const result = await queryRunner.query(`
          SELECT COUNT(*) as count
          FROM business_owners bo
          LEFT JOIN users u ON bo.user_id = u.id
          WHERE u.id IS NULL
        `);

        const invalidCount = parseInt(result[0].count, 10);
        expect(invalidCount).toBe(0);
      } finally {
        await queryRunner.release();
      }
    });

    it('should have valid foreign keys in businesses', async () => {
      const queryRunner = dataSource.createQueryRunner();

      try {
        // Check that all businesses.owner_id references valid users
        const result = await queryRunner.query(`
          SELECT COUNT(*) as count
          FROM businesses b
          LEFT JOIN users u ON b.owner_id = u.id
          WHERE u.id IS NULL
        `);

        const invalidCount = parseInt(result[0].count, 10);
        expect(invalidCount).toBe(0);
      } finally {
        await queryRunner.release();
      }
    });

    it('should have valid foreign keys in customers', async () => {
      const queryRunner = dataSource.createQueryRunner();

      try {
        // Check that all customers.user_id (when not null) references valid users
        const result = await queryRunner.query(`
          SELECT COUNT(*) as count
          FROM customers c
          LEFT JOIN users u ON c.user_id = u.id
          WHERE c.user_id IS NOT NULL AND u.id IS NULL
        `);

        const invalidCount = parseInt(result[0].count, 10);
        expect(invalidCount).toBe(0);
      } finally {
        await queryRunner.release();
      }
    });

    it('should have valid foreign keys in appointments', async () => {
      const queryRunner = dataSource.createQueryRunner();

      try {
        // Check that all appointments.customer_id references valid customers
        const result = await queryRunner.query(`
          SELECT COUNT(*) as count
          FROM appointments a
          LEFT JOIN customers c ON a.customer_id = c.id
          WHERE c.id IS NULL
        `);

        const invalidCount = parseInt(result[0].count, 10);
        expect(invalidCount).toBe(0);
      } finally {
        await queryRunner.release();
      }
    });

    it('should have valid foreign keys in conversations', async () => {
      const queryRunner = dataSource.createQueryRunner();

      try {
        // Check that all conversations.customer_id references valid customers
        const result = await queryRunner.query(`
          SELECT COUNT(*) as count
          FROM conversations conv
          LEFT JOIN customers c ON conv.customer_id = c.id
          WHERE c.id IS NULL
        `);

        const invalidCount = parseInt(result[0].count, 10);
        expect(invalidCount).toBe(0);
      } finally {
        await queryRunner.release();
      }
    });

    it('should have valid foreign keys in messages', async () => {
      const queryRunner = dataSource.createQueryRunner();

      try {
        // Check that all messages.conversation_id references valid conversations
        const result = await queryRunner.query(`
          SELECT COUNT(*) as count
          FROM messages m
          LEFT JOIN conversations c ON m.conversation_id = c.id
          WHERE c.id IS NULL
        `);

        const invalidCount = parseInt(result[0].count, 10);
        expect(invalidCount).toBe(0);
      } finally {
        await queryRunner.release();
      }
    });
  });

  describe('Seed Data Variety', () => {
    it('should have customers with different types (anonymous and registered)', async () => {
      const queryRunner = dataSource.createQueryRunner();

      try {
        // Check for anonymous customers (user_id IS NULL)
        const anonymousResult = await queryRunner.query(`
          SELECT COUNT(*) as count
          FROM customers
          WHERE user_id IS NULL
        `);
        const anonymousCount = parseInt(anonymousResult[0].count, 10);

        // Check for registered customers (user_id IS NOT NULL)
        const registeredResult = await queryRunner.query(`
          SELECT COUNT(*) as count
          FROM customers
          WHERE user_id IS NOT NULL
        `);
        const registeredCount = parseInt(registeredResult[0].count, 10);

        expect(anonymousCount).toBeGreaterThan(0);
        expect(registeredCount).toBeGreaterThan(0);
      } finally {
        await queryRunner.release();
      }
    });

    it('should have offerings with different states (active and inactive)', async () => {
      const queryRunner = dataSource.createQueryRunner();

      try {
        // Check for active offerings
        const activeResult = await queryRunner.query(`
          SELECT COUNT(*) as count
          FROM offerings
          WHERE is_active = true
        `);
        const activeCount = parseInt(activeResult[0].count, 10);

        // Check for inactive offerings
        const inactiveResult = await queryRunner.query(`
          SELECT COUNT(*) as count
          FROM offerings
          WHERE is_active = false
        `);
        const inactiveCount = parseInt(inactiveResult[0].count, 10);

        expect(activeCount).toBeGreaterThan(0);
        expect(inactiveCount).toBeGreaterThan(0);
      } finally {
        await queryRunner.release();
      }
    });

    it('should have appointments with different statuses', async () => {
      const queryRunner = dataSource.createQueryRunner();

      try {
        // Check for CONFIRMED appointments
        const confirmedResult = await queryRunner.query(`
          SELECT COUNT(*) as count
          FROM appointments
          WHERE status = 'CONFIRMED'
        `);
        const confirmedCount = parseInt(confirmedResult[0].count, 10);

        // Check for CANCELLED appointments
        const cancelledResult = await queryRunner.query(`
          SELECT COUNT(*) as count
          FROM appointments
          WHERE status = 'CANCELLED'
        `);
        const cancelledCount = parseInt(cancelledResult[0].count, 10);

        // Check for COMPLETED appointments
        const completedResult = await queryRunner.query(`
          SELECT COUNT(*) as count
          FROM appointments
          WHERE status = 'COMPLETED'
        `);
        const completedCount = parseInt(completedResult[0].count, 10);

        expect(confirmedCount).toBeGreaterThan(0);
        expect(cancelledCount).toBeGreaterThan(0);
        expect(completedCount).toBeGreaterThan(0);
      } finally {
        await queryRunner.release();
      }
    });

    it('should have conversations with different statuses', async () => {
      const queryRunner = dataSource.createQueryRunner();

      try {
        // Check for ACTIVE conversations
        const activeResult = await queryRunner.query(`
          SELECT COUNT(*) as count
          FROM conversations
          WHERE status = 'ACTIVE'
        `);
        const activeCount = parseInt(activeResult[0].count, 10);

        // Check for AWAITING_ADMIN conversations
        const awaitingResult = await queryRunner.query(`
          SELECT COUNT(*) as count
          FROM conversations
          WHERE status = 'AWAITING_ADMIN'
        `);
        const awaitingCount = parseInt(awaitingResult[0].count, 10);

        // Check for RESOLVED conversations
        const resolvedResult = await queryRunner.query(`
          SELECT COUNT(*) as count
          FROM conversations
          WHERE status = 'RESOLVED'
        `);
        const resolvedCount = parseInt(resolvedResult[0].count, 10);

        expect(activeCount).toBeGreaterThan(0);
        expect(awaitingCount).toBeGreaterThan(0);
        expect(resolvedCount).toBeGreaterThan(0);
      } finally {
        await queryRunner.release();
      }
    });
  });
});

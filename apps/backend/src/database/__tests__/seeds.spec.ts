import { DataSource } from 'typeorm';
import * as path from 'path';

/**
 * Database schema validation tests
 * Validates that migrations created all required tables with correct structure
 * Test environment uses migrations only (executed in global-setup.ts)
 * These tests verify table existence and structure, not seed data
 */
describe('Database Schema Validation', () => {
  let dataSource: DataSource;

  beforeAll(async () => {
    // Create test database connection
    dataSource = new DataSource({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_DATABASE || 'postgres_test',
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

  describe('Table Existence', () => {
    it('should have users table', async () => {
      const queryRunner = dataSource.createQueryRunner();

      try {
        const result = await queryRunner.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'users'
          );
        `);
        expect(result[0].exists).toBe(true);
      } finally {
        await queryRunner.release();
      }
    });

    it('should have business_owners table', async () => {
      const queryRunner = dataSource.createQueryRunner();

      try {
        const result = await queryRunner.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'business_owners'
          );
        `);
        expect(result[0].exists).toBe(true);
      } finally {
        await queryRunner.release();
      }
    });

    it('should have businesses table', async () => {
      const queryRunner = dataSource.createQueryRunner();

      try {
        const result = await queryRunner.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'businesses'
          );
        `);
        expect(result[0].exists).toBe(true);
      } finally {
        await queryRunner.release();
      }
    });

    it('should have customers table', async () => {
      const queryRunner = dataSource.createQueryRunner();

      try {
        const result = await queryRunner.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'customers'
          );
        `);
        expect(result[0].exists).toBe(true);
      } finally {
        await queryRunner.release();
      }
    });

    it('should have offerings table', async () => {
      const queryRunner = dataSource.createQueryRunner();

      try {
        const result = await queryRunner.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'offerings'
          );
        `);
        expect(result[0].exists).toBe(true);
      } finally {
        await queryRunner.release();
      }
    });

    it('should have schedules table', async () => {
      const queryRunner = dataSource.createQueryRunner();

      try {
        const result = await queryRunner.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'schedules'
          );
        `);
        expect(result[0].exists).toBe(true);
      } finally {
        await queryRunner.release();
      }
    });

    it('should have blockouts table', async () => {
      const queryRunner = dataSource.createQueryRunner();

      try {
        const result = await queryRunner.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'blockouts'
          );
        `);
        expect(result[0].exists).toBe(true);
      } finally {
        await queryRunner.release();
      }
    });

    it('should have capacities table', async () => {
      const queryRunner = dataSource.createQueryRunner();

      try {
        const result = await queryRunner.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'capacities'
          );
        `);
        expect(result[0].exists).toBe(true);
      } finally {
        await queryRunner.release();
      }
    });

    it('should have appointments table', async () => {
      const queryRunner = dataSource.createQueryRunner();

      try {
        const result = await queryRunner.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'appointments'
          );
        `);
        expect(result[0].exists).toBe(true);
      } finally {
        await queryRunner.release();
      }
    });

    it('should have conversations table', async () => {
      const queryRunner = dataSource.createQueryRunner();

      try {
        const result = await queryRunner.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'conversations'
          );
        `);
        expect(result[0].exists).toBe(true);
      } finally {
        await queryRunner.release();
      }
    });

    it('should have messages table', async () => {
      const queryRunner = dataSource.createQueryRunner();

      try {
        const result = await queryRunner.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'messages'
          );
        `);
        expect(result[0].exists).toBe(true);
      } finally {
        await queryRunner.release();
      }
    });
  });

  describe('Foreign Key Constraints', () => {
    it('should have foreign key constraint on business_owners.user_id', async () => {
      const queryRunner = dataSource.createQueryRunner();

      try {
        const result = await queryRunner.query(`
          SELECT EXISTS (
            SELECT 1
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu
              ON tc.constraint_name = kcu.constraint_name
              AND tc.table_schema = kcu.table_schema
            WHERE tc.table_name = 'business_owners'
              AND tc.constraint_type = 'FOREIGN KEY'
              AND kcu.column_name = 'user_id'
          );
        `);
        expect(result[0].exists).toBe(true);
      } finally {
        await queryRunner.release();
      }
    });

    it('should have foreign key constraint on businesses.owner_id', async () => {
      const queryRunner = dataSource.createQueryRunner();

      try {
        const result = await queryRunner.query(`
          SELECT EXISTS (
            SELECT 1
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu
              ON tc.constraint_name = kcu.constraint_name
              AND tc.table_schema = kcu.table_schema
            WHERE tc.table_name = 'businesses'
              AND tc.constraint_type = 'FOREIGN KEY'
              AND kcu.column_name = 'owner_id'
          );
        `);
        expect(result[0].exists).toBe(true);
      } finally {
        await queryRunner.release();
      }
    });

    it('should have foreign key constraint on conversations.customer_id', async () => {
      const queryRunner = dataSource.createQueryRunner();

      try {
        const result = await queryRunner.query(`
          SELECT EXISTS (
            SELECT 1
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu
              ON tc.constraint_name = kcu.constraint_name
              AND tc.table_schema = kcu.table_schema
            WHERE tc.table_name = 'conversations'
              AND tc.constraint_type = 'FOREIGN KEY'
              AND kcu.column_name = 'customer_id'
          );
        `);
        expect(result[0].exists).toBe(true);
      } finally {
        await queryRunner.release();
      }
    });

    it('should have foreign key constraint on messages.conversation_id', async () => {
      const queryRunner = dataSource.createQueryRunner();

      try {
        const result = await queryRunner.query(`
          SELECT EXISTS (
            SELECT 1
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu
              ON tc.constraint_name = kcu.constraint_name
              AND tc.table_schema = kcu.table_schema
            WHERE tc.table_name = 'messages'
              AND tc.constraint_type = 'FOREIGN KEY'
              AND kcu.column_name = 'conversation_id'
          );
        `);
        expect(result[0].exists).toBe(true);
      } finally {
        await queryRunner.release();
      }
    });
  });

  describe('Column Constraints', () => {
    it('should have nullable user_id column in customers table', async () => {
      const queryRunner = dataSource.createQueryRunner();

      try {
        const result = await queryRunner.query(`
          SELECT is_nullable
          FROM information_schema.columns
          WHERE table_name = 'customers'
            AND column_name = 'user_id';
        `);
        expect(result[0].is_nullable).toBe('YES');
      } finally {
        await queryRunner.release();
      }
    });

    it('should have is_active column in offerings table', async () => {
      const queryRunner = dataSource.createQueryRunner();

      try {
        const result = await queryRunner.query(`
          SELECT EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_name = 'offerings'
              AND column_name = 'is_active'
          );
        `);
        expect(result[0].exists).toBe(true);
      } finally {
        await queryRunner.release();
      }
    });

    it('should have status column in appointments table', async () => {
      const queryRunner = dataSource.createQueryRunner();

      try {
        const result = await queryRunner.query(`
          SELECT EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_name = 'appointments'
              AND column_name = 'status'
          );
        `);
        expect(result[0].exists).toBe(true);
      } finally {
        await queryRunner.release();
      }
    });

    it('should have status column in conversations table', async () => {
      const queryRunner = dataSource.createQueryRunner();

      try {
        const result = await queryRunner.query(`
          SELECT EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_name = 'conversations'
              AND column_name = 'status'
          );
        `);
        expect(result[0].exists).toBe(true);
      } finally {
        await queryRunner.release();
      }
    });

    it('should have version column in appointments table for optimistic locking', async () => {
      const queryRunner = dataSource.createQueryRunner();

      try {
        const result = await queryRunner.query(`
          SELECT EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_name = 'appointments'
              AND column_name = 'version'
          );
        `);
        expect(result[0].exists).toBe(true);
      } finally {
        await queryRunner.release();
      }
    });

    it('should have version column in capacities table for optimistic locking', async () => {
      const queryRunner = dataSource.createQueryRunner();

      try {
        const result = await queryRunner.query(`
          SELECT EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_name = 'capacities'
              AND column_name = 'version'
          );
        `);
        expect(result[0].exists).toBe(true);
      } finally {
        await queryRunner.release();
      }
    });

    it('should have version column in conversations table for optimistic locking', async () => {
      const queryRunner = dataSource.createQueryRunner();

      try {
        const result = await queryRunner.query(`
          SELECT EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_name = 'conversations'
              AND column_name = 'version'
          );
        `);
        expect(result[0].exists).toBe(true);
      } finally {
        await queryRunner.release();
      }
    });

    it('should have created_at timestamps on all main tables', async () => {
      const queryRunner = dataSource.createQueryRunner();

      try {
        const tables = [
          'users',
          'business_owners',
          'businesses',
          'customers',
          'offerings',
          'appointments',
          'conversations',
          'messages',
        ];

        for (const table of tables) {
          const result = await queryRunner.query(
            `
            SELECT EXISTS (
              SELECT 1
              FROM information_schema.columns
              WHERE table_name = $1
                AND column_name = 'created_at'
            );
          `,
            [table],
          );
          expect(result[0].exists).toBe(true);
        }
      } finally {
        await queryRunner.release();
      }
    });
  });
});

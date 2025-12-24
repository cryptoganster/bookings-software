import { DataSource } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';

describe('Migration Validation', () => {
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

  describe('Migration Files', () => {
    it('should have valid timestamps (13 digits)', () => {
      const migrationsDir = path.join(__dirname, '../migrations');
      const files = fs.readdirSync(migrationsDir);

      const migrationFiles = files.filter((file) => file.endsWith('.ts'));

      migrationFiles.forEach((file) => {
        const timestamp = file.split('-')[0];
        expect(timestamp).toMatch(/^\d{13}$/);
        expect(timestamp.length).toBe(13);
      });

      expect(migrationFiles.length).toBeGreaterThan(0);
    });

    it('should not have duplicate table creations', () => {
      const migrationsDir = path.join(__dirname, '../migrations');
      const files = fs.readdirSync(migrationsDir);

      const migrationFiles = files.filter((file) => file.endsWith('.ts'));
      const tableCreations: Record<string, string[]> = {};

      migrationFiles.forEach((file) => {
        const content = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');

        // Extract table names from CREATE TABLE statements
        const createTableMatches = content.match(
          /CREATE TABLE (?:IF NOT EXISTS )?["']?(\w+)["']?/gi,
        );

        if (createTableMatches) {
          createTableMatches.forEach((match) => {
            const tableName = match
              .replace(/CREATE TABLE (?:IF NOT EXISTS )?["']?/i, '')
              .replace(/["']?/g, '')
              .toLowerCase();

            if (!tableCreations[tableName]) {
              tableCreations[tableName] = [];
            }
            tableCreations[tableName].push(file);
          });
        }
      });

      // Check for duplicates
      const duplicates = Object.entries(tableCreations).filter(([, files]) => files.length > 1);

      expect(duplicates).toEqual([]);
    });

    it('should have valid up() and down() methods', () => {
      const migrationsDir = path.join(__dirname, '../migrations');
      const files = fs.readdirSync(migrationsDir);

      const migrationFiles = files.filter((file) => file.endsWith('.ts'));

      migrationFiles.forEach((file) => {
        const content = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');

        // Check for up() method
        expect(content).toMatch(/public async up\(queryRunner: QueryRunner\)/);

        // Check for down() method
        expect(content).toMatch(/public async down\(queryRunner: QueryRunner\)/);
      });
    });

    it('should have correct naming convention', () => {
      const migrationsDir = path.join(__dirname, '../migrations');
      const files = fs.readdirSync(migrationsDir);

      const migrationFiles = files.filter((file) => file.endsWith('.ts'));

      migrationFiles.forEach((file) => {
        // Format: {timestamp}-{kebab-case-or-PascalCase}.ts
        // Both formats are acceptable
        expect(file).toMatch(/^\d{13}-[A-Za-z][a-zA-Z0-9-]*\.ts$/);
      });
    });
  });

  describe('Migration Execution', () => {
    it('should run all migrations without errors', async () => {
      // Get pending migrations
      const pendingMigrations = await dataSource.showMigrations();

      // If there are pending migrations, run them
      if (pendingMigrations) {
        await expect(dataSource.runMigrations()).resolves.not.toThrow();
      }

      // Verify no pending migrations remain
      const stillPending = await dataSource.showMigrations();
      expect(stillPending).toBe(false);
    });

    it('should have all expected tables after migrations', async () => {
      const expectedTables = [
        'users',
        'business_owners',
        'businesses',
        'customers',
        'offerings',
        'schedules',
        'blockouts',
        'capacities',
        'appointments',
        'conversations',
        'messages',
        'migrations',
      ];

      const queryRunner = dataSource.createQueryRunner();

      try {
        for (const tableName of expectedTables) {
          const tableExists = await queryRunner.hasTable(tableName);
          expect(tableExists).toBe(true);
        }
      } finally {
        await queryRunner.release();
      }
    });

    it('should have foreign keys defined', async () => {
      // Query database directly for foreign keys
      const queryRunner = dataSource.createQueryRunner();

      try {
        const result = await queryRunner.query(`
          SELECT COUNT(*) as count
          FROM information_schema.table_constraints
          WHERE constraint_type = 'FOREIGN KEY'
          AND table_schema = 'public'
        `);

        const foreignKeyCount = parseInt(result[0].count, 10);
        expect(foreignKeyCount).toBeGreaterThan(0);
      } finally {
        await queryRunner.release();
      }
    });

    it('should have indexes defined', async () => {
      // Just verify that some critical tables have indexes
      const tablesWithIndexes = ['users', 'businesses', 'customers', 'appointments'];

      const queryRunner = dataSource.createQueryRunner();

      try {
        for (const tableName of tablesWithIndexes) {
          const table = await queryRunner.getTable(tableName);
          expect(table).toBeDefined();
          expect(table!.indices.length).toBeGreaterThan(0);
        }
      } finally {
        await queryRunner.release();
      }
    });
  });

  describe('Migration Consistency', () => {
    it('should have matching migration count in database and files', async () => {
      const migrationsDir = path.join(__dirname, '../migrations');
      const files = fs.readdirSync(migrationsDir);
      const migrationFiles = files.filter((file) => file.endsWith('.ts'));

      const queryRunner = dataSource.createQueryRunner();

      try {
        const result = await queryRunner.query('SELECT COUNT(*) as count FROM migrations');
        const dbMigrationCount = parseInt(result[0].count, 10);

        expect(dbMigrationCount).toBe(migrationFiles.length);
      } finally {
        await queryRunner.release();
      }
    });

    it('should have all migration files recorded in database', async () => {
      const migrationsDir = path.join(__dirname, '../migrations');
      const files = fs.readdirSync(migrationsDir);
      const migrationFiles = files.filter((file) => file.endsWith('.ts'));

      const queryRunner = dataSource.createQueryRunner();

      try {
        const result = await queryRunner.query('SELECT name FROM migrations ORDER BY timestamp');
        const dbMigrationNames = result.map((row: any) => row.name);

        // Verify we have the same number of migrations
        expect(dbMigrationNames.length).toBe(migrationFiles.length);

        // Verify each file has a corresponding database entry
        // The class name format is: {PascalCaseName}{timestamp}
        migrationFiles.forEach((file) => {
          const timestamp = file.split('-')[0];
          const found = dbMigrationNames.some((name: string) => name.includes(timestamp));
          expect(found).toBe(true);
        });
      } finally {
        await queryRunner.release();
      }
    });
  });
});

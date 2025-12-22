import { DataSource } from 'typeorm';

/**
 * Database helper for E2E tests
 * Creates and drops test database tables
 */
export class E2EDatabaseHelper {
  private dataSource: DataSource;

  constructor(dataSource: DataSource) {
    this.dataSource = dataSource;
  }

  /**
   * Setup database: create tables
   */
  async setup(): Promise<void> {
    // Synchronize schema (creates tables)
    await this.dataSource.synchronize(true); // dropBeforeSync = true
  }

  /**
   * Cleanup database: drop all tables
   */
  async cleanup(): Promise<void> {
    // Drop all tables
    await this.dataSource.dropDatabase();
  }

  /**
   * Clear all data from tables (keep schema)
   */
  async clearData(): Promise<void> {
    const entities = this.dataSource.entityMetadatas;

    for (const entity of entities) {
      const repository = this.dataSource.getRepository(entity.name);
      await repository.clear();
    }
  }
}

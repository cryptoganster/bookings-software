import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSearchIndexesToCustomers1766345899000 implements MigrationInterface {
  name = 'AddSearchIndexesToCustomers1766345899000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add index on LOWER(name) for case-insensitive search
    await queryRunner.query(`
      CREATE INDEX "IDX_customers_name_lower" 
      ON "customers" (LOWER("name"))
    `);

    // Add index on whatsapp_phone for phone search
    await queryRunner.query(`
      CREATE INDEX "IDX_customers_whatsapp_phone" 
      ON "customers" ("whatsapp_phone")
    `);

    // Add partial index on user_id for registered customers
    await queryRunner.query(`
      CREATE INDEX "IDX_customers_user_id_not_null" 
      ON "customers" ("user_id") 
      WHERE "user_id" IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes in reverse order
    await queryRunner.query(`DROP INDEX "IDX_customers_user_id_not_null"`);
    await queryRunner.query(`DROP INDEX "IDX_customers_whatsapp_phone"`);
    await queryRunner.query(`DROP INDEX "IDX_customers_name_lower"`);
  }
}

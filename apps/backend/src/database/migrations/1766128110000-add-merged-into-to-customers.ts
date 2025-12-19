import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

/**
 * Migration: Add merged_into column to customers table
 *
 * Adds support for customer merge functionality:
 * - merged_into: UUID of target customer if this customer was merged
 * - Index for querying merged customers
 *
 * @see .kiro/specs/customer-bc-enhancements/requirements.md - Requirement 5.5
 * @see .kiro/specs/customer-bc-enhancements/design.md - Section 2.4
 */
export class AddMergedIntoToCustomers1766128110000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add merged_into column
    await queryRunner.addColumn(
      'customers',
      new TableColumn({
        name: 'merged_into',
        type: 'uuid',
        isNullable: true,
        comment: 'ID of target customer if this customer was merged (soft delete)',
      }),
    );

    // Add index for querying merged customers
    // Partial index: only index rows where merged_into IS NOT NULL
    await queryRunner.query(`
      CREATE INDEX "IDX_customers_merged_into" 
      ON "customers" ("merged_into") 
      WHERE "merged_into" IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop index
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_customers_merged_into"`);

    // Drop column
    await queryRunner.dropColumn('customers', 'merged_into');
  }
}

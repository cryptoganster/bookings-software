import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration: ChangeConversationSelectedDateToString
 *
 * Changes the selected_date column in conversations table from date to varchar(10)
 * to avoid timezone conversion issues when storing dates.
 *
 * @remarks
 * - Converts existing date values to "YYYY-MM-DD" string format
 * - Stores dates as strings to preserve the exact date without timezone shifts
 */
export class ChangeConversationSelectedDateToString1702563000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Change column type from date to varchar(10)
    // PostgreSQL will automatically convert existing date values to strings
    await queryRunner.query(`
      ALTER TABLE conversations
      ALTER COLUMN selected_date TYPE varchar(10)
      USING selected_date::text
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert back to date type
    await queryRunner.query(`
      ALTER TABLE conversations
      ALTER COLUMN selected_date TYPE date
      USING selected_date::date
    `);
  }
}

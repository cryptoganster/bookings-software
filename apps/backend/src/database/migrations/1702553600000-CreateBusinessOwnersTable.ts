import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateBusinessOwnersTable1702553600000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create business_owners table
    await queryRunner.createTable(
      new Table({
        name: 'business_owners',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
          },
          {
            name: 'user_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'subscription_plan',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'subscription_status',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'onboarding_completed',
            type: 'boolean',
            default: false,
            isNullable: false,
          },
          {
            name: 'version',
            type: 'int',
            default: 0,
            isNullable: false,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    // Create unique index on user_id
    await queryRunner.createIndex(
      'business_owners',
      new TableIndex({
        name: 'idx_business_owners_user_id',
        columnNames: ['user_id'],
        isUnique: true,
      }),
    );

    // Create foreign key to users table
    await queryRunner.createForeignKey(
      'business_owners',
      new TableForeignKey({
        name: 'fk_business_owners_user_id',
        columnNames: ['user_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key
    await queryRunner.dropForeignKey('business_owners', 'fk_business_owners_user_id');

    // Drop index
    await queryRunner.dropIndex('business_owners', 'idx_business_owners_user_id');

    // Drop table
    await queryRunner.dropTable('business_owners');
  }
}

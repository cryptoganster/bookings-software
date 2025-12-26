import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateAppointmentsTable1702558000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'appointments',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'business_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'customer_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'offering_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'date_time',
            type: 'timestamp',
            isNullable: false,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '50',
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
            isNullable: false,
          },
          {
            name: 'cancelled_at',
            type: 'timestamp',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    // Crear índices
    await queryRunner.createIndex(
      'appointments',
      new TableIndex({
        name: 'IDX_APPOINTMENTS_BUSINESS_ID',
        columnNames: ['business_id'],
      }),
    );

    await queryRunner.createIndex(
      'appointments',
      new TableIndex({
        name: 'IDX_APPOINTMENTS_CUSTOMER_ID',
        columnNames: ['customer_id'],
      }),
    );

    // Add foreign keys
    await queryRunner.createForeignKey(
      'appointments',
      new TableForeignKey({
        name: 'fk_appointments_business',
        columnNames: ['business_id'],
        referencedTableName: 'businesses',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'appointments',
      new TableForeignKey({
        name: 'fk_appointments_customer',
        columnNames: ['customer_id'],
        referencedTableName: 'customers',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'appointments',
      new TableForeignKey({
        name: 'fk_appointments_offering',
        columnNames: ['offering_id'],
        referencedTableName: 'offerings',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign keys
    await queryRunner.dropForeignKey('appointments', 'fk_appointments_offering');
    await queryRunner.dropForeignKey('appointments', 'fk_appointments_customer');
    await queryRunner.dropForeignKey('appointments', 'fk_appointments_business');

    // Drop indexes
    await queryRunner.dropIndex('appointments', 'IDX_APPOINTMENTS_CUSTOMER_ID');
    await queryRunner.dropIndex('appointments', 'IDX_APPOINTMENTS_BUSINESS_ID');

    // Drop table
    await queryRunner.dropTable('appointments');
  }
}

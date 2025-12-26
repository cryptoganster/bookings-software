import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateCapacitiesTable1702557000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'capacities',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'offering_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'date',
            type: 'date',
            isNullable: false,
          },
          {
            name: 'total_slots',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'available_slots',
            type: 'int',
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
        ],
      }),
      true,
    );

    // Crear índice único compuesto para offering_id y date
    await queryRunner.createIndex(
      'capacities',
      new TableIndex({
        name: 'IDX_CAPACITIES_OFFERING_DATE_UNIQUE',
        columnNames: ['offering_id', 'date'],
        isUnique: true,
      }),
    );

    // Add foreign key
    await queryRunner.createForeignKey(
      'capacities',
      new TableForeignKey({
        name: 'fk_capacities_offering',
        columnNames: ['offering_id'],
        referencedTableName: 'offerings',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key
    await queryRunner.dropForeignKey('capacities', 'fk_capacities_offering');

    // Drop index
    await queryRunner.dropIndex('capacities', 'IDX_CAPACITIES_OFFERING_DATE_UNIQUE');

    // Drop table
    await queryRunner.dropTable('capacities');
  }
}

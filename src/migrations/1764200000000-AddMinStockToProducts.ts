import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddMinStockToProducts1764200000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'products',
      new TableColumn({
        name: 'minStock',
        type: 'int',
        default: 10,
        isNullable: false,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('products', 'minStock');
  }
}

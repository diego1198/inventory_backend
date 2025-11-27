import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPriceTracking1764125683204 implements MigrationInterface {
    name = 'AddPriceTracking1764125683204'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // await queryRunner.query(`ALTER TABLE "sale_items" ADD "purchasePrice" numeric(10,2) NOT NULL DEFAULT '0'`);
        // await queryRunner.query(`ALTER TABLE "inventory_movements" ADD "unitPrice" numeric(10,2)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "inventory_movements" DROP COLUMN "unitPrice"`);
        await queryRunner.query(`ALTER TABLE "sale_items" DROP COLUMN "purchasePrice"`);
    }

}

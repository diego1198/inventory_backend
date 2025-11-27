import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCodeAndBrandToProducts1764125683206 implements MigrationInterface {
    name = 'AddCodeAndBrandToProducts1764125683206'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // await queryRunner.query(`ALTER TABLE "products" ADD "code" character varying`);
        // await queryRunner.query(`ALTER TABLE "products" ADD "brand" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "brand"`);
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "code"`);
    }

}

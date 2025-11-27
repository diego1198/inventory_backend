import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSoftDeleteToCategories1764125683205 implements MigrationInterface {
    name = 'AddSoftDeleteToCategories1764125683205'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // await queryRunner.query(`ALTER TABLE "categories" ADD "deletedAt" TIMESTAMP`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "categories" DROP COLUMN "deletedAt"`);
    }

}

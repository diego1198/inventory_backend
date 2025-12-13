import { MigrationInterface, QueryRunner } from "typeorm";

export class AddServices1764125683208 implements MigrationInterface {
    name = 'AddServices1764125683208'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "services" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "description" character varying, "price" numeric(10,2) NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_services_id" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "sale_items" ADD "serviceId" uuid`);
        await queryRunner.query(`ALTER TABLE "sale_items" ALTER COLUMN "productId" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "sale_items" ADD CONSTRAINT "FK_sale_items_serviceId" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "sale_items" DROP CONSTRAINT "FK_sale_items_serviceId"`);
        await queryRunner.query(`ALTER TABLE "sale_items" ALTER COLUMN "productId" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "sale_items" DROP COLUMN "serviceId"`);
        await queryRunner.query(`DROP TABLE "services"`);
    }
}

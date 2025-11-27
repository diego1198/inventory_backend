import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCustomersAndSaleRelation1764125683207 implements MigrationInterface {
    name = 'AddCustomersAndSaleRelation1764125683207'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "customers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "documentNumber" character varying NOT NULL, "name" character varying NOT NULL, "phone" character varying, "email" character varying, "address" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_customers_documentNumber" UNIQUE ("documentNumber"), CONSTRAINT "PK_customers_id" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "sales" ADD "customerId" uuid`);
        await queryRunner.query(`ALTER TABLE "sales" ADD CONSTRAINT "FK_sales_customerId" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "sales" DROP CONSTRAINT "FK_sales_customerId"`);
        await queryRunner.query(`ALTER TABLE "sales" DROP COLUMN "customerId"`);
        await queryRunner.query(`DROP TABLE "customers"`);
    }
}

import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialMigration1700000000000 implements MigrationInterface {
  name = 'InitialMigration1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Crear enum para roles de usuario
    await queryRunner.query(`
      CREATE TYPE "public"."user_role_enum" AS ENUM('admin', 'cashier')
    `);

    // Crear enum para categorías de productos
    await queryRunner.query(`
      CREATE TYPE "public"."product_category_enum" AS ENUM('electronics', 'clothing', 'food', 'books', 'other')
    `);

    // Crear enum para estados de venta
    await queryRunner.query(`
      CREATE TYPE "public"."sale_status_enum" AS ENUM('pending', 'completed', 'cancelled')
    `);

    // Crear tabla de usuarios
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "email" character varying NOT NULL,
        "password" character varying NOT NULL,
        "firstName" character varying NOT NULL,
        "lastName" character varying NOT NULL,
        "role" "public"."user_role_enum" NOT NULL DEFAULT 'cashier',
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"),
        CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id")
      )
    `);

    // Crear tabla de productos
    await queryRunner.query(`
      CREATE TABLE "products" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "description" text NOT NULL,
        "price" numeric(10,2) NOT NULL,
        "stock" integer NOT NULL,
        "category" "public"."product_category_enum" NOT NULL DEFAULT 'other',
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_0806c755e0aca124e67c0f6a7d" PRIMARY KEY ("id")
      )
    `);

    // Crear tabla de ventas
    await queryRunner.query(`
      CREATE TABLE "sales" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "invoiceNumber" character varying NOT NULL,
        "subtotal" numeric(10,2) NOT NULL,
        "tax" numeric(10,2) NOT NULL,
        "total" numeric(10,2) NOT NULL,
        "status" "public"."sale_status_enum" NOT NULL DEFAULT 'pending',
        "notes" text,
        "userId" uuid NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_8c8c8c8c8c8c8c8c8c8c8c8c8c8" UNIQUE ("invoiceNumber"),
        CONSTRAINT "PK_8c8c8c8c8c8c8c8c8c8c8c8c8c8" PRIMARY KEY ("id")
      )
    `);

    // Crear tabla de items de venta
    await queryRunner.query(`
      CREATE TABLE "sale_items" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "quantity" integer NOT NULL,
        "unitPrice" numeric(10,2) NOT NULL,
        "total" numeric(10,2) NOT NULL,
        "saleId" uuid NOT NULL,
        "productId" uuid NOT NULL,
        CONSTRAINT "PK_8c8c8c8c8c8c8c8c8c8c8c8c8c8" PRIMARY KEY ("id")
      )
    `);

    // Agregar foreign keys
    await queryRunner.query(`
      ALTER TABLE "sales" ADD CONSTRAINT "FK_8c8c8c8c8c8c8c8c8c8c8c8c8c8" 
      FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "sale_items" ADD CONSTRAINT "FK_8c8c8c8c8c8c8c8c8c8c8c8c8c8" 
      FOREIGN KEY ("saleId") REFERENCES "sales"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "sale_items" ADD CONSTRAINT "FK_8c8c8c8c8c8c8c8c8c8c8c8c8c8" 
      FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    // Crear índices
    await queryRunner.query(`
      CREATE INDEX "IDX_8c8c8c8c8c8c8c8c8c8c8c8c8c8" ON "users" ("email")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_8c8c8c8c8c8c8c8c8c8c8c8c8c8" ON "products" ("category")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_8c8c8c8c8c8c8c8c8c8c8c8c8c8" ON "sales" ("createdAt")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar índices
    await queryRunner.query(`DROP INDEX "IDX_8c8c8c8c8c8c8c8c8c8c8c8c8c8"`);
    await queryRunner.query(`DROP INDEX "IDX_8c8c8c8c8c8c8c8c8c8c8c8c8c8"`);
    await queryRunner.query(`DROP INDEX "IDX_8c8c8c8c8c8c8c8c8c8c8c8c8c8"`);

    // Eliminar foreign keys
    await queryRunner.query(`ALTER TABLE "sale_items" DROP CONSTRAINT "FK_8c8c8c8c8c8c8c8c8c8c8c8c8c8"`);
    await queryRunner.query(`ALTER TABLE "sale_items" DROP CONSTRAINT "FK_8c8c8c8c8c8c8c8c8c8c8c8c8c8"`);
    await queryRunner.query(`ALTER TABLE "sales" DROP CONSTRAINT "FK_8c8c8c8c8c8c8c8c8c8c8c8c8c8"`);

    // Eliminar tablas
    await queryRunner.query(`DROP TABLE "sale_items"`);
    await queryRunner.query(`DROP TABLE "sales"`);
    await queryRunner.query(`DROP TABLE "products"`);
    await queryRunner.query(`DROP TABLE "users"`);

    // Eliminar enums
    await queryRunner.query(`DROP TYPE "public"."sale_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."product_category_enum"`);
    await queryRunner.query(`DROP TYPE "public"."user_role_enum"`);
  }
}

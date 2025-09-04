import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCategoriesAndProductFields1700000002000 implements MigrationInterface {
  name = 'AddCategoriesAndProductFields1700000002000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const dbType = process.env.DB_TYPE || 'postgres';

    if (dbType === 'postgres') {
        await queryRunner.query(`
            CREATE TABLE "categories" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "name" character varying NOT NULL UNIQUE,
            "description" text,
            CONSTRAINT "PK_categories_id" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            ALTER TABLE "products" DROP COLUMN "category";
        `);
        await queryRunner.query(`
            ALTER TABLE "products" ADD "categoryId" uuid NOT NULL;
        `);
        await queryRunner.query(`
            ALTER TABLE "products" ADD COLUMN "purchasePrice" numeric(10,2) DEFAULT 0;
        `);
        await queryRunner.query(`
            UPDATE "products" SET "purchasePrice" = 0 WHERE "purchasePrice" IS NULL;
        `);
        await queryRunner.query(`
            ALTER TABLE "products" ALTER COLUMN "purchasePrice" SET NOT NULL;
        `);
        await queryRunner.query(`
            ALTER TABLE "products" ADD COLUMN "salePrice" numeric(10,2) DEFAULT 0;
        `);
        await queryRunner.query(`
            UPDATE "products" SET "salePrice" = 0 WHERE "salePrice" IS NULL;
        `);
        await queryRunner.query(`
            ALTER TABLE "products" ALTER COLUMN "salePrice" SET NOT NULL;
        `);
        await queryRunner.query(`
            ALTER TABLE "products" ADD CONSTRAINT "FK_products_category" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
        `);
    } else if (dbType === 'mysql' || dbType === 'mariadb') {
      await queryRunner.query(`
        CREATE TABLE categories (
          id CHAR(36) NOT NULL,
          name VARCHAR(255) NOT NULL UNIQUE,
          description TEXT,
          PRIMARY KEY (id)
        )
      `);
      await queryRunner.query(`
        ALTER TABLE products DROP COLUMN category;
      `);
      await queryRunner.query(`
        ALTER TABLE products ADD categoryId CHAR(36) NOT NULL;
      `);
      await queryRunner.query(`
        ALTER TABLE products ADD purchasePrice DECIMAL(10,2) NOT NULL DEFAULT 0;
      `);
      await queryRunner.query(`
        ALTER TABLE products ADD salePrice DECIMAL(10,2) NOT NULL DEFAULT 0;
      `);
      await queryRunner.query(`
        ALTER TABLE products ADD CONSTRAINT fk_products_category FOREIGN KEY (categoryId) REFERENCES categories(id);
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const dbType = process.env.DB_TYPE || 'postgres';

    if (dbType === 'postgres') {
      await queryRunner.query(`ALTER TABLE "products" DROP CONSTRAINT "FK_products_category"`);
      await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "categoryId"`);
      await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "purchasePrice"`);
      await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "salePrice"`);
      await queryRunner.query(`DROP TABLE "categories"`);
      await queryRunner.query(`ALTER TABLE "products" ADD "category" character varying NOT NULL DEFAULT 'other'`);
    } else if (dbType === 'mysql' || dbType === 'mariadb') {
      await queryRunner.query(`ALTER TABLE products DROP FOREIGN KEY fk_products_category`);
      await queryRunner.query(`ALTER TABLE products DROP COLUMN categoryId`);
      await queryRunner.query(`ALTER TABLE products DROP COLUMN purchasePrice`);
      await queryRunner.query(`ALTER TABLE products DROP COLUMN salePrice`);
      await queryRunner.query(`DROP TABLE categories`);
      await queryRunner.query(`ALTER TABLE products ADD category ENUM('electronics', 'clothing', 'food', 'books', 'other') NOT NULL DEFAULT 'other'`);
    }
  }
}

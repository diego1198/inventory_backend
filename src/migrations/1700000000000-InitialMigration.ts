import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialMigration1700000000000 implements MigrationInterface {
  name = 'InitialMigration1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const dbType = process.env.DB_TYPE || 'postgres';

    if (dbType === 'postgres') {
      // ...existing code...
      await queryRunner.query(`
        CREATE TYPE "public"."user_role_enum" AS ENUM('admin', 'cashier')
      `);
      await queryRunner.query(`
        CREATE TYPE "public"."product_category_enum" AS ENUM('electronics', 'clothing', 'food', 'books', 'other')
      `);
      await queryRunner.query(`
        CREATE TYPE "public"."sale_status_enum" AS ENUM('pending', 'completed', 'cancelled')
      `);
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
      await queryRunner.query(`
        CREATE INDEX "IDX_8c8c8c8c8c8c8c8c8c8c8c8c8c8" ON "users" ("email")
      `);
      await queryRunner.query(`
        CREATE INDEX "IDX_8c8c8c8c8c8c8c8c8c8c8c8c8c8" ON "products" ("category")
      `);
      await queryRunner.query(`
        CREATE INDEX "IDX_8c8c8c8c8c8c8c8c8c8c8c8c8c8" ON "sales" ("createdAt")
      `);
    } else if (dbType === 'mysql' || dbType === 'mariadb') {
      // ...existing code...
      await queryRunner.query(`
        CREATE TABLE users (
          id CHAR(36) NOT NULL,
          email VARCHAR(255) NOT NULL,
          password VARCHAR(255) NOT NULL,
          firstName VARCHAR(255) NOT NULL,
          lastName VARCHAR(255) NOT NULL,
          role ENUM('admin', 'cashier') NOT NULL DEFAULT 'cashier',
          isActive BOOLEAN NOT NULL DEFAULT true,
          createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          UNIQUE KEY email_unique (email),
          PRIMARY KEY (id)
        )
      `);
      await queryRunner.query(`
        CREATE TABLE products (
          id CHAR(36) NOT NULL,
          name VARCHAR(255) NOT NULL,
          description TEXT NOT NULL,
          price DECIMAL(10,2) NOT NULL,
          stock INT NOT NULL,
          category ENUM('electronics', 'clothing', 'food', 'books', 'other') NOT NULL DEFAULT 'other',
          isActive BOOLEAN NOT NULL DEFAULT true,
          createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (id)
        )
      `);
      await queryRunner.query(`
        CREATE TABLE sales (
          id CHAR(36) NOT NULL,
          invoiceNumber VARCHAR(255) NOT NULL,
          subtotal DECIMAL(10,2) NOT NULL,
          tax DECIMAL(10,2) NOT NULL,
          total DECIMAL(10,2) NOT NULL,
          status ENUM('pending', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
          notes TEXT,
          userId CHAR(36) NOT NULL,
          createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          UNIQUE KEY invoice_unique (invoiceNumber),
          PRIMARY KEY (id)
        )
      `);
      await queryRunner.query(`
        CREATE TABLE sale_items (
          id CHAR(36) NOT NULL,
          quantity INT NOT NULL,
          unitPrice DECIMAL(10,2) NOT NULL,
          total DECIMAL(10,2) NOT NULL,
          saleId CHAR(36) NOT NULL,
          productId CHAR(36) NOT NULL,
          PRIMARY KEY (id)
        )
      `);
      await queryRunner.query(`
        ALTER TABLE sales ADD CONSTRAINT fk_sales_user FOREIGN KEY (userId) REFERENCES users(id)
      `);
      await queryRunner.query(`
        ALTER TABLE sale_items ADD CONSTRAINT fk_sale_items_sale FOREIGN KEY (saleId) REFERENCES sales(id)
      `);
      await queryRunner.query(`
        ALTER TABLE sale_items ADD CONSTRAINT fk_sale_items_product FOREIGN KEY (productId) REFERENCES products(id)
      `);
      await queryRunner.query(`
        CREATE INDEX idx_users_email ON users (email)
      `);
      await queryRunner.query(`
        CREATE INDEX idx_products_category ON products (category)
      `);
      await queryRunner.query(`
        CREATE INDEX idx_sales_createdAt ON sales (createdAt)
      `);
    }
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

import { MigrationInterface, QueryRunner } from 'typeorm';
import * as bcrypt from 'bcryptjs';

export class AddSuperadminRole1732500000000 implements MigrationInterface {
  name = 'AddSuperadminRole1732500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const dbType = process.env.DB_TYPE || 'postgres';

    if (dbType === 'postgres') {
      // Add 'superadmin' to the existing enum
      await queryRunner.query(`
        ALTER TYPE "users_role_enum" ADD VALUE IF NOT EXISTS 'superadmin'
      `);

      // Create superadmin user
      const hashedPassword = await bcrypt.hash('SuperAdmin123!', 10);
      await queryRunner.query(`
        INSERT INTO "users" ("id", "email", "password", "firstName", "lastName", "role", "isActive", "createdAt", "updatedAt")
        VALUES (
          gen_random_uuid(),
          'superadmin@inventory.com',
          '${hashedPassword}',
          'Super',
          'Admin',
          'superadmin',
          true,
          NOW(),
          NOW()
        )
        ON CONFLICT (email) DO NOTHING
      `);
    } else if (dbType === 'mysql' || dbType === 'mariadb') {
      // For MySQL, we need to recreate the enum by altering the column
      await queryRunner.query(`
        ALTER TABLE users MODIFY COLUMN role ENUM('superadmin', 'admin', 'cashier') NOT NULL DEFAULT 'cashier'
      `);

      // Create superadmin user
      const hashedPassword = await bcrypt.hash('SuperAdmin123!', 10);
      const userId = require('crypto').randomUUID();

      await queryRunner.query(`
        INSERT INTO users (id, email, password, firstName, lastName, role, isActive, createdAt, updatedAt)
        SELECT '${userId}', 'superadmin@inventory.com', '${hashedPassword}', 'Super', 'Admin', 'superadmin', true, NOW(), NOW()
        FROM DUAL
        WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'superadmin@inventory.com')
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const dbType = process.env.DB_TYPE || 'postgres';

    // Delete superadmin user
    await queryRunner.query(`
      DELETE FROM ${dbType === 'postgres' ? '"users"' : 'users'} 
      WHERE email = 'superadmin@inventory.com'
    `);

    if (dbType === 'mysql' || dbType === 'mariadb') {
      // Revert enum to original values
      await queryRunner.query(`
        ALTER TABLE users MODIFY COLUMN role ENUM('admin', 'cashier') NOT NULL DEFAULT 'cashier'
      `);
    }

    // Note: PostgreSQL doesn't support removing enum values easily
    // The superadmin value will remain in the enum but won't be used
  }
}

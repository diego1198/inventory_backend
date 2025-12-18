import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddVehicleManagement1764200000000 implements MigrationInterface {
  name = 'AddVehicleManagement1764200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add TECHNICIAN to users_role_enum (TypeORM generates enum name as table_column_enum)
    await queryRunner.query(`
      ALTER TYPE "users_role_enum" ADD VALUE IF NOT EXISTS 'technician'
    `);

    // Create engine_type enum
    await queryRunner.query(`
      CREATE TYPE "engine_type" AS ENUM (
        'gasoline',
        'diesel',
        'hybrid',
        'electric',
        'gas'
      )
    `);

    // Create service_order_status enum
    await queryRunner.query(`
      CREATE TYPE "service_order_status" AS ENUM (
        'pending',
        'in_progress',
        'waiting_parts',
        'completed',
        'delivered',
        'cancelled'
      )
    `);

    // Create service_order_type enum
    await queryRunner.query(`
      CREATE TYPE "service_order_type" AS ENUM (
        'maintenance',
        'repair',
        'diagnosis',
        'inspection',
        'oil_change',
        'tire_service',
        'brake_service',
        'electrical',
        'bodywork',
        'other'
      )
    `);

    // Create reminder_type enum
    await queryRunner.query(`
      CREATE TYPE "reminder_type" AS ENUM (
        'maintenance',
        'oil_change',
        'tire_rotation',
        'brake_check',
        'filter_change',
        'timing_belt',
        'coolant_flush',
        'transmission_service',
        'spark_plugs',
        'battery_check',
        'alignment',
        'custom'
      )
    `);

    // Create reminder_status enum
    await queryRunner.query(`
      CREATE TYPE "reminder_status" AS ENUM (
        'pending',
        'notified',
        'completed',
        'cancelled'
      )
    `);

    // Create notification_type enum
    await queryRunner.query(`
      CREATE TYPE "notification_type" AS ENUM (
        'order_assigned',
        'order_status_changed',
        'reminder_due',
        'reminder_overdue',
        'order_note_added',
        'vehicle_ready',
        'system'
      )
    `);

    // Create vehicles table
    await queryRunner.query(`
      CREATE TABLE "vehicles" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "plate" character varying(20) NOT NULL,
        "brand" character varying(100) NOT NULL,
        "model" character varying(100) NOT NULL,
        "year" integer NOT NULL,
        "color" character varying(50),
        "vin" character varying(50),
        "engine_type" "engine_type" NOT NULL DEFAULT 'gasoline',
        "current_mileage" integer NOT NULL DEFAULT 0,
        "notes" text,
        "customer_id" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_vehicles_plate" UNIQUE ("plate"),
        CONSTRAINT "PK_vehicles" PRIMARY KEY ("id")
      )
    `);

    // Create service_orders table
    await queryRunner.query(`
      CREATE TABLE "service_orders" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "order_number" character varying(20) NOT NULL,
        "type" "service_order_type" NOT NULL DEFAULT 'maintenance',
        "status" "service_order_status" NOT NULL DEFAULT 'pending',
        "description" text,
        "diagnosis" jsonb,
        "technician_notes" jsonb DEFAULT '[]',
        "estimated_cost" numeric(10,2),
        "final_cost" numeric(10,2),
        "entry_mileage" integer,
        "exit_mileage" integer,
        "estimated_completion_date" TIMESTAMP,
        "actual_completion_date" TIMESTAMP,
        "vehicle_id" uuid NOT NULL,
        "customer_id" uuid NOT NULL,
        "assigned_to_id" uuid,
        "created_by_id" uuid NOT NULL,
        "sale_id" uuid,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_service_orders_order_number" UNIQUE ("order_number"),
        CONSTRAINT "PK_service_orders" PRIMARY KEY ("id")
      )
    `);

    // Create reminders table
    await queryRunner.query(`
      CREATE TABLE "reminders" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "type" "reminder_type" NOT NULL,
        "title" character varying(200) NOT NULL,
        "description" text,
        "due_date" TIMESTAMP,
        "due_mileage" integer,
        "advance_notice_days" integer NOT NULL DEFAULT 7,
        "status" "reminder_status" NOT NULL DEFAULT 'pending',
        "notified_at" TIMESTAMP,
        "completed_at" TIMESTAMP,
        "vehicle_id" uuid NOT NULL,
        "customer_id" uuid NOT NULL,
        "origin_service_order_id" uuid,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_reminders" PRIMARY KEY ("id")
      )
    `);

    // Create notifications table
    await queryRunner.query(`
      CREATE TABLE "notifications" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "type" "notification_type" NOT NULL,
        "title" character varying(200) NOT NULL,
        "message" text NOT NULL,
        "is_read" boolean NOT NULL DEFAULT false,
        "read_at" TIMESTAMP,
        "user_id" uuid NOT NULL,
        "service_order_id" uuid,
        "vehicle_id" uuid,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_notifications" PRIMARY KEY ("id")
      )
    `);

    // Add foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "vehicles" ADD CONSTRAINT "FK_vehicles_customer" 
      FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "service_orders" ADD CONSTRAINT "FK_service_orders_vehicle" 
      FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "service_orders" ADD CONSTRAINT "FK_service_orders_customer" 
      FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "service_orders" ADD CONSTRAINT "FK_service_orders_assigned_to" 
      FOREIGN KEY ("assigned_to_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "service_orders" ADD CONSTRAINT "FK_service_orders_created_by" 
      FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "service_orders" ADD CONSTRAINT "FK_service_orders_sale" 
      FOREIGN KEY ("sale_id") REFERENCES "sales"("id") ON DELETE SET NULL ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "reminders" ADD CONSTRAINT "FK_reminders_vehicle" 
      FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "reminders" ADD CONSTRAINT "FK_reminders_customer" 
      FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "reminders" ADD CONSTRAINT "FK_reminders_origin_service_order" 
      FOREIGN KEY ("origin_service_order_id") REFERENCES "service_orders"("id") ON DELETE SET NULL ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "notifications" ADD CONSTRAINT "FK_notifications_user" 
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "notifications" ADD CONSTRAINT "FK_notifications_service_order" 
      FOREIGN KEY ("service_order_id") REFERENCES "service_orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "notifications" ADD CONSTRAINT "FK_notifications_vehicle" 
      FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    // Create indexes for better query performance
    await queryRunner.query(`CREATE INDEX "IDX_vehicles_plate" ON "vehicles" ("plate")`);
    await queryRunner.query(`CREATE INDEX "IDX_vehicles_customer" ON "vehicles" ("customer_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_service_orders_order_number" ON "service_orders" ("order_number")`);
    await queryRunner.query(`CREATE INDEX "IDX_service_orders_vehicle" ON "service_orders" ("vehicle_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_service_orders_status" ON "service_orders" ("status")`);
    await queryRunner.query(`CREATE INDEX "IDX_service_orders_assigned_to" ON "service_orders" ("assigned_to_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_reminders_vehicle" ON "reminders" ("vehicle_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_reminders_status" ON "reminders" ("status")`);
    await queryRunner.query(`CREATE INDEX "IDX_reminders_due_date" ON "reminders" ("due_date")`);
    await queryRunner.query(`CREATE INDEX "IDX_notifications_user" ON "notifications" ("user_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_notifications_is_read" ON "notifications" ("is_read")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX "IDX_notifications_is_read"`);
    await queryRunner.query(`DROP INDEX "IDX_notifications_user"`);
    await queryRunner.query(`DROP INDEX "IDX_reminders_due_date"`);
    await queryRunner.query(`DROP INDEX "IDX_reminders_status"`);
    await queryRunner.query(`DROP INDEX "IDX_reminders_vehicle"`);
    await queryRunner.query(`DROP INDEX "IDX_service_orders_assigned_to"`);
    await queryRunner.query(`DROP INDEX "IDX_service_orders_status"`);
    await queryRunner.query(`DROP INDEX "IDX_service_orders_vehicle"`);
    await queryRunner.query(`DROP INDEX "IDX_service_orders_order_number"`);
    await queryRunner.query(`DROP INDEX "IDX_vehicles_customer"`);
    await queryRunner.query(`DROP INDEX "IDX_vehicles_plate"`);

    // Drop foreign key constraints
    await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT "FK_notifications_vehicle"`);
    await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT "FK_notifications_service_order"`);
    await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT "FK_notifications_user"`);
    await queryRunner.query(`ALTER TABLE "reminders" DROP CONSTRAINT "FK_reminders_origin_service_order"`);
    await queryRunner.query(`ALTER TABLE "reminders" DROP CONSTRAINT "FK_reminders_customer"`);
    await queryRunner.query(`ALTER TABLE "reminders" DROP CONSTRAINT "FK_reminders_vehicle"`);
    await queryRunner.query(`ALTER TABLE "service_orders" DROP CONSTRAINT "FK_service_orders_sale"`);
    await queryRunner.query(`ALTER TABLE "service_orders" DROP CONSTRAINT "FK_service_orders_created_by"`);
    await queryRunner.query(`ALTER TABLE "service_orders" DROP CONSTRAINT "FK_service_orders_assigned_to"`);
    await queryRunner.query(`ALTER TABLE "service_orders" DROP CONSTRAINT "FK_service_orders_customer"`);
    await queryRunner.query(`ALTER TABLE "service_orders" DROP CONSTRAINT "FK_service_orders_vehicle"`);
    await queryRunner.query(`ALTER TABLE "vehicles" DROP CONSTRAINT "FK_vehicles_customer"`);

    // Drop tables
    await queryRunner.query(`DROP TABLE "notifications"`);
    await queryRunner.query(`DROP TABLE "reminders"`);
    await queryRunner.query(`DROP TABLE "service_orders"`);
    await queryRunner.query(`DROP TABLE "vehicles"`);

    // Drop enums
    await queryRunner.query(`DROP TYPE "notification_type"`);
    await queryRunner.query(`DROP TYPE "reminder_status"`);
    await queryRunner.query(`DROP TYPE "reminder_type"`);
    await queryRunner.query(`DROP TYPE "service_order_type"`);
    await queryRunner.query(`DROP TYPE "service_order_status"`);
    await queryRunner.query(`DROP TYPE "engine_type"`);

    // Note: Cannot easily remove a value from an enum in PostgreSQL
    // The TECHNICIAN role will remain in the user_role enum
  }
}

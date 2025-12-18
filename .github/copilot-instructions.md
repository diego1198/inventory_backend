# Copilot Instructions - Inventory Backend (NestJS)

## Architecture

NestJS REST API with TypeORM + PostgreSQL. Serves as the single source of truth for the inventory & billing system.

## Module Structure

Each domain follows: `{domain}.module.ts`, `{domain}.controller.ts`, `{domain}.service.ts`, `dto/`, `entities/`

Example: `src/products/` contains controller, service, module, DTOs, and entity files.

## Entity Conventions

```typescript
@Entity('table_name')
export class Example {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ default: true })
  isActive: boolean;  // Soft delete pattern - NOT TypeORM's @DeleteDateColumn

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

## DTO Validation

Use `class-validator` + `class-transformer` with `@ApiProperty` for Swagger:
```typescript
@ApiProperty({ example: 1299.99, description: 'Precio de venta' })
@IsNumber()
@Min(0)
@Type(() => Number)
salePrice: number;
```

## Authorization

Role hierarchy: `SUPERADMIN > ADMIN > CASHIER > TECHNICIAN`
- Apply `@UseGuards(JwtAuthGuard, RolesGuard)` at controller level
- Use `@Roles(UserRole.ADMIN, UserRole.CASHIER)` per endpoint
- See `src/common/guards/roles.guard.ts` for hierarchy logic

## Database Migrations

```bash
npm run migration:generate -- src/migrations/MigrationName
npm run migration:run
npm run migration:revert
```

Migrations in `src/migrations/`. Config in `ormconfig.ts`.

## Commands

```bash
pnpm install
pnpm start:dev      # Dev server (port 3000)
pnpm test           # Jest unit tests
pnpm test:e2e       # E2E tests
pnpm lint           # ESLint
```

## Environment Variables

```
DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_DATABASE
JWT_SECRET
```

## Adding a New Feature

1. Create entity in `src/{domain}/entities/`
2. Create DTOs in `src/{domain}/dto/`
3. Generate migration: `npm run migration:generate -- src/migrations/Name`
4. Create service, controller, module
5. Register module in `app.module.ts`
6. Add Swagger decorators (`@ApiTags`, `@ApiOperation`, `@ApiResponse`, `@ApiBearerAuth`)

## API Documentation

Swagger UI at `http://localhost:3000/api/docs`

## Code Style

- Spanish for user-facing messages (e.g., "Producto no encontrado")
- English for code (variable names, comments)
- All endpoints return consistent response structure

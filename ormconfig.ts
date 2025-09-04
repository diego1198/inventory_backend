import { DataSource } from 'typeorm';
import { config } from 'dotenv';

config();

const allowedDbTypes = ['postgres', 'mysql', 'mariadb'] as const;
type DbType = typeof allowedDbTypes[number];
const dbType: DbType = allowedDbTypes.includes(process.env.DB_TYPE as DbType)
  ? (process.env.DB_TYPE as DbType)
  : 'postgres';

console.log(`Using database type: ${dbType}`);
export const AppDataSource = new DataSource({
  type: dbType,
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT
    ? parseInt(process.env.DB_PORT)
    : process.env.DB_TYPE === 'mysql' || process.env.DB_TYPE === 'mariadb'
      ? 3306
      : 5432,
  username: process.env.DB_USERNAME || (process.env.DB_TYPE === 'postgres' ? 'postgres' : 'root'),
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_DATABASE || 'inventory_db',
  entities: [__dirname + '/src/**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/src/migrations/*{.ts,.js}'],
  synchronize: process.env.NODE_ENV === 'development',
  logging: process.env.NODE_ENV === 'development',
});

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProductsModule } from './products/products.module';
import { SalesModule } from './sales/sales.module';
import { ReportsModule } from './reports/reports.module';
import { CategoriesModule } from './categories/categories.module';
import { InventoryModule } from './inventory/inventory.module';
import { CustomersModule } from './customers/customers.module';
import { ServicesModule } from './services/services.module';
import { SettingsModule } from './settings/settings.module';
import { VehiclesModule } from './vehicles/vehicles.module';
import { ServiceOrdersModule } from './service-orders/service-orders.module';
import { RemindersModule } from './reminders/reminders.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: process.env.NODE_ENV === 'development',
      logging: process.env.NODE_ENV === 'development',
    }),
    AuthModule,
    UsersModule,
    ProductsModule,
    SalesModule,
    ReportsModule,
    CategoriesModule,
    InventoryModule,
    CustomersModule,
    ServicesModule,
    SettingsModule,
    VehiclesModule,
    ServiceOrdersModule,
    RemindersModule,
    NotificationsModule,
  ],
})
export class AppModule { }

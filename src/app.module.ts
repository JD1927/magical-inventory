import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoriesModule } from './categories/categories.module';
import { CommonModule } from './common/common.module';
import appConfig from './config/app.config';
import { ConfigValidationSchema } from './config/config-validation.schema';
import { InventoryModule } from './inventory/inventory.module';
import { ProductsModule } from './products/products.module';
import { SuppliersModule } from './suppliers/suppliers.module';
import { SeedModule } from './seed/seed.module';
import { AuthModule } from './auth/auth.module';

const isProd = (): boolean => process.env.NODE_ENV === 'production';

@Module({
  imports: [
    // Configure global settings for the application
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
      validationSchema: ConfigValidationSchema,
    }),
    // Import TypeORM module with PostgreSQL configuration
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: +(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      autoLoadEntities: true,
      synchronize: process.env.DB_SYNCHRONIZE === 'true' || !isProd(),
      migrations: ['src/migrations/*.ts', 'dist/migrations/*.js'],
      migrationsRun: false,
      // Enable logging in development mode for debugging purposes
      logging: !isProd(),
      ssl:
        process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
      extra: {
        ssl:
          process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
      },
    }),
    // Products module
    ProductsModule,
    // Common module for shared utilities
    CommonModule,
    // Categories module for product categories
    CategoriesModule,
    // Suppliers module for managing suppliers
    SuppliersModule,
    // Inventory module for managing inventory movements
    InventoryModule,
    // Auth module for authentication, authorization and user management
    AuthModule,
    // Seed module for seeding data (only in development mode)
    ...(isProd() ? [] : [SeedModule]),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}

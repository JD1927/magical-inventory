import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import appConfig from './config/app.config';
import { ConfigValidationSchema } from './config/config-validation.schema';
import { ProductsModule } from './products/products.module';
import { CommonModule } from './common/common.module';

const isProd = (): boolean => process.env.NODE_ENV === 'production';

@Module({
  imports: [
    // Configure global settings for the application
    ConfigModule.forRoot({
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
      synchronize: !isProd(),
      ssl: isProd() ? { rejectUnauthorized: false } : false,
      extra: {
        ssl: isProd() ? { rejectUnauthorized: false } : false,
      },
      // Enable logging in development mode for debugging purposes
      logging: !isProd(),
    }),
    ProductsModule,
    CommonModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}

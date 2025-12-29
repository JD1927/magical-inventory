import 'dotenv/config';
import { DataSource } from 'typeorm';

const isProd = (): boolean => process.env.NODE_ENV === 'production';

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: +(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  entities: ['src/**/*.entity.ts'],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
  logging: true,
  ssl: isProd() ? { rejectUnauthorized: false } : false,
});

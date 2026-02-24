export default () => ({
  environment: process.env.NODE_ENV || 'dev',
  port: process.env.PORT || 3000,
  db_name: process.env.DB_NAME || 'postgres',
  db_password: process.env.DB_PASSWORD,
  db_host: process.env.DB_HOST || 'localhost',
  db_port: +(process.env.DB_PORT || '5432'),
  db_username: process.env.DB_USERNAME || 'postgres',
  admin_email: process.env.ADMIN_EMAIL,
  rp_name: process.env.RP_NAME || 'Magical Inventory',
  rp_id: process.env.RP_ID || 'localhost',
  rp_origin: process.env.RP_ORIGIN || 'http://localhost:4200',
});

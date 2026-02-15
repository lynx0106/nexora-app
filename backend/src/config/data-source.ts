import 'dotenv/config';
import { DataSource } from 'typeorm';

// Configuracion para CLI de migraciones.
export default new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  host: process.env.DATABASE_URL ? undefined : process.env.POSTGRES_HOST || 'localhost',
  port: process.env.DATABASE_URL
    ? undefined
    : parseInt(process.env.POSTGRES_PORT || '5432', 10) || 5432,
  username: process.env.DATABASE_URL ? undefined : process.env.POSTGRES_USER || 'postgres',
  password: process.env.DATABASE_URL
    ? undefined
    : process.env.POSTGRES_PASSWORD || 'adminpassword',
  database: process.env.DATABASE_URL ? undefined : process.env.POSTGRES_DB || 'postgres',
  ssl: process.env.DATABASE_URL
    ? {
        rejectUnauthorized: false,
      }
    : false,
  entities: [__dirname + '/../**/*.entity.{ts,js}'],
  migrations: [__dirname + '/../migrations/*.{ts,js}'],
  synchronize: false,
});

import { Logger } from '@nestjs/common';

const logger = new Logger('DatabaseConfig');

/**
 * Database configuration that supports:
 * 1. Supabase (production)
 * 2. Railway PostgreSQL (fallback)
 * 3. Local PostgreSQL (development)
 */

export interface DatabaseConfig {
  type: 'postgres';
  url?: string;
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  database?: string;
  ssl?: boolean | { rejectUnauthorized: boolean };
}

/**
 * Get database configuration based on environment variables
 * Priority:
 * 1. SUPABASE_DATABASE_URL (explicit Supabase connection)
 * 2. DATABASE_URL (generic, used by Railway/Railway-provided Supabase)
 * 3. Individual POSTGRES_* variables (local development)
 */
export function getDatabaseConfig(): DatabaseConfig {
  // Check if using Supabase (explicit URL or Railway integration)
  const supabaseUrl =
    process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL;

  if (supabaseUrl?.includes('supabase')) {
    logger.log('Using Supabase database');
    const isPooler = supabaseUrl?.includes('pooler');
    if (isPooler) {
      logger.log('Using connection pooler (pgbouncer)');
      // For pooler, we need specific settings to avoid prepared statement issues
      return {
        type: 'postgres',
        url: supabaseUrl,
        ssl: { rejectUnauthorized: false },
        extra: {
          // Pooler settings - disable prepared statements
          max: 5,
          connectionTimeoutMillis: 30000,
          idleTimeoutMillis: 30000,
          statement_timeout: 30000,
        },
      } as any;
    }

    return {
      type: 'postgres',
      url: supabaseUrl,
      ssl: { rejectUnauthorized: false },
    };
  }

  if (process.env.DATABASE_URL) {
    logger.log('Using DATABASE_URL (Railway/Cloud)');
    return {
      type: 'postgres',
      url: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    };
  }

  logger.log('Using local PostgreSQL configuration');
  return {
    type: 'postgres',
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
    username: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'adminpassword',
    database: process.env.POSTGRES_DB || 'postgres',
    ssl: false,
  };
}

/**
 * Log database connection info (without sensitive data)
 */
export function logDatabaseConfig(): void {
  const config = getDatabaseConfig();
  if (config.url) {
    const maskedUrl = config.url.replace(/:\/\/[^:]+:[^@]+@/, '://***:***@');
    logger.log(`Database: ${maskedUrl}`);
  } else {
    logger.log(`Database: ${config.host}:${config.port}/${config.database}`);
  }
}

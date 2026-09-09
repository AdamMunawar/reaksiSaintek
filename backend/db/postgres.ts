import { Pool, QueryResult, QueryResultRow } from 'pg';

let pool: Pool | null = null;

export function getPool(): Pool | null {
  if (!process.env.DATABASE_URL) {
    return null;
  }

  if (!pool) {
    let connectionString = process.env.DATABASE_URL || '';
    // Strip sslmode query parameter if present to avoid pg driver enforcing strict CA validation
    connectionString = connectionString.replace(/[?&]sslmode=[^&]+/, '');

    const isLocalhost = connectionString.includes('localhost') || connectionString.includes('127.0.0.1');

    pool = new Pool({
      connectionString,
      ssl: isLocalhost ? false : { rejectUnauthorized: false },
      max: 5, // Serverless-safe connection pool limit
      idleTimeoutMillis: 10000, // Return idle connections after 10s
      connectionTimeoutMillis: 5000, // Fast connection timeout failover
    });

    pool.on('error', (err) => {
      console.error('Unexpected error on idle PostgreSQL client', err);
    });
  }

  return pool;
}

export async function query<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T> | null> {
  const p = getPool();
  if (!p) return null;

  try {
    const start = Date.now();
    const res = await p.query<T>(text, params);
    const duration = Date.now() - start;
    if (process.env.NODE_ENV === 'development') {
      if (duration > 3000) {
        console.info(`[DB Query ${duration}ms]: ${text}`);
      }
    }
    return res;
  } catch (error) {
    console.error('[500] Database Connection / Query Exception');
    pool = null; // Reset pool on connection error to ensure fresh retry
    throw error;
  }
}

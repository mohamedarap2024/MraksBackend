import { Pool, type PoolClient } from "pg";
import { validateServerEnv } from "./env";

declare global {
  // eslint-disable-next-line no-var
  var _pgPool: Pool | undefined;
}

function createPool(): Pool {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is not set");
  }
  return new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: process.env.NODE_ENV === "production" ? 3 : 10,
    idleTimeoutMillis: 20_000,
    connectionTimeoutMillis: 15_000,
  });
}

/** Reuse one pool per serverless instance (Vercel + Neon pooler). */
export function getPool(): Pool {
  if (!global._pgPool) {
    global._pgPool = createPool();
  }
  return global._pgPool;
}

export async function query<T = unknown>(
  text: string,
  params?: unknown[]
): Promise<T[]> {
  const envCheck = validateServerEnv();
  if (!envCheck.ok) throw new Error(envCheck.errors.join(" "));

  const client = await getPool().connect();
  try {
    const result = await client.query(text, params);
    return result.rows as T[];
  } finally {
    client.release();
  }
}

export async function testConnection(): Promise<void> {
  const envCheck = validateServerEnv();
  if (!envCheck.ok) throw new Error(envCheck.errors.join(" "));
  await getPool().query("SELECT 1");
}

export async function withTransaction<T>(
  fn: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

import bcrypt from "bcryptjs";
import { getPool } from "./db";
import { seedSampleStudentsIfEmpty } from "./seed";
import { validateServerEnv } from "./env";

declare global {
  // eslint-disable-next-line no-var
  var _dbInitialized: boolean | undefined;
}

export async function initializeDatabase(): Promise<void> {
  if (global._dbInitialized) return;

  const envCheck = validateServerEnv();
  if (!envCheck.ok) throw new Error(envCheck.errors.join(" "));

  const client = await getPool().connect();
  try {
    // Students table
    await client.query(`
      CREATE TABLE IF NOT EXISTS students (
        id          SERIAL PRIMARY KEY,
        student_id  VARCHAR(50)  UNIQUE NOT NULL,
        name        VARCHAR(255) NOT NULL,
        subjects    JSONB        NOT NULL DEFAULT '{}',
        total       INTEGER      NOT NULL DEFAULT 0,
        grade       VARCHAR(5)   NOT NULL DEFAULT 'F',
        created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        pin_hash    VARCHAR(255)
      );
    `);

    await client.query(`
      ALTER TABLE students ADD COLUMN IF NOT EXISTS pin_hash VARCHAR(255);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_students_student_id_lower
      ON students (LOWER(student_id));
    `);

    // Admin users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id            SERIAL PRIMARY KEY,
        username      VARCHAR(100) UNIQUE NOT NULL,
        email         VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
      );
    `);

    // Migrate legacy admins table if it exists
    await client.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = 'admins'
        ) THEN
          INSERT INTO users (username, email, password_hash, created_at)
          SELECT username, email, password_hash, created_at FROM admins
          ON CONFLICT (username) DO NOTHING;
        END IF;
      END $$;
    `);

    const adminUsername = process.env.ADMIN_USERNAME!;
    const adminEmail = process.env.ADMIN_EMAIL!;
    const adminPassword = process.env.ADMIN_PASSWORD!;
    const passwordHash = await bcrypt.hash(adminPassword, 12);

    const existing = await client.query(
      "SELECT id FROM users WHERE username = $1 OR LOWER(email) = LOWER($2)",
      [adminUsername, adminEmail]
    );

    if (existing.rows.length === 0) {
      await client.query(
        `INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3)`,
        [adminUsername, adminEmail, passwordHash]
      );
      console.log(`[init-db] User created: ${adminUsername}`);
    } else {
      await client.query(
        `UPDATE users
         SET password_hash = $1, email = $2, username = $3, updated_at = NOW()
         WHERE id = $4`,
        [passwordHash, adminEmail, adminUsername, existing.rows[0].id]
      );
      console.log(`[init-db] User updated: ${adminUsername}`);
    }

    global._dbInitialized = true;
    console.log("[init-db] Tables ready: users, students");
  } finally {
    client.release();
  }

  await seedSampleStudentsIfEmpty();
}

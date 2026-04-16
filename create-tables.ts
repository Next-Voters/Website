import pg from 'pg';
import { Kysely, PostgresDialect } from 'kysely';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: true });
const db = new Kysely({
  dialect: new PostgresDialect({
    pool,
  }),
});

async function run() {
  try {
    await db.schema.createTable('user')
      .addColumn('id', 'text', (col) => col.primaryKey())
      .addColumn('name', 'text', (col) => col.notNull())
      .addColumn('email', 'text', (col) => col.notNull().unique())
      .addColumn('emailVerified', 'boolean', (col) => col.notNull())
      .addColumn('image', 'text')
      .addColumn('createdAt', 'timestamp', (col) => col.notNull())
      .addColumn('updatedAt', 'timestamp', (col) => col.notNull())
      .execute();
      console.log("Created user table");
  } catch(e) { console.log("User table might exist:", e.message) }

  try {
    await db.schema.createTable('session')
      .addColumn('id', 'text', (col) => col.primaryKey())
      .addColumn('expiresAt', 'timestamp', (col) => col.notNull())
      .addColumn('token', 'text', (col) => col.notNull().unique())
      .addColumn('createdAt', 'timestamp', (col) => col.notNull())
      .addColumn('updatedAt', 'timestamp', (col) => col.notNull())
      .addColumn('ipAddress', 'text')
      .addColumn('userAgent', 'text')
      .addColumn('userId', 'text', (col) => col.notNull().references('user.id').onDelete('cascade'))
      .execute();
      console.log("Created session table");
  } catch(e) { console.log("Session table might exist:", e.message) }

  try {
    await db.schema.createTable('account')
      .addColumn('id', 'text', (col) => col.primaryKey())
      .addColumn('accountId', 'text', (col) => col.notNull())
      .addColumn('providerId', 'text', (col) => col.notNull())
      .addColumn('userId', 'text', (col) => col.notNull().references('user.id').onDelete('cascade'))
      .addColumn('accessToken', 'text')
      .addColumn('refreshToken', 'text')
      .addColumn('idToken', 'text')
      .addColumn('accessTokenExpiresAt', 'timestamp')
      .addColumn('refreshTokenExpiresAt', 'timestamp')
      .addColumn('scope', 'text')
      .addColumn('password', 'text')
      .addColumn('createdAt', 'timestamp', (col) => col.notNull())
      .addColumn('updatedAt', 'timestamp', (col) => col.notNull())
      .execute();
      console.log("Created account table");
  } catch(e) { console.log("Account table might exist:", e.message) }

  try {
    await db.schema.createTable('verification')
      .addColumn('id', 'text', (col) => col.primaryKey())
      .addColumn('identifier', 'text', (col) => col.notNull())
      .addColumn('value', 'text', (col) => col.notNull())
      .addColumn('expiresAt', 'timestamp', (col) => col.notNull())
      .addColumn('createdAt', 'timestamp')
      .addColumn('updatedAt', 'timestamp')
      .execute();
      console.log("Created verification table");
  } catch(e) { console.log("Verification table might exist:", e.message) }

  console.log("Migrations complete!");
  process.exit(0);
}

run().catch(e => { console.error(e); process.exit(1); })

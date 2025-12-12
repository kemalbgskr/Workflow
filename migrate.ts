import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import { PGlite } from '@electric-sql/pglite';
import 'dotenv/config';

async function runMigrations() {
  console.log('⏳ Running database migrations with PGlite...');

  // Ensure we use the exact same path as server/db.ts
  const client = new PGlite('./.pglite');
  const db = drizzle(client);

  try {
    await migrate(db, { migrationsFolder: './migrations' });
    console.log('✅ Migrations completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    // PGlite client doesn't need explicit end() in same way, but let's be safe if API supports it
    // await client.close(); // PGlite might not have close/end, it's embedded.
    console.log('🏁 Migration script finished.');
  }
}

runMigrations();


import { db } from './server/db';
import { sql } from 'drizzle-orm';

async function fixTeamColumn() {
  try {
    console.log('Using project DB connection...');
    console.log('Attempting to add team_members column...');
    
    // Check if column exists first to avoid error
    const checkRes = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'projects' AND column_name = 'team_members'
    `);
    
    if (checkRes.rowCount && checkRes.rowCount > 0) {
      console.log('Column team_members already exists.');
    } else {
      await db.execute(sql`ALTER TABLE projects ADD COLUMN team_members text[]`);
      console.log('Successfully altered table projects.');
    }

    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

fixTeamColumn();

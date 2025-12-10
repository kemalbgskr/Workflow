import { neon } from '@neondatabase/serverless';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const sql = neon(process.env.DATABASE_URL);

async function runMigration() {
  try {
    console.log('Running team members migration...');
    
    const migrationSQL = fs.readFileSync('./migrations/0008_add_project_team.sql', 'utf8');
    
    await sql(migrationSQL);
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

runMigration();
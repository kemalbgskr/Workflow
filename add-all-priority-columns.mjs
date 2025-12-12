import pg from 'pg';
import { config } from 'dotenv';

config();

const { Client } = pg;

async function addAllPriorityColumns() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });
  
  try {
    await client.connect();
    console.log('Connected to database');
    
    const tables = [
      'projects',
      'documents', 
      'approval_rounds',
      'project_status_requests',
      'project_approvers'
    ];
    
    for (const table of tables) {
      console.log(`\nChecking ${table}...`);
      
      // Check if column exists
      const checkResult = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = $1
        AND column_name = 'priority'
      `, [table]);
      
      if (checkResult.rows.length > 0) {
        console.log(`  ✅ Priority column already exists in ${table}`);
      } else {
        console.log(`  Adding priority column to ${table}...`);
        try {
          await client.query(`ALTER TABLE ${table} ADD COLUMN priority TEXT NOT NULL DEFAULT 'MEDIUM'`);
          console.log(`  ✅ Priority column added to ${table}`);
        } catch (error) {
          console.error(`  ❌ Error adding to ${table}:`, error.message);
        }
      }
    }
    
    console.log('\n✅ All priority columns processed!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await client.end();
  }
}

addAllPriorityColumns();

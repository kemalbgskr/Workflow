import pg from 'pg';
import { config } from 'dotenv';

config();

const { Client } = pg;

async function addPriorityColumn() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });
  
  try {
    await client.connect();
    console.log('Connected to database');
    
    console.log('Checking if priority column exists...');
    
    // Check if column exists first
    const checkResult = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'project_approvers' 
      AND column_name = 'priority'
    `);
    
    if (checkResult.rows.length > 0) {
      console.log('✅ Priority column already exists');
      return;
    }
    
    console.log('Adding priority column...');
    
    // Add the column
    await client.query(`ALTER TABLE project_approvers ADD COLUMN priority TEXT NOT NULL DEFAULT 'MEDIUM'`);
    
    console.log('✅ Priority column added successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await client.end();
  }
}

addPriorityColumn();

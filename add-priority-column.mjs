import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';

config();

const sql = neon(process.env.DATABASE_URL);

async function addPriorityColumn() {
  try {
    console.log('Adding priority column to project_approvers...');
    
    // Check if column exists first
    const checkResult = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'project_approvers' 
      AND column_name = 'priority'
    `;
    
    if (checkResult.length > 0) {
      console.log('✅ Priority column already exists');
      return;
    }
    
    // Add the column
    await sql`ALTER TABLE project_approvers ADD COLUMN priority TEXT NOT NULL DEFAULT 'MEDIUM'`;
    
    console.log('✅ Priority column added successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  }
}

addPriorityColumn();

import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
dotenv.config();

const sql = neon(process.env.DATABASE_URL);

async function addTeamColumn() {
  try {
    console.log('Checking if team_members column exists...');
    
    // Check if column exists
    const columnExists = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'projects' AND column_name = 'team_members'
    `;
    
    if (columnExists.length > 0) {
      console.log('team_members column already exists!');
      return;
    }
    
    console.log('Adding team_members column...');
    
    // Add the column
    await sql`ALTER TABLE projects ADD COLUMN team_members text[]`;
    
    console.log('team_members column added successfully!');
  } catch (error) {
    console.error('Error:', error);
  }
}

addTeamColumn();
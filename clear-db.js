import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { documents, projects, approvers, approvalRounds, comments } from './shared/schema.ts';
import 'dotenv/config';

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql);

async function clearDatabase() {
  try {
    console.log('Clearing database...');
    
    // Delete in order to respect foreign key constraints
    await db.delete(comments);
    await db.delete(approvers);
    await db.delete(approvalRounds);
    await db.delete(documents);
    await db.delete(projects);
    
    console.log('Database cleared successfully!');
  } catch (error) {
    console.error('Error clearing database:', error);
  }
}

clearDatabase();
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { documents, projects, approvers, approvalRounds, comments } from './shared/schema.js';
import 'dotenv/config';

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

async function clearAll() {
  try {
    console.log('Clearing all data...');
    
    await db.delete(comments);
    await db.delete(approvers);  
    await db.delete(approvalRounds);
    await db.delete(documents);
    await db.delete(projects);
    
    console.log('All data cleared!');
  } catch (error) {
    console.error('Error:', error);
  }
}

clearAll();
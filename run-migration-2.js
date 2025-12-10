import { Client } from 'pg';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client({
  connectionString: process.env.DATABASE_URL
});

async function runMigration() {
  try {
    await client.connect();
    console.log('Connected to database');
    
    const sql = fs.readFileSync('migrations/0004_add_docuseal_fields.sql', 'utf8');
    await client.query(sql);
    
    console.log('Migration 0004 completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await client.end();
  }
}

runMigration();
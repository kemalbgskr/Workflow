require('dotenv').config();
const { Client } = require('pg');
const fs = require('fs');

async function runMigration() {
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Found' : 'Not found');
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('Connected to database');

    const sql = fs.readFileSync('migrations/add_comment_fields.sql', 'utf8');
    await client.query(sql);
    
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await client.end();
  }
}

runMigration();
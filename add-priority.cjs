const { Client } = require('pg');

async function addPriorityColumns() {
  const client = new Client({
    connectionString: 'postgresql://postgres:admin@localhost:5432/postgres'
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Check if priority column exists in projects table
    const checkProjects = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'projects' AND column_name = 'priority'
    `);

    if (checkProjects.rows.length === 0) {
      console.log('Adding priority column to projects table...');
      await client.query(`ALTER TABLE projects ADD COLUMN priority TEXT NOT NULL DEFAULT 'MEDIUM'`);
      console.log('Priority column added to projects table');
    } else {
      console.log('Priority column already exists in projects table');
    }

    // Check if priority column exists in documents table
    const checkDocuments = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'documents' AND column_name = 'priority'
    `);

    if (checkDocuments.rows.length === 0) {
      console.log('Adding priority column to documents table...');
      await client.query(`ALTER TABLE documents ADD COLUMN priority TEXT NOT NULL DEFAULT 'MEDIUM'`);
      console.log('Priority column added to documents table');
    } else {
      console.log('Priority column already exists in documents table');
    }

    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await client.end();
  }
}

addPriorityColumns();
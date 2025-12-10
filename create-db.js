import { Client } from 'pg';

async function createDatabase() {
  // Connect to postgres database to create replitvibe database
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'password',
    database: 'postgres'
  });

  try {
    await client.connect();
    console.log('📦 Creating database "replitvibe"...');
    
    // Check if database exists
    const result = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = 'replitvibe'"
    );
    
    if (result.rows.length === 0) {
      await client.query('CREATE DATABASE replitvibe');
      console.log('✅ Database "replitvibe" created successfully');
    } else {
      console.log('ℹ️  Database "replitvibe" already exists');
    }
  } catch (error) {
    console.error('❌ Error creating database:', error.message);
  } finally {
    await client.end();
  }
}

createDatabase();
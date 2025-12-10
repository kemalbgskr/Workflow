import { spawn } from 'child_process';
import { existsSync } from 'fs';
import path from 'path';

console.log('🚀 Setting up BNI SDLC Database...\n');

// Check if PostgreSQL is installed
function checkPostgreSQL() {
  return new Promise((resolve) => {
    const psql = spawn('psql', ['--version'], { stdio: 'pipe' });
    psql.on('close', (code) => {
      resolve(code === 0);
    });
    psql.on('error', () => {
      resolve(false);
    });
  });
}

// Create database if it doesn't exist
function createDatabase() {
  return new Promise((resolve, reject) => {
    console.log('📦 Creating database "replitvibe"...');
    const createDb = spawn('createdb', ['replitvibe'], { stdio: 'inherit' });
    createDb.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Database created successfully');
        resolve();
      } else {
        console.log('ℹ️  Database might already exist, continuing...');
        resolve(); // Continue even if database exists
      }
    });
    createDb.on('error', (err) => {
      console.log('⚠️  Could not create database automatically');
      console.log('Please create PostgreSQL database "replitvibe" manually');
      resolve(); // Continue anyway
    });
  });
}

// Push database schema
function pushSchema() {
  return new Promise((resolve, reject) => {
    console.log('🔄 Pushing database schema...');
    const push = spawn('npm', ['run', 'db:push'], { stdio: 'inherit' });
    push.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Database schema pushed successfully');
        resolve();
      } else {
        console.log('❌ Failed to push database schema');
        reject(new Error('Schema push failed'));
      }
    });
  });
}

async function main() {
  try {
    const hasPostgreSQL = await checkPostgreSQL();
    
    if (!hasPostgreSQL) {
      console.log('❌ PostgreSQL not found. Please install PostgreSQL first.');
      console.log('Download from: https://www.postgresql.org/download/');
      process.exit(1);
    }
    
    console.log('✅ PostgreSQL found');
    
    await createDatabase();
    await pushSchema();
    
    console.log('\n🎉 Database setup completed!');
    console.log('You can now run: npm run dev');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

main();
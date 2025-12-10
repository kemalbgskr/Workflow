const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Setting up BNI SDLC Approvals Application...');

try {
  // Check if node_modules exists
  if (!fs.existsSync('node_modules')) {
    console.log('📦 Installing dependencies...');
    execSync('npm install', { stdio: 'inherit' });
  }

  // Check if database exists, if not create it
  if (!fs.existsSync('database.db')) {
    console.log('🗄️ Setting up database...');
    execSync('npm run setup', { stdio: 'inherit' });
  }

  // Seed database
  console.log('🌱 Seeding database...');
  try {
    execSync('npm run seed', { stdio: 'inherit' });
  } catch (error) {
    console.log('⚠️ Seeding may have failed, but continuing...');
  }

  console.log('✅ Setup complete! Starting application...');
  console.log('🌐 Application will be available at: http://localhost:5000');
  console.log('');

  // Start the application
  const server = spawn('npm', ['run', 'dev'], {
    stdio: 'inherit',
    shell: true
  });

  server.on('error', (error) => {
    console.error('❌ Failed to start server:', error);
  });

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down...');
    server.kill('SIGINT');
    process.exit(0);
  });

} catch (error) {
  console.error('❌ Setup failed:', error.message);
  process.exit(1);
}
const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting BNI SDLC Approvals Application...');

// Set environment variables
process.env.NODE_ENV = 'development';
process.env.PORT = '5000';

// Start the server
const server = spawn('npm', ['run', 'dev'], {
  stdio: 'inherit',
  shell: true,
  cwd: __dirname
});

server.on('error', (error) => {
  console.error('❌ Failed to start server:', error);
});

server.on('close', (code) => {
  console.log(`Server process exited with code ${code}`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down gracefully...');
  server.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down gracefully...');
  server.kill('SIGTERM');
  process.exit(0);
});
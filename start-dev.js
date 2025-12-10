import { spawn } from 'child_process';

process.env.NODE_ENV = 'development';

const child = spawn('npx', ['tsx', 'server/index.ts'], {
  stdio: 'inherit',
  env: { ...process.env, NODE_ENV: 'development' }
});

child.on('exit', (code) => {
  process.exit(code);
});
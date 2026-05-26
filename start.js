const { spawn } = require('child_process');
const path = require('path');

console.log('Starting CampusRide Services...');

// Helper to log with colors
const log = (prefix, data, color) => {
  const lines = data.toString().trim().split('\n');
  lines.forEach(line => {
    if (line) {
      console.log(`\x1b[${color}m[${prefix}]\x1b[0m ${line}`);
    }
  });
};

// Start Express Server
const serverPath = path.join(__dirname, 'server');
const serverProcess = spawn('node', ['server.js'], { cwd: serverPath, shell: true });

serverProcess.stdout.on('data', (data) => log('Server', data, '32')); // Green
serverProcess.stderr.on('data', (data) => log('Server-Err', data, '31')); // Red

// Start Vite Client
const clientPath = path.join(__dirname, 'client');
const clientProcess = spawn('npm', ['run', 'dev'], { cwd: clientPath, shell: true });

clientProcess.stdout.on('data', (data) => log('Client', data, '36')); // Cyan
clientProcess.stderr.on('data', (data) => log('Client-Err', data, '33')); // Yellow

process.on('SIGINT', () => {
  console.log('Stopping all processes...');
  serverProcess.kill();
  clientProcess.kill();
  process.exit();
});

serverProcess.on('close', (code) => {
  console.log(`Server process exited with code ${code}`);
  clientProcess.kill();
});

clientProcess.on('close', (code) => {
  console.log(`Client process exited with code ${code}`);
  serverProcess.kill();
});

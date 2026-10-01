import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.resolve(__dirname, '..');
const backendDir = path.join(rootDir, 'smart_equal_water_distribution', 'backend');

// Detect Python executable
const candidatePythonPaths = [
  path.join(backendDir, 'venv', 'Scripts', 'python.exe'),
  path.join(rootDir, '.venv', 'Scripts', 'python.exe'),
  path.join(backendDir, 'venv', 'bin', 'python'),
  path.join(rootDir, '.venv', 'bin', 'python'),
  'python',
  'python3'
];

let pythonExe = 'python';
for (const p of candidatePythonPaths) {
  if (p === 'python' || p === 'python3') {
    pythonExe = p;
    break;
  }
  if (fs.existsSync(p)) {
    pythonExe = p;
    break;
  }
}

console.log('============================================================');
console.log('  AquaFair Django REST Backend Server Launcher              ');
console.log('============================================================');
console.log(`📂 Backend Directory : ${backendDir}`);
console.log(`🐍 Python Executable  : ${pythonExe}`);
console.log('🌐 Server Endpoint   : http://127.0.0.1:8000/api/dashboard/');
console.log('============================================================\n');

const child = spawn(pythonExe, ['manage.py', 'runserver', '127.0.0.1:8000'], {
  cwd: backendDir,
  stdio: 'inherit',
  shell: true
});

child.on('error', (err) => {
  console.error('❌ Failed to start Python Django server:', err.message);
  console.log('\n💡 Tip: You can also start the system using start_aquafair.bat in the root folder.');
});

child.on('close', (code) => {
  console.log(`Backend process exited with code ${code}`);
});

process.on('SIGINT', () => {
  child.kill('SIGINT');
  process.exit(0);
});

import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import process from 'node:process';
import { resolve } from 'node:path';

const python = resolve(process.platform === 'win32' ? '.venv\\Scripts\\python.exe' : '.venv/bin/python');
if (!existsSync(python)) {
  console.error('Python environment is missing. Run install.bat or create .venv first.');
  process.exit(1);
}
const result = spawnSync(python, ['backend/manage.py', ...process.argv.slice(2)], {
  stdio: 'inherit', env: process.env,
});
process.exit(result.status ?? 1);

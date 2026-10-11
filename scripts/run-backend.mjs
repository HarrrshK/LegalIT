import { existsSync } from 'node:fs';
import { spawn, spawnSync } from 'node:child_process';
import process from 'node:process';
import { resolve } from 'node:path';

const python = resolve(process.platform === 'win32' ? '.venv\\Scripts\\python.exe' : '.venv/bin/python');
if (!existsSync(python)) {
  console.error('Python environment is missing. Run install.bat on Windows or create .venv and install backend/requirements.txt.');
  process.exit(1);
}

const alembic = spawnSync(python, ['-m', 'alembic', '-c', 'alembic.ini', 'upgrade', 'head'], {
  cwd: 'backend', stdio: 'inherit', env: process.env,
});
if (alembic.status !== 0) process.exit(alembic.status ?? 1);

const server = spawn(python, ['-m', 'uvicorn', 'app.main:app', '--app-dir', 'backend', '--host', '127.0.0.1', '--port', '8000', '--reload'], {
  stdio: 'inherit', env: process.env,
});
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.kill(signal));
server.on('exit', code => process.exit(code ?? 0));

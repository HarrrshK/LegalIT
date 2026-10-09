import { randomBytes, randomUUID, scrypt as scryptCallback } from 'node:crypto';
import { promisify } from 'node:util';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scrypt = promisify(scryptCallback);
const root = path.dirname(fileURLToPath(import.meta.url));
const dataDir = process.env.DATA_DIR || path.join(root, '..', 'data');
const dbFile = path.join(dataDir, 'store.json');

function option(name) {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function hasFlag(name) {
  return process.argv.includes(`--${name}`);
}

async function loadStore() {
  try {
    const saved = JSON.parse(await readFile(dbFile, 'utf8'));
    return { users: Array.isArray(saved.users) ? saved.users : [], audit: Array.isArray(saved.audit) ? saved.audit : [], cases: Array.isArray(saved.cases) ? saved.cases : [] };
  } catch (error) {
    if (error.code === 'ENOENT') return { users: [], audit: [], cases: [] };
    throw error;
  }
}

async function saveStore(store) {
  await mkdir(dataDir, { recursive: true, mode: 0o700 });
  await writeFile(dbFile, JSON.stringify(store, null, 2), { mode: 0o600 });
}

async function passwordHash(password) {
  const salt = randomBytes(16).toString('hex');
  const hash = await scrypt(password, salt, 64);
  return `${salt}:${Buffer.from(hash).toString('hex')}`;
}

function newUserId(role) {
  return `${role === 'lawyer' ? 'LAW' : 'CLT'}-${randomBytes(5).toString('hex').toUpperCase()}`;
}

async function createAccount() {
  const role = option('role');
  const fullName = String(option('name') || '').trim();
  const email = String(option('email') || '').trim().toLowerCase();
  const suppliedPassword = option('password');
  const temporaryPassword = suppliedPassword || randomBytes(12).toString('base64url');

  if (!['client', 'lawyer'].includes(role)) throw new Error('Use --role client or --role lawyer.');
  if (fullName.length < 2 || fullName.length > 120) throw new Error('Use --name with a name between 2 and 120 characters.');
  if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error('Use --email with a valid email address.');
  if (temporaryPassword.length < 12 || temporaryPassword.length > 256) throw new Error('A supplied --password must contain 12 to 256 characters.');

  const store = await loadStore();
  if (store.users.some(user => user.email === email)) throw new Error('An account already uses that email address.');

  const user = {
    id: randomUUID(),
    userId: newUserId(role),
    fullName,
    email,
    passwordHash: await passwordHash(temporaryPassword),
    role,
    status: 'active',
    mustChangePassword: true,
    createdAt: new Date().toISOString(),
  };
  store.users.push(user);
  store.audit.unshift({ id: randomUUID(), actorUserId: 'CLI', action: 'ACCOUNT_CREATED', targetUserId: user.userId, details: { role }, createdAt: new Date().toISOString() });
  await saveStore(store);

  console.log('Account created');
  console.log(`Role: ${role}`);
  console.log(`User ID: ${user.userId}`);
  console.log(`Temporary password: ${temporaryPassword}`);
  console.log('The user must change this password after signing in.');
}

async function resetData() {
  if (!hasFlag('yes')) throw new Error('This erases every local account and audit event. Run again with --yes to confirm.');
  await saveStore({ users: [], audit: [], cases: [] });
  console.log(`All local LegalIt account, case, and audit data was erased from ${dbFile}`);
}

const command = process.argv[2];
try {
  if (command === 'create') await createAccount();
  else if (command === 'reset') await resetData();
  else throw new Error('Use either the create or reset command.');
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}

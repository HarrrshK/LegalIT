import { createServer } from 'node:http';
import { randomBytes, randomUUID, scrypt as scryptCallback, timingSafeEqual, createHash } from 'node:crypto';
import { promisify } from 'node:util';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scrypt = promisify(scryptCallback);
const root = path.dirname(fileURLToPath(import.meta.url));
const dataDir = process.env.DATA_DIR || path.join(root, '..', 'data');
const dbFile = path.join(dataDir, 'store.json');
const sessions = new Map();
const sessionDurationMs = 1000 * 60 * 60 * 12;
const port = Number(process.env.API_PORT || 3001);
let store = { users: [], audit: [] };

async function persist() {
  await mkdir(dataDir, { recursive: true, mode: 0o700 });
  await writeFile(dbFile, JSON.stringify(store, null, 2), { mode: 0o600 });
}

function publicUser(user) {
  return { id: user.id, userId: user.userId, fullName: user.fullName, email: user.email, role: user.role, status: user.status, mustChangePassword: Boolean(user.mustChangePassword) };
}

function cookieMap(req) {
  return Object.fromEntries((req.headers.cookie || '').split(';').map(part => part.trim()).filter(Boolean).map(part => {
    const split = part.indexOf('='); return [part.slice(0, split), decodeURIComponent(part.slice(split + 1))];
  }));
}

function send(res, status, body, headers = {}) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...headers });
  res.end(JSON.stringify(body));
}

async function bodyJson(req) {
  let body = ''; for await (const chunk of req) { body += chunk; if (body.length > 64 * 1024) throw new Error('Request is too large.'); }
  return body ? JSON.parse(body) : {};
}

async function passwordHash(password, salt = randomBytes(16).toString('hex')) {
  const hash = await scrypt(password, salt, 64);
  return `${salt}:${Buffer.from(hash).toString('hex')}`;
}

async function passwordMatches(password, stored) {
  const [salt, expectedHex] = stored.split(':');
  const actual = Buffer.from(await passwordHash(password, salt).then(value => value.split(':')[1]), 'hex');
  const expected = Buffer.from(expectedHex, 'hex');
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function normalizeEmail(value) { return String(value || '').trim().toLowerCase(); }
function newUserId(role) { return `${role === 'admin' ? 'ADM' : role === 'lawyer' ? 'LAW' : 'CLT'}-${randomBytes(5).toString('hex').toUpperCase()}`; }
function audit(actor, action, targetUserId, details = {}) { store.audit.unshift({ id: randomUUID(), actorUserId: actor?.userId || 'SYSTEM', action, targetUserId: targetUserId || null, details, createdAt: new Date().toISOString() }); store.audit = store.audit.slice(0, 500); }

async function bootstrapAdmin() {
  if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) return;
  const email = normalizeEmail(process.env.ADMIN_EMAIL);
  if (store.users.some(user => user.email === email)) return;
  if (process.env.ADMIN_PASSWORD.length < 16) throw new Error('ADMIN_PASSWORD must contain at least 16 characters.');
  const user = { id: randomUUID(), userId: process.env.ADMIN_USER_ID || newUserId('admin'), fullName: process.env.ADMIN_NAME || 'Platform Administrator', email, passwordHash: await passwordHash(process.env.ADMIN_PASSWORD), role: 'admin', status: 'active', createdAt: new Date().toISOString() };
  store.users.push(user); audit(null, 'ADMIN_BOOTSTRAPPED', user.userId); await persist();
}

function authenticated(req) {
  const token = cookieMap(req).nyaya_session;
  const session = token && sessions.get(token);
  if (!session || session.expiresAt < Date.now()) { if (token) sessions.delete(token); return null; }
  const user = store.users.find(item => item.id === session.userId && item.status === 'active');
  return user || null;
}

function csrfOkay(req) {
  const origin = req.headers.origin;
  if (!origin) return true;
  return new URL(origin).host === req.headers.host;
}

async function handle(req, res) {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  if (req.method === 'OPTIONS') return send(res, 204, {});
  if (req.method !== 'GET' && !csrfOkay(req)) return send(res, 403, { error: 'Request origin is not allowed.' });

  if (req.method === 'GET' && url.pathname === '/api/health') return send(res, 200, { status: 'ok' });
  if (req.method === 'POST' && url.pathname === '/api/auth/register') {
    let data; try { data = await bodyJson(req); } catch { return send(res, 400, { error: 'Invalid request.' }); }
    const fullName = String(data.fullName || '').trim(); const email = normalizeEmail(data.email); const password = String(data.password || ''); const role = data.role;
    if (fullName.length < 2 || fullName.length > 120 || !/^\S+@\S+\.\S+$/.test(email) || password.length < 10 || !['client', 'lawyer'].includes(role)) return send(res, 400, { error: 'Enter a name, valid email, client or professional account type, and a password of at least 10 characters.' });
    if (store.users.some(user => user.email === email)) return send(res, 409, { error: 'An account already uses that email address.' });
    const user = { id: randomUUID(), userId: newUserId(role), fullName, email, passwordHash: await passwordHash(password), role, status: role === 'lawyer' ? 'pending' : 'active', createdAt: new Date().toISOString() };
    store.users.push(user); audit(null, 'SELF_REGISTERED', user.userId, { role }); await persist();
    if (user.status !== 'active') return send(res, 201, { pending: true });
    const token = randomBytes(32).toString('base64url'); sessions.set(token, { userId: user.id, expiresAt: Date.now() + sessionDurationMs });
    return send(res, 201, { user: publicUser(user) }, { 'Set-Cookie': `nyaya_session=${encodeURIComponent(token)}; HttpOnly; SameSite=Strict; Path=/; Max-Age=43200${process.env.NODE_ENV === 'production' ? '; Secure' : ''}` });
  }
  if (req.method === 'POST' && url.pathname === '/api/auth/login') {
    let data; try { data = await bodyJson(req); } catch { return send(res, 400, { error: 'Invalid request.' }); }
    const login = String(data.email || '').trim().toLowerCase(); const password = String(data.password || '');
    const user = store.users.find(item => item.email === login || item.userId.toLowerCase() === login);
    if (!user || !(await passwordMatches(password, user.passwordHash))) return send(res, 401, { error: 'Incorrect user ID, email, or password.' });
    if (user.status === 'pending') return send(res, 403, { error: 'Your account is awaiting administrator approval.' });
    if (user.status !== 'active') return send(res, 403, { error: 'This account is currently suspended.' });
    const token = randomBytes(32).toString('base64url'); sessions.set(token, { userId: user.id, expiresAt: Date.now() + sessionDurationMs }); audit(user, 'SIGNED_IN', user.userId); await persist();
    return send(res, 200, { user: publicUser(user) }, { 'Set-Cookie': `nyaya_session=${encodeURIComponent(token)}; HttpOnly; SameSite=Strict; Path=/; Max-Age=43200${process.env.NODE_ENV === 'production' ? '; Secure' : ''}` });
  }
  if (req.method === 'GET' && url.pathname === '/api/auth/me') { const user = authenticated(req); return user ? send(res, 200, { user: publicUser(user) }) : send(res, 401, { error: 'Not signed in.' }); }
  if (req.method === 'PUT' && url.pathname === '/api/auth/password') {
    const user = authenticated(req); if (!user) return send(res, 401, { error: 'Sign in required.' });
    let data; try { data = await bodyJson(req); } catch { return send(res, 400, { error: 'Invalid request.' }); }
    const password = String(data.password || ''); if (password.length < 12 || password.length > 256) return send(res, 400, { error: 'Choose a password between 12 and 256 characters.' });
    user.passwordHash = await passwordHash(password); user.mustChangePassword = false; audit(user, 'PASSWORD_CHANGED', user.userId); await persist(); return send(res, 200, { user: publicUser(user) });
  }
  if (req.method === 'POST' && url.pathname === '/api/auth/logout') { const token = cookieMap(req).nyaya_session; const session = token && sessions.get(token); if (session) { const user = store.users.find(item => item.id === session.userId); audit(user, 'SIGNED_OUT', user?.userId); await persist(); } if (token) sessions.delete(token); return send(res, 200, { ok: true }, { 'Set-Cookie': 'nyaya_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0' }); }

  if (url.pathname.startsWith('/api/admin/')) {
    const actor = authenticated(req); if (!actor) return send(res, 401, { error: 'Sign in required.' }); if (actor.role !== 'admin') return send(res, 403, { error: 'Administrator access required.' });
    if (req.method === 'GET' && url.pathname === '/api/admin/overview') return send(res, 200, { users: store.users.map(publicUser), audit: store.audit });
    if (req.method === 'POST' && url.pathname === '/api/admin/users') {
      let data; try { data = await bodyJson(req); } catch { return send(res, 400, { error: 'Invalid request.' }); }
      const fullName = String(data.fullName || '').trim(); const email = normalizeEmail(data.email); const role = data.role;
      if (fullName.length < 2 || fullName.length > 120 || !/^\S+@\S+\.\S+$/.test(email) || !['client', 'lawyer'].includes(role)) return send(res, 400, { error: 'Enter a valid name, email address, and account type.' });
      if (store.users.some(user => user.email === email)) return send(res, 409, { error: 'An account already uses that email address.' });
      const temporaryPassword = randomBytes(12).toString('base64url');
      const user = { id: randomUUID(), userId: newUserId(role), fullName, email, passwordHash: await passwordHash(temporaryPassword), role, status: 'active', mustChangePassword: true, createdAt: new Date().toISOString() };
      store.users.push(user); audit(actor, 'ACCOUNT_CREATED', user.userId, { role }); await persist(); return send(res, 201, { user: publicUser(user), temporaryPassword });
    }
    const statusMatch = url.pathname.match(/^\/api\/admin\/users\/([^/]+)\/status$/);
    if (req.method === 'PATCH' && statusMatch) {
      const target = store.users.find(item => item.id === decodeURIComponent(statusMatch[1])); if (!target || target.role === 'admin') return send(res, 404, { error: 'Account not found.' });
      let data; try { data = await bodyJson(req); } catch { return send(res, 400, { error: 'Invalid request.' }); }
      if (!['active', 'suspended'].includes(data.status)) return send(res, 400, { error: 'Invalid account status.' });
      target.status = data.status; audit(actor, data.status === 'active' ? 'ACCOUNT_RESTORED' : 'ACCOUNT_SUSPENDED', target.userId); await persist(); return send(res, 200, { user: publicUser(target) });
    }
  }

  if (req.method === 'POST' && url.pathname === '/api/ai/chat') {
    const user = authenticated(req); if (!user) return send(res, 401, { error: 'Sign in required.' });
    if (!process.env.GROQ_API_KEY) return send(res, 503, { error: 'AI assistant is not configured yet. Add GROQ_API_KEY to the server environment.' });
    let data; try { data = await bodyJson(req); } catch { return send(res, 400, { error: 'Invalid request.' }); }
    const query = String(data.message || '').trim(); if (!query || query.length > 6000) return send(res, 400, { error: 'Enter a question under 6,000 characters.' });
    try {
      const upstream = await fetch('https://api.groq.com/openai/v1/chat/completions', { method: 'POST', headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile', temperature: 0.2, max_tokens: 1200, messages: [{ role: 'system', content: 'You are a careful legal information assistant for India. Explain general legal concepts in plain English. Never invent statutes, sections, case names, quotations, or citations; if uncertain, say so and ask the user to verify with a licensed advocate. Do not claim to be a lawyer or provide definitive case-specific advice. Mention that laws can change and distinguish general information from advice.' }, { role: 'user', content: query }] }) });
      const responseData = await upstream.json(); if (!upstream.ok) return send(res, 502, { error: 'The AI service could not answer just now.' });
      audit(user, 'AI_QUERY', null, { queryHash: createHash('sha256').update(query).digest('hex') }); await persist();
      return send(res, 200, { answer: responseData.choices?.[0]?.message?.content || 'No response was returned.' });
    } catch { return send(res, 502, { error: 'Could not reach the AI service.' }); }
  }
  return send(res, 404, { error: 'Not found.' });
}

try { const saved = await readFile(dbFile, 'utf8'); store = { ...store, ...JSON.parse(saved) }; } catch (error) { if (error.code !== 'ENOENT') throw error; }
await bootstrapAdmin();
createServer((req, res) => { handle(req, res).catch(error => { console.error('API request failed:', error); if (!res.headersSent) send(res, 500, { error: 'Server error.' }); else res.destroy(); }); }).listen(port, '0.0.0.0', () => console.log(`NyayaFlow API listening on :${port}`));

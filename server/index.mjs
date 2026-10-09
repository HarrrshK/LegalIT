import { createServer } from 'node:http';
import { randomBytes, randomUUID, scrypt as scryptCallback, timingSafeEqual, createHash } from 'node:crypto';
import { promisify } from 'node:util';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scrypt = promisify(scryptCallback);
const root = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(root, '..');

async function loadEnvironment() {
  try {
    const contents = await readFile(path.join(projectRoot, '.env'), 'utf8');
    for (const line of contents.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const separator = trimmed.indexOf('=');
      if (separator < 1) continue;
      const name = trimmed.slice(0, separator).trim();
      let value = trimmed.slice(separator + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
      if (!(name in process.env)) process.env[name] = value;
    }
  } catch (error) { if (error.code !== 'ENOENT') throw error; }
}

await loadEnvironment();
const dataDir = process.env.DATA_DIR || path.join(root, '..', 'data');
const dbFile = path.join(dataDir, 'store.json');
const sessions = new Map();
const sessionDurationMs = 1000 * 60 * 60 * 12;
const port = Number(process.env.API_PORT || 3001);
let store = { users: [], audit: [], cases: [] };

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
  const token = cookieMap(req).legalit_session;
  const session = token && sessions.get(token);
  if (!session || session.expiresAt < Date.now()) { if (token) sessions.delete(token); return null; }
  const user = store.users.find(item => item.id === session.userId && item.status === 'active');
  return user || null;
}

function csrfOkay(req) {
  const origin = req.headers.origin;
  if (!origin) return true;
  let parsedOrigin;
  try { parsedOrigin = new URL(origin); } catch { return false; }

  const allowedOrigins = String(process.env.APP_ORIGIN || '')
    .split(',')
    .map(value => value.trim())
    .filter(Boolean);
  if (allowedOrigins.includes(parsedOrigin.origin)) return true;
  if (parsedOrigin.host === req.headers.host) return true;

  // Vite and the API use different ports during local development.
  const rawRequestHost = String(req.headers.host || '');
  const requestHost = rawRequestHost.startsWith('[')
    ? rawRequestHost.slice(1, rawRequestHost.indexOf(']'))
    : rawRequestHost.split(':')[0];
  const loopbackHosts = new Set(['localhost', '127.0.0.1', '::1']);
  return process.env.NODE_ENV !== 'production'
    && loopbackHosts.has(parsedOrigin.hostname)
    && loopbackHosts.has(requestHost);
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
    const user = { id: randomUUID(), userId: newUserId(role), fullName, email, passwordHash: await passwordHash(password), role, status: 'active', createdAt: new Date().toISOString() };
    store.users.push(user); audit(null, 'SELF_REGISTERED', user.userId, { role }); await persist();
    if (user.status !== 'active') return send(res, 201, { pending: true });
    const token = randomBytes(32).toString('base64url'); sessions.set(token, { userId: user.id, expiresAt: Date.now() + sessionDurationMs });
    return send(res, 201, { user: publicUser(user) }, { 'Set-Cookie': `legalit_session=${encodeURIComponent(token)}; HttpOnly; SameSite=Strict; Path=/; Max-Age=43200${process.env.NODE_ENV === 'production' ? '; Secure' : ''}` });
  }
  if (req.method === 'POST' && url.pathname === '/api/auth/login') {
    let data; try { data = await bodyJson(req); } catch { return send(res, 400, { error: 'Invalid request.' }); }
    const login = String(data.email || '').trim().toLowerCase(); const password = String(data.password || '');
    const user = store.users.find(item => item.email === login || item.userId.toLowerCase() === login);
    if (!user || !(await passwordMatches(password, user.passwordHash))) return send(res, 401, { error: 'Incorrect user ID, email, or password.' });
    if (user.status === 'pending') return send(res, 403, { error: 'Your account is awaiting administrator approval.' });
    if (user.status !== 'active') return send(res, 403, { error: 'This account is currently suspended.' });
    const token = randomBytes(32).toString('base64url'); sessions.set(token, { userId: user.id, expiresAt: Date.now() + sessionDurationMs }); audit(user, 'SIGNED_IN', user.userId); await persist();
    return send(res, 200, { user: publicUser(user) }, { 'Set-Cookie': `legalit_session=${encodeURIComponent(token)}; HttpOnly; SameSite=Strict; Path=/; Max-Age=43200${process.env.NODE_ENV === 'production' ? '; Secure' : ''}` });
  }
  if (req.method === 'GET' && url.pathname === '/api/auth/me') { const user = authenticated(req); return user ? send(res, 200, { user: publicUser(user) }) : send(res, 401, { error: 'Not signed in.' }); }
  if (req.method === 'PUT' && url.pathname === '/api/auth/password') {
    const user = authenticated(req); if (!user) return send(res, 401, { error: 'Sign in required.' });
    let data; try { data = await bodyJson(req); } catch { return send(res, 400, { error: 'Invalid request.' }); }
    const password = String(data.password || ''); if (password.length < 12 || password.length > 256) return send(res, 400, { error: 'Choose a password between 12 and 256 characters.' });
    user.passwordHash = await passwordHash(password); user.mustChangePassword = false; audit(user, 'PASSWORD_CHANGED', user.userId); await persist(); return send(res, 200, { user: publicUser(user) });
  }
  if (req.method === 'POST' && url.pathname === '/api/auth/logout') { const token = cookieMap(req).legalit_session; const session = token && sessions.get(token); if (session) { const user = store.users.find(item => item.id === session.userId); audit(user, 'SIGNED_OUT', user?.userId); await persist(); } if (token) sessions.delete(token); return send(res, 200, { ok: true }, { 'Set-Cookie': 'legalit_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0' }); }

  if (req.method === 'GET' && url.pathname === '/api/workspace') {
    const user = authenticated(req); if (!user) return send(res, 401, { error: 'Sign in required.' });
    const cases = store.cases.filter(item => user.role === 'admin' || (user.role === 'lawyer' ? item.lawyerUserId === user.id : item.clientUserId === user.id));
    const lawyers = store.users.filter(item => item.role === 'lawyer' && item.status === 'active').map(item => ({ id: item.id, name: item.fullName, title: 'Legal professional', barRegistration: item.barRegistration || '', experienceYears: 0, courtPractice: [], specializations: [], rating: 0, reviewCount: 0, location: '', distanceKm: 0, consultationFee: 0, photoUrl: '', phone: '', email: item.email, bio: '' }));
    return send(res, 200, { cases, lawyers });
  }
  if (req.method === 'POST' && url.pathname === '/api/cases') {
    const client = authenticated(req); if (!client) return send(res, 401, { error: 'Sign in required.' });
    if (client.role !== 'client') return send(res, 403, { error: 'Only client accounts can open a new case.' });
    let data; try { data = await bodyJson(req); } catch { return send(res, 400, { error: 'Invalid request.' }); }
    const lawyer = store.users.find(item => item.id === data.lawyerUserId && item.role === 'lawyer' && item.status === 'active');
    const title = String(data.title || '').trim(); const courtName = String(data.courtName || '').trim(); const summary = String(data.summary || '').trim();
    if (!lawyer || title.length < 3 || summary.length < 20) return send(res, 400, { error: 'Enter a case title and issue summary, then select a legal professional.' });
    const assignedLawyer = { id: lawyer.id, name: lawyer.fullName, title: 'Legal professional', barRegistration: lawyer.barRegistration || '', experienceYears: 0, courtPractice: [], specializations: [], rating: 0, reviewCount: 0, location: '', distanceKm: 0, consultationFee: 0, photoUrl: '', phone: '', email: lawyer.email, bio: '' };
    const item = { id: `CASE-${randomBytes(5).toString('hex').toUpperCase()}`, clientUserId: client.id, lawyerUserId: lawyer.id, cnrNumber: '', title, category: ['Property & Real Estate', 'Consumer Protection', 'Civil Dispute', 'Employment & Contract', 'Family Law', 'Intellectual Property'].includes(data.category) ? data.category : 'Civil Dispute', status: 'Pending Review', progressPercent: 0, filingDate: '', courtName: courtName || 'Court not assigned', bench: '', judgeName: '', opposingParty: String(data.opposingParty || '').trim(), assignedLawyer, summary, timeline: [{ id: randomUUID(), stage: 'Client intake submitted', date: new Date().toISOString().slice(0, 10), status: 'current', description: 'The client submitted the matter for review by the selected legal professional.' }], documents: [], hearings: [], createdAt: new Date().toISOString() };
    store.cases.push(item); audit(client, 'CASE_INTAKE_CREATED', client.userId, { caseId: item.id, lawyerUserId: lawyer.userId }); await persist(); return send(res, 201, { case: item });
  }
  const decisionMatch = url.pathname.match(/^\/api\/cases\/([^/]+)\/decision$/);
  if (req.method === 'PATCH' && decisionMatch) {
    const lawyer = authenticated(req); if (!lawyer) return send(res, 401, { error: 'Sign in required.' });
    if (lawyer.role !== 'lawyer') return send(res, 403, { error: 'Only the selected legal professional can decide a case.' });
    const item = store.cases.find(candidate => candidate.id === decodeURIComponent(decisionMatch[1]) && candidate.lawyerUserId === lawyer.id);
    if (!item) return send(res, 404, { error: 'Assigned case not found.' });
    if (item.status !== 'Pending Review') return send(res, 409, { error: 'This case has already been decided.' });
    let data; try { data = await bodyJson(req); } catch { return send(res, 400, { error: 'Invalid request.' }); }
    if (!['accepted', 'rejected'].includes(data.decision)) return send(res, 400, { error: 'Choose accept or reject.' });
    item.status = data.decision === 'accepted' ? 'Accepted' : 'Rejected';
    item.timeline.push({ id: randomUUID(), stage: data.decision === 'accepted' ? 'Legal professional accepted case' : 'Legal professional declined case', date: new Date().toISOString().slice(0, 10), status: data.decision === 'accepted' ? 'current' : 'completed', description: String(data.note || '').trim() || (data.decision === 'accepted' ? 'The selected legal professional accepted the matter.' : 'The selected legal professional declined the matter.') });
    audit(lawyer, data.decision === 'accepted' ? 'CASE_ACCEPTED' : 'CASE_REJECTED', item.clientUserId, { caseId: item.id }); await persist(); return send(res, 200, { case: item });
  }
  if (req.method === 'POST' && url.pathname === '/api/ai/case-intake') {
    const client = authenticated(req); if (!client) return send(res, 401, { error: 'Sign in required.' });
    if (client.role !== 'client') return send(res, 403, { error: 'Only client accounts can create an intake draft.' });
    let data; try { data = await bodyJson(req); } catch { return send(res, 400, { error: 'Invalid request.' }); }
    const description = String(data.description || '').trim();
    if (description.length < 30 || description.length > 6000) return send(res, 400, { error: 'Describe the issue using 30 to 6,000 characters.' });
    if (!process.env.GROQ_API_KEY) return send(res, 503, { error: 'AI case drafting requires GROQ_API_KEY. You can still fill the case fields manually.' });
    try {
      const upstream = await fetch('https://api.groq.com/openai/v1/chat/completions', { method: 'POST', headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile', temperature: 0.1, max_tokens: 700, response_format: { type: 'json_object' }, messages: [{ role: 'system', content: 'Convert an Indian legal client intake into neutral structured JSON. Return only an object with title, category, opposingParty, courtName, and summary. category must be exactly one of: Property & Real Estate, Consumer Protection, Civil Dispute, Employment & Contract, Family Law, Intellectual Property. Do not invent names, courts, dates, claims, statutes, or facts. Use an empty string when unknown. The summary must clearly distinguish what the client reports from verified facts.' }, { role: 'user', content: description }] }) });
      const responseData = await upstream.json(); if (!upstream.ok) return send(res, 502, { error: 'The AI service could not create a draft just now.' });
      const draft = JSON.parse(responseData.choices?.[0]?.message?.content || '{}');
      audit(client, 'AI_CASE_INTAKE', client.userId, { descriptionHash: createHash('sha256').update(description).digest('hex') }); await persist();
      return send(res, 200, { draft: { title: String(draft.title || ''), category: String(draft.category || 'Civil Dispute'), opposingParty: String(draft.opposingParty || ''), courtName: String(draft.courtName || ''), summary: String(draft.summary || description) } });
    } catch { return send(res, 502, { error: 'The AI draft could not be processed. You can fill the fields manually.' }); }
  }

  if (url.pathname.startsWith('/api/admin/')) {
    const actor = authenticated(req); if (!actor) return send(res, 401, { error: 'Sign in required.' }); if (actor.role !== 'admin') return send(res, 403, { error: 'Administrator access required.' });
    if (req.method === 'GET' && url.pathname === '/api/admin/overview') return send(res, 200, { users: store.users.map(publicUser), audit: store.audit, cases: store.cases });
    if (req.method === 'POST' && url.pathname === '/api/admin/users') {
      let data; try { data = await bodyJson(req); } catch { return send(res, 400, { error: 'Invalid request.' }); }
      const fullName = String(data.fullName || '').trim(); const email = normalizeEmail(data.email); const role = data.role;
      if (fullName.length < 2 || fullName.length > 120 || !/^\S+@\S+\.\S+$/.test(email) || !['client', 'lawyer'].includes(role)) return send(res, 400, { error: 'Enter a valid name, email address, and account type.' });
      if (store.users.some(user => user.email === email)) return send(res, 409, { error: 'An account already uses that email address.' });
      const temporaryPassword = randomBytes(12).toString('base64url');
      const user = { id: randomUUID(), userId: newUserId(role), fullName, email, passwordHash: await passwordHash(temporaryPassword), role, status: 'active', mustChangePassword: true, createdAt: new Date().toISOString() };
      store.users.push(user); audit(actor, 'ACCOUNT_CREATED', user.userId, { role }); await persist(); return send(res, 201, { user: publicUser(user), temporaryPassword });
    }
    if (req.method === 'POST' && url.pathname === '/api/admin/cases') {
      let data; try { data = await bodyJson(req); } catch { return send(res, 400, { error: 'Invalid request.' }); }
      const client = store.users.find(item => item.id === data.clientUserId && item.role === 'client' && item.status === 'active');
      const lawyer = store.users.find(item => item.id === data.lawyerUserId && item.role === 'lawyer' && item.status === 'active');
      const title = String(data.title || '').trim(); const cnrNumber = String(data.cnrNumber || '').trim(); const courtName = String(data.courtName || '').trim();
      if (!client || !lawyer || title.length < 3 || !cnrNumber || !courtName) return send(res, 400, { error: 'Select an active client and legal professional, then enter a title, CNR number, and court.' });
      const assignedLawyer = { id: lawyer.id, name: lawyer.fullName, title: 'Legal professional', barRegistration: lawyer.barRegistration || '', experienceYears: 0, courtPractice: [], specializations: [], rating: 0, reviewCount: 0, location: '', distanceKm: 0, consultationFee: 0, photoUrl: '', phone: '', email: lawyer.email, bio: '' };
      const item = { id: `CASE-${randomBytes(5).toString('hex').toUpperCase()}`, clientUserId: client.id, lawyerUserId: lawyer.id, cnrNumber, title, category: data.category || 'Civil Dispute', status: 'Active', progressPercent: 0, filingDate: String(data.filingDate || ''), courtName, bench: '', judgeName: '', opposingParty: String(data.opposingParty || '').trim(), assignedLawyer, summary: String(data.summary || '').trim(), timeline: [], documents: [], hearings: [], createdAt: new Date().toISOString() };
      store.cases.push(item); audit(actor, 'CASE_CREATED', client.userId, { caseId: item.id }); await persist(); return send(res, 201, { case: item });
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
createServer((req, res) => { handle(req, res).catch(error => { console.error('API request failed:', error); if (!res.headersSent) send(res, 500, { error: 'Server error.' }); else res.destroy(); }); }).listen(port, '0.0.0.0', () => console.log(`LegalIt API listening on :${port}`));

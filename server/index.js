// server/index.js
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import Stripe from 'stripe';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import nodemailer from 'nodemailer';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

/* =======================
 * Runtime & Paths
 * ======================= */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* =======================
 * App & Config de base
 * ======================= */
const app = express();
const PORT = process.env.PORT || 4242;
const isProd = process.env.NODE_ENV === 'production';

app.set('trust proxy', 1); // requis pour secure cookies derrière proxy

/* =======================
 * CORS (⚠️ pas de slash final dans Origin)
 * ======================= */
const allowed = [
  'http://localhost:5173',
  'https://korelia-hazel.vercel.app', // <— remplace/complète avec ton sous-domaine Vercel
  'https://korelia.vercel.app',       // (optionnel) domaine stable Vercel
];

const corsOptions = {
  origin(origin, cb) {
    if (!origin) return cb(null, true); // autorise Postman/cURL
    const ok =
      allowed.includes(origin) ||
      /^https:\/\/.*\.vercel\.app$/.test(origin); // autorise les previews Vercel
    cb(ok ? null : new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization','X-CSRF-Token','x-csrf-token'],
  exposedHeaders: ['Content-Length'],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // preflight

// --- CORS safety net: ensure headers on ALL responses, even 401/403
app.use((req, res, next) => {
  const origin = req.headers.origin;
  // si l'origine est autorisée par ta whitelist, on renvoie les headers
  const allowed = [
    "http://localhost:5173",
    "https://korelia.vercel.app",
    "https://korelia-hazel.vercel.app",
  ];
  const isPreviewVercel = /^https:\/\/.*\.vercel\.app$/i.test(String(origin || ""));
  if (origin && (allowed.includes(origin) || isPreviewVercel)) {
    res.header("Access-Control-Allow-Origin", origin);
    res.header("Vary", "Origin");
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-CSRF-Token, x-csrf-token");
    res.header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  }
  // Répond proprement aux preflights (au cas où)
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  next();
});




/* =======================
 * Utilitaires généraux
 * ======================= */
const sleep = (ms) => new Promise(r=>setTimeout(r,ms));
function sha256(s){ return crypto.createHash('sha256').update(String(s)).digest('hex'); }
function isEmail(s){ return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s||'').toLowerCase()); }
function clampString(s, max=200){ s = String(s||''); return s.length > max ? s.slice(0,max) : s; }
function randomToken(n=24){ return crypto.randomBytes(n).toString('hex'); }

/* =======================
 * Fichiers data
 * ======================= */
const USERS_PATH    = path.join(__dirname, 'users.json');
const ORDERS_PATH   = path.join(__dirname, 'orders.json');
const PRODUCTS_PATH = path.join(__dirname, 'products.json');

async function readJson(file, fallback = []) {
  try { return JSON.parse(await fs.readFile(file, 'utf-8')); }
  catch (e) { if (e.code === 'ENOENT') return fallback; throw e; }
}
async function writeJson(file, data) {
  const tmp = file + '.' + crypto.randomBytes(4).toString('hex') + '.tmp';
  await fs.writeFile(tmp, JSON.stringify(data, null, 2));
  await fs.rename(tmp, file);
}

/* =======================
 * Cookies & helpers
 * ======================= */
function cookieOpts(days = 7){
  const maxAge = days * 24 * 3600 * 1000;
  // Cross-site → SameSite=None; Secure en prod
  return { httpOnly: true, sameSite: 'none', secure: isProd, maxAge, path:'/' };
}

function signToken(userPayload){
  return jwt.sign({
    id: userPayload.id,
    email: userPayload.email,
    role: userPayload.role || 'user',
    token_version: userPayload.token_version || 0,
  }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

async function readUsers(){ return readJson(USERS_PATH, []); }
async function writeUsers(list){ await writeJson(USERS_PATH, list); }

function getUserSafe(u){
  return {
    id: u.id,
    email: u.email,
    name: u.name || '',
    role: u.role || 'user',
    createdAt: u.createdAt,
    email_verified: !!u.email_verified
  };
}

/* =======================
 * Rewards: catalogue + helpers
 * ======================= */
const REWARD_TIERS = {
  "100_5":  { cost: 100, amount_off_cents: 500,  min_amount_cents: 3000, label: "5€ dès 30€"  },
  "200_12": { cost: 200, amount_off_cents: 1200, min_amount_cents: 5000, label: "12€ dès 50€" },
  "500_35": { cost: 500, amount_off_cents: 3500, min_amount_cents: 7000, label: "35€ dès 70€" },
};

function ensureRewardsShape(u){
  if (typeof u.points !== 'number') u.points = 0;
  if (!Array.isArray(u.rewards_history)) u.rewards_history = [];
  if (!u.reviews_meta) u.reviews_meta = { lastPerProduct: {} };
  return u;
}
function pushHistory(u, delta, reason, extra = {}){
  u.rewards_history.unshift({
    id: crypto.randomUUID(),
    at: new Date().toISOString(),
    delta,
    reason,
    ...extra
  });
}
async function saveUsersMutate(fn){
  const users = await readUsers();
  const updated = await fn(users);
  await writeUsers(updated);
  return updated;
}
async function addPointsByUserId(userId, delta, reason, extra = {}){
  let changed = false;
  await saveUsersMutate(users => {
    const idx = users.findIndex(x => x.id === userId);
    if (idx === -1) return users;
    ensureRewardsShape(users[idx]);
    users[idx].points = Math.max(0, (users[idx].points || 0) + delta);
    pushHistory(users[idx], delta, reason, extra);
    changed = true;
    return users;
  });
  return changed;
}
async function addPointsByEmail(email, delta, reason, extra = {}){
  const key = String(email || '').trim().toLowerCase();
  let changed = false;
  await saveUsersMutate(users => {
    const idx = users.findIndex(x => x.email === key);
    if (idx === -1) return users;
    ensureRewardsShape(users[idx]);
    users[idx].points = Math.max(0, (users[idx].points || 0) + delta);
    pushHistory(users[idx], delta, reason, extra);
    changed = true;
    return users;
  });
  return changed;
}
async function backfillRewardsForEmail(email, userId){
  const key = String(email || '').trim().toLowerCase();
  if (!key || !userId) return { credited: 0, orders: 0 };
  let orders = await readJson(ORDERS_PATH, []);
  let credited = 0;
  let count = 0;
  for (const o of orders) {
    const isPaid = (o.payment_status || 'paid') === 'paid';
    if (!isPaid) continue;
    const em = String(o.email || '').toLowerCase();
    if (!em || em !== key) continue;
    if (o.rewards_credited_user_id || o.rewards_backfill_done) continue;
    const euros = Math.floor((o.amount_subtotal ?? o.amount_total ?? 0) / 100);
    if (euros <= 0) continue;
    const ok = await addPointsByUserId(userId, euros, 'order_backfill', { orderId: o.id });
    if (!ok) continue;
    o.rewards_credited_user_id = userId;
    o.rewards_backfill_done = true;
    o.rewards_points = (o.rewards_points || 0) + euros;
    credited += euros;
    count += 1;
  }
  if (count > 0) { await writeJson(ORDERS_PATH, orders); }
  return { credited, orders: count };
}

/* =======================
 * Stripe & Mail
 * ======================= */
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const mailer = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: false,
  auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
  logger: false,
  debug: false,
});
(async () => {
  try { await mailer.verify(); console.log('📮 SMTP OK :', process.env.SMTP_HOST, process.env.SMTP_PORT); }
  catch (e) { console.error('❌ SMTP KO :', e?.message || e); }
})();

/* ======================================================
 * 1) WEBHOOK Stripe (⚠️ AVANT express.json())
 * ====================================================== */
app.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  if (!sig) return res.sendStatus(400);

  let event;
  try {
    if (process.env.STRIPE_WEBHOOK_SECRET) {
      event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } else {
      const payload = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : (typeof req.body === 'string' ? req.body : JSON.stringify(req.body));
      event = JSON.parse(payload);
    }
  } catch (err) {
    console.error('❌ Webhook verify error:', err.message);
    return res.sendStatus(400);
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;

      // line items (fallback lisible)
      let lineItems = [];
      try { const li = await stripe.checkout.sessions.listLineItems(session.id); lineItems = li.data || []; }
      catch (e) { console.warn('[LINE ITEMS]', e?.message || e); }

      // items internes via metadata
      let items = [];
      try { if (session.metadata?.items) items = JSON.parse(session.metadata.items); } catch {}

      // shipping
      const s = session.shipping_details || null;
      const shipping = s ? { name: s.name ?? null, address: s.address ?? null, phone: s.phone ?? null } : { name: null, address: null, phone: null };

      const amount_total = session.amount_total ?? 0;
      const amount_subtotal = session.amount_subtotal ?? 0;
      const shipping_cost = amount_total - amount_subtotal;
      const currency = (session.currency || 'eur').toLowerCase();

      const stripe_line_items = !items.length
        ? lineItems.map(li => ({ name: li.description, qty: li.quantity, amount_subtotal: li.amount_subtotal }))
        : [];

      // Objet commande (en mémoire)
      const order = {
        id: session.id,
        payment_status: session.payment_status,
        amount_total,
        amount_subtotal,
        shipping_cost,
        currency,
        email: session.customer_details?.email || null,
        customer_name: session.customer_details?.name || null,
        items,
        stripe_line_items,
        createdAt: new Date().toISOString(),
        shipping,
        shipping_option: session.shipping_cost?.shipping_rate || null,
        client_reference_id: session.client_reference_id || null,
        user_id: session.metadata?.userId || null,

        // Logistique
        status: "paid",
        status_history: [{ at: new Date().toISOString(), status: 'paid', by: 'system' }],
      };

      // Rewards avant d'écrire
      try {
        const euros = Math.floor((order.amount_subtotal ?? order.amount_total ?? 0) / 100);
        let credited = false;
        if (euros > 0) {
          if (order.user_id) {
            credited = await addPointsByUserId(order.user_id, euros, 'order', { orderId: order.id });
            if (credited) {
              order.rewards_credited_user_id = order.user_id;
              order.rewards_points = (order.rewards_points || 0) + euros;
              order.rewards_at = new Date().toISOString();
            }
          }
          if (!credited && order.email) {
            credited = await addPointsByEmail(order.email, euros, 'order', { orderId: order.id });
            if (credited) {
              order.rewards_credited_email = String(order.email).toLowerCase();
              order.rewards_points = (order.rewards_points || 0) + euros;
              order.rewards_at = new Date().toISOString();
            }
          }
          if (!credited && order.email) {
            order.rewards_pending_for_email = String(order.email).toLowerCase();
          }
        }
      } catch (e) {
        console.warn('[Rewards] add points error:', e?.message || e);
      }

      // ÉCRITURE FINALE (avec les champs rewards persistés)
      const orders = await readJson(ORDERS_PATH, []);
      orders.push(order);
      await writeJson(ORDERS_PATH, orders);
      console.log('✅ Commande enregistrée:', order.id, 'montant', (order.amount_total/100).toFixed(2), order.currency.toUpperCase());

      // MAJ stock si items internes
      if (items.length) {
        const products = await readJson(PRODUCTS_PATH, []);
        const mapQty = new Map(items.map(it => [String(it.id), Number(it.qty) || 0]));
        let changed = false;
        for (const p of products) {
          const need = mapQty.get(String(p.id));
          if (need && Number.isFinite(p.stock)) {
            const before = p.stock;
            p.stock = Math.max(0, p.stock - need);
            if (p.stock !== before) changed = true;
          }
        }
        if (changed) {
          await writeJson(PRODUCTS_PATH, products);
          console.log('📦 Stock mis à jour dans products.json');
        }
      }

      // Email confirmation (best-effort)
      try { await sendOrderEmail(order); } catch (e) { console.warn('⚠️ Email non envoyé:', e?.message || e); }

      return res.sendStatus(200);
    }

    return res.sendStatus(200);
  } catch (err) {
    console.error('❌ Erreur handler webhook:', err);
    return res.sendStatus(500);
  }
});

/* ======================================================
 * 2) Middlewares globaux (APRES le webhook)
 * ====================================================== */
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://js.stripe.com"],
      frameSrc: ["'self'", "https://js.stripe.com"],
      imgSrc: ["'self'", "data:", "https:"],
      styleSrc: ["'self'", "'unsafe-inline'", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
if (isProd) app.use(helmet.hsts({ maxAge: 15552000 }));

app.use(cookieParser());

// ✅ UNIQUE endpoint CSRF (GET) — ne pas le dupliquer ailleurs
app.get('/auth/csrf', (req, res) => {
  let token = req.cookies?.csrf_token;
  if (!token) {
    token = randomToken(24);
    res.cookie('csrf_token', token, {
      sameSite: 'none',
      secure: isProd,
      maxAge: 2 * 60 * 60 * 1000,
      path: '/',
      httpOnly: true,
    });
  }
  res.json({ csrf: token });
});

// Parsers
app.use(express.json());

// rate limit global
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false
}));

// ⚠️ Protection CSRF après /auth/csrf
function csrfProtect(req, res, next){
  const method = (req.method || '').toUpperCase();
  if (['GET','HEAD','OPTIONS'].includes(method)) return next();
  if (req.path.startsWith('/webhook')) return next(); // Stripe
  const header = req.headers['x-csrf-token'];
  const cookie = req.cookies?.csrf_token;
  if (!header || !cookie || header !== cookie) {
    return res.status(403).json({ error: 'CSRF token invalide' });
  }
  next();
}
app.use(csrfProtect);

/* =======================
 * Anti brute-force login
 * ======================= */
const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de tentatives, réessayez plus tard.' }
});
app.use('/auth/login', authLimiter);
app.use('/auth/register', authLimiter);

const loginFailures = new Map(); // key -> { count, until }
function isLocked(key){
  const info = loginFailures.get(key);
  if (!info) return false;
  return info.until && Date.now() < info.until;
}
function registerFailure(key){
  const now = Date.now();
  const info = loginFailures.get(key) || { count: 0, until: 0 };
  info.count += 1;
  if (info.count >= 15) info.until = now + 15*60*1000;
  else if (info.count >= 10) info.until = now + 5*60*1000;
  else if (info.count >= 5)  info.until = now + 60*1000;
  loginFailures.set(key, info);
}
function resetFailures(key){ loginFailures.delete(key); }
async function loginGuard(req, res, next){
  const ip = req.ip || req.connection?.remoteAddress || 'unknown';
  const email = String(req.body?.email || '').toLowerCase();
  const keyIp = `ip:${ip}`;
  const keyEmail = email ? `email:${email}` : null;

  if (isLocked(keyIp) || (keyEmail && isLocked(keyEmail))) {
    return res.status(429).json({ error: 'Trop de tentatives, réessayez plus tard.' });
  }
  req._bf_keys = [keyIp, keyEmail].filter(Boolean);
  next();
}
app.post('/auth/login', loginGuard);

/* =======================
 * AUTH + Email verify + Reset
 * ======================= */
function optionalAuth(req, res, next){
  const token = req.cookies?.token || (req.headers.authorization||'').replace(/^Bearer\s+/, '');
  try { req.user = jwt.verify(token, process.env.JWT_SECRET); } catch {}
  next();
}
async function authRequired(req, res, next){
  const token = req.cookies?.token || (req.headers.authorization||'').replace(/^Bearer\s+/, '');
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const users = await readUsers();
    const me = users.find(u => u.id === payload.id);
    if (!me) return res.status(401).json({ error: 'Non authentifié' });
    if ((me.token_version || 0) !== (payload.token_version || 0)) {
      return res.status(401).json({ error: 'Session expirée' });
    }
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ error: 'Non authentifié' });
  }
}

app.post('/auth/register', async (req, res) => {
  const { email, password, name } = req.body || {};
  if(!email || !password) return res.status(400).json({ error: 'Email et mot de passe requis' });
  if(!isEmail(email)) return res.status(400).json({ error: 'Email invalide' });
  if(String(password).length < 8) return res.status(400).json({ error: 'Mot de passe trop court (8+)' });

  let users = await readUsers();
  const exists = users.some(u => u.email === String(email).toLowerCase());
  if (exists) return res.status(409).json({ error: 'Un compte existe déjà avec cet email' });

  const hash = await bcrypt.hash(password, 10);
  const user = ensureRewardsShape({
    id: crypto.randomUUID(),
    email: String(email).toLowerCase(),
    name: clampString(name, 120),
    password_hash: hash,
    role: 'user',
    createdAt: new Date().toISOString(),
    email_verified: false,
    email_verify: null,
    token_version: 0,
  });

  // Bonus d'inscription
  user.points = (user.points || 0) + 50;
  pushHistory(user, +50, 'signup');

  // token de vérif (24h)
  const rawToken = crypto.randomBytes(32).toString('hex');
  user.email_verify = { token_hash: sha256(rawToken), expiresAt: Date.now() + 24*3600*1000 };

  users.push(user);
  await writeUsers(users);

  // (optionnel) email vérification — suppose sendVerificationEmail défini ailleurs
  try { await sendVerificationEmail(user, rawToken); }
  catch (e) { console.warn('⚠️ Email vérification non envoyé:', e?.message || e); }

  // Backfill commandes invité
  let backfillInfo = { credited: 0, orders: 0 };
  try {
    backfillInfo = await backfillRewardsForEmail(user.email, user.id);
    if (backfillInfo.orders > 0) {
      console.log(`[Rewards] backfill at signup: +${backfillInfo.credited} pts sur ${backfillInfo.orders} commande(s) pour ${user.email}`);
    }
  } catch (e) {
    console.warn('[Rewards] backfill at signup error:', e?.message || e);
  }

  const token = signToken({ id: user.id, email: user.email, role: user.role, token_version: user.token_version });
  res.cookie('token', token, cookieOpts(7)).json({
    ...getUserSafe(user),
    rewards_backfill: backfillInfo,
  });
});

app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body || {};
  const users = await readUsers();
  const user = users.find(u => u.email === String(email).toLowerCase());
  if(!user){
    if (req._bf_keys) req._bf_keys.forEach(registerFailure);
    return res.status(401).json({ error: 'Identifiants invalides' });
  }
  const ok = await bcrypt.compare(password, user.password_hash);
  if(!ok){
    if (req._bf_keys) req._bf_keys.forEach(registerFailure);
    return res.status(401).json({ error: 'Identifiants invalides' });
  }
  if (req._bf_keys) req._bf_keys.forEach(resetFailures);

  if (process.env.REQUIRE_EMAIL_VERIFIED === '1' && !user.email_verified) {
    return res.status(403).json({ error: 'Email non vérifié. Vérifie ta boîte mail.' });
  }

  // Backfill à la connexion
  try {
    const info = await backfillRewardsForEmail(user.email, user.id);
    if (info.orders > 0) {
      console.log(`[Rewards] backfill at login: +${info.credited} pts sur ${info.orders} commande(s) pour ${user.email}`);
    }
  } catch (e) {
    console.warn('[Rewards] backfill at login error:', e?.message || e);
  }

  const token = signToken({ id: user.id, email: user.email, role: user.role || 'user', token_version: user.token_version || 0 });
  res.cookie('token', token, cookieOpts(7)).json(getUserSafe(user));
});

app.post('/auth/logout', (req, res) => {
  res.clearCookie('token', cookieOpts()).json({ ok: true });
});

app.get('/me', authRequired, async (req, res) => {
  const users = await readUsers();
  const me = users.find(u => u.id === req.user.id);
  if(!me) return res.status(404).json({ error: 'Utilisateur introuvable' });
  res.json(getUserSafe(me));
});

app.put('/me', authRequired, async (req, res) => {
  try {
    const { name } = req.body || {};
    const users = await readUsers();
    const idx = users.findIndex(u => u.id === req.user.id);
    if (idx === -1) return res.status(404).json({ error: 'Utilisateur introuvable' });
    users[idx].name = clampString(name, 120);
    await writeUsers(users);
    res.json(getUserSafe(users[idx]));
  } catch (e) {
    res.status(500).json({ error: 'Impossible de mettre à jour le profil' });
  }
});

app.post('/me/change-password', authRequired, async (req, res) => {
  try {
    const { current_password, new_password } = req.body || {};
    if (!current_password || !new_password) return res.status(400).json({ error: 'Champs requis' });
    if (String(new_password).length < 8) return res.status(400).json({ error: 'Nouveau mot de passe trop court (8+)' });

    const users = await readUsers();
    const idx = users.findIndex(u => u.id === req.user.id);
    if (idx === -1) return res.status(404).json({ error: 'Utilisateur introuvable' });

    const ok = await bcrypt.compare(String(current_password), users[idx].password_hash);
    if (!ok) return res.status(401).json({ error: 'Mot de passe actuel invalide' });

    users[idx].password_hash = await bcrypt.hash(String(new_password), 10);
    users[idx].token_version = (users[idx].token_version || 0) + 1; // invalide toutes les sessions
    await writeUsers(users);

    const token = signToken({ id: users[idx].id, email: users[idx].email, role: users[idx].role || 'user', token_version: users[idx].token_version });
    res.cookie('token', token, cookieOpts(7)).json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Impossible de changer le mot de passe' });
  }
});

app.post('/me/sessions/revoke-all', authRequired, async (req, res) => {
  const users = await readUsers();
  const idx = users.findIndex(u => u.id === req.user.id);
  if (idx === -1) return res.status(404).json({ error: 'Utilisateur introuvable' });

  users[idx].token_version = (users[idx].token_version || 0) + 1;
  await writeUsers(users);

  res.clearCookie('token', cookieOpts()).json({ ok: true });
});

// (optionnel) endpoints email verify/reset — supposent sendVerificationEmail / sendPasswordResetEmail définis
app.post('/auth/resend-verification', authRequired, async (req, res) => {
  const users = await readUsers();
  const idx = users.findIndex(u => u.id === req.user.id);
  if (idx === -1) return res.status(404).json({ error: 'Utilisateur introuvable' });
  const user = users[idx];

  if (user.email_verified) return res.json({ ok: true, alreadyVerified: true });

  const rawToken = crypto.randomBytes(32).toString('hex');
  users[idx].email_verify = { token_hash: sha256(rawToken), expiresAt: Date.now() + 24*3600*1000 };
  await writeUsers(users);

  try { await sendVerificationEmail(users[idx], rawToken); }
  catch (e) { console.warn('⚠️ Email vérification non envoyé:', e?.message || e); }

  res.json({ ok: true });
});

app.get('/auth/verify-email', async (req, res) => {
  const token = String(req.query.token || '');
  if (!token) {
    if (req.query.json === '1' || req.accepts('json')) return res.status(400).json({ ok: false, error: 'Token manquant' });
    return res.status(400).send('<h1>Token manquant</h1>');
  }
  const users = await readUsers();
  const hash = sha256(token);
  const now = Date.now();

  const idx = users.findIndex(u => u.email_verify?.token_hash === hash);
  if (idx === -1) {
    if (req.query.json === '1' || req.accepts('json')) return res.status(400).json({ ok: false, error: 'Lien invalide' });
    return res.status(400).send('<h1>Lien invalide</h1>');
  }
  if (!users[idx].email_verify || now > Number(users[idx].email_verify.expiresAt)) {
    if (req.query.json === '1' || req.accepts('json')) return res.status(400).json({ ok: false, error: 'Lien expiré' });
    return res.status(400).send('<h1>Lien expiré</h1>');
  }

  users[idx].email_verified = true;
  users[idx].email_verify = null;
  await writeUsers(users);

  if (req.query.json === '1' || req.accepts('json')) return res.json({ ok: true });
  res.send('<h1>Email vérifié ✅</h1><p>Tu peux fermer cet onglet et retourner sur la boutique.</p>');
});

app.post('/auth/forgot-password', async (req, res) => {
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ error: 'Email requis' });

  try {
    const users = await readUsers();
    const idx = users.findIndex(u => u.email === String(email).toLowerCase());
    const NEUTRAL = () => res.json({ ok: true });

    if (idx === -1) return NEUTRAL();

    const rawToken = crypto.randomBytes(32).toString('hex');
    const token_hash = sha256(rawToken);
    const expiresAt = Date.now() + 3600 * 1000;

    users[idx].password_reset = { token_hash, expiresAt, used: false };
    await writeUsers(users);

    try { await sendPasswordResetEmail(users[idx].email, rawToken); }
    catch (e) { console.warn('⚠️ Email reset non envoyé:', e?.message || e); }

    return NEUTRAL();
  } catch (e) {
    console.error('forgot-password error:', e);
    return res.json({ ok: true });
  }
});

app.get('/auth/check-reset', async (req, res) => {
  const token = String(req.query.token || '');
  if (!token) return res.status(400).json({ error: 'Token manquant' });
  const users = await readUsers();
  const token_hash = sha256(token);
  const now = Date.now();

  const user = users.find(u => u.password_reset?.token_hash === token_hash);
  if (!user) return res.status(400).json({ error: 'Lien invalide' });
  if (!user.password_reset || user.password_reset.used) return res.status(400).json({ error: 'Lien utilisé' });
  if (now > Number(user.password_reset.expiresAt)) return res.status(400).json({ error: 'Lien expiré' });

  res.json({ ok: true });
});

app.post('/auth/reset-password', async (req, res) => {
  const { token, new_password } = req.body || {};
  if (!token || !new_password) return res.status(400).json({ error: 'Token et new_password requis' });
  if (String(new_password).length < 8) return res.status(400).json({ error: 'Mot de passe trop court (8+)' });

  try {
    const users = await readUsers();
    const token_hash = sha256(token);
    const now = Date.now();

    const idx = users.findIndex(u => u.password_reset?.token_hash === token_hash);
    if (idx === -1) return res.status(400).json({ error: 'Lien invalide' });

    const pr = users[idx].password_reset;
    if (!pr || pr.used) return res.status(400).json({ error: 'Lien déjà utilisé' });
    if (now > Number(pr.expiresAt)) return res.status(400).json({ error: 'Lien expiré' });

    users[idx].password_hash = await bcrypt.hash(String(new_password), 10);
    users[idx].password_reset.used = true;
    users[idx].token_version = (users[idx].token_version || 0) + 1; // invalider anciennes sessions si loggé
    await writeUsers(users);

    return res.json({ ok: true });
  } catch (e) {
    console.error('reset-password error:', e);
    return res.status(500).json({ error: 'Impossible de réinitialiser' });
  }
});

/* =======================
 * Rewards endpoints
 * ======================= */
app.get('/rewards/catalog', (req, res) => {
  res.json(REWARD_TIERS);
});

app.get('/me/rewards', authRequired, async (req, res) => {
  const users = await readUsers();
  const me = users.find(u => u.id === req.user.id);
  if (!me) return res.status(404).json({ error: 'Utilisateur introuvable' });
  ensureRewardsShape(me);
  res.json({ points: me.points, history: me.rewards_history.slice(0,100), tiers: REWARD_TIERS });
});

app.post('/rewards/redeem', authRequired, async (req, res) => {
  try{
    const { tier } = req.body || {};
    const t = REWARD_TIERS[tier];
    if (!t) return res.status(400).json({ error: 'Palier inconnu' });

    const users = await readUsers();
    const idx = users.findIndex(u => u.id === req.user.id);
    if (idx === -1) return res.status(404).json({ error: 'Utilisateur introuvable' });

    const u = ensureRewardsShape(users[idx]);
    if ((u.points || 0) < t.cost) return res.status(400).json({ error: 'Solde insuffisant' });

    const coupon = await stripe.coupons.create({ amount_off: t.amount_off_cents, currency: 'eur', duration: 'once' });
    const codeSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
    const code = `KORELIA-${(t.amount_off_cents/100)|0}-${codeSuffix}`;
    const promo = await stripe.promotionCodes.create({
      coupon: coupon.id,
      code,
      max_redemptions: 1,
      restrictions: { minimum_amount: t.min_amount_cents, minimum_amount_currency: 'eur' }
    });

    u.points = Math.max(0, (u.points || 0) - t.cost);
    pushHistory(u, -t.cost, `redeem:${tier}`, {
      stripe_coupon_id: coupon.id,
      stripe_promotion_code_id: promo.id,
      code: promo.code,
      amount_off_cents: t.amount_off_cents,
      min_amount_cents: t.min_amount_cents
    });
    users[idx] = u;
    await writeJson(USERS_PATH, users);

    return res.json({ ok: true, code: promo.code, amount_off_cents: t.amount_off_cents, min_amount_cents: t.min_amount_cents });
  } catch (e) {
    console.error('redeem error:', e);
    return res.status(500).json({ error: 'Impossible de créer le code' });
  }
});

app.post('/reviews/add', authRequired, async (req, res) => {
  const { productId, rating = 5, content = "" } = req.body || {};
  if (!productId) return res.status(400).json({ error: 'productId requis' });

  const users = await readUsers();
  const idx = users.findIndex(u => u.id === req.user.id);
  if (idx === -1) return res.status(404).json({ error: 'Utilisateur introuvable' });

  const u = ensureRewardsShape(users[idx]);
  const last = u.reviews_meta.lastPerProduct[String(productId)];
  const now = Date.now();
  if (last && (now - last) < 24*3600*1000) {
    return res.status(429).json({ error: 'Vous avez déjà laissé un avis récemment pour ce produit.' });
  }
  u.reviews_meta.lastPerProduct[String(productId)] = now;
  u.points = (u.points || 0) + 10;
  pushHistory(u, +10, 'review', { productId, rating, len: content.length });

  users[idx] = u;
  await writeJson(USERS_PATH, users);
  res.json({ ok: true, points: u.points });
});

/* =======================
 * Produits (public)
 * ======================= */
const productsRaw = await fs.readFile(PRODUCTS_PATH, 'utf-8');
let products = JSON.parse(productsRaw);
let PRODUCT_BY_ID   = Object.fromEntries(products.map(p => [String(p.id), p]));
let PRODUCT_BY_SLUG = Object.fromEntries(products.map(p => [String(p.slug), p]));
const cents = (p) => Number.isFinite(p.price_cents) ? p.price_cents : Math.round(Number(p.price) * 100);
async function reloadProducts() {
  const raw = await fs.readFile(PRODUCTS_PATH, 'utf-8');
  products = JSON.parse(raw);
  PRODUCT_BY_ID = Object.fromEntries(products.map(p => [String(p.id), p]));
  PRODUCT_BY_SLUG = Object.fromEntries(products.map(p => [String(p.slug), p]));
}

app.get('/api/products', (req, res) => {
  res.json(products.map(p => ({
    id: String(p.id),
    slug: String(p.slug),
    name: p.name,
    brand: p.brand,
    image: p.image || null,
    price_cents: cents(p),
    stock: Number.isFinite(p.stock) ? p.stock : null,
    category: p.category || null,
    skin_types: Array.isArray(p.skin_types) ? p.skin_types : [],
    tags: Array.isArray(p.tags) ? p.tags : [],
  })));
});

app.get('/api/products/:slug', (req, res) => {
  const p = PRODUCT_BY_SLUG[req.params.slug];
  if (!p) return res.status(404).json({ error: 'Produit introuvable' });
  res.json({ ...p, id: String(p.id), slug: String(p.slug), price_cents: cents(p) });
});

/* =======================
 * Admin (rôle requis)
 * ======================= */
async function adminRequired(req, res, next){
  await authRequired(req, res, async () => {
    if ((req.user.role || 'user') !== 'admin') return res.status(403).json({ error: 'Accès admin requis' });
    next();
  });
}
function csvEscape(v){ if (v===null||v===undefined) return ''; const s=String(v); return /[",\n\r]/.test(s) ? `"${s.replace(/"/g,'""')}"` : s; }

app.get('/admin/orders', adminRequired, async (req, res) => {
  try {
    const orders = await readJson(ORDERS_PATH, []);

    // auto-fix pour anciens enregistrements sans status
    let changed = false;
    for (const o of orders) {
      if (!o.status) { o.status = 'paid'; changed = true; }
      if (!Array.isArray(o.status_history)) {
        o.status_history = [{ at: o.createdAt || new Date().toISOString(), status: o.status, by: 'system' }];
        changed = true;
      }
    }
    if (changed) await writeJson(ORDERS_PATH, orders);

    orders.sort((a,b)=> (a.createdAt < b.createdAt ? 1 : -1));
    res.json(orders);
  } catch { res.status(500).json({ error: 'Impossible de lire les commandes' }); }
});

app.get('/admin/orders.csv', adminRequired, async (req, res) => {
  try {
    let orders = await readJson(ORDERS_PATH, []);
    const { from, to } = req.query;
    if (from) { const min = new Date(from + 'T00:00:00Z').getTime(); orders = orders.filter(o => new Date(o.createdAt||o.created_at||0).getTime() >= min); }
    if (to)   { const max = new Date(to   + 'T23:59:59Z').getTime(); orders = orders.filter(o => new Date(o.createdAt||o.created_at||0).getTime() <= max); }
    orders.sort((a,b)=> (a.createdAt < b.createdAt ? 1 : -1));
    const headers = ['date','id','email','amount_eur','currency','status','items','shipping_name','shipping_country','shipping_option'];
    const lines = [headers.join(',')];
    for (const o of orders) {
      const itemsStr = Array.isArray(o.items)&&o.items.length
        ? o.items.map(it=>`${it.id} x${it.qty}`).join('; ')
        : Array.isArray(o.stripe_line_items)&&o.stripe_line_items.length
          ? o.stripe_line_items.map(li=>`${li.name} x${li.qty||li.quantity||1}`).join('; ')
          : '';
      const row = [
        new Date(o.createdAt||o.created_at||Date.now()).toISOString(),
        o.id||'', o.email||'', ((o.amount_total||0)/100).toFixed(2), (o.currency||'eur').toUpperCase(),
        o.payment_status||'paid', itemsStr, o.shipping?.name||'', o.shipping?.address?.country||'', o.shipping_option||''
      ].map(csvEscape);
      lines.push(row.join(','));
    }
    const csv = lines.join('\n');
    const today = new Date().toISOString().slice(0,10).replace(/-/g,'');
    res.setHeader('Content-Type','text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="orders-${today}.csv"`);
    res.send(csv);
  } catch { res.status(500).json({ error: 'Impossible de générer le CSV' }); }
});

app.get('/admin/products', adminRequired, async (req, res) => {
  try {
    const list = products.map(p => ({
      id: String(p.id), slug: String(p.slug), name: p.name, brand: p.brand,
      image: p.image || null, price_cents: cents(p), stock: Number.isFinite(p.stock) ? p.stock : 0
    }));
    res.json(list);
  } catch { res.status(500).json({ error: 'Impossible de lire les produits' }); }
});

app.put('/admin/products/:id/stock', adminRequired, async (req, res) => {
  try {
    const id = String(req.params.id);
    const { op, value } = req.body || {};
    if (!['inc','set'].includes(op)) return res.status(400).json({error:'op doit être "inc" ou "set"'});
    if (!Number.isFinite(value)) return res.status(400).json({error:'value doit être un nombre'});
    const idx = products.findIndex(p => String(p.id) === id);
    if (idx === -1) return res.status(404).json({ error: 'Produit introuvable' });
    const current = Number.isFinite(products[idx].stock) ? products[idx].stock : 0;
    products[idx].stock = op === 'inc' ? Math.max(0, current + Math.trunc(value)) : Math.max(0, Math.trunc(value));
    await fs.writeFile(PRODUCTS_PATH, JSON.stringify(products, null, 2));
    await reloadProducts();
    res.json({ id, stock: products[idx].stock });
  } catch { res.status(500).json({ error: 'Impossible de mettre à jour le stock' }); }
});

/* =======================
 * Checkout + Merci
 * ======================= */
async function validatePromoOrThrow({ code, items_total_cents }) {
  const promoCodeRaw = String(code || "").trim();
  if (!promoCodeRaw) throw new Error("Code requis");
  const found = await stripe.promotionCodes.list({ code: promoCodeRaw, active: true, limit: 1 });
  const promo = found?.data?.[0];
  if (!promo) throw new Error("Code promo invalide ou inactif.");
  const coupon = promo.coupon;
  if (!coupon?.valid) throw new Error("Ce code promo a expiré.");
  if (promo.max_redemptions && promo.times_redeemed >= promo.max_redemptions) {
    throw new Error("Ce code promo n’est plus disponible.");
  }
  const min = promo.restrictions?.minimum_amount || 0;
  const minCur = (promo.restrictions?.minimum_amount_currency || "eur").toLowerCase();
  if (min > 0) {
    if (minCur !== "eur") throw new Error("Ce code promo n’est pas valable pour cette devise.");
    if (items_total_cents < min) {
      const euros = (min / 100).toFixed(2).replace(".", ",");
      throw new Error(`Montant minimum ${euros} € requis pour ce code.`);
    }
  }
  if (coupon.amount_off && String(coupon.currency).toLowerCase() !== "eur") {
    throw new Error("Ce code promo n’est pas valable pour cette devise.");
  }
  return { promo, coupon };
}

app.post('/api/validate-promo', async (req, res) => {
  try {
    const items = req.body.items || [];       // [{id, qty}]
    const code  = (req.body.promo_code || "").trim();
    const items_total_cents = items.reduce((s, {id, qty}) => {
      const p = PRODUCT_BY_ID[String(id)];
      return s + (p ? cents(p) * qty : 0);
    }, 0);
    const { promo, coupon } = await validatePromoOrThrow({ code, items_total_cents });
    let desc = "";
    if (coupon.amount_off) desc = `-${(coupon.amount_off/100).toFixed(2)} €`;
    else if (coupon.percent_off) desc = `-${coupon.percent_off}%`;
    const min = promo.restrictions?.minimum_amount || 0;
    const minNote = min ? ` (dès ${(min/100).toFixed(2)} €)` : "";
    return res.json({
      ok: true,
      promotion_code_id: promo.id,
      code: promo.code,
      description: `${desc}${minNote}`.trim()
    });
  } catch (e) {
    return res.status(400).json({ ok: false, error: e.message || "Code promo invalide." });
  }
});

app.post('/api/create-checkout-session', optionalAuth, async (req, res) => {
  try {
    const items = req.body.items || []; // [{id, qty}]
    const promoCodeRaw = (req.body.promo_code || "").trim();

    const line_items = items.map(({ id, qty }) => {
      const p = PRODUCT_BY_ID[String(id)];
      if (!p) throw new Error(`Produit inconnu: ${id}`);
      return { quantity: qty, price_data: { currency: 'eur', unit_amount: cents(p), product_data: { name: p.name, description: p.brand } } };
    });

    const FREE_SHIPPING_THRESHOLD = 5000;
    const STANDARD_EUR = 490;
    const EXPRESS_EUR  = 990;
    const items_total_cents = items.reduce((s,{id,qty}) => {
      const p=PRODUCT_BY_ID[String(id)];
      return s + (p?cents(p)*qty:0);
    },0);

    const shipping_options = [];
    if (items_total_cents >= FREE_SHIPPING_THRESHOLD) {
      shipping_options.push({ shipping_rate_data: { display_name: 'Livraison standard (gratuite)', fixed_amount: { amount: 0, currency: 'eur' }, type: 'fixed_amount', delivery_estimate: { minimum:{unit:'business_day',value:2}, maximum:{unit:'business_day',value:4} } } });
    } else {
      shipping_options.push({ shipping_rate_data: { display_name: 'Livraison standard', fixed_amount: { amount: STANDARD_EUR, currency: 'eur' }, type: 'fixed_amount', delivery_estimate: { minimum:{unit:'business_day',value:2}, maximum:{unit:'business_day',value:4} } } });
    }
    shipping_options.push({ shipping_rate_data: { display_name: 'Livraison express', fixed_amount: { amount: EXPRESS_EUR, currency: 'eur' }, type: 'fixed_amount', delivery_estimate: { minimum:{unit:'business_day',value:1}, maximum:{unit:'business_day',value:2} } } });

    let customerParams = {};
    let metadata = { items: JSON.stringify(items) };
    if (req.user) {
      const users = await readUsers();
      const me = users.find(u => u.id === req.user.id);
      if (me) {
        const customer = await stripe.customers.create({ email: me.email, name: me.name || undefined });
        customerParams = { customer: customer.id, customer_update: { shipping: 'auto' } };
        metadata.userId = me.id;
      }
    } else {
      const { customerEmail } = req.body || {};
      if (customerEmail) customerParams = { customer_email: customerEmail };
    }

    let discounts = [];
    if (promoCodeRaw) {
      try {
        const { promo } = await validatePromoOrThrow({ code: promoCodeRaw, items_total_cents});
        discounts = [{ promotion_code: promo.id}];
      }
      catch (e) {
        return res.status(400).json({error: e.message || "Code promo invalide."})
      }
    }

    const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card', 'bancontact'],
      line_items,
      allow_promotion_codes: true,
      discounts,
      billing_address_collection: 'auto',
      shipping_address_collection: { allowed_countries: ['BE', 'FR', 'LU'] },
      shipping_options,
      phone_number_collection: { enabled: true },
      success_url: `${CLIENT_URL}/merci?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${CLIENT_URL}/panier`,
      metadata,
      ...customerParams,
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message || 'Erreur de paiement' });
  }
});

app.get('/api/orders/by-session/:sessionId', async (req, res) => {
  const { sessionId } = req.params || {};
  if (!sessionId) return res.status(400).json({ error: 'sessionId requis' });
  for (let attempt=0; attempt<6; attempt++){
    try {
      const orders = await readJson(ORDERS_PATH, []);
      const order = orders.find(o => o.id === sessionId || o.stripe_session_id === sessionId);
      if (order) return res.json(order);
    } catch {
      return res.status(500).json({ error: 'Impossible de lire les commandes' });
    }
    await sleep(350);
  }
  res.status(404).json({ error: 'Commande introuvable (webhook pas encore écrit ?)' });
});

/* =======================
 * Launch
 * ======================= */
app.listen(PORT, () => {
  console.log(`✅ API OK: http://localhost:${PORT}`);
});

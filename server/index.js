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

const FRONT_ORIGIN = process.env.CLIENT_URL || ""; // ex: https://korelia-seven.vercel.app
// On considère cross-site si origin front défini ET different de l'API
const CROSS_SITE = !!(FRONT_ORIGIN && !FRONT_ORIGIN.includes('localhost'));


app.set('trust proxy', 1); // requis pour secure cookies derrière proxy

// --- CORS whitelist ---
const allowed = [
  "http://localhost:5173",
  "https://korelia.vercel.app",
  "https://korelia-seven.vercel.app",
  "https://*.vercel.app",
].filter(Boolean);

const corsOptions = {
  origin(origin, cb) {
    if (!origin) return cb(null, true); // Postman/cURL
    const ok = allowed.some((pat) =>
      pat.includes("*")
        ? new RegExp("^" + pat.replace(".", "\\.").replace("*", ".*") + "$").test(origin)
        : pat === origin
    );
    cb(ok ? null : new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET","POST","PUT","PATCH","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization","X-CSRF-Token","x-csrf-token"],
  exposedHeaders: ["Content-Length"],
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));


// --- CORS safety net: ensure headers on ALL responses, even 401/403
app.use((req, res, next) => {
  const origin = req.headers.origin;
  // si l'origine est autorisée par ta whitelist, on renvoie les headers
  const allowed = [
    "http://localhost:5173",
    "https://korelia-zeta.vercel.app/",
    "https://korelia.vercel.app"
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


/* =======================
 * Fichiers data
 * ======================= */
const USERS_PATH    = path.join(__dirname, 'users.json');
const ORDERS_PATH   = path.join(__dirname, 'orders.json');
const PRODUCTS_PATH = path.join(__dirname, 'products.json');
const CONTACTS_PATH = path.join(__dirname, 'contacts.json');


async function readJson(file, fallback = []) {
  try { return JSON.parse(await fs.readFile(file, 'utf-8')); }
  catch (e) { if (e.code === 'ENOENT') return fallback; throw e; }
}
async function writeJson(file, data) {
  const tmp = file + '.' + crypto.randomBytes(4).toString('hex') + '.tmp';
  await fs.writeFile(tmp, JSON.stringify(data, null, 2));
  await fs.rename(tmp, file);
}




const REVIEWS_PATH = path.join(__dirname, 'reviews.json');
async function readReviews(){ return readJson(REVIEWS_PATH, []); }
async function writeReviews(list){ await writeJson(REVIEWS_PATH, list); }


/* =======================
 * Cookies & helpers
 * ======================= */
function cookieOpts(days = 7){
  const maxAge = days * 24 * 3600 * 1000;
  // En cross-site (front ≠ back), il faut SameSite=None; Secure
  const sameSite = CROSS_SITE ? 'none' : 'lax';
  const secure   = CROSS_SITE ? true    : isProd; // en prod/local cross-site => secure true
  return { httpOnly: true, sameSite, secure, maxAge, path:'/' };
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
  "100_5":  { cost: 100, amount_off_cents: 500,  min_amount_cents: 5000, label: "5€ de réduction"  },
  "200_12": { cost: 200, amount_off_cents: 1200, min_amount_cents: 7000, label: "12€ de réduction" },
  "500_35": { cost: 500, amount_off_cents: 3500, min_amount_cents: 10000, label: "35€ de réduction" },
};

function ensureRewardsShape(u){
  if (typeof u.points !== 'number') u.points = 0;
  if (!Array.isArray(u.rewards_history)) u.rewards_history = [];
  if (!u.reviews_meta) u.reviews_meta = { lastPerProduct: {}, awardedPerProduct: {} };
  if (!u.reviews_meta.lastPerProduct) u.reviews_meta.lastPerProduct = {};
  if (!u.reviews_meta.awardedPerProduct) u.reviews_meta.awardedPerProduct = {};
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



function findUserByEmailUnsafe(list, email){
  const key = String(email||'').toLowerCase();
  return list.find(u => u.email === key) || null;
}

/** Vérifie s’il existe au moins une commande PAYÉE contenant ce productId
 *  pour ce userId OU cet email (fallback).
 */
async function hasBoughtProduct({ userId=null, email=null, productId }){
  if (!productId) return false;
  const orders = await readJson(ORDERS_PATH, []);
  const keyEmail = String(email||'').toLowerCase();
  for (const o of orders){
    const isPaid = (o.payment_status || 'paid') === 'paid';
    if (!isPaid) continue;
    const byUser = userId && o.user_id && o.user_id === userId;
    const byEmail = keyEmail && o.email && String(o.email).toLowerCase() === keyEmail;
    if (!byUser && !byEmail) continue;

    // Vérifie l’item (checkout interne → o.items)
    if (Array.isArray(o.items) && o.items.some(it => String(it.id) === String(productId))){
      return true;
    }
  }
  return false;
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

// =========================
// Emails — implémentations
// =========================
function renderOrderHtml(order){
  const items = Array.isArray(order.items) && order.items.length
    ? order.items.map(it => `<li>${it.qty} × ${escapeHtml(it.name || String(it.id))}</li>`).join("")
    : Array.isArray(order.stripe_line_items) && order.stripe_line_items.length
      ? order.stripe_line_items.map(li => `<li>${li.quantity ?? li.qty ?? 1} × ${escapeHtml(li.description || li.name || "Produit")}</li>`).join("")
      : "<li>(ligne non disponible)</li>";

  const total = (Number(order.amount_total || 0) / 100).toFixed(2).replace('.', ',');
  const sub   = (Number(order.amount_subtotal || 0) / 100).toFixed(2).replace('.', ',');
  const ship  = (Number(order.shipping_cost || 0) / 100).toFixed(2).replace('.', ',');

  return `
  <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial;max-width:640px;margin:0 auto;padding:16px;">
    <h2>Merci pour votre commande ${escapeHtml(order.customer_name || "")} 🤍</h2>
    <p>Référence : <strong>${escapeHtml(order.id)}</strong></p>
    <h3>Articles</h3>
    <ul>${items}</ul>
    <p>Sous-total : <strong>${sub} €</strong><br/>
       Livraison : <strong>${ship} €</strong><br/>
       Total payé : <strong>${total} €</strong>
    </p>
    <p>Adresse : ${escapeHtml(order.shipping?.name || "")}<br/>
       ${escapeHtml(order.shipping?.address?.line1 || "")} ${escapeHtml(order.shipping?.address?.line2 || "")}<br/>
       ${escapeHtml(order.shipping?.address?.postal_code || "")} ${escapeHtml(order.shipping?.address?.city || "")} — ${escapeHtml(order.shipping?.address?.country || "")}
    </p>
    <p style="font-size:12px;color:#666">Cet email est généré automatiquement. Merci de votre confiance.</p>
  </div>`;
}

async function sendOrderEmail(order) {
  if (!process.env.SMTP_HOST || !process.env.MAIL_FROM) {
    throw new Error("SMTP non configuré (SMTP_HOST/MAIL_FROM manquants)");
  }
  const to = order.email || process.env.CONTACT_TO;
  if (!to) throw new Error("Destinataire inconnu (order.email manquant)");

  const lines = [];
  lines.push(`Bonjour ${order.customer_name || ""}`.trim());
  lines.push("");
  lines.push("Merci pour votre commande !");
  lines.push("");
  if (Array.isArray(order.items) && order.items.length) {
    lines.push("Articles :");
    for (const it of order.items) {
      lines.push(`- ${it.name || it.id} × ${it.qty} — ${(Number(it.price_cents||0)/100).toFixed(2)} €`);
    }
  } else if (Array.isArray(order.stripe_line_items) && order.stripe_line_items.length) {
    lines.push("Articles :");
    for (const li of order.stripe_line_items) {
      const qty = li.qty ?? li.quantity ?? 1;
      lines.push(`- ${li.name} × ${qty} — ${(Number(li.amount_subtotal||0)/100).toFixed(2)} € (sous-total)`);
    }
  }
  lines.push("");
  lines.push(`Total: ${(Number(order.amount_total||0)/100).toFixed(2)} ${String(order.currency||'eur').toUpperCase()}`);
  lines.push("");
  lines.push("Nous vous informerons lors de l’expédition. Merci ❤️");

  await mailer.sendMail({
    from: process.env.MAIL_FROM,
    to,
    subject: `Confirmation de commande ${order.id}`,
    text: lines.join("\n")
  });
}


 async function sendVerificationEmail(user, rawToken){
  if (!process.env.MAIL_FROM) throw new Error("MAIL_FROM manquant");
  if (!user?.email) throw new Error("email utilisateur manquant");
  
  const API = process.env.API_URL || 'http://localhost:4242';
  const link = `${API}/auth/verify-email?token=${encodeURIComponent(rawToken)}`;

  const html = `
    <p>Bonjour ${escapeHtml(user.name || '')},</p>
    <p>Merci de vérifier votre adresse email en cliquant sur le lien :</p>
    <p><a href="${link}">${link}</a></p>
  `;
  await mailer.sendMail({
    from: process.env.MAIL_FROM,
    to: user.email,
    subject: 'Vérification de votre adresse email',
    html
  });
}

 async function sendPasswordResetEmail(email, rawToken){
  if (!process.env.MAIL_FROM) throw new Error("MAIL_FROM manquant");
  if (!email) throw new Error("email manquant");
  const base = process.env.CLIENT_URL || 'http://localhost:5173';
  const link = `${base}/reset?token=${encodeURIComponent(rawToken)}`;
  const html = `
    <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
    <p>Suivez ce lien (valable 1h) : <a href="${link}">${link}</a></p>
  `;
  await mailer.sendMail({
    from: process.env.MAIL_FROM,
    to: email,
    subject: 'Réinitialisation du mot de passe',
    html
  });
}

(async () => {
  try { await mailer.verify(); console.log('📮 SMTP OK :', process.env.SMTP_HOST, process.env.SMTP_PORT); }
  catch (e) { console.error('❌ SMTP KO :', e?.message || e); }
})();






async function hasPurchasedProduct(userId, email, productId, productName){
  const orders = await readJson(ORDERS_PATH, []);
  const keyEmail = String(email || '').toLowerCase();

  const matchesBuyer = (o) => {
    const byUser = userId && o.user_id === userId;
    const byEmail = keyEmail && String(o.email || '').toLowerCase() === keyEmail;
    return byUser || byEmail;
  };
  const matchesLine = (o) => {
    if (Array.isArray(o.items) && o.items.length) {
      return o.items.some(it => String(it.id) === String(productId));
    }
    if (Array.isArray(o.stripe_line_items) && o.stripe_line_items.length) {
      // fallback par nom si on n'a pas l'id côté Stripe
      if (!productName) return false;
      const target = String(productName).trim().toLowerCase();
      return o.stripe_line_items.some(li => String(li.name || '').trim().toLowerCase() === target);
    }
    return false;
  };
  return orders.some(o => (o.payment_status || 'paid') === 'paid' && matchesBuyer(o) && matchesLine(o));
}

async function sendReviewThankYouEmail(to, name, productName, pointsAwarded){
  try{
    if (!process.env.MAIL_FROM || !to) return;
    const who = name ? ` ${name}` : "";
    const subject = `Merci pour votre avis sur ${productName}`;
    const lines = [];
    lines.push(`Merci${who} pour votre avis sur ${productName} !`);
    if (pointsAwarded) {
      lines.push("");
      lines.push("Bonne nouvelle : 10 points ont été crédités sur votre compte 🤍");
    }
    await mailer.sendMail({
      from: process.env.MAIL_FROM,
      to, subject,
      text: lines.join("\n")
    });
  }catch(e){ console.warn('mail remerciement avis:', e?.message || e); }
}

  // === Helper Stripe: assurer un Customer avec adresse ===
async function ensureStripeCustomerForUser(user) {
  if (!user?.email) return null;

  let customer = null;
  try {
    const list = await stripe.customers.list({ email: user.email, limit: 1 });
    customer = list?.data?.[0] || null;
  } catch (e) { console.warn('[stripe] list customers by email:', e?.message || e); }

  const shipping = user.shipping_address || null;
  const phone = user.phone || "";

  const shippingForStripe = shipping ? {
    name: shipping.name || user.name || user.email,
    phone: phone || undefined,
    address: {
      line1: shipping.line1 || "",
      line2: shipping.line2 || "",
      postal_code: shipping.postal_code || "",
      city: shipping.city || "",
      country: (shipping.country || "BE").toUpperCase()
    }
  } : undefined;

  if (!customer) {
    customer = await stripe.customers.create({
      email: user.email,
      name: user.name || undefined,
      shipping: shippingForStripe,
      address: shipping ? {
        line1: shipping.line1 || "",
        line2: shipping.line2 || "",
        postal_code: shipping.postal_code || "",
        city: shipping.city || "",
        country: (shipping.country || "BE").toUpperCase()
      } : undefined,
      phone: phone || undefined,
    });
  } else {
    try {
      await stripe.customers.update(customer.id, {
        name: user.name || undefined,
        shipping: shippingForStripe,
        address: shipping ? {
          line1: shipping.line1 || "",
          line2: shipping.line2 || "",
          postal_code: shipping.postal_code || "",
          city: shipping.city || "",
          country: (shipping.country || "BE").toUpperCase()
        } : undefined,
        phone: phone || undefined,
      });
    } catch (e) {
      console.warn('[stripe] update customer:', e?.message || e);
    }
  }

  return customer;
}


// -- Refresh en mémoire de products.json (disponible partout) --
let products1 = [];
let PRODUCT_BY_ID1 = {};
let PRODUCT_BY_SLUG1 = {};

async function refreshProductsFromDisk() {
  try {
    const raw = await fs.readFile(PRODUCTS_PATH, 'utf-8');
    products1 = JSON.parse(raw);
    PRODUCT_BY_ID1   = Object.fromEntries(products1.map(p => [String(p.id), p]));
    PRODUCT_BY_SLUG1 = Object.fromEntries(products1.map(p => [String(p.slug), p]));
  } catch (e) {
    console.error('refreshProductsFromDisk error:', e?.message || e);
  }
}
// charge une première fois au boot
await refreshProductsFromDisk();



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
      const payload = Buffer.isBuffer(req.body)
        ? req.body.toString('utf8')
        : (typeof req.body === 'string' ? req.body : JSON.stringify(req.body));
      event = JSON.parse(payload);
    }
  } catch (err) {
    console.error('❌ Webhook verify error:', err.message);
    return res.sendStatus(400);
  }

  try {
    if (event.type === 'checkout.session.completed') {
  const session = event.data.object;

  // -- On essaie d'avoir une session enrichie Stripe
  let fullSession = session;
  try {
    fullSession = await stripe.checkout.sessions.retrieve(session.id, {
      expand: ['payment_intent', 'payment_intent.latest_charge']
    });
  } catch (e) {
    console.warn('[webhook] retrieve session (expand) failed:', e?.message || e);
  }

  // -- Line items Stripe (fallback)
  let lineItems = [];
  try {
    const li = await stripe.checkout.sessions.listLineItems(session.id);
    lineItems = li.data || [];
  } catch (e) {
    console.warn('[LINE ITEMS]', e?.message || e);
  }

  // ======================================================
  // 1. Récupération des items "raw" envoyés par le front
  //    au moment du /api/create-checkout-session
  //    -> peut contenir:
  //       {id, qty}                (produit normal)
  //       {custom_pack:true, ...}  (pack perso)
  // ======================================================
  let rawCheckoutItems = [];
  try {
    if (fullSession.metadata?.items) {
      rawCheckoutItems = JSON.parse(fullSession.metadata.items);
      if (!Array.isArray(rawCheckoutItems)) rawCheckoutItems = [];
    }
  } catch (e) {
    console.warn('[webhook] cannot parse metadata.items', e?.message || e);
    rawCheckoutItems = [];
  }

  // ======================================================
  // 2. Construire un tableau "items" lisible pour ta commande :
  //    - une ligne par produit normal
  //    - une ligne par pack perso (prix total remisé du pack)
  //
  //    NB: ça va servir pour afficher la commande dans OrdersPanel.
  // ======================================================
  const orderItems = [];

  for (const it of rawCheckoutItems) {
    // PACK PERSONNALISÉ
    if (it.custom_pack) {
      const packLine = {
        type: 'custom_pack',
        name: it.name || 'Pack personnalisé',
        qty: Number(it.qty || 1),
        // prix total déjà remisé qu'on avait envoyé au checkout
        price_cents: Number(it.price_cents || 0),
        // on garde la structure des composants pour affichage
        components: Array.isArray(it.components) ? it.components.map(c => {
          const prod = PRODUCT_BY_ID?.[String(c.id)];
          return {
            id: String(c.id),
            qty: Number(c.qty || 1),
            name: prod?.name || (`#${c.id}`),
            brand: prod?.brand || null,
            price_cents: prod ? cents(prod) : 0
          };
        }) : []
      };
      orderItems.push(packLine);
      continue;
    }

    // PRODUIT NORMAL
    const pid = String(it.id);
    const q = Number(it.qty || 1);
    const p = PRODUCT_BY_ID?.[pid];

    orderItems.push({
      type: 'single',
      id: pid,
      qty: q,
      name: p?.name || `#${pid}`,
      brand: p?.brand || null,
      price_cents: p ? cents(p) : 0
    });
  }

  // ======================================================
  // 3. Adresse d'expédition (ta logique existante)
  // ======================================================
  let shipping = null;

  if (fullSession?.shipping_details?.address) {
    shipping = {
      name: fullSession.shipping_details.name || fullSession.customer_details?.name || null,
      phone: fullSession.shipping_details.phone || fullSession.customer_details?.phone || null,
      address: fullSession.shipping_details.address
    };
  }

  if (!shipping && fullSession?.payment_intent?.shipping?.address) {
    const s = fullSession.payment_intent.shipping;
    shipping = {
      name: s.name || null,
      phone: s.phone || null,
      address: s.address || null
    };
  }

  if (!shipping && fullSession?.customer_details?.address) {
    shipping = {
      name: fullSession.customer_details.name || null,
      phone: fullSession.customer_details.phone || null,
      address: fullSession.customer_details.address || null
    };
  }

  const latestCharge = fullSession?.payment_intent?.latest_charge;
  if (!shipping && latestCharge?.billing_details?.address) {
    const b = latestCharge.billing_details;
    shipping = { name: b.name || null, phone: b.phone || null, address: b.address || null };
  }

  if (!shipping) shipping = { name: null, phone: null, address: null };

  // ======================================================
  // 4. Totaux Stripe
  // ======================================================
  const amount_total = fullSession.amount_total ?? 0;
  const amount_subtotal = fullSession.amount_subtotal ?? 0;
  const shipping_cost = amount_total - amount_subtotal;
  const currency = (fullSession.currency || 'eur').toLowerCase();

  // Fallback ultra-basique si jamais orderItems est vide
  const stripe_line_items = !orderItems.length
    ? lineItems.map(li => ({
        name: li.description,
        qty: li.quantity,
        amount_subtotal: li.amount_subtotal
      }))
    : [];

  // ======================================================
  // 5. Création de l'objet commande à stocker
  // ======================================================
  const order = {
    id: fullSession.id,
    payment_status: fullSession.payment_status,
    amount_total,
    amount_subtotal,
    shipping_cost,
    currency,
    email: fullSession.customer_details?.email || null,
    customer_name: fullSession.customer_details?.name || null,

    // 🔥 -> maintenant c'est notre structure enrichie incluant les packs
    items: orderItems,

    stripe_line_items,
    createdAt: new Date().toISOString(),
    shipping,
    shipping_option: fullSession.shipping_cost?.shipping_rate || null,
    client_reference_id: fullSession.client_reference_id || null,
    user_id: fullSession.metadata?.userId || null,
    status: "paid",
    status_history: [
      {
        at: new Date().toISOString(),
        status: 'paid',
        by: 'system'
      }
    ],
  };

  // ======================================================
  // 6. Récompenses (inchangé)
  // ======================================================
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

  // ======================================================
  // 7. Calcul du besoin réel de stock à déduire
  //
  // On refait la même logique que dans /api/create-checkout-session :
  // wanted[idProduit] = quantité totale à déduire
  //  - pour un produit normal : qty
  //  - pour un pack custom    : qtyPack * qtyComposant
  // ======================================================
  const wanted = new Map(); // idProduit -> total à déduire

  for (const it of rawCheckoutItems) {
    // pack personnalisé ?
    if (it.custom_pack && Array.isArray(it.components)) {
      const packQty = Number(it.qty || 1);
      for (const comp of it.components) {
        const pid = String(comp.id);
        const q = Number(comp.qty || 1) * packQty;
        wanted.set(pid, (wanted.get(pid) || 0) + q);
      }
    } else {
      // produit normal
      const pid = String(it.id);
      const q = Number(it.qty || 1);
      wanted.set(pid, (wanted.get(pid) || 0) + q);
    }
  }

  // On garde aussi une trace lisible du breakdown, pour debug / dashboard
  order.stock_breakdown = Array.from(wanted.entries()).map(([id, qty]) => ({
    id,
    qty,
    name: PRODUCT_BY_ID[id]?.name || null
  }));

  // ======================================================
  // 8. Persistance commande dans ORDERS_PATH
  // ======================================================
  const orders = await readJson(ORDERS_PATH, []);
  orders.push(order);
  await writeJson(ORDERS_PATH, orders);
  console.log(
    '✅ Commande enregistrée:',
    order.id,
    'montant',
    (order.amount_total/100).toFixed(2),
    order.currency.toUpperCase()
  );

  // ======================================================
  // 9. Décrémentation du stock (vraie MAJ inventaire)
  //
  // On modifie le fichier PRODUITS en fonction de `wanted`
  // puis on refresh ton cache mémoire (refreshProductsFromDisk)
  // ======================================================
  if (wanted.size > 0) {
    const list = await readJson(PRODUCTS_PATH, []);
    let changed = false;
    for (const p of list) {
      const need = wanted.get(String(p.id));
      if (!need) continue;
      if (!Number.isFinite(p.stock)) continue;
      const before = p.stock;
      p.stock = Math.max(0, p.stock - need);
      if (p.stock !== before) changed = true;
    }
    if (changed) {
      await writeJson(PRODUCTS_PATH, list);
      await refreshProductsFromDisk();
      console.log('📦 Stock mis à jour (avec packs custom)');
    }
  }

  // ======================================================
  // 10. Email de confirmation (inchangé)
  // ======================================================
  try {
    await sendOrderEmail(order);
  } catch (e) {
    console.warn('⚠️ Email non envoyé:', e?.message || e);
  }

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



// CSRF cookie (unique)
app.get('/auth/csrf', (req, res) => {
  let token = req.cookies?.csrf_token;
  if (!token) {
    token = crypto.randomBytes(24).toString('hex');
    res.cookie('csrf_token', token, {
      httpOnly: true,
      path: '/',
      maxAge: 2 * 60 * 60 * 1000,
      sameSite: CROSS_SITE ? 'none' : 'lax',
      secure:   CROSS_SITE ? true    : isProd,
    });
  }
  res.json({ csrf: token });
});



// Parsers
app.use(express.json());



// Test SMTP rapide
app.get('/dev/mail-test', async (req, res) => {
  try {
    const to = req.query.to || process.env.TEST_TO || process.env.SMTP_USER;
    await mailer.sendMail({
      from: process.env.MAIL_FROM,
      to,
      subject: 'Test SMTP Korelia',
      text: 'OK'
    });
    res.json({ ok: true, to });
  } catch (e) {
    console.error('mail-test:', e);
    res.status(500).json({ ok: false, error: e.message });
  }
});


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

// Me (profil léger)
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

// --- /me/orders : renvoie les commandes de l'utilisateur (par id ou email) ---
app.get('/me/orders', authRequired, async (req, res) => {
  try {
    const orders = await readJson(ORDERS_PATH, []);
    // On matche en priorité par user_id, sinon par email
    const mine = orders
      .filter(o =>
        (o.user_id && o.user_id === req.user.id) ||
        (o.email && req.user.email && o.email.toLowerCase() === req.user.email.toLowerCase())
      )
      .sort((a,b)=> (a.createdAt < b.createdAt ? 1 : -1));
    res.json(mine);
  } catch (e) {
    res.status(500).json({ error: 'Impossible de charger vos commandes' });
  }
});


// --- Adresse utilisateur (lecture/écriture) ---
app.get('/me/address', authRequired, async (req, res) => {
  const users = await readUsers();
  const me = users.find(u => u.id === req.user.id);
  if (!me) return res.status(404).json({ error: 'Utilisateur introuvable' });

  const addr = me.shipping_address || null;
  const phone = me.phone || "";
  res.json(addr ? { ...addr, phone } : {
    name:"", line1:"", line2:"", postal_code:"", city:"", country:"BE", phone:""
  });
});


app.put('/me/address', authRequired, async (req, res) => {
  const { name="", line1="", line2="", postal_code="", city="", country="BE", phone="" } = req.body || {};
  // petites validations / nettoyage
  const clean = {
    name: clampString(name, 120),
    line1: clampString(line1, 160),
    line2: clampString(line2, 160),
    postal_code: clampString(postal_code, 20),
    city: clampString(city, 120),
    country: String(country || "BE").toUpperCase().slice(0, 2),
  };
  const users = await readUsers();
  const idx = users.findIndex(u => u.id === req.user.id);
  if (idx === -1) return res.status(404).json({ error: 'Utilisateur introuvable' });

  users[idx].shipping_address = clean;
  users[idx].phone = clampString(phone, 40);
  await writeUsers(users);

  res.json({ ok: true });
});



    // ========== Synchroniser immédiatement la fiche Stripe avec l'adresse du compte ==========
app.post('/me/sync-stripe-customer', authRequired, async (req, res) => {
  try {
    const users = await readUsers();
    const me = users.find(u => u.id === req.user.id);
    if (!me) return res.status(404).json({ error: 'Utilisateur introuvable' });

    const customer = await ensureStripeCustomerForUser(me);
    if (!customer) return res.status(200).json({ ok: true, note: 'Aucun client stripe créé (email manquant?)' });

    return res.json({ ok: true, customer_id: customer.id });
  } catch (e) {
    console.error('/me/sync-stripe-customer', e);
    return res.status(500).json({ error: 'Impossible de synchroniser avec Stripe' });
  }
});





// Créer un avis (modéré)
// Requiert CSRF (tu l’as déjà globalement) : utiliser apiFetch côté front
app.post('/reviews/submit', optionalAuth, async (req, res) => {
  try{
    const { productId, rating, content, authorName, authorEmail } = req.body || {};
    // --- Limite: 1 avis / 24h / produit (par user OU par email invité)
const reviews = await readJson(REVIEWS_PATH, []);
const now = Date.now();
const since = now - 24*3600*1000;

const pid = String(productId); // <- l'id du produit concerné
const uid = req.user?.id || null;
const emailKey = String(authorEmail || req.user?.email || "").trim().toLowerCase();

const tooSoon = reviews.some(r => {
  // même produit ?
  if (String(r.productId) !== pid) return false;

  // déposé il y a moins de 24h ?
  const ts = new Date(r.createdAt || 0).getTime();
  if (!Number.isFinite(ts) || ts < since) return false;

  // même auteur (compte) OU même email invité ?
  const rUser  = r.user_id || null;
  const rEmail = String(r.authorEmail || "").toLowerCase();
  return (uid && rUser === uid) || (!!emailKey && rEmail === emailKey);
});

if (tooSoon) {
  return res.status(429).json({
    error: "Vous avez déjà laissé un avis pour ce produit aujourd’hui. Réessayez demain 🙏"
  });
}




    const r = Math.max(1, Math.min(5, Number(rating || 0)));
    const txt = clampString(content, 3000);
    const name = clampString(authorName || '', 120);
    const email = String(authorEmail || '').trim().toLowerCase();

    if (!pid || !txt || !email) return res.status(400).json({ error: 'Champs requis (productId, content, email)' });

    const review = {
      id: crypto.randomUUID(),
      productId: pid,
      rating: r,
      content: txt,
      authorName: name,
      authorEmail: email,
      user_id: req.user?.id || null,
      createdAt: new Date().toISOString(),
      ip: req.ip || '',
      approved: false,
      approvedAt: null,
      verifiedPurchase: false,
      pointsAwarded: false,
      pointsAwardedAt: null,
      awarded_user_id: null,
    };

    const list = await readReviews();
    list.unshift(review);
    await writeReviews(list);

    res.status(201).json({ ok: true, id: review.id });
  }catch(e){
    console.error('reviews/submit:', e);
    res.status(500).json({ error: 'Impossible d’enregistrer l’avis' });
  }
});

// Lister les avis approuvés d’un produit
app.get('/reviews/by-product/:productId', async (req, res) => {
  try{
    const pid = String(req.params.productId || '');
    const list = await readReviews();
    const out = list
      .filter(r => r.productId === pid && r.approved)
      .sort((a,b)=> (a.createdAt < b.createdAt ? 1 : -1));
    res.json(out);
  }catch{
    res.status(500).json({ error: 'Impossible de charger les avis' });
  }
});









/* =======================
 *  Admin — STATS (rôle requis)
 * ======================= */
app.get('/admin/stats', adminRequired, async (req, res) => {
  try {
    const orders = await readJson(ORDERS_PATH, []);
    // Tri du plus récent au plus ancien
    orders.sort((a,b)=> (a.createdAt < b.createdAt ? 1 : -1));

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const dayMs = 24*3600*1000;

    // bornes
    const since7  = now.getTime() - 7 * dayMs;
    const since30 = now.getTime() - 30 * dayMs;

    const isPaid = (o) => (o.payment_status || 'paid') === 'paid';

    // Aggrégats
    let revAll = 0, rev30 = 0, rev7 = 0, revToday = 0;
    let nAll = 0, n30 = 0, n7 = 0, nToday = 0;

    // Top produits (par qty & par CA)
    const byProduct = new Map(); // key: id or name
    const pushItem = (key, name, qty, revenue_cents) => {
      if (!key) key = name || 'unknown';
      const k = String(key);
      const cur = byProduct.get(k) || { key: k, name: name || String(k), qty: 0, revenue_cents: 0 };
      cur.qty += qty || 0;
      cur.revenue_cents += revenue_cents || 0;
      byProduct.set(k, cur);
    };

    // Séries par jour sur 30 jours
    const days = [];
    for (let i=29; i>=0; i--){
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const id = d.toISOString().slice(0,10); // YYYY-MM-DD
      days.push({ id, ts: d.getTime(), revenue_cents: 0, orders: 0 });
    }
    const dayIndex = new Map(days.map((d,idx)=>[d.id, idx]));

    for (const o of orders) {
      if (!isPaid(o)) continue;
      const ts = new Date(o.createdAt || o.created_at || 0).getTime();
      const amt = Number(o.amount_total || 0);

      // KPIs
      revAll += amt; nAll++;
      if (ts >= since30) { rev30 += amt; n30++; }
      if (ts >= since7)  { rev7  += amt; n7++;  }
      if (ts >= startOfToday) { revToday += amt; nToday++; }

      // Série journalière
      const dayId = new Date(ts).toISOString().slice(0,10);
      const idx = dayIndex.get(dayId);
      if (idx !== undefined) {
        days[idx].revenue_cents += amt;
        days[idx].orders += 1;
      }

      // Top produits (o.items internes prioritaire, sinon lignes Stripe)
      if (Array.isArray(o.items) && o.items.length) {
        for (const it of o.items) {
          const qty = Number(it.qty || 0);
          const unit_cents = Number(it.price_cents || it.priceCents || 0);
          const name = it.name || `#${it.id}`;
          const revenue_cents = unit_cents * qty || 0;
          pushItem(it.id || name, name, qty, revenue_cents);
        }
      } else if (Array.isArray(o.stripe_line_items) && o.stripe_line_items.length) {
        for (const li of o.stripe_line_items) {
          const qty = Number(li.qty ?? li.quantity ?? 1);
          // amount_subtotal = sous-total de la ligne en cents
          const revenue_cents = Number(li.amount_subtotal || 0);
          const name = li.name || 'Produit';
          pushItem(name, name, qty, revenue_cents);
        }
      }
    }

    const topByQty = Array.from(byProduct.values())
      .sort((a,b)=> b.qty - a.qty)
      .slice(0,10);

    const topByRevenue = Array.from(byProduct.values())
      .sort((a,b)=> b.revenue_cents - a.revenue_cents)
      .slice(0,10);

    const recentOrders = orders.slice(0, 10).map(o => ({
      id: o.id,
      createdAt: o.createdAt || o.created_at,
      email: o.email || null,
      amount_total: o.amount_total || 0,
      currency: (o.currency || 'eur').toLowerCase(),
      payment_status: o.payment_status || 'paid',
      items_count:
        (Array.isArray(o.items) && o.items.reduce((s, it)=>s+Number(it.qty||0),0)) ||
        (Array.isArray(o.stripe_line_items) && o.stripe_line_items.reduce((s, li)=>s+Number(li.qty??li.quantity??1),0)) ||
        0
    }));

    res.json({
      kpis: {
        revenue_today_cents: revToday, orders_today: nToday,
        revenue_7d_cents: rev7, orders_7d: n7,
        revenue_30d_cents: rev30, orders_30d: n30,
        revenue_all_cents: revAll, orders_all: nAll,
        avg_order_30d_cents: n30 ? Math.round(rev30 / n30) : 0
      },
      series_30d: days,       // [{id:'YYYY-MM-DD', revenue_cents, orders}]
      top_by_qty: topByQty,   // [{key,name,qty,revenue_cents}]
      top_by_revenue: topByRevenue,
      recent_orders: recentOrders
    });
  } catch (err) {
    console.error('stats error:', err);
    res.status(500).json({ error: 'Impossible de calculer les stats' });
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
 * Mes codes promo (utilisateur)
 * ======================= */
function extractUserPromoCodes(u){
  ensureRewardsShape(u);
  return (u.rewards_history || [])
    .filter(h => h && h.code && h.stripe_promotion_code_id)
    .map(h => ({
      code: h.code,
      created_at: h.at,
      amount_off_cents: h.amount_off_cents || 0,
      min_amount_cents: h.min_amount_cents || 0,
      stripe_promotion_code_id: h.stripe_promotion_code_id,
      stripe_coupon_id: h.stripe_coupon_id || null
    }));
}

app.get('/me/promo-codes', authRequired, async (req, res) => {
  try {
    const users = await readUsers();
    const me = users.find(u => u.id === req.user.id);
    if (!me) return res.status(404).json({ error: 'Utilisateur introuvable' });

    const mine = extractUserPromoCodes(me);

    const detailed = await Promise.all(mine.map(async (p) => {
      try {
        const promo = await stripe.promotionCodes.retrieve(p.stripe_promotion_code_id);
        const coupon = promo.coupon;

        const max = Number(promo.max_redemptions || 0);
        const redeemed = Number(promo.times_redeemed || 0);
        const couponValid = !!(coupon && coupon.valid);
        const promoActive  = !!promo.active;
        const stillUsable = promoActive && couponValid && (max === 0 || redeemed < max);

        return {
          ...p,
          active: stillUsable,
          times_redeemed: redeemed,
          max_redemptions: max,
          coupon_valid: couponValid
        };
      } catch (e) {
        return { ...p, active: false, error: 'not_found' };
      }
    }));

    detailed.sort((a,b)=> (a.created_at < b.created_at ? 1 : -1));
    res.json(detailed);
  } catch (e) {
    console.error('/me/promo-codes error:', e);
    res.status(500).json({ error: 'Impossible de charger les codes promo' });
  }
});





/* =======================
 * Avis produits (moderation + points à l'approbation)
 * ======================= */

/** GET public — liste des AVIS APPROUVÉS d’un produit */
app.get('/api/products/:id/reviews', async (req, res) => {
  try{
    const productId = String(req.params.id);
    const limit = Math.max(1, Math.min(200, Number(req.query.limit || 50)));
    const all = await readReviews();
    const approved = all
      .filter(r => r.productId === productId && r.approved === true)
      .sort((a,b)=> (a.createdAt < b.createdAt ? 1 : -1))
      .slice(0, limit)
      .map(r => ({
        id: r.id,
        productId: r.productId,
        rating: r.rating,
        content: r.content,
        authorName: r.authorName || (r.userName || 'Client'),
        createdAt: r.createdAt,
        verifiedPurchase: !!r.verifiedPurchase
      }));
    res.json(approved);
  }catch(e){
    res.status(500).json({ error: 'Impossible de charger les avis' });
  }
});

/** POST public — soumettre un AVIS (auth facultative) */
app.post('/reviews/submit', optionalAuth, async (req, res) => {
  try{
    const { productId, rating, content, authorName='', authorEmail='' } = req.body || {};
    const r = Number(rating);
    if (!productId) return res.status(400).json({ error: 'productId requis' });
    if (!Number.isFinite(r) || r < 1 || r > 5) return res.status(400).json({ error: 'note 1..5' });
    const text = clampString(content, 2000);
    if (!text) return res.status(400).json({ error: 'Contenu requis' });

    const nowIso = new Date().toISOString();
    const reviews = await readReviews();

    const rec = {
      id: crypto.randomUUID(),
      productId: String(productId),
      rating: r,
      content: text,
      createdAt: nowIso,
      // Auteur (si loggé : on rattache l’utilisateur)
      userId: req.user?.id || null,
      userEmail: req.user?.email || String(authorEmail || '').toLowerCase() || null,
      userName: req.user?.name || null,
      authorName: clampString(authorName || '', 120),

      // Modération
      approved: false,
      approvedAt: null,
      approvedBy: null,

      // Flags pour l’admin
      verifiedPurchase: false,   // calculé à l'approbation
      pointsAwarded: false,      // pour éviter double-crédit
    };

    reviews.push(rec);
    await writeReviews(reviews);

    res.status(201).json({ ok: true, pending: true, id: rec.id, message: 'Merci ! Votre avis sera publié après validation.' });
  }catch(e){
    res.status(500).json({ error: 'Impossible d’enregistrer l’avis' });
  }
});

/** Admin — lister les avis (pending/approved) */
app.get('/admin/reviews', adminRequired, async (req, res) => {
  try{
    const all = await readReviews();
    const status = String(req.query.status || 'all');
    let out = all.sort((a,b)=> (a.createdAt < b.createdAt ? 1 : -1));
    if (status === 'pending') out = out.filter(r => !r.approved);
    if (status === 'approved') out = out.filter(r => r.approved);
    res.json(out);
  }catch(e){
    res.status(500).json({ error: 'Impossible de charger les avis' });
  }
});

/** Admin — approuver un avis (et créditer si achat réel) */
app.post('/admin/reviews/:id/approve', adminRequired, async (req, res) => {
  try{
    const id = String(req.params.id);
    const reviews = await readReviews();
    const idx = reviews.findIndex(r => r.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Avis introuvable' });

    // Déjà approuvé ? on renvoie tel quel
    if (reviews[idx].approved) return res.json(reviews[idx]);

    // Marque approuvé
    reviews[idx].approved = true;
    reviews[idx].approvedAt = new Date().toISOString();
    reviews[idx].approvedBy = req.user?.id || 'admin';

    // Vérifie achat réel
    const buyerUserId = reviews[idx].userId || null;
    const buyerEmail  = reviews[idx].userEmail || null;
    const okBought = await hasBoughtProduct({ userId: buyerUserId, email: buyerEmail, productId: reviews[idx].productId });
    reviews[idx].verifiedPurchase = !!okBought;

    // Crédit de points si vérifié, si user connu, et pas déjà crédité
    if (okBought && !reviews[idx].pointsAwarded && buyerUserId){
      const credited = await addPointsByUserId(buyerUserId, +10, 'review_approved', { productId: reviews[idx].productId, reviewId: id });
      if (credited) reviews[idx].pointsAwarded = true;
    }

    await writeReviews(reviews);
    res.json(reviews[idx]);
  }catch(e){
    console.error('approve review:', e);
    res.status(500).json({ error: 'Impossible d’approuver' });
  }
});

/** Admin — rejeter/supprimer un avis */
app.delete('/admin/reviews/:id', adminRequired, async (req, res) => {
  try{
    const id = String(req.params.id);
    const reviews = await readReviews();
    const next = reviews.filter(r => r.id !== id);
    await writeReviews(next);
    res.json({ ok: true });
  }catch(e){
    res.status(500).json({ error: 'Impossible de supprimer' });
  }
});



/* =======================
 * Produits (public)
 * ======================= */
const productsRaw = await fs.readFile(PRODUCTS_PATH, 'utf-8');
let products = JSON.parse(productsRaw);
let PRODUCT_BY_ID   = Object.fromEntries(products.map(p => [String(p.id), p]));
let PRODUCT_BY_SLUG = Object.fromEntries(products.map(p => [String(p.slug), p]));
const cents = (p) => Number.isFinite(p.price_cents) ? p.price_cents : Math.round(Number(p.price) * 100);

// --- Helpers pour packs (décrément stock + compat 'products_included') ---
function normQty(x){
  const q = Number(x?.qty ?? x?.quantity ?? x?.q ?? 1);
  return Number.isFinite(q) && q > 0 ? q : 1;
}

/** Retourne un ID produit à partir d'un objet/slug/id. */
function resolveProductId(x){
  if (!x) return null;
  // objet avec id/slug ?
  if (typeof x === 'object') {
    if (x.id && PRODUCT_BY_ID[String(x.id)]) return String(x.id);
    if (x.slug && PRODUCT_BY_SLUG[String(x.slug)]) return String(PRODUCT_BY_SLUG[String(x.slug)].id);
    // parfois { productId: "..." }
    if (x.productId && PRODUCT_BY_ID[String(x.productId)]) return String(x.productId);
  }
  // string ?
  if (typeof x === 'string') {
    // si c'est un id connu
    if (PRODUCT_BY_ID[String(x)]) return String(x);
    // si c'est un slug connu
    if (PRODUCT_BY_SLUG[String(x)]) return String(PRODUCT_BY_SLUG[String(x)].id);
  }
  return null;
}

/** Récupère la définition composants d’un pack sous divers alias, et normalise en [{id, qty}]. 
 *  Supporte : pack_items, components, bundle, contents, items, products_included (slugs/id).
 */
function getPackDefFromProduct(p){
  if (!p || typeof p !== 'object') return null;
  const aliases = ['pack_items','components','bundle','contents','items','products_included'];
  for (const key of aliases){
    const raw = p[key];
    if (!Array.isArray(raw) || raw.length === 0) continue;

    const list = raw.map(entry => {
      // cas simple: tableau de strings (slugs ou ids)
      if (typeof entry === 'string') {
        const id = resolveProductId(entry);
        return id ? { id, qty: 1 } : null;
      }
      // cas objet (peut contenir id/slug/productId/qty)
      const id = resolveProductId(entry);
      const qty = normQty(entry);
      return id ? { id, qty } : null;
    }).filter(Boolean);

    if (list.length) return list;
  }
  return null;
}

/** Développe les lignes du panier en composants finaux à décrémenter. */
function expandItemsToStockMap(items){
  const acc = new Map(); // id -> qty total à décrémenter
  for (const line of Array.isArray(items) ? items : []){
    const lineQty = normQty(line);

    // 1) custom pack (le front envoie components)
    if (Array.isArray(line?.components) && line.components.length){
      for (const c of line.components){
        const cid = resolveProductId(c);
        const q = normQty(c) * lineQty;
        if (!cid || q <= 0) continue;
        acc.set(cid, (acc.get(cid) || 0) + q);
      }
      continue;
    }

    // 2) pack préconfiguré
    const pid = resolveProductId(line?.id ?? line);
    if (pid) {
      const packDef = getPackDefFromProduct(PRODUCT_BY_ID[pid]);
      if (packDef) {
        for (const c of packDef){
          const q = normQty(c) * lineQty;
          acc.set(c.id, (acc.get(c.id) || 0) + q);
        }
        continue;
      }
      // 3) produit simple
      acc.set(pid, (acc.get(pid) || 0) + lineQty);
    }
  }
  return acc;
}

/** Stock effectif d’un pack = min( floor(stock_component_i / qty_i) ).
 *  Si le pack a un stock propre (p.stock), on prend le min(packStockCalculé, p.stock).
 *  Si un composant est introuvable/sans stock numérique → 0.
 */
function computePackStock(p){
  const def = getPackDefFromProduct(p);
  if (!def || !def.length) {
    // pas un pack : renvoyer son stock tel quel si numérique, sinon null
    return Number.isFinite(p.stock) ? p.stock : null;
  }
  let minAvail = Infinity;
  for (const c of def){
    const comp = PRODUCT_BY_ID[c.id];
    if (!comp || !Number.isFinite(comp.stock)) return 0; // composant manquant = pas de dispo
    const avail = Math.floor(comp.stock / Math.max(1, normQty(c)));
    if (avail < minAvail) minAvail = avail;
  }
  // pack.stock peut brider la dispo
  const packLimit = Number.isFinite(p.stock) ? p.stock : Infinity;
  const eff = Math.max(0, Math.min(minAvail, packLimit));
  return Number.isFinite(eff) ? eff : 0;
}






app.get('/api/products', (req, res) => {
  const out = products.map(p => {
    const isPack = String(p.category || p.type || '').toLowerCase() === 'pack';
    const stock = isPack ? computePackStock(p) : (Number.isFinite(p.stock) ? p.stock : null);
    return {
      id: String(p.id),
      slug: String(p.slug),
      name: p.name,
      brand: p.brand,
      image: p.image || null,
      images: Array.isArray(p.images) ? p.images : undefined,
      price_cents: cents(p),
      stock,
      category: p.category || p.type || null,
      skin_types: Array.isArray(p.skin_types) ? p.skin_types : [],
      tags: Array.isArray(p.tags) ? p.tags : [],
    };
  });
  res.json(out);
});


app.get('/api/products/:slug', (req, res) => {
  const p = PRODUCT_BY_SLUG[req.params.slug];
  if (!p) return res.status(404).json({ error: 'Produit introuvable' });
  const isPack = String(p.category || p.type || '').toLowerCase() === 'pack';
  const stock = isPack ? computePackStock(p) : (Number.isFinite(p.stock) ? p.stock : null);
  res.json({ ...p, id: String(p.id), slug: String(p.slug), price_cents: cents(p), stock });
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
    await refreshProductsFromDisk();
    res.json({ id, stock: products[idx].stock });
  } catch { res.status(500).json({ error: 'Impossible de mettre à jour le stock' }); }
});





// Lister les avis (admin)
app.get('/admin/reviews', adminRequired, async (req, res) => {
  try{
    const { status = 'pending', productId } = req.query || {};
    const list = await readReviews();
    let out = list;
    if (status === 'pending') out = out.filter(r => !r.approved);
    else if (status === 'approved') out = out.filter(r => r.approved);
    if (productId) out = out.filter(r => r.productId === String(productId));
    out.sort((a,b)=> (a.createdAt < b.createdAt ? 1 : -1));
    res.json(out);
  }catch{
    res.status(500).json({ error: 'Impossible de lister les avis' });
  }
});

// Approuver un avis (et créditer si éligible)
app.patch('/admin/reviews/:id', adminRequired, async (req, res) => {
  try{
    const { approve = false } = req.body || {};
    const id = String(req.params.id || '');
    let list = await readReviews();
    const idx = list.findIndex(r => r.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Avis introuvable' });

    const review = list[idx];
    if (approve && !review.approved) {
      // 1) approuver
      review.approved = true;
      review.approvedAt = new Date().toISOString();

      // 2) vérifier achat
      const product = PRODUCT_BY_ID[String(review.productId)] || null;
      const productName = product?.name || null;
      const verified = await hasPurchasedProduct(review.user_id, review.authorEmail, review.productId, productName);
      review.verifiedPurchase = !!verified;

      // 3) créditer (une seule fois par produit/utilisateur)
      let pointsOk = false;
      let creditedUserId = null;

      if (verified) {
        const users = await readUsers();

        // Trouver le user (id prioritaire, sinon par email)
        let uIdx = review.user_id ? users.findIndex(u => u.id === review.user_id) : -1;
        if (uIdx === -1 && review.authorEmail) {
          const key = String(review.authorEmail).toLowerCase();
          uIdx = users.findIndex(u => u.email === key);
        }

        if (uIdx !== -1) {
          const u = ensureRewardsShape(users[uIdx]);

          // déjà primé pour ce produit ?
          const awardedMap = (u.reviews_meta.awardedPerProduct ||= {});
          const already = !!awardedMap[String(review.productId)];

          if (!already) {
            const ok = await addPointsByUserId(u.id, 10, 'review_approved', {
              productId: review.productId,
              reviewId: review.id
            });
            if (ok) {
              awardedMap[String(review.productId)] = true; // marquer "premier avis" fait
              users[uIdx] = u;
              await writeUsers(users);
              pointsOk = true;
              creditedUserId = u.id;
            }
          }
        }
      }

      // 4) marquer l’avis
      review.pointsAwarded = !!pointsOk;
      review.pointsAwardedAt = pointsOk ? new Date().toISOString() : null;
      review.awarded_user_id = creditedUserId;

      list[idx] = review;
      await writeReviews(list);

      // 5) email de remerciement
      await sendReviewThankYouEmail(review.authorEmail, review.authorName, product?.name || 'votre produit', pointsOk);
    }

    res.json({ ok: true, review: list[idx] });
  }catch(e){
    console.error('admin/reviews/approve:', e);
    res.status(500).json({ error: 'Impossible de mettre à jour l’avis' });
  }
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

    const min = promo.restrictions?.minimum_amount || 0;
    let kind = null, percent_off = 0, amount_off_cents = 0, desc = "";

    if (coupon.amount_off) {
      kind = "fixed";
      amount_off_cents = Number(coupon.amount_off || 0);
      desc = `-${(amount_off_cents/100).toFixed(2)} €`;
    } else if (coupon.percent_off) {
      kind = "percent";
      percent_off = Number(coupon.percent_off || 0);
      desc = `-${percent_off}%`;
    }

    const minNote = min ? ` (dès ${(min/100).toFixed(2)} €)` : "";
    res.json({
      ok: true,
      promotion_code_id: promo.id,
      code: promo.code,
      description: `${desc}${minNote}`.trim(),
      kind,
      percent_off,
      amount_off_cents,
      min_cents: min
    });
  } catch (e) {
    res.status(400).json({ ok: false, error: e.message || "Code promo invalide." });
  }
});





app.post('/api/create-checkout-session', optionalAuth, async (req, res) => {
  try {
    const cartItems = Array.isArray(req.body.items) ? req.body.items : []; // [{id, qty}] côté front
    const promoCodeRaw = (req.body.promo_code || "").trim();

    // On va devoir lire le vrai contenu du panier pour chaque ligne.
    // Problème: côté front tu n'envoies que {id, qty}, donc ici on NE SAIT PAS
    // si "custom-pack-123" correspond à un pack custom et quelles sont ses infos (nom, prix remisé, composants...).
    //
    // => SOLUTION: on RECONSTRUIT les lignes intelligentes en lisant le panier du front directement
    //    Au lieu de juste "id, qty", le front doit nous envoyer TOUT l'objet.
    //
    // Donc AVANT TOUT, mets à jour startCheckout() dans PanierPage.jsx
    // (je te donne le code plus bas).
    //
    // Ici on suppose maintenant que req.body.items ressemble à ça :
    // [
    //   { type: "single", id: "p123", qty: 2 },
    //   {
    //     type: "custom_pack",
    //     name: "Pack personnalisé (Essentiel)",
    //     qty: 1,
    //     price_cents: 4590,
    //     components: [
    //       { id: "serum-123", qty: 1 },
    //       { id: "spf-456",   qty: 1 }
    //     ],
    //     meta: { discountPct: 0.10, packKind: "essentiel" }
    //   }
    // ]
    //
    // Si c'est bien ce format, on peut tout faire proprement 👇

    // ---- 1. Construire line_items pour Stripe
    //      - Pour un produit simple => price_data normal
    //      - Pour un pack custom => UNE ligne Stripe avec le total déjà remisé
    const line_items = cartItems.map((row) => {
      // PACK PERSONNALISÉ
      if (row.type === "custom_pack") {
        const unit_amount = Number(row.price_cents || 0); // prix total pack remisé
        const packName = row.name || "Pack personnalisé";

        return {
          quantity: Number(row.qty || 1),
          price_data: {
            currency: 'eur',
            unit_amount,
            product_data: {
              name: packName,
              description: "Pack personnalisé (remise incluse)",
            }
          }
        };
      }

      // PRODUIT SIMPLE
      const p = PRODUCT_BY_ID[String(row.id)];
      if (!p) {
        throw new Error(`Produit inconnu: ${row.id}`);
      }

      return {
        quantity: Number(row.qty || 1),
        price_data: {
          currency: 'eur',
          unit_amount: cents(p),
          product_data: {
            name: p.name,
            description: p.brand || undefined,
          },
        },
      };
    });

    // ---- 2. Calcul du total panier (pour déterminer les options de livraison)
    //      ATTENTION: pour les packs custom, le prix vient de row.price_cents,
    //                 pas de la somme brute des composants.
    const items_total_cents = cartItems.reduce((sum, row) => {
      if (row.type === "custom_pack") {
        return sum + Number(row.price_cents || 0) * Number(row.qty || 1);
      } else {
        const prod = PRODUCT_BY_ID[String(row.id)];
        if (!prod) return sum;
        return sum + cents(prod) * Number(row.qty || 1);
      }
    }, 0);

    const FREE_SHIPPING_THRESHOLD = 5000; // 50€
    const STANDARD_EUR = 490; // 4.90€
    const EXPRESS_EUR  = 990; // 9.90€

    const shipping_options = [];
    if (items_total_cents >= FREE_SHIPPING_THRESHOLD) {
      shipping_options.push({
        shipping_rate_data: {
          display_name: 'Livraison standard (gratuite)',
          fixed_amount: { amount: 0, currency: 'eur' },
          type: 'fixed_amount',
          delivery_estimate: {
            minimum:{unit:'business_day',value:2},
            maximum:{unit:'business_day',value:4}
          }
        }
      });
    } else {
      shipping_options.push({
        shipping_rate_data: {
          display_name: 'Livraison standard',
          fixed_amount: { amount: STANDARD_EUR, currency: 'eur' },
          type: 'fixed_amount',
          delivery_estimate: {
            minimum:{unit:'business_day',value:2},
            maximum:{unit:'business_day',value:4}
          }
        }
      });
    }
    shipping_options.push({
      shipping_rate_data: {
        display_name: 'Livraison express',
        fixed_amount: { amount: EXPRESS_EUR, currency: 'eur' },
        type: 'fixed_amount',
        delivery_estimate: {
          minimum:{unit:'business_day',value:1},
          maximum:{unit:'business_day',value:2}
        }
      }
    });

    // ---- 3. Vérifier le stock demandé avant de créer la session
    //      On a besoin d’une vue "aplatie" produit -> quantité totale
    //      comme dans le webhook.
    const wanted = new Map(); // idProduit -> qty totale
    for (const row of cartItems) {
      if (row.type === "custom_pack" && Array.isArray(row.components)) {
        const packQty = Number(row.qty || 1);
        for (const comp of row.components) {
          const pid = String(comp.id);
          const q = Number(comp.qty || 1) * packQty;
          wanted.set(pid, (wanted.get(pid) || 0) + q);
        }
      } else {
        const pid = String(row.id);
        const q = Number(row.qty || 1);
        wanted.set(pid, (wanted.get(pid) || 0) + q);
      }
    }

    // Vérif stock
    for (const [pid, need] of wanted.entries()) {
      const p = PRODUCT_BY_ID[pid];
      if (!p || !Number.isFinite(p.stock)) {
        return res.status(400).json({ error: `Produit indisponible (${pid})` });
      }
      if (need > p.stock) {
        return res.status(400).json({
          error: `Stock insuffisant pour ${p.name} (dispo: ${p.stock}, demandé: ${need})`
        });
      }
    }

    // ---- 4. Gestion du client Stripe
    let customerParams = {};
    let metadata = {
      // on stocke TOUT le panier brut dans metadata pour le webhook
      items: JSON.stringify(cartItems)
    };

    if (req.user) {
      const users = await readUsers();
      const me = users.find(u => u.id === req.user.id);
      if (me) {
        const customer = await ensureStripeCustomerForUser(me);
        if (customer) {
          customerParams = {
            customer: customer.id,
            customer_update: { shipping: 'auto', address: 'auto', name: 'auto' },
          };
        } else {
          const created = await stripe.customers.create({
            email: me.email,
            name: me.name || undefined
          });
          customerParams = {
            customer: created.id,
            customer_update: { shipping: 'auto' }
          };
        }
        metadata.userId = me.id;
      }
    } else {
      const { customerEmail } = req.body || {};
      if (customerEmail) {
        customerParams = { customer_email: customerEmail };
      }
    }

    // ---- 5. Appliquer le code promo (si valide)
    let discounts = [];
    if (promoCodeRaw) {
      try {
        const { promo } = await validatePromoOrThrow({
          code: promoCodeRaw,
          items_total_cents
        });
        discounts = [{ promotion_code: promo.id }];
      } catch (e) {
        return res.status(400).json({
          error: e.message || "Code promo invalide."
        });
      }
    }

    const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

    // ---- 6. Créer la session Checkout Stripe
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

/**
/* =======================
 * Contact (formulaire public)
 * ======================= */
app.post('/contact', async (req, res) => {
  try {
    const { name = "", email = "", subject = "", message = "" } = req.body || {};

    // Validations simples
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Champs requis: name, email, message' });
    }
    if (!isEmail(email)) {
      return res.status(400).json({ error: 'Email invalide' });
    }

    // Normalisation
    const record = {
      id: crypto.randomUUID(),
      at: new Date().toISOString(),
      name: clampString(name, 120),
      email: String(email).toLowerCase(),
      subject: clampString(subject, 200),
      message: clampString(message, 5000),
      ip: req.ip || req.connection?.remoteAddress || ''
    };

    // Lecture + append + écriture atomique
    const list = await readJson(CONTACTS_PATH, []);
    list.push(record);
    await writeJson(CONTACTS_PATH, list);

    // (Optionnel) mail de notification (ignoré si SMTP pas configuré)
    try {
      if (process.env.SMTP_HOST && process.env.MAIL_FROM && process.env.CONTACT_TO) {
        await mailer.sendMail({
          from: process.env.MAIL_FROM,
          to: process.env.CONTACT_TO,
          subject: `[Contact] ${record.subject || '(sans objet)'} — ${record.name}`,
          text: `De: ${record.name} <${record.email}>\n\n${record.message}`,
        });
      }
    } catch (e) {
      console.warn('⚠️ Mail contact non envoyé:', e?.message || e);
    }

    return res.status(201).json({ ok: true, id: record.id });
  } catch (e) {
    console.error('❌ /contact error:', e);
    return res.status(500).json({ error: 'Impossible d’enregistrer le message' });
  }
});


// petite aide HTML-escape
function escapeHtml(s){
  return String(s)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&#039;');
}


/* =======================
 * Launch
 * ======================= */
app.listen(PORT, () => {
  console.log(`✅ API OK: http://localhost:${PORT}`);
});

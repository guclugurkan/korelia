// scripts/generate-sitemap.mjs
import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// === Réglages ===
const SITE = "https://korelia.be"; // ton domaine canonique
const API  = process.env.VITE_API_URL || "http://localhost:4242";

// Pages statiques (complète si besoin)
const STATIC_PATHS = [
  "/", "/catalogue", "/marques", "/avantages", "/faq",
  "/contact", "/livraison", "/paiement-securise", "/cgv",
  "/confidentialite", "/mentions-legales", "/blog"
];

// Helpers
const xmlEscape = (s="") =>
  String(s)
    .replace(/&/g,"&amp;").replace(/</g,"&lt;")
    .replace(/>/g,"&gt;").replace(/"/g,"&quot;")
    .replace(/'/g,"&apos;");

const urlNode = ({ loc, lastmod=null, changefreq="weekly", priority=null }) => {
  const lines = [];
  lines.push("  <url>");
  lines.push(`    <loc>${xmlEscape(loc)}</loc>`);
  if (lastmod)    lines.push(`    <lastmod>${xmlEscape(lastmod)}</lastmod>`);
  if (changefreq) lines.push(`    <changefreq>${changefreq}</changefreq>`);
  if (priority!==null) lines.push(`    <priority>${priority}</priority>`);
  lines.push("  </url>");
  return lines.join("\n");
};

async function getProducts() {
  try {
    const r = await fetch(`${API}/api/products`, { cache: "no-store" });
    const list = await r.json();
    return Array.isArray(list) ? list : [];
  } catch (e) {
    console.warn("[sitemap] produits KO:", e?.message || e);
    return [];
  }
}

async function getBlogPosts() {
  // On importe directement ton fichier src/blog/blogdata.js (ESM)
  // Pas besoin de bundler : le script tourne en Node pendant le build.
  try {
    const blogPath = path.join(__dirname, "..", "src", "blog", "blogdata.js");
    const mod = await import(pathToFileURL(blogPath).href);
    const posts = Array.isArray(mod.posts) ? mod.posts : [];
    return posts;
  } catch (e) {
    console.warn("[sitemap] blog KO:", e?.message || e);
    return [];
  }
}

async function main() {
  const urls = [];
  const today = new Date().toISOString().slice(0,10);

  // 1) Pages statiques
  for (const p of STATIC_PATHS) {
    urls.push(urlNode({
      loc: `${SITE}${p}`,
      lastmod: today,
      changefreq: "monthly",
      priority: p === "/" ? "1.0" : "0.6"
    }));
  }

  // 2) Produits
  const products = await getProducts();
  for (const p of products) {
    const slug = p.slug || p.Slug;
    if (!slug) continue;
    const last = p.updatedAt || p.updated_at || today;
    urls.push(urlNode({
      loc: `${SITE}/produit/${slug}`,
      lastmod: new Date(last).toISOString().slice(0,10),
      changefreq: "weekly",
      priority: "0.8"
    }));
  }

  // 3) Blog
  const posts = await getBlogPosts();
  for (const b of posts) {
    if (!b?.slug) continue;
    const d = b.date || today;
    urls.push(urlNode({
      loc: `${SITE}/blog/${b.slug}`,
      lastmod: new Date(d).toISOString().slice(0,10),
      changefreq: "monthly",
      priority: "0.5"
    }));
  }

  // 4) XML final
  const xml =
`<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:xhtml="http://www.w3.org/1999/xhtml"
>
${urls.join("\n")}
</urlset>
`;

  // 5) Écriture dans /public
  const outPath = path.join(__dirname, "..", "public", "sitemap.xml");
  fs.writeFileSync(outPath, xml, "utf8");
  console.log("✅ sitemap.xml généré →", outPath);
}

main().catch((err) => {
  console.error("❌ génération sitemap échouée:", err);
  process.exit(1);
});

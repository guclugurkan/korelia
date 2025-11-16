// Vercel Serverless Function (Node.js)
// Génère un sitemap.xml dynamique

export default async function handler(req, res) {
  const site = "https://korelia.be";

  // 1) Pages "fixes" de ton site (à compléter selon ton App.jsx)
  const staticPaths = [
    "/", "/catalogue", "/favoris", "/panier",
    "/blog", "/avantages", "/marques",
    "/contact", "/about", "/suivi-commande",
    "/sitemap", "/faq", "/livraison", "/retours",
    "/paiement-securise", "/cgv", "/confidentialite", "/mentions-legales",
    "/composer-pack", "/guide-skincare", "/quiz", "/mes-commandes"
  
    
  ];

  // 2) Récupération des produits pour générer /produit/:slug
  const apiBase = process.env.FRONT_API_URL; // ex: https://korelia-api.onrender.com
  let dynamicProductUrls = [];
  try {
    const r = await fetch(`${apiBase}/api/products`, { cache: "no-store" });
    const products = await r.json();
    if (Array.isArray(products)) {
      dynamicProductUrls = products.map(p => `/produit/${p.slug}`);
    }
  } catch (e) {
    // si l'API n'est pas joignable, on continue juste avec les pages statiques
    console.warn("sitemap: fetch products failed:", e?.message || e);
  }

  // (Optionnel) si tu as des packs avec /pack/:slug Depuis l’API ou un JSON :
  // const packSlugs = ["pack-peau-seche-budget", ...];
  // const dynamicPackUrls = packSlugs.map(s => `/pack/${s}`);

  const urls = [
    ...staticPaths,
    ...dynamicProductUrls,
    // ...dynamicPackUrls,
  ];

  const lastmod = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  // 3) Génération du XML
  const xmlItems = urls.map(u => {
    const loc = `${site}${u}`;
    // changefreq et priority sont indicatifs ; adapte si tu veux
    return `
  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${u === "/" ? "1.0" : "0.7"}</priority>
  </url>`;
  }).join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${xmlItems}
</urlset>`.trim();

  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.status(200).send(xml);
}

/**
 * Actualiza public/contributions-cache.json llamando a la API de contributions.
 * Pensado para ejecutarse cada 10 min (p. ej. con GitHub Actions).
 * La API sirve este archivo al instante; este script lo refresca.
 *
 * Uso: SITE_URL=https://tu-dominio.vercel.app node scripts/update-contributions-cache.js
 */

const fs = require("fs");
const path = require("path");

const SITE_URL = process.env.SITE_URL || "https://mariana-dev-portfolio.vercel.app";
const USER = process.env.GITHUB_USER || "Mariana-Codebase";
const API_URL = `${SITE_URL.replace(/\/$/, "")}/api/contributions?user=${encodeURIComponent(USER)}&limit=6&includeRefs=0`;

const CACHE_PATH = path.join(__dirname, "..", "public", "contributions-cache.json");

async function main() {
  try {
    const res = await fetch(API_URL);
    if (!res.ok) {
      console.error("API error:", res.status, await res.text());
      process.exit(1);
    }
    const data = await res.json();
    if (!data.user || !Array.isArray(data.contributions)) {
      console.error("Invalid API response shape");
      process.exit(1);
    }
    fs.writeFileSync(CACHE_PATH, JSON.stringify(data, null, 0), "utf8");
    console.log("OK: contributions-cache.json updated with", data.contributions.length, "contributions");
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

main();

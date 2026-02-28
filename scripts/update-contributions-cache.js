/**
 * Actualiza public/contributions-cache.json llamando a la API de contributions.
 * Pensado para ejecutarse cada 10 min (p. ej. con GitHub Actions).
 * La API sirve este archivo al instante; este script lo refresca.
 *
 * Uso: SITE_URL=https://tu-dominio.vercel.app node scripts/update-contributions-cache.js
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SITE_URL = process.env.SITE_URL;
const USER = process.env.GITHUB_USER || "Mariana-Codebase";
if (!SITE_URL) {
  console.error("Missing SITE_URL env var");
  process.exit(1);
}
const API_URL = `${SITE_URL.replace(/\/$/, "")}/api/contributions?user=${encodeURIComponent(USER)}&limit=6&includeRefs=0`;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
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

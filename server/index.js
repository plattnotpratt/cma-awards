import Database from "better-sqlite3";
import express from "express";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildAwardViewModel } from "../src/utils/awardViewModel.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const dbPath = path.resolve(repoRoot, "scripts/data/placed_applications.db");
const indexHtmlPath = path.resolve(repoRoot, "dist/index.html");
const port = Number.parseInt(process.env.PORT ?? "3001", 10);
const openWaterApiKey = process.env.OPEN_WATER_API_KEY ?? process.env.VITE_OPEN_WATER_API_KEY;
const openWaterClientKey = process.env.OPEN_WATER_CLIENT_KEY ?? process.env.VITE_OPEN_WATER_CLIENT_KEY;
const openWaterOrganizationCode = process.env.OPEN_WATER_ORGANIZATION_CODE ?? process.env.VITE_OPEN_WATER_ORGANIZATION_CODE;
const openWaterApiBaseUrl = process.env.OPEN_WATER_API_BASE_URL ?? "https://api.secure-platform.com/v2";

const db = new Database(dbPath, { readonly: true });
const app = express();

app.disable("etag");
app.set("trust proxy", true);
app.use(express.json());

app.use("/local-api", (_req, res, next) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.set("Pragma", "no-cache");
  res.set("Expires", "0");
  res.set("Surrogate-Control", "no-store");
  next();
});

const listAwards = db.prepare(`
  SELECT
    id,
    program_id AS programId,
    name,
    author,
    organization,
    category_name AS categoryName,
    category_path AS categoryPath,
    placement,
    finalized_at_utc AS finalizedAtUtc
  FROM placed_applications
  ORDER BY category_path COLLATE NOCASE, placement COLLATE NOCASE, name COLLATE NOCASE
`);

function openWaterHeaders() {
  const headers = {
    Accept: "application/json",
    "X-ApiKey": openWaterApiKey,
    "X-ClientKey": openWaterClientKey,
    "X-SuppressEmails": "true",
  };

  if (openWaterOrganizationCode) {
    headers["X-OrganizationCode"] = openWaterOrganizationCode;
  }

  return headers;
}

async function fetchAwardApplication(id) {
  const response = await fetch(`${openWaterApiBaseUrl}/Applications/${encodeURIComponent(id)}`, {
    headers: openWaterHeaders(),
  });
  const body = await response.text();

  return {
    body,
    contentType: response.headers.get("content-type") ?? "application/json",
    ok: response.ok,
    status: response.status,
    statusText: response.statusText,
  };
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function compactText(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function trimToMetaLength(value, maxLength = 220) {
  const text = compactText(value);
  if (text.length <= maxLength) return text;

  return `${text.slice(0, maxLength - 3).trim()}...`;
}

function requestOrigin(req) {
  const proto = (req.get("x-forwarded-proto") ?? req.protocol ?? "https").split(",")[0].trim();
  const host = (req.get("x-forwarded-host") ?? req.get("host") ?? "awards.catholicmediaassociation.org")
    .split(",")[0]
    .trim();

  return `${proto}://${host}`;
}

function awardMetaTags(award, req) {
  const origin = process.env.PUBLIC_SITE_URL ?? requestOrigin(req);
  const url = new URL(req.originalUrl, origin).toString();
  const imageUrl = new URL("/main_logo.png", origin).toString();
  const entryTitle = compactText(award.entryTitle ?? award.name ?? "CMA Award Winner");
  const placement = compactText(award.winnerLabel ?? "Award Winner");
  const category = compactText(award.categoryName ?? award.categoryPath ?? "CMA Awards");
  const year = award.year ? ` ${award.year}` : "";
  const title = trimToMetaLength(`${entryTitle} - ${placement} | CMA Awards`, 90);
  const description = trimToMetaLength(`${entryTitle} received ${placement} in ${category}${year}.`);

  return `
  <link rel="canonical" href="${escapeHtml(url)}" />
  <meta name="description" content="${escapeHtml(description)}" />
  <meta property="og:site_name" content="Catholic Media Association Awards" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:url" content="${escapeHtml(url)}" />
  <meta property="og:type" content="website" />
  <meta property="og:image" content="${escapeHtml(imageUrl)}" />
  <meta property="og:image:alt" content="Catholic Media Association Awards" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <meta name="twitter:image" content="${escapeHtml(imageUrl)}" />`;
}

function injectAwardMeta(html, award, req) {
  const title = escapeHtml(trimToMetaLength(`${award.entryTitle ?? award.name ?? "CMA Award Winner"} - ${award.winnerLabel ?? "Award Winner"} | CMA Awards`, 90));
  const withoutTitle = html.replace(/<title>.*?<\/title>/i, `<title>${title}</title>`);
  const withoutFallbackMeta = withoutTitle.replace(/\s*<meta\s+(?:name|property)="(?:description|og:[^"]+|twitter:[^"]+)"[^>]*>/gi, "");

  return withoutFallbackMeta.replace("</head>", `${awardMetaTags(award, req)}\n</head>`);
}

app.get("/local-api/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/local-api/awards", (_req, res) => {
  res.json({ items: listAwards.all() });
});

app.get("/local-api/awards/:id", async (req, res) => {
  if (!openWaterApiKey || !openWaterClientKey) {
    res.status(500).json({ error: "OpenWater credentials are not configured" });
    return;
  }

  try {
    const response = await fetchAwardApplication(req.params.id);

    if (!response.ok) {
      res.status(response.status).json({ error: response.body || response.statusText });
      return;
    }

    res.type(response.contentType).send(response.body);
  } catch (error) {
    console.error("OpenWater detail request failed", error);
    res.status(502).json({ error: "OpenWater request failed" });
  }
});

app.get("/awards/:id", async (req, res) => {
  if (!fs.existsSync(indexHtmlPath)) {
    res.status(500).send("Built app HTML is unavailable");
    return;
  }

  if (!openWaterApiKey || !openWaterClientKey) {
    res.status(500).send("OpenWater credentials are not configured");
    return;
  }

  try {
    const response = await fetchAwardApplication(req.params.id);

    if (!response.ok) {
      res.status(response.status).send(response.body || response.statusText);
      return;
    }

    const award = buildAwardViewModel(JSON.parse(response.body), req.params.id);
    const html = fs.readFileSync(indexHtmlPath, "utf8");

    res.type("html").send(award ? injectAwardMeta(html, award, req) : html);
  } catch (error) {
    console.error("Award metadata request failed", error);
    res.status(502).send("Award metadata request failed");
  }
});

const server = app.listen(port, () => {
  console.log(`Local awards API listening on http://localhost:${port}`);
});

let shuttingDown = false;

function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;

  console.log(`Received ${signal}; shutting down API server...`);

  const forceExit = setTimeout(() => {
    console.error("API server shutdown timed out");
    process.exit(1);
  }, 8000);
  forceExit.unref();

  server.close((error) => {
    if (error) {
      console.error("API server shutdown failed", error);
      process.exit(1);
    }

    db.close();
    process.exit(0);
  });
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

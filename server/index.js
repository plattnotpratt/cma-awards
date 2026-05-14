import Database from "better-sqlite3";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const dbPath = path.resolve(repoRoot, "scripts/data/placed_applications.db");
const port = Number.parseInt(process.env.PORT ?? "3001", 10);
const openWaterApiKey = process.env.OPEN_WATER_API_KEY ?? process.env.VITE_OPEN_WATER_API_KEY;
const openWaterClientKey = process.env.OPEN_WATER_CLIENT_KEY ?? process.env.VITE_OPEN_WATER_CLIENT_KEY;
const openWaterOrganizationCode = process.env.OPEN_WATER_ORGANIZATION_CODE ?? process.env.VITE_OPEN_WATER_ORGANIZATION_CODE;
const openWaterApiBaseUrl = process.env.OPEN_WATER_API_BASE_URL ?? "https://api.secure-platform.com/v2";

const db = new Database(dbPath, { readonly: true });
const app = express();

app.disable("etag");

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
    category_name AS categoryName,
    category_path AS categoryPath,
    placement,
    finalized_at_utc AS finalizedAtUtc
  FROM placed_applications
  ORDER BY category_path COLLATE NOCASE, placement COLLATE NOCASE, name COLLATE NOCASE
`);

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

  const id = encodeURIComponent(req.params.id);
  const headers = {
    Accept: "application/json",
    "X-ApiKey": openWaterApiKey,
    "X-ClientKey": openWaterClientKey,
    "X-SuppressEmails": "true",
  };

  if (openWaterOrganizationCode) {
    headers["X-OrganizationCode"] = openWaterOrganizationCode;
  }

  try {
    const response = await fetch(`${openWaterApiBaseUrl}/Applications/${id}`, { headers });
    const body = await response.text();

    if (!response.ok) {
      res.status(response.status).json({ error: body || response.statusText });
      return;
    }

    res.type(response.headers.get("content-type") ?? "application/json").send(body);
  } catch (error) {
    console.error("OpenWater detail request failed", error);
    res.status(502).json({ error: "OpenWater request failed" });
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

import Database from "better-sqlite3";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const dbPath = path.resolve(repoRoot, "scripts/data/placed_applications.db");
const port = Number.parseInt(process.env.PORT ?? "3001", 10);

const db = new Database(dbPath, { readonly: true });
const app = express();

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
  res.json({ ok: true, dbPath });
});

app.get("/local-api/awards", (_req, res) => {
  res.json({ items: listAwards.all() });
});

app.listen(port, () => {
  console.log(`Local awards API listening on http://localhost:${port}`);
});

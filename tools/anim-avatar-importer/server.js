/**
 * server.js
 *
 * Standalone HTTP server for the Gail Animation Importer tool.
 * Port 8888.  Zero external dependencies — pure Node.js http/fs/path.
 *
 * Routes
 * ──────────────────────────────────────────────────────────────────
 * Static files
 *   GET /                          → index.html
 *   GET /avatar-import             → avatar-import.html
 *   GET /index.html
 *   GET /avatar-import.html
 *
 * API — catalog
 *   GET  /api/status               → server version, catalog stats
 *   GET  /api/catalog              → full CatalogEntry[] (may be large)
 *   GET  /api/catalog/category/:cat→only clips in that category
 *   POST /api/catalog/rebuild      → rescan library, rebuild catalog.json
 *
 * API — validation
 *   POST /api/validate             → body: { id } → ValidationResult
 *   POST /api/validate-batch       → body: { ids: string[] } → ValidationResult[]
 *
 * API — preview
 *   GET  /api/preview-glb?id=...   → serve GLB stripped-in-memory for Three.js
 *   GET  /api/handoff-glb/:name    → serve handoff bundle animation GLBs
 *
 * API — import
 *   POST /api/import               → body: { ids: string[] }  → ImportResult[]
 *   POST /api/import-single        → body: { id: string }     → ImportResult
 *   GET  /api/imported             → list data/import-log.json
 *
 * All API responses are JSON.
 * All errors return { error: "message" } with appropriate HTTP status.
 */

"use strict";

const http  = require("http");
const fs    = require("fs");
const path  = require("path");
const url   = require("url");

const { buildCatalog, loadCatalog, validateEntry, catalogStats, CATEGORIES } = require("./lib/catalog");
const { validateGlb }   = require("./lib/validate");
const { stripFix }      = require("./lib/strip-fix");
const { importClip, importBatch, IMPORT_LOG_PATH } = require("./lib/importer");
const { ANIMATION_LIBRARY_ROOT, CATALOG_PATH, HANDOFF_ANIM_DIR, TARGET_ANIMATIONS_DIR } = require("./lib/paths");

const PORT    = 8888;
const STATIC  = __dirname; // index.html and avatar-import.html live here

// Handoff animations (small, pre-processed — safe to serve directly)
const VERSION = "1.0.0";

// ── MIME types ────────────────────────────────────────────────────

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js":   "application/javascript; charset=utf-8",
  ".css":  "text/css; charset=utf-8",
  ".glb":  "model/gltf-binary",
  ".json": "application/json; charset=utf-8",
  ".ico":  "image/x-icon",
};

// ── Helpers ───────────────────────────────────────────────────────

function sendJson(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    "Content-Type":        "application/json; charset=utf-8",
    "Content-Length":      Buffer.byteLength(body),
    "Access-Control-Allow-Origin": "*",
  });
  res.end(body);
}

function sendError(res, status, message) {
  sendJson(res, status, { error: message });
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", c => chunks.push(c));
    req.on("end",  () => {
      try { resolve(JSON.parse(Buffer.concat(chunks).toString("utf8"))); }
      catch (e) { reject(new Error("Invalid JSON body")); }
    });
    req.on("error", reject);
  });
}

function serveFile(res, filePath, extraHeaders) {
  const ext = path.extname(filePath).toLowerCase();
  let data;
  try { data = fs.readFileSync(filePath); }
  catch (e) {
    res.writeHead(404); res.end("Not found");
    return;
  }
  res.writeHead(200, {
    "Content-Type":   MIME[ext] || "application/octet-stream",
    "Content-Length": data.length,
    "Cache-Control":  "no-cache",
    "Access-Control-Allow-Origin": "*",
    ...(extraHeaders || {}),
  });
  res.end(data);
}

// ── Route table ───────────────────────────────────────────────────

async function handleRequest(req, res) {
  const parsed   = url.parse(req.url, true);
  const pathname = parsed.pathname.replace(/\/+$/, "") || "/";
  const method   = req.method.toUpperCase();
  const query    = parsed.query;

  // ── CORS preflight ──────────────────────────────────────────
  if (method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin":  "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    });
    res.end();
    return;
  }

  // ── Static HTML ─────────────────────────────────────────────
  if (method === "GET") {
    if (pathname === "/" || pathname === "/index.html") {
      return serveFile(res, path.join(STATIC, "index.html"));
    }
    if (pathname === "/avatar-import" || pathname === "/avatar-import.html") {
      return serveFile(res, path.join(STATIC, "avatar-import.html"));
    }
  }

  // ── API routes ───────────────────────────────────────────────

  // GET /api/status
  if (method === "GET" && pathname === "/api/status") {
    let cats = null;
    try {
      const catalog = loadCatalog();
      cats = catalogStats(catalog);
    } catch (e) { /* catalog not built yet */ }

    return sendJson(res, 200, {
      version:     VERSION,
      port:        PORT,
      catalog:     cats,
      libraryRoot: ANIMATION_LIBRARY_ROOT,
      catalogPath: CATALOG_PATH,
      importLog:   IMPORT_LOG_PATH,
      targetDir:   TARGET_ANIMATIONS_DIR,
      handoffDir:  HANDOFF_ANIM_DIR,
      serverTime:  new Date().toISOString(),
    });
  }

  // GET /api/catalog
  if (method === "GET" && pathname === "/api/catalog") {
    try {
      const catalog  = loadCatalog();
      const catFilter = query.category;
      const filtered = catFilter
        ? catalog.filter(e => e.category === catFilter)
        : catalog;
      return sendJson(res, 200, { total: filtered.length, entries: filtered });
    } catch (e) {
      return sendError(res, 500, `Catalog load failed: ${e.message}`);
    }
  }

  // GET /api/catalog/category/:cat
  const catMatch = pathname.match(/^\/api\/catalog\/category\/([^/]+)$/);
  if (method === "GET" && catMatch) {
    const cat = catMatch[1];
    if (!CATEGORIES.includes(cat)) {
      return sendError(res, 400, `Unknown category "${cat}". Valid: ${CATEGORIES.join(", ")}`);
    }
    try {
      const catalog = loadCatalog();
      const clips   = catalog.filter(e => e.category === cat);
      return sendJson(res, 200, { category: cat, total: clips.length, entries: clips });
    } catch (e) {
      return sendError(res, 500, e.message);
    }
  }

  // POST /api/catalog/rebuild
  if (method === "POST" && pathname === "/api/catalog/rebuild") {
    try {
      // Stream progress via chunked response
      res.writeHead(200, {
        "Content-Type": "application/json; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
        "Transfer-Encoding": "chunked",
      });
      let done = 0;
      const entries = buildCatalog({
        onProgress: ({ current }) => {
          done++;
          if (done % 100 === 0) {
            res.write(JSON.stringify({ progress: done, current }) + "\n");
          }
        },
      });
      const stats = catalogStats(entries);
      res.end(JSON.stringify({ done: entries.length, stats }));
    } catch (e) {
      // Already wrote headers above — best we can do is end
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  // POST /api/validate
  if (method === "POST" && pathname === "/api/validate") {
    let body;
    try { body = await readBody(req); }
    catch (e) { return sendError(res, 400, e.message); }

    const { id } = body;
    if (!id) return sendError(res, 400, "body.id required");

    try {
      const result = validateEntry(id);
      return sendJson(res, 200, result);
    } catch (e) {
      return sendError(res, 404, e.message);
    }
  }

  // POST /api/validate-batch
  if (method === "POST" && pathname === "/api/validate-batch") {
    let body;
    try { body = await readBody(req); }
    catch (e) { return sendError(res, 400, e.message); }

    const { ids } = body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return sendError(res, 400, "body.ids must be a non-empty array");
    }

    const results = [];
    for (const id of ids) {
      try {
        results.push(validateEntry(id));
      } catch (e) {
        results.push({ id, error: e.message });
      }
    }
    return sendJson(res, 200, { total: results.length, results });
  }

  // GET /api/preview-glb?id=<category/name>
  if (method === "GET" && pathname === "/api/preview-glb") {
    const id = query.id;
    if (!id) return sendError(res, 400, "?id= required");

    let catalog;
    try { catalog = loadCatalog(); }
    catch (e) { return sendError(res, 500, e.message); }

    const entry = catalog.find(e => e.id === id);
    if (!entry) return sendError(res, 404, `Clip not found: ${id}`);

    // Strip-fix in memory (no disk write) — safe to send to browser
    const sf = stripFix(entry.filePath, { skipIfAlreadyFixed: true });
    if (sf.status === "error") return sendError(res, 500, `Strip-fix error: ${sf.message}`);

    res.writeHead(200, {
      "Content-Type":   "model/gltf-binary",
      "Content-Length": sf.buf.length,
      "Cache-Control":  "no-cache",
      "Access-Control-Allow-Origin": "*",
    });
    res.end(sf.buf);
    return;
  }

  // GET /api/handoff-glb/:name
  const handoffMatch = pathname.match(/^\/api\/handoff-glb\/([^/]+\.glb)$/);
  if (method === "GET" && handoffMatch) {
    const name     = handoffMatch[1];
    // Prevent path traversal
    const safeName = path.basename(name);
    if (safeName !== name) return sendError(res, 400, "Invalid filename");
    const filePath = path.join(HANDOFF_ANIM_DIR, safeName);
    if (!fs.existsSync(filePath)) return sendError(res, 404, `Handoff GLB not found: ${safeName}`);
    return serveFile(res, filePath);
  }

  // GET /api/handoff-glbs  (list available handoff animations)
  if (method === "GET" && pathname === "/api/handoff-glbs") {
    let files = [];
    try {
      files = fs.readdirSync(HANDOFF_ANIM_DIR)
        .filter(f => f.endsWith(".glb") && !f.endsWith(".bak"))
        .sort();
    } catch (e) { /* directory may not exist */ }
    return sendJson(res, 200, { files });
  }

  // POST /api/import-single
  if (method === "POST" && pathname === "/api/import-single") {
    let body;
    try { body = await readBody(req); }
    catch (e) { return sendError(res, 400, e.message); }

    const { id } = body;
    if (!id) return sendError(res, 400, "body.id required");

    let catalog;
    try { catalog = loadCatalog(); }
    catch (e) { return sendError(res, 500, e.message); }

    const entry = catalog.find(e => e.id === id);
    if (!entry) return sendError(res, 404, `Clip not found: ${id}`);

    const result = importClip(entry.filePath, entry.id, { overwrite: body.overwrite === true });
    return sendJson(res, result.status === "error" ? 422 : 200, result);
  }

  // POST /api/import
  if (method === "POST" && pathname === "/api/import") {
    let body;
    try { body = await readBody(req); }
    catch (e) { return sendError(res, 400, e.message); }

    const { ids } = body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return sendError(res, 400, "body.ids must be a non-empty array");
    }

    let catalog;
    try { catalog = loadCatalog(); }
    catch (e) { return sendError(res, 500, e.message); }

    const clips = ids.map(id => {
      const entry = catalog.find(e => e.id === id);
      if (!entry) return { sourceId: id, sourcePath: null };
      return { sourceId: entry.id, sourcePath: entry.filePath };
    }).filter(c => c.sourcePath !== null);

    const { results, summary } = importBatch(clips, { overwrite: body.overwrite === true });
    return sendJson(res, 200, { summary, results });
  }

  // GET /api/imported
  if (method === "GET" && pathname === "/api/imported") {
    let log = [];
    try {
      if (fs.existsSync(IMPORT_LOG_PATH)) {
        log = JSON.parse(fs.readFileSync(IMPORT_LOG_PATH, "utf8"));
      }
    } catch (e) { /* empty */ }
    return sendJson(res, 200, { total: log.length, entries: log });
  }

  // 404
  sendError(res, 404, `Not found: ${method} ${pathname}`);
}

// ── Start ─────────────────────────────────────────────────────────

const server = http.createServer((req, res) => {
  handleRequest(req, res).catch(err => {
    console.error("[server] Unhandled error:", err);
    try { sendError(res, 500, "Internal server error"); } catch (_) {}
  });
});

server.listen(PORT, "127.0.0.1", () => {
  console.log("╔══════════════════════════════════════════════╗");
  console.log("║   Gail Animation Importer  v" + VERSION + "         ║");
  console.log("╠══════════════════════════════════════════════╣");
  console.log("║   http://localhost:" + PORT + "/                    ║");
  console.log("║   http://localhost:" + PORT + "/avatar-import       ║");
  console.log("╚══════════════════════════════════════════════╝");
});

server.on("error", err => {
  if (err.code === "EADDRINUSE") {
    console.error(`\n[ERROR] Port ${PORT} is already in use.\nStop the existing server and try again.\n`);
  } else {
    console.error("[ERROR]", err);
  }
  process.exit(1);
});

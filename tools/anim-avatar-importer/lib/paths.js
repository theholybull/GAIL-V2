"use strict";

const fs = require("fs");
const path = require("path");

const TOOL_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(TOOL_ROOT, "..", "..");
const LEGACY_PARENT_ROOT = path.resolve(REPO_ROOT, "..");

const REPO_LIBRARY_ROOT = process.env.GAIL_ANIMATION_LIBRARY_ROOT
  ? path.resolve(process.env.GAIL_ANIMATION_LIBRARY_ROOT)
  : path.resolve(REPO_ROOT, "data", "animation-library", "converted_animations_20260401");

const LEGACY_LIBRARY_ROOT = path.resolve(LEGACY_PARENT_ROOT, "converted_animations_20260401");

const ANIMATION_LIBRARY_ROOT = fs.existsSync(REPO_LIBRARY_ROOT)
  ? REPO_LIBRARY_ROOT
  : LEGACY_LIBRARY_ROOT;

const TOOL_DATA_ROOT = path.resolve(REPO_ROOT, "data", "animation-importer");
const CATALOG_PATH = path.resolve(TOOL_DATA_ROOT, "catalog.json");
const IMPORT_LOG_PATH = path.resolve(TOOL_DATA_ROOT, "import-log.json");
const TARGET_ANIMATIONS_DIR = path.resolve(REPO_ROOT, "playcanvas-app", "assets", "animations");
const HANDOFF_ANIM_DIR = path.resolve(
  REPO_ROOT,
  "playcanvas-app",
  "assets",
  "handoffs",
  "playcanvas_handoff_20260330",
  "assets",
  "animations"
);

function ensureToolDataRoot() {
  if (!fs.existsSync(TOOL_DATA_ROOT)) {
    fs.mkdirSync(TOOL_DATA_ROOT, { recursive: true });
  }
}

module.exports = {
  TOOL_ROOT,
  REPO_ROOT,
  REPO_LIBRARY_ROOT,
  LEGACY_LIBRARY_ROOT,
  ANIMATION_LIBRARY_ROOT,
  TOOL_DATA_ROOT,
  CATALOG_PATH,
  IMPORT_LOG_PATH,
  TARGET_ANIMATIONS_DIR,
  HANDOFF_ANIM_DIR,
  ensureToolDataRoot,
};

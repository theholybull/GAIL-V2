import { createServer } from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { createDomainServices } from "../bootstrap";
import type { HttpRoute } from "./http-types";
import { HttpError } from "./http-error";
import { sendJson } from "./json-response";
import { matchPath } from "./path-match";
import { readJsonBody } from "./read-json-body";
import { getRequestMeta } from "./request-meta";
import { createDomainHttpRoutes } from "./domain-http-routes";

export interface GailHttpServerOptions {
  port?: number;
  host?: string;
}

export function createGailHttpServer(options: GailHttpServerOptions = {}) {
  const domain = createDomainServices();
  const routes = createDomainHttpRoutes(domain.services);
  const port = options.port ?? 4180;
  const host = options.host?.trim() || "0.0.0.0";
  const repoRoot = resolve(process.cwd(), "..");
  const panelRoot = resolve(repoRoot, "web-control-panel");
  const playcanvasRoot = resolve(repoRoot, "playcanvas-app");
  const playcanvasDistRoot = resolve(repoRoot, "playcanvas-app", "dist", "playcanvas-app");
  const sharedDistRoot = resolve(repoRoot, "playcanvas-app", "dist", "shared");
  const vendorRoot = resolve(repoRoot, "playcanvas-app", "node_modules");
  const repoLibraryAssetsRoot = resolve(repoRoot, "data", "animation-library", "converted_animations_20260401");
  const legacyLibraryAssetsRoot = resolve(repoRoot, "..", "converted_animations_20260401");
  const libraryAssetsRoot = process.env.GAIL_WORKBENCH_LIBRARY_ROOT?.trim()
    || (existsSync(repoLibraryAssetsRoot) ? repoLibraryAssetsRoot : legacyLibraryAssetsRoot);

  const server = createServer(async (request, response) => {
    const method = request.method as HttpRoute["method"] | undefined;
    const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);

    response.setHeader("Access-Control-Allow-Origin", "*");
    response.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
    response.setHeader(
      "Access-Control-Allow-Headers",
      "Authorization,Content-Type,x-gail-device-id,x-gail-device-type,x-gail-mode,x-gail-private-persona,x-gail-explicit-local-save,x-gail-device-token",
    );

    if (request.method === "OPTIONS") {
      response.statusCode = 204;
      response.end();
      return;
    }

    if (method === "GET") {
      const mobileServed = tryServeMobileClient(request, url, playcanvasRoot, response);
      if (mobileServed) {
        return;
      }

      const staticServed = tryServeControlPanel(url.pathname, panelRoot, response);
      if (staticServed) {
        return;
      }

      const clientServed = tryServeWorkLiteClient(url.pathname, playcanvasRoot, playcanvasDistRoot, sharedDistRoot, vendorRoot, libraryAssetsRoot, response);
      if (clientServed) {
        return;
      }
    }

    // Diagnostic report endpoint
    if (method === "POST" && url.pathname === "/api/diag-report") {
      const body = await readJsonBody(request) as Record<string, unknown>;
      console.log("\n=== ANIMATION DIAGNOSTIC REPORT ===");
      if (body && Array.isArray((body as any).log)) {
        const lines = ((body as any).log as unknown[])
          .filter((line): line is string => typeof line === "string")
          .slice(0, 200)
          .map((line) => line.slice(0, 1000));
        for (const line of lines) {
          console.log(line);
        }
      }
      console.log("=== END DIAGNOSTIC REPORT ===\n");
      sendJson(response, 200, { ok: true });
      return;
    }

    if (!method || !["GET", "POST", "PATCH", "DELETE"].includes(method)) {
      sendJson(response, 405, { error: "Method not allowed." });
      return;
    }

    const routeMatch = findRoute(routes, method, url.pathname);
    if (!routeMatch) {
      sendJson(response, 404, { error: "Route not found." });
      return;
    }

    try {
      const resolvedIdentity = domain.services.authService.resolveAuthenticatedDevice(request);
      const meta = getRequestMeta(request, {
        authMode: domain.services.authService.getStatus().authMode,
        authenticated: resolvedIdentity?.authenticated ?? false,
        device: resolvedIdentity?.device,
        identitySource: resolvedIdentity?.identitySource ?? "headers",
      });
      const body = method === "GET" || method === "DELETE" ? undefined : await readJsonBody(request);
      await routeMatch.route.handle({
        params: routeMatch.params,
        body,
        request,
        response,
        meta,
      });
    } catch (error) {
      if (error instanceof HttpError) {
        sendJson(response, error.statusCode, {
          error: error.message,
          details: error.details,
        });
        return;
      }

      const message = error instanceof Error ? error.message : "Unknown error.";
      sendJson(response, 400, { error: message });
    }
  });

  return {
    port,
    host,
    routes,
    domain,
    server,
    start() {
      server.listen(port, host);
      return { port, host, routeCount: routes.length };
    },
  };
}

function findRoute(
  routes: HttpRoute[],
  method: HttpRoute["method"],
  path: string,
): { route: HttpRoute; params: Record<string, string> } | undefined {
  for (const route of routes) {
    if (route.method !== method) {
      continue;
    }

    const match = matchPath(route.path, path);
    if (match.matched) {
      return {
        route,
        params: match.params,
      };
    }
  }

  return undefined;
}

function tryServeMobileClient(
  request: import("node:http").IncomingMessage,
  url: URL,
  playcanvasRoot: string,
  response: import("node:http").ServerResponse,
): boolean {
  const pathname = url.pathname;
  const publicMobileOrigin = "https://gail.guysinthegarage.com";
  const forwardedProto = String(request.headers["x-forwarded-proto"] ?? "").split(",")[0]?.trim().toLowerCase();
  const isSecureRequest = forwardedProto === "https";

  if (
    pathname === "/gail"
    || pathname === "/gail/"
    || pathname === "/gail-lite"
    || pathname === "/gail-lite/"
  ) {
    response.statusCode = 302;
    response.setHeader("Location", "/gail-mobile/");
    response.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
    response.end();
    return true;
  }

  if ((pathname === "/gail-mobile" || pathname === "/gail-mobile/") && !isSecureRequest) {
    response.statusCode = 302;
    response.setHeader("Location", `${publicMobileOrigin}${pathname}${url.search}${url.hash}`);
    response.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
    response.end();
    return true;
  }

  if (pathname.startsWith("/gail-mobile/assets/")) {
    const relativePath = pathname.slice("/gail-mobile/assets/".length);
    const filePath = resolve(playcanvasRoot, "assets", relativePath);
    const assetsRoot = resolve(playcanvasRoot, "assets");
    if (!filePath.startsWith(assetsRoot) || !existsSync(filePath)) {
      response.statusCode = 404;
      response.end("Not found");
      return true;
    }
    sendStaticFile(filePath, response);
    return true;
  }

  if (pathname === "/gail-mobile" || pathname === "/gail-mobile/") {
    const htmlFile = resolve(playcanvasRoot, "gail-mobile-client.html");
    if (!existsSync(htmlFile)) {
      response.statusCode = 404;
      response.end("gail-mobile-client.html not found");
      return true;
    }
    sendStaticFile(htmlFile, response);
    return true;
  }
  return false;
}

function tryServeControlPanel(pathname: string, panelRoot: string, response: import("node:http").ServerResponse): boolean {
  const shellEntryFile = resolve(panelRoot, "operator-studio-shell.html");

  if (pathname === "/studio" || pathname === "/studio/" || pathname === "/panel/studio") {
    response.statusCode = 302;
    response.setHeader("Location", "/panel/operator-studio-shell.html");
    response.end();
    return true;
  }

  if (pathname === "/display" || pathname === "/display/") {
    response.statusCode = 302;
    response.setHeader("Location", "/client/work-lite/");
    response.end();
    return true;
  }

  if (pathname === "/display/phone") {
    response.statusCode = 302;
    response.setHeader("Location", "/client/phone/");
    response.end();
    return true;
  }

  if (pathname === "/display/proof") {
    response.statusCode = 302;
    response.setHeader("Location", "/client/proof/");
    response.end();
    return true;
  }

  if (pathname === "/panel") {
    response.statusCode = 302;
    response.setHeader("Location", "/panel/");
    response.end();
    return true;
  }

  if (
    pathname.startsWith("/panel/module/") ||
    pathname === "/build/control-tower" ||
    pathname === "/governance/control"
  ) {
    sendStaticFile(shellEntryFile, response);
    return true;
  }

  if (!pathname.startsWith("/panel/")) {
    return false;
  }

  const relativePath = pathname === "/panel/" ? "index.html" : pathname.slice("/panel/".length);
  const filePath = resolve(panelRoot, relativePath);

  if (!filePath.startsWith(panelRoot) || !existsSync(filePath)) {
    response.statusCode = 404;
    response.end("Not found");
    return true;
  }

  sendStaticFile(filePath, response);
  return true;
}

function tryServeWorkLiteClient(
  pathname: string,
  playcanvasRoot: string,
  playcanvasDistRoot: string,
  sharedDistRoot: string,
  vendorRoot: string,
  libraryAssetsRoot: string,
  response: import("node:http").ServerResponse,
): boolean {
  if (pathname === "/client/asset-manifest" || pathname === "/client/runtime-settings" || pathname === "/client/device-display-profiles" || pathname === "/client/wardrobe-presets" || pathname.startsWith("/client/wardrobe-presets/")) {
    return false;
  }

  if (pathname === "/client" || pathname === "/client/work-lite") {
    response.statusCode = 302;
    response.setHeader("Location", "/client/work-lite/");
    response.end();
    return true;
  }

  if (pathname === "/client/proof") {
    response.statusCode = 302;
    response.setHeader("Location", "/client/proof/");
    response.end();
    return true;
  }

  if (pathname === "/client/phone") {
    response.statusCode = 302;
    response.setHeader("Location", "/client/phone/");
    response.end();
    return true;
  }

  if (
    !pathname.startsWith("/client/work-lite/") &&
    !pathname.startsWith("/client/phone/") &&
    !pathname.startsWith("/client/proof/") &&
    !pathname.startsWith("/client/styles/") &&
    !pathname.startsWith("/client/") &&
    !pathname.startsWith("/shared/") &&
    !pathname.startsWith("/vendor/") &&
    !pathname.startsWith("/client-assets/") &&
    !pathname.startsWith("/library-assets/")
  ) {
    return false;
  }

  let filePath: string;
  if (pathname === "/client/work-lite/") {
    filePath = resolve(playcanvasRoot, "index.html");
  } else if (pathname === "/client/anim-test/") {
    filePath = resolve(playcanvasRoot, "anim-test.html");
  } else if (pathname === "/client/phone/") {
    filePath = resolve(playcanvasRoot, "phone.html");
  } else if (pathname === "/client/proof/") {
    filePath = resolve(playcanvasRoot, "proof.html");
  } else if (pathname.startsWith("/client/styles/")) {
    filePath = resolve(playcanvasRoot, "src", pathname.slice("/client/".length));
  } else if (pathname.startsWith("/client-assets/")) {
    let assetRelativePath = pathname.slice("/client-assets/".length);
    try {
      assetRelativePath = decodeURIComponent(assetRelativePath);
    } catch {
      response.statusCode = 400;
      response.end("Bad asset path");
      return true;
    }
    filePath = resolve(playcanvasRoot, "assets", assetRelativePath);
  } else if (pathname.startsWith("/library-assets/")) {
    let libraryRelativePath = pathname.slice("/library-assets/".length);
    try {
      libraryRelativePath = decodeURIComponent(libraryRelativePath);
    } catch {
      response.statusCode = 400;
      response.end("Bad library asset path");
      return true;
    }
    filePath = resolve(libraryAssetsRoot, libraryRelativePath);
  } else if (pathname.startsWith("/shared/")) {
    filePath = resolveEsmStaticPath(sharedDistRoot, pathname.slice("/shared/".length));
  } else if (pathname.startsWith("/vendor/")) {
    filePath = resolveEsmStaticPath(vendorRoot, pathname.slice("/vendor/".length));
  } else {
    filePath = resolveClientModulePath(resolve(playcanvasDistRoot, "src"), pathname.slice("/client/".length));
  }

  const allowedRoots = [playcanvasRoot, playcanvasDistRoot, sharedDistRoot, vendorRoot, libraryAssetsRoot].filter(Boolean);
  if (!allowedRoots.some((root) => filePath.startsWith(root)) || !existsSync(filePath)) {
    response.statusCode = 404;
    response.end("Not found");
    return true;
  }

  sendStaticFile(filePath, response);
  return true;
}

function sendStaticFile(filePath: string, response: import("node:http").ServerResponse) {
  let fileSize = 0;
  try {
    const stats = statSync(filePath);
    if (!stats.isFile()) {
      response.statusCode = 404;
      response.end("Not found");
      return;
    }
    fileSize = stats.size;
  } catch {
    response.statusCode = 404;
    response.end("Not found");
    return;
  }

  const fileStream = createReadStream(filePath);
  fileStream.on("error", (err) => {
    console.error(`Static file read error: ${err.message}`);
    if (!response.headersSent) {
      response.statusCode = 500;
      response.end("Static file unavailable");
      return;
    }
    if (!response.writableEnded) {
      response.end();
    }
  });
  response.statusCode = 200;
  response.setHeader("Content-Type", getContentType(filePath));
  response.setHeader("Content-Length", String(fileSize));
  response.setHeader("Permissions-Policy", "camera=(self), microphone=(self), screen-wake-lock=(self)");
  const normalized = filePath.replace(/\\/g, "/").toLowerCase();
  const isCacheableAsset = /\.(glb|gltf|bin|png|jpg|jpeg|webp|gif|svg|mp3|wav|m4a|js|mjs|css|json)$/.test(normalized)
    && !normalized.endsWith(".html");
  response.setHeader("Cache-Control", isCacheableAsset ? "public, max-age=3600, must-revalidate" : "no-store");
  fileStream.pipe(response);
}

function resolveEsmStaticPath(root: string, relativePath: string): string {
  const direct = resolve(root, relativePath);
  if (existsSync(direct) && !isDirectory(direct)) {
    return direct;
  }

  const withJs = `${direct}.js`;
  if (existsSync(withJs) && !isDirectory(withJs)) {
    return withJs;
  }

  const asIndexJs = resolve(direct, "index.js");
  if (existsSync(asIndexJs) && !isDirectory(asIndexJs)) {
    return asIndexJs;
  }

  return direct;
}

function resolveClientModulePath(root: string, relativePath: string): string {
  const direct = resolveEsmStaticPath(root, relativePath);
  if (existsSync(direct) && !isDirectory(direct)) {
    return direct;
  }

  if (!relativePath.includes("/")) {
    for (const subdir of ["managers", "state", "config"]) {
      const nested = resolveEsmStaticPath(resolve(root, subdir), relativePath);
      if (existsSync(nested) && !isDirectory(nested)) {
        return nested;
      }
    }
  }

  return direct;
}

function isDirectory(filePath: string): boolean {
  try {
    return statSync(filePath).isDirectory();
  } catch {
    return false;
  }
}

function getContentType(filePath: string): string {
  if (filePath.endsWith(".html")) {
    return "text/html; charset=utf-8";
  }

  if (filePath.endsWith(".js")) {
    return "text/javascript; charset=utf-8";
  }

  if (filePath.endsWith(".mjs")) {
    return "text/javascript; charset=utf-8";
  }

  if (filePath.endsWith(".css")) {
    return "text/css; charset=utf-8";
  }

  if (filePath.endsWith(".jpg") || filePath.endsWith(".jpeg")) {
    return "image/jpeg";
  }

  if (filePath.endsWith(".png")) {
    return "image/png";
  }

  if (filePath.endsWith(".webp")) {
    return "image/webp";
  }

  if (filePath.endsWith(".glb")) {
    return "model/gltf-binary";
  }

  if (filePath.endsWith(".gltf")) {
    return "model/gltf+json";
  }

  if (filePath.endsWith(".wasm")) {
    return "application/wasm";
  }

  return "application/octet-stream";
}

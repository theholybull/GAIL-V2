import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { relative, resolve } from "node:path";
import { workLiteAssetManifest, type WorkLiteAssetKind, type WorkLiteAssetManifest } from "../../shared/contracts/work-lite-assets";
import { AvatarRuntimeConfigService } from "./avatar-runtime-config-service";

export interface ClientAssetStatus {
  id: string;
  name: string;
  kind: WorkLiteAssetKind;
  slot?: string;
  autoLoad?: boolean;
  expectedPath: string;
  present: boolean;
  required?: boolean;
  resolvedPath?: string;
  fileSizeBytes?: number;
}

interface AssetCatalogEntry {
  id: string;
  name: string;
  kind: ClientAssetStatus["kind"];
  slot?: string;
  required?: boolean;
  autoLoad?: boolean;
  expectedPath: string;
  searchDirectories?: string[];
  extensions: string[];
}

interface AssetCatalog {
  coreAssetIds?: string[];
  assets: AssetCatalogEntry[];
}

interface IntegrationAssetManifest {
  package_name?: string;
  runtime_profile?: {
    orientation_angles?: [number, number, number];
    skeleton_root_hints?: string[];
    viewport_defaults?: {
      modelX?: number;
      modelY?: number;
      modelZ?: number;
      modelYaw?: number;
      modelPitch?: number;
      modelRoll?: number;
      modelScaleMultiplier?: number;
      cameraX?: number;
      cameraY?: number;
      cameraZ?: number;
      targetX?: number;
      targetY?: number;
      targetZ?: number;
    };
  };
  avatar?: {
    body?: string;
    hair?: string;
    clothing?: string;
    accessories?: string;
    flat_texture?: string;
    texture_tiers?: {
      low?: string;
      medium?: string;
      high?: string;
    };
  };
  states?: {
    idle?: {
      default?: string;
      alt?: string;
      cover?: string;
    };
    listening?: {
      ack?: string;
      focus?: string;
    };
    gesture?: Record<string, string>;
  };
}

export class ClientAssetsService {
  private readonly repoRoot = resolve(process.cwd(), "..");
  private readonly avatarRuntimeConfigService = new AvatarRuntimeConfigService();

  getManifest(selectedAssetRoot?: string) {
    const assetsRoot = resolve(this.repoRoot, "playcanvas-app", "assets");
    const normalizedSelectedRoot = this.normalizeAssetRoot(selectedAssetRoot, assetsRoot);
    const integrationManifest = normalizedSelectedRoot
      ? this.loadIntegrationManifest(assetsRoot, normalizedSelectedRoot)
      : undefined;
    const avatarRuntimeConfig = this.avatarRuntimeConfigService.getConfig();
    const catalog = integrationManifest && normalizedSelectedRoot
      ? this.buildCatalogFromIntegrationManifest(integrationManifest, normalizedSelectedRoot)
      : avatarRuntimeConfig.assetCatalog;
    const requiredDirectories = Array.from(
      new Set(
        catalog.assets.flatMap((entry) => [
          resolve(assetsRoot, entry.expectedPath),
          ...(entry.searchDirectories ?? []).map((directory) => resolve(assetsRoot, directory)),
        ]).map((entry) => entry.replace(/[\\/][^\\/]+$/, "")),
      ),
    );
    const assetStatuses: ClientAssetStatus[] = catalog.assets.map((entry) =>
      this.statusFor(entry, assetsRoot, normalizedSelectedRoot),
    );

    return {
      ...workLiteAssetManifest,
      coreAssetIds: catalog.coreAssetIds ?? [],
      personaMap: avatarRuntimeConfig.personaMap,
      avatarReady: assetStatuses.filter((entry) => entry.required !== false).every((entry) => entry.present),
      assets: assetStatuses,
      missingAssets: assetStatuses.filter((entry) => !entry.present).map((entry) => entry.name),
      requiredDirectories,
      selectedAssetRoot: normalizedSelectedRoot,
      availableAssetRoots: this.listAssetRoots(assetsRoot),
      selectedBundleName: integrationManifest?.package_name,
      manifestSource: integrationManifest ? "integration_manifest" : "catalog",
      runtimeProfile: integrationManifest?.runtime_profile
        ? {
            orientationAngles: integrationManifest.runtime_profile.orientation_angles,
            skeletonRootHints: integrationManifest.runtime_profile.skeleton_root_hints,
            viewportDefaults: integrationManifest.runtime_profile.viewport_defaults,
          }
        : undefined,
      textureTiers: integrationManifest && normalizedSelectedRoot
        ? this.buildTextureTierPaths(assetsRoot, normalizedSelectedRoot, integrationManifest)
        : undefined,
    };
  }

  private loadCatalog(): AssetCatalog {
    const catalog = this.avatarRuntimeConfigService.getAssetCatalog();
    if (catalog.assets.length > 0) {
      return catalog;
    }
    const catalogPath = resolve(
      this.repoRoot,
      "playcanvas-app",
      "config",
      "work-lite-modules.gail.json",
    );
    return this.readJsonFile<AssetCatalog>(catalogPath);
  }

  listAssetRoots(assetsRoot = resolve(this.repoRoot, "playcanvas-app", "assets")): string[] {
    const roots = new Set<string>();
    this.collectAssetRootsRecursive(assetsRoot, assetsRoot, roots, 0);
    return Array.from(roots).sort((left, right) => left.localeCompare(right));
  }

  private loadIntegrationManifest(assetsRoot: string, selectedAssetRoot: string): IntegrationAssetManifest | undefined {
    const root = resolve(assetsRoot, selectedAssetRoot);
    const manifestPath = resolve(root, "manifests", "integration_asset_manifest.json");
    if (!existsSync(manifestPath)) {
      return undefined;
    }
    return this.readJsonFile<IntegrationAssetManifest>(manifestPath);
  }

  private readJsonFile<TValue>(filePath: string): TValue {
    const raw = readFileSync(filePath, "utf-8").replace(/^\uFEFF/, "");
    return JSON.parse(raw) as TValue;
  }

  private buildCatalogFromIntegrationManifest(
    manifest: IntegrationAssetManifest,
    selectedAssetRoot: string,
  ): AssetCatalog {
    const assets: AssetCatalogEntry[] = [];
    const scopedPath = (assetPath: string | undefined) => {
      if (!assetPath) {
        return undefined;
      }
      return `${selectedAssetRoot}/${assetPath}`.replaceAll("\\", "/").replace(/\/+/g, "/");
    };
    const pushAsset = (
      id: string,
      name: string,
      kind: ClientAssetStatus["kind"],
      expectedPath: string | undefined,
      options?: { slot?: string; required?: boolean; autoLoad?: boolean },
    ) => {
      if (!expectedPath) {
        return;
      }
      assets.push({
        id,
        name,
        kind,
        expectedPath,
        slot: options?.slot,
        required: options?.required,
        autoLoad: options?.autoLoad,
        extensions: [".glb", ".gltf", ".jpg", ".jpeg", ".jfif", ".png", ".webp"],
      });
    };

    pushAsset("base_avatar", "bundle body", "avatar", scopedPath(manifest.avatar?.body), {
      slot: "base",
      required: true,
      autoLoad: true,
    });
    pushAsset("bundle_hair", "bundle hair", "hair", scopedPath(manifest.avatar?.hair), {
      slot: "hair",
      required: false,
      autoLoad: true,
    });
    pushAsset("bundle_clothing", "bundle clothing", "clothing", scopedPath(manifest.avatar?.clothing), {
      slot: "outfit",
      required: false,
      autoLoad: true,
    });
    pushAsset("bundle_accessories", "bundle accessories", "accessory", scopedPath(manifest.avatar?.accessories), {
      slot: "accessories",
      required: false,
      autoLoad: true,
    });
    pushAsset("bundle_flat_texture", "bundle flat texture", "texture", scopedPath(manifest.avatar?.flat_texture), {
      slot: "flat_base",
      required: false,
      autoLoad: false,
    });
    pushAsset("idle_default", "idle default", "animation", scopedPath(manifest.states?.idle?.default), {
      slot: "idle",
      required: true,
      autoLoad: true,
    });
    pushAsset("idle_alt", "idle alt", "animation", scopedPath(manifest.states?.idle?.alt), {
      slot: "idle_alt",
      required: false,
      autoLoad: false,
    });
    pushAsset("idle_cover", "idle cover", "animation", scopedPath(manifest.states?.idle?.cover), {
      slot: "idle_cover",
      required: false,
      autoLoad: false,
    });
    pushAsset("listen_focus", "listen focus", "animation", scopedPath(manifest.states?.listening?.focus), {
      slot: "listen",
      required: false,
      autoLoad: false,
    });
    pushAsset("listen_ack", "listen ack", "animation", scopedPath(manifest.states?.listening?.ack), {
      slot: "ack",
      required: false,
      autoLoad: false,
    });
    for (const [gestureName, gesturePath] of Object.entries(manifest.states?.gesture ?? {})) {
      pushAsset(`gesture_${gestureName}`, `gesture ${gestureName}`, "animation", scopedPath(gesturePath), {
        slot: `gesture_${gestureName}`,
        required: false,
        autoLoad: false,
      });
    }

    return {
      coreAssetIds: assets.filter((asset) => asset.required !== false).map((asset) => asset.id),
      assets,
    };
  }

  private statusFor(entry: AssetCatalogEntry, assetsRoot: string, selectedAssetRoot?: string): ClientAssetStatus {
    const expectedAbsolutePath = resolve(assetsRoot, entry.expectedPath);
    const directories = (entry.searchDirectories ?? []).map((directory) =>
      resolve(assetsRoot, directory),
    );
    const selectedRootPath = selectedAssetRoot ? resolve(assetsRoot, selectedAssetRoot) : undefined;
    const resolvedPath = this.findScopedAsset(selectedRootPath, entry)
      ?? (existsSync(expectedAbsolutePath) ? expectedAbsolutePath : this.findFirstAsset(directories, entry));
    return {
      id: entry.id,
      name: entry.name,
      kind: entry.kind,
      slot: entry.slot,
      autoLoad: entry.autoLoad,
      expectedPath: this.toManifestPath(entry.expectedPath, assetsRoot),
      present: Boolean(resolvedPath),
      required: entry.required,
      resolvedPath: resolvedPath ? this.toManifestPath(resolvedPath, assetsRoot) : undefined,
      fileSizeBytes: resolvedPath ? this.safeFileSize(resolvedPath) : undefined,
    };
  }

  private findFirstAsset(directories: string[], entry: AssetCatalogEntry): string | undefined {
    for (const directory of directories) {
      const match = this.findFirstAssetRecursive(directory, entry);
      if (match) {
        return match;
      }
    }

    return undefined;
  }

  private findScopedAsset(directory: string | undefined, entry: AssetCatalogEntry): string | undefined {
    if (!directory || !existsSync(directory)) {
      return undefined;
    }
    return this.findFirstAssetRecursive(directory, entry);
  }

  private findFirstAssetRecursive(directory: string, entry: AssetCatalogEntry): string | undefined {
    if (!existsSync(directory)) {
      return undefined;
    }

    let bestMatch: { path: string; score: number } | undefined;
    for (const child of readdirSync(directory).map((entry) => resolve(directory, entry))) {
      let stats;
      try {
        stats = statSync(child);
      } catch {
        continue;
      }

      if (stats.isDirectory()) {
        const nested = this.findFirstAssetRecursive(child, entry);
        if (nested) {
          const score = this.scoreAssetMatch(nested, entry);
          if (score > 0 && (!bestMatch || score > bestMatch.score)) {
            bestMatch = { path: nested, score };
          }
        }
        continue;
      }

      if (
        stats.isFile() &&
        stats.size > 0 &&
        entry.extensions.some((extension) => child.toLowerCase().endsWith(extension))
      ) {
        const score = this.scoreAssetMatch(child, entry);
        if (score > 0 && (!bestMatch || score > bestMatch.score)) {
          bestMatch = { path: child, score };
        }
      }
    }

    return bestMatch?.path;
  }

  private scoreAssetMatch(candidatePath: string, entry: AssetCatalogEntry): number {
    const normalizedCandidate = this.normalizeToken(candidatePath.replaceAll("\\", "/"));
    const baseName = this.normalizeToken(candidatePath.split(/[\\/]/).pop() ?? "");
    const expectedBaseName = this.normalizeToken(entry.expectedPath.split(/[\\/]/).pop() ?? "");
    if (baseName === expectedBaseName) {
      return 1000;
    }

    const significantTokens = this.getSignificantAssetEntryTokens(entry);
    if (significantTokens.length > 0 && significantTokens.some((token) => !normalizedCandidate.includes(token))) {
      return 0;
    }

    if (entry.kind === "animation" && entry.slot) {
      const slotToken = this.normalizeToken(entry.slot);
      const hasSlotMatch = baseName.includes(slotToken) || normalizedCandidate.includes(slotToken);
      const expectedTokens = this.getAssetEntryTokens(entry);
      const hasNamedMatch = expectedTokens.some((token) => baseName.includes(token) || normalizedCandidate.includes(token));
      if (!hasSlotMatch && !hasNamedMatch) {
        return 0;
      }
    }

    let score = 0;
    for (const token of this.getAssetEntryTokens(entry)) {
      if (baseName.includes(token)) {
        score += 12;
      } else if (normalizedCandidate.includes(token)) {
        score += 5;
      }
    }

    if (entry.kind === "animation" && entry.slot && baseName.includes(this.normalizeToken(entry.slot))) {
      score += 18;
    }
    if (entry.slot && normalizedCandidate.includes(this.normalizeToken(entry.slot))) {
      score += 6;
    }

    return score;
  }

  private getAssetEntryTokens(entry: AssetCatalogEntry): string[] {
    return Array.from(
      new Set(
        [
          entry.id,
          entry.name,
          entry.slot,
          entry.kind,
          entry.expectedPath.split(/[\\/]/).pop(),
        ]
          .filter((value): value is string => Boolean(value))
          .flatMap((value) => this.normalizeToken(value).split("_"))
          .filter((value) => value.length >= 3 && !["glb", "gltf", "base", "animation", "avatar"].includes(value)),
      ),
    );
  }

  private getSignificantAssetEntryTokens(entry: AssetCatalogEntry): string[] {
    const genericTokens = new Set([
      "gail",
      "bundle",
      "base",
      "avatar",
      "glb",
      "gltf",
      "animation",
      "hair",
      "outfit",
    ]);
    return this.getAssetEntryTokens(entry).filter((token) => !genericTokens.has(token));
  }

  private normalizeToken(value: string): string {
    return value.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  }

  private normalizeAssetRoot(selectedAssetRoot: string | undefined, assetsRoot: string): string | undefined {
    if (!selectedAssetRoot) {
      return undefined;
    }
    const trimmed = selectedAssetRoot.replaceAll("\\", "/").trim().replace(/^\/+|\/+$/g, "");
    if (!trimmed) {
      return undefined;
    }
    const resolvedRoot = resolve(assetsRoot, trimmed);
    const normalizedResolvedRoot = resolvedRoot.toLowerCase();
    const normalizedAssetsRoot = assetsRoot.toLowerCase();
    if (!normalizedResolvedRoot.startsWith(normalizedAssetsRoot) || !existsSync(resolvedRoot) || !statSync(resolvedRoot).isDirectory()) {
      return undefined;
    }
    return trimmed;
  }

  private toManifestPath(pathValue: string, assetsRoot: string): string {
    const normalizedInput = pathValue.replaceAll("\\", "/").replace(/^\/+/, "");
    const absoluteCandidate = resolve(assetsRoot, normalizedInput);
    const relativeToAssets = relative(assetsRoot, absoluteCandidate).replaceAll("\\", "/");
    if (!relativeToAssets.startsWith("..") && !relativeToAssets.includes(":/")) {
      return `playcanvas-app/assets/${relativeToAssets}`.replace(/\/+/g, "/");
    }

    return normalizedInput;
  }

  private buildTextureTierPaths(
    assetsRoot: string,
    selectedAssetRoot: string,
    manifest: IntegrationAssetManifest,
  ): WorkLiteAssetManifest["textureTiers"] {
    const root = resolve(assetsRoot, selectedAssetRoot);
    const resolveExistingPath = (relativePath: string | undefined): string | undefined => {
      if (!relativePath) {
        return undefined;
      }
      const absolutePath = resolve(root, relativePath);
      return existsSync(absolutePath) ? absolutePath : undefined;
    };

    return {
      flatBase: resolveExistingPath(manifest.avatar?.flat_texture),
      manifest: resolveExistingPath("manifests/texture_manifest.json"),
      low: resolveExistingPath(manifest.avatar?.texture_tiers?.low),
      medium: resolveExistingPath(manifest.avatar?.texture_tiers?.medium),
      high: resolveExistingPath(manifest.avatar?.texture_tiers?.high),
    };
  }

  private collectAssetRootsRecursive(
    directory: string,
    assetsRoot: string,
    roots: Set<string>,
    depth: number,
  ): void {
    if (!existsSync(directory) || depth > 6) {
      return;
    }

    const integrationManifestPath = resolve(directory, "manifests", "integration_asset_manifest.json");
    if (existsSync(integrationManifestPath) && directory !== assetsRoot) {
      roots.add(directory.slice(assetsRoot.length + 1).replaceAll("\\", "/"));
      return;
    }

    let hasAssetFiles = false;
    for (const child of readdirSync(directory).map((entry) => resolve(directory, entry))) {
      let stats;
      try {
        stats = statSync(child);
      } catch {
        continue;
      }

      if (stats.isDirectory()) {
        this.collectAssetRootsRecursive(child, assetsRoot, roots, depth + 1);
        continue;
      }

      if (stats.isFile() && /\.(glb|gltf|jpg|jpeg|jfif|png|webp)$/i.test(child)) {
        hasAssetFiles = true;
      }
    }

    if (hasAssetFiles && directory !== assetsRoot) {
      roots.add(directory.slice(assetsRoot.length + 1).replaceAll("\\", "/"));
    }
  }

  private safeFileSize(filePath: string): number | undefined {
    try {
      return statSync(filePath).size;
    } catch {
      return undefined;
    }
  }
}

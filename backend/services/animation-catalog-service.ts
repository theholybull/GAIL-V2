import { existsSync, readdirSync } from "node:fs";
import { join, relative, resolve } from "node:path";

export interface AnimationCatalogCategory {
  name: string;
  count: number;
}

export interface AnimationCatalogSummary {
  root: string;
  exists: boolean;
  totalFiles: number;
  categories: AnimationCatalogCategory[];
  samplePaths: string[];
}

const SUPPORTED_EXTENSIONS = new Set([".glb", ".fbx", ".anim", ".gltf"]);

export class AnimationCatalogService {
  private readonly root: string;

  constructor(root = process.env.GAIL_ANIMATION_LIBRARY_ROOT ?? resolve(process.cwd(), "..", "data", "animation_viewer", "animations")) {
    this.root = root;
  }

  getSummary(): AnimationCatalogSummary {
    if (!existsSync(this.root)) {
      return {
        root: this.root,
        exists: false,
        totalFiles: 0,
        categories: [],
        samplePaths: [],
      };
    }

    const categoryCounts = new Map<string, number>();
    const allPaths: string[] = [];

    const walk = (dir: string): void => {
      const entries = readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const absolutePath = join(dir, entry.name);
        if (entry.isDirectory()) {
          walk(absolutePath);
          continue;
        }
        if (!entry.isFile()) {
          continue;
        }
        const dot = entry.name.lastIndexOf(".");
        const extension = dot >= 0 ? entry.name.slice(dot).toLowerCase() : "";
        if (!SUPPORTED_EXTENSIONS.has(extension)) {
          continue;
        }

        const rel = relative(this.root, absolutePath).replaceAll("\\", "/");
        const category = rel.split("/")[0] || "uncategorized";
        categoryCounts.set(category, (categoryCounts.get(category) ?? 0) + 1);
        allPaths.push(rel);
      }
    };

    walk(this.root);

    const categories = Array.from(categoryCounts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

    return {
      root: this.root,
      exists: true,
      totalFiles: allPaths.length,
      categories,
      samplePaths: allPaths.slice(0, 20),
    };
  }
}

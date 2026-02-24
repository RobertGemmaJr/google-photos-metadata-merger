import { promises as fs } from "node:fs";
import type { Dirent, Stats } from "node:fs";
import path from "node:path";
import { createIgnoreMatcher } from "./utils/ignore.ts";
import { fileNameFromPath, makeRelative, normalizeKey, normalizePath } from "./utils/path-utils.ts";
import type { Config, FileEntry } from "./types.ts";

interface QueueEntry {
  directory: string;
}

interface ScanState {
  entries: FileEntry[];
  keyToEntries: Map<string, FileEntry[]>;
  totalFiles: number;
}

function shouldIncludeFile(filePath: string, extensions: string[]) {
  if (extensions.length === 0) return true;

  const ext = path.extname(filePath).toLowerCase();
  return extensions.includes(ext);
}

export async function scanDirectory(root: string, config: Config) {
  const normalizedRoot = normalizePath(root);
  const state: ScanState = {
    entries: [],
    keyToEntries: new Map<string, FileEntry[]>(),
    totalFiles: 0,
  };
  const ignoreMatcher = createIgnoreMatcher(config.ignorePatterns);
  const queue: QueueEntry[] = await buildInitialQueue(normalizedRoot);
  const workerCount = normalizeScanConcurrency(config.scanConcurrency, queue.length);
  let directoriesScanned = 0;

  async function worker() {
    while (true) {
      const current = queue.pop();
      if (!current) return;

      directoriesScanned += 1;
      if (directoriesScanned % 100 === 0) {
        console.log(`Scanning folders... (${directoriesScanned})`);
      }

      let dirents: Dirent[];
      try {
        dirents = await fs.readdir(current.directory, { withFileTypes: true });
      } catch {
        console.error("Error reading directory:", current.directory);
        continue;
      }

      for (const dirent of dirents) {
        const fullPath = path.join(current.directory, dirent.name);
        const relativePath = makeRelative(normalizedRoot, fullPath);

        if (ignoreMatcher(relativePath)) continue;

        if (dirent.isDirectory()) {
          queue.push({ directory: fullPath });
          continue;
        }

        if (dirent.isSymbolicLink() && config.followSymlinks) {
          let stats: Stats;
          try {
            stats = await fs.stat(fullPath);
          } catch {
            continue;
          }
          if (stats.isDirectory()) {
            queue.push({ directory: fullPath });
            continue;
          }
        }

        if (dirent.isSymbolicLink() && !config.followSymlinks) continue;

        if (!dirent.isFile() && !dirent.isSymbolicLink()) continue;

        if (!shouldIncludeFile(fullPath, config.includeExtensions)) continue;

        let stats: Stats;
        try {
          stats = await fs.stat(fullPath);
        } catch {
          continue;
        }

        const name = fileNameFromPath(fullPath);
        const nameKey = normalizeKey(name, config.caseSensitive);
        const pathSegments = relativePath.split("/").filter(Boolean);
        const monthKey =
          pathSegments.length >= 2 ? `${pathSegments[0]}/${pathSegments[1]}` : "unknown";
        const entryKey = `${monthKey}::${nameKey}`;
        const entry: FileEntry = {
          name,
          nameKey,
          monthKey,
          fullPath,
          relativePath,
          size: stats.size,
          mtimeMs: stats.mtimeMs,
        };

        state.entries.push(entry);
        const existing = state.keyToEntries.get(entryKey);
        if (existing) existing.push(entry);
        else state.keyToEntries.set(entryKey, [entry]);
      }
    }
  }

  const workers = Array.from({ length: workerCount }, () => worker());
  await Promise.all(workers);

  state.totalFiles = state.entries.length;
  return {
    entries: state.entries,
    keyToEntries: state.keyToEntries,
    totalFiles: state.totalFiles,
  };
}

async function buildInitialQueue(root: string) {
  let dirents: Dirent[];
  try {
    dirents = await fs.readdir(root, { withFileTypes: true });
  } catch {
    return [{ directory: root }];
  }

  const yearDirs = dirents
    .filter((dirent) => dirent.isDirectory() && /^\d{4}$/.test(dirent.name))
    .map((dirent) => ({ directory: path.join(root, dirent.name) }));

  return yearDirs.length > 0 ? yearDirs : [{ directory: root }];
}

function normalizeScanConcurrency(value: number, available: number) {
  const safeValue = Number.isFinite(value) ? Math.floor(value) : 1;
  const clamped = Math.min(Math.max(safeValue, 1), 16);
  return Math.max(1, Math.min(clamped, available));
}

import { promises as fs } from "node:fs";
import type { Dirent, Stats } from "node:fs";
import path from "node:path";
import { createIgnoreMatcher } from "./utils/ignore.ts";
import { fileNameFromPath, makeRelative, normalizeKey, normalizePath } from "./utils/path-utils.ts";
import type { Config, FileEntry } from "./types.ts";

interface QueueEntry {
  directory: string;
}

function shouldIncludeFile(filePath: string, extensions: string[]) {
  if (extensions.length === 0) {
    return true;
  }
  const ext = path.extname(filePath).toLowerCase();
  return extensions.includes(ext);
}

export async function scanDirectory(root: string, config: Config) {
  const normalizedRoot = normalizePath(root);
  const entries: FileEntry[] = [];
  const keyToEntries = new Map<string, FileEntry[]>();
  const ignoreMatcher = createIgnoreMatcher(config.ignorePatterns);
  const queue: QueueEntry[] = [{ directory: normalizedRoot }];
  let directoriesScanned = 0;

  while (queue.length > 0) {
    const current = queue.pop();
    if (!current) {
      continue;
    }

    directoriesScanned += 1;
    if (directoriesScanned % 200 === 0) {
      console.log(`Scanning folders... (${directoriesScanned})`);
    }

    let dirents: Dirent[];
    try {
      dirents = await fs.readdir(current.directory, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const dirent of dirents) {
      const fullPath = path.join(current.directory, dirent.name);
      const relativePath = makeRelative(normalizedRoot, fullPath);

      if (ignoreMatcher(relativePath)) {
        continue;
      }

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

      if (dirent.isSymbolicLink() && !config.followSymlinks) {
        continue;
      }

      if (!dirent.isFile() && !dirent.isSymbolicLink()) {
        continue;
      }

      if (!shouldIncludeFile(fullPath, config.includeExtensions)) {
        continue;
      }

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

      entries.push(entry);
      const existing = keyToEntries.get(entryKey);
      if (existing) {
        existing.push(entry);
      } else {
        keyToEntries.set(entryKey, [entry]);
      }
    }
  }

  return {
    entries,
    keyToEntries,
    totalFiles: entries.length,
  };
}

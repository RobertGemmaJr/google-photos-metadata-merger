import { mapLimit } from "./utils/concurrency.ts";
import { hashFile } from "./utils/hash.ts";
import type { CompareResult, Config, FileEntry, ScanResult } from "./types.ts";

function buildCountMap(values: string[]) {
  const map = new Map<string, number>();
  for (const value of values) {
    map.set(value, (map.get(value) ?? 0) + 1);
  }
  return map;
}

function countMapsEqual(left: Map<string, number>, right: Map<string, number>) {
  if (left.size !== right.size) {
    return false;
  }
  for (const [key, value] of left) {
    if (right.get(key) !== value) {
      return false;
    }
  }
  return true;
}

function entriesDifferByMeta(icloud: FileEntry[], mobile: FileEntry[]) {
  const normalize = (entry: FileEntry) => `${entry.size}:${Math.round(entry.mtimeMs)}`;
  const left = buildCountMap(icloud.map(normalize));
  const right = buildCountMap(mobile.map(normalize));
  return !countMapsEqual(left, right);
}

async function entriesDifferByHash(icloud: FileEntry[], mobile: FileEntry[], config: Config) {
  const [icloudHashes, mobileHashes] = await Promise.all([
    mapLimit(icloud, config.concurrency, async (entry) =>
      hashFile(entry.fullPath, config.hashAlgorithm)
    ),
    mapLimit(mobile, config.concurrency, async (entry) =>
      hashFile(entry.fullPath, config.hashAlgorithm)
    ),
  ]);

  const left = buildCountMap(icloudHashes);
  const right = buildCountMap(mobileHashes);
  const differs = !countMapsEqual(left, right);

  return { differs, hashCompared: icloudHashes.length + mobileHashes.length };
}

export async function compareScans(icloud: ScanResult, mobile: ScanResult, config: Config) {
  const onlyInIcloud: FileEntry[] = [];
  const onlyInMobile: FileEntry[] = [];
  const sameNameDifferent: CompareResult["sameNameDifferent"] = [];
  let hashCompared = 0;

  const allKeys = new Set<string>();
  for (const key of icloud.keyToEntries.keys()) {
    allKeys.add(key);
  }
  for (const key of mobile.keyToEntries.keys()) {
    allKeys.add(key);
  }

  const keyList = Array.from(allKeys);

  await mapLimit(keyList, config.concurrency, async (entryKey) => {
    const icloudEntries = icloud.keyToEntries.get(entryKey) ?? [];
    const mobileEntries = mobile.keyToEntries.get(entryKey) ?? [];

    if (icloudEntries.length === 0 && mobileEntries.length > 0) {
      onlyInMobile.push(...mobileEntries);
      return;
    }

    if (mobileEntries.length === 0 && icloudEntries.length > 0) {
      onlyInIcloud.push(...icloudEntries);
      return;
    }

    if (config.comparisonMode === "filename") {
      return;
    }

    if (config.comparisonMode === "filename+meta") {
      if (entriesDifferByMeta(icloudEntries, mobileEntries)) {
        sameNameDifferent.push({
          name: icloudEntries[0]?.name ?? entryKey,
          icloud: icloudEntries,
          mobile: mobileEntries,
          reason: "size-or-mtime",
        });
      }
      return;
    }

    const hashResult = await entriesDifferByHash(icloudEntries, mobileEntries, config);
    hashCompared += hashResult.hashCompared;
    if (hashResult.differs) {
      sameNameDifferent.push({
        name: icloudEntries[0]?.name ?? entryKey,
        icloud: icloudEntries,
        mobile: mobileEntries,
        reason: "hash",
      });
    }
  });

  console.log(`Compared keys: ${keyList.length}`);

  return {
    onlyInIcloud,
    onlyInMobile,
    sameNameDifferent,
    hashCompared,
  };
}

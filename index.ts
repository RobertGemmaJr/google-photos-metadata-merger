import path from "node:path";
import { compareScans } from "./src/compare.ts";
import { writeReports } from "./src/report.ts";
import { scanDirectory } from "./src/scan.ts";
import type { Config, ReportSummary } from "./src/types.ts";

const ICLOUD_ROOT = "/mnt/h/Photos/Archive";
const MOBILE_ROOT = "/mnt/h/Photos/MobileBackup/iPhone";

const config: Config = {
  icloudRoot: ICLOUD_ROOT,
  mobileRoot: MOBILE_ROOT,
  outputDir: "reports",
  ignorePatterns: ["**/.DS_Store", "**/Thumbs.db", "**/@eaDir/**"],
  includeExtensions: [],
  caseSensitive: false,
  followSymlinks: false,
  comparisonMode: "filename+meta",
  hashAlgorithm: "sha256",
  concurrency: 8,
};

function resolveOutputDir(baseDir: string) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  return path.join(baseDir, `comparison-report-${timestamp}`);
}

const outputDir = resolveOutputDir(config.outputDir);
const start = Date.now();

const icloudScan = await scanDirectory(config.icloudRoot, config);
const mobileScan = await scanDirectory(config.mobileRoot, config);
const compareResult = await compareScans(icloudScan, mobileScan, config);

const summary: ReportSummary = {
  startedAt: new Date(start).toISOString(),
  finishedAt: new Date().toISOString(),
  durationMs: Date.now() - start,
  icloudRoot: config.icloudRoot,
  mobileRoot: config.mobileRoot,
  outputDir,
  comparisonMode: config.comparisonMode,
  caseSensitive: config.caseSensitive,
  followSymlinks: config.followSymlinks,
  ignorePatterns: config.ignorePatterns,
  includeExtensions: config.includeExtensions,
  totalIcloud: icloudScan.totalFiles,
  totalMobile: mobileScan.totalFiles,
  uniqueNamesIcloud: icloudScan.nameToEntries.size,
  uniqueNamesMobile: mobileScan.nameToEntries.size,
  onlyInIcloud: compareResult.onlyInIcloud.length,
  onlyInMobile: compareResult.onlyInMobile.length,
  sameNameDifferent: compareResult.sameNameDifferent.length,
  hashCompared: compareResult.hashCompared,
};

await writeReports(outputDir, compareResult, summary);

console.log("Report complete.");
console.log(`Output: ${outputDir}`);

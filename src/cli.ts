import path from "node:path";
import { buildConfig, resolveOutputDir } from "./config.ts";
import { compareScans } from "./compare.ts";
import { writeReports } from "./report.ts";
import { scanDirectory } from "./scan.ts";
import { appendLog, writeLogHeader } from "./logger.ts";
import type { ComparisonMode, ReportSummary } from "./types.ts";

interface ParsedArgs {
  icloudRoot?: string;
  mobileRoot?: string;
  outputDir?: string;
  ignore?: string[];
  includeExt?: string[];
  caseSensitive?: boolean;
  followSymlinks?: boolean;
  comparisonMode?: ComparisonMode;
  concurrency?: number;
}

const HELP_TEXT = `Archive Diff (Bun)

Usage:
  bun run index.ts --icloud <path> --mobile <path> [options]

Options:
  --output <path>           Output base folder (default: reports)
  --mode <mode>             filename | filename+meta | filename+hash
  --ignore <patterns>       Comma-separated glob patterns to ignore
  --include-ext <exts>      Comma-separated extensions to include (ex: .jpg,.png)
  --case-sensitive          Match filenames with case sensitivity
  --follow-symlinks         Follow symlinks while scanning
  --concurrency <n>         Number of concurrent comparisons
  --help                    Show this help

Environment fallbacks:
  ICLOUD_ARCHIVE, MOBILE_ARCHIVE, OUTPUT_DIR, IGNORE_PATTERNS,
  INCLUDE_EXT, CASE_SENSITIVE, FOLLOW_SYMLINKS, COMPARISON_MODE, CONCURRENCY
`;

function parseArgs(argv: string[]): ParsedArgs {
  const parsed: ParsedArgs = {};

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg) {
      continue;
    }

    if (arg === "--") {
      continue;
    }

    switch (arg) {
      case "--icloud":
        parsed.icloudRoot = argv[index + 1];
        index += 1;
        break;
      case "--mobile":
        parsed.mobileRoot = argv[index + 1];
        index += 1;
        break;
      case "--output":
        parsed.outputDir = argv[index + 1];
        index += 1;
        break;
      case "--mode":
        parsed.comparisonMode = argv[index + 1] as ComparisonMode | undefined;
        index += 1;
        break;
      case "--ignore":
        parsed.ignore = (argv[index + 1] ?? "")
          .split(",")
          .map((item) => item.trim())
          .filter((item) => item.length > 0);
        index += 1;
        break;
      case "--include-ext":
        parsed.includeExt = (argv[index + 1] ?? "")
          .split(",")
          .map((item) => item.trim())
          .filter((item) => item.length > 0);
        index += 1;
        break;
      case "--case-sensitive":
        parsed.caseSensitive = true;
        break;
      case "--follow-symlinks":
        parsed.followSymlinks = true;
        break;
      case "--concurrency":
        parsed.concurrency = Number(argv[index + 1]);
        index += 1;
        break;
      case "--help":
      case "-h":
        console.log(HELP_TEXT);
        process.exit(0);
    }
  }

  return parsed;
}

function validateMode(mode: ComparisonMode): void {
  const allowed: ComparisonMode[] = ["filename", "filename+meta", "filename+hash"];
  if (!allowed.includes(mode)) {
    throw new Error(`Invalid mode: ${mode}. Use filename | filename+meta | filename+hash.`);
  }
}

export async function run(argv: string[]): Promise<void> {
  if (argv.includes("--help") || argv.includes("-h")) {
    console.log(HELP_TEXT);
    return;
  }
  const parsed = parseArgs(argv);
  const config = buildConfig(parsed);
  validateMode(config.comparisonMode);

  const outputDir = resolveOutputDir(config.outputDir);
  const logPath = path.join(outputDir, "run.log");

  const start = Date.now();
  await writeLogHeader(logPath, [
    "Archive diff run",
    `Icloud: ${config.icloudRoot}`,
    `Mobile: ${config.mobileRoot}`,
    `Output: ${outputDir}`,
    `Mode: ${config.comparisonMode}`,
  ]);

  await appendLog(logPath, "Scanning iCloud archive...");
  const icloudScan = await scanDirectory(config.icloudRoot, config);
  await appendLog(logPath, `iCloud scan complete (${icloudScan.totalFiles} files).`);

  await appendLog(logPath, "Scanning mobile archive...");
  const mobileScan = await scanDirectory(config.mobileRoot, config);
  await appendLog(logPath, `Mobile scan complete (${mobileScan.totalFiles} files).`);

  await appendLog(logPath, "Comparing entries...");
  const compareResult = await compareScans(icloudScan, mobileScan, config);
  await appendLog(logPath, "Comparison complete.");

  const finishedAt = new Date().toISOString();
  const summary: ReportSummary = {
    startedAt: new Date(start).toISOString(),
    finishedAt,
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
  await appendLog(logPath, "Reports written.");

  console.log("Report complete.");
  console.log(`Output: ${outputDir}`);
}

import path from "node:path";
import type { ComparisonMode } from "./types.ts";
import { normalizePath } from "./utils/path-utils.ts";

const DEFAULT_IGNORE = ["**/.DS_Store", "**/Thumbs.db", "**/@eaDir/**", "**/2026/**"];

function parseList(value: string | undefined) {
  if (!value) {
    return [];
  }
  return value
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function normalizeExtensions(values: string[]) {
  return values.map((value) =>
    value.startsWith(".") ? value.toLowerCase() : `.${value.toLowerCase()}`
  );
}

export function buildConfig(args: {
  icloudRoot?: string;
  mobileRoot?: string;
  outputDir?: string;
  ignore?: string[];
  includeExt?: string[];
  caseSensitive?: boolean;
  followSymlinks?: boolean;
  comparisonMode?: ComparisonMode;
  hashAlgorithm?: "sha256";
  concurrency?: number;
}) {
  const icloudRoot = args.icloudRoot ?? process.env.ICLOUD_ARCHIVE ?? "";
  const mobileRoot = args.mobileRoot ?? process.env.MOBILE_ARCHIVE ?? "";
  const outputDir = args.outputDir ?? process.env.OUTPUT_DIR ?? "reports";

  const ignorePatterns = (args.ignore ?? parseList(process.env.IGNORE_PATTERNS)).concat(
    DEFAULT_IGNORE
  );
  const includeExtensions = normalizeExtensions(
    args.includeExt ?? parseList(process.env.INCLUDE_EXT)
  );
  const caseSensitive = args.caseSensitive ?? process.env.CASE_SENSITIVE === "true";
  const followSymlinks = args.followSymlinks ?? process.env.FOLLOW_SYMLINKS === "true";
  const comparisonMode =
    args.comparisonMode ??
    (process.env.COMPARISON_MODE as ComparisonMode | undefined) ??
    "filename+meta";
  const hashAlgorithm = args.hashAlgorithm ?? "sha256";
  const concurrency = args.concurrency ?? Number(process.env.CONCURRENCY ?? 8);

  if (!icloudRoot || !mobileRoot) {
    throw new Error("Both iCloud and mobile archive roots are required.");
  }

  const safeOutputDir = normalizePath(outputDir);

  return {
    icloudRoot: normalizePath(icloudRoot),
    mobileRoot: normalizePath(mobileRoot),
    outputDir: safeOutputDir,
    ignorePatterns,
    includeExtensions,
    caseSensitive,
    followSymlinks,
    comparisonMode,
    hashAlgorithm,
    concurrency: Number.isFinite(concurrency) && concurrency > 0 ? Math.floor(concurrency) : 8,
  };
}

export function resolveOutputDir(baseDir: string) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  return path.join(baseDir, timestamp);
}

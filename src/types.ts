export type ComparisonMode = "filename" | "filename+meta" | "filename+hash";

export interface Config {
  icloudRoot: string;
  mobileRoot: string;
  outputDir: string;
  ignorePatterns: string[];
  includeExtensions: string[];
  caseSensitive: boolean;
  followSymlinks: boolean;
  comparisonMode: ComparisonMode;
  hashAlgorithm: "sha256";
  concurrency: number;
}

export interface FileEntry {
  name: string;
  nameKey: string;
  monthKey: string;
  fullPath: string;
  relativePath: string;
  size: number;
  mtimeMs: number;
}

export interface ReportSummary {
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  icloudRoot: string;
  mobileRoot: string;
  outputDir: string;
  comparisonMode: ComparisonMode;
  caseSensitive: boolean;
  followSymlinks: boolean;
  ignorePatterns: string[];
  includeExtensions: string[];
  totalIcloud: number;
  totalMobile: number;
  uniqueNamesIcloud: number;
  uniqueNamesMobile: number;
  onlyInIcloud: number;
  onlyInMobile: number;
  sameNameDifferent: number;
  hashCompared: number;
}

export interface ScanResult {
  entries: FileEntry[];
  keyToEntries: Map<string, FileEntry[]>;
  totalFiles: number;
}

export interface CompareResult {
  onlyInIcloud: FileEntry[];
  onlyInMobile: FileEntry[];
  sameNameDifferent: Array<{
    name: string;
    icloud: FileEntry[];
    mobile: FileEntry[];
    reason: string;
  }>;
  hashCompared: number;
}

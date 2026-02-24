import { promises as fs } from "node:fs";
import path from "node:path";
import { toPosix } from "./utils/path-utils.ts";
import type { CompareResult, FileEntry, ReportSummary } from "./types.ts";

function formatDate(value: number) {
  return new Date(value).toISOString();
}

function csvEscape(value: string | number) {
  const raw = String(value);
  if (raw.includes(",") || raw.includes("\n") || raw.includes("\r") || raw.includes('"')) {
    return `"${raw.replace(/"/g, '""')}"`;
  }
  return raw;
}

function formatEntryRow(entry: FileEntry, archive: string) {
  return [
    csvEscape(entry.name),
    csvEscape(toPosix(entry.fullPath)),
    csvEscape(toPosix(entry.relativePath)),
    csvEscape(entry.size),
    csvEscape(formatDate(entry.mtimeMs)),
    csvEscape(archive),
  ].join(",");
}

function formatDifferentRow(name: string, archive: string, entry: FileEntry, reason: string) {
  return [
    csvEscape(name),
    csvEscape(archive),
    csvEscape(toPosix(entry.fullPath)),
    csvEscape(entry.size),
    csvEscape(formatDate(entry.mtimeMs)),
    csvEscape(reason),
  ].join(",");
}

export async function writeReports(
  outputDir: string,
  compare: CompareResult,
  summary: ReportSummary
) {
  await fs.mkdir(outputDir, { recursive: true });

  const onlyInIcloudPath = path.join(outputDir, "only-in-icloud.csv");
  const onlyInMobilePath = path.join(outputDir, "only-in-mobile.csv");
  const differentPath = path.join(outputDir, "same-name-different.csv");
  const summaryPath = path.join(outputDir, "summary.log");

  const onlyInHeader = "filename,full_path,relative_path,size_bytes,mtime_iso,archive\n";
  const differentHeader = "filename,archive,full_path,size_bytes,mtime_iso,reason\n";

  const onlyInIcloudBody = compare.onlyInIcloud
    .map((entry) => formatEntryRow(entry, "icloud"))
    .join("\n");
  const onlyInMobileBody = compare.onlyInMobile
    .map((entry) => formatEntryRow(entry, "mobile"))
    .join("\n");

  const differentRows: string[] = [];
  for (const entry of compare.sameNameDifferent) {
    for (const item of entry.icloud) {
      differentRows.push(formatDifferentRow(entry.name, "icloud", item, entry.reason));
    }
    for (const item of entry.mobile) {
      differentRows.push(formatDifferentRow(entry.name, "mobile", item, entry.reason));
    }
  }

  const differentBody = differentRows.join("\n");

  await Promise.all([
    fs.writeFile(
      onlyInIcloudPath,
      onlyInHeader + (onlyInIcloudBody ? `${onlyInIcloudBody}\n` : "")
    ),
    fs.writeFile(
      onlyInMobilePath,
      onlyInHeader + (onlyInMobileBody ? `${onlyInMobileBody}\n` : "")
    ),
    fs.writeFile(differentPath, differentHeader + (differentBody ? `${differentBody}\n` : "")),
  ]);

  const summaryLines = [
    `Started: ${summary.startedAt}`,
    `Finished: ${summary.finishedAt}`,
    `DurationMs: ${summary.durationMs}`,
    `IcloudRoot: ${summary.icloudRoot}`,
    `MobileRoot: ${summary.mobileRoot}`,
    `OutputDir: ${summary.outputDir}`,
    `ComparisonMode: ${summary.comparisonMode}`,
    `CaseSensitive: ${summary.caseSensitive}`,
    `FollowSymlinks: ${summary.followSymlinks}`,
    `IgnorePatterns: ${summary.ignorePatterns.join(";")}`,
    `IncludeExtensions: ${summary.includeExtensions.join(";")}`,
    `TotalIcloud: ${summary.totalIcloud}`,
    `TotalMobile: ${summary.totalMobile}`,
    `UniqueNamesIcloud: ${summary.uniqueNamesIcloud}`,
    `UniqueNamesMobile: ${summary.uniqueNamesMobile}`,
    `OnlyInIcloud: ${summary.onlyInIcloud}`,
    `OnlyInMobile: ${summary.onlyInMobile}`,
    `SameNameDifferent: ${summary.sameNameDifferent}`,
    `HashCompared: ${summary.hashCompared}`,
  ];

  await fs.writeFile(summaryPath, summaryLines.join("\n") + "\n");
}

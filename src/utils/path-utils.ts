import path from "node:path";

export function normalizePath(inputPath: string): string {
  return path.resolve(inputPath);
}

export function toPosix(inputPath: string): string {
  return inputPath.split(path.sep).join("/");
}

export function makeRelative(rootPath: string, fullPath: string): string {
  return toPosix(path.relative(rootPath, fullPath));
}

export function fileNameFromPath(filePath: string): string {
  return path.basename(filePath);
}

export function normalizeKey(name: string, caseSensitive: boolean): string {
  return caseSensitive ? name : name.toLowerCase();
}

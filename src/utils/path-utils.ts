import path from "node:path";

export function normalizePath(inputPath: string) {
  return path.resolve(inputPath);
}

export function toPosix(inputPath: string) {
  return inputPath.split(path.sep).join("/");
}

export function makeRelative(rootPath: string, fullPath: string) {
  return toPosix(path.relative(rootPath, fullPath));
}

export function fileNameFromPath(filePath: string) {
  return path.basename(filePath);
}

export function normalizeKey(name: string, caseSensitive: boolean) {
  return caseSensitive ? name : name.toLowerCase();
}

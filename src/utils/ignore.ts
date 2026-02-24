import path from "node:path";

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function patternToRegex(pattern: string) {
  const normalized = pattern.replace(/\\/g, "/");
  const parts = normalized.split("**");
  const escaped = parts.map((part) => escapeRegex(part).replace(/\\\*/g, "[^/]*"));
  const joined = escaped.join(".*");
  return new RegExp(`^${joined}$`);
}

export function createIgnoreMatcher(patterns: string[]) {
  if (patterns.length === 0) {
    return () => false;
  }

  const regexes = patterns.map(patternToRegex);

  return (relativePath: string) => {
    const normalized = relativePath.split(path.sep).join("/");
    return regexes.some((regex) => regex.test(normalized));
  };
}

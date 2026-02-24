import { promises as fs } from "node:fs";
import path from "node:path";

export async function appendLog(logPath: string, message: string) {
  const line = `[${new Date().toISOString()}] ${message}\n`;
  await fs.mkdir(path.dirname(logPath), { recursive: true });
  await fs.appendFile(logPath, line);
}

export async function writeLogHeader(logPath: string, lines: string[]) {
  await fs.mkdir(path.dirname(logPath), { recursive: true });
  const content = lines.map((line) => `# ${line}`).join("\n") + "\n";
  await fs.writeFile(logPath, content);
}

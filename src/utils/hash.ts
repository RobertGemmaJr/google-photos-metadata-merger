import { createReadStream } from "node:fs";
import { createHash } from "node:crypto";

export async function hashFile(filePath: string, algorithm: "sha256") {
  const hash = createHash(algorithm);

  return new Promise<string>((resolve, reject) => {
    const stream = createReadStream(filePath);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("error", (error) => reject(error));
    stream.on("end", () => resolve(hash.digest("hex")));
  });
}

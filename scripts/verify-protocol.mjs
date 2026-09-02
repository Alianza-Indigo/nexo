import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

const expected = "68a65458a36345a6222ee151de51306697f0d8227e6bd1cfe2ef29fff8804e03";
const data = await readFile(new URL("../src/content/protocols/nexo-v2.0.txt", import.meta.url));
const actual = createHash("sha256").update(data).digest("hex");
if (actual !== expected) {
  console.error(`Protocol integrity failure. Expected ${expected}; received ${actual}.`);
  process.exit(1);
}
console.log(`Protocol verified: ${actual}`);

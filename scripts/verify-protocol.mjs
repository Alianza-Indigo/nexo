import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

const expected = "c14494d81d0c2818e38e37522bbea68a583f9247aa82d0a4595ce8005b241a9a";
const data = await readFile(new URL("../src/content/protocols/nexo-v2.0.txt", import.meta.url));
const actual = createHash("sha256").update(data).digest("hex");
if (actual !== expected) {
  console.error(`Protocol integrity failure. Expected ${expected}; received ${actual}.`);
  process.exit(1);
}
console.log(`Protocol verified: ${actual}`);

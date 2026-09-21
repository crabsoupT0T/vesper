import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const nested = join(root, "apk-www/apk/index.html");
const dest = join(root, "apk-www/index.html");
const html = readFileSync(nested, "utf8").replaceAll("../assets/", "./assets/");
mkdirSync(join(root, "apk-www"), { recursive: true });
writeFileSync(dest, html);
rmSync(join(root, "apk-www/apk"), { recursive: true, force: true });
rmSync(join(root, "apk-www/vesper.zip"), { force: true });
rmSync(join(root, "apk-www/vesper.apk"), { force: true });
console.log("[apk] flattened", dest);

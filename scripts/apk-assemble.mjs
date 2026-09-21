import { copyFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const androidHome = process.env.ANDROID_HOME || "/opt/android-sdk";
const javaHome = process.env.JAVA_HOME || "/usr/lib/jvm/java-17-openjdk-amd64";

function run(cmd, args, cwd) {
  const result = spawnSync(cmd, args, {
    cwd,
    stdio: "inherit",
    env: {
      ...process.env,
      ANDROID_HOME: androidHome,
      ANDROID_SDK_ROOT: androidHome,
      JAVA_HOME: javaHome,
    },
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

if (!existsSync(join(root, "android"))) {
  console.error("[apk] android/ missing — run npx cap add android first");
  process.exit(1);
}

writeFileSync(join(root, "android/local.properties"), `sdk.dir=${androidHome}\n`);
run("./gradlew", ["assembleDebug", "--no-daemon"], join(root, "android"));

const built = join(root, "android/app/build/outputs/apk/debug/app-debug.apk");
if (!existsSync(built)) {
  console.error("[apk] debug apk not found");
  process.exit(1);
}

mkdirSync(join(root, "artifacts"), { recursive: true });
copyFileSync(built, join(root, "artifacts/vesper.apk"));
copyFileSync(built, join(root, "public/vesper.apk"));
console.log("[apk] wrote artifacts/vesper.apk");
